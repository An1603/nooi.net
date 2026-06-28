// Core numerology calculator
// Thần số học Pythagoras — Pythagorean Numerology

import {
  LETTER_VALUES,
  VOWELS,
  NUMBER_MEANINGS,
  MASTER_NUMBER_MEANINGS,
  CHALLENGE_MEANINGS,
  PERIOD_MEANINGS,
  CORNERSTONE_MEANINGS,
} from './constants';
import type {
  NumerologyInput,
  NumerologyResult,
  CoreNumber,
  PeriodCycle,
  PinnacleCycle,
  ChallengeNumber,
  Cornerstone,
} from './types';

// ----- HELPERS -----

const MASTER_NUMBERS = new Set([11, 22, 33]);

/** Normalize Vietnamese characters to base ASCII */
function normalizeChar(ch: string): string {
  const v = LETTER_VALUES[ch.toLowerCase()];
  if (typeof v === 'string') return v;
  return ch.toLowerCase();
}

/** Get the numeric value of a letter (Vietnamese-compatible) */
function letterValue(ch: string): number {
  const lower = ch.toLowerCase();
  // Direct mapping if accent
  const mapped = LETTER_VALUES[lower];
  if (typeof mapped === 'number') return mapped;
  // If it's a mapped string (accent -> base), look up base letter
  if (typeof mapped === 'string') {
    const base = LETTER_VALUES[mapped];
    return typeof base === 'number' ? base : 0;
  }
  // Direct letter lookup
  const direct = LETTER_VALUES[lower];
  return typeof direct === 'number' ? direct : 0;
}

/** Extract letters only from a name */
function extractLetters(name: string): string[] {
  return name.replace(/[^a-zA-ZÀ-ỹăâêôơưđĂÂÊÔƠƯĐ]/g, '').split('');
}

/** Reduce a number to a single digit (or master number) */
function reduceNumber(n: number, steps: number[] = []): { value: number; steps: number[] } {
  if (MASTER_NUMBERS.has(n)) return { value: n, steps };
  if (n < 10) return { value: n, steps: [...steps, n] };

  const sum = String(n).split('').reduce((a, d) => a + parseInt(d), 0);
  steps.push(n);
  return reduceNumber(sum, steps);
}

/** Reduce number directly without master number preservation (for pinnacles, challenges) */
function reduceDirect(n: number): number {
  if (n < 10) return n;
  const sum = String(n).split('').reduce((a, d) => a + parseInt(d), 0);
  return reduceDirect(sum);
}

/** Get the base meaning for a number, falling back from master to single digit */
function getMeaning(n: number): (typeof NUMBER_MEANINGS)[1] {
  // First check master number meanings
  if (MASTER_NUMBERS.has(n)) {
    // Merge master number meaning with single digit base
    const masterData = MASTER_NUMBER_MEANINGS[n];
    const baseData = NUMBER_MEANINGS[reduceDirect(n)];
    return {
      ...baseData,
      name: masterData?.name ?? baseData.name,
      nameEn: masterData?.nameEn ?? baseData.nameEn,
      meaning: masterData?.meaning ?? baseData.meaning,
      meaningEn: masterData?.meaningEn ?? baseData.meaningEn,
      positive: masterData?.positive ?? baseData.positive,
      negative: masterData?.negative ?? baseData.negative,
      career: masterData?.career ?? baseData.career,
      careerEn: masterData?.careerEn ?? baseData.careerEn,
      lifePathMeaning: masterData?.lifePathMeaning ?? baseData.lifePathMeaning,
      lifePathMeaningEn: masterData?.lifePathMeaningEn ?? baseData.lifePathMeaningEn,
      soulUrgeMeaning: masterData?.soulUrgeMeaning ?? baseData.soulUrgeMeaning,
      soulUrgeMeaningEn: masterData?.soulUrgeMeaningEn ?? baseData.soulUrgeMeaningEn,
    };
  }
  return NUMBER_MEANINGS[n] ?? NUMBER_MEANINGS[reduceDirect(n)];
}

function buildCoreNumber(value: number, originalSum: number, steps: number[]): CoreNumber {
  const meaning = getMeaning(value);
  return {
    value,
    originalSum,
    reductionSteps: steps,
    name: meaning.name,
    nameEn: meaning.nameEn,
    meaning: meaning.meaning,
    meaningEn: meaning.meaningEn,
    positive: meaning.positive,
    negative: meaning.negative,
    career: meaning.career,
    careerEn: meaning.careerEn,
  };
}

// ----- LIFE PATH NUMBER (Đường đời) -----
function calcLifePath(dob: Date): { value: number; originalSum: number; steps: number[] } {
  const day = dob.getDate();
  const month = dob.getMonth() + 1;
  const year = dob.getFullYear();

  // Method: reduce day, month, year separately, then sum
  const { value: reducedDay } = reduceNumber(day);
  const { value: reducedMonth } = reduceNumber(month);
  const { value: reducedYear } = reduceNumber(year);

  const sum = reducedDay + reducedMonth + reducedYear;
  const steps: number[] = [day, month, year, sum];
  const result = reduceNumber(sum, steps);

  // Special case: if the sum before final reduction is a master number
  if (MASTER_NUMBERS.has(sum)) {
    return { value: sum, originalSum: sum, steps };
  }

  return { value: result.value, originalSum: sum, steps: result.steps };
}

// ----- DESTINY / EXPRESSION NUMBER (Sứ mệnh) -----
function calcDestiny(fullName: string): { value: number; originalSum: number; steps: number[] } {
  const letters = extractLetters(fullName);
  const values = letters.map(l => letterValue(l));
  const sum = values.reduce((a, b) => a + b, 0);
  const steps: number[] = [sum];
  const result = reduceNumber(sum, steps);
  return { value: result.value, originalSum: sum, steps: result.steps };
}

// ----- SOUL URGE NUMBER (Linh hồn) -----
function calcSoulUrge(fullName: string): { value: number; originalSum: number; steps: number[] } {
  const letters = extractLetters(fullName);
  const vowelValues = letters
    .filter(ch => {
      const base = typeof normalizeChar(ch) === 'string' ? normalizeChar(ch) : ch;
      return VOWELS.has(base as string);
    })
    .map(ch => letterValue(ch));

  const sum = vowelValues.reduce((a, b) => a + b, 0);
  const steps: number[] = [sum];
  const result = reduceNumber(sum, steps);

  if (MASTER_NUMBERS.has(sum)) {
    return { value: sum, originalSum: sum, steps: [sum] };
  }

  return { value: result.value, originalSum: sum, steps: result.steps };
}

// ----- PERSONALITY NUMBER (Nhân cách) -----
function calcPersonality(fullName: string): { value: number; originalSum: number; steps: number[] } {
  const letters = extractLetters(fullName);
  const consonantValues = letters
    .filter(ch => {
      const base = typeof normalizeChar(ch) === 'string' ? normalizeChar(ch) : ch;
      return !VOWELS.has(base as string);
    })
    .map(ch => letterValue(ch));

  const sum = consonantValues.reduce((a, b) => a + b, 0);
  const steps: number[] = [sum];
  const result = reduceNumber(sum, steps);
  return { value: result.value, originalSum: sum, steps: result.steps };
}

// ----- BIRTH DAY NUMBER (Ngày sinh) -----
function calcBirthDay(dob: Date): { value: number; originalSum: number; steps: number[] } {
  const day = dob.getDate();
  const steps: number[] = [day];
  const result = reduceNumber(day, steps);
  return { value: result.value, originalSum: day, steps: result.steps };
}

// ----- MATURITY NUMBER (Trưởng thành) -----
function calcMaturity(lifePath: number, destiny: number): { value: number; originalSum: number; steps: number[] } {
  const sum = lifePath + destiny;
  const steps: number[] = [sum];
  const result = reduceNumber(sum, steps);
  return { value: result.value, originalSum: sum, steps: result.steps };
}

// ----- BALANCE NUMBER -----
function calcBalance(fullName: string): { value: number; originalSum: number; steps: number[] } {
  // First letter of first name only
  const letters = extractLetters(fullName);
  const firstLetter = letters[0];
  if (!firstLetter) return { value: 0, originalSum: 0, steps: [0] };
  const value = letterValue(firstLetter);
  const steps: number[] = [value];
  const result = reduceNumber(value, steps);
  return { value: result.value, originalSum: value, steps: result.steps };
}

// ----- PERIOD CYCLES (Chu kỳ) -----
function calcPeriodCycles(dob: Date): PeriodCycle[] {
  const month = dob.getMonth() + 1;
  const day = dob.getDate();
  const year = dob.getFullYear();

  const { value: monthReduced } = reduceNumber(month);
  const { value: dayReduced } = reduceNumber(day);
  const { value: yearReduced } = reduceNumber(year);

  return [
    { period: 1, ageRange: '0–27 tuổi', number: monthReduced, meaning: PERIOD_MEANINGS[monthReduced]?.meaning ?? '', meaningEn: PERIOD_MEANINGS[monthReduced]?.meaningEn ?? '' },
    { period: 2, ageRange: '28–54 tuổi', number: dayReduced, meaning: PERIOD_MEANINGS[dayReduced]?.meaning ?? '', meaningEn: PERIOD_MEANINGS[dayReduced]?.meaningEn ?? '' },
    { period: 3, ageRange: '55+ tuổi', number: yearReduced, meaning: PERIOD_MEANINGS[yearReduced]?.meaning ?? '', meaningEn: PERIOD_MEANINGS[yearReduced]?.meaningEn ?? '' },
  ];
}

// ----- PINNACLE CYCLES (Đỉnh cao) -----
function calcPinnacleCycles(dob: Date): PinnacleCycle[] {
  const month = dob.getMonth() + 1;
  const day = dob.getDate();
  const year = dob.getFullYear();

  const { value: m } = reduceNumber(month);
  const { value: d } = reduceNumber(day);
  const { value: y } = reduceNumber(year);

  // Pinnacle 1: month + day
  const p1 = reduceDirect(m + d);
  // Pinnacle 2: day + year
  const p2 = reduceDirect(d + y);
  // Pinnacle 3: pinnacle 1 + pinnacle 2
  const p3 = reduceDirect(p1 + p2);
  // Pinnacle 4: month + year
  const p4 = reduceDirect(m + y);

  // Ages: based on life path
  const { value: lp } = calcLifePath(dob);
  const firstPinnacleEnd = 36 - lp;

  return [
    { pinnacle: 1, ageRange: `0–${firstPinnacleEnd} tuổi`, number: p1, meaning: getMeaning(p1).pinnacleMeaning, meaningEn: getMeaning(p1).pinnacleMeaningEn },
    { pinnacle: 2, ageRange: `${firstPinnacleEnd + 1}–${firstPinnacleEnd + 9} tuổi`, number: p2, meaning: getMeaning(p2).pinnacleMeaning, meaningEn: getMeaning(p2).pinnacleMeaningEn },
    { pinnacle: 3, ageRange: `${firstPinnacleEnd + 10}–${firstPinnacleEnd + 18} tuổi`, number: p3, meaning: getMeaning(p3).pinnacleMeaning, meaningEn: getMeaning(p3).pinnacleMeaningEn },
    { pinnacle: 4, ageRange: `${firstPinnacleEnd + 19}+ tuổi`, number: p4, meaning: getMeaning(p4).pinnacleMeaning, meaningEn: getMeaning(p4).pinnacleMeaningEn },
  ];
}

// ----- CHALLENGE NUMBERS (Thách thức) -----
function calcChallengeNumbers(dob: Date): ChallengeNumber[] {
  const month = dob.getMonth() + 1;
  const day = dob.getDate();
  const year = dob.getFullYear();

  const m = reduceDirect(month);
  const d = reduceDirect(day);
  const y = reduceDirect(year);

  // Challenge 1: |month - day|
  const c1 = reduceDirect(Math.abs(m - d));
  // Challenge 2: |day - year|
  const c2 = reduceDirect(Math.abs(d - y));
  // Challenge 3: |challenge1 - challenge2|
  const c3 = reduceDirect(Math.abs(c1 - c2));
  // Challenge 4: |month - year|
  const c4 = reduceDirect(Math.abs(m - y));

  const { value: lp } = calcLifePath(dob);
  const firstPinnacleEnd = 36 - lp;

  const challenges: ChallengeNumber[] = [
    { challenge: 1, ageRange: `0–${firstPinnacleEnd} tuổi`, number: c1, meaning: c1 === 0 ? CHALLENGE_MEANINGS[0]?.meaning || '' : getMeaning(c1).challengeMeaning, meaningEn: c1 === 0 ? CHALLENGE_MEANINGS[0]?.meaningEn || '' : getMeaning(c1).challengeMeaningEn },
    { challenge: 2, ageRange: `${firstPinnacleEnd + 1}–${firstPinnacleEnd + 9} tuổi`, number: c2, meaning: c2 === 0 ? CHALLENGE_MEANINGS[0]?.meaning || '' : getMeaning(c2).challengeMeaning, meaningEn: c2 === 0 ? CHALLENGE_MEANINGS[0]?.meaningEn || '' : getMeaning(c2).challengeMeaningEn },
    { challenge: 3, ageRange: `${firstPinnacleEnd + 10}–${firstPinnacleEnd + 18} tuổi`, number: c3, meaning: c3 === 0 ? CHALLENGE_MEANINGS[0]?.meaning || '' : getMeaning(c3).challengeMeaning, meaningEn: c3 === 0 ? CHALLENGE_MEANINGS[0]?.meaningEn || '' : getMeaning(c3).challengeMeaningEn },
    { challenge: 4, ageRange: `${firstPinnacleEnd + 19}+ tuổi`, number: c4, meaning: c4 === 0 ? CHALLENGE_MEANINGS[0]?.meaning || '' : getMeaning(c4).challengeMeaning, meaningEn: c4 === 0 ? CHALLENGE_MEANINGS[0]?.meaningEn || '' : getMeaning(c4).challengeMeaningEn },
  ];

  return challenges;
}

// ----- KARMIC LESSONS -----
function calcKarmicLessons(fullName: string): number[] {
  const letters = extractLetters(fullName);
  const values = letters.map(l => letterValue(l));
  const presentNumbers = new Set(values);
  const allNumbers = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  return allNumbers.filter(n => !presentNumbers.has(n));
}

// ----- SUBCONSCIOUS SELF -----
function calcSubconsciousSelf(fullName: string): number {
  const letters = extractLetters(fullName);
  const values = new Set(letters.map(l => letterValue(l)));
  // Filter out 0 (non-mapped chars)
  const distinct = new Set([...values].filter(v => v > 0));
  return distinct.size;
}

// ----- CORNERSTONES -----
function calcCornerstones(fullName: string): Cornerstone[] {
  const names = fullName.split(/[\s]+/).filter(Boolean);
  return names.map((name) => {
    const letters = extractLetters(name);
    const first = letters[0]?.toUpperCase() ?? '';
    const val = letterValue(first);
    return {
      letter: first,
      number: val,
      meaning: CORNERSTONE_MEANINGS[val] ?? '',
    };
  });
}

// ----- MAIN CALCULATOR -----
export function calculateNumerology(input: NumerologyInput): NumerologyResult {
  const dob = new Date(input.dateOfBirth);
  const fullName = input.fullName.trim();

  const lifePath = calcLifePath(dob);
  const destiny = calcDestiny(fullName);
  const soulUrge = calcSoulUrge(fullName);
  const personality = calcPersonality(fullName);
  const birthDay = calcBirthDay(dob);
  const maturity = calcMaturity(lifePath.value, destiny.value);
  const balance = calcBalance(fullName);

  const periodCycles = calcPeriodCycles(dob);
  const pinnacleCycles = calcPinnacleCycles(dob);
  const challengeNumbers = calcChallengeNumbers(dob);
  const karmicLessons = calcKarmicLessons(fullName);
  const subconsciousSelf = calcSubconsciousSelf(fullName);
  const cornerstones = calcCornerstones(fullName);
  const missingNumbers = [1, 2, 3, 4, 5, 6, 7, 8, 9].filter(
    n => !karmicLessons.includes(n)
  );

  return {
    lifePath: {
      ...buildCoreNumber(lifePath.value, lifePath.originalSum, lifePath.steps),
      meaning: getMeaning(lifePath.value).lifePathMeaning,
      meaningEn: getMeaning(lifePath.value).lifePathMeaningEn,
    },
    destiny: {
      ...buildCoreNumber(destiny.value, destiny.originalSum, destiny.steps),
      meaning: getMeaning(destiny.value).destinyMeaning,
      meaningEn: getMeaning(destiny.value).destinyMeaningEn,
    },
    soulUrge: {
      ...buildCoreNumber(soulUrge.value, soulUrge.originalSum, soulUrge.steps),
      meaning: getMeaning(soulUrge.value).soulUrgeMeaning,
      meaningEn: getMeaning(soulUrge.value).soulUrgeMeaningEn,
    },
    personality: {
      ...buildCoreNumber(personality.value, personality.originalSum, personality.steps),
      meaning: getMeaning(personality.value).personalityMeaning,
      meaningEn: getMeaning(personality.value).personalityMeaningEn,
    },
    birthDay: {
      ...buildCoreNumber(birthDay.value, birthDay.originalSum, birthDay.steps),
      meaning: getMeaning(birthDay.value).birthDayMeaning,
      meaningEn: getMeaning(birthDay.value).birthDayMeaningEn,
    },
    maturity: {
      ...buildCoreNumber(maturity.value, maturity.originalSum, maturity.steps),
      meaning: getMeaning(maturity.value).maturityMeaning,
      meaningEn: getMeaning(maturity.value).maturityMeaningEn,
    },
    balance: {
      ...buildCoreNumber(balance.value, balance.originalSum, balance.steps),
      meaning: getMeaning(balance.value).balanceMeaning,
      meaningEn: getMeaning(balance.value).balanceMeaningEn,
    },
    periodCycles,
    pinnacleCycles,
    challengeNumbers,
    karmicLessons,
    subconsciousSelf,
    missingNumbers,
    cornerstones,
  };
}
