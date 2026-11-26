import { STRINGS } from './i18n.js?v=5';
import { DECKS, ALL_WORDS, DIALOGUE, LANGUAGE } from './data/quechua.js?v=5';
import { newCard, review } from './core/srs.js?v=5';
import { vitality, candleState, practiceQueue } from './core/vitality.js?v=5';
import { isCorrect, startsWithAny } from './core/answer.js?v=5';
import * as store from './storage.js?v=5';
import { renderHarvest, playClip } from './views/harvest.js?v=5';
import * as fx from './fx.js?v=5';
import { normalize } from './core/answer.js?v=5';

const main = document.getElementById('main');
const prefs = store.loadPrefs();
let cards = store.loadCards();
let family = store.loadFamily();
let voiceIds = new Set();
let view = 'altar';

const FAMILY_DECK = { id: 'family', title: { en: 'Family words', es: 'Palabras de la familia' } };
const words = () => [...ALL_WORDS, ...family.map((w) => ({ ...w, deck: 'family' }))];
const decks = () => (family.length ? [...DECKS, { ...FAMILY_DECK, words: family }] : DECKS);
const hasVoice = (w) => voiceIds.has(w.id) || Boolean(w.clip);

// Never show an internal key to a user: if a string is missing (e.g. a stale cached i18n.js),
// fall back to English, then to nothing.
const t = (k) => STRINGS[prefs.lang]?.[k] ?? STRINGS.en[k] ?? '';
const gloss = (w) => w[prefs.lang] ?? w.en;
const el = (tag, attrs = {}, ...kids) => {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') n.className = v;
    else if (k.startsWith('on')) n.addEventListener(k.slice(2), v);
    else if (v !== false && v != null) n.setAttribute(k, v === true ? '' : v);
  }
  for (const kid of kids.flat()) if (kid != null) n.append(kid);
  return n;
};

function cardFor(wordId) {
  cards[wordId] ??= newCard(wordId, Date.now());
  return cards[wordId];
}
const allCards = () => words().map((w) => cardFor(w.id));

// ---------- chrome ----------
function applyLang() {
  document.documentElement.lang = prefs.lang;
  document.querySelectorAll('[data-i18n]').forEach((n) => (n.textContent = t(n.dataset.i18n)));
  const btn = document.getElementById('lang-toggle');
  btn.textContent = prefs.lang === 'en' ? 'ES' : 'EN';
  btn.setAttribute('aria-label', prefs.lang === 'en' ? 'Cambiar a español' : 'Switch to English');
  document.title = `${t('title')} · ${prefs.lang === 'en' ? 'Lenguas que no mueren' : 'Undying Tongues'}`;
}

document.getElementById('lang-toggle').addEventListener('click', () => {
  prefs.lang = prefs.lang === 'en' ? 'es' : 'en';
  store.savePrefs(prefs);
  applyLang();
  render();
});

document.querySelectorAll('[role=tab]').forEach((tab) =>
  tab.addEventListener('click', () => {
    view = tab.dataset.view;
    document.querySelectorAll('[role=tab]').forEach((x) => x.setAttribute('aria-selected', String(x === tab)));
    render();
    main.focus({ preventScroll: true });
  }),
);

// ---------- shared ----------
function candle(state, label) {
  return el('span', { class: `candle ${state}`, role: 'img', 'aria-label': label },
    el('span', { class: 'flame' }), el('span', { class: 'wax' }));
}

async function playVoice(wordId) {
  const v = await store.getVoice(wordId);
  if (!v) {
    const w = family.find((x) => x.id === wordId);
    if (!w?.clip) return false;
    const story = await store.getStory(w.clip.storyId);
    if (!story) return false;
    await playClip(story.blob, w.clip.start, w.clip.end);
    return true;
  }
  const url = URL.createObjectURL(v.blob);
  const audio = new Audio(url);
  audio.addEventListener('ended', () => URL.revokeObjectURL(url));
  await audio.play();
  return true;
}

// ---------- views ----------
function renderAltar() {
  const now = Date.now();
  const list = allCards();
  const v = vitality(list, now);
  const pct = Math.round(v * 100);
  let idx = 0;
  const deckEls = decks().map((d) =>
    el('section', { class: 'deck' },
      el('h3', {}, d.title[prefs.lang]),
      el('ul', { class: 'candles' },
        d.words.map((w) => {
          const st = candleState(cardFor(w.id), now);
          return el('li', { class: `word st-${st}`, style: `--i:${idx++}` },
            candle(st, `${w.qu}: ${t(st)}`),
            el('span', { class: w.qu.length > 12 ? 'qu long' : 'qu' }, w.qu),
            el('span', { class: 'gl' }, gloss(w)),
            hasVoice(w) ? el('button', { class: 'voice-dot', type: 'button', title: t('play'), 'aria-label': `${t('play')} ${w.qu}`,
              onclick: () => playVoice(w.id) }, '🎙') : null);
        }))));

  main.replaceChildren(
    el('section', { class: 'hero', style: `--hero-v:${v}` },
      el('div', { class: 'meter', style: `--v:${v}` },
        el('div', { class: 'meter-flame', 'aria-hidden': 'true' }),
        el('div', { class: 'meter-num' }, `${pct}%`)),
      el('div', {},
        el('h2', {}, `${t('vitality')}: ${LANGUAGE.name}`),
        el('p', { class: 'muted' }, t('vitalityHint')),
        el('p', { class: 'stats' },
          el('strong', {}, String(list.length)), ` ${t('words')} · `,
          el('strong', {}, String(words().filter(hasVoice).length)), ` ${t('voices')}`),
        v === 0 ? el('button', { class: 'btn primary first-light', type: 'button',
          onclick: () => document.querySelector('[data-view=practice]').click() }, t('firstLight')) : null)),
    ...deckEls,
  );
  fx.countUp(main.querySelector('.meter-num'), pct);
}

function renderElder() {
  let name = localStorage.getItem('undying-tongues:elder') ?? '';
  const nameInput = el('input', { id: 'elder-name', value: name, placeholder: t('elderNamePh'),
    oninput: (e) => localStorage.setItem('undying-tongues:elder', (name = e.target.value)) });
  const status = el('p', { class: 'status', role: 'status' });

  const rows = ALL_WORDS.map((w) => {
    const info = el('span', { class: 'rec-info' });
    const recBtn = el('button', { class: 'btn rec', type: 'button' }, `● ${t('record')}`);
    const playBtn = el('button', { class: 'btn', type: 'button', onclick: () => playVoice(w.id) }, `▶ ${t('play')}`);
    const delBtn = el('button', { class: 'btn danger', type: 'button', onclick: async () => {
      await store.deleteVoice(w.id); voiceIds.delete(w.id); refresh();
    } }, t('remove'));

    let recorder = null;
    recBtn.addEventListener('click', async () => {
      if (recorder) { recorder.stop(); return; }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const chunks = [];
        recorder = new MediaRecorder(stream);
        recorder.ondataavailable = (e) => chunks.push(e.data);
        recorder.onstop = async () => {
          stream.getTracks().forEach((tr) => tr.stop());
          const blob = new Blob(chunks, { type: recorder.mimeType });
          recorder = null;
          await store.saveVoice(w.id, { blob, elder: name.trim() || '—', recordedAt: Date.now() });
          voiceIds.add(w.id);
          refresh();
        };
        recorder.start();
        recBtn.textContent = `■ ${t('stop')}`;
        recBtn.classList.add('live');
      } catch {
        status.textContent = t('noMic');
      }
    });

    async function refresh() {
      recBtn.textContent = `● ${t('record')}`;
      recBtn.classList.remove('live');
      const has = voiceIds.has(w.id);
      playBtn.hidden = delBtn.hidden = !has;
      if (has) {
        const v = await store.getVoice(w.id);
        info.textContent = `${t('recorded')} ${v.elder}`;
      } else info.textContent = '';
    }
    refresh();

    return el('li', { class: 'rec-row' },
      el('div', {}, el('span', { class: 'qu' }, w.qu), el('span', { class: 'gl' }, gloss(w)), info),
      el('div', { class: 'rec-actions' }, recBtn, playBtn, delBtn));
  });

  main.replaceChildren(
    el('section', { class: 'panel' },
      el('p', { class: 'lead' }, t('elderIntro')),
      el('label', { for: 'elder-name' }, t('elderName')), nameInput, status),
    el('ul', { class: 'rec-list' }, rows),
  );
}

function renderPractice() {
  const now = Date.now();
  const queue = practiceQueue(allCards(), now);
  if (!queue.length) { main.replaceChildren(el('p', {}, t('practiceEmpty'))); return; }
  const card = queue[0];
  const w = words().find((x) => x.id === card.id);
  const st = candleState(card, now);

  const answerBox = el('div', { class: 'answer', hidden: true });
  const feedback = el('p', { class: 'feedback', role: 'status' });
  const typed = el('input', { 'aria-label': t('typeIt'), placeholder: t('typeIt'), autocomplete: 'off', spellcheck: 'false' });

  const grade = (g) => {
    if (g >= 4) fx.burst(main.querySelector('.flash .candle'), 14);
    cards[card.id] = review(card, g, Date.now());
    store.saveCards(cards);
    setTimeout(() => { renderPractice(); fx.enter(main); }, g >= 4 ? 260 : 0);
  };
  const reveal = () => { answerBox.hidden = false; revealBtn.hidden = true; };
  const revealBtn = el('button', { class: 'btn primary', type: 'button', onclick: reveal }, t('reveal'));

  const form = el('form', { class: 'type-form', onsubmit: (e) => {
    e.preventDefault();
    const ok = isCorrect(typed.value, [w.qu, ...(w.alt ?? [])]);
    feedback.textContent = ok ? t('right') : `${t('wrong')} ${w.qu}`;
    feedback.className = `feedback ${ok ? 'ok' : 'bad'}`;
    reveal();
    if (ok) fx.burst(main.querySelector('.flash .candle'), 24);
    else fx.shake(main.querySelector('.flash'));
  } }, typed, el('button', { class: 'btn', type: 'submit' }, t('check')));

  const voiced = hasVoice(w);
  main.replaceChildren(
    el('section', { class: 'flash' },
      candle(st, t(st)),
      el('p', { class: 'prompt' }, gloss(w)),
      w.from ? el('p', { class: 'muted small' }, `${t('fromStory')} “${w.from}”`) : null,
      el('p', { class: 'muted' }, t('say')),
      voiced ? el('button', { class: 'btn', type: 'button', onclick: () => playVoice(w.id) }, `▶ ${t('play')}`)
             : el('p', { class: 'muted small' }, t('noVoice')),
      form, feedback, revealBtn,
      el('div', { class: 'answer-wrap' }, answerBox)),
  );
  answerBox.append(
    el('p', { class: 'qu big' }, w.qu),
    w.morph ? el('p', { class: 'morph' }, w.morph) : '',
    el('div', { class: 'grades' },
      [['forgot', 1], ['hard', 3], ['good', 4], ['easy', 5]].map(([k, g]) =>
        el('button', { class: `btn grade g${g}`, type: 'button', onclick: () => grade(g) }, t(k)))),
  );
  if (voiced) answerBox.querySelector('.qu').addEventListener('click', () => playVoice(w.id));
}

let step = 0;
let log = [];
function renderAncestor() {
  if (step === 0 && !log.length) pushAncestor();
  const chat = el('ol', { class: 'chat', 'aria-live': 'polite' },
    log.map((m) => el('li', { class: `msg ${m.who}` }, el('span', { class: 'text' }, m.text),
      m.gloss ? el('span', { class: 'gl' }, m.gloss) : null)));

  function pushAncestor() {
    const line = DIALOGUE[step];
    log.push({ who: 'ancestor', text: line.ancestor, gloss: line.gloss[prefs.lang] });
  }

  const done = step >= DIALOGUE.length;
  const input = el('input', { 'aria-label': t('answer'), placeholder: t('answer'), autocomplete: 'off', spellcheck: 'false' });
  const form = el('form', { class: 'type-form', onsubmit: (e) => {
    e.preventDefault();
    const line = DIALOGUE[step];
    const said = input.value.trim();
    if (!said) return;
    log.push({ who: 'child', text: said });
    const ok = line.prefix ? startsWithAny(said, line.prefix) : isCorrect(said, line.expect);
    if (ok) {
      step += 1;
      if (step < DIALOGUE.length) pushAncestor();
      else log.push({ who: 'ancestor', text: '✦', gloss: t('ancestorDone') });
      setTimeout(() => fx.burst([...main.querySelectorAll('.msg.ancestor')].at(-1), step >= DIALOGUE.length ? 30 : 10), 50);
    } else {
      log.push({ who: 'ancestor', text: '…', gloss: t('ancestorRetry') });
      setTimeout(() => fx.shake(main.querySelector('.type-form')), 50);
    }
    renderAncestor();
  } }, input, el('button', { class: 'btn primary', type: 'submit' }, t('send')));

  const line = DIALOGUE[step];
  const hint = !done && el('details', { class: 'hint' }, el('summary', {}, t('hint')),
    el('p', {}, line.prefix ? t('nameHint') : line.expect[0]));

  main.replaceChildren(
    el('section', { class: 'panel' }, el('p', { class: 'lead' }, t('ancestorIntro'))),
    chat,
    done ? el('button', { class: 'btn', type: 'button', onclick: () => { step = 0; log = []; renderAncestor(); } }, t('restart'))
         : el('div', {}, form, hint),
  );
  if (!done) input.focus();
}

// ---------- Nina, the candle spirit (guide) ----------
// One line per state: always says what to press next, with a little mischief.
let guideHidden = sessionStorage.getItem('undying-tongues:guide-hidden') === '1';
function guideKey() {
  const now = Date.now();
  if (view === 'altar') {
    const list = allCards();
    const v = vitality(list, now);
    if (v === 0) return 'g_altar_cold';
    if (list.some((c) => candleState(c, now) === 'ghost')) return 'g_altar_ghost';
    return v > 0.6 ? 'g_altar_bright' : 'g_altar_some';
  }
  if (view === 'harvest') return document.querySelector('.segments') ? 'g_harvest_story' : 'g_harvest';
  return { elder: 'g_elder', practice: 'g_practice', ancestor: 'g_ancestor' }[view];
}
function updateGuide() {
  const box = document.getElementById('guide');
  if (!box) return;
  box.hidden = guideHidden;
  box.querySelector('.guide-text').textContent = t(guideKey());
  box.querySelector('.guide-close').setAttribute('aria-label', t('g_close'));
  box.querySelector('.guide-close').title = t('g_close');
}
document.querySelector('#guide .guide-close')?.addEventListener('click', () => {
  guideHidden = true;
  sessionStorage.setItem('undying-tongues:guide-hidden', '1');
  updateGuide();
});
document.getElementById('guide-summon')?.addEventListener('click', () => {
  guideHidden = false;
  sessionStorage.removeItem('undying-tongues:guide-hidden');
  updateGuide();
});

function render() {
  setTimeout(updateGuide, 150); // harvest renders asynchronously
  fx.enter(main);
  if (view === 'harvest') {
    renderHarvest({
      main, el, t, lang: () => prefs.lang, onChange: () => updateGuide(),
      knownForms: () => words().flatMap((w) => [w.qu, ...(w.alt ?? [])]),
      addFamilyWord: (w) => {
        if (family.some((x) => x.id === w.id || normalize(x.qu) === normalize(w.qu))) return;
        family = [...family, w];
        store.saveFamily(family);
      },
    });
    return;
  }
  ({ altar: renderAltar, elder: renderElder, practice: renderPractice, ancestor: renderAncestor })[view]();
}

(async function boot() {
  applyLang();
  fx.startEmbers(document.getElementById('embers'));
  try { voiceIds = new Set(await store.listVoiceIds()); } catch { /* IndexedDB unavailable: app still works without voices */ }
  render();
})();
