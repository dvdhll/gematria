// בונה את data/values_list.json מקובץ ה-RTF של הרב
// ("ערכים ומראי מקומות - גימטרייה"). שומר הדגשות כ-<b>.
//
// מבנה המסמך: כותרת = מספר מודגש בפסקה משלו; אחריה פסקאות ערכים.
// וריאנטים: "165 ע\"ע 330." (הפניה באותה שורה) · "166" (לא מודגש) ·
// "300 ו_700" / "504 ע\"ע. ו_496" (כותרת זוגית — הערכים מתויקים תחת שניהם).
//
// שימוש: node data/build_values_list.js "<path to rtf>"
const fs = require('fs');
const path = require('path');
const { parseRtf } = require('./parse_rtf.js');

const rtfPath = process.argv[2] ||
  path.join(__dirname, '..', '..', 'ערכים ומראי מקומות - גימטרייה - סיון תשפו.rtf');

const raw = fs.readFileSync(rtfPath, 'latin1');
const paras = parseRtf(raw).map(p => p.runs);
console.log('paragraphs:', paras.length);

const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const toHtml = runs => runs.map(r => (r.b ? '<b>' + esc(r.t) + '</b>' : esc(r.t))).join('')
  .replace(/<\/b><b>/g, '').replace(/\s+/g, ' ').trim();

// זיהוי כותרת: מחזיר {nums:[...], restRuns:[...]} או null
function parseHeader(p) {
  const whole = p.map(r => r.t).join('').trim();
  // כותרת זוגית: "300 ו_700" או "504 ע\"ע. ו_496" (קצרה, רק מספרים/ו_/ע"ע)
  const pair = /^(\d+)\s*(?:ע"ע\.?)?\s*ו_(\d+)\.?$/.exec(whole);
  if (pair && whole.length < 40 && p[0] && p[0].b) {
    return { nums: [parseInt(pair[1], 10), parseInt(pair[2], 10)], restRuns: [] };
  }
  // מספר חשוף בפסקה (גם לא מודגש — מופיע פעם אחת במקור)
  if (/^\d+$/.test(whole)) return { nums: [parseInt(whole, 10)], restRuns: [] };
  // ראן ראשון מודגש שהוא מספר טהור; השאר (למשל 'ע"ע 330.') הופך לערך
  const first = p[0];
  if (first && first.b && /^\s*\d+\s*$/.test(first.t)) {
    return { nums: [parseInt(first.t, 10)], restRuns: p.slice(1) };
  }
  return null;
}

const list = {};
let current = [];      // המספרים הפעילים (1 או 2 בכותרת זוגית)
let headers = 0;
paras.forEach((p, i) => {
  if (i < 9) return;   // פסקאות המבוא
  const h = parseHeader(p);
  if (h) {
    headers++;
    current = h.nums;
    for (const n of current) if (!list[n]) list[n] = [];
    const rest = toHtml(h.restRuns);
    if (rest) for (const n of current) list[n].push(rest);
    return;
  }
  if (!current.length) return;
  const html = toHtml(p);
  if (html) for (const n of current) list[n].push(html);
});

const outPath = path.join(__dirname, 'values_list.json');
fs.writeFileSync(outPath, JSON.stringify(list));
const totalEntries = Object.values(list).reduce((a, v) => a + v.length, 0);
console.log('headers:', headers, '| numbers:', Object.keys(list).length,
  '| entries:', totalEntries, '| KB:', (fs.statSync(outPath).size / 1024).toFixed(0));
// בדיקות שפיות
const t = (n, i) => (list[n] || [])[i] || '';
console.log('913[0]:', t(913, 0).slice(0, 60));
console.log('700[0]:', t(700, 0).slice(0, 60));
console.log('496 has לויתן?', (list[496] || []).some(e => e.includes('לויתן')));
console.log('26 entries:', (list[26] || []).length);
