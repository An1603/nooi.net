import { solarToLunar, calcJDN, jdnToDate, getYearCanChiIndex, getDayCanChiIndex, getMonthCanChiIndex, gioToChiIndex, getHourCanChiIndex } from './src/lib/tuvi/calendar.js';

// ─── Corrected verification suite ───

let passed = 0;
let failed = 0;

function check(label: string, actual: any, expected: any) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (ok) {
    passed++;
  } else {
    failed++;
    console.log(`FAIL: ${label}`);
    console.log(`  expected: ${JSON.stringify(expected)}`);
    console.log(`  actual:   ${JSON.stringify(actual)}`);
  }
}

// 1. JDN verification
check('JDN for 1990-06-15', calcJDN(15, 6, 1990), 2448058);
check('JDN for 2000-01-01', calcJDN(1, 1, 2000), 2451545);
check('JDN for 2024-01-01', calcJDN(1, 1, 2024), 2460311);

// 2. Year Can Chi
check('Year Can Chi 1990 = Canh Ngo', getYearCanChiIndex(1990), { canIndex: 6, chiIndex: 6 });
check('Year Can Chi 2000 = Canh Thin', getYearCanChiIndex(2000), { canIndex: 6, chiIndex: 4 });
check('Year Can Chi 2024 = Giap Thin', getYearCanChiIndex(2024), { canIndex: 0, chiIndex: 4 });
check('Year Can Chi 2025 = At Ty', getYearCanChiIndex(2025), { canIndex: 1, chiIndex: 5 });
check('Year Can Chi 2026 = Binh Ngo', getYearCanChiIndex(2026), { canIndex: 2, chiIndex: 6 });
check('Year Can Chi 1984 = Giap Ty', getYearCanChiIndex(1984), { canIndex: 0, chiIndex: 0 });

// 3. Day Can Chi
const jdn = calcJDN(15, 6, 1990);
check('Day Can Chi 1990-06-15', getDayCanChiIndex(jdn), { canIndex: 4, chiIndex: 6 });

// 4. Month Can Chi
// namCanIndex=6 (Canh), thang 5: ((6%5)*2 + 5 + 1) % 10 = (2+6)%10 = 8 (Nham)
check('Month Can Chi (thang 5, nam Canh=6)', getMonthCanChiIndex(5, 6), { canIndex: 8 });

// 5. Gio to Chi
check('gio 23 -> Ty(0)', gioToChiIndex(23), 0);
check('gio 0 -> Ty(0)', gioToChiIndex(0), 0);
check('gio 1 -> Suu(1)', gioToChiIndex(1), 1);
check('gio 11 -> Ty(6)', gioToChiIndex(11), 6);
check('gio 12 -> Ngo(6)', gioToChiIndex(12), 6);

// 6. Hour Can Chi (gio 7, ngay Can=6)
// chi = floor((7+1)%24/2) = 4 (Ty)
// can = (6%5)*2 + 4 = 2+4 = 6 (Canh)
check('Hour Can Chi (gio 7, ngay Canh=6)', getHourCanChiIndex(7, 6), { canIndex: 6, chiIndex: 4 });

// 7. Tet dates
check('Tet 2024 (Feb 10)', solarToLunar(10, 2, 2024), { nam: 2024, thang: 1, ngay: 1, nhuan: false });
check('Tet 2025 (Jan 29)', solarToLunar(29, 1, 2025), { nam: 2025, thang: 1, ngay: 1, nhuan: false });
check('Tet 2026 (Feb 17)', solarToLunar(17, 2, 2026), { nam: 2026, thang: 1, ngay: 1, nhuan: false });
check('Tet 2023 (Jan 22)', solarToLunar(22, 1, 2023), { nam: 2023, thang: 1, ngay: 1, nhuan: false });

// 8. Round trip
const dt = jdnToDate(calcJDN(15, 6, 1990));
check('Round trip 1990-06-15', dt, { ngay: 15, thang: 6, nam: 1990 });

// 9. Edge cases - out of range
try {
  solarToLunar(1, 1, 1899);
  console.log('FAIL: Should have thrown for 1899');
  failed++;
} catch {
  passed++;
}

try {
  solarToLunar(1, 1, 2101);
  console.log('FAIL: Should have thrown for 2101');
  failed++;
} catch {
  passed++;
}

// 10. Range boundaries - should work
check('1900-01-01 lunar', (() => { try { solarToLunar(1, 1, 1900); return 'OK'; } catch { return 'ERROR'; } })(), 'OK');
check('2100-12-31 lunar', (() => { try { solarToLunar(31, 12, 2100); return 'OK'; } catch { return 'ERROR'; } })(), 'OK');

// 11. Leap month detection in 2023
// 2023 LUNAR_YEAR_INFO has leap month 2
const leapCheck = solarToLunar(23, 3, 2023);
console.log('\n2023-03-23 lunar:', JSON.stringify(leapCheck), '(check if is leap-2)');

// 12. 1990-06-15 result
const l = solarToLunar(15, 6, 1990);
console.log('1990-06-15 lunar:', JSON.stringify(l));

// 13. jdnToDate round trip for multiple dates
const testDates = [[1,1,2024], [15,6,1990], [31,12,2100], [1,1,1900]];
for (const [d, m, y] of testDates) {
  const j = calcJDN(d, m, y);
  const rt = jdnToDate(j);
  check(`Round trip ${y}-${m}-${d}`, rt, { ngay: d, thang: m, nam: y });
}

console.log(`\nResults: ${passed} passed, ${failed} failed`);
