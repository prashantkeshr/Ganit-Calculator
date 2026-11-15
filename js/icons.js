/**
 * Premium SVG icon system — thin-line, 24×24 viewBox
 * Used across sidebar, header, and calculator tabs
 */

const ico = (d, extra = '') =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" ${extra}>${d}</svg>`;

export const Icons = {
  // ── UI chrome ──────────────────────────────────────────────────
  search:      ico('<circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>'),
  history:     ico('<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>'),
  theme:       ico('<circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>'),
  menu:        ico('<line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>'),
  chevronDown: ico('<polyline points="6 9 12 15 18 9"/>'),
  chevronRight:ico('<polyline points="9 18 15 12 9 6"/>'),
  close:       ico('<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>'),
  star:        ico('<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>'),
  starFilled:  ico('<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" fill="currentColor"/>'),
  trash:       ico('<polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>'),
  swap:        ico('<polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>'),
  add:         ico('<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>'),
  keyboard:    ico('<rect x="2" y="6" width="20" height="12" rx="2"/><path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M8 14h8"/>'),

  // ── Calculator categories ──────────────────────────────────────
  basic:       ico('<rect x="4" y="4" width="6" height="6" rx="1"/><rect x="14" y="4" width="6" height="6" rx="1"/><rect x="4" y="14" width="6" height="6" rx="1"/><rect x="14" y="14" width="6" height="6" rx="1"/>'),
  scientific:  ico('<path d="M4 20L8 4"/><path d="M20 20L16 4"/><path d="M6 12h12"/><circle cx="17" cy="8" r="1" fill="currentColor"/><circle cx="7" cy="16" r="1" fill="currentColor"/>'),
  engineering: ico('<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M2 12h3M19 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12"/>'),
  graph:       ico('<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>'),
  equation:    ico('<path d="M5 12h14"/><path d="M12 5l7 7-7 7"/>'),
  calculus:    ico('<path d="M3 12c0-4.97 4.03-9 9-9s9 4.03 9 9-4.03 9-9 9"/><path d="M12 7v5l3 3"/>'),
  matrix:      ico('<rect x="3" y="3" width="4" height="4"/><rect x="10" y="3" width="4" height="4"/><rect x="17" y="3" width="4" height="4"/><rect x="3" y="10" width="4" height="4"/><rect x="10" y="10" width="4" height="4"/><rect x="17" y="10" width="4" height="4"/><rect x="3" y="17" width="4" height="4"/><rect x="10" y="17" width="4" height="4"/><rect x="17" y="17" width="4" height="4"/>'),
  statistics:  ico('<line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/>'),
  financial:   ico('<line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>'),
  datetime:    ico('<rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>'),
  health:      ico('<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>'),
  construction:ico('<polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>'),
  physics:     ico('<circle cx="12" cy="12" r="1" fill="currentColor"/><path d="M20.2 20.2c2.04-2.03.02-7.36-4.5-11.9C11.17 3.77 5.84 1.75 3.8 3.8c-2.04 2.03-.02 7.36 4.5 11.9 4.53 4.53 9.86 6.56 11.9 4.5z"/><path d="M15.7 15.7c4.52-4.54 6.54-9.87 4.5-11.9-2.03-2.04-7.36-.02-11.9 4.5"/>')  ,
  programmer:  ico('<polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>'),
  age:         ico('<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>'),
  currency:    ico('<circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/>'),
  area:        ico('<path d="M3 3h7v7H3z"/><path d="M14 3h7v7h-7z"/><path d="M14 14h7v7h-7z"/><path d="M3 14h7v7H3z"/>'),
  percentage:  ico('<line x1="19" y1="5" x2="5" y2="19"/><circle cx="6.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/>'),
  unit:        ico('<path d="M8 3H5a2 2 0 0 0-2 2v14c0 1.1.9 2 2 2h3"/><path d="M16 3h3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-3"/><line x1="12" y1="20" x2="12" y2="4"/>'),
  gpa:         ico('<path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/>'),

  // ── Tool-level icons ───────────────────────────────────────────
  loan:        ico('<path d="M2 10h20"/><path d="M2 14h6"/><path d="M2 18h6"/><rect x="2" y="6" width="20" height="14" rx="2"/>'),
  bmi:         ico('<path d="M12 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6z"/><path d="M12 10c-5 0-8 2.5-8 5v2h16v-2c0-2.5-3-5-8-5z"/><path d="M6 17v2M18 17v2"/>'),
  derivative:  ico('<path d="M3 12c0-5 3-9 9-9s9 4 9 9"/><path d="M12 7v5l4 2"/>'),
  integral:    ico('<path d="M8 3c-1.5 0-3 1-3 3v12c0 2 1.5 3 3 3"/><path d="M16 3c1.5 0 3 1 3 3v12c0 2-1.5 3-3 3"/>'),

  // ── Misc ───────────────────────────────────────────────────────
  copy:        ico('<rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>'),
  download:    ico('<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>'),
  share:       ico('<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>'),
  info:        ico('<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>'),
  arrowRight:  ico('<line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>'),
};

/** Render an icon with optional size and class */
export function icon(name, { size = 20, cls = '' } = {}) {
  const svg = Icons[name] || Icons.basic;
  return svg.replace('<svg ', `<svg width="${size}" height="${size}" class="icon${cls ? ' ' + cls : ''}" aria-hidden="true" `);
}

/** Category icon map — matches registry.js category IDs */
export const CAT_ICONS = {
  basic:        Icons.basic,
  scientific:   Icons.scientific,
  engineering:  Icons.engineering,
  graph:        Icons.graph,
  equation:     Icons.equation,
  calculus:     Icons.calculus,
  matrix:       Icons.matrix,
  statistics:   Icons.statistics,
  financial:    Icons.financial,
  datetime:     Icons.datetime,
  health:       Icons.health,
  construction: Icons.construction,
  physics:      Icons.physics,
  programmer:   Icons.programmer,
  age:          Icons.age,
  currency:     Icons.currency,
  area:         Icons.area,
  percentage:   Icons.percentage,
  unit:         Icons.unit,
  gpa:          Icons.gpa,
};
