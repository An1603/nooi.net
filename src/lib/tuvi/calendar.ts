/**
 * Solar (Dương lịch) to Lunar (Âm lịch) date converter
 *
 * Uses the well-known astronomical algorithm (Jean Meeus) for the
 * Vietnamese/Chinese lunar calendar. Pre-computed year data covers
 * 1900-2100.
 *
 * Tử Vi — NOOI
 */

import { LunarDate } from './types';

// ────────────────────────────────────────────────────────────
// Constants
// ────────────────────────────────────────────────────────────

const PI = Math.PI;
const DEG = 180 / PI;
const RAD = PI / 180;

const J2000 = 2451545.0; // Julian Day for J2000.0 (Jan 1, 2000 12:00 TT)

/** Timezone offset for Vietnam (UTC+7), in fractional days. */
const TZ_OFFSET = 7 / 24;

// ────────────────────────────────────────────────────────────
// Lunar year info for years 1900-2100
// ────────────────────────────────────────────────────────────
// Each entry encodes:
//   Bits  0-3: leap month number (0 = no leap month)
//   Bits  4-15: month lengths for months 1–12 (1 = 30 days, 0 = 29 days)
//   Bits 16-19: leap month length in days (offset from 29)
//
// Standard Vietnamese/Chinese calendar data.

const LUNAR_YEAR_INFO: number[] = [
  0x04bd8, 0x04ae0, 0x0a570, 0x054d5, 0x0d260, 0x0d950, 0x16554, 0x056a0, 0x09ad0, 0x055d2, // 1900–1909
  0x04ae0, 0x0a5b6, 0x0a4d0, 0x0d250, 0x1d255, 0x0b540, 0x0d6a0, 0x0ada2, 0x095b0, 0x14977, // 1910–1919
  0x04970, 0x0a4b0, 0x0b4b5, 0x06a50, 0x06d40, 0x1ab54, 0x02b60, 0x09570, 0x052f2, 0x04970, // 1920–1929
  0x06566, 0x0d4a0, 0x0ea50, 0x06e95, 0x05ad0, 0x02b60, 0x186e3, 0x092e0, 0x1c8d7, 0x0c950, // 1930–1939
  0x0d4a0, 0x0d8a6, 0x0b550, 0x056a0, 0x0a5b4, 0x025d0, 0x092d0, 0x0d2b2, 0x0a950, 0x0b557, // 1940–1949
  0x06ca0, 0x0b550, 0x15355, 0x04da0, 0x0a5b0, 0x14573, 0x052b0, 0x0a9a8, 0x0e950, 0x06aa0, // 1950–1959
  0x0aea6, 0x0ab50, 0x04b60, 0x0aae4, 0x0a570, 0x05260, 0x0f263, 0x0d950, 0x05b57, 0x056a0, // 1960–1969
  0x096d0, 0x04dd5, 0x04ad0, 0x0a4d0, 0x0d4d4, 0x0d250, 0x0d558, 0x0b540, 0x0b6a0, 0x195a6, // 1970–1979
  0x095b0, 0x049b0, 0x0a974, 0x0a4b0, 0x0b27a, 0x06a50, 0x06d40, 0x0af46, 0x0ab60, 0x09570, // 1980–1989
  0x04af5, 0x04970, 0x064b0, 0x074a3, 0x0ea50, 0x06b58, 0x05ac0, 0x0ab60, 0x096d5, 0x092e0, // 1990–1999
  0x0c960, 0x0d954, 0x0d4a0, 0x0da50, 0x07552, 0x056a0, 0x0abb7, 0x025d0, 0x092d0, 0x0cab5, // 2000–2009
  0x0a950, 0x0b4a0, 0x0baa4, 0x0ad50, 0x055d9, 0x04ba0, 0x0a5b0, 0x15176, 0x052b0, 0x0a930, // 2010–2019
  0x07954, 0x06aa0, 0x0ad50, 0x05b52, 0x04b60, 0x0a6e6, 0x0a4e0, 0x0d260, 0x0ea65, 0x0d530, // 2020–2029
  0x05aa0, 0x076a3, 0x096d0, 0x04afb, 0x04ad0, 0x0a4d0, 0x1d0b6, 0x0d250, 0x0d520, 0x0dd45, // 2030–2039
  0x0b5a0, 0x056d0, 0x055b2, 0x049b0, 0x0a577, 0x0a4b0, 0x0aa50, 0x1b255, 0x06d20, 0x0ada0, // 2040–2049
  0x14b63, 0x09370, 0x049f8, 0x04970, 0x064b0, 0x168a6, 0x0ea50, 0x06aa0, 0x1a6c4, 0x0aae0, // 2050–2059
  0x092e0, 0x0d2e3, 0x0c960, 0x0d557, 0x0d4a0, 0x0da50, 0x05d55, 0x056a0, 0x0a6d0, 0x055d4, // 2060–2069
  0x052d0, 0x0a9b8, 0x0a950, 0x0b4a0, 0x0b6a6, 0x0ad50, 0x055a0, 0x0aba4, 0x0a5b0, 0x052b0, // 2070–2079
  0x0b273, 0x06930, 0x07337, 0x06aa0, 0x0ad50, 0x14b55, 0x04b60, 0x0a570, 0x054e4, 0x0d160, // 2080–2089
  0x0e968, 0x0d520, 0x0daa0, 0x16aa6, 0x056d0, 0x04ae0, 0x0a9d4, 0x0a4d0, 0x0d150, 0x0f252, // 2090–2099
  0x0d520, // 2100
];

// ────────────────────────────────────────────────────────────
// Math helpers
// ────────────────────────────────────────────────────────────

/** Degrees → radians */
function d2r(d: number): number {
  return d * RAD;
}

/** Radians → degrees */
function r2d(r: number): number {
  return r * DEG;
}

/** Normalize an angle in degrees to [0, 360). */
function normalizeAngle(deg: number): number {
  const n = deg % 360;
  return n < 0 ? n + 360 : n;
}

// ────────────────────────────────────────────────────────────
// Julian Day Number
// ────────────────────────────────────────────────────────────

/**
 * Calculate the Julian Day Number for a Gregorian date.
 *
 * Formula from Jean Meeus, "Astronomical Algorithms".
 * Valid for all positive years (proleptic Gregorian).
 */
export function calcJDN(ngay: number, thang: number, nam: number): number {
  const a = Math.floor((14 - thang) / 12);
  const y = nam + 4800 - a;
  const m = thang + 12 * a - 3;

  return (
    ngay +
    Math.floor((153 * m + 2) / 5) +
    365 * y +
    Math.floor(y / 4) -
    Math.floor(y / 100) +
    Math.floor(y / 400) -
    32045
  );
}

/**
 * Convert a Julian Day Number to a Gregorian date.
 */
export function jdnToDate(jdn: number): { ngay: number; thang: number; nam: number } {
  const a = jdn + 32044;
  const b = Math.floor((4 * a + 3) / 146097);
  const c = a - Math.floor(146097 * b / 4);
  const d = Math.floor((4 * c + 3) / 1461);
  const e = c - Math.floor(1461 * d / 4);
  const m = Math.floor((5 * e + 2) / 153);

  const ngay = e - Math.floor((153 * m + 2) / 5) + 1;
  const thang = m + 3 - 12 * Math.floor(m / 10);
  const nam = 100 * b + d - 4800 + Math.floor(m / 10);

  return { ngay, thang, nam };
}

// ────────────────────────────────────────────────────────────
// Sun longitude
// ────────────────────────────────────────────────────────────

/**
 * Compute the ecliptic longitude of the Sun at a given JDN.
 *
 * Uses the mean orbital elements (accuracy ~0.01° for 1900–2100).
 * Based on Jean Meeus, "Astronomical Algorithms", Chapter 25.
 */
function sunLongitude(jdn: number): number {
  const T = (jdn - J2000) / 36525; // Julian centuries from J2000.0
  const T2 = T * T;

  // Mean anomaly of the Sun (degrees)
  const M = normalizeAngle(357.5291 + 35999.0503 * T - 0.0001559 * T2 - 0.00000048 * T * T2);

  // Mean longitude of the Sun (degrees)
  const L0 = normalizeAngle(280.46646 + 36000.76983 * T + 0.0003032 * T2);

  // Equation of center
  const C =
    (1.914602 - 0.004817 * T - 0.000014 * T2) * Math.sin(d2r(M)) +
    (0.019993 - 0.000101 * T) * Math.sin(d2r(2 * M)) +
    0.000289 * Math.sin(d2r(3 * M));

  // True geometric longitude (ecliptic, referred to mean equinox of date)
  const lambda = L0 + C;

  return normalizeAngle(lambda);
}

// ────────────────────────────────────────────────────────────
// New Moon (Jean Meeus)
// ────────────────────────────────────────────────────────────

/**
 * Compute the JDE (Julian Ephemeris Day) of the k-th new moon
 * counted from J2000.0 (k=0 ≈ 2000-01-06).
 *
 * Implements Jean Meeus' "New Moon" algorithm (Chapter 49)
 * with the dominant periodic terms.
 */
function newMoonTime(k: number): number {
  const T = k / 1236.85;
  const T2 = T * T;
  const T3 = T2 * T;
  const T4 = T3 * T;

  // Mean new moon JDE
  let jde =
    2451550.09766 +
    29.530588861 * k +
    0.0001337 * T2 -
    0.00000015 * T3 +
    0.00000000073 * T4;

  // Solar mean anomaly (degrees)
  const M = normalizeAngle(2.5534 + 29.10535669 * k - 0.0000014 * T2 - 0.00000011 * T3);
  // Lunar mean anomaly (degrees)
  const Mprime = normalizeAngle(
    201.5643 + 385.81693528 * k + 0.0107582 * T2 + 0.00001238 * T3 - 0.000000058 * T4,
  );
  // Moon's argument of latitude (degrees)
  const F = normalizeAngle(
    160.7108 + 390.67050284 * k - 0.0016118 * T2 - 0.00000227 * T3 + 0.000000011 * T4,
  );
  // Longitude of the ascending node of the Moon (degrees)
  const Omega = normalizeAngle(124.7746 - 1.56375588 * k + 0.0020672 * T2 + 0.00000215 * T3);

  // Periodic terms (amplitude ≥ 0.0002 day)
  jde += -0.4072 * Math.sin(d2r(Mprime));
  jde += 0.17241 * Math.sin(d2r(M));
  jde += 0.01608 * Math.sin(d2r(2 * Mprime));
  jde += 0.01039 * Math.sin(d2r(2 * F));
  jde += 0.00739 * Math.sin(d2r(Mprime - M));
  jde += -0.00514 * Math.sin(d2r(Mprime + M));
  jde += 0.00208 * Math.sin(d2r(2 * M));
  jde += -0.00111 * Math.sin(d2r(Mprime - 2 * F));
  jde += -0.00057 * Math.sin(d2r(Mprime + 2 * F));
  jde += 0.00056 * Math.sin(d2r(2 * Mprime + M));
  jde += -0.00042 * Math.sin(d2r(3 * Mprime));
  jde += 0.00042 * Math.sin(d2r(M + 2 * F));
  jde += 0.00038 * Math.sin(d2r(M - 2 * F));
  jde += -0.00024 * Math.sin(d2r(2 * Mprime - M));
  jde += -0.00017 * Math.sin(d2r(Omega));
  jde += -0.00007 * Math.sin(d2r(Mprime + 2 * M));
  jde += 0.00004 * Math.sin(d2r(2 * Mprime - 2 * F));
  jde += 0.00004 * Math.sin(d2r(3 * M));
  jde += 0.00003 * Math.sin(d2r(Mprime + M - 2 * F));
  jde += 0.00003 * Math.sin(d2r(2 * Mprime + 2 * F));
  jde += -0.00003 * Math.sin(d2r(Mprime + M + 2 * F));
  jde += 0.00003 * Math.sin(d2r(Mprime - M + 2 * F));
  jde += -0.00002 * Math.sin(d2r(Mprime - M - 2 * F));
  jde += -0.00002 * Math.sin(d2r(3 * Mprime + M));
  jde += 0.00002 * Math.sin(d2r(4 * Mprime));

  return jde;
}

/**
 * Return the integer JDN (in local time UTC+7) of the day that
 * contains the k-th new moon. Rounds to the nearest whole day
 * after converting from TT to local time.
 */
function getNewMoonDay(k: number): number {
  return Math.round(newMoonTime(k) + TZ_OFFSET);
}

// ────────────────────────────────────────────────────────────
// Winter Solstice
// ────────────────────────────────────────────────────────────

/**
 * Return the JDN (in local time UTC+7) of the winter solstice
 * (Đông Chí, Sun λ = 270°) for Gregorian year `nam`.
 *
 * Uses iterative refinement starting from an approximate date,
 * then converts from TT to local time.
 */
function getWinterSolsticeDay(nam: number): number {
  // Approximate: winter solstice is around Dec 22
  let jdn = calcJDN(22, 12, nam);

  // Iteratively refine to find the JDE of the solstice
  for (let i = 0; i < 5; i++) {
    const lon = sunLongitude(jdn);
    let diff = normalizeAngle(lon - 270);
    if (diff > 180) diff -= 360; // handle wrap
    if (Math.abs(diff) < 0.001) break;
    // Sun moves ~1° per day, so correction in days ≈ diff in degrees
    jdn -= diff;
  }

  // Convert from TT to local time (UTC+7) and round to calendar day
  return Math.round(jdn + TZ_OFFSET);
}

// ────────────────────────────────────────────────────────────
// Lunar Month 11
// ────────────────────────────────────────────────────────────

/**
 * Return the JDN of the first day (new moon) of the 11th month
 * of the lunar year `nam`.
 *
 * The 11th month contains the winter solstice of Gregorian year `nam`.
 */
function getLunarMonth11(nam: number): number {
  const ws = getWinterSolsticeDay(nam);

  // Estimate the new moon number near the winter solstice
  let k = Math.round((ws - 2451550.09766) / 29.530588861);
  let nm = getNewMoonDay(k);

  // The 11th month starts on the new moon on or before the winter solstice.
  if (nm > ws) {
    k--;
    nm = getNewMoonDay(k);
  }

  // Verify that the next new moon is after the solstice (this month contains it)
  const nextNm = getNewMoonDay(k + 1);
  if (nextNm <= ws) {
    // The solstice is in the next month, not this one — advance
    return getNewMoonDay(k + 1);
  }

  return nm;
}

// ────────────────────────────────────────────────────────────
// Year info decoder
// ────────────────────────────────────────────────────────────

interface YearInfo {
  /** Leap month number (0 = no leap). */
  leapMonth: number;
  /** Days in each of months 1–12 (index 1–12). */
  monthDays: number[];
  /** Days in the leap month (0 if none). */
  leapDays: number;
}

/** Decode a single entry from LUNAR_YEAR_INFO. */
function decodeYearInfo(encoded: number): YearInfo {
  const leapMonth = encoded & 0xf;
  const leapDays = ((encoded >> 16) & 0xf) + 29;

  const monthDays: number[] = [];
  for (let m = 1; m <= 12; m++) {
    // Bit 4 for month 1, bit 5 for month 2, ...
    monthDays[m] = ((encoded >> (3 + m)) & 1) + 29;
  }

  return { leapMonth, monthDays, leapDays };
}

// ────────────────────────────────────────────────────────────
// Ordered month list builder
// ────────────────────────────────────────────────────────────

interface LunarMonthInYear {
  month: number;
  isLeap: boolean;
  days: number;
}

/**
 * Build the ordered list of months for a given lunar year.
 * E.g. for a year with leap month 4:
 *   [1, 2, 3, 4, leap4, 5, 6, 7, 8, 9, 10, 11, 12]
 */
function buildMonths(info: YearInfo): LunarMonthInYear[] {
  const months: LunarMonthInYear[] = [];

  for (let m = 1; m <= 12; m++) {
    months.push({ month: m, isLeap: false, days: info.monthDays[m] });
    if (m === info.leapMonth) {
      months.push({ month: m, isLeap: true, days: info.leapDays });
    }
  }

  return months;
}

// ────────────────────────────────────────────────────────────
// Solar → Lunar (main conversion)
// ────────────────────────────────────────────────────────────

/**
 * Convert a Gregorian (solar) date to a Vietnamese Lunar date.
 *
 * @param ngay  Day of month (1–31)
 * @param thang Month (1–12)
 * @param nam   Year
 * @returns The corresponding LunarDate
 * @throws If the year is outside the supported range (1900–2100)
 */
export function solarToLunar(ngay: number, thang: number, nam: number): LunarDate {
  if (nam < 1900 || nam > 2100) {
    throw new Error(
      `Năm ${nam} nằm ngoài phạm vi hỗ trợ (1900–2100).`,
    );
  }

  const jdn = calcJDN(ngay, thang, nam);

  // ── Step 1: Determine the correct lunar year ──────────
  //
  // The 11th month of lunar year Y contains the winter solstice
  // of Gregorian year Y.  The lunar year starts with month 1
  // some time in Gregorian year Y (typically Jan/Feb).

  let lunarYear: number;
  let a11: number; // Start JDN of the 11th month

  // Try the candidate lunar year = nam first
  a11 = getLunarMonth11(nam);

  if (jdn >= a11) {
    // The date is on or after the 11th month start — it could be in
    // lunar year `nam` (months 11–12) or in `nam+1` (months 1–10).
    // Peek at the next year's 11th month to decide.
    const a11Next = getLunarMonth11(nam + 1);
    if (jdn < a11Next) {
      lunarYear = nam;
    } else {
      lunarYear = nam + 1;
      a11 = a11Next;
    }
  } else {
    // The date is before the 11th month of year `nam`.
    // It belongs to lunar year `nam - 1`.
    lunarYear = nam - 1;
    a11 = getLunarMonth11(lunarYear);
  }

  // Re-check range after adjusting lunar year.
  // Lunar year can be 1899 for early 1900 dates; use 1900 data as approximation.
  if (lunarYear < 1899 || lunarYear > 2100) {
    throw new Error(
      `Không thể tính cho năm ${lunarYear} (ngoài phạm vi 1900–2100).`,
    );
  }

  // ── Step 2: Decode the year info ──────────────────────
  // Clamp to valid data range: for 1899, use 1900 data.
  const yearIndex = Math.max(0, Math.min(lunarYear - 1900, LUNAR_YEAR_INFO.length - 1));
  const info = decodeYearInfo(LUNAR_YEAR_INFO[yearIndex]);
  const months = buildMonths(info);

  // ── Step 3: Build month-start JDN array ───────────────
  //
  // We know the 11th month start = a11.  Walk backwards/forwards
  // to find all month starts in this lunar year.

  const month11Idx = months.findIndex((m) => m.month === 11 && !m.isLeap);
  if (month11Idx === -1) {
    throw new Error('Internal error: month 11 not found in month list.');
  }

  const monthStarts: number[] = new Array(months.length);
  monthStarts[month11Idx] = a11;

  // Walk backwards
  for (let i = month11Idx - 1; i >= 0; i--) {
    monthStarts[i] = monthStarts[i + 1] - months[i].days;
  }

  // Walk forwards
  for (let i = month11Idx + 1; i < months.length; i++) {
    monthStarts[i] = monthStarts[i - 1] + months[i - 1].days;
  }

  // ── Step 4: Find the month containing jdn ─────────────
  for (let i = 0; i < months.length; i++) {
    const start = monthStarts[i];
    const end = start + months[i].days;

    if (jdn >= start && jdn < end) {
      return {
        nam: lunarYear,
        thang: months[i].month,
        ngay: jdn - start + 1,
        nhuan: months[i].isLeap,
      };
    }
  }

  // Fallback — should not normally reach here given the year bracketing above.
  // If the date falls exactly on the boundary, try the next year.
  const nextYearIdx = Math.max(0, Math.min(lunarYear + 1 - 1900, LUNAR_YEAR_INFO.length - 1));
  const nextYearInfo = decodeYearInfo(LUNAR_YEAR_INFO[nextYearIdx]);
  const nextMonths = buildMonths(nextYearInfo);
  const nextA11 = getLunarMonth11(lunarYear + 1);
  const nextMonth11Idx = nextMonths.findIndex((m) => m.month === 11 && !m.isLeap);

  if (nextMonth11Idx !== -1) {
    const nextStarts: number[] = new Array(nextMonths.length);
    nextStarts[nextMonth11Idx] = nextA11;

    for (let i = nextMonth11Idx - 1; i >= 0; i--) {
      nextStarts[i] = nextStarts[i + 1] - nextMonths[i].days;
    }

    for (let i = 0; i < nextMonths.length; i++) {
      const start = nextStarts[i];
      const end = start + nextMonths[i].days;
      if (jdn >= start && jdn < end) {
        return {
          nam: lunarYear + 1,
          thang: nextMonths[i].month,
          ngay: jdn - start + 1,
          nhuan: nextMonths[i].isLeap,
        };
      }
    }
  }

  throw new Error(
    `Không thể chuyển đổi ngày ${ngay}/${thang}/${nam} sang Âm lịch.`,
  );
}

// ────────────────────────────────────────────────────────────────
// Can Chi (Heavenly Stems & Earthly Branches)
// ────────────────────────────────────────────────────────────────

/**
 * Calculate the Can (Thiên Can) and Chi (Địa Chi) indices for a year.
 *
 * Formula:
 *   canIndex = (nam - 4) % 10
 *   chiIndex = (nam - 4) % 12
 *
 * @param nam Gregorian year
 * @returns Indices 0-based (Can: 0=Giáp…9=Quý; Chi: 0=Tý…11=Hợi)
 */
export function getYearCanChiIndex(nam: number): { canIndex: number; chiIndex: number } {
  return {
    canIndex: ((nam - 4) % 10 + 10) % 10,
    chiIndex: ((nam - 4) % 12 + 12) % 12,
  };
}

/**
 * Calculate the Can index for a lunar month.
 *
 * Formula:
 *   can = ((namCanIndex % 5) * 2 + thangAm + 1) % 10
 *
 * @param thangAm     Lunar month number (1–12)
 * @param namCanIndex Can index of the year (0–9)
 * @returns canIndex (0-based)
 */
export function getMonthCanChiIndex(
  thangAm: number,
  namCanIndex: number,
): { canIndex: number } {
  const canIndex = (((namCanIndex % 5) * 2 + thangAm + 1) % 10 + 10) % 10;
  return { canIndex };
}

/**
 * Calculate the Can and Chi indices for a day based on its JDN.
 *
 * Formula:
 *   canIndex = (jdn + 6) % 10
 *   chiIndex = (jdn + 8) % 12
 *
 * @param jdn Julian Day Number
 * @returns Indices (0-based)
 */
export function getDayCanChiIndex(jdn: number): { canIndex: number; chiIndex: number } {
  return {
    canIndex: ((jdn + 6) % 10 + 10) % 10,
    chiIndex: ((jdn + 8) % 12 + 12) % 12,
  };
}

/**
 * Convert a 24-hour time (0–23) to a Địa Chi index.
 *
 * Each Chi spans 2 hours in traditional timekeeping:
 *   Tý (0): 23–01, Sửu (1): 01–03, Dần (2): 03–05, … Hợi (11): 21–23
 *
 * @param gio Hour (0–23)
 * @returns Chi index (0–11)
 */
export function gioToChiIndex(gio: number): number {
  return Math.floor(((gio + 1) % 24) / 2);
}

/**
 * Calculate the Can and Chi indices for a given hour of the day.
 *
 * 1. Convert hour to Chi index via `gioToChiIndex`.
 * 2. Compute: can = (ngayCanIndex % 5) * 2 + chiIndex  (mod 10)
 *
 * @param gio          Hour (0–23)
 * @param ngayCanIndex Can index of the day (0–9)
 * @returns Can and Chi indices (0-based)
 */
export function getHourCanChiIndex(
  gio: number,
  ngayCanIndex: number,
): { canIndex: number; chiIndex: number } {
  const chiIndex = gioToChiIndex(gio);
  const canIndex = (((ngayCanIndex % 5) * 2 + chiIndex) % 10 + 10) % 10;
  return { canIndex, chiIndex };
}

/**
 * Get the Can Chi indices for the current year (local time).
 *
 * @returns canIndex, chiIndex
 */
export function getCurrentYearCanChi(): { canIndex: number; chiIndex: number } {
  const now = new Date();
  return getYearCanChiIndex(now.getFullYear());
}

// ────────────────────────────────────────────────────────────────
// Verification (comment)
// ────────────────────────────────────────────────────────────────
// 1990-06-15 → JDN should be 2448058
//   calcJDN(15, 6, 1990) = 2448058  ✓
//
// 1990 = Canh Ngọ year
//   getYearCanChiIndex(1990) → { canIndex: 6, chiIndex: 6 }  ✓
//
// Converted lunar date for 1990-06-15 should be approximately:
//   Âm lịch: 23 tháng 5 năm 1990 (Canh Ngọ)
