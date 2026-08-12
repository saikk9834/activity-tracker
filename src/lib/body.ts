import type { Gender, Profile } from '@/types';

/**
 * Desk job plus this plan's short daily sessions. Fixed rather than a profile
 * field to keep the form to the five basics — change it here if the training
 * load changes substantially.
 */
const ACTIVITY_FACTOR = 1.375;

/** The plan's deficit: a couple of hundred calories under maintenance. */
const DEFICIT_LOW = 300;
const DEFICIT_HIGH = 200;

/** Muscle-building benefit plateaus in this range (g of protein per kg). */
const PROTEIN_LOW = 1.6;
const PROTEIN_HIGH = 1.8;

export interface BodyNumbers {
  bmi: number;
  bmiCategory: string;
  /** Maintenance burn, rounded to the nearest 50. */
  tdee: number;
  calorieLow: number;
  calorieHigh: number;
  proteinLow: number;
  proteinHigh: number;
}

export function bmi(weightKg: number, heightCm: number): number {
  const m = heightCm / 100;
  return weightKg / (m * m);
}

export function bmiCategory(value: number): string {
  if (value < 18.5) return 'underweight';
  if (value < 25) return 'normal weight';
  if (value < 30) return 'overweight';
  return 'obese';
}

/**
 * Mifflin-St Jeor, the standard clinical estimate. The male and female
 * constants differ by 166 kcal; when gender isn't specified we split the
 * difference rather than guess.
 */
function bmr(weightKg: number, heightCm: number, age: number, gender: Gender): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  switch (gender) {
    case 'male':
      return base + 5;
    case 'female':
      return base - 161;
    default:
      return base + (5 - 161) / 2;
  }
}

const round = (n: number, to: number) => Math.round(n / to) * to;

/** Null until height, weight and age are all filled in. */
export function bodyNumbers(profile: Profile): BodyNumbers | null {
  const { heightCm, weightKg, age } = profile;
  if (!heightCm || !weightKg || !age) return null;

  const index = bmi(weightKg, heightCm);
  const tdee = round(bmr(weightKg, heightCm, age, profile.gender) * ACTIVITY_FACTOR, 50);

  return {
    bmi: Math.round(index * 10) / 10,
    bmiCategory: bmiCategory(index),
    tdee,
    calorieLow: round(tdee - DEFICIT_LOW, 50),
    calorieHigh: round(tdee - DEFICIT_HIGH, 50),
    proteinLow: Math.floor((PROTEIN_LOW * weightKg) / 10) * 10,
    proteinHigh: Math.ceil((PROTEIN_HIGH * weightKg) / 10) * 10,
  };
}

export function formatNumber(n: number): string {
  return n.toLocaleString(undefined, { maximumFractionDigits: 1 });
}
