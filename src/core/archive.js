// Family archive: the file a family exports to share between phones or to hand to the Crew Scribes.
// The scribes read TEXT only. Audio stays in the file but the MCP server never returns it.
import { normalize } from './answer.js';
import { segmentsFrom, tokenize } from './harvest.js';
import { analyse } from './morph.js';

export const ARCHIVE_FORMAT = 'undying-tongues-archive';
export const SUGGESTIONS_FORMAT = 'undying-tongues-suggestions';
export const VERSION = 1;

export function validateArchive(a) {
  const errors = [];
  if (a?.format !== ARCHIVE_FORMAT) errors.push(`format must be "${ARCHIVE_FORMAT}"`);
  if (a?.version !== VERSION) errors.push(`version must be ${VERSION}`);
  if (!Array.isArray(a?.stories)) errors.push('stories must be a list');
  for (const s of a?.stories ?? []) {
    if (typeof s.id !== 'string' || !s.id) errors.push('story without id');
    if (!(s.duration > 0)) errors.push(`story ${s.id}: duration must be positive`);
    if (!Array.isArray(s.marks)) errors.push(`story ${s.id}: marks must be a list`);
    if (!Array.isArray(s.texts)) errors.push(`story ${s.id}: texts must be a list`);
  }
  return errors;
}

/** Every single-word form the family already knows: base decks + harvested words + their alts. */
export function knownRoots(archive, baseWords) {
  const forms = [...baseWords, ...(archive.family ?? [])].flatMap((w) => [w.qu, ...(w.alt ?? [])]);
  return new Set(forms.map(normalize).filter((f) => f && !f.includes(' ')));
}

export function summary(archive) {
  return (archive.stories ?? []).map((s) => {
    const segs = segmentsFrom(s.marks ?? [], s.duration);
    const texts = segs.map((_, i) => s.texts?.[i] ?? { qu: '', meaning: '' });
    return {
      id: s.id, title: s.title, elder: s.elder, segments: segs.length,
      transcribed: texts.filter((t) => normalize(t.qu)).length,
      missingMeaning: texts.filter((t) => normalize(t.qu) && !String(t.meaning ?? '').trim()).length,
    };
  });
}

/** Text view of one story for an agent: no audio, each token tagged known / analysable / unknown. */
export function segmentsView(archive, storyId, baseWords) {
  const s = (archive.stories ?? []).find((x) => x.id === storyId);
  if (!s) return null;
  const roots = knownRoots(archive, baseWords);
  return segmentsFrom(s.marks ?? [], s.duration).map((seg, i) => {
    const t = s.texts?.[i] ?? { qu: '', meaning: '' };
    return {
      segment: i, start: seg.start, end: seg.end, qu: t.qu ?? '', meaning: t.meaning ?? '',
      tokens: tokenize(t.qu ?? '').map((tok) => {
        const a = analyse(tok, roots);
        return { token: tok, status: !a ? 'unknown' : a.suffixes.length ? 'analysable' : 'known', analysis: a };
      }),
    };
  });
}
