// Submissão de feedback para a tabela `public.feedback` no Supabase.
//
// A tabela é criada via migration (ver /FEEDBACK_SETUP.md).
// A RLS permite INSERT a qualquer utilizador (incl. anónimos / landing page).
// O SELECT é bloqueado — só consegues ler via Supabase Dashboard (que usa service_role).

import { getSupabaseClient } from './supabase';

export function isFeedbackConfigured() {
  // Supabase já está configurado via constants.js → sempre disponível.
  return !!getSupabaseClient();
}

export async function submitFeedback({ type, message, email }) {
  const sb = getSupabaseClient();
  if (!sb) throw new Error('Supabase não inicializado.');

  // Tenta obter o user_id se estiver logado (opcional — landing page é anónima).
  let userId = null;
  try {
    const { data } = await sb.auth.getUser();
    userId = data?.user?.id || null;
  } catch {}

  const payload = {
    user_id: userId,
    type,
    message,
    email: (email && email.trim()) ? email.trim() : null,
    page: typeof window !== 'undefined' ? window.location.href.slice(0, 500) : null,
    user_agent: typeof navigator !== 'undefined' ? navigator.userAgent.slice(0, 500) : null,
  };

  const { error } = await sb.from('feedback').insert([payload]);
  if (error) {
    console.warn('submitFeedback error:', error.message);
    throw new Error(error.message || 'Falha a enviar feedback.');
  }
  return { ok: true };
}
