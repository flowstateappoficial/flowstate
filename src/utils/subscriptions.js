// ── SUBSCRIPTION / RECURRING EXPENSE DETECTION ENGINE ──
// Analisa transações e identifica despesas recorrentes (subscrições)

// Keywords conhecidas de subscrições populares
// priority: 'essencial' (utilities, housing), 'importante' (health, transport), 'opcional' (entertainment, extras)
const KNOWN_SUBS = {
  'netflix':          { nome: 'Netflix',              emoji: '🎬', cat: 'Lazer', priority: 'opcional' },
  'spotify':          { nome: 'Spotify',              emoji: '🎵', cat: 'Lazer', priority: 'opcional' },
  'apple tv':         { nome: 'Apple TV+',            emoji: '📺', cat: 'Lazer', priority: 'opcional' },
  'disney':           { nome: 'Disney+',              emoji: '🏰', cat: 'Lazer', priority: 'opcional' },
  'hbo':              { nome: 'HBO Max',              emoji: '📺', cat: 'Lazer', priority: 'opcional' },
  'prime video':      { nome: 'Prime Video',          emoji: '📦', cat: 'Lazer', priority: 'opcional' },
  'youtube premium':  { nome: 'YouTube Premium',      emoji: '▶️', cat: 'Lazer', priority: 'opcional' },
  'twitch':           { nome: 'Twitch',               emoji: '🎮', cat: 'Lazer', priority: 'opcional' },
  'steam':            { nome: 'Steam',                emoji: '🎮', cat: 'Lazer', priority: 'opcional' },
  'playstation':      { nome: 'PlayStation Plus',     emoji: '🎮', cat: 'Lazer', priority: 'opcional' },
  'xbox':             { nome: 'Xbox Game Pass',       emoji: '🎮', cat: 'Lazer', priority: 'opcional' },
  'google storage':   { nome: 'Google One',           emoji: '☁️', cat: 'Outro', priority: 'opcional' },
  'google one':       { nome: 'Google One',           emoji: '☁️', cat: 'Outro', priority: 'opcional' },
  'icloud':           { nome: 'iCloud+',              emoji: '☁️', cat: 'Outro', priority: 'opcional' },
  'microsoft 365':    { nome: 'Microsoft 365',        emoji: '💼', cat: 'Outro', priority: 'opcional' },
  'adobe':            { nome: 'Adobe',                emoji: '🎨', cat: 'Outro', priority: 'opcional' },
  'dropbox':          { nome: 'Dropbox',              emoji: '📁', cat: 'Outro', priority: 'opcional' },
  'notion':           { nome: 'Notion',               emoji: '📝', cat: 'Outro', priority: 'opcional' },
  'chatgpt':          { nome: 'ChatGPT Plus',         emoji: '🤖', cat: 'Outro', priority: 'opcional' },
  'openai':           { nome: 'OpenAI',               emoji: '🤖', cat: 'Outro', priority: 'opcional' },
  'claude':           { nome: 'Claude Pro',           emoji: '🤖', cat: 'Outro', priority: 'opcional' },
  'canva':            { nome: 'Canva Pro',            emoji: '🎨', cat: 'Outro', priority: 'opcional' },
  'github':           { nome: 'GitHub',               emoji: '💻', cat: 'Outro', priority: 'opcional' },
  'ginásio':          { nome: 'Ginásio',              emoji: '💪', cat: 'Saúde', priority: 'importante' },
  'gym':              { nome: 'Ginásio',              emoji: '💪', cat: 'Saúde', priority: 'importante' },
  'fitness':          { nome: 'Fitness',              emoji: '💪', cat: 'Saúde', priority: 'importante' },
  'vodafone':         { nome: 'Vodafone',             emoji: '📱', cat: 'Habitação', priority: 'essencial' },
  'nos ':             { nome: 'NOS',                  emoji: '📱', cat: 'Habitação', priority: 'essencial' },
  'meo':              { nome: 'MEO',                  emoji: '📱', cat: 'Habitação', priority: 'essencial' },
  'nowo':             { nome: 'NOWO',                 emoji: '📱', cat: 'Habitação', priority: 'essencial' },
  'edp':              { nome: 'EDP',                  emoji: '⚡', cat: 'Habitação', priority: 'essencial' },
  'galp gas':         { nome: 'Galp Gás',             emoji: '🔥', cat: 'Habitação', priority: 'essencial' },
  'epal':             { nome: 'EPAL (Água)',          emoji: '💧', cat: 'Habitação', priority: 'essencial' },
  'condominio':       { nome: 'Condomínio',           emoji: '🏠', cat: 'Habitação', priority: 'essencial' },
  'condomínio':       { nome: 'Condomínio',           emoji: '🏠', cat: 'Habitação', priority: 'essencial' },
  'seguro':           { nome: 'Seguro',               emoji: '🛡️', cat: 'Outro', priority: 'importante' },
  'via verde':        { nome: 'Via Verde',            emoji: '🛣️', cat: 'Transportes', priority: 'importante' },
};

// localStorage key for user subscription preferences (cancel flags, custom priority)
const LS_SUB_PREFS = 'fs_sub_prefs_v1';

export function loadSubPrefs() {
  try { const raw = localStorage.getItem(LS_SUB_PREFS); return raw ? JSON.parse(raw) : {}; } catch { return {}; }
}

export function saveSubPrefs(prefs) {
  try { localStorage.setItem(LS_SUB_PREFS, JSON.stringify(prefs)); } catch {}
}

export function toggleCancelFlag(key) {
  const prefs = loadSubPrefs();
  prefs[key] = prefs[key] || {};
  prefs[key].markedCancel = !prefs[key].markedCancel;
  if (prefs[key].markedCancel) prefs[key].cancelDate = new Date().toISOString();
  else delete prefs[key].cancelDate;
  saveSubPrefs(prefs);
  return prefs;
}

export function setSubPriority(key, priority) {
  const prefs = loadSubPrefs();
  prefs[key] = prefs[key] || {};
  prefs[key].priority = priority;
  saveSubPrefs(prefs);
  return prefs;
}

function normalize(str) {
  return (str || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
}

// Identifica uma subscrição conhecida a partir da descrição
function matchKnown(desc) {
  const norm = normalize(desc);
  for (const [key, info] of Object.entries(KNOWN_SUBS)) {
    if (norm.includes(key)) return info;
  }
  return null;
}

/**
 * Detecta despesas recorrentes analisando padrões nas transações.
 * Uma despesa é considerada recorrente se aparece em 2+ meses diferentes
 * com descrição semelhante.
 */
export function detectSubscriptions(txs) {
  // Filtra apenas despesas
  const expenses = txs.filter(t => t.type === 'despesa' && t.val > 0);

  // Agrupa por descrição normalizada
  const groups = {};
  for (const tx of expenses) {
    const norm = normalize(tx.desc);
    // Usa os primeiros 20 chars como chave (para agrupar variações)
    const key = norm.slice(0, 20);
    if (!groups[key]) groups[key] = [];
    groups[key].push(tx);
  }

  const subscriptions = [];

  for (const [key, txList] of Object.entries(groups)) {
    // Precisa aparecer em pelo menos 2 meses diferentes
    const months = new Set(txList.map(t => t.date?.slice(0, 7)));
    if (months.size < 2) continue;

    // Calcula valor médio
    const avgVal = txList.reduce((s, t) => s + t.val, 0) / txList.length;

    // Tenta match com subscrição conhecida
    const known = matchKnown(txList[0].desc);

    // Ordena por data para pegar a mais recente
    const sorted = [...txList].sort((a, b) => b.date.localeCompare(a.date));
    const lastDate = sorted[0].date;
    const lastMonth = lastDate?.slice(0, 7);

    // Verifica se ainda está ativa (apareceu nos últimos 2 meses)
    const now = new Date();
    const twoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 1);
    const twoMonthsAgoYM = twoMonthsAgo.toISOString().slice(0, 7);
    const isActive = lastMonth >= twoMonthsAgoYM;

    // Detect price changes: compare last 2 charges
    let priceChange = null;
    if (sorted.length >= 2) {
      const diff = sorted[0].val - sorted[1].val;
      const pctChange = sorted[1].val > 0 ? Math.round((diff / sorted[1].val) * 100) : 0;
      if (Math.abs(pctChange) >= 5) {
        priceChange = { diff: Math.round(diff * 100) / 100, pct: pctChange, prev: sorted[1].val };
      }
    }

    // Load user prefs for this sub
    const subPrefs = loadSubPrefs();
    const userPref = subPrefs[key] || {};

    subscriptions.push({
      key,
      nome: known?.nome || txList[0].desc,
      emoji: known?.emoji || '🔄',
      cat: known?.cat || txList[0].cat || 'Outro',
      priority: userPref.priority || known?.priority || 'opcional',
      avgVal: Math.round(avgVal * 100) / 100,
      lastVal: sorted[0].val,
      lastDate,
      months: months.size,
      isActive,
      isKnown: !!known,
      priceChange,
      markedCancel: !!userPref.markedCancel,
    });
  }

  // Ordena: ativas primeiro, depois por valor (mais caro primeiro)
  subscriptions.sort((a, b) => {
    if (a.isActive !== b.isActive) return a.isActive ? -1 : 1;
    return b.avgVal - a.avgVal;
  });

  // Calcula totais
  const activeSubs = subscriptions.filter(s => s.isActive);
  const totalMensal = activeSubs.reduce((s, sub) => s + sub.avgVal, 0);
  const totalAnual = Math.round(totalMensal * 12 * 100) / 100;

  // Totals by priority
  const essencial = activeSubs.filter(s => s.priority === 'essencial').reduce((s, sub) => s + sub.avgVal, 0);
  const importante = activeSubs.filter(s => s.priority === 'importante').reduce((s, sub) => s + sub.avgVal, 0);
  const opcional = activeSubs.filter(s => s.priority === 'opcional').reduce((s, sub) => s + sub.avgVal, 0);
  const cancelable = activeSubs.filter(s => s.markedCancel);
  const savingIfCancel = cancelable.reduce((s, sub) => s + sub.avgVal, 0);

  return {
    subscriptions,
    activeSubs,
    totalMensal: Math.round(totalMensal * 100) / 100,
    totalAnual,
    count: activeSubs.length,
    byPriority: {
      essencial: Math.round(essencial * 100) / 100,
      importante: Math.round(importante * 100) / 100,
      opcional: Math.round(opcional * 100) / 100,
    },
    cancelable,
    savingIfCancel: Math.round(savingIfCancel * 100) / 100,
  };
}
