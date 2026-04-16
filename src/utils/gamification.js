// ── GAMIFICATION ENGINE ──
// Streaks, Badges, Nível Financeiro

const LS_STREAK = 'fs_streak_v1';
const LS_BADGES = 'fs_badges_v1';

// ── BADGE DEFINITIONS ──
export const BADGE_DEFS = [
  // Transações
  { id: 'first_tx',      emoji: '🔥', nome: 'Primeira Chama',     desc: 'Registaste a primeira transação' },
  { id: 'tx_10',         emoji: '📊', nome: 'Analista',           desc: 'Registaste 10 transações' },
  { id: 'tx_50',         emoji: '📈', nome: 'Contabilista',       desc: 'Registaste 50 transações' },
  { id: 'tx_100',        emoji: '💯', nome: 'Centurião',          desc: 'Registaste 100 transações' },
  // Saldo
  { id: 'positive_month',emoji: '🏆', nome: 'Mês Positivo',      desc: 'Terminaste um mês com saldo positivo' },
  { id: 'saved_more',    emoji: '📉', nome: 'Gastos em Queda',    desc: 'Gastaste menos que o mês anterior' },
  // Taxa de Fuga
  { id: 'fuga_30',       emoji: '🚀', nome: 'Fuga 30%',          desc: 'Taxa de Fuga atingiu 30%' },
  { id: 'fuga_50',       emoji: '💪', nome: 'Fuga 50%',          desc: 'Taxa de Fuga atingiu 50%' },
  { id: 'fuga_70',       emoji: '⚡', nome: 'Fuga Máxima',        desc: 'Taxa de Fuga atingiu 70%' },
  // Objetivos
  { id: 'first_goal',    emoji: '🎯', nome: 'Objetivo Definido',  desc: 'Criaste o primeiro objetivo' },
  { id: 'goal_done',     emoji: '✅', nome: 'Missão Cumprida',    desc: 'Atingiste 100% de um objetivo' },
  // Streaks
  { id: 'streak_3',      emoji: '🔥', nome: '3 Dias Seguidos',   desc: 'Usaste a app 3 dias seguidos' },
  { id: 'streak_7',      emoji: '🔥', nome: 'Semana de Fogo',    desc: 'Usaste a app 7 dias seguidos' },
  { id: 'streak_30',     emoji: '⚡', nome: 'Mês Imparável',      desc: 'Usaste a app 30 dias seguidos' },
  // Investimentos
  { id: 'first_invest',  emoji: '💰', nome: 'Investidor',         desc: 'Adicionaste o primeiro investimento' },
  { id: 'emergency_fund',emoji: '🛡️', nome: 'Fundo de Paz',       desc: 'Criaste um fundo de emergência' },
  // Budget
  { id: 'budget_set',    emoji: '📋', nome: 'Orçamento Criado',   desc: 'Definiste o teu orçamento mensal' },
  { id: 'under_budget',  emoji: '🎉', nome: 'Dentro do Limite',   desc: 'Ficaste dentro do orçamento num mês' },
];

// ── STREAK MANAGEMENT ──
export function loadStreak() {
  try {
    const raw = localStorage.getItem(LS_STREAK);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { current: 0, best: 0, lastDate: null };
}

export function updateStreak() {
  const streak = loadStreak();
  const today = new Date().toISOString().slice(0, 10);

  if (streak.lastDate === today) return streak; // Já contou hoje

  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

  if (streak.lastDate === yesterday) {
    // Dia consecutivo
    streak.current += 1;
  } else {
    // Streak quebrado (ou primeiro uso)
    streak.current = 1;
  }

  streak.best = Math.max(streak.best, streak.current);
  streak.lastDate = today;

  try { localStorage.setItem(LS_STREAK, JSON.stringify(streak)); } catch {}
  return streak;
}

// ── BADGE MANAGEMENT ──
export function loadBadges() {
  try {
    const raw = localStorage.getItem(LS_BADGES);
    if (raw) return JSON.parse(raw); // { badgeId: unlockedDate, ... }
  } catch {}
  return {};
}

function saveBadges(badges) {
  try { localStorage.setItem(LS_BADGES, JSON.stringify(badges)); } catch {}
}

export function unlockBadge(badgeId) {
  const badges = loadBadges();
  if (badges[badgeId]) return { badges, isNew: false };
  badges[badgeId] = new Date().toISOString();
  saveBadges(badges);
  return { badges, isNew: true };
}

// ── EVALUATE ALL BADGES ──
// Chama isto sempre que o dashboard carrega ou os dados mudam
export function evaluateBadges({ txs, objetivos, ativos, feEntries, budget, streak }) {
  const newlyUnlocked = [];

  // Transações
  if (txs.length >= 1)   { const r = unlockBadge('first_tx');   if (r.isNew) newlyUnlocked.push('first_tx'); }
  if (txs.length >= 10)  { const r = unlockBadge('tx_10');      if (r.isNew) newlyUnlocked.push('tx_10'); }
  if (txs.length >= 50)  { const r = unlockBadge('tx_50');      if (r.isNew) newlyUnlocked.push('tx_50'); }
  if (txs.length >= 100) { const r = unlockBadge('tx_100');     if (r.isNew) newlyUnlocked.push('tx_100'); }

  // Saldo do mês atual positivo
  const curYM = new Date().toISOString().slice(0, 7);
  const curTxs = txs.filter(t => t.date && t.date.startsWith(curYM));
  const totalIn = curTxs.filter(t => t.type === 'rendimento').reduce((s, t) => s + t.val, 0);
  const totalOut = curTxs.filter(t => t.type === 'despesa').reduce((s, t) => s + t.val, 0);
  if (totalIn > totalOut && totalIn > 0) {
    const r = unlockBadge('positive_month'); if (r.isNew) newlyUnlocked.push('positive_month');
  }

  // Gastos em queda (comparação com mês anterior)
  const pm = new Date(); pm.setMonth(pm.getMonth() - 1);
  const prevYM = pm.getFullYear() + '-' + String(pm.getMonth() + 1).padStart(2, '0');
  const prevOut = txs.filter(t => t.date?.startsWith(prevYM) && t.type === 'despesa').reduce((s, t) => s + t.val, 0);
  if (prevOut > 0 && totalOut < prevOut) {
    const r = unlockBadge('saved_more'); if (r.isNew) newlyUnlocked.push('saved_more');
  }

  // Taxa de Fuga
  if (totalIn > 0) {
    const fuga = Math.round(((totalIn - totalOut) / totalIn) * 100);
    if (fuga >= 30) { const r = unlockBadge('fuga_30'); if (r.isNew) newlyUnlocked.push('fuga_30'); }
    if (fuga >= 50) { const r = unlockBadge('fuga_50'); if (r.isNew) newlyUnlocked.push('fuga_50'); }
    if (fuga >= 70) { const r = unlockBadge('fuga_70'); if (r.isNew) newlyUnlocked.push('fuga_70'); }
  }

  // Objetivos
  if (objetivos.length >= 1) {
    const r = unlockBadge('first_goal'); if (r.isNew) newlyUnlocked.push('first_goal');
  }
  if (objetivos.some(o => o.meta > 0 && o.atual >= o.meta)) {
    const r = unlockBadge('goal_done'); if (r.isNew) newlyUnlocked.push('goal_done');
  }

  // Streaks
  if (streak.current >= 3)  { const r = unlockBadge('streak_3');  if (r.isNew) newlyUnlocked.push('streak_3'); }
  if (streak.current >= 7)  { const r = unlockBadge('streak_7');  if (r.isNew) newlyUnlocked.push('streak_7'); }
  if (streak.current >= 30) { const r = unlockBadge('streak_30'); if (r.isNew) newlyUnlocked.push('streak_30'); }

  // Investimentos
  if (ativos && ativos.length >= 1) {
    const r = unlockBadge('first_invest'); if (r.isNew) newlyUnlocked.push('first_invest');
  }
  if (feEntries && Object.keys(feEntries).some(k => k !== '__budget__' && feEntries[k]?.value > 0)) {
    const r = unlockBadge('emergency_fund'); if (r.isNew) newlyUnlocked.push('emergency_fund');
  }

  // Budget
  if (budget && Object.keys(budget).some(k => budget[k] > 0)) {
    const r = unlockBadge('budget_set'); if (r.isNew) newlyUnlocked.push('budget_set');
  }
  if (budget && Object.keys(budget).length > 0 && totalOut > 0) {
    const allUnder = Object.keys(budget).every(cat => {
      const limit = budget[cat] || 0;
      if (limit <= 0) return true;
      const spent = curTxs.filter(t => t.type === 'despesa' && t.cat === cat).reduce((s, t) => s + t.val, 0);
      return spent <= limit;
    });
    if (allUnder) { const r = unlockBadge('under_budget'); if (r.isNew) newlyUnlocked.push('under_budget'); }
  }

  return { all: loadBadges(), newlyUnlocked };
}

// ── NÍVEL FINANCEIRO ──
// Calcula um nível de 1-10 baseado nos badges desbloqueados
export function calcFinancialLevel(badges) {
  const total = BADGE_DEFS.length;
  const unlocked = Object.keys(badges).length;
  if (unlocked === 0) return { level: 1, title: 'Iniciante', progress: 0 };

  const pct = unlocked / total;
  let level, title;

  if (pct >= 0.9)      { level = 10; title = 'Mestre Financeiro'; }
  else if (pct >= 0.75) { level = 8;  title = 'Especialista'; }
  else if (pct >= 0.6)  { level = 7;  title = 'Avançado'; }
  else if (pct >= 0.45) { level = 6;  title = 'Intermédio+'; }
  else if (pct >= 0.35) { level = 5;  title = 'Intermédio'; }
  else if (pct >= 0.25) { level = 4;  title = 'Aprendiz+'; }
  else if (pct >= 0.15) { level = 3;  title = 'Aprendiz'; }
  else if (pct >= 0.05) { level = 2;  title = 'Principiante'; }
  else                   { level = 1;  title = 'Iniciante'; }

  const progress = Math.round(pct * 100);
  return { level, title, progress, unlocked, total };
}
