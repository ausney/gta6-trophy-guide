// Views: the checklist rows, the detail pane, the roadmap, the missable
// page and the sources list. Every view reads the same trophy data, so the
// names, descriptions and grades on screen are always the official list.

import { filterTrophies, isMasked, gradeLabel, gradeLetter, escapeHtml } from './filters.js';
import { ROADMAP_STAGES } from './roadmap.js';

export function renderProgress(trophies, earned, els) {
  const total = trophies.length;
  const done = earned.size;
  const pct = total ? Math.round((done / total) * 100) : 0;
  els.count.textContent = `${done} / ${total}`;
  els.pct.textContent = pct === 100 ? 'Platinum earned — Leonida Legend!' : `${pct}% to the Platinum`;
  els.ring.style.setProperty('--pct', String(pct));
  els.ring.setAttribute('data-pct', `${pct}%`);
  els.ring.setAttribute('aria-label', `${done} of ${total} trophies earned`);
  const byGrade = {};
  for (const t of trophies) {
    if (earned.has(t.id)) byGrade[t.grade] = (byGrade[t.grade] || 0) + 1;
  }
  const parts = ['platinum', 'gold', 'silver', 'bronze']
    .map((g) => `${byGrade[g] || 0} ${g}`)
    .join(' · ');
  els.grades.textContent = parts;
}

function tagHtml(trophy) {
  const tags = [];
  if (trophy.missable) tags.push('<span class="tag tag-missable">Possibly missable</span>');
  if (trophy.hidden) tags.push('<span class="tag tag-hidden">Hidden on PS5</span>');
  if (trophy.confirmed === false) tags.push('<span class="tag tag-unconfirmed">Unlock unconfirmed</span>');
  if (trophy.count != null) {
    const label = trophy.count >= 1000 ? trophy.count.toLocaleString('en-US') : String(trophy.count);
    tags.push(`<span class="tag tag-count">Target: ${escapeHtml(label)}</span>`);
  }
  if (trophy.kind === 'story') tags.push('<span class="tag">Story</span>');
  if (trophy.kind === 'collectible') tags.push('<span class="tag">Collectible</span>');
  if (trophy.kind === 'activity') tags.push('<span class="tag">Activity</span>');
  if (trophy.kind === 'side') tags.push('<span class="tag">Side quest</span>');
  return tags.join('');
}

export function renderChecklist(trophies, state, els, onSelect, onToggle) {
  const shown = filterTrophies(trophies, {
    query: state.query,
    kind: state.kind,
    grade: state.grade,
    hideEarned: state.hideEarned,
    earned: state.earned,
  });
  const earnedShown = shown.filter((t) => state.earned.has(t.id)).length;
  els.meta.textContent = `Showing ${shown.length} of ${trophies.length} trophies · ${earnedShown} earned in this view`;
  els.list.innerHTML = shown.map((t) => {
    const masked = isMasked(t, state.spoilersOn, state.earned);
    const earned = state.earned.has(t.id);
    const name = masked ? 'Hidden story trophy' : escapeHtml(t.name);
    const desc = masked
      ? 'Earn this trophy to reveal its name and description.'
      : escapeHtml(t.description);
    return `<li><button type="button" class="trophy-row${earned ? ' is-earned' : ''}${state.selectedId === t.id ? ' is-selected' : ''}" data-id="${t.id}">
      <span class="trophy-check" role="checkbox" aria-pressed="${earned}" aria-label="Mark ${masked ? 'story trophy' : escapeHtml(t.name)} as earned" data-check="${t.id}">${earned ? '✓' : ''}</span>
      <span class="medal medal-${t.grade}" aria-hidden="true">${gradeLetter(t.grade)}</span>
      <span class="trophy-body">
        <span class="trophy-name">${name}</span>
        <span class="trophy-desc"><span class="official-label">Official · </span>${desc}</span>
        <span class="trophy-tags">${tagHtml(t)}</span>
      </span>
      <span class="trophy-grade-word">${earned ? 'Earned ✓' : gradeLabel(t.grade)}</span>
    </button></li>`;
  }).join('');
  els.list.querySelectorAll('[data-check]').forEach((btn) => {
    btn.addEventListener('click', (ev) => {
      ev.stopPropagation();
      onToggle(Number(btn.getAttribute('data-check')));
    });
  });
  els.list.querySelectorAll('.trophy-row').forEach((row) => {
    row.addEventListener('click', () => onSelect(Number(row.getAttribute('data-id'))));
  });
}

function sourceLinks(trophy, sources) {
  return trophy.sources.map((key) => {
    const s = sources[key];
    if (!s) return `<li>${escapeHtml(key)}</li>`;
    if (!s.url) return `<li>${escapeHtml(s.name)}</li>`;
    return `<li><a href="${escapeHtml(s.url)}" target="_blank" rel="noopener">${escapeHtml(s.name)}</a></li>`;
  }).join('');
}

export function renderDetail(trophy, data, state, els, onToggle) {
  if (!trophy) {
    els.detail.innerHTML = `<p class="detail-empty"><strong>Pick a trophy</strong> to see its guide. The guide says what to do, where and how, when it can be missed, and where each fact comes from.</p>`;
    return;
  }
  const masked = isMasked(trophy, state.spoilersOn, state.earned);
  const earned = state.earned.has(trophy.id);
  const name = masked ? 'Hidden story trophy' : escapeHtml(trophy.name);
  const desc = masked ? 'Earn this trophy to reveal its name and description.' : escapeHtml(trophy.description);
  const steps = trophy.steps && trophy.steps.length
    ? `<h3>Steps</h3><ol class="detail-steps">${trophy.steps.map((s) => `<li>${escapeHtml(s)}</li>`).join('')}</ol>`
    : '';
  const warning = trophy.missable && trophy.missableNote
    ? `<div class="detail-warning"><strong>Possibly missable.</strong> ${escapeHtml(trophy.missableNote)}</div>`
    : '';
  const unconfirmed = trophy.confirmed === false
    ? `<div class="detail-note"><strong>Not confirmed yet.</strong> No public guide has pinned down this unlock. The steps above are the best reading of the official description, not a verified route — the guide will say so until players crack it.</div>`
    : '';
  const guide = masked
    ? '<p>This is a story trophy. Its guide stays hidden with its name until you earn it — turn the spoiler setting off in the toolbar to read every guide up front.</p>'
    : `<p>${escapeHtml(trophy.guide)}</p>`;
  els.detail.innerHTML = `
    <div class="detail-head">
      <span class="medal medal-${trophy.grade}" aria-hidden="true">${gradeLetter(trophy.grade)}</span>
      <div>
        <div class="trophy-name">${name}</div>
        <div class="detail-grade">${gradeLabel(trophy.grade)}${trophy.hidden ? ' · Hidden on PS5' : ''}${trophy.count != null ? ` · Target: ${trophy.count.toLocaleString('en-US')}` : ''}</div>
      </div>
    </div>
    <p class="detail-official"><span class="official-label">Official description</span>${desc}</p>
    ${warning}
    <div class="detail-guide"><h3>Guide</h3>${guide}${steps}</div>
    ${unconfirmed}
    <div class="detail-sources"><h3>Sources</h3><ul>${sourceLinks(trophy, data.sources)}</ul></div>
    <div class="detail-actions">
      <button type="button" class="btn ${earned ? '' : 'btn-primary'}" id="detailToggle">${earned ? 'Mark as not earned' : 'Mark as earned'}</button>
    </div>`;
  els.detail.querySelector('#detailToggle').addEventListener('click', () => onToggle(trophy.id));
}

export function renderRoadmap(trophies, earned, el) {
  el.innerHTML = ROADMAP_STAGES.map((stage) => {
    const stageTrophies = trophies.filter((t) => t.stage === stage.stage);
    const done = stageTrophies.filter((t) => earned.has(t.id)).length;
    return `<li class="roadmap-stage">
      <div class="roadmap-stage-head">
        <span class="stage-num" aria-hidden="true">${stage.stage}</span>
        <h3>${escapeHtml(stage.title)}</h3>
        <span class="stage-time">${escapeHtml(stage.time)}</span>
      </div>
      <p>${escapeHtml(stage.text)}</p>
      <ul class="roadmap-trophies">${stageTrophies.map((t) => `<li class="${earned.has(t.id) ? 'is-earned' : ''}">${escapeHtml(t.name)}</li>`).join('')}</ul>
      <p class="stage-progress">${done} of ${stageTrophies.length} trophies in this stage earned</p>
    </li>`;
  }).join('');
}

export function renderMissable(trophies, data, el, onSelect) {
  const missable = trophies.filter((t) => t.missable);
  el.innerHTML = missable.map((t) => `
    <article class="missable-card">
      <h3>${escapeHtml(t.name)} <span class="tag tag-missable">Possibly missable</span></h3>
      <p class="trophy-desc"><span class="official-label">Official · </span>${escapeHtml(t.description)}</p>
      <p>${escapeHtml(t.guide)}</p>
      <div class="button-row"><button type="button" class="btn" data-open="${t.id}">Read the full guide</button></div>
      <p class="fineprint">Sources: ${t.sources.map((k) => escapeHtml((data.sources[k] || {}).name || k)).join('; ')}</p>
    </article>`).join('');
  el.querySelectorAll('[data-open]').forEach((btn) => {
    btn.addEventListener('click', () => onSelect(Number(btn.getAttribute('data-open'))));
  });
}

export function renderSources(data, el) {
  el.innerHTML = Object.values(data.sources).map((s) => {
    if (!s.url) return `<li>${escapeHtml(s.name)}</li>`;
    return `<li><a href="${escapeHtml(s.url)}" target="_blank" rel="noopener">${escapeHtml(s.name)}</a></li>`;
  }).join('');
}
