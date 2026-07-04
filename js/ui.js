/* ui.js — קישור הממשק למנוע */
(function () {
  'use strict';
  const G = window.Gem, S = window.GemSearch;
  const $ = id => document.getElementById(id);
  const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };

  // רשימת שיטות ברמת המילה
  const METHODS = [
    { key: 'hechrechi', name: 'הכרחי', desc: 'הערך הרגיל', primary: true, fn: t => G.hechrechi(t) },
    { key: 'siduri',    name: 'סידורי', desc: 'מיקום האות 1–22', fn: t => G.siduri(t) },
    { key: 'katan',     name: 'קטן', desc: 'ספרה מצומצמת לכל אות', fn: t => G.katan(t) },
    { key: 'kidmi',     name: 'קדמי', desc: 'סכום מצטבר', fn: t => G.kidmi(t) },
    { key: 'katanMispari', name: 'קטן מספרי', desc: 'כל מילה מצומצמת לספרה', fn: t => G.katanMispari(t) },
    { key: 'katanAcharon', name: 'קטן מספרי אחרון', desc: 'צמצום לספרה בודדת', fn: t => G.katanMispariAcharon(t) },
    { key: 'gadol',     name: 'גדול', desc: 'סופיות 500–900', fn: t => G.hechrechi(t, { sofit: true }) },
    { key: 'milui',     name: 'מילוי (שמי)', desc: 'איות שם כל אות', fn: t => G.milui(t) },
    { key: 'imHakolel', name: 'עם הכולל', desc: 'הכרחי + 1', fn: t => G.imHakolel(t) },
    { key: 'mosaf',     name: 'מוסף', desc: 'הכרחי + מספר האותיות', fn: t => G.mosaf(t) },
    { key: 'merubaKlali', name: 'מרובע כללי', desc: 'הערך בריבוע', fn: t => G.merubaKlali(t) },
    { key: 'merubaPrati', name: 'מרובע פרטי', desc: 'סכום ריבועי האותיות', fn: t => G.merubaPrati(t) },
    { key: 'hakaah',    name: 'הכאה', desc: 'מכפלת האותיות', fn: t => G.hakaah(t) },
  ];

  let currentText = '';
  let currentNum = 0;

  function isNumeric(s) { return /^\s*\d+\s*$/.test(s); }

  function refresh() {
    const raw = $('mainInput').value;
    currentText = raw;
    const letters = G.onlyLetters(raw);
    if (letters) {
      currentNum = G.hechrechi(raw);
    } else if (isNumeric(raw)) {
      currentNum = parseInt(raw.trim(), 10);
    } else {
      currentNum = 0;
    }
    renderHeadline(letters);
    renderValues(letters);
    renderOps(letters);
    renderFigurate();
    renderSeries();
    // עדכון ברירת מחדל לחיפוש
    $('searchValue').value = currentNum;
  }

  function renderHeadline(letters) {
    const h = $('headline');
    if (letters) {
      h.innerHTML = `<div class="big">${G.hechrechi(currentText)}</div>
        <span class="big-label">ערך הכרחי</span>
        <div class="sub">${G.letterCount(currentText)} אותיות · ${G.wordCount(currentText)} מילים</div>`;
    } else if (currentNum) {
      h.innerHTML = `<div class="big">${currentNum}</div><span class="big-label">מספר</span>`;
    } else {
      h.innerHTML = `<div class="sub">הקלד טקסט עברי או מספר…</div>`;
    }
  }

  function renderValues(letters) {
    const grid = $('valuesGrid');
    grid.innerHTML = '';
    if (!letters) {
      grid.innerHTML = '<p class="sub" style="grid-column:1/-1;color:var(--muted)">— הזן טקסט עברי כדי לראות את ערכי המילה —</p>';
      $('breakdown').hidden = true;
      return;
    }
    METHODS.forEach(m => {
      const v = m.fn(currentText);
      const card = el('div', 'val-card' + (m.primary ? ' primary' : ''));
      card.innerHTML = `<div class="name">${m.name}</div><div class="value">${v}</div><div class="desc">${m.desc}</div>`;
      card.onclick = () => showBreakdown(m);
      grid.appendChild(card);
    });
  }

  function showBreakdown(m) {
    const b = $('breakdown');
    b.hidden = false;
    const value = m.fn(currentText);
    let rows = '';
    // פירוט אות-אות עבור השיטות הישירות
    const perLetter = { hechrechi:'hechrechi', siduri:'siduri', katan:'katan', kidmi:'kidmi', gadol:'hechrechi' };
    if (perLetter[m.key]) {
      const field = perLetter[m.key], sofit = (m.key === 'gadol');
      const chips = [...G.onlyLetters(currentText)].map(ch =>
        `<div class="letter-chip"><span class="l">${ch}</span><span class="v">${G.letterValue(ch, field, sofit)}</span></div>`).join('');
      rows = `<div class="letters-row">${chips}</div>`;
    } else if (m.key === 'hakaah') {
      const parts = [...G.onlyLetters(currentText)].map(ch => G.letterValue(ch,'hechrechi'));
      rows = `<div class="sub">${parts.join(' × ')} = <b class="hl">${value}</b></div>`;
    } else if (m.key === 'merubaPrati') {
      const parts = [...G.onlyLetters(currentText)].map(ch => { const x=G.letterValue(ch,'hechrechi'); return `${x}²`; });
      rows = `<div class="sub">${parts.join(' + ')} = <b class="hl">${value}</b></div>`;
    } else if (m.key === 'milui') {
      const chips = [...G.onlyLetters(currentText)].map(ch => {
        const base = G.FINAL_TO_BASE[ch] || ch; const name = G.MILUI[base] || ch;
        return `<div class="letter-chip"><span class="l">${name}</span><span class="v">${G.hechrechi(name)}</span></div>`;
      }).join('');
      rows = `<div class="letters-row">${chips}</div>`;
    }
    b.innerHTML = `<h4>${m.name}: <span class="hl">${value}</span></h4>${rows}
      <div class="search-link"><button class="chip" onclick="GemUI.searchFor(${value},'${m.key==='siduri'?'siduri':m.key==='katan'?'katan':m.key==='kidmi'?'kidmi':'hechrechi'}')">🔍 מצא בתנ״ך מילים/פסוקים ששווים ${value}</button></div>`;
  }

  // ---- פעולות ----
  function renderOps(letters) {
    renderHakaahPratit();
    // ממוצע
    const avg = $('avgResult');
    if (letters) {
      const byL = G.memutza(currentText, 'letters');
      const byW = G.memutza(currentText, 'words');
      let extra = '';
      if (byL.integer) {
        // כנפיים של שני איברים סביב הממוצע? נציג את הממוצע כשלם.
        extra = `<div class="eq-note">הממוצע הוא מספר שלם: <b class="hl">${byL.avg}</b></div>`;
      }
      avg.innerHTML = `לפי אותיות: ${byL.value} ÷ ${byL.count} = <b class="r-big">${round(byL.avg)}</b>` +
        (byW.count > 1 ? `<br>לפי מילים: ${byW.value} ÷ ${byW.count} = <b class="hl">${round(byW.avg)}</b>` : '') + extra;
    } else avg.innerHTML = '<span class="sub">הזן טקסט.</span>';
    // נקודה אמצעית
    const mid = $('midResult');
    if (currentNum) {
      const mp = G.midpoint(currentNum);
      mid.innerHTML = mp.type === 'odd'
        ? `${currentNum} אי-זוגי → נקודה אמצעית = <b class="r-big">${mp.middle}</b> <span class="sub">(סימון ${currentNum} ·&gt; ${mp.middle})</span>`
        : `${currentNum} זוגי → אין נקודה אמצעית. יחס ״שלם וחצי״: ${currentNum} ↔ <b class="r-big">${mp.half}</b>`;
    } else mid.innerHTML = '<span class="sub">—</span>';
  }

  function renderHakaahPratit() {
    const a = $('opA').value, b = $('opB').value;
    const res = G.hakaahPratit(a, b);
    const box = $('opResult');
    if (res.error) { box.innerHTML = `<div class="eq-note">${res.error} (${res.len1} מול ${res.len2})</div>`; return; }
    const rows = res.parts.map(p => `<td>${p.a}·${p.b}<br><b>${p.v1}×${p.v2}</b><br>${p.prod}</td>`).join('');
    box.innerHTML = `<table><tr>${rows}</tr></table>
      <div style="margin-top:8px">סכום = <b class="r-big">${res.total}</b></div>`;
  }

  // ---- מספרים צורניים ----
  function renderFigurate() {
    $('figValue').textContent = currentNum || 0;
    const idBox = $('figIdentify');
    idBox.innerHTML = '';
    if (currentNum) {
      const hits = G.identifyFigurate(currentNum);
      if (hits.length) {
        hits.forEach(h => idBox.appendChild(el('span', 'chip', `${G.FIGURATE[h.type].he} · האיבר ה-${h.index}`)));
      } else {
        idBox.appendChild(el('span', 'chip none', 'אינו מספר צורני בסיסי'));
      }
    } else idBox.appendChild(el('span', 'chip none', '—'));
    renderFigGen();
  }

  function renderFigGen() {
    const type = $('figType').value;
    const n = Math.max(1, parseInt($('figN').value || '1', 10));
    const t = G.FIGURATE[type];
    const ofN = G.figurateOf(type, n);
    const series = G.figurateSeries(type, Math.max(n + 3, 10));
    const nth = G.figurateSeries(type, n)[n - 1];
    const list = series.map((x, i) => (i === n - 1) ? `<b>${x}</b>` : x).join(' ');
    $('figGen').innerHTML =
      `<div>ה${t.he} <b>של ${n}</b> = <b class="r-big">${ofN}</b>` +
      (nth !== ofN ? ` &nbsp;·&nbsp; ה${t.he} ה-${n} בסדרה = <b class="hl">${nth}</b>` : '') + `</div>
      <div class="series-list">${list}</div>`;
    $('figDots').innerHTML = drawDots(type, n);
  }

  function drawDots(type, n) {
    if (n > 14) return '<span class="sub">(גדול מדי לציור)</span>';
    let rows = [];
    if (type === 'triangle' || type === 'yahalom' || type === 'chava') {
      for (let i = 1; i <= n; i++) rows.push('● '.repeat(i));
    } else if (type === 'square') {
      for (let i = 0; i < n; i++) rows.push('● '.repeat(n));
    } else if (type === 'cube') {
      return '<span class="sub">' + n + '×' + n + '×' + n + ' = ' + (n*n*n) + '</span>';
    } else {
      return '';
    }
    return rows.map(r => `<div class="r">${r.trim()}</div>`).join('');
  }

  // ---- סדרות ----
  function renderSeries() {
    const gs = G.goldenSection(currentNum || 0);
    $('goldenResult').innerHTML = currentNum
      ? `gs(${currentNum}) = ( עליון <b class="hl">${gs.upper}</b> , תחתון <b class="hl">${gs.lower}</b> )
         <div class="sub">היחס ${gs.lower}/${gs.upper} ≈ ${round(gs.lower/(gs.upper||1))} (φ≈1.618)</div>`
      : '<span class="sub">—</span>';
    const seq = currentNum ? G.additiveSeriesFor(currentNum, 20) : [];
    $('additiveResult').innerHTML = seq.length
      ? `<div class="series-list">${seq.map(x => x === currentNum ? `<b>${x}</b>` : x).join(' ')}</div>`
      : '<span class="sub">—</span>';
    renderDiff();
    $('fibResult').innerHTML = `<div class="series-list">${G.fibonacci(16).join(' ')}</div>`;
  }

  function renderDiff() {
    const nums = $('diffInput').value.split(/[,\s]+/).map(Number).filter(x => !isNaN(x));
    if (nums.length < 2) { $('diffResult').innerHTML = '<span class="sub">הזן לפחות שני מספרים.</span>'; return; }
    const tri = G.differenceTriangle(nums);
    const rows = tri.map(r => `<div class="r">${r.join('  ')}</div>`).join('');
    const base = tri[tri.length - 1];
    $('diffResult').innerHTML = `<div class="dots">${rows}</div>
      <div class="eq-note">בסיס הסדרה: <b class="hl">${base.join(', ')}</b></div>`;
  }

  // ---- חיפוש בתנ"ך ----
  let searchScope = 'words';
  function initSearch() {
    S.load().then(info => {
      $('searchStatus').textContent = `המאגר נטען: ${info.verses.toLocaleString('he')} פסוקים · ${info.words.toLocaleString('he')} מילים ייחודיות.`;
      runSearch();
    }).catch(() => { $('searchStatus').textContent = 'שגיאה בטעינת המאגר.'; });
  }
  function runSearch() {
    if (!S.ready) return;
    const value = parseInt($('searchValue').value || '0', 10);
    const method = $('searchMethod').value;
    const box = $('searchResults');
    box.innerHTML = '';
    if (!value) { box.innerHTML = '<span class="sub">הזן ערך.</span>'; return; }
    if (searchScope === 'words') {
      const ws = S.searchWords(value, method);
      $('searchStatus').textContent = `${ws.length} מילים ${ws.length >= 400 ? '(מוצגות 400 ראשונות) ' : ''}ששוות ${value} בשיטת ${methodLabel(method)}:`;
      const wrap = el('div', ''); wrap.id = 'wordResults';
      ws.forEach(w => { const c = el('span', 'res-word', w); c.onclick = () => { $('mainInput').value = w; refresh(); switchTab('values'); }; wrap.appendChild(c); });
      box.appendChild(wrap);
    } else {
      const vs = S.searchVerses(value, method);
      $('searchStatus').textContent = `${vs.length} פסוקים ${vs.length >= 200 ? '(מוצגים 200 ראשונים) ' : ''}ששווים ${value} בשיטת ${methodLabel(method)}:`;
      vs.forEach(v => { box.appendChild(el('div', 'res-verse', `<div class="ref">${v.r}</div><div class="txt">${v.t}</div>`)); });
    }
  }
  function methodLabel(m){return {hechrechi:'הכרחי',siduri:'סידורי',katan:'קטן',kidmi:'קדמי'}[m]||m;}

  // גישור מבחוץ (מכפתור הפירוט)
  window.GemUI = {
    searchFor(value, method) {
      $('searchValue').value = value;
      $('searchMethod').value = method;
      switchTab('search');
      if (!S.ready) initSearch(); else runSearch();
    }
  };

  // ---- טאבים ----
  function switchTab(name) {
    document.querySelectorAll('.tabs button').forEach(b => b.classList.toggle('active', b.dataset.tab === name));
    document.querySelectorAll('.tab').forEach(t => t.hidden = (t.id !== 'tab-' + name));
    if (name === 'search' && !S.ready) initSearch();
  }

  function round(x){ return Math.round(x*1000)/1000; }

  // ---- אתחול ----
  function init() {
    // מילוי בורר סוגי צורניים
    const sel = $('figType');
    Object.keys(G.FIGURATE).forEach(k => { const o = el('option', '', G.FIGURATE[k].he); o.value = k; sel.appendChild(o); });

    $('mainInput').addEventListener('input', refresh);
    $('opA').addEventListener('input', renderHakaahPratit);
    $('opB').addEventListener('input', renderHakaahPratit);
    $('figType').addEventListener('change', renderFigGen);
    $('figN').addEventListener('input', renderFigGen);
    $('diffInput').addEventListener('input', renderDiff);
    $('searchValue').addEventListener('input', runSearch);
    $('searchMethod').addEventListener('change', runSearch);

    document.querySelectorAll('.tabs button').forEach(b => b.onclick = () => { switchTab(b.dataset.tab); history.replaceState(null,'','#'+b.dataset.tab); });
    document.querySelectorAll('.scope-toggle button').forEach(b => b.onclick = () => {
      searchScope = b.dataset.scope;
      document.querySelectorAll('.scope-toggle button').forEach(x => x.classList.toggle('active', x === b));
      runSearch();
    });

    // דיפ-לינק: ?q=טקסט  ו-#tab
    const params = new URLSearchParams(location.search);
    if (params.get('q')) $('mainInput').value = params.get('q');
    if (params.get('v')) $('searchValue').value = params.get('v');
    refresh();
    const tab = (location.hash || '').replace('#', '');
    if (['values','ops','figurate','series','search'].includes(tab)) switchTab(tab);
  }
  document.addEventListener('DOMContentLoaded', init);
})();
