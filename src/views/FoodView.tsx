import { DEFAULT_PROFILE } from '@/data/profileDefaults';
import { bodyNumbers, formatNumber } from '@/lib/body';
import { useTracker } from '@/state/useTracker';

/** Same derived targets as the Guide tab, so the two can't disagree. */
const FALLBACK = bodyNumbers(DEFAULT_PROFILE)!;

export function FoodView() {
  const { data } = useTracker();
  const numbers = (data.profile && bodyNumbers(data.profile)) ?? FALLBACK;
  const weightKg = data.profile?.weightKg ?? DEFAULT_PROFILE.weightKg!;
  const midCalories = Math.round((numbers.calorieLow + numbers.calorieHigh) / 2 / 50) * 50;

  return (
    <>
      <div className="card">
        <p className="eyebrow">The target</p>
        <h2>
          {numbers.proteinLow}–{numbers.proteinHigh} g protein · ~{midCalories.toLocaleString()}{' '}
          kcal · every day
        </h2>
        <p className="small">
          Muscle-building benefit plateaus around 1.6–1.8 g/kg — that’s{' '}
          {Math.round(1.6 * weightKg)}–{Math.round(1.8 * weightKg)} g at {formatNumber(weightKg)} kg.{' '}
          <strong>
            {numbers.proteinLow} g is the floor, {numbers.proteinHigh} g is a great day.
          </strong>{' '}
          Vegetarian protein arrives with carbs or fat attached, so the structure below matters more
          than heroics: <strong>30–40 g protein per meal, four times a day</strong>, each meal
          anchored by a Tier 1 food.
        </p>
      </div>

      <div className="card">
        <p className="eyebrow">Tier 1</p>
        <h2>Protein-dense, calorie-cheap — build every meal on one</h2>
        <div className="tw">
          <table>
            <thead>
              <tr>
                <th>Food</th>
                <th>Serving</th>
                <th>Protein</th>
                <th>kcal</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  Whey protein <span className="muted small">(it’s vegetarian — a milk protein)</span>
                </td>
                <td className="num">1 scoop (30 g)</td>
                <td className="num">24 g</td>
                <td className="num">120</td>
              </tr>
              <tr>
                <td>Soy chunks</td>
                <td className="num">50 g dry</td>
                <td className="num">26 g</td>
                <td className="num">~170</td>
              </tr>
              <tr>
                <td>Greek yogurt / hung curd (nonfat)</td>
                <td className="num">250 g bowl</td>
                <td className="num">26 g</td>
                <td className="num">~150</td>
              </tr>
              <tr>
                <td>Tofu (firm)</td>
                <td className="num">150 g</td>
                <td className="num">16 g</td>
                <td className="num">~130</td>
              </tr>
              <tr>
                <td>Milk (low-fat)</td>
                <td className="num">300 ml</td>
                <td className="num">10 g</td>
                <td className="num">~150</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <p className="eyebrow">Tier 2</p>
        <h2>Good protein, carbs/fat attached — 1–2 portions a day</h2>
        <div className="tw">
          <table>
            <thead>
              <tr>
                <th>Food</th>
                <th>Serving</th>
                <th>Protein</th>
                <th>Note</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Soybeans (boiled)</td>
                <td className="num">150 g</td>
                <td className="num">27 g</td>
                <td className="muted small">complete protein</td>
              </tr>
              <tr>
                <td>Paneer (full-fat)</td>
                <td className="num">100 g</td>
                <td className="num">18 g</td>
                <td className="muted small">~290 kcal — weigh it, don’t freestyle</td>
              </tr>
              <tr>
                <td>Dal / lentils</td>
                <td className="num">200 g (2 katoris)</td>
                <td className="num">18 g</td>
                <td className="muted small"></td>
              </tr>
              <tr>
                <td>Chickpeas / chana</td>
                <td className="num">200 g</td>
                <td className="num">18 g</td>
                <td className="muted small">rajma, tempeh similar</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="small muted">
          <strong>Tier 3 — flavor, not foundation:</strong> peanut butter (2 tbsp = 8 g protein but
          190 kcal), nuts, cheese. <strong>Traps:</strong> roti, rice and most vegetables give 2–4 g
          each — count as bonus, never as a source. A “healthy-feeling” day with no anchors (poha →
          dal-rice → veg pasta) quietly totals 55 g.
        </p>
      </div>

      <div className="card">
        <p className="eyebrow">Sample day</p>
        <h2>~144 g protein · ~2,250 kcal</h2>
        <div className="tw">
          <table>
            <thead>
              <tr>
                <th>Meal</th>
                <th>What</th>
                <th>Protein</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Breakfast</td>
                <td>250 g Greek yogurt / hung curd + fruit + small handful of oats</td>
                <td className="num">28 g</td>
              </tr>
              <tr>
                <td>Lunch</td>
                <td>Dal (2 katoris) + 100 g paneer sabzi + 2 roti + salad</td>
                <td className="num">42 g</td>
              </tr>
              <tr>
                <td>Post-workout</td>
                <td>1 scoop whey in 300 ml milk</td>
                <td className="num">34 g</td>
              </tr>
              <tr>
                <td>Dinner</td>
                <td>Soy chunk curry (50 g dry) + 1 cup rice + vegetables</td>
                <td className="num">30 g</td>
              </tr>
              <tr>
                <td>Through the day</td>
                <td>Chai milk, a few peanuts, dahi with dinner</td>
                <td className="num">~10 g</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="small muted">
          Swap freely within tiers: tofu bhurji for paneer, chana for dal, a second whey scoop on a
          rushed day.
        </p>
      </div>

      <div className="card">
        <p className="eyebrow">Desk-worker rules</p>
        <h2>The guardrails</h2>
        <ul className="tight small">
          <li>
            <strong>Protein first</strong> at each meal — most satiating macro, kills the 4 pm snack
            drift.
          </li>
          <li>
            <strong>Liquid calories are the belly-fat budget.</strong> Sugary drinks, juices, fancy
            coffees, alcohol — the easiest 300–500 kcal to delete. Beer is a double hit: calories +
            worse sleep, and poor sleep increases belly-fat storage.
          </li>
          <li>
            <strong>Don’t drink the deficit back after swimming.</strong> A 30-min swim burns
            ~250–350 kcal and spikes hunger; have yogurt or a shake ready.
          </li>
          <li>
            <strong>Fight the chair.</strong> 10-min walks after lunch and dinner, pace during calls
            — worth 150–300 kcal/day, as much as the swim.
          </li>
          <li>
            <strong>Weekends count.</strong> Keep the breakfast + protein structure; loosen dinner,
            not the whole day.
          </li>
          <li>
            <strong>Adjust by the trend:</strong> target 0.25–0.5 kg/week down on the 7-day average.
            Faster → add ~150 kcal. Flat 2+ weeks <em>and</em> waist stuck → cut ~150 kcal. Scale
            flat but waist shrinking → recomposition working, change nothing.
          </li>
          <li>
            <strong>B12 is covered by dairy.</strong> Mind iron (dal, rajma, spinach + lemon/tomato
            for absorption).
          </li>
          <li>
            <strong>Creatine monohydrate 3–5 g/day</strong> — vegetarian, cheap, best-studied
            supplement there is, and vegetarians see the biggest benefit. If you buy one thing
            besides whey, it’s this.
          </li>
        </ul>
      </div>
    </>
  );
}
