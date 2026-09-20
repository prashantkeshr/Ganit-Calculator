import { history } from '../history.js';

const PLANET_YEARS = {
  Mercury: 0.2408467, Venus: 0.6151972, Mars: 1.8808158,
  Jupiter: 11.862615, Saturn: 29.447498, Uranus: 84.016846, Neptune: 164.79132
};

const ZODIAC = [
  { sign: 'Capricorn',  start: [12, 22], end: [1, 19] },
  { sign: 'Aquarius',   start: [1, 20],  end: [2, 18] },
  { sign: 'Pisces',     start: [2, 19],  end: [3, 20] },
  { sign: 'Aries',      start: [3, 21],  end: [4, 19] },
  { sign: 'Taurus',     start: [4, 20],  end: [5, 20] },
  { sign: 'Gemini',     start: [5, 21],  end: [6, 20] },
  { sign: 'Cancer',     start: [6, 21],  end: [7, 22] },
  { sign: 'Leo',        start: [7, 23],  end: [8, 22] },
  { sign: 'Virgo',      start: [8, 23],  end: [9, 22] },
  { sign: 'Libra',      start: [9, 23],  end: [10, 22] },
  { sign: 'Scorpio',    start: [10, 23], end: [11, 21] },
  { sign: 'Sagittarius',start: [11, 22], end: [12, 21] },
];

const CHINESE_ZODIAC = ['Rat','Ox','Tiger','Rabbit','Dragon','Snake','Horse','Goat','Monkey','Rooster','Dog','Pig'];
const DAYS_OF_WEEK = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

function getZodiac(month, day) {
  for (const z of ZODIAC) {
    const [sm, sd] = z.start, [em, ed] = z.end;
    if ((month === sm && day >= sd) || (month === em && day <= ed)) return z.sign;
    if (sm === 12 && (month === 12 && day >= sd || month === 1 && day <= ed)) return z.sign;
  }
  return 'Unknown';
}

function getChinese(year) {
  return CHINESE_ZODIAC[(year - 1900) % 12];
}

function calcAge(dob) {
  const now = new Date();
  const birth = new Date(dob);
  let years = now.getFullYear() - birth.getFullYear();
  let months = now.getMonth() - birth.getMonth();
  let days = now.getDate() - birth.getDate();
  if (days < 0) { months--; const lastMonth = new Date(now.getFullYear(), now.getMonth(), 0); days += lastMonth.getDate(); }
  if (months < 0) { years--; months += 12; }
  const totalDays = Math.floor((now - birth) / (1000 * 60 * 60 * 24));
  const totalHours = Math.floor((now - birth) / (1000 * 60 * 60));
  const totalMins  = Math.floor((now - birth) / (1000 * 60));
  const totalSecs  = Math.floor((now - birth) / 1000);
  // Next birthday
  const thisYear = new Date(now.getFullYear(), birth.getMonth(), birth.getDate());
  const nextBirthday = thisYear <= now
    ? new Date(now.getFullYear() + 1, birth.getMonth(), birth.getDate())
    : thisYear;
  const daysUntil = Math.ceil((nextBirthday - now) / (1000 * 60 * 60 * 24));
  const dayBorn = DAYS_OF_WEEK[birth.getDay()];
  const zodiac = getZodiac(birth.getMonth() + 1, birth.getDate());
  const chinese = getChinese(birth.getFullYear());
  const planetAges = Object.entries(PLANET_YEARS).map(([p, y]) => ({
    planet: p, age: (totalDays / 365.25 / y).toFixed(2)
  }));
  return { years, months, days, totalDays, totalHours, totalMins, totalSecs, daysUntil, dayBorn, zodiac, chinese, planetAges, nextBirthday: nextBirthday.toDateString() };
}

export function renderAge(container) {
  const today = new Date();
  const defaultDob = `${today.getFullYear() - 25}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  container.innerHTML = `
    <div class="calc-form">
      <h2>Age Calculator</h2>
      <form id="age-form">
        <div class="form-row">
          <label>Date of Birth</label>
          <input type="date" id="age-dob" value="${defaultDob}" max="${today.toISOString().split('T')[0]}">
        </div>
        <button type="submit" class="btn btn-calc-primary">Calculate Age</button>
      </form>
      <div id="age-result" class="calc-output"></div>
    </div>
  `;

  function calculate() {
    const dob = container.querySelector('#age-dob').value;
    if (!dob) return;
    const r = calcAge(dob);
    container.querySelector('#age-result').innerHTML = `
      <div class="result-hero">
        <div class="age-big">${r.years} <span>years</span> ${r.months} <span>months</span> ${r.days} <span>days</span></div>
      </div>
      <div class="result-grid">
        <div class="result-card"><div class="result-label">Total Days</div><div class="result-value">${r.totalDays.toLocaleString()}</div></div>
        <div class="result-card"><div class="result-label">Total Hours</div><div class="result-value">${r.totalHours.toLocaleString()}</div></div>
        <div class="result-card"><div class="result-label">Total Minutes</div><div class="result-value">${r.totalMins.toLocaleString()}</div></div>
        <div class="result-card"><div class="result-label">Born on</div><div class="result-value">${r.dayBorn}</div></div>
        <div class="result-card"><div class="result-label">Next Birthday</div><div class="result-value">${r.nextBirthday} (${r.daysUntil} days)</div></div>
        <div class="result-card"><div class="result-label">Western Zodiac</div><div class="result-value">${r.zodiac}</div></div>
        <div class="result-card"><div class="result-label">Chinese Zodiac</div><div class="result-value">${r.chinese}</div></div>
      </div>
      <h3>Age on Other Planets</h3>
      <div class="result-grid">
        ${r.planetAges.map(p => `<div class="result-card"><div class="result-label">${p.planet}</div><div class="result-value">${p.age} years</div></div>`).join('')}
      </div>
    `;
    history.add({ category: 'age', dob, result: `${r.years}y ${r.months}m ${r.days}d` });
  }

  container.querySelector('#age-form').addEventListener('submit', (e) => { e.preventDefault(); calculate(); });
  container.querySelector('#age-dob').addEventListener('change', calculate);
  calculate();
}
