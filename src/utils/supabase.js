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
    const [resDefs, resEntries, resFe] = await Promise.all([
      sb.from('investments').select('*').eq('user_id', userId),
      sb.from('investment_entries').select('*').eq('user_id', userId),
      sb.from('fundo_emergencia').select('*').eq('user_id', userId)
    ]);
    const ativos = (!resDefs.error && resDefs.data)
      ? resDefs.data.map(r => ({ id: r.id, nome: r.name, tipo: r.type, cor: r.color || '#00D764', notas: r.notes || '' }))
      : null;
    const ativoEntries = {};
    if (!resEntries.error && resEntries.data) {
      resEntries.data.forEach(e => {
        if (!ativoEntries[e.investment_id]) ativoEntries[e.investment_id] = {};
        ativoEntries[e.investment_id][e.month] = parseFloat(e.value) || 0;
      });
    }
    const feEntries = {};
    if (!resFe.error && resFe.data) {
      resFe.data.forEach(r => { feEntries[r.month] = { value: parseFloat(r.value) || 0, meta: parseFloat(r.meta) || 0 }; });
    }
    return { ativos, ativoEntries, feEntries };
  } catch (e) {
    console.warn('loadInvestmentsFromSupabase failed:', e);
    return null;
  }
}

export async function saveAtivoToSupabase(obj, userId) {
  const sb = getSupabaseClient();
  if (!sb || !userId) return null;
  try {
    const row = { user_id: userId, name: obj.nome, type: obj.tipo, color: obj.cor, notes: obj.notas };
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

export async function saveFundoEmergencia(month, value, meta, userId) {
  const sb = getSupabaseClient();
  if (!sb || !userId) return false;
  try {
    const { error } = await sb.from('fundo_emergencia').upsert([{ user_id: userId, month, value, meta }], { onConflict: 'user_id,month' });
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
