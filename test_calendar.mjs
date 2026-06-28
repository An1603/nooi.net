const { solarToLunar, calcJDN, jdnToDate } = require('./src/lib/tuvi/calendar');

// Verify with well-known Tet (Lunar New Year) dates
const tests = [
  [1990, 1, 27],   // Tet 1990: Jan 27
  [2023, 1, 22],   // Tet 2023: Jan 22
  [2024, 2, 10],   // Tet 2024: Feb 10
  [2025, 1, 29],   // Tet 2025: Jan 29
  [2026, 2, 17],   // Tet 2026: Feb 17
];

console.log('Checking Tet dates (should give month=1, day=1):');
for (const [y, m, d] of tests) {
  const l = solarToLunar(d, m, y);
  console.log('  ' + y + '-' + String(m).padStart(2,'0') + '-' + String(d).padStart(2,'0') + ' -> Al ' + l.ngay + '/' + l.thang + '/' + l.nam + (l.nhuan ? ' (nhuan)' : ''));
}

// Also verify the JDN and round-trip
console.log('\nVerification tests:');
const jdn = calcJDN(15, 6, 1990);
console.log('JDN for 1990-06-15:', jdn, '| Expected: 2448058');

const dt = jdnToDate(jdn);
console.log('Round trip:', dt.ngay + '/' + dt.thang + '/' + dt.nam, '| Expected: 15/6/1990');
