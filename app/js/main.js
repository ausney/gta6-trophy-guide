// Leonida Platinum — boot, state and routing. The guide is one page with
// four views (checklist, roadmap, missable, about) switched by the hash, so
// every view is a link and the back button works. The checklist loads the
// trophy data from data/trophies.json and nothing else; the app makes no
// network request at run time.
//
// Screenshot helpers, read once at load from the query string (never from
// the app's own controls): ?demo=1 seeds 13 earned trophies,
// ?view=roadmap|missable|about opens that view, ?trophy=<id> opens a
// trophy's guide, and ?spoilers=off turns the spoiler setting off.

import { loadEarned, saveEarned, loadSettings, saveSettings, exportProgress, parseImportedProgress, clearProgress, DEMO_EARNED } from './store.js';
import { renderProgress, renderChecklist, renderDetail, renderRoadmap, renderMissable, renderSources } from './views.js';

const state = {
  trophies: [],
  sources: {},
  earned: loadEarned(),
  query: '',
  kind: 'all',
  grade: 'all',
  hideEarned: false,
  spoilersOn: true,
  view: 'checklist',
  selectedId: null,
};

const els = {
  count: document.getElementById('progressCount'),
  pct: document.getElementById('progressPct'),
  grades: document.getElementById('progressGrades'),
  ring: document.getElementById('progressRing'),
  meta: document.getElementById('listMeta'),
  list: document.getElementById('trophyList'),
  detail: document.getElementById('detailPane'),
  roadmap: document.getElementById('roadmapList'),
  missable: document.getElementById('missableList'),
  sourceList: document.getElementById('sourceList'),
  search: document.getElementById('searchInput'),
  gradeSelect: document.getElementById('gradeSelect'),
  hideEarned: document.getElementById('hideEarned'),
  spoilerToggle: document.getElementById('spoilerToggle'),
  saveState: document.getElementById('saveState'),
};

function persistSettings() {
  saveSettings({ spoilersOn: state.spoilersOn, hideEarned: state.hideEarned, kind: state.kind, grade: state.grade });
}

function renderAll() {
  renderProgress(state.trophies, state.earned, els);
  renderChecklist(state.trophies, state, els, selectTrophy, toggleEarned);
  const selected = state.trophies.find((t) => t.id === state.selectedId) || null;
  renderDetail(selected, { sources: state.sources }, state, els, toggleEarned);
  renderRoadmap(state.trophies, state.earned, els.roadmap);
  renderMissable(state.trophies, { sources: state.sources }, els.missable, (id) => {
    selectTrophy(id);
    showView('checklist');
  });
}

function toggleEarned(id) {
  if (state.earned.has(id)) state.earned.delete(id);
  else state.earned.add(id);
  saveEarned(state.earned);
  els.saveState.textContent = `Progress saved in this browser — ${state.earned.size} of ${state.trophies.length} earned.`;
  renderAll();
}

function selectTrophy(id) {
  state.selectedId = id;
  renderChecklist(state.trophies, state, els, selectTrophy, toggleEarned);
  const selected = state.trophies.find((t) => t.id === state.selectedId) || null;
  renderDetail(selected, { sources: state.sources }, state, els, toggleEarned);
}

function showView(view) {
  state.view = view;
  document.querySelectorAll('.tab').forEach((tab) => {
    tab.classList.toggle('is-active', tab.getAttribute('data-view') === view);
  });
  document.querySelectorAll('.view').forEach((section) => {
    section.classList.toggle('is-active', section.id === `view-${view}`);
  });
}

function readHash() {
  const hash = window.location.hash.replace(/^#/, '');
  const view = ['checklist', 'roadmap', 'missable', 'about'].includes(hash) ? hash : 'checklist';
  showView(view);
  if (hash.startsWith('trophy-')) {
    const id = Number(hash.slice('trophy-'.length));
    if (Number.isInteger(id)) selectTrophy(id);
  }
}

async function boot() {
  const res = await fetch('./data/trophies.json');
  if (!res.ok) throw new Error(`Could not load the trophy list (HTTP ${res.status}).`);
  const data = await res.json();
  state.trophies = data.trophies;
  state.sources = data.sources;

  // Settings the reader saved last time; spoiler-free is on by default.
  const saved = loadSettings();
  state.spoilersOn = saved.spoilersOn !== false;
  state.hideEarned = saved.hideEarned === true;
  state.kind = saved.kind || 'all';
  state.grade = saved.grade || 'all';

  // Screenshot and demo helpers from the query string.
  const params = new URLSearchParams(window.location.search);
  if (params.get('demo') === '1') {
    state.earned = new Set(DEMO_EARNED);
    saveEarned(state.earned);
  }
  if (params.get('spoilers') === 'off') state.spoilersOn = false;
  if (params.get('spoilers') === 'on') state.spoilersOn = true;
  if (params.get('kind')) state.kind = params.get('kind');
  if (params.get('grade')) state.grade = params.get('grade');
  const viewParam = params.get('view');
  const trophyParam = params.get('trophy');

  // Wire the toolbar.
  els.search.addEventListener('input', () => {
    state.query = els.search.value;
    renderChecklist(state.trophies, state, els, selectTrophy, toggleEarned);
  });
  document.querySelectorAll('#kindChips .chip').forEach((chip) => {
    chip.classList.toggle('is-active', chip.getAttribute('data-kind') === state.kind);
    chip.addEventListener('click', () => {
      state.kind = chip.getAttribute('data-kind');
      document.querySelectorAll('#kindChips .chip').forEach((c) => c.classList.toggle('is-active', c === chip));
      persistSettings();
      renderChecklist(state.trophies, state, els, selectTrophy, toggleEarned);
    });
  });
  els.gradeSelect.value = state.grade;
  els.gradeSelect.addEventListener('change', () => {
    state.grade = els.gradeSelect.value;
    persistSettings();
    renderChecklist(state.trophies, state, els, selectTrophy, toggleEarned);
  });
  els.hideEarned.checked = state.hideEarned;
  els.hideEarned.addEventListener('change', () => {
    state.hideEarned = els.hideEarned.checked;
    persistSettings();
    renderChecklist(state.trophies, state, els, selectTrophy, toggleEarned);
  });
  els.spoilerToggle.checked = state.spoilersOn;
  els.spoilerToggle.addEventListener('change', () => {
    state.spoilersOn = els.spoilerToggle.checked;
    persistSettings();
    renderAll();
  });
  document.querySelectorAll('.tab').forEach((tab) => {
    tab.addEventListener('click', () => showView(tab.getAttribute('data-view')));
  });

  // Export, import, reset and demo progress.
  document.getElementById('exportBtn').addEventListener('click', () => {
    const n = exportProgress(state.earned, { spoilersOn: state.spoilersOn });
    els.saveState.textContent = `Exported ${n} earned trophies to gta6-trophy-progress.json.`;
  });
  document.getElementById('importInput').addEventListener('change', async (ev) => {
    const file = ev.target.files && ev.target.files[0];
    if (!file) return;
    try {
      const parsed = parseImportedProgress(await file.text());
      state.earned = parsed.earned;
      if (typeof parsed.settings.spoilersOn === 'boolean') state.spoilersOn = parsed.settings.spoilersOn;
      saveEarned(state.earned);
      persistSettings();
      els.spoilerToggle.checked = state.spoilersOn;
      els.saveState.textContent = `Imported ${state.earned.size} earned trophies from ${file.name}.`;
      renderAll();
    } catch (err) {
      els.saveState.textContent = `Could not import that file: ${err.message}`;
    }
    ev.target.value = '';
  });
  document.getElementById('resetBtn').addEventListener('click', () => {
    if (!window.confirm('Clear all earned trophies? This cannot be undone.')) return;
    state.earned = new Set();
    clearProgress();
    els.saveState.textContent = 'Progress cleared.';
    renderAll();
  });
  document.getElementById('demoBtn').addEventListener('click', () => {
    state.earned = new Set(DEMO_EARNED);
    saveEarned(state.earned);
    els.saveState.textContent = `Demo progress loaded — ${state.earned.size} of ${state.trophies.length} earned.`;
    renderAll();
  });

  renderSources(data, els.sourceList);
  renderAll();
  els.saveState.textContent = `Progress is saved in this browser — ${state.earned.size} of ${state.trophies.length} earned.`;

  // Hash routing: #checklist, #roadmap, #missable, #about, #trophy-<id>.
  window.addEventListener('hashchange', readHash);
  if (viewParam && ['checklist', 'roadmap', 'missable', 'about'].includes(viewParam)) {
    showView(viewParam);
  } else {
    readHash();
  }
  if (trophyParam) {
    const id = Number(trophyParam);
    if (Number.isInteger(id)) selectTrophy(id);
  }
}

boot().catch((err) => {
  els.list.innerHTML = `<li><p>Could not load the trophy list: ${err.message}</p></li>`;
});
