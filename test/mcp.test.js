// End-to-end check of the undying-archive MCP server over stdio (S1, S5).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, readFileSync, existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { drift } from '../scripts/sync-crew.mjs';

const python = ['python', 'python3'].find((p) => spawnSync(p, ['--version']).status === 0);

test('S5.1 the app ships an exact copy of the web core', () => {
  assert.deepEqual(drift(), []);
});

function rpc(dir) {
  const proc = spawn(python, [join('crew-scribes', 'mcp', 'server.py')], { stdio: ['pipe', 'pipe', 'inherit'] });
  let buf = '';
  const waiting = new Map();
  proc.stdout.setEncoding('utf8');
  proc.stdout.on('data', (c) => {
    buf += c;
    let i;
    while ((i = buf.indexOf('\n')) >= 0) {
      const msg = JSON.parse(buf.slice(0, i));
      buf = buf.slice(i + 1);
      waiting.get(msg.id)?.(msg);
    }
  });
  let id = 0;
  const call = (method, params) => new Promise((res) => {
    id += 1;
    waiting.set(id, res);
    proc.stdin.write(JSON.stringify({ jsonrpc: '2.0', id, method, params }) + '\n');
  });
  const tool = async (name, args) => {
    const r = await call('tools/call', { name, arguments: args });
    return { isError: r.result.isError, data: JSON.parse(r.result.content[0].text) };
  };
  return { call, tool, close: () => proc.stdin.end() };
}

test('S1/S3 MCP server: lists tools, reads text only, validates and appends suggestions', { skip: !python && 'python not found' }, async () => {
  const dir = mkdtempSync(join(tmpdir(), 'ut-mcp-'));
  const archive = join(dir, 'family.undying.json');
  writeFileSync(archive, JSON.stringify({
    format: 'undying-tongues-archive', version: 1, exportedAt: '2026-11-24T00:00:00Z', language: 'quz', family: [],
    stories: [{ id: 's1', title: 'Atuqmanta', elder: 'Mamá Rosa', duration: 10, marks: [5],
      texts: [{ qu: 'atuq urqupi', meaning: '' }, { qu: 'inti', meaning: 'sun' }],
      audio: { mime: 'audio/webm', base64: 'AAAA' } }],
  }));
  const s = rpc(dir);
  try {
    const init = await s.call('initialize', { protocolVersion: '2024-11-05' });
    assert.equal(init.result.serverInfo.name, 'undying-archive');
    const list = await s.call('tools/list', {});
    assert.deepEqual(list.result.tools.map((t) => t.name).sort(),
      ['archive_summary', 'list_segments', 'list_suggestions', 'lookup_word', 'propose', 'suffix_table']);

    const sum = await s.tool('archive_summary', { archive });
    assert.equal(sum.data.stories[0].missingMeaning, 1);

    const segs = await s.tool('list_segments', { archive, story_id: 's1' });
    assert.ok(!JSON.stringify(segs.data).includes('AAAA'), 'audio must never be returned');
    const urqupi = segs.data.segments[0].tokens.find((t) => t.token === 'urqupi');
    assert.equal(urqupi.status, 'analysable');
    assert.equal(urqupi.analysis, 'urqu + -pi');

    const meta = { agent: 'scribe-glossator', rationale: 'urqu is mountain, -pi is in/on', confidence: 'medium' };
    const ok = await s.tool('propose', { archive, suggestion: { ...meta, storyId: 's1', segment: 0, field: 'meaning', value: 'el zorro en el cerro' } });
    assert.equal(ok.data.accepted, true);
    const dup = await s.tool('propose', { archive, suggestion: { ...meta, storyId: 's1', segment: 0, field: 'meaning', value: 'el zorro en el cerro' } });
    assert.deepEqual(dup.data.errors, ['duplicate suggestion']);
    const over = await s.tool('propose', { archive, suggestion: { ...meta, storyId: 's1', segment: 1, field: 'meaning', value: 'el sol' } });
    assert.equal(over.data.accepted, false);

    const bad = await s.tool('archive_summary', { archive: join(dir, 'notes.txt') });
    assert.equal(bad.isError, true);

    const saved = JSON.parse(readFileSync(join(dir, 'family.suggestions.json'), 'utf8'));
    assert.equal(saved.suggestions.length, 1);
    assert.equal(JSON.parse(readFileSync(archive, 'utf8')).stories[0].texts[0].meaning, '', 'archive is never modified');
  } finally {
    s.close();
    if (existsSync(dir)) rmSync(dir, { recursive: true, force: true });
  }
});
