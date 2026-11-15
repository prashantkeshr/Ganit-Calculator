/**
 * Per-tool SEO: updates meta tags + JSON-LD on every route change.
 * This lets Google/Bing/AI crawlers index each tool individually.
 */

const BASE_URL = 'https://ganit.dhurta.com';
const SITE_NAME = 'Ganit Calculator';
const ORG = 'Ganit Technology';

/** Per-tool SEO data */
const TOOL_SEO = {
  '/':                        { title: 'Free Online Calculator', desc: 'Ganit Calculator — 65+ free online calculators: scientific, financial, unit converter, GPA, BMI, statistics and more. Privacy-first, offline-capable PWA.', keywords: 'free calculator online, ganit calculator' },
  '/basic':                   { title: 'Basic Calculator',       desc: 'Free online basic calculator. Add, subtract, multiply, divide with memory functions and history. Works offline.', keywords: 'basic calculator, online calculator, free calculator' },
  '/scientific':              { title: 'Scientific Calculator',  desc: 'Free scientific calculator online: sin, cos, tan, log, ln, powers, roots, factorial, constants (π, e). DEG/RAD/GRAD modes.', keywords: 'scientific calculator online, trig calculator, sin cos tan calculator' },
  '/engineering':             { title: 'Engineering Calculator', desc: 'Engineering calculator: number base conversion, bitwise operations, complex numbers, unit conversions. For engineers and developers.', keywords: 'engineering calculator, base converter, bitwise calculator, complex number calculator' },
  '/programmer':              { title: 'Programmer Calculator',  desc: 'Programmer calculator: hex/binary/octal converter, bitwise AND OR XOR, ASCII table, Base64 encoder, UUID generator, hash functions.', keywords: 'programmer calculator, hex converter, binary calculator, base64 encoder, uuid generator' },
  '/graph':                   { title: 'Graph Plotter',          desc: 'Free online graph plotter: plot any mathematical function y=f(x). Zoom, pan, multiple functions with color coding.', keywords: 'graph plotter online, function grapher, plot equations online, desmos alternative' },
  '/equation/linear':         { title: 'Linear Equation Solver', desc: 'Solve linear equations ax + b = 0 and systems of 2–3 linear equations online. Step-by-step solutions.', keywords: 'linear equation solver, solve for x, equation calculator' },
  '/equation/quadratic':      { title: 'Quadratic Equation Solver', desc: 'Solve quadratic equations ax²+bx+c=0. Get real and complex roots using the quadratic formula. Discriminant analysis.', keywords: 'quadratic equation solver, quadratic formula calculator, solve ax2+bx+c=0' },
  '/equation/cubic':          { title: 'Cubic Equation Solver',  desc: 'Solve cubic and polynomial equations online. Find real and complex roots.', keywords: 'cubic equation solver, polynomial solver online' },
  '/equation/system2':        { title: 'System of Equations',    desc: 'Solve 2×2 and 3×3 systems of linear equations using Cramer\'s rule and Gaussian elimination.', keywords: 'system of equations solver, simultaneous equations calculator' },
  '/calculus/derivative':     { title: 'Derivative Calculator',  desc: 'Numerical derivative calculator online: compute f\'(x), f\'\'(x), f\'\'\'(x) up to 4th order at any point. 5-point stencil accuracy.', keywords: 'derivative calculator, numerical differentiation, find derivative online' },
  '/calculus/integral':       { title: 'Integral Calculator',    desc: 'Numerical integral calculator online: definite integrals using Simpson\'s rule, Gauss-Kronrod, and trapezoidal methods.', keywords: 'integral calculator, definite integral calculator, numerical integration' },
  '/calculus/taylor':         { title: 'Taylor Series Calculator', desc: 'Compute Taylor series expansion of any function: term-by-term display, error estimate, evaluate at any point.', keywords: 'taylor series calculator, maclaurin series, power series expansion' },
  '/matrix':                  { title: 'Matrix Calculator',       desc: 'Matrix calculator: addition, multiplication, transpose, inverse, determinant, rank, eigenvalues for matrices up to 6×6.', keywords: 'matrix calculator, matrix multiplication, matrix inverse, determinant calculator' },
  '/statistics/descriptive':  { title: 'Statistics Calculator',  desc: 'Descriptive statistics calculator: mean, median, mode, standard deviation, variance, quartiles, IQR for any dataset.', keywords: 'statistics calculator, standard deviation calculator, mean median mode calculator' },
  '/statistics/regression':   { title: 'Regression Calculator',  desc: 'Linear regression calculator: slope, intercept, R², correlation coefficient, regression line equation.', keywords: 'linear regression calculator, R squared calculator, correlation calculator' },
  '/financial/loan':          { title: 'Loan EMI Calculator',     desc: 'Free EMI calculator: monthly payment, total interest, amortization schedule. Solve for EMI, principal, rate, or term.', keywords: 'EMI calculator, loan calculator, monthly payment calculator, amortization calculator' },
  '/financial/compound':      { title: 'Compound Interest Calculator', desc: 'Compound interest calculator with monthly contributions. Compute future value, interest earned for investments.', keywords: 'compound interest calculator, future value calculator, investment calculator' },
  '/financial/roi':           { title: 'ROI & CAGR Calculator',  desc: 'ROI and CAGR calculator: return on investment percentage and compound annual growth rate for any investment.', keywords: 'ROI calculator, CAGR calculator, return on investment calculator' },
  '/financial/retirement':    { title: 'Retirement Calculator',  desc: 'Retirement planner: compute retirement corpus, monthly income based on current savings and contribution.', keywords: 'retirement calculator, pension calculator, retirement savings calculator' },
  '/financial/inflation':     { title: 'Inflation Calculator',   desc: 'Inflation calculator: find future or past value of money adjusting for inflation rate. CPI calculator.', keywords: 'inflation calculator, purchasing power calculator, CPI calculator' },
  '/health/bmi':              { title: 'BMI Calculator',          desc: 'Free BMI calculator: body mass index from height and weight. Imperial and metric units. BMI categories.', keywords: 'BMI calculator, body mass index calculator, bmi calculator online' },
  '/health/bmr':              { title: 'BMR & TDEE Calculator',  desc: 'BMR calculator: basal metabolic rate and total daily energy expenditure. Mifflin-St Jeor and Harris-Benedict equations.', keywords: 'BMR calculator, TDEE calculator, calorie calculator, daily calorie needs' },
  '/health/bodyfat':          { title: 'Body Fat Calculator',    desc: 'Body fat percentage calculator using Navy, Jackson-Pollock and BMI methods. For men and women.', keywords: 'body fat calculator, body fat percentage calculator' },
  '/health/water':            { title: 'Water Intake Calculator', desc: 'Daily water intake calculator: recommended hydration based on weight, activity, and climate.', keywords: 'water intake calculator, hydration calculator, daily water calculator' },
  '/percentage':              { title: 'Percentage Calculator',  desc: 'Percentage calculator: X% of Y, percentage change, discount, tip, tax, markup. Solve for any unknown variable.', keywords: 'percentage calculator, percent calculator, discount calculator, percentage change calculator' },
  '/unit-converter/length':   { title: 'Length Converter',       desc: 'Convert length units: mm, cm, m, km, inch, foot, yard, mile, nautical mile. Free online length converter.', keywords: 'length converter, unit converter length, meters to feet, km to miles' },
  '/unit-converter/weight':   { title: 'Weight Converter',       desc: 'Convert weight/mass: mg, g, kg, tonne, oz, lb, stone. Free online weight converter.', keywords: 'weight converter, kg to lbs, pounds to kg, mass converter' },
  '/unit-converter/temperature': { title: 'Temperature Converter', desc: 'Convert temperature: Celsius, Fahrenheit, Kelvin, Rankine. Free online temperature converter.', keywords: 'temperature converter, celsius to fahrenheit, kelvin converter' },
  '/unit-converter/speed':    { title: 'Speed Converter',        desc: 'Convert speed: m/s, km/h, mph, knots, ft/s. Free online speed converter.', keywords: 'speed converter, mph to kmh, knots converter' },
  '/unit-converter/volume':   { title: 'Volume Converter',       desc: 'Convert volume: ml, litre, m³, fl oz, cup, pint, quart, gallon. Free online volume converter.', keywords: 'volume converter, liters to gallons, ml to oz' },
  '/unit-converter/data':     { title: 'Data Storage Converter', desc: 'Convert data storage: bits, bytes, KB, MB, GB, TB, KiB, MiB, GiB. Free online data converter.', keywords: 'data converter, mb to gb, storage converter, bytes converter' },
  '/gpa/gpa':                 { title: 'GPA Calculator',         desc: 'Free GPA calculator: compute cumulative GPA on 4.0 scale from letter grades and credit hours. Add unlimited subjects.', keywords: 'GPA calculator, cumulative GPA calculator, grade point average calculator' },
  '/gpa/grade':               { title: 'Grade Calculator',       desc: 'Weighted grade calculator: compute final grade percentage and letter grade from assignments, midterms, finals.', keywords: 'grade calculator, final grade calculator, weighted grade calculator' },
  '/gpa/cgpa':                { title: 'GPA Converter',          desc: 'GPA converter: convert between 4.0, 5.0, 10.0 GPA scales and percentage. Letter grade lookup.', keywords: 'GPA converter, percentage to GPA, CGPA calculator' },
  '/currency':                { title: 'Currency Converter',     desc: 'Free currency converter: 90+ currencies with user-editable rates. No API required, works offline. Privacy-first.', keywords: 'currency converter, forex calculator, exchange rate calculator' },
  '/area':                    { title: 'Area Calculator',        desc: 'Area and perimeter calculator for all shapes: square, rectangle, circle, triangle, ellipse, trapezoid.', keywords: 'area calculator, perimeter calculator, circle area calculator' },
  '/age':                     { title: 'Age Calculator',         desc: 'Exact age calculator: age in years, months, days, hours. Birthday countdown, zodiac sign, planet ages.', keywords: 'age calculator, birthday calculator, exact age calculator' },
  '/datetime/diff':           { title: 'Date Difference Calculator', desc: 'Calculate days between two dates. Date difference in years, months, days, hours, minutes, seconds.', keywords: 'date calculator, days between dates, date difference calculator' },
  '/datetime/timezone':       { title: 'Timezone Converter',    desc: 'Convert time between world timezones. Find meeting times across timezones. World clock.', keywords: 'timezone converter, time zone calculator, world clock' },
  '/construction/concrete':   { title: 'Concrete Calculator',   desc: 'Concrete volume calculator: compute cement, sand, aggregate for slabs, columns, beams by mix ratio.', keywords: 'concrete calculator, cement calculator, concrete volume calculator' },
  '/construction/tiles':      { title: 'Tile Calculator',       desc: 'Tile and flooring calculator: how many tiles needed for a room. Accounts for waste percentage.', keywords: 'tile calculator, flooring calculator, tiles needed calculator' },
  '/physics/kinematics':      { title: 'Kinematics Calculator', desc: 'Kinematics calculator: velocity, acceleration, distance, time using SUVAT equations. Physics solver.', keywords: 'kinematics calculator, SUVAT calculator, velocity calculator, physics calculator' },
};

function setMeta(name, content, prop = false) {
  const sel = prop ? `meta[property="${name}"]` : `meta[name="${name}"]`;
  let el = document.head.querySelector(sel);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(prop ? 'property' : 'name', name);
    document.head.appendChild(el);
  }
  el.content = content;
}

function setCanonical(url) {
  let el = document.head.querySelector('link[rel="canonical"]');
  if (!el) { el = document.createElement('link'); el.rel = 'canonical'; document.head.appendChild(el); }
  el.href = url;
}

function injectLD(id, obj) {
  let el = document.getElementById(id);
  if (!el) { el = document.createElement('script'); el.type = 'application/ld+json'; el.id = id; document.head.appendChild(el); }
  el.textContent = JSON.stringify(obj);
}

export function updateSEO(path, params = {}) {
  // Resolve pattern params (e.g. /calculus/:sub with params.sub='derivative')
  const resolved = '/' + path.replace(/^\//, '').replace(/:(\w+)/g, (_, k) => params[k] || k);
  const seo = TOOL_SEO[resolved] || TOOL_SEO['/'];
  const toolTitle = seo.title;
  const pageTitle = `${toolTitle} | ${SITE_NAME}`;
  const url = `${BASE_URL}/#${resolved}`;

  // Title
  document.title = pageTitle;

  // Meta
  setMeta('description', seo.desc);
  if (seo.keywords) setMeta('keywords', seo.keywords);

  // Open Graph
  setMeta('og:title',       pageTitle, true);
  setMeta('og:description', seo.desc,  true);
  setMeta('og:url',         url,        true);
  setMeta('og:type',        'website',  true);

  // Twitter
  setMeta('twitter:title',       pageTitle);
  setMeta('twitter:description', seo.desc);

  // Canonical
  setCanonical(url);

  // Per-tool JSON-LD (SoftwareApplication)
  injectLD('ld-tool', {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    '@id': url,
    name: `${toolTitle} — ${SITE_NAME}`,
    description: seo.desc,
    url,
    applicationCategory: 'UtilitiesApplication',
    applicationSubCategory: 'Calculator',
    operatingSystem: 'Any — browser-based',
    isAccessibleForFree: true,
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    author: { '@type': 'Organization', name: ORG, url: BASE_URL },
    sameAs: ['https://github.com/prashantkeshr/Ganit-Calculator'],
  });

  // BreadcrumbList
  const pathParts = resolved.split('/').filter(Boolean);
  const crumbs = [{ '@type': 'ListItem', position: 1, name: SITE_NAME, item: BASE_URL + '/' }];
  pathParts.forEach((part, i) => {
    crumbs.push({
      '@type': 'ListItem',
      position: i + 2,
      name: part.charAt(0).toUpperCase() + part.slice(1).replace(/-/g, ' '),
      item: `${BASE_URL}/#/${pathParts.slice(0, i + 1).join('/')}`
    });
  });
  injectLD('ld-breadcrumb', {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs
  });
}
