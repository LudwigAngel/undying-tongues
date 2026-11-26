// Build demo/atuqmanta-demo.undying.json: a sample family archive for trying the Crew Scribes.
// Audio is 25 s of silence (a real WAV), so the file also imports into the web app.
import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const sr = 8000;
const secs = 25;
const n = sr * secs;
const buf = Buffer.alloc(44 + n * 2);
buf.write('RIFF', 0); buf.writeUInt32LE(36 + n * 2, 4); buf.write('WAVE', 8); buf.write('fmt ', 12);
buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(1, 22); buf.writeUInt32LE(sr, 24);
buf.writeUInt32LE(sr * 2, 28); buf.writeUInt16LE(2, 32); buf.writeUInt16LE(16, 34); buf.write('data', 36); buf.writeUInt32LE(n * 2, 40);

const archive = {
  format: 'undying-tongues-archive', version: 1, exportedAt: '2026-11-26T00:00:00.000Z', language: 'quz', family: [],
  stories: [{
    id: 'atuqmanta', title: 'Atuqmanta (demo)', elder: 'Demo speaker', duration: secs, recordedAt: Date.UTC(2026, 10, 26),
    marks: [5, 10, 15, 20],
    texts: [
      { qu: 'atuq urqupi', meaning: '' },
      { qu: 'wasiykunapi tiyan', meaning: '' },
      { qu: 'inti', meaning: 'sun' },
      { qu: 'killa tutapi lluqsin', meaning: '' },
      { qu: 'atuqqa killaman rirqan', meaning: '' },
    ],
    audio: { mime: 'audio/wav', base64: buf.toString('base64') },
  }],
};
mkdirSync(join(root, 'demo'), { recursive: true });
writeFileSync(join(root, 'demo', 'atuqmanta-demo.undying.json'), JSON.stringify(archive));
console.log('wrote demo/atuqmanta-demo.undying.json');
