// ── NOTIFICATION ENGINE ──
// Generates contextual financial alerts based on user data

const LS_NOTIFS = 'fs_notifications_v1';
const LS_NOTIFS_READ = 'fs_notifications_read_v1';

// Notification types with icons and colors
const NOTIF_TYPES = {
  budget_warning:  { icon: '⚠️', color: '#ffb347', label: 'Orçamento' },
  budget_exceeded: { icon: '🚨', color: '#ff6b6b', label: 'Orçamento' },
  goal_progress:   { icon: '🎯', color: '#00D764', label: 'Objetivo' },
  goal_reached:    { icon: '🏆', color: '#ffd700', label: 'Objetivo' },
  streak:          { icon: '🔥', color: '#ff9500', label: 'Streak' },
  saving_tip:      { icon: '💡', color: '#7b7fff', label: 'Dica' },
  subscription:    { icon: '🔄', color: '#e056a0', label: 'Subscrição' },
  monthly_summary: { icon: '📊', color: '#00D764', label: 'Resumo' },
  positive_month:  { icon: '🎉', color: '#00D764', label: 'Parabéns' },
  negative_month:  { icon: '📉', color: '#ff6b6b', label: 'Alerta' },
  trial_welcome:   { icon: '🎁', color: '#00D764', label: 'Trial' },
  trial_reminder:  { icon: '⏳', color: '#f7931a', label: 'Trial' },
  trial_urgent:    { icon: '⚡', color: '#e53935', label: 'Trial' },
  trial_expired:   { icon: '🔒', color: '#6e7491', label: 'Trial' },
};

export function getNotifType(type) {
  return NOTIF_TYPES[type] || { icon: '🔔', color: '#b8bfda', label: 'Info' };
}

// Load saved notifications from localStorage
export function loadNotifications() {
  try {
    const raw = localStorage.getItem(LS_NOTIFS);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveNotifications(notifs) {
  try { localStorage.setItem(LS_NOTIFS, JSON.stringify(notifs.slice(0, 50))); } catch {}
}

// Load read notification IDs
export function loadReadIds() {
  try {
    const raw = localStorage.getItem(LS_NOTIFS_READ);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export function saveReadIds(ids) {
  try { localStorage.setItem(LS_NOTIFS_READ, JSON.stringify(ids.slice(0, 100))); } catch {}
}

// Mark all as read
export function markAllRead(notifications) {
  const ids = notifications.map(n => n.id);
  saveReadIds(ids);
  return ids;
}

// Create a notification object
function createNotif(type, title, message, priority = 'normal') {
  return {
    id: `notif_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    type,
    title,
    message,
    priority, // 'high' | 'normal' | 'low'
    timestamp: new Date().toISOString(),
  };
}

// ── MAIN EVALUATION FUNCTION ──
// Runs all checks and returns { all: [...], new: [...] }
export function evaluateNotifications({ txs, objetivos, budget, rendimentoMensal, streak, currentMonth }) {
  const existing = loadNotifications();
  const existingKeys = new Set(existing.map(n => n._key));
  const newNotifs = [];
  const ym = currentMonth;

  const curTxs = txs.filter(t => t.date?.startsWith(ym));
  const totalIn = curTxs.filter(t => t.type === 'rendimento').reduce((s, t) => s + t.val, 0);
  const totalOut = curTxs.filter(t => t.type === 'despesa').reduce((s, t) => s + t.val, 0);
  const saldo = totalIn - totalOut;

  // Helper to avoid duplicate notifications
  const add = (key, type, title, message, priority) => {
    const fullKey = `${ym}_${key}`;
    if (!existingKeys.has(fullKey)) {
      const n = createNotif(type, title, message, priority);
      n._key = fullKey;
      newNotifs.push(n);
    }
  };

  // 1. BUDGET ALERTS — per category
  const despMes = curTxs.filter(t => t.type === 'despesa');
  Object.keys(budget).forEach(cat => {
    if (budget[cat] <= 0) return;
    const spent = despMes.filter(t => t.cat === cat).reduce((s, t) => s + t.val, 0);
    const pct = Math.round((spent / budget[cat]) * 100);
    if (pct >= 100) {
      add(`budget_exceeded_${cat}`, 'budget_exceeded',
        `${cat} ultrapassou o limite`,
        `Gastaste ${spent.toFixed(0)}€ de ${budget[cat].toFixed(0)}€ em ${cat} (${pct}%).`,
        'high');
    } else if (pct >= 80) {
      add(`budget_warning_${cat}`, 'budget_warning',
        `${cat} quase no limite`,
        `Já usaste ${pct}% do orçamento de ${cat} (${spent.toFixed(0)}€ de ${budget[cat].toFixed(0)}€).`,
        'normal');
    }
  });

  // 2. GOAL ALERTS
  objetivos.forEach(obj => {
    if (!obj.target || obj.target <= 0) return;
    const pct = Math.round((obj.current / obj.target) * 100);
    if (pct >= 100) {
      add(`goal_reached_${obj.id}`, 'goal_reached',
        `Objetivo "${obj.title}" concluído!`,
        `Atingiste a meta de ${obj.target.toFixed(0)}€. Parabéns!`,
        'high');
    } else if (pct >= 75) {
      add(`goal_progress_${obj.id}_75`, 'goal_progress',
        `${obj.title} — ${pct}% concluído`,
        `Faltam apenas ${(obj.target - obj.current).toFixed(0)}€ para atingires o objetivo.`,
        'normal');
    } else if (pct >= 50) {
      add(`goal_progress_${obj.id}_50`, 'goal_progress',
        `${obj.title} — metade do caminho!`,
        `Já tens ${pct}% do teu objetivo. Continua assim!`,
        'low');
    }
  });

  // 3. STREAK ALERTS
  if (streak?.current === 3) {
    add('streak_3', 'streak', 'Streak de 3 dias!', 'Estás a criar um bom hábito financeiro. Não quebres a sequência!', 'normal');
  } else if (streak?.current === 7) {
    add('streak_7', 'streak', 'Uma semana seguida!', '7 dias consecutivos a gerir as tuas finanças. Impressionante!', 'normal');
  } else if (streak?.current === 30) {
    add('streak_30', 'streak', 'Streak de 30 dias!', 'Um mês inteiro! Estás no caminho para a excelência financeira.', 'high');
  }

  // 4. MONTHLY BALANCE ALERTS
  if (totalIn > 0 && totalOut > 0) {
    if (saldo > 0) {
      const savingRate = Math.round((saldo / totalIn) * 100);
      if (savingRate >= 30) {
        add('positive_month_great', 'positive_month',
          `Mês excelente — ${savingRate}% poupado!`,
          `Poupaste ${saldo.toFixed(0)}€ este mês. Taxa de poupança acima dos 30%!`,
          'normal');
      }
    } else {
      add('negative_month', 'negative_month',
        'Despesas acima do rendimento',
        `Gastaste mais ${Math.abs(saldo).toFixed(0)}€ do que ganhaste este mês. Revê as categorias com mais peso.`,
        'high');
    }
  }

  // 5. SAVING TIPS (contextual)
  if (despMes.length > 0) {
    const cats = {};
    despMes.forEach(t => { cats[t.cat] = (cats[t.cat] || 0) + t.val; });
    const topCat = Object.entries(cats).sort((a, b) => b[1] - a[1])[0];
    if (topCat && topCat[1] > totalOut * 0.4) {
      add('saving_tip_topcat', 'saving_tip',
        `${topCat[0]} representa ${Math.round((topCat[1] / totalOut) * 100)}% das despesas`,
        `Considera definir um orçamento para ${topCat[0]} para controlar melhor os gastos.`,
        'low');
    }
  }

  // 6. SUBSCRIPTION REMINDERS
  // Detect subscriptions approaching renewal (simplified)
  if (curTxs.length === 0 && new Date().getDate() <= 5) {
    add('monthly_summary_reminder', 'monthly_summary',
      'Novo mês, novos registos!',
      'Começa a registar as tuas transações de ' + ym.split('-').reverse().join('/') + ' para manteres o controlo.',
      'low');
  }

  // Merge and save
  const all = [...newNotifs, ...existing].slice(0, 50);
  saveNotifications(all);

  return { all, newNotifs };
}

// ── TRIAL NOTIFICATIONS ──
// Pushes milestone notifications based on current trial state.
// Relies on the trial object's notifiedDays to avoid duplicates.
export function evaluateTrialNotifications(trialStatus, markNotifiedFn) {
  if (!trialStatus || !trialStatus.hasTrial) return { all: loadNotifications(), newNotifs: [] };
  const existing = loadNotifications();
  const newNotifs = [];
  const notified = new Set((trialStatus.trial?.notifiedDays) || []);

  const push = (key, type, title, message, priority) => {
    if (notified.has(key)) return;
    const n = createNotif(type, title, message, priority);
    n._key = `trial_${key}`;
    newNotifs.push(n);
    if (markNotifiedFn) markNotifiedFn(key);
  };

  if (trialStatus.active) {
    const dl = trialStatus.daysLeft;
    const de = trialStatus.daysElapsed;
    if (de === 0 && !notified.has('welcome')) {
      push('welcome', 'trial_welcome',
        'Bem-vindo ao Flow Plus!',
        'Tens 7 dias para explorar a aba de Investimentos, a Calculadora e as dicas avançadas. Sem cartão de crédito.',
        'high');
    }
    if (dl <= 4 && dl > 2 && !notified.has('halfway')) {
      push('halfway', 'trial_reminder',
        `Faltam ${dl} dias de trial`,
        'Já experimentaste o Flow Plus? Assina antes do fim do trial para manteres o acesso.',
        'normal');
    }
    if (dl === 2 && !notified.has('d2')) {
      push('d2', 'trial_urgent',
        'Faltam 2 dias — oferta especial',
        'Subscreve agora o Flow Plus com 20% de desconto no primeiro ano.',
        'high');
    }
    if (dl === 1 && !notified.has('d1')) {
      push('d1', 'trial_urgent',
        'Último dia do teu trial',
        'O teu acesso ao Flow Plus termina amanhã. Assina para não perderes o progresso.',
        'high');
    }
  } else if (trialStatus.expired && !notified.has('expired')) {
    push('expired', 'trial_expired',
      'O trial Flow Plus terminou',
      'Voltaste ao plano Free. Reativa o Flow Plus para recuperares os investimentos e a calculadora.',
      'high');
  }

  const all = [...newNotifs, ...existing].slice(0, 50);
  saveNotifications(all);
  return { all, newNotifs };
}
