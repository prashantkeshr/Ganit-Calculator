/**
 * Tool Registry — all 45+ calculators registered here with metadata.
 */

export const CATEGORIES = [
  { id: 'basic',        label: 'Basic',           icon: '🧮', description: 'Standard arithmetic calculator' },
  { id: 'scientific',   label: 'Scientific',      icon: '📐', description: 'Trigonometry, logarithms, powers' },
  { id: 'engineering',  label: 'Engineering',     icon: '⚙️', description: 'Number bases, bitwise, complex, matrix' },
  { id: 'graph',        label: 'Graph Plotter',   icon: '📈', description: '2D & 3D function plotting' },
  { id: 'equation',     label: 'Equations',       icon: '🔣', description: 'Solve linear, quadratic & polynomial equations' },
  { id: 'calculus',     label: 'Calculus',        icon: '∫',  description: 'Derivatives, integrals, limits' },
  { id: 'matrix',       label: 'Matrix & Vector', icon: '🔲', description: 'Matrix operations and vector math' },
  { id: 'statistics',   label: 'Statistics',      icon: '📊', description: 'Descriptive stats, regression, distributions' },
  { id: 'financial',    label: 'Financial',       icon: '💰', description: 'Loans, investments, ROI, retirement' },
  { id: 'datetime',     label: 'Date & Time',     icon: '📅', description: 'Date difference, timezone, countdown' },
  { id: 'health',       label: 'Health',          icon: '🏃', description: 'BMI, BMR, TDEE, body composition' },
  { id: 'construction', label: 'Construction',    icon: '🏗️', description: 'Concrete, tiles, paint, stairs, Ohm\'s law' },
  { id: 'physics',      label: 'Physics & Chem',  icon: '⚗️', description: 'Kinematics, gas laws, molar mass, pH' },
  { id: 'programmer',   label: 'Programmer',      icon: '💻', description: 'Bits, hex, ASCII, regex, hash, Base64' },
  { id: 'age',          label: 'Age',             icon: '🎂', description: 'Exact age, birthday, zodiac, other planets' },
  { id: 'currency',     label: 'Currency',        icon: '💱', description: 'User-editable exchange rates — fully offline' },
  { id: 'area',         label: 'Area & Volume',   icon: '📐', description: 'All shapes — area, perimeter, volume' },
  { id: 'percentage',   label: 'Percentage',      icon: '%',  description: 'All percentage calculations' },
];

export const TOOLS = [
  // Basic
  { id: 'basic',                category: 'basic',        label: 'Basic Calculator',         path: '/basic' },
  // Scientific
  { id: 'scientific',           category: 'scientific',   label: 'Scientific Calculator',    path: '/scientific' },
  // Engineering
  { id: 'engineering',          category: 'engineering',  label: 'Engineering Calculator',   path: '/engineering' },
  { id: 'programmer',           category: 'programmer',   label: 'Programmer Calculator',    path: '/programmer' },
  // Graph
  { id: 'graph',                category: 'graph',        label: 'Graph Plotter (2D)',       path: '/graph' },
  // Equations
  { id: 'equation.linear',      category: 'equation',     label: 'Linear Equation',          path: '/equation/linear' },
  { id: 'equation.quadratic',   category: 'equation',     label: 'Quadratic Equation',       path: '/equation/quadratic' },
  { id: 'equation.cubic',       category: 'equation',     label: 'Cubic / Polynomial',       path: '/equation/polynomial' },
  { id: 'equation.system',      category: 'equation',     label: 'System of Equations',      path: '/equation/system' },
  // Calculus
  { id: 'calculus.derivative',  category: 'calculus',     label: 'Derivative',               path: '/calculus/derivative' },
  { id: 'calculus.integral',    category: 'calculus',     label: 'Numerical Integration',    path: '/calculus/integral' },
  { id: 'calculus.taylor',      category: 'calculus',     label: 'Taylor Series',            path: '/calculus/taylor' },
  // Matrix
  { id: 'matrix',               category: 'matrix',       label: 'Matrix Calculator',        path: '/matrix' },
  // Statistics
  { id: 'statistics',           category: 'statistics',   label: 'Statistics',               path: '/statistics' },
  // Financial
  { id: 'financial.loan',       category: 'financial',    label: 'Loan EMI',                 path: '/financial/loan' },
  { id: 'financial.compound',   category: 'financial',    label: 'Compound Interest',        path: '/financial/compound' },
  { id: 'financial.roi',        category: 'financial',    label: 'ROI / CAGR',               path: '/financial/roi' },
  { id: 'financial.npv',        category: 'financial',    label: 'NPV / IRR',                path: '/financial/npv' },
  { id: 'financial.retire',     category: 'financial',    label: 'Retirement Planner',       path: '/financial/retirement' },
  { id: 'financial.inflation',  category: 'financial',    label: 'Inflation Adjuster',       path: '/financial/inflation' },
  // Date & Time
  { id: 'datetime.diff',        category: 'datetime',     label: 'Date Difference',          path: '/datetime/diff' },
  { id: 'datetime.add',         category: 'datetime',     label: 'Add / Subtract Date',      path: '/datetime/add' },
  { id: 'datetime.timezone',    category: 'datetime',     label: 'Timezone Converter',       path: '/datetime/timezone' },
  { id: 'datetime.age',         category: 'datetime',     label: 'Age Calculator',           path: '/age' },
  // Health
  { id: 'health.bmi',           category: 'health',       label: 'BMI',                      path: '/health/bmi' },
  { id: 'health.bmr',           category: 'health',       label: 'BMR / TDEE',               path: '/health/bmr' },
  { id: 'health.bodyfat',       category: 'health',       label: 'Body Fat %',               path: '/health/bodyfat' },
  { id: 'health.calories',      category: 'health',       label: 'Calorie & Macros',         path: '/health/calories' },
  { id: 'health.water',         category: 'health',       label: 'Water Intake',             path: '/health/water' },
  // Construction
  { id: 'construction.concrete',category: 'construction', label: 'Concrete Volume',          path: '/construction/concrete' },
  { id: 'construction.tiles',   category: 'construction', label: 'Tiles / Flooring',         path: '/construction/tiles' },
  { id: 'construction.paint',   category: 'construction', label: 'Paint Coverage',           path: '/construction/paint' },
  { id: 'construction.stairs',  category: 'construction', label: 'Staircase Builder',        path: '/construction/stairs' },
  { id: 'construction.ohm',     category: 'construction', label: 'Ohm\'s Law',               path: '/construction/ohm' },
  // Physics
  { id: 'physics.kinematics',   category: 'physics',      label: 'Kinematics',               path: '/physics/kinematics' },
  { id: 'physics.force',        category: 'physics',      label: 'Force / Work / Energy',    path: '/physics/force' },
  { id: 'physics.gas',          category: 'physics',      label: 'Ideal Gas Law',            path: '/physics/gas' },
  { id: 'physics.molar',        category: 'physics',      label: 'Molar Mass',               path: '/physics/molar' },
  { id: 'physics.ph',           category: 'physics',      label: 'pH / pOH',                 path: '/physics/ph' },
  { id: 'physics.decay',        category: 'physics',      label: 'Radioactive Decay',        path: '/physics/decay' },
  // Age
  { id: 'age',                  category: 'age',          label: 'Age Calculator',           path: '/age' },
  // Currency
  { id: 'currency',             category: 'currency',     label: 'Currency Converter',       path: '/currency' },
  // Area
  { id: 'area.shapes',          category: 'area',         label: 'Area & Perimeter',         path: '/area' },
  { id: 'area.volume',          category: 'area',         label: 'Volume',                   path: '/volume' },
  // Percentage
  { id: 'percentage',           category: 'percentage',   label: 'Percentage',               path: '/percentage' },
];

export const toolsMap = new Map(TOOLS.map(t => [t.id, t]));
export const categoriesMap = new Map(CATEGORIES.map(c => [c.id, c]));

export function getToolsByCategory(catId) {
  return TOOLS.filter(t => t.category === catId);
}

export function searchTools(query) {
  const q = query.toLowerCase();
  return TOOLS.filter(t =>
    t.label.toLowerCase().includes(q) ||
    t.id.toLowerCase().includes(q) ||
    (categoriesMap.get(t.category)?.label || '').toLowerCase().includes(q)
  );
}
