// ── FLOWSTATE WRAPPED — Annual Analysis Engine ──

const PT_MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

function fmtE(val) {
  return (val || 0).toLocaleString('pt-PT', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';
}

// Financial personality profiles
const PROFILES = [
  { id: 'poupador', title: 'O Poupador Estratégico', emoji: '🏆', desc: 'Poupas consistentemente e tens controlo total das finanças.', condition: (d) => d.savingRate >= 30 && d.posMonths >= 8 },
  { id: 'equilibrado', title: 'O Equilibrista', emoji: '⚖️', desc: 'Manténs um bom equilíbrio entre gastar e poupar.', condition: (d) => d.savingRate >= 10 && d.savingRate < 30 },
  { id: 'explorador', title: 'O Explorador', emoji: '🧭', desc: 'Investes em experiências e diversificas os gastos.', condition: (d) => d.topCats.length >= 5 && d.totalOut > d.totalIn * 0.7 },
  { id: 'ambicioso', title: 'O Ambicioso', emoji: '🚀', desc: 'Rendimentos a crescer — estás a construir algo grande.', condition: (d) => d.incomeGrowth > 10 },
  { id: 'consciente', title: 'O Consciente', emoji: '🧘', desc: 'Começaste a prestar atenção às finanças. O primeiro passo é o mais importante.', condition: () => true },
];

export function generateWrappedData({ txs, objetivos, year }) {
  const y = year || new Date().getFullYear();
  const yearTxs = txs.filter(t => t.date?.startsWith(String(y)));

  if (yearTxs.length === 0) return null;

  // ── BASIC TOTALS ──
  const totalIn = yearTxs.filter(t => t.type === 'rendimento').reduce((s, t) => s + t.val, 0);
  const totalOut = yearTxs.filter(t => t.type === 'despesa').reduce((s, t) => s + t.val, 0);
  const totalSaved = totalIn - totalOut;
  const savingRate = totalIn > 0 ? Math.round((totalSaved / totalIn) * 100) : 0;
  const txCount = yearTxs.length;

  // ── MONTHLY BREAKDOWN ──
  const months = {};
  for (let m = 1; m <= 12; m++) {
    const ym = `${y}-${String(m).padStart(2, '0')}`;
    const mTxs = yearTxs.filter(t => t.date?.startsWith(ym));
    const mIn = mTxs.filter(t => t.type === 'rendimento').reduce((s, t) => s + t.val, 0);
    const mOut = mTxs.filter(t => t.type === 'despesa').reduce((s, t) => s + t.val, 0);
    months[m] = { in: mIn, out: mOut, saved: mIn - mOut, txCount: mTxs.length, name: PT_MESES[m - 1] };
  }

  // Best saving month
  const activeMonths = Object.entries(months).filter(([_, d]) => d.txCount > 0);
  const bestSavingMonth = activeMonths.length > 0
    ? activeMonths.reduce((best, [m, d]) => d.saved > best.saved ? { month: parseInt(m), saved: d.saved, name: d.name } : best, { month: 0, saved: -Infinity, name: '' })
    : null;

  // Worst month (most spending)
  const worstMonth = activeMonths.length > 0
    ? activeMonths.reduce((worst, [m, d]) => d.out > worst.out ? { month: parseInt(m), out: d.out, name: d.name } : worst, { month: 0, out: 0, name: '' })
    : null;

  // Positive months count
  const posMonths = activeMonths.filter(([_, d]) => d.saved > 0).length;

  // ── MONTHLY EVOLUTION (for chart) ──
  const monthlyEvolution = activeMonths.map(([m, d]) => ({
    month: PT_MESES[parseInt(m) - 1].slice(0, 3),
    in: Math.round(d.in),
    out: Math.round(d.out),
    saved: Math.round(d.saved),
  }));

  // ── CATEGORY ANALYSIS ──
  const catMap = {};
  yearTxs.filter(t => t.type === 'despesa').forEach(t => {
    catMap[t.cat] = (catMap[t.cat] || 0) + t.val;
  });
  const topCats = Object.entries(catMap)
    .sort((a, b) => b[1] - a[1])
    .map(([cat, val]) => ({ cat, val: Math.round(val * 100) / 100, pct: Math.round((val / totalOut) * 100) }));

  // ── MOST EXPENSIVE DAY ──
  const dayMap = {};
  yearTxs.filter(t => t.type === 'despesa').forEach(t => {
    dayMap[t.date] = (dayMap[t.date] || 0) + t.val;
  });
  const expensiveDay = Object.entries(dayMap).sort((a, b) => b[1] - a[1])[0];
  const mostExpensiveDay = expensiveDay ? {
    date: expensiveDay[0],
    val: Math.round(expensiveDay[1] * 100) / 100,
    formatted: new Date(expensiveDay[0]).toLocaleDateString('pt-PT', { day: 'numeric', month: 'long' })
  } : null;

  // ── MOST FREQUENT EXPENSE ──
  const descMap = {};
  yearTxs.filter(t => t.type === 'despesa').forEach(t => {
    const key = (t.desc || '').toLowerCase().trim();
    if (!descMap[key]) descMap[key] = { desc: t.desc, count: 0, total: 0 };
    descMap[key].count++;
    descMap[key].total += t.val;
  });
  const topExpense = Object.values(descMap).sort((a, b) => b.count - a.count)[0] || null;

  // ── INCOME GROWTH (first half vs second half) ──
  const h1In = Object.entries(months).filter(([m]) => parseInt(m) <= 6).reduce((s, [_, d]) => s + d.in, 0);
  const h2In = Object.entries(months).filter(([m]) => parseInt(m) > 6).reduce((s, [_, d]) => s + d.in, 0);
  const incomeGrowth = h1In > 0 ? Math.round(((h2In - h1In) / h1In) * 100) : 0;

  // ── GOALS PROGRESS ──
  const goalsCompleted = objetivos.filter(o => o.meta > 0 && o.atual >= o.meta).length;
  const goalsTotal = objetivos.length;

  // ── FINANCIAL PROFILE ──
  const profileData = { savingRate, posMonths, topCats, totalIn, totalOut, incomeGrowth };
  const profile = PROFILES.find(p => p.condition(profileData)) || PROFILES[PROFILES.length - 1];

  // ── SLIDES DATA ──
  const slides = [
    {
      id: 'intro',
      bg: 'linear-gradient(135deg, #0f1220 0%, #1a1f35 50%, #0f1220 100%)',
      accent: '#00D764',
      title: `O teu ${y}`,
      subtitle: 'em números',
      content: `Registaste ${txCount} transações ao longo do ano. Vamos ver como foi?`,
    },
    {
      id: 'totals',
      bg: 'linear-gradient(135deg, #0a1628 0%, #122040 100%)',
      accent: '#00D764',
      title: 'Visão geral',
      stats: [
        { label: 'Ganhaste', val: fmtE(totalIn), color: '#00D764' },
        { label: 'Gastaste', val: fmtE(totalOut), color: '#ff6b6b' },
        { label: savingRate >= 0 ? 'Poupaste' : 'Défice', val: fmtE(Math.abs(totalSaved)), color: savingRate >= 0 ? '#00D764' : '#ff6b6b' },
      ],
      footer: savingRate >= 0 ? `Taxa de poupança: ${savingRate}%` : `Gastaste ${Math.abs(savingRate)}% mais do que ganhaste`,
    },
    {
      id: 'bestMonth',
      bg: 'linear-gradient(135deg, #0a2618 0%, #0f3d28 100%)',
      accent: '#00D764',
      title: 'O teu melhor mês',
      highlight: bestSavingMonth?.name || '—',
      content: bestSavingMonth ? `Poupaste ${fmtE(bestSavingMonth.saved)} em ${bestSavingMonth.name}. O teu mês de ouro!` : 'Sem dados suficientes.',
      emoji: '🏆',
    },
    {
      id: 'expensiveDay',
      bg: 'linear-gradient(135deg, #2a0a0a 0%, #3d1515 100%)',
      accent: '#ff6b6b',
      title: 'O dia mais caro',
      highlight: mostExpensiveDay?.formatted || '—',
      content: mostExpensiveDay ? `Gastaste ${fmtE(mostExpensiveDay.val)} num único dia. Todos temos esses dias!` : 'Sem dados suficientes.',
      emoji: '💸',
    },
    {
      id: 'topCategories',
      bg: 'linear-gradient(135deg, #1a0f2e 0%, #2d1a4e 100%)',
      accent: '#7b7fff',
      title: 'Onde foi o dinheiro',
      categories: topCats.slice(0, 5),
    },
    {
      id: 'frequentExpense',
      bg: 'linear-gradient(135deg, #0f1a2e 0%, #1a2d4e 100%)',
      accent: '#ffb347',
      title: 'A despesa mais frequente',
      highlight: topExpense?.desc || '—',
      content: topExpense ? `Apareceu ${topExpense.count} vezes, num total de ${fmtE(topExpense.total)}.` : 'Sem dados.',
      emoji: '🔁',
    },
    {
      id: 'evolution',
      bg: 'linear-gradient(135deg, #0f1220 0%, #1a1f35 100%)',
      accent: '#00D764',
      title: 'A tua evolução',
      chart: monthlyEvolution,
      footer: incomeGrowth > 0
        ? `Os teus rendimentos cresceram ${incomeGrowth}% ao longo do ano!`
        : incomeGrowth < 0
          ? `Os rendimentos caíram ${Math.abs(incomeGrowth)}% — próximo ano será melhor!`
          : 'Rendimentos estáveis ao longo do ano.',
    },
    {
      id: 'goals',
      bg: 'linear-gradient(135deg, #1a2010 0%, #2d3a18 100%)',
      accent: '#00D764',
      title: 'Objetivos',
      highlight: `${goalsCompleted}/${goalsTotal}`,
      content: goalsCompleted > 0
        ? `Completaste ${goalsCompleted} objetivo${goalsCompleted > 1 ? 's' : ''}! Foco e disciplina.`
        : goalsTotal > 0
          ? `Tens ${goalsTotal} objetivo${goalsTotal > 1 ? 's' : ''} em progresso. Continua!`
          : 'Define objetivos para o próximo ano!',
      emoji: '🎯',
    },
    {
      id: 'profile',
      bg: 'linear-gradient(135deg, #1a0f28 0%, #2e1a48 50%, #1a0f28 100%)',
      accent: '#7b7fff',
      title: 'O teu perfil financeiro',
      profile,
    },
    {
      id: 'summary',
      bg: 'linear-gradient(135deg, #0f1220 0%, #1a1f35 100%)',
      accent: '#00D764',
      title: `${y} em resumo`,
      shareable: true,
      stats: [
        { label: 'Transações', val: String(txCount) },
        { label: 'Poupança', val: savingRate + '%' },
        { label: 'Meses positivos', val: `${posMonths}/12` },
        { label: 'Perfil', val: profile.emoji + ' ' + profile.title },
      ],
      footer: 'Flowstate · O teu Wrapped financeiro',
    },
  ];

  return { slides, year: y, profile, totalIn, totalOut, totalSaved, savingRate, txCount };
}
