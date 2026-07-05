// פרסר RTF ממוקד: מחלץ פסקאות עם ראנים של טקסט+הדגשה מקובץ Word RTF (cp1255).
// הדגשה בעברית = \ab (complex script bold); כללי = \b. שומרים אם אחד מהם דלוק.
const fs = require('fs');

const SKIP_DESTS = new Set(['fonttbl','colortbl','stylesheet','info','themedata','colorschememapping',
  'latentstyles','datastore','rsidtbl','generator','pict','object','header','footer','headerl','headerr',
  'footerl','footerr','headerf','footerf','pnseclvl','listtable','listoverridetable','ftnsep','ftnsepc',
  'aftnsep','aftnsepc','xmlnstbl','mmathPr','wgrffmtfilter','defchp','defpap']);

// cp1255 -> unicode (טווח 0x80-0xFF)
const CP1255 = (() => {
  const m = new Array(256);
  for (let i = 0; i < 128; i++) m[i] = i;
  const hi = {
    0x80:0x20AC,0x82:0x201A,0x83:0x0192,0x84:0x201E,0x85:0x2026,0x86:0x2020,0x87:0x2021,
    0x88:0x02C6,0x89:0x2030,0x8B:0x2039,0x91:0x2018,0x92:0x2019,0x93:0x201C,0x94:0x201D,
    0x95:0x2022,0x96:0x2013,0x97:0x2014,0x98:0x02DC,0x99:0x2122,0x9B:0x203A,0xA0:0x00A0,
    0xA1:0x00A1,0xA2:0x00A2,0xA3:0x00A3,0xA4:0x20AA,0xA5:0x00A5,0xA6:0x00A6,0xA7:0x00A7,
    0xA8:0x00A8,0xA9:0x00A9,0xAA:0x00D7,0xAB:0x00AB,0xAC:0x00AC,0xAD:0x00AD,0xAE:0x00AE,
    0xAF:0x00AF,0xB0:0x00B0,0xB1:0x00B1,0xB2:0x00B2,0xB3:0x00B3,0xB4:0x00B4,0xB5:0x00B5,
    0xB6:0x00B6,0xB7:0x00B7,0xB8:0x00B8,0xB9:0x00B9,0xBA:0x00F7,0xBB:0x00BB,0xBC:0x00BC,
    0xBD:0x00BD,0xBE:0x00BE,0xBF:0x00BF,0xB2:0x00B2,
    0xC0:0x05B0,0xC1:0x05B1,0xC2:0x05B2,0xC3:0x05B3,0xC4:0x05B4,0xC5:0x05B5,0xC6:0x05B6,
    0xC7:0x05B7,0xC8:0x05B8,0xC9:0x05B9,0xCB:0x05BB,0xCC:0x05BC,0xCD:0x05BD,0xCE:0x05BE,
    0xCF:0x05BF,0xD0:0x05C0,0xD1:0x05C1,0xD2:0x05C2,0xD3:0x05C3,0xD4:0x05F0,0xD5:0x05F1,
    0xD6:0x05F2,0xD7:0x05F3,0xD8:0x05F4,
    0xE0:0x05D0,0xE1:0x05D1,0xE2:0x05D2,0xE3:0x05D3,0xE4:0x05D4,0xE5:0x05D5,0xE6:0x05D6,
    0xE7:0x05D7,0xE8:0x05D8,0xE9:0x05D9,0xEA:0x05DA,0xEB:0x05DB,0xEC:0x05DC,0xED:0x05DD,
    0xEE:0x05DE,0xEF:0x05DF,0xF0:0x05E0,0xF1:0x05E1,0xF2:0x05E2,0xF3:0x05E3,0xF4:0x05E4,
    0xF5:0x05E5,0xF6:0x05E6,0xF7:0x05E7,0xF8:0x05E8,0xF9:0x05E9,0xFA:0x05EA,0xFD:0x200E,0xFE:0x200F,
  };
  for (let i = 128; i < 256; i++) m[i] = hi[i] !== undefined ? hi[i] : i;
  return m;
})();

function parseRtf(src) {
  const paras = [];       // [{runs:[{t,b}]}]
  let cur = { runs: [] };
  const stack = [];
  let state = { b: false, ab: false, skip: 0 };   // skip>0 = בתוך destination מדולג
  let uc = 1;             // כמה תווי fallback לדלג אחרי \uN
  let i = 0;
  const n = src.length;

  function emit(text) {
    if (state.skip) return;
    if (!text) return;
    const bold = state.b || state.ab;
    const runs = cur.runs;
    const last = runs[runs.length - 1];
    if (last && last.b === bold) last.t += text;
    else runs.push({ t: text, b: bold });
  }
  function endPara() {
    if (state.skip) return;
    if (cur.runs.some(r => r.t.trim())) paras.push(cur);
    cur = { runs: [] };
  }

  while (i < n) {
    const ch = src[i];
    if (ch === '{') { stack.push({ ...state }); i++; continue; }
    if (ch === '}') { state = stack.pop() || state; i++; continue; }
    if (ch === '\\') {
      // control
      const m = /^\\([a-zA-Z]+)(-?\d+)? ?/.exec(src.slice(i, i + 32));
      if (m) {
        const word = m[1], num = m[2] !== undefined ? parseInt(m[2], 10) : null;
        i += m[0].length;
        if (SKIP_DESTS.has(word)) { state.skip = 1; continue; }
        switch (word) {
          case 'par': case 'sect': case 'page': endPara(); break;
          case 'cell': case 'tab': emit(' '); break;
          case 'line': emit(' '); break;
          case 'b': state.b = num !== 0; break;
          case 'ab': state.ab = num !== 0; break;
          case 'plain': case 'pard': if (word === 'plain') { state.b = false; state.ab = false; } break;
          case 'uc': uc = num ?? 1; break;
          case 'u': {
            let code = num;
            if (code < 0) code += 65536;
            emit(String.fromCharCode(code));
            // דילוג על תווי fallback
            let skipped = 0;
            while (skipped < uc && i < n) {
              if (src[i] === '\\' && src[i+1] === "'") { i += 4; skipped++; }
              else if (src[i] === '{' || src[i] === '}' || src[i] === '\\') break;
              else { i++; skipped++; }
            }
            break;
          }
          case 'emdash': emit('—'); break;
          case 'endash': emit('–'); break;
          case 'lquote': emit('‘'); break;
          case 'rquote': emit('’'); break;
          case 'ldblquote': emit('“'); break;
          case 'rdblquote': emit('”'); break;
          case 'bullet': emit('•'); break;
          case 'ltrmark': case 'rtlmark': case 'zwj': case 'zwnj': break;
          default: break; // שאר הפקודות — מתעלמים
        }
        continue;
      }
      // \'xx hex
      if (src[i + 1] === "'") {
        const hex = src.slice(i + 2, i + 4);
        const code = parseInt(hex, 16);
        emit(String.fromCharCode(CP1255[code] ?? code));
        i += 4;
        continue;
      }
      // \{ \} \\
      if (src[i + 1] === '{' || src[i + 1] === '}' || src[i + 1] === '\\') { emit(src[i + 1]); i += 2; continue; }
      // \* destination — אם לא מוכר, מדלגים על הקבוצה
      if (src[i + 1] === '*') { state.skip = 1; i += 2; continue; }
      i++;
      continue;
    }
    if (ch === '\r' || ch === '\n') { i++; continue; }
    // טקסט רגיל עד התו המיוחד הבא
    let j = i;
    while (j < n && src[j] !== '\\' && src[j] !== '{' && src[j] !== '}' && src[j] !== '\r' && src[j] !== '\n') j++;
    emit(src.slice(i, j));
    i = j;
  }
  endPara();
  return paras;
}

module.exports = { parseRtf };

// ---- הרצה ישירה ----
if (require.main === module) {
  const file = process.argv[2];
  const raw = fs.readFileSync(file, 'latin1'); // בתים כ-latin1; \'xx כבר ממופה ידנית
  const paras = parseRtf(raw);
  console.error('paragraphs:', paras.length);
  const out = paras.map(p => p.runs);
  fs.writeFileSync(process.argv[3] || 'paras.json', JSON.stringify(out), 'utf8');
  const N = Math.min(parseInt(process.argv[4] || '40', 10), paras.length);
  for (let k = 0; k < N; k++) {
    const line = paras[k].runs.map(r => (r.b ? '**' + r.t + '**' : r.t)).join('');
    console.error(k + ': ' + line.slice(0, 120));
  }
}
