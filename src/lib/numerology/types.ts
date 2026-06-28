// Types for numerology system
// Thần số học Pythagoras — NOOI Numerology

export interface NumerologyInput {
  fullName: string;       // Họ tên đầy đủ (không dấu, tiếng Việt có dấu OK)
  dateOfBirth: string;    // YYYY-MM-DD
}

export interface NumerologyResult {
  // Core numbers
  lifePath: CoreNumber;
  destiny: CoreNumber;
  soulUrge: CoreNumber;
  personality: CoreNumber;
  birthDay: CoreNumber;
  maturity: CoreNumber;
  balance: CoreNumber;

  // Cycles
  periodCycles: PeriodCycle[];
  pinnacleCycles: PinnacleCycle[];
  challengeNumbers: ChallengeNumber[];

  // Additional
  karmicLessons: number[];          // Missing numbers 1-9
  subconsciousSelf: number;         // Count of distinct numbers present
  missingNumbers: number[];         // Numbers not in the name
  cornerstones: Cornerstone[];       // First letter of each name part
}

export interface CoreNumber {
  value: number;            // Single digit or master number (11,22,33)
  originalSum: number;      // Before reduction
  reductionSteps: number[]; // Steps taken to reduce
  name: string;             // Vietnamese name
  nameEn: string;           // English name
  meaning: string;          // Detailed meaning in Vietnamese
  meaningEn: string;        // Detailed meaning in English
  positive: string[];       // Positive traits
  negative: string[];       // Negative traits
  career: string;           // Career guidance in Vietnamese
  careerEn: string;         // Career guidance in English
}

export interface PeriodCycle {
  period: number;           // 1, 2, or 3
  ageRange: string;         // e.g. "0-27", "28-54", "55+"
  number: number;           // The cycle number
  meaning: string;          // Interpretation in Vietnamese
  meaningEn: string;        // Interpretation in English
}

export interface PinnacleCycle {
  pinnacle: number;         // 1-4
  ageRange: string;         // e.g. "0-27"
  number: number;           // The pinnacle number
  meaning: string;          // Interpretation in Vietnamese
  meaningEn: string;        // Interpretation in English
}

export interface ChallengeNumber {
  challenge: number;        // 1-4
  ageRange: string;         // e.g. "0-27"
  number: number;           // The challenge number
  meaning: string;          // Interpretation in Vietnamese
  meaningEn: string;        // Interpretation in English
}

export interface Cornerstone {
  letter: string;
  number: number;
  meaning: string;
}
