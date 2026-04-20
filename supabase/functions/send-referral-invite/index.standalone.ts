// Flowstate — Send Referral Invite (single-file / standalone)
// Versão autónoma para colar no Supabase Studio (sem imports do _shared).
// Nome da função (obrigatório): send-referral-invite
//
// Secrets necessários (definir em Project Settings → Edge Functions → Secrets):
//   RESEND_API_KEY    re_...
//   EMAIL_FROM        Flowstate <no-reply@flowstateapp.pt>
//   APP_URL           https://www.flowstateapp.pt
// (SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são injetados automaticamente.)

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const RESEND_ENDPOINT = 'https://api.resend.com/emails';
const DEFAULT_FROM = 'Flowstate <onboarding@resend.dev>';
const APP_URL = Deno.env.get('APP_URL') ?? 'https://www.flowstateapp.pt';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  try {
    const authHeader = req.headers.get('Authorization') ?? '';
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();

    const supa = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { global: { headers: { Authorization: `Bearer ${token}` } } }
    );

    const { data: { user }, error: authErr } = await supa.auth.getUser(token);
    if (authErr || !user) {
      console.error('[send-referral-invite] auth failed', JSON.stringify({
        tokenPreview: token.substring(0, 24),
        tokenLen: token.length,
        tokenIsJWT: /^eyJ/.test(token),
        authErr: authErr?.message,
        hasUser: !!user,
      }));
      return json({ error: 'not_authenticated' }, 401);
    }
    console.log('[send-referral-invite] authed as', user.id);

    const body = await req.json().catch(() => ({}));
    const to: string = String(body?.to || '').trim().toLowerCase();
    if (!to || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
      return json({ error: 'invalid_email' }, 400);
    }
    if (to === user.email?.toLowerCase()) {
      return json({ error: 'cannot_invite_self' }, 400);
    }

    // ── Garante código de referral ──
    const { data: code, error: codeErr } = await supa.rpc('fs_ensure_referral_code');
    if (codeErr || !code) {
      console.error('[send-referral-invite] ensure code:', codeErr?.message);
      return json({ error: 'no_referral_code' }, 500);
    }

    const referrerName =
      (user.user_metadata?.full_name as string | undefined) ||
      (user.user_metadata?.name as string | undefined) ||
      (user.email?.split('@')[0] ?? 'um amigo');

    const link = `${APP_URL}/convite/${code}`;
    const html = inviteHtml({ referrerName, code, link });
    const text = inviteText({ referrerName, code, link });

    await sendEmail({
      to,
      subject: `${referrerName} convida-te para o Flowstate`,
      html,
      text,
      replyTo: user.email || undefined,
      tags: [
        { name: 'type', value: 'referral_invite' },
        { name: 'referrer', value: user.id },
      ],
    });

    // Regista pending em referrals para já contar no invitesSent.
    await supa.from('referrals').insert({
      referrer_user_id: user.id,
      code,
      referred_email: to,
      status: 'pending',
    }).then(({ error }) => {
      if (error && !String(error.message).includes('duplicate')) {
        console.warn('[send-referral-invite] insert referral:', error.message);
      }
    });

    return json({ ok: true });
  } catch (e) {
    console.error('[send-referral-invite] fatal:', e);
    return json({ error: 'internal' }, 500);
  }
});

// ── Helpers ────────────────────────────────────────────────────────────────

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}

type SendArgs = {
  to: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
  tags?: Array<{ name: string; value: string }>;
};

async function sendEmail({ to, subject, html, text, replyTo, tags }: SendArgs) {
  const apiKey = Deno.env.get('RESEND_API_KEY');
  if (!apiKey) {
    console.warn('[email] RESEND_API_KEY not set — skipping send to', to);
    return { skipped: true };
  }
  const from = Deno.env.get('EMAIL_FROM') || DEFAULT_FROM;
  const res = await fetch(RESEND_ENDPOINT, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject,
      html,
      text: text || stripHtml(html),
      reply_to: replyTo,
      tags,
    }),
  });
  if (!res.ok) {
    const t = await res.text();
    console.error('[email] Resend error', res.status, t);
    throw new Error(`resend_${res.status}: ${t}`);
  }
  const data = await res.json().catch(() => ({}));
  console.log('[email] sent', { to, subject, id: data?.id });
  return data;
}

function stripHtml(html: string) {
  return html.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
}

function escapeHtml(s: string) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function inviteHtml({ referrerName, code, link }: { referrerName: string; code: string; link: string }) {
  return `<!DOCTYPE html>
<html lang="pt">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Convite para o Flowstate</title>
</head>
<body style="margin:0;padding:0;background:#0a0d1f;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#e7ecff;">
  <div style="max-width:560px;margin:0 auto;padding:40px 24px;">
    <div style="text-align:center;margin-bottom:32px;">
      <div style="font-size:22px;font-weight:800;letter-spacing:-.02em;color:#00D764;">FLOWSTATE</div>
    </div>
    <div style="background:#161a2e;border:1px solid rgba(255,255,255,.08);border-radius:20px;padding:32px 28px;">
      <div style="display:inline-block;padding:6px 12px;border-radius:20px;background:rgba(0,215,100,.15);color:#00D764;font-size:11px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;margin-bottom:20px;">
        Acesso beta
      </div>
      <h1 style="font-size:24px;font-weight:800;letter-spacing:-.02em;color:#fff;margin:0 0 16px;line-height:1.2;">
        ${escapeHtml(referrerName)} convida-te para o Flowstate.
      </h1>
      <p style="font-size:15px;line-height:1.6;color:#b8bfda;margin:0 0 20px;">
        O Flowstate é uma app portuguesa de finanças pessoais. Ainda estamos em beta fechada — com este código entras direto, sem lista de espera.
      </p>
      <div style="padding:16px 18px;border-radius:12px;background:rgba(0,215,100,.06);border:1px solid rgba(0,215,100,.2);margin:16px 0 24px;">
        <div style="font-size:11px;color:#8892b0;text-transform:uppercase;letter-spacing:.1em;margin-bottom:6px;">
          O teu código de convite
        </div>
        <div style="font-size:22px;font-weight:800;color:#fff;letter-spacing:.05em;font-family:ui-monospace,SF Mono,Menlo,monospace;">
          ${escapeHtml(code)}
        </div>
      </div>
      <div style="text-align:center;margin:20px 0;">
        <a href="${link}" style="display:inline-block;padding:14px 32px;border-radius:12px;background:#00D764;color:#000;font-weight:800;font-size:13px;letter-spacing:.1em;text-transform:uppercase;text-decoration:none;">
          Aceitar convite
        </a>
      </div>
      <p style="font-size:13px;line-height:1.6;color:#8892b0;margin:20px 0 0;text-align:center;">
        Ou abre manualmente:<br />
        <a href="${link}" style="color:#00D764;text-decoration:none;word-break:break-all;">${link}</a>
      </p>
    </div>
    <div style="text-align:center;margin-top:24px;font-size:12px;color:#6e7491;line-height:1.6;">
      Recebeste este email porque ${escapeHtml(referrerName)} te convidou.<br />
      Se não conheces o remetente, podes ignorar esta mensagem.
    </div>
  </div>
</body>
</html>`;
}

function inviteText({ referrerName, code, link }: { referrerName: string; code: string; link: string }) {
  return [
    `${referrerName} convida-te para o Flowstate.`,
    ``,
    `O Flowstate é uma app portuguesa de finanças pessoais, ainda em beta fechada.`,
    `Com este código entras direto, sem lista de espera.`,
    ``,
    `Código: ${code}`,
    `Link:   ${link}`,
    ``,
    `— Equipa Flowstate`,
  ].join('\n');
}
