"""Undying Archive MCP server (stdio, Python standard library only).

A thin JSON-RPC wrapper: every tool call is run by cli.mjs (Node), which reuses the
same pure core as the web app, so the rules the agents must follow are the rules the
property tests check. The server reads a family archive and writes only its sibling
*.suggestions.json. It never returns audio.
"""
import json
import os
import shutil
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
CLI = os.path.join(HERE, "cli.mjs")
PROTOCOL = "2024-11-05"

ARCHIVE = {"type": "string", "description": "Absolute path to a *.undying.json file exported from the app"}

SUGGESTION = {
    "type": "object",
    "properties": {
        "storyId": {"type": "string"},
        "segment": {"type": "integer", "minimum": 0},
        "field": {"type": "string", "enum": ["meaning", "alt", "morph"]},
        "token": {"type": "string", "description": "Required for alt and morph: the word inside the segment"},
        "value": {"type": "string", "maxLength": 300,
                  "description": "meaning: a translation in the family's language; alt: one variant spelling; morph: 'root + -suffix'"},
        "rationale": {"type": "string", "description": "Why you propose this, citing the story context or the suffix table"},
        "confidence": {"type": "string", "enum": ["low", "medium", "high"]},
        "agent": {"type": "string", "description": "Your agent name"},
    },
    "required": ["storyId", "segment", "field", "value", "rationale", "confidence", "agent"],
}

TOOLS = [
    {"name": "archive_summary",
     "description": "List the stories in a family archive with how many segments are transcribed and how many still lack a meaning. Read-only.",
     "inputSchema": {"type": "object", "properties": {"archive": ARCHIVE}, "required": ["archive"]}},
    {"name": "list_segments",
     "description": "Text of every segment of one story (no audio): the family's transcript, meaning, and each token tagged known, analysable (known root + suffixes) or unknown. Read-only.",
     "inputSchema": {"type": "object", "properties": {"archive": ARCHIVE, "story_id": {"type": "string"}}, "required": ["archive", "story_id"]}},
    {"name": "lookup_word",
     "description": "Check one word against the family's known vocabulary and split it into a known root plus suffixes when possible. Read-only.",
     "inputSchema": {"type": "object", "properties": {"archive": ARCHIVE, "word": {"type": "string"}}, "required": ["archive", "word"]}},
    {"name": "suffix_table",
     "description": "The Southern Quechua suffixes the app recognises, with English and Spanish glosses. Read-only.",
     "inputSchema": {"type": "object", "properties": {}}},
    {"name": "propose",
     "description": "Record ONE suggestion for the family to review. It is validated (no overwriting family text, apostrophes kept, morph must rebuild the word) and appended to <archive>.suggestions.json. Nothing in the archive changes.",
     "inputSchema": {"type": "object", "properties": {"archive": ARCHIVE, "suggestion": SUGGESTION}, "required": ["archive", "suggestion"]}},
    {"name": "list_suggestions",
     "description": "Suggestions already recorded for this archive, to avoid repeating work. Read-only.",
     "inputSchema": {"type": "object", "properties": {"archive": ARCHIVE}, "required": ["archive"]}},
]
NAMES = {t["name"] for t in TOOLS}


def run_tool(name, args):
    node = shutil.which("node")
    if not node:
        return {"ok": False, "error": "Node.js 18+ is required on PATH"}
    proc = subprocess.run([node, CLI], input=json.dumps({"tool": name, "args": args}),
                          capture_output=True, text=True, encoding="utf-8", timeout=60, cwd=HERE)
    try:
        return json.loads(proc.stdout)
    except json.JSONDecodeError:
        return {"ok": False, "error": (proc.stderr or "tool produced no output").strip()[:2000]}


def handle(msg):
    method, mid = msg.get("method"), msg.get("id")
    if mid is None:
        return None  # notification
    if method == "initialize":
        result = {"protocolVersion": msg.get("params", {}).get("protocolVersion", PROTOCOL),
                  "capabilities": {"tools": {}},
                  "serverInfo": {"name": "undying-archive", "version": "0.1.0"}}
    elif method == "ping":
        result = {}
    elif method == "tools/list":
        result = {"tools": TOOLS}
    elif method == "tools/call":
        params = msg.get("params", {})
        name = params.get("name")
        if name not in NAMES:
            return {"jsonrpc": "2.0", "id": mid, "error": {"code": -32602, "message": f"unknown tool {name}"}}
        out = run_tool(name, params.get("arguments") or {})
        text = json.dumps(out.get("result") if out.get("ok") else {"error": out.get("error")}, ensure_ascii=False, indent=1)
        result = {"content": [{"type": "text", "text": text}], "isError": not out.get("ok")}
    else:
        return {"jsonrpc": "2.0", "id": mid, "error": {"code": -32601, "message": f"method not found: {method}"}}
    return {"jsonrpc": "2.0", "id": mid, "result": result}


def main():
    for line in sys.stdin:
        line = line.strip()
        if not line:
            continue
        try:
            reply = handle(json.loads(line))
        except Exception as exc:  # keep the server alive on a bad message
            reply = {"jsonrpc": "2.0", "id": None, "error": {"code": -32700, "message": str(exc)}}
        if reply is not None:
            sys.stdout.write(json.dumps(reply, ensure_ascii=False) + "\n")
            sys.stdout.flush()


if __name__ == "__main__":
    main()
