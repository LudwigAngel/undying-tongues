// Story Harvest view (.kiro/specs/story-harvest). DOM glue only; logic lives in src/core/harvest.js.
import { addMark, removeMark, segmentsFrom, propose } from '../core/harvest.js';
import { normalize } from '../core/answer.js';
import * as store from '../storage.js';

const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

let current = null; // { audio, stop } of the clip playing now

/** Play [start, end) of a recording. Returns a promise that resolves when the clip ends. */
export function playClip(blob, start, end) {
  current?.stop();
  const url = URL.createObjectURL(blob);
  const audio = new Audio(url);
  let done;
  const finished = new Promise((r) => (done = r));
  const stop = () => {
    audio.pause();
    URL.revokeObjectURL(url);
    if (current?.audio === audio) current = null;
    done();
  };
  audio.addEventListener('timeupdate', () => { if (audio.currentTime >= end) stop(); });
  audio.addEventListener('ended', stop);
  audio.addEventListener('loadedmetadata', () => {
    audio.currentTime = start;
    audio.play().catch(stop);
  }, { once: true });
  current = { audio, stop };
  return finished;
}

let openId = null;
let recorder = null;

export async function renderHarvest(ctx) {
  const { main, el, t } = ctx;
  if (openId) {
    const story = await store.getStory(openId);
    if (story) return renderStory(ctx, story);
    openId = null;
  }
  const stories = (await store.listStories()).sort((a, b) => b.recordedAt - a.recordedAt);

  const title = el('input', { id: 'story-title', placeholder: t('storyTitlePh') });
  const status = el('p', { class: 'status', role: 'status' });
  const timer = el('span', { class: 'timer', 'aria-live': 'off' });
  const recBtn = el('button', { class: 'btn rec', type: 'button' }, `● ${t('recordStory')}`);

  recBtn.addEventListener('click', async () => {
    if (recorder) { recorder.stop(); return; }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const chunks = [];
      const startedAt = Date.now();
      recorder = new MediaRecorder(stream);
      const tick = setInterval(() => (timer.textContent = fmt((Date.now() - startedAt) / 1000)), 500);
      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = async () => {
        clearInterval(tick);
        stream.getTracks().forEach((tr) => tr.stop());
        const story = {
          id: `s${Date.now().toString(36)}`,
          title: title.value.trim() || t('untitled'),
          elder: localStorage.getItem('undying-tongues:elder') || '—',
          blob: new Blob(chunks, { type: recorder.mimeType }),
          // MediaRecorder WebM files often report duration = Infinity, so we measure it ourselves.
          duration: (Date.now() - startedAt) / 1000,
          recordedAt: Date.now(),
          marks: [],
          texts: [],
        };
        recorder = null;
        await store.saveStory(story);
        openId = story.id;
        renderHarvest(ctx);
      };
      recorder.start();
      recBtn.textContent = `■ ${t('stop')}`;
      recBtn.classList.add('live');
    } catch {
      status.textContent = t('noMic');
    }
  });

  main.replaceChildren(
    el('section', { class: 'panel' },
      el('p', { class: 'lead' }, t('harvestIntro')),
      el('ol', { class: 'steps' }, el('li', {}, t('harvestStep1')), el('li', {}, t('harvestStep2')), el('li', {}, t('harvestStep3'))),
      el('label', { for: 'story-title' }, t('storyTitle')), title,
      el('div', { class: 'rec-actions spaced' }, recBtn, timer), status),
    stories.length
      ? el('ul', { class: 'rec-list' }, stories.map((s) =>
          el('li', { class: 'rec-row' },
            el('div', {}, el('span', { class: 'qu' }, s.title),
              el('span', { class: 'gl' }, `${s.elder} · ${fmt(s.duration)} · ${segmentsFrom(s.marks, s.duration).length} ${t('segments')}`)),
            el('div', { class: 'rec-actions' },
              el('button', { class: 'btn primary', type: 'button', onclick: () => { openId = s.id; renderHarvest(ctx); } }, t('open')),
              el('button', { class: 'btn danger', type: 'button', onclick: async () => {
                if (!confirm(t('confirmDelete'))) return;
                await store.deleteStory(s.id); renderHarvest(ctx);
              } }, t('remove'))))))
      : el('p', { class: 'muted' }, t('noStories')),
  );
}

function renderStory(ctx, story) {
  const { main, el, t } = ctx;
  const save = () => store.saveStory(story);
  const url = URL.createObjectURL(story.blob);
  const player = el('audio', { controls: true, src: url, preload: 'metadata', class: 'player' });

  const cut = el('button', { class: 'btn primary', type: 'button', onclick: () => {
    story.marks = addMark(story.marks, player.currentTime, story.duration);
    save(); draw();
  } }, `✂ ${t('cutHere')}`);

  const segBox = el('ol', { class: 'segments' });
  const harvestBox = el('section', { class: 'harvest' });

  function draw() {
    const segs = segmentsFrom(story.marks, story.duration);
    story.texts = segs.map((_, i) => story.texts[i] ?? { qu: '', meaning: '' });
    segBox.replaceChildren(...segs.map((seg, i) => {
      const txt = story.texts[i];
      const qu = el('input', { value: txt.qu, placeholder: t('transcriptPh'), 'aria-label': `${t('transcript')} ${i + 1}`, spellcheck: 'false',
        onchange: (e) => { txt.qu = e.target.value; save(); drawHarvest(); } });
      const meaning = el('input', { value: txt.meaning, placeholder: t('meaningPh'), 'aria-label': `${t('meaning')} ${i + 1}`,
        onchange: (e) => { txt.meaning = e.target.value; save(); drawHarvest(); } });
      return el('li', { class: 'segment' },
        el('div', { class: 'seg-head' },
          el('button', { class: 'btn', type: 'button', onclick: () => playClip(story.blob, seg.start, seg.end) }, `▶ ${fmt(seg.start)}–${fmt(seg.end)}`),
          i > 0 ? el('button', { class: 'btn ghost-btn small', type: 'button', title: t('joinPrev'), onclick: () => {
            story.texts.splice(i - 1, 2, { qu: [story.texts[i - 1].qu, txt.qu].filter(Boolean).join(' '),
              meaning: [story.texts[i - 1].meaning, txt.meaning].filter(Boolean).join(' ') });
            story.marks = removeMark(story.marks, i - 1);
            save(); draw();
          } }, `⤒ ${t('joinPrev')}`) : null),
        qu, meaning);
    }));
    drawHarvest();
  }

  function drawHarvest() {
    const segs = segmentsFrom(story.marks, story.duration);
    const { phrases, words } = propose(segs, story.texts, ctx.knownForms());
    const add = (qu, meaning, seg) => {
      ctx.addFamilyWord({ id: `fam-${story.id}-${normalize(qu).replace(/\s+/g, '-')}`, qu, en: meaning, es: meaning,
        clip: { storyId: story.id, start: seg.start, end: seg.end }, from: story.title });
      drawHarvest();
    };
    harvestBox.replaceChildren(...[
      el('h3', {}, t('proposals')),
      !phrases.length && !words.length ? el('p', { class: 'muted' }, t('noProposals')) : null,
      phrases.length ? el('h4', {}, t('phrases')) : null,
      el('ul', { class: 'proposals' }, phrases.map((p) =>
        el('li', {}, el('span', { class: 'qu' }, p.qu), el('span', { class: 'gl' }, p.meaning),
          el('button', { class: 'btn primary', type: 'button', onclick: () => add(p.qu, p.meaning, segs[p.segment]) }, `🕯️ ${t('addToAltar')}`)))),
      words.length ? el('h4', {}, t('wordsHeading')) : null,
      el('ul', { class: 'proposals' }, words.slice(0, 30).map((w) => {
        const m = el('input', { placeholder: t('meaningPh'), 'aria-label': `${t('meaning')}: ${w.form}` });
        return el('li', {}, el('span', { class: 'qu' }, w.form), el('span', { class: 'gl' }, `×${w.count}`), m,
          el('button', { class: 'btn', type: 'button', onclick: () => {
            if (!m.value.trim()) { m.focus(); return; }
            add(w.form, m.value.trim(), segs[w.segment]);
          } }, `🕯️ ${t('addToAltar')}`));
      })),
    ].filter(Boolean));
  }

  main.replaceChildren(
    el('button', { class: 'btn ghost-btn', type: 'button', onclick: () => { URL.revokeObjectURL(url); openId = null; renderHarvest(ctx); } }, `← ${t('allStories')}`),
    el('section', { class: 'panel' },
      el('h2', {}, story.title), el('p', { class: 'muted' }, `${story.elder} · ${fmt(story.duration)}`),
      player, el('div', { class: 'rec-actions spaced' }, cut), el('p', { class: 'muted small' }, t('cutHint'))),
    segBox, harvestBox,
  );
  draw();
}
