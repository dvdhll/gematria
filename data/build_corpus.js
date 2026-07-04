// בונה את מאגר התנ"ך לחיפוש הפוך. מוריד מ-Sefaria, שומר שתי גרסאות לכל פסוק:
//   v = מנוקדת (לתצוגה: בלי טעמים/מתג/פיסוק, עם ניקוד ומקף)
//   t = חשופה (לחישוב: בלי ניקוד, מקף -> רווח כדי שלא יודבקו מילים)
// ומחשב ערך הכרחי g. פלט: data/verses.v2.json + data/meta.json.
const fs = require('fs');
const path = require('path');
const Gem = require('../js/gematria.js');

const BOOKS = [
  'Genesis','Exodus','Leviticus','Numbers','Deuteronomy',
  'Joshua','Judges','I Samuel','II Samuel','I Kings','II Kings',
  'Isaiah','Jeremiah','Ezekiel',
  'Hosea','Joel','Amos','Obadiah','Jonah','Micah','Nahum','Habakkuk','Zephaniah','Haggai','Zechariah','Malachi',
  'Psalms','Proverbs','Job','Song of Songs','Ruth','Lamentations','Ecclesiastes','Esther','Daniel','Ezra','Nehemiah','I Chronicles','II Chronicles',
];

// מספרים עבריים לפרק/פסוק
function heNum(n) {
  const ones = ['','א','ב','ג','ד','ה','ו','ז','ח','ט'];
  const tens = ['','י','כ','ל','מ','נ','ס','ע','פ','צ'];
  const huns = ['','ק','ר','ש','ת','תק','תר','תש','תת','תתק'];
  let s = '';
  s += huns[Math.floor(n/100)%10] || '';
  let t = Math.floor(n/10)%10, o = n%10;
  if (t===1 && o===5) return s+'טו';
  if (t===1 && o===6) return s+'טז';
  s += tens[t] + ones[o];
  return s || String(n);
}

// טווחי יוניקוד (escapes מפורשים — לא תווים משולבים גולמיים בקוד):
// U+0591–U+05AF טעמים · U+05BD מתג · U+05C0 פסק · U+05C3 סוף-פסוק · U+05C4–U+05C6 נקודות
// ניקוד שנשמר: U+05B0–U+05BC, U+05C1 (שי"ן ימנית), U+05C2 (שמאלית), U+05C7 · U+05BE מקף
const RE_TAAMIM  = /[֑-ֽ֯׀׃-׆]/g;
const RE_KEEP_V  = /[^ְ-ׇּׁׂ־א-ת ]/g;
const RE_NIQQUD  = /[ְ-ׇּׁׂ]/g;
const RE_MAQAF   = /־/g;

// גרסה מנוקדת לתצוגה
function cleanVocalized(str) {
  const s = String(str)
    .replace(/<[^>]+>/g, '')            // תגי HTML
    .replace(RE_TAAMIM, '')             // טעמים, מתג, פיסוק
    .replace(RE_KEEP_V, ' ')            // כל השאר -> רווח (סוגריים, לועזית וכו')
    .replace(/ ?־ ?/g, '־')   // בלי רווחים סביב מקף
    .replace(/\s+/g, ' ')
    .trim();
  // סינון סימוני פרשיות: ס/פ בודדות (בלי ניקוד) אינן מילים — ולא ייספרו בגימטרייה
  return s.split(' ').filter(tok => tok !== 'ס' && tok !== 'פ').join(' ');
}
// גרסה חשופה לחישוב
function cleanPlain(vocalized) {
  return vocalized
    .replace(RE_NIQQUD, '')             // ניקוד
    .replace(RE_MAQAF, ' ')             // מקף -> רווח (!)
    .replace(/[^א-ת ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

async function fetchBook(name, tries = 4) {
  const url = 'https://www.sefaria.org/api/v3/texts/' + encodeURIComponent(name) + '?version=hebrew';
  for (let i = 0; i < tries; i++) {
    try {
      const r = await fetch(url);
      const d = await r.json();
      const v = d.versions && d.versions[0];
      if (!v || !v.text) throw new Error('no text');
      return { he: d.heTitle, text: v.text };
    } catch (e) {
      if (i === tries - 1) throw e;
      await new Promise(res => setTimeout(res, 800));
    }
  }
}

(async () => {
  const verses = [];
  for (const book of BOOKS) {
    process.stdout.write('· ' + book + ' … ');
    const { he, text } = await fetchBook(book);
    let count = 0;
    text.forEach((chap, ci) => {
      chap.forEach((verseText, vi) => {
        const v = cleanVocalized(verseText);
        const t = cleanPlain(v);
        if (!t) return;
        const ref = he + ' ' + heNum(ci + 1) + ':' + heNum(vi + 1);
        verses.push({ r: ref, t, v, g: Gem.hechrechi(t) });
        count++;
      });
    });
    console.log(count + ' פסוקים');
  }

  const outDir = path.join(__dirname);
  fs.writeFileSync(path.join(outDir, 'verses.v2.json'), JSON.stringify(verses));
  const meta = {
    verses: verses.length,
    words: verses.reduce((a, v) => a + v.t.split(' ').length, 0),
    built: 'Sefaria (Tanach with Ta\'amei Hamikra); v=מנוקד, t=חשוף (מקף=רווח)',
  };
  fs.writeFileSync(path.join(outDir, 'meta.json'), JSON.stringify(meta, null, 2));
  const kb = (fs.statSync(path.join(outDir, 'verses.v2.json')).size / 1024).toFixed(0);
  console.log(`\nסה"כ ${meta.verses} פסוקים, ${meta.words} מילים, ${kb}KB`);
  // בדיקת שפיות: בראשית א:א
  const first = verses[0];
  console.log('sanity:', first.r, '| g=', first.g, '| t=', first.t);
  console.log('vocalized:', first.v);
  const kivrat = verses.find(x => x.t.includes('כברת ארץ'));
  console.log('מקף פוצל?', kivrat ? 'כן — ' + kivrat.r : 'לא נמצא "כברת ארץ"');
})();
