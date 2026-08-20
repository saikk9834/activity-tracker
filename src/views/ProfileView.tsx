import { useEffect, useState, type FormEvent } from 'react';
import { DEFAULT_PROFILE } from '@/data/profileDefaults';
import { bodyNumbers, formatNumber } from '@/lib/body';
import { displayWeight, lbToKg, weightUnit, weightValue, type Units } from '@/lib/units';
import { useFeedback } from '@/state/useFeedback';
import { useTracker } from '@/state/useTracker';
import { useUnits } from '@/state/useUnits';
import type { Gender, Profile } from '@/types';

const GENDER_OPTIONS: { value: Gender; label: string }[] = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
  { value: 'unspecified', label: 'Prefer not to say' },
];

/**
 * Form state is strings — an in-progress "18" shouldn't become the number 18.
 * `weight` is in whatever units the user is reading; it converts back to kg on
 * the way into the profile, which stays canonical.
 */
interface FormState {
  name: string;
  age: string;
  gender: Gender;
  heightCm: string;
  weight: string;
}

const toForm = (p: Profile, units: Units): FormState => ({
  name: p.name,
  age: p.age?.toString() ?? '',
  gender: p.gender,
  heightCm: p.heightCm?.toString() ?? '',
  weight: p.weightKg === null ? '' : weightValue(p.weightKg, units),
});

function parseNumber(value: string): number | null {
  const trimmed = value.trim().replace(',', '.');
  if (!trimmed) return null;
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : null;
}

const toProfile = (f: FormState, units: Units): Profile => {
  const typed = parseNumber(f.weight);
  return {
    name: f.name.trim(),
    age: parseNumber(f.age),
    gender: f.gender,
    heightCm: parseNumber(f.heightCm),
    weightKg: typed === null ? null : units === 'metric' ? typed : lbToKg(typed),
  };
};

/** Matches the CHECK constraints in supabase/migrations/0002_profiles.sql. */
function validate(f: FormState, units: Units): string | null {
  const { age, heightCm, weightKg } = toProfile(f, units);
  if (f.age.trim() && (age === null || age < 13 || age > 120))
    return 'Age needs to be between 13 and 120.';
  if (f.heightCm.trim() && (heightCm === null || heightCm < 90 || heightCm > 250))
    return 'Height needs to be between 90 and 250 cm.';
  // Bounds are checked in kg, but reported in the units on screen.
  if (f.weight.trim() && (weightKg === null || weightKg < 25 || weightKg > 400))
    return `Weight needs to be between ${displayWeight(25, units)} and ${displayWeight(400, units)}.`;
  return null;
}

export function ProfileView() {
  const { data, saveProfile } = useTracker();
  const { units } = useUnits();
  const { showToast } = useFeedback();

  // No profile yet: prefill with what the Guide was hardcoded to.
  const [form, setForm] = useState<FormState>(() => toForm(data.profile ?? DEFAULT_PROFILE, units));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Keeps the form honest if the data reloads underneath it (e.g. after retry),
  // and re-renders the weight field when the units toggle flips.
  useEffect(() => {
    setForm((prev) => toForm(data.profile ?? toProfile(prev, units), units));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `prev` supplies the unsaved edits
  }, [data.profile, units]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const preview = bodyNumbers(toProfile(form, units));
  const isNew = data.profile === null;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const problem = validate(form, units);
    setError(problem);
    if (problem) return;

    setBusy(true);
    try {
      await saveProfile(toProfile(form, units));
      showToast('Profile saved.');
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className="card">
        <p className="eyebrow">Profile</p>
        <h2>Your basics</h2>
        <p className="small muted">
          {isNew
            ? 'Prefilled with the numbers the plan was written around — correct them and save.'
            : 'These drive every target on the Guide tab. Update your weight as it moves.'}
        </p>

        <form onSubmit={submit} noValidate>
          <label className="field">
            <span className="flabel">Name</span>
            <input
              type="text"
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              autoComplete="name"
              placeholder="What should the app call you?"
              disabled={busy}
            />
          </label>

          <div className="frow">
            <label className="field">
              <span className="flabel">Age</span>
              <input
                type="number"
                inputMode="numeric"
                value={form.age}
                onChange={(e) => set('age', e.target.value)}
                min={13}
                max={120}
                disabled={busy}
              />
            </label>

            <label className="field">
              <span className="flabel">Gender</span>
              <select
                value={form.gender}
                onChange={(e) => set('gender', e.target.value as Gender)}
                disabled={busy}
              >
                {GENDER_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="frow">
            <label className="field">
              <span className="flabel">Height (cm)</span>
              <input
                type="number"
                inputMode="decimal"
                step="0.5"
                value={form.heightCm}
                onChange={(e) => set('heightCm', e.target.value)}
                min={90}
                max={250}
                disabled={busy}
              />
            </label>

            <label className="field">
              <span className="flabel">Weight ({weightUnit(units)})</span>
              <input
                type="number"
                inputMode="decimal"
                step={units === 'metric' ? '0.1' : '0.5'}
                value={form.weight}
                onChange={(e) => set('weight', e.target.value)}
                min={Number(weightValue(25, units))}
                max={Number(weightValue(400, units))}
                disabled={busy}
              />
            </label>
          </div>

          <p className="fhint" style={{ margin: '0 0 14px' }}>
            Gender only affects the calorie estimate — the formula's constants differ by sex.
            “Prefer not to say” splits the difference.
          </p>

          {error && (
            <p className="auth-msg err" role="alert">
              {error}
            </p>
          )}

          <button type="submit" className="btn" disabled={busy}>
            {busy ? 'Saving…' : 'Save profile'}
          </button>
        </form>
      </div>

      <div className="card">
        <p className="eyebrow">Derived</p>
        <h2>What these numbers make</h2>
        {preview ? (
          <>
            <div className="tw">
              <table>
                <tbody>
                  <tr>
                    <td>BMI</td>
                    <td className="num">{formatNumber(preview.bmi)}</td>
                    <td className="muted small">{preview.bmiCategory}</td>
                  </tr>
                  <tr>
                    <td>Estimated TDEE</td>
                    <td className="num">~{preview.tdee.toLocaleString()} kcal</td>
                    <td className="muted small">maintenance burn</td>
                  </tr>
                  <tr>
                    <td>Daily calorie target</td>
                    <td className="num">
                      {preview.calorieLow.toLocaleString()}–{preview.calorieHigh.toLocaleString()}{' '}
                      kcal
                    </td>
                    <td className="muted small">mild deficit</td>
                  </tr>
                  <tr>
                    <td>Daily protein target</td>
                    <td className="num">
                      {preview.proteinLow}–{preview.proteinHigh} g
                    </td>
                    <td className="muted small">
                      1.6–1.8 g/kg
                      {units === 'imperial' && ' (0.7–0.8 g/lb)'}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="small muted">
              Updates live as you type; the Guide tab shows the same figures once you save.
            </p>
          </>
        ) : (
          <p className="small muted">
            Fill in age, height and weight to see your BMI, maintenance burn, and daily targets.
          </p>
        )}
      </div>
    </>
  );
}
