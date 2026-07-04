// בדיקות מול הדוגמאות המדויקות שבמסמך "מבוא לגימטריא"
const Gem = require('../js/gematria.js');

let pass = 0, fail = 0;
function eq(name, got, want) {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (ok) { pass++; }
  else { fail++; console.log(`✗ ${name}: got ${JSON.stringify(got)} want ${JSON.stringify(want)}`); }
}

const V = 'בראשית ברא אלהים את השמים ואת הארץ';

// ערכי מילים בודדות (עמ' ב)
eq('בראשית hechrechi', Gem.hechrechi('בראשית'), 913);
eq('ברא hechrechi', Gem.hechrechi('ברא'), 203);
eq('אלהים hechrechi', Gem.hechrechi('אלהים'), 86);
eq('את hechrechi', Gem.hechrechi('את'), 401);
eq('השמים hechrechi', Gem.hechrechi('השמים'), 395);
eq('ואת hechrechi', Gem.hechrechi('ואת'), 407);
eq('הארץ hechrechi', Gem.hechrechi('הארץ'), 296);

// הפסוק כולו — 5 רמות (עמ' ב-ג)
eq('פסוק הכרחי = 2701', Gem.hechrechi(V), 2701);
eq('פסוק סידורי = 298', Gem.siduri(V), 298);
eq('פסוק קטן = 82', Gem.katan(V), 82);
eq('פסוק קטן מספרי = 37', Gem.katanMispari(V), 37);

// מספר קטן: נח = 13, קטן מספרי = 4 (עמ' ב)
eq('נח קטן = 13', Gem.katan('נח'), 13);
eq('נח קטן מספרי = 4', Gem.katanMispari('נח'), 4);
eq('חן קטן = 13', Gem.katan('חן'), 13);

// ערך סידורי של מילים בפסוק (עמ' ב): בראשית=76, ברא=23, אלהים=41...
eq('בראשית סידורי = 76', Gem.siduri('בראשית'), 76);
eq('ברא סידורי = 23', Gem.siduri('ברא'), 23);
eq('אלהים סידורי = 41', Gem.siduri('אלהים'), 41);
eq('השמים סידורי = 62', Gem.siduri('השמים'), 62);
eq('הארץ סידורי = 44', Gem.siduri('הארץ'), 44);

// הכאה (עמ' ג-ד): אני = 500 ; יהוה = 1500
eq('אני הכאה = 500', Gem.hakaah('אני'), 1 * 50 * 10);
eq('יהוה הכאה = 1500', Gem.hakaah('יהוה'), 10 * 5 * 6 * 5);

// הכאה פרטית: אדם·חיה = רמח (248) (עמ' ד)
eq('אדם·חיה הכאה פרטית = 248', Gem.hakaahPratit('אדם', 'חיה').total, 248);
eq('רמח = 248', Gem.hechrechi('רמח'), 248);

// ממוצע (עמ' ד): יוסף=156 -> /4 = 39 = יהוה = אחד
eq('יוסף = 156', Gem.hechrechi('יוסף'), 156);
eq('יוסף ממוצע = 39', Gem.memutza('יוסף').avg, 39);
eq('יהוה = 26', Gem.hechrechi('יהוה'), 26);
eq('אחד = 13', Gem.hechrechi('אחד'), 13);
// אדם חוה = 64 -> /2 = 32 = לב
eq('אדם חוה = 64', Gem.hechrechi('אדם חוה'), 64);
eq('אדם חוה ממוצע(אותיות) = ...', Gem.memutza('אדם חוה').value, 64);
eq('לב = 32', Gem.hechrechi('לב'), 32);

// טבלת אותיות — נ (עמ' א): הכרחי50 סידורי14 קטן5 קדמי195
eq('נ הכרחי', Gem.LETTER['נ'].hechrechi, 50);
eq('נ סידורי', Gem.LETTER['נ'].siduri, 14);
eq('נ קטן', Gem.LETTER['נ'].katan, 5);
eq('נ קדמי', Gem.LETTER['נ'].kidmi, 195);
eq('א קדמי', Gem.LETTER['א'].kidmi, 1);
eq('ב קדמי', Gem.LETTER['ב'].kidmi, 3);
eq('ג קדמי', Gem.LETTER['ג'].kidmi, 6);
eq('ד קדמי', Gem.LETTER['ד'].kidmi, 10);
eq('י קדמי', Gem.LETTER['י'].kidmi, 55);
eq('ת קדמי', Gem.LETTER['ת'].kidmi, 1495);

// סופיות: ברירת מחדל = פשוטה ; גדול = 500..900
eq('ן רגיל = 50', Gem.hechrechi('ן'), 50);
eq('ן גדול = 700', Gem.hechrechi('ן', { sofit: true }), 700);

// מספרים צורניים — סדרות (עמ' ז-טז)
eq('משולש', Gem.figurateSeries('triangle', 10), [1,3,6,10,15,21,28,36,45,55]);
eq('מרובע', Gem.figurateSeries('square', 8), [1,4,9,16,25,36,49,64]);
eq('השראה', Gem.figurateSeries('inspire', 8), [1,5,13,25,41,61,85,113]);
eq('יהלם', Gem.figurateSeries('yahalom', 8), [2,6,12,20,30,42,56,72]);
eq('חוה', Gem.figurateSeries('chava', 8), [1,5,11,19,29,41,55,71]);
eq('ברית', Gem.figurateSeries('brit', 8), [1,3,7,13,21,31,43,57]);
eq('חשמל', Gem.figurateSeries('chashmal', 8), [1,5,12,22,35,51,70,92]);
eq('בית', Gem.figurateSeries('bayit', 8), [2,7,15,26,40,57,77,100]);
eq('שבת', Gem.figurateSeries('shabbat', 8), [1,7,19,37,61,91,127,169]);
eq('מגן דוד', Gem.figurateSeries('magenDavid', 8), [1,13,37,73,121,181,253,337]);
eq('טטרהדרל', Gem.figurateSeries('tetra', 6), [1,4,10,20,35,56]);

// המשולש של 26 = 351 (עמ' ח)
eq('משולש של 26 = 351', Gem.figurateOf('triangle', 26), 351);
// מגן דוד של 5 = 181 ; המגן-דוד ה-5 = 121 (עמ' לד)
eq('מגן דוד של 5 = 181', Gem.figurateOf('magenDavid', 5), 181);
eq('המגן-דוד ה-5 = 121', Gem.figurateSeries('magenDavid', 5)[4], 121);

// חתך זהב: gs(1000) = (382 עליון, 618 תחתון) (עמ' יט-כ)
const gs = Gem.goldenSection(1000);
eq('gs(1000) lower = 618', gs.lower, 618);
eq('gs(1000) upper = 382', gs.upper, 382);
// שחזור הסדרה החיבורית של 1000: ...2,10,12,22,34,56,90,146,236,382,618,1000
eq('סדרת 1000 מכילה 2,10', Gem.additiveSeriesFor(1000, 20).slice(0,2), [2,10]);

// פיבונאצ'י (עמ' יט)
eq('פיבונאצי', Gem.fibonacci(12), [1,1,2,3,5,8,13,21,34,55,89,144]);

// זיהוי צורני: 26 מופיע כ...(יהלם? לא). 351 משולש של 26.
eq('351 הוא משולש', Gem.identifyFigurate(351).some(h => h.type==='triangle'), true);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
