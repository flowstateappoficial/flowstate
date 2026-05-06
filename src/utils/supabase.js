import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './constants';

let sbClient = null;

export function getSupabaseClient() {
  if (sbClient) return sbClient;
  try {
    sbClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      }
    });
    return sbClient;
  } catch (e) {
    console.warn('Supabase init error:', e);
    return null;
  }
}

// ── TRANSACTION OPERATIONS ──
export async function loadTxsFromSupabase(userId) {
  const sb = getSupabaseClient();
  if (!sb || !userId) return null;
  try {
    const { data, error } = await sb.from('transactions').select('*').eq('user_id', userId).order('date', { ascending: false });
    if (error) { console.warn('loadTxs:', error.message); return null; }
    return data.map(r => ({ id: r.id, desc: r.description, val: parseFloat(r.amount), type: r.type, cat: r.category || 'Outro', date: r.date }));
  } catch (e) { return null; }
}

export async function saveTxToSupabase(t, userId) {
  const sb = getSupabaseClient();
  if (!sb || !userId) return;
  const row = { user_id: userId, description: t.desc, amount: t.val, type: t.type, category: t.cat, date: t.date };
  try {
    if (t.id && typeof t.id === 'string' && t.id.includes('-')) {
      await sb.from('transactions').update(row).eq('id', t.id).eq('user_id', userId);
    } else {
      const { data, error } = await sb.from('transactions').insert([row]).select('id').single();
      if (!error && data) t.id = data.id;
    }
  } catch (e) { console.warn('saveTx:', e); }
}

export async function deleteTxFromSupabase(id, userId) {
  const sb = getSupabaseClient();
  if (!sb || !userId) return;
  try { await sb.from('transactions').delete().eq('id', id).eq('user_id', userId); } catch (e) {}
}

// ── GOALS OPERATIONS ──
export async function loadGoalsFromSupabase(userId) {
  const sb = getSupabaseClient();
  if (!sb || !userId) return null;
  try {
    const { data, error } = await sb.from('goals').select('*').eq('user_id', userId).order('created_at', { ascending: true });
    if (error) { console.warn('goals:', error.message); return null; }
    return data.map(r => ({ id: r.id, nome: r.title, atual: parseFloat(r.current_amount) || 0, meta: parseFloat(r.target_amount) || 0, cor: r.color || '#00D764' }));
  } catch (e) { return null; }
}

export async function saveGoalToSupabase(obj, userId) {
  const sb = getSupabaseClient();
  if (!sb || !userId) { console.warn('[GOAL] No sb or userId', { sb: !!sb, userId }); return null; }
  try {
    const row = { user_id: userId, title: obj.nome, target_amount: obj.meta, current_amount: obj.atual, color: obj.cor, is_main: false };
    const isExisting = obj.id != null && obj.id !== '' && !String(obj.id).startsWith('local_');
    console.log('[GOAL] saveGoalToSupabase', { obj, row, isExisting });
    let resultData = null;
    if (isExisting) {
      const { data, error } = await sb.from('goals').update(row).eq('id', obj.id).eq('user_id', userId).select().single();
      console.log('[GOAL] UPDATE result:', { data, error: error?.message });
      if (error) { return null; }
      resultData = data;
    } else {
      const { data, error } = await sb.from('goals').insert([row]).select().single();
      console.log('[GOAL] INSERT result:', { data, error: error?.message });
      if (error) { return null; }
      resultData = data;
    }
    console.log('[GOAL] Returning:', resultData);
    return resultData;
  } catch (e) { console.error('[GOAL] Exception:', e); return null; }
}

export async function deleteGoalFromSupabase(id, userId) {
  const sb = getSupabaseClient();
  if (!sb || !userId) return;
  try { await sb.from('goals').delete().eq('id', id).eq('user_id', userId); } catch (e) {}
}

// ── INVESTMENTS OPERATIONS ──
export async function loadInvestmentsFromSupabase(userId) {
  const sb = getSupabaseClient();
  if (!sb || !userId) return null;
  try {
    const [resDefs, resEntries, resFe, resContribs, resFeContribs] = await Promise.all([
      sb.from('investments').select('*').eq('user_id', userId),
      sb.from('investment_entries').select('*').eq('user_id', userId),
      sb.from('fundo_emergencia').select('*').eq('user_id', userId),
      sb.from('investment_contribs').select('*').eq('user_id', userId),
      sb.from('fundo_contribs').select('*').eq('user_id', userId)
    ]);
    const ativos = (!resDefs.error && resDefs.data)
      ? resDefs.data.map(r => ({ id: r.id, nome: r.name, tipo: r.type, cor: r.color || '#00D764', notas: r.notes || '', meta: parseFloat(r.target_amount) || 0 }))
      : null;
    const ativoEntries = {};
    if (!resEntries.error && resEntries.data) {
      resEntries.data.forEach(e => {
        if (!ativoEntries[e.investment_id]) ativoEntries[e.investment_id] = {};
        ativoEntries[e.investment_id][e.month] = parseFloat(e.value) || 0;
      });
    }
    const ativoContribs = {};
    if (!resContribs.error && resContribs.data) {
      resContribs.data.forEach(c => {
        if (!ativoContribs[c.investment_id]) ativoContribs[c.investment_id] = {};
        ativoContribs[c.investment_id][c.month] = parseFloat(c.amount) || 0;
      });
    } else if (resContribs.error) {
      // Tabela pode ainda não existir (migration pendente) — degrada silenciosamente.
      console.warn('investment_contribs:', resContribs.error.message);
    }
    const feEntries = {};
    if (!resFe.error && resFe.data) {
      resFe.data.forEach(r => { feEntries[r.month] = { value: parseFloat(r.value) || 0, meta: parseFloat(r.meta) || 0 }; });
    }
    const feContribs = {};
    if (!resFeContribs.error && resFeContribs.data) {
      resFeContribs.data.forEach(r => { feContribs[r.month] = parseFloat(r.amount) || 0; });
    } else if (resFeContribs.error) {
      console.warn('fundo_contribs:', resFeContribs.error.message);
    }
    return { ativos, ativoEntries, ativoContribs, feEntries, feContribs };
  } catch (e) {
    console.warn('loadInvestmentsFromSupabase failed:', e);
    return null;
  }
}

export async function saveAtivoToSupabase(obj, userId) {
  const sb = getSupabaseClient();
  if (!sb || !userId) return null;
  try {
    const row = { user_id: userId, name: obj.nome, type: obj.tipo, color: obj.cor, notes: obj.notas, target_amount: parseFloat(obj.meta) || 0 };
    if (obj.id && typeof obj.id === 'string' && obj.id.includes('-')) {
      const { data, error } = await sb.from('investments').update(row).eq('id', obj.id).eq('user_id', userId).select('id').single();
      if (!error && data) return data.id;
    } else {
      const { data, error } = await sb.from('investments').insert([row]).select('id').single();
      if (!error && data) return data.id;
    }
    return null;
  } catch (e) { console.warn('saveAtivo:', e); return null; }
}

export async function deleteAtivoFromSupabase(id, userId) {
  const sb = getSupabaseClient();
  if (!sb || !userId) return;
  try {
    await sb.from('investment_entries').delete().eq('investment_id', id).eq('user_id', userId);
    await sb.from('investment_contribs').delete().eq('investment_id', id).eq('user_id', userId);
    await sb.from('investments').delete().eq('id', id).eq('user_id', userId);
  } catch (e) {}
}

export async function saveAtivoEntry(ativId, month, value, userId) {
  const sb = getSupabaseClient();
  if (!sb || !userId) return false;
  try {
    const { error } = await sb.from('investment_entries').upsert([{ investment_id: ativId, user_id: userId, month, value }], { onConflict: 'investment_id,month' });
    return !error;
  } catch (e) { return false; }
}

export async function saveAtivoContrib(ativId, month, amount, userId) {
  const sb = getSupabaseClient();
  if (!sb || !userId) return false;
  try {
    const { error } = await sb.from('investment_contribs').upsert([{ investment_id: ativId, user_id: userId, month, amount }], { onConflict: 'investment_id,month' });
    return !error;
  } catch (e) { return false; }
}

export async function saveFundoEmergencia(month, value, meta, userId) {
  const sb = getSupabaseClient();
  if (!sb || !userId) return false;
  try {
    const { error } = await sb.from('fundo_emergencia').upsert([{ user_id: userId, month, value, meta }], { onConflict: 'user_id,month' });
    return !error;
  } catch (e) { return false; }
}

export async function saveFundoContrib(month, amount, userId) {
  const sb = getSupabaseClient();
  if (!sb || !userId) return false;
  try {
    const { error } = await sb.from('fundo_contribs').upsert([{ user_id: userId, month, amount }], { onConflict: 'user_id,month' });
    return !error;
  } catch (e) { return false; }
}

export async function saveBudgetToSupabase(rendimentoMensal, budget, userId) {
  const sb = getSupabaseClient();
  if (!sb || !userId) return;
  try {
    await sb.from('fundo_emergencia').upsert([{
      user_id: userId,
      month: '__budget__',
      value: rendimentoMensal,
      meta: JSON.stringify(budget)
    }], { onConflict: 'user_id,month' });
  } catch (e) { console.warn('saveBudget:', e); }
}

export async function loadBudgetFromSupabase(userId) {
  const sb = getSupabaseClient();
  if (!sb || !userId) return null;
  try {
    const { data } = await sb.from('fundo_emergencia')
      .select('value,meta')
      .eq('user_id', userId)
      .eq('month', '__budget__')
      .maybeSingle();
    if (data) {
      const rendimentoMensal = parseFloat(data.value) || 0;
      let budget = {};
      try { if (data.meta) budget = JSON.parse(String(data.meta)); } catch (e) {}
      return { rendimentoMensal, budget };
    }
  } catch (e) {}
  return null;
}

// ── USER RECURRINGS (Subscrições geridas pelo utilizador) ──
// Tabela: public.user_recurrings (ver supabase/migrations/20260505_user_recurrings.sql)

function rowToRecurring(r) {
  return {
    id: r.id,
    name: r.name,
    emoji: r.emoji || '💳',
    defaultAmount: parseFloat(r.default_amount) || 0,
    isVariable: !!r.is_variable,
    cadence: r.cadence || 'monthly',
    dayOfPeriod: r.day_of_period || 1,
    category: r.category || 'util',
    isTrial: !!r.is_trial,
    trialEndDate: r.trial_end_date,
    trialReminded: !!r.trial_reminded,
    cancelledAt: r.cancelled_at,
    payments: r.payments || {},
    createdAt: r.created_at,
    updatedAt: r.updated_at
  };
}

function recurringToRow(s, userId) {
  return {
    user_id: userId,
    name: s.name,
    emoji: s.emoji || '💳',
    default_amount: s.defaultAmount || 0,
    is_variable: !!s.isVariable,
    cadence: s.cadence || 'monthly',
    day_of_period: s.dayOfPeriod || 1,
    category: s.category || 'util',
    is_trial: !!s.isTrial,
    trial_end_date: s.trialEndDate || null,
    trial_reminded: !!s.trialReminded,
    cancelled_at: s.cancelledAt || null,
    payments: s.payments || {}
  };
}

export async function loadRecurringsFromSupabase(userId) {
  const sb = getSupabaseClient();
  if (!sb || !userId) return null;
  try {
    const { data, error } = await sb
      .from('user_recurrings')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });
    if (error) { console.warn('loadRecurrings:', error.message); return null; }
    return (data || []).map(rowToRecurring);
  } catch (e) { console.warn('loadRecurrings:', e); return null; }
}

export async function saveRecurringToSupabase(sub, userId) {
  // DEBUG: logs explícitos para diagnosticar saves silenciosos em produção
  console.log('[saveRec] called with', { subId: sub?.id, name: sub?.name, userId });
  const sb = getSupabaseClient();
  if (!sb) { console.warn('[saveRec] no supabase client'); return sub; }
  if (!userId) { console.warn('[saveRec] no userId'); return sub; }
  const row = recurringToRow(sub, userId);
  console.log('[saveRec] row to insert/update:', row);
  try {
    const isUpdate = sub.id && typeof sub.id === 'string' && sub.id.includes('-');
    console.log('[saveRec] path:', isUpdate ? 'UPDATE' : 'INSERT');
    if (isUpdate) {
      const { data, error } = await sb
        .from('user_recurrings')
        .update(row)
        .eq('id', sub.id)
        .eq('user_id', userId)
        .select('*')
        .maybeSingle();
      if (error) { console.error('[saveRec] update error:', error); return sub; }
      console.log('[saveRec] update success, data:', data);
      return data ? rowToRecurring(data) : sub;
    } else {
      const { data, error, status, statusText } = await sb
        .from('user_recurrings')
        .insert([row])
        .select('*')
        .single();
      if (error) {
        console.error('[saveRec] insert error:', error, 'status:', status, statusText);
        return sub;
      }
      console.log('[saveRec] insert success, data:', data, 'status:', status);
      return data ? rowToRecurring(data) : sub;
    }
  } catch (e) {
    console.error('[saveRec] exception:', e);
    return sub;
  }
}

export async function deleteRecurringFromSupabase(id, userId) {
  const sb = getSupabaseClient();
  if (!sb || !userId || !id) return;
  try {
    await sb.from('user_recurrings').delete().eq('id', id).eq('user_id', userId);
  } catch (e) { console.warn('deleteRecurring:', e); }
}

