/* search.js — חיפוש הפוך במאגר התנ"ך */
(function (root) {
  'use strict';
  const G = root.Gem;

  let VERSES = null;      // [{r,t,g}]
  let WORDS = null;       // Map: word -> hechrechi
  let loading = null;

  function load() {
    if (loading) return loading;
    loading = fetch('data/verses.json')
      .then(r => r.json())
      .then(data => {
        VERSES = data;
        // אינדקס מילים ייחודיות
        WORDS = new Map();
        for (const v of VERSES) {
          for (const w of v.t.split(' ')) {
            if (!WORDS.has(w)) WORDS.set(w, G.hechrechi(w));
          }
        }
        return { verses: VERSES.length, words: WORDS.size };
      });
    return loading;
  }

  // ערך של טקסט לפי שיטה
  function valueByMethod(text, method) {
    switch (method) {
      case 'siduri': return G.siduri(text);
      case 'katan':  return G.katan(text);
      case 'kidmi':  return G.kidmi(text);
      default:       return G.hechrechi(text);
    }
  }

  // חיפוש מילים ששוות לערך נתון
  function searchWords(value, method, limit = 400) {
    if (!WORDS) return [];
    const out = [];
    if (method === 'hechrechi') {
      // אפשר להשתמש באינדקס המוכן
      for (const [w, v] of WORDS) {
        if (v === value) { out.push(w); if (out.length >= limit) break; }
      }
    } else {
      for (const w of WORDS.keys()) {
        if (valueByMethod(w, method) === value) { out.push(w); if (out.length >= limit) break; }
      }
    }
    // מיון לפי אורך ואז אלפביתי
    out.sort((a, b) => a.length - b.length || a.localeCompare(b, 'he'));
    return out;
  }

  // חיפוש פסוקים ששווים לערך נתון
  function searchVerses(value, method, limit = 200) {
    if (!VERSES) return [];
    const out = [];
    for (const v of VERSES) {
      const val = method === 'hechrechi' ? v.g : valueByMethod(v.t, method);
      if (val === value) { out.push(v); if (out.length >= limit) break; }
    }
    return out;
  }

  root.GemSearch = { load, searchWords, searchVerses, valueByMethod,
    get ready() { return !!VERSES; } };
})(typeof window !== 'undefined' ? window : globalThis);
