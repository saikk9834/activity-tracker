import type { Profile } from '@/types';

/**
 * What the Guide tab was hardcoded to before profiles existed: 82 kg at 183 cm,
 * and the "untrained 82 kg man" the starting weights were picked for. Age 30 is
 * the value that reproduces the guide's ~2,500 kcal TDEE — correct it on the
 * profile page.
 *
 * Used two ways: to prefill an empty profile form, and as the fallback for the
 * Guide's numbers until a profile is saved.
 */
export const DEFAULT_PROFILE: Profile = {
  name: '',
  age: 30,
  gender: 'male',
  heightCm: 183,
  weightKg: 82,
};

export const EMPTY_PROFILE: Profile = {
  name: '',
  age: null,
  gender: 'unspecified',
  heightCm: null,
  weightKg: null,
};
