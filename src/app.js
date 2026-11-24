import { STRINGS } from './i18n.js';
import { DECKS, ALL_WORDS, DIALOGUE, LANGUAGE } from './data/quechua.js';
import { newCard, review } from './core/srs.js';
import { vitality, candleState, practiceQueue } from './core/vitality.js';
import { isCorrect, startsWithAny } from './core/answer.js';
import * as store from './storage.js';

const main = document.getElementById('main');
const prefs = store.loadPrefs();
let cards = store.loadCards();
let voiceIds = new Set();
let view = 'altar';

const t = (k) => STRINGS[prefs.lang][k] ?? STRINGS.en[k] ?? k;
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
const allCards = () => ALL_WORDS.map((w) => cardFor(w.id));

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
  if (!v) return false;
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
  const deckEls = DECKS.map((d) =>
    el('section', { class: 'deck' },
      el('h3', {}, d.title[prefs.lang]),
      el('ul', { class: 'candles' },
        d.words.map((w) => {
          const st = candleState(cardFor(w.id), now);
          return el('li', { class: 'word' },
            candle(st, `${w.qu}: ${t(st)}`),
            el('span', { class: 'qu' }, w.qu),
            el('span', { class: 'gl' }, gloss(w)),
            voiceIds.has(w.id) ? el('span', { class: 'voice-dot', title: t('voices') }, '🎙') : null);
        }))));

  main.replaceChildren(
    el('section', { class: 'hero' },
      el('div', { class: 'meter', style: `--v:${v}` },
        el('div', { class: 'meter-flame', 'aria-hidden': 'true' }),
        el('div', { class: 'meter-num' }, `${pct}%`)),
      el('div', {},
        el('h2', {}, `${t('vitality')}: ${LANGUAGE.name}`),
        el('p', { class: 'muted' }, t('vitalityHint')),
        el('p', { class: 'stats' },
          el('strong', {}, String(list.length)), ` ${t('words')} · `,
          el('strong', {}, String(voiceIds.size)), ` ${t('voices')}`))),
    ...deckEls,
  );
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
  const w = ALL_WORDS.find((x) => x.id === card.id);
  const st = candleState(card, now);

  const answerBox = el('div', { class: 'answer', hidden: true });
  const feedback = el('p', { class: 'feedback', role: 'status' });
  const typed = el('input', { 'aria-label': t('typeIt'), placeholder: t('typeIt'), autocomplete: 'off', spellcheck: 'false' });

  const grade = (g) => {
    cards[card.id] = review(card, g, Date.now());
    store.saveCards(cards);
    renderPractice();
  };
  const reveal = () => { answerBox.hidden = false; revealBtn.hidden = true; };
  const revealBtn = el('button', { class: 'btn primary', type: 'button', onclick: reveal }, t('reveal'));

  const form = el('form', { class: 'type-form', onsubmit: (e) => {
    e.preventDefault();
    const ok = isCorrect(typed.value, [w.qu, ...(w.alt ?? [])]);
    feedback.textContent = ok ? t('right') : `${t('wrong')} ${w.qu}`;
    feedback.className = `feedback ${ok ? 'ok' : 'bad'}`;
    reveal();
  } }, typed, el('button', { class: 'btn', type: 'submit' }, t('check')));

  const hasVoice = voiceIds.has(w.id);
  main.replaceChildren(
    el('section', { class: 'flash' },
      candle(st, t(st)),
      el('p', { class: 'prompt' }, gloss(w)),
      el('p', { class: 'muted' }, t('say')),
      hasVoice ? el('button', { class: 'btn', type: 'button', onclick: () => playVoice(w.id) }, `▶ ${t('play')}`)
               : el('p', { class: 'muted small' }, t('noVoice')),
      form, feedback, revealBtn,
      el('div', { class: 'answer-wrap' }, answerBox)),
  );
  answerBox.append(
    el('p', { class: 'qu big' }, w.qu),
    el('div', { class: 'grades' },
      [['forgot', 1], ['hard', 3], ['good', 4], ['easy', 5]].map(([k, g]) =>
        el('button', { class: `btn grade g${g}`, type: 'button', onclick: () => grade(g) }, t(k)))),
  );
  if (hasVoice) answerBox.querySelector('.qu').addEventListener('click', () => playVoice(w.id));
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
    } else {
      log.push({ who: 'ancestor', text: '…', gloss: t('ancestorRetry') });
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

function render() {
  ({ altar: renderAltar, elder: renderElder, practice: renderPractice, ancestor: renderAncestor })[view]();
}

(async function boot() {
  applyLang();
  try { voiceIds = new Set(await store.listVoiceIds()); } catch { /* IndexedDB unavailable: app still works without voices */ }
  render();
})();
