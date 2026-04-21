// Flowstate — Send Beta End Email
// Envia a todos os users com recompensas pendentes um email a anunciar o fim
// da beta e os meses Plus / dias de trial que vão receber no próximo checkout.
//
// Só pode ser chamada por um admin whitelisted (mesma lista usada em fs_end_beta).
//
// Deploy: supabase functions deploy send-beta-end-email
//
// Env vars necessários:
//   RESEND_API_KEY             re_...
//   EMAIL_FROM                 "Flowstate <no-reply@flowstateapp.pt>"
//   APP_URL                    https://www.flowstateapp.pt
//   SUPABASE_URL               (auto)
//   SUPABASE_SERVICE_ROLE_KEY  (auto)
//
// Client call:
//   await supabase.functions.invoke('send-beta-end-email', { body: {} });

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { sendEmail } from '../_shared/email.ts';

const APP_URL = Deno.env.get('APP_URL') ?? 'https://www.flowstateapp.pt';

const ADMIN_EMAILS = new Set<string>([
  'flowstate.app.oficial@gmail.com',
]);

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

type RewardRow = {
  user_id: string;
  reward_type: string;
  quantity: number;
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  try {
    // ── Auth: apenas admin whitelisted ──
    const authHeader = req.headers.get('Authorization') ?? '';
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();

    const supa = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { data: userRes, error: userErr } = await supa.auth.getUser(token);
    if (userErr || !userRes?.user) {
      return json({ error: 'not_authenticated' }, 401);
    }
    const callerEmail = (userRes.user.email || '').toLowerCase();
    if (!ADMIN_EMAILS.has(callerEmail)) {
      return json({ error: 'not_authorized' }, 403);
    }

    // ── Agrega recompensas pendentes por user ──
    // Todas as linhas delivered_at not null, redeemed_at null (beta terminada
    // mas ainda não foi aplicada em checkout).
    const { data: rows, error: rowsErr } = await supa
      .from('fs_pending_rewards')
      .select('user_id, reward_type, quantity')
      .not('delivered_at', 'is', null)
      .is('redeemed_at', null);

    if (rowsErr) {
      console.error('[send-beta-end-email] query rewards failed', rowsErr);
      return json({ error: 'query_failed', detail: rowsErr.message }, 500);
    }

    if (!rows || rows.length === 0) {
      return json({ ok: true, sent: 0, skipped: 0, note: 'no_pending_rewards' });
    }

    const byUser = new Map<string, { plus_months: number; trial_days: number }>();
    for (const row of rows as RewardRow[]) {
      const entry = byUser.get(row.user_id) ?? { plus_months: 0, trial_days: 0 };
      if (row.reward_type === 'plus_month_free') {
        entry.plus_months += row.quantity ?? 0;
      } else if (row.reward_type === 'trial_extension_7d') {
        entry.trial_days += (row.quantity ?? 0) * 7;
      }
      byUser.set(row.user_id, entry);
    }

    // ── Envia email a cada user ──
    let sent = 0;
    let skipped = 0;
    const errors: Array<{ user_id: string; error: string }> = [];

    for (const [userId, totals] of byUser.entries()) {
      try {
        const { data: userInfo, error: uErr } = await supa.auth.admin.getUserById(userId);
        if (uErr || !userInfo?.user?.email) {
          console.warn('[send-beta-end-email] no email for user', userId, uErr?.message);
          skipped += 1;
          continue;
        }

        const email = userInfo.user.email;
        const firstName =
          (userInfo.user.user_metadata?.full_name as string | undefined)?.split(' ')[0] ||
          (userInfo.user.user_metadata?.name as string | undefined)?.split(' ')[0] ||
          undefined;

        const html = betaEndHtml({
          firstName,
          plusMonths: totals.plus_months,
          trialDays: totals.trial_days,
          appUrl: APP_URL,
        });
        const text = betaEndText({
          firstName,
          plusMonths: totals.plus_months,
          trialDays: totals.trial_days,
          appUrl: APP_URL,
        });

        await sendEmail({
          to: email,
          subject: 'A beta terminou — as tuas recompensas estão prontas',
          html,
          text,
          tags: [
            { name: 'type', value: 'beta_end' },
            { name: 'user_id', value: userId },
          ],
        });

        sent += 1;
      } catch (e: any) {
        console.error('[send-beta-end-email] send failed for', userId, e);
        errors.push({ user_id: userId, error: String(e?.message ?? e) });
      }
    }

    return json({ ok: true, sent, skipped, errors: errors.length > 0 ? errors : undefined });
  } catch (e: any) {
    console.error('[send-beta-end-email] fatal', e);
    return json({ error: 'internal', detail: String(e?.message ?? e) }, 500);
  }
});

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}

// ── TEMPLATE ──────────────────────────────────────────────────────────────

function formatRewards(plusMonths: number, trialDays: number): string {
  const parts: string[] = [];
  if (plusMonths > 0) {
    parts.push(`${plusMonths} ${plusMonths === 1 ? 'mês' : 'meses'} de Flow Plus`);
  }
  if (trialDays > 0) {
    parts.push(`${trialDays} dias extra de trial`);
  }
  if (parts.length === 0) return '';
  if (parts.length === 1) return parts[0];
  return parts.slice(0, -1).join(', ') + ' e ' + parts[parts.length - 1];
}

function betaEndHtml(opts: {
  firstName?: string;
  plusMonths: number;
  trialDays: number;
  appUrl: string;
}) {
  const { firstName, plusMonths, trialDays, appUrl } = opts;
  const hi = firstName ? `Olá ${escapeHtml(firstName)},` : 'Olá,';
  const rewardsLine = formatRewards(plusMonths, trialDays);

  return `<!DOCTYPE html>
<html lang="pt">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>A beta terminou — as tuas recompensas estão prontas</title>
</head>
<body style="margin:0;padding:0;background:#0a0d1f;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#e7ecff;">
  <div style="max-width:560px;margin:0 auto;padding:40px 24px;">
    <div style="text-align:center;margin-bottom:32px;">
      <div style="font-size:22px;font-weight:800;letter-spacing:-.02em;color:#00D764;">FLOWSTATE</div>
    </div>

    <div style="background:#161a2e;border:1px solid rgba(255,255,255,.08);border-radius:20px;padding:32px 28px;">
      <div style="display:inline-block;padding:6px 12px;border-radius:20px;background:rgba(0,215,100,.15);color:#00D764;font-size:11px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;margin-bottom:20px;">
        Beta terminada
      </div>

      <h1 style="font-size:24px;font-weight:800;letter-spacing:-.02em;color:#fff;margin:0 0 16px;line-height:1.2;">
        ${hi} obrigado por teres estado connosco desde o início.
      </h1>

      <p style="font-size:15px;line-height:1.6;color:#b8bfda;margin:0 0 20px;">
        A beta do Flowstate acabou oficialmente. Sem ti e sem os teus convites nada disto era possível — por isso as recompensas que ganhaste estão todas prontas para usar.
      </p>

      ${rewardsLine ? `
      <div style="padding:18px 20px;border-radius:12px;background:rgba(0,215,100,.06);border:1px solid rgba(0,215,100,.2);margin:20px 0 24px;">
        <div style="font-size:11px;color:#8892b0;text-transform:uppercase;letter-spacing:.1em;margin-bottom:8px;">
          As tuas recompensas
        </div>
        <div style="font-size:18px;font-weight:700;color:#fff;line-height:1.4;">
          ${escapeHtml(rewardsLine)}
        </div>
      </div>
      ` : ''}

      <p style="font-size:15px;line-height:1.6;color:#b8bfda;margin:0 0 20px;">
        Aplicam-se automaticamente no teu próximo checkout Plus — não precisas de código nenhum.${trialDays > 0 ? ' O trial adicional soma-se aos 7 dias habituais.' : ''}
      </p>

      <div style="text-align:center;margin:28px 0 12px;">
        <a href="${appUrl}" style="display:inline-block;padding:14px 32px;border-radius:12px;background:#00D764;color:#000;font-weight:800;font-size:13px;letter-spacing:.1em;text-transform:uppercase;text-decoration:none;">
          Abrir Flowstate
        </a>
      </div>

      <div style="margin-top:28px;padding-top:20px;border-top:1px solid rgba(255,255,255,.06);">
        <p style="font-size:13px;color:#8892b0;margin:0;line-height:1.6;">
          Dúvidas? Responde a este email ou escreve para
          <a href="mailto:suporte@flowstateapp.pt" style="color:#00D764;text-decoration:none;">suporte@flowstateapp.pt</a>.
        </p>
      </div>
    </div>

    <div style="text-align:center;margin-top:24px;font-size:12px;color:#6e7491;line-height:1.6;">
      Recebeste este email porque tens recompensas da beta do Flowstate.
    </div>
  </div>
</body>
</html>`;
}

function betaEndText(opts: {
  firstName?: string;
  plusMonths: number;
  trialDays: number;
  appUrl: string;
}) {
  const { firstName, plusMonths, trialDays, appUrl } = opts;
  const hi = firstName ? `Olá ${firstName},` : 'Olá,';
  const rewardsLine = formatRewards(plusMonths, trialDays);

  return [
    hi,
    ``,
    `A beta do Flowstate acabou oficialmente. Obrigado por teres estado connosco.`,
    ``,
    rewardsLine ? `As tuas recompensas: ${rewardsLine}.` : '',
    `Aplicam-se automaticamente no teu próximo checkout Plus — não precisas de código nenhum.${trialDays > 0 ? ' O trial adicional soma-se aos 7 dias habituais.' : ''}`,
    ``,
    `Abrir Flowstate: ${appUrl}`,
    ``,
    `— Equipa Flowstate`,
    `suporte@flowstateapp.pt`,
  ].filter(Boolean).join('\n');
}

function escapeHtml(s: string) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
