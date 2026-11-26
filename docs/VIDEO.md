# Demo video script · Guion del video (target 2:45, hard limit 3:00)

Narration in Spanish, burned-in English subtitles (the `EN` line). Judges must understand it with
the sound off, so every scene also works from the subtitle and the screen alone.

Words per scene are counted for ~140 words/min in Spanish. If a take runs long, cut the lines
marked *(optional)* first.

---

## 1 · Hook (0:00 – 0:15) · Problem

**Screen:** black. One candle lights up (the app's flame, full screen). Then fade into a short
clip of an elder's hands, or a photo with consent. No faces needed.

**ES:** "Cada dos semanas muere una lengua en el mundo. No muere cuando desaparece del diccionario.
Muere cuando el último abuelo deja de hablarla con sus nietos."

**EN:** *Every two weeks a language dies. Not when it leaves the dictionary, but when the last
grandparent stops speaking it to their grandchildren.*

## 2 · Who and why (0:15 – 0:35)

**Screen:** map of Peru with "Runasimi (Quechua): ~8 million speakers" text, then the app title
"Undying Tongues · Lenguas que no mueren".

**ES:** "En Perú, millones hablan quechua, pero muchos niños en la ciudad ya solo lo entienden. Las
apps de idiomas no traen la voz de su abuela ni la forma en que su familia habla. Por eso hice
Lenguas que no mueren."

**EN:** *Millions in Peru speak Quechua, but many city kids only understand it now. Language apps
don't have their grandmother's voice or their family's way of speaking. So I built Undying Tongues.*

## 3 · The elder records a story (0:35 – 1:00) · Story harvest

**Screen (phone, real recording):** Story harvest → title "Atuqmanta" → ● Record a story → the
elder speaks 15–20 s → Stop. Then play it and press ✂ Cut here twice.

**ES:** "El abuelo no tiene que hacer un examen de palabras sueltas. Solo cuenta una historia. La
familia la escucha y la corta en frases."

**EN:** *The elder doesn't take a vocabulary test. They just tell a story. The family listens and
cuts it into phrases.*

## 4 · The family transcribes; the app does the rest (1:00 – 1:20)

**Screen:** type `atuq urqupi` and "el zorro en el cerro". Zoom on the word card
`urqupi · urqu + -pi (in, at, on)`. Press 🕯️ Add to altar.

**ES:** "La familia escribe lo que oyó. El quechua pega sufijos a las palabras, y la app ya sabe
partirlas cuando conoce la raíz: urqu, cerro, más pi, en."

**EN:** *The family writes what they heard. Quechua glues suffixes onto words, and the app splits
them when it knows the root: urqu, mountain, plus -pi, on.*

## 5 · Crew Scribes (1:20 – 1:55) · Kiro Crew app + MCP

**Screen:** Export family archive → Kiro Crew chat: "Run the Crew Scribes on …atuqmanta-demo.undying.json,
translate to Spanish." Show the three agents starting in parallel (the task cards), then the result
summary. Back in the app: Import suggestions → the inbox with green / orange / red borders.

**ES:** "Para lo demás está Crew Scribes, una app de Kiro Crew: tres agentes en paralelo. Uno
traduce, otro explica cómo se forman las palabras y otro acepta las grafías de cada región. Leen
solo el texto, nunca la voz del abuelo. Y no pueden tocar lo que escribió la familia."

**EN:** *For the rest there's Crew Scribes, a Kiro Crew app: three agents in parallel. One
translates, one explains how words are built, one accepts each region's spelling. They read text
only, never the elder's voice, and they can't change what the family wrote.*

**Screen (2 s):** the MCP refusal: `"the family already wrote a meaning for this segment"`.

## 6 · The child keeps the candles lit (1:55 – 2:20) · Altar + practice

**Screen:** Keep it alive → the prompt "el zorro en el cerro" → ▶ plays the grandmother's clip →
the child types `atuq urqupi` → Correct! → Good. Cut to the Altar: candles lit, a few flickering,
one ghost; the vitality ring rises.

**ES:** "El nieto practica con la voz de su abuela. Cada palabra es una vela: si la recuerda, arde.
Si la olvida, se apaga hasta volverse un fantasma. El altar muestra qué tan viva está la lengua
en casa."

**EN:** *The grandchild practises with their grandmother's voice. Each word is a candle: remembered,
it burns; forgotten, it fades into a ghost. The altar shows how alive the language is at home.*

## 7 · How Kiro built it (2:20 – 2:40) · Technological Implementation

**Screen:** fast cuts: `.kiro/specs/` (3 specs), a requirement `S3.2` next to its test name,
terminal `ℹ tests 38 · pass 38`, a hook file, `language-ethics.md` with the ejective-apostrophe rule.

**ES:** "Lo construí con Kiro: specs donde cada requisito es una prueba de propiedades, hooks que
las corren solos, y un steering de ética lingüística que le enseñó a la IA que p'unchay no es
punchay."

**EN:** *Built with Kiro: specs where every requirement is a property-based test, hooks that run
them automatically, and language-ethics steering that taught the AI that p'unchay is not punchay.*

## 8 · Close (2:40 – 2:50)

**Screen:** the big flame on the altar, then the URL and the GitHub repo.

**ES:** "Una lengua no muere mientras alguien la siga hablando. Mantengamos las velas encendidas."

**EN:** *A language doesn't die while someone still speaks it. Let's keep the candles lit.*

---

## Recording checklist

- [ ] Elder recording only with spoken consent on camera or in writing; no face needed.
- [ ] Before the take: clear the app data (fresh altar at 0 %) and have the demo archive ready.
- [ ] Run the Crew Scribes for real before filming scene 5 (needs ~3.5 GB free RAM).
- [ ] Phone screen recording for scenes 3, 4, 6; desktop for 5 and 7.
- [ ] Music: none, or a royalty-free track you have the licence for. No Kiro/AWS logos beyond
      the product UI itself.
- [ ] Burn the EN subtitles in, and upload an `.srt` too. YouTube: public, title
      "Undying Tongues · Kiroween 2026 (Resurrection)".
- [ ] Final length under 3:00 (aim 2:50 to leave margin).
