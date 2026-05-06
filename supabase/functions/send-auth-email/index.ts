// Flowstate — Send Auth Email Hook
//
// Intercepta os emails do Supabase Auth (signup, recovery, magic link, etc.)
// e envia-os via Resend API direct, em vez de usar o SMTP relay built-in.
//
// Razão: o SMTP relay do Supabase falhava silenciosamente para destinatários
// Outlook/Hotmail (emails não chegavam, nem apareciam nos logs do Resend).
// Os emails enviados via Resend API direct chegam sem problemas (provámos
// com os convites).
//
// Configuração:
//   1. Deploy: supabase functions deploy send-auth-email --no-verify-jwt
//   2. No dashboard Supabase: Authentication → Hooks → Send Email Hook
//      • Type: HTTPS
//      • URL: https://<project>.supabase.co/functions/v1/send-auth-email
//      • Generate secret → guarda
//   3. Set secret as env var: supabase secrets set SEND_EMAIL_HOOK_SECRET=v1,whsec_xxx
//   4. (Opcional) Desliga o SMTP custom em Auth → SMTP — deixa de ser usado.
//
// Env vars necessárias:
//   RESEND_API_KEY            re_...
//   EMAIL_FROM                "Flowstate <no-reply@flowstateapp.pt>"
//   SEND_EMAIL_HOOK_SECRET    v1,whsec_xxx (do Supabase Auth Hook config)
//   SUPABASE_URL              auto-set
//
// Auth Hook payload (referência):
//   {
//     user: { id, email, ... },
//     email_data: {
//       token, token_hash, redirect_to, email_action_type,
//       site_url, token_new, token_hash_new
//     }
//   }

import { Webhook } from 'https://esm.sh/standardwebhooks@1.0.0';
import { sendEmail } from '../_shared/email.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const HOOK_SECRET = Deno.env.get('SEND_EMAIL_HOOK_SECRET') ?? '';

// ── Subjects por tipo de acção ────────────────────────────────────────────
const SUBJECTS: Record<string, string> = {
  signup:                'Confirma o teu email para começar no Flowstate',
  magiclink:             'O teu link de acesso ao Flowstate',
  recovery:              'Redefinir a tua password do Flowstate',
  email_change:          'Confirma o teu novo email',
  email_change_current:  'Confirma o teu novo email',
  email_change_new:      'Confirma o teu novo email',
  reauthentication:      'Código de verificação Flowstate',
  invite:                'Foste convidado para o Flowstate',
};

function pickSubject(action: string): string {
  return SUBJECTS[action] || 'Notificação do Flowstate';
}

// ── Construção do ConfirmationURL ─────────────────────────────────────────
function buildConfirmationURL(emailData: any): string {
  const url = new URL(`${SUPABASE_URL}/auth/v1/verify`);
  url.searchParams.set('token', emailData.token_hash);
  url.searchParams.set('type', emailData.email_action_type);
  if (emailData.redirect_to) {
    url.searchParams.set('redirect_to', emailData.redirect_to);
  }
  return url.toString();
}

// ── HTML wrapper comum (cabeçalho + footer com brand Flowstate) ──────────
function shellHtml(title: string, badgeColor: string, badgeBg: string, badgeBorder: string, badgeText: string, emoji: string, content: string): string {
  return `<!DOCTYPE html>
<html lang="pt">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#0a0d1f;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#e7ecff;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#0a0d1f;">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;">
          <tr>
            <td align="center" style="padding-bottom:32px;">
              <div style="font-size:22px;font-weight:800;letter-spacing:-.02em;color:#00D764;">FLOWSTATE</div>
            </td>
          </tr>
          <tr>
            <td style="background:#161a2e;border:1px solid rgba(255,255,255,.08);border-radius:20px;padding:32px 28px;">
              <div style="display:inline-block;padding:6px 12px;border-radius:20px;background:${badgeBg};color:${badgeColor};font-size:11px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;margin-bottom:20px;border:1px solid ${badgeBorder};">
                ${emoji} ${badgeText}
              </div>
              ${content}
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:24px 8px 0;">
              <div style="font-size:12px;color:#6e7491;line-height:1.7;">
                Precisas de ajuda? <a href="mailto:suporte@flowstateapp.pt" style="color:#00D764;text-decoration:none;">suporte@flowstateapp.pt</a>
                <br />
                <span style="font-size:11px;">© Flowstate · A tua app de finanças pessoais.</span>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function ctaButton(url: string, label: string): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr>
      <td align="center" style="padding:8px 0 24px;">
        <a href="${url}" style="display:inline-block;padding:14px 36px;border-radius:12px;background:#00D764;color:#000;font-weight:800;font-size:13px;letter-spacing:.1em;text-transform:uppercase;text-decoration:none;">
          ${label}
        </a>
      </td>
    </tr>
  </table>`;
}

function fallbackLink(url: string): string {
  return `<div style="padding:14px 16px;border-radius:10px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.06);margin:8px 0 4px;">
    <div style="font-size:11px;color:#6e7491;text-transform:uppercase;letter-spacing:.1em;margin-bottom:6px;">Não funciona o botão?</div>
    <div style="font-size:12px;color:#b8bfda;line-height:1.5;word-break:break-all;">
      <a href="${url}" style="color:#00D764;text-decoration:none;">${url}</a>
    </div>
  </div>`;
}

function warningBox(title: string, body: string): string {
  return `<div style="margin-top:24px;padding:14px 16px;border-radius:10px;background:rgba(247,147,26,.06);border:1px solid rgba(247,147,26,.2);">
    <div style="font-size:12px;color:#f7931a;font-weight:700;margin-bottom:4px;">⚠️ ${title}</div>
    <div style="font-size:12px;color:#b8bfda;line-height:1.5;">${body}</div>
  </div>`;
}

// ── Renderers por tipo de acção ───────────────────────────────────────────

function renderSignup(email: string, url: string): string {
  const content = `
    <h1 style="font-size:24px;font-weight:800;letter-spacing:-.02em;color:#fff;margin:0 0 16px;line-height:1.25;">
      Falta só um passo para começares.
    </h1>
    <p style="font-size:15px;line-height:1.6;color:#b8bfda;margin:0 0 24px;">
      Para confirmar que <strong style="color:#fff;">${email}</strong> é mesmo teu, carrega no botão abaixo. Em segundos ficas dentro da app.
    </p>
    ${ctaButton(url, 'Confirmar email')}
    ${fallbackLink(url)}
    <p style="font-size:12px;line-height:1.6;color:#6e7491;margin:20px 0 0;">
      Não foste tu que te registaste? Ignora este email e nada vai acontecer.
    </p>`;
  return shellHtml(
    'Confirma o teu email — Flowstate',
    '#00D764', 'rgba(0,215,100,.15)', 'rgba(0,215,100,.3)',
    'Confirma o teu email', '✉️',
    content
  );
}

function renderMagicLink(email: string, url: string): string {
  const content = `
    <h1 style="font-size:24px;font-weight:800;letter-spacing:-.02em;color:#fff;margin:0 0 16px;line-height:1.25;">
      O teu acesso ao Flowstate.
    </h1>
    <p style="font-size:15px;line-height:1.6;color:#b8bfda;margin:0 0 24px;">
      Carrega no botão abaixo para entrares na conta <strong style="color:#fff;">${email}</strong>. Sem password, sem chatices.
    </p>
    ${ctaButton(url, 'Entrar no Flowstate')}
    ${fallbackLink(url)}
    <p style="font-size:12px;line-height:1.6;color:#6e7491;margin:20px 0 0;">
      O link expira em 1 hora e só pode ser usado uma vez. Não pediste isto? Ignora o email.
    </p>`;
  return shellHtml(
    'Link de acesso — Flowstate',
    '#00D764', 'rgba(0,215,100,.15)', 'rgba(0,215,100,.3)',
    'Link de acesso', '🔗',
    content
  );
}

function renderRecovery(email: string, url: string): string {
  const content = `
    <h1 style="font-size:24px;font-weight:800;letter-spacing:-.02em;color:#fff;margin:0 0 16px;line-height:1.25;">
      Vamos redefinir a tua password.
    </h1>
    <p style="font-size:15px;line-height:1.6;color:#b8bfda;margin:0 0 24px;">
      Recebemos um pedido para redefinir a password da conta <strong style="color:#fff;">${email}</strong>. Carrega no botão abaixo para escolher uma nova.
    </p>
    ${ctaButton(url, 'Definir nova password')}
    ${fallbackLink(url)}
    ${warningBox('Não pediste isto?', 'Ignora este email — a tua password não muda. Mas se isto se repetir, contacta-nos.')}
    <p style="font-size:12px;line-height:1.6;color:#6e7491;margin:20px 0 0;">
      Por segurança, este link expira em 1 hora.
    </p>`;
  return shellHtml(
    'Redefinir password — Flowstate',
    '#7b7fff', 'rgba(123,127,255,.15)', 'rgba(123,127,255,.3)',
    'Pedido de nova password', '🔐',
    content
  );
}

function renderEmailChange(currentEmail: string, newEmail: string, url: string): string {
  const content = `
    <h1 style="font-size:24px;font-weight:800;letter-spacing:-.02em;color:#fff;margin:0 0 16px;line-height:1.25;">
      Confirma o teu novo email.
    </h1>
    <p style="font-size:15px;line-height:1.6;color:#b8bfda;margin:0 0 16px;">
      Pediste para mudar o email da tua conta de:
    </p>
    <div style="padding:14px 18px;border-radius:10px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.06);margin-bottom:10px;">
      <div style="font-size:11px;color:#6e7491;text-transform:uppercase;letter-spacing:.1em;margin-bottom:4px;">De</div>
      <div style="font-size:14px;color:#b8bfda;font-weight:600;">${currentEmail}</div>
    </div>
    <div style="padding:14px 18px;border-radius:10px;background:rgba(0,215,100,.06);border:1px solid rgba(0,215,100,.18);margin-bottom:24px;">
      <div style="font-size:11px;color:#00D764;text-transform:uppercase;letter-spacing:.1em;margin-bottom:4px;">Para</div>
      <div style="font-size:14px;color:#fff;font-weight:700;">${newEmail || currentEmail}</div>
    </div>
    <p style="font-size:14px;line-height:1.6;color:#b8bfda;margin:0 0 20px;">
      Carrega no botão para confirmar a alteração.
    </p>
    ${ctaButton(url, 'Confirmar mudança')}
    ${fallbackLink(url)}
    ${warningBox('Não foste tu?', 'Ignora este email. A mudança só acontece se carregares no botão acima.')}`;
  return shellHtml(
    'Confirma o novo email — Flowstate',
    '#7b7fff', 'rgba(123,127,255,.15)', 'rgba(123,127,255,.3)',
    'Mudança de email', '📧',
    content
  );
}

function renderInvite(email: string, url: string): string {
  const content = `
    <h1 style="font-size:24px;font-weight:800;letter-spacing:-.02em;color:#fff;margin:0 0 16px;line-height:1.25;">
      Foste convidado para o Flowstate.
    </h1>
    <p style="font-size:15px;line-height:1.6;color:#b8bfda;margin:0 0 16px;">
      Olá! Recebeste este convite para criares uma conta com o email <strong style="color:#fff;">${email}</strong>.
    </p>
    <p style="font-size:15px;line-height:1.6;color:#b8bfda;margin:0 0 24px;">
      O Flowstate é a tua app de finanças pessoais — controla gastos, define metas, acompanha investimentos. Tudo em português, simples e sem complicações.
    </p>
    ${ctaButton(url, 'Aceitar convite')}
    ${fallbackLink(url)}
    <p style="font-size:12px;line-height:1.6;color:#6e7491;margin:20px 0 0;">
      Não estavas à espera deste convite? Podes ignorar este email com toda a segurança.
    </p>`;
  return shellHtml(
    'Convite — Flowstate',
    '#00D764', 'rgba(0,215,100,.15)', 'rgba(0,215,100,.3)',
    'Tens um convite', '🎉',
    content
  );
}

function renderReauthentication(email: string, token: string): string {
  const content = `
    <h1 style="font-size:24px;font-weight:800;letter-spacing:-.02em;color:#fff;margin:0 0 16px;line-height:1.25;">
      Confirma que és tu.
    </h1>
    <p style="font-size:15px;line-height:1.6;color:#b8bfda;margin:0 0 24px;">
      Estás a fazer uma operação sensível na tua conta <strong style="color:#fff;">${email}</strong>. Usa o código abaixo para confirmar.
    </p>
    <div style="text-align:center;padding:24px 16px;border-radius:12px;background:rgba(0,215,100,.08);border:1px solid rgba(0,215,100,.25);margin:8px 0 24px;">
      <div style="font-size:11px;color:#00D764;text-transform:uppercase;letter-spacing:.15em;margin-bottom:10px;font-weight:700;">
        Código de verificação
      </div>
      <div style="font-size:36px;font-weight:800;color:#fff;letter-spacing:.4em;font-family:'SF Mono',Menlo,Consolas,monospace;">
        ${token}
      </div>
    </div>
    <p style="font-size:13px;line-height:1.6;color:#b8bfda;margin:0 0 12px;">
      Volta à app Flowstate e introduz este código no campo de verificação.
    </p>
    ${warningBox('Não foste tu?', 'Alguém pode estar a tentar aceder à tua conta. Não partilhes este código com ninguém. Muda já a tua password e contacta-nos.')}
    <p style="font-size:12px;line-height:1.6;color:#6e7491;margin:20px 0 0;">
      O código expira em 5 minutos.
    </p>`;
  return shellHtml(
    'Código de verificação — Flowstate',
    '#7b7fff', 'rgba(123,127,255,.15)', 'rgba(123,127,255,.3)',
    'Verificação de segurança', '🛡️',
    content
  );
}

function renderEmail(actionType: string, email: string, newEmail: string, url: string, token: string): string {
  switch (actionType) {
    case 'signup':                return renderSignup(email, url);
    case 'magiclink':             return renderMagicLink(email, url);
    case 'recovery':              return renderRecovery(email, url);
    case 'email_change':
    case 'email_change_current':
    case 'email_change_new':      return renderEmailChange(email, newEmail, url);
    case 'invite':                return renderInvite(email, url);
    case 'reauthentication':      return renderReauthentication(email, token);
    default:                      return renderSignup(email, url);
  }
}

// ── Handler ───────────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const payload = await req.text();
    const headers = Object.fromEntries(req.headers.entries());

    // Verificação de assinatura — Standard Webhooks
    let parsed: any;
    if (HOOK_SECRET) {
      try {
        const wh = new Webhook(HOOK_SECRET);
        parsed = wh.verify(payload, headers);
      } catch (err) {
        console.error('[send-auth-email] webhook verify failed', err);
        return new Response('invalid signature', { status: 401 });
      }
    } else {
      // Sem secret configurado — só para testes de desenvolvimento
      console.warn('[send-auth-email] SEND_EMAIL_HOOK_SECRET not set — accepting unverified payload');
      parsed = JSON.parse(payload);
    }

    const { user, email_data } = parsed;
    if (!user?.email || !email_data?.email_action_type) {
      return new Response('invalid payload', { status: 400 });
    }

    const actionType = email_data.email_action_type;
    const url = buildConfirmationURL(email_data);
    const subject = pickSubject(actionType);
    const html = renderEmail(
      actionType,
      user.email,
      email_data.new_email || '',
      url,
      email_data.token || ''
    );

    await sendEmail({
      to: user.email,
      subject,
      html,
      tags: [
        { name: 'category', value: 'auth' },
        { name: 'action', value: actionType },
      ],
    });

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[send-auth-email] error', err);
    return new Response(JSON.stringify({ error: String(err?.message || err) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
