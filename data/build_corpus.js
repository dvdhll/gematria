// בונה את מאגר התנ"ך לחיפוש הפוך. מוריד מ-Sefaria, מנקה ניקוד/טעמים/HTML,
// מחשב ערך הכרחי לכל פסוק, ושומר data/verses.json + data/meta.json.
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

function clean(str) {
  return String(str)
    .replace(/<[^>]+>/g, '')          // תגי HTML
    .replace(/[֑-ׇ]/g, '')  // ניקוד וטעמים
    .replace(/[׀-׏]/g, ' ')            // פיסוק עברי
    .replace(/[^א-ת]+/g, ' ')// כל מה שאינו אות א..ת -> רווח
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
        const t = clean(verseText);
        if (!t) return;
        const ref = he + ' ' + heNum(ci + 1) + ':' + heNum(vi + 1);
        verses.push({ r: ref, t, g: Gem.hechrechi(t) });
        count++;
      });
    });
    console.log(count + ' פסוקים');
  }

  const outDir = path.join(__dirname);
  fs.writeFileSync(path.join(outDir, 'verses.json'), JSON.stringify(verses));
  const meta = {
    verses: verses.length,
    words: verses.reduce((a, v) => a + v.t.split(' ').length, 0),
    built: 'Sefaria (Tanach with Ta\'amei Hamikra), ניקוד/טעמים הוסרו',
  };
  fs.writeFileSync(path.join(outDir, 'meta.json'), JSON.stringify(meta, null, 2));
  const kb = (fs.statSync(path.join(outDir, 'verses.json')).size / 1024).toFixed(0);
  console.log(`\nסה"כ ${meta.verses} פסוקים, ${meta.words} מילים, ${kb}KB`);
})();
