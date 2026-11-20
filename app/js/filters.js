// Filtering and the spoiler rule: which trophies the checklist shows, and
// which story trophies stay masked until they are earned.

// The filter chips and the trophy groups they match. "missable" matches the
// missable flag; the rest match the groups each trophy carries in the data.
const KIND_MATCH = {
  story: (t) => t.groups.includes('story'),
  missable: (t) => t.missable === true,
  collectibles: (t) => t.groups.includes('collectibles'),
  activities: (t) => t.groups.includes('activities'),
  side: (t) => t.groups.includes('side'),
};

export function filterTrophies(trophies, { query, kind, grade, hideEarned, earned }) {
  const q = (query || '').trim().toLowerCase();
  return trophies.filter((t) => {
    if (kind && kind !== 'all' && !KIND_MATCH[kind](t)) return false;
    if (grade && grade !== 'all' && t.grade !== grade) return false;
    if (hideEarned && earned.has(t.id)) return false;
    if (q) {
      const hay = `${t.name} ${t.description} ${t.kind}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

// A story trophy is masked while spoiler-free mode is on and it is not yet
// earned: the reader sees its grade and that it is a story trophy, but not
// its name or description, which would give away chapter and mission names.
export function isMasked(trophy, spoilersOn, earned) {
  return spoilersOn && trophy.kind === 'story' && !earned.has(trophy.id);
}

export function gradeLabel(grade) {
  return grade.charAt(0).toUpperCase() + grade.slice(1);
}

export function gradeLetter(grade) {
  return { platinum: 'P', gold: 'G', silver: 'S', bronze: 'B' }[grade] || '?';
}

export function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
