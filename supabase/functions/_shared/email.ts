// Flowstate — Shared email helper (Resend)
//
// All edge functions that send email should import from here so we have a
// single place to tweak sender address, branding, and delivery logic.
//
// Env vars:
//   RESEND_API_KEY   re_...
//   EMAIL_FROM       "Flowstate <no-reply@flowstateapp.pt>"  (falls back to sandbox)

const RESEND_ENDPOINT = 'https://api.resend.com/emails';

const DEFAULT_FROM = 'Flowstate <onboarding@resend.dev>';

type SendArgs = {
  to: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
  tags?: Array<{ name: string; value: string }>;
};

export async function sendEmail({ to, subject, html, text, replyTo, tags }: SendArgs) {
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
    const body = await res.text();
    console.error('[email] Resend error', res.status, body);
    throw new Error(`resend_${res.status}: ${body}`);
  }

  const data = await res.json().catch(() => ({}));
  console.log('[email] sent', { to, subject, id: data?.id });
  return data;
}

function stripHtml(html: string) {
  return html.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
}

// ── TEMPLATES ──────────────────────────────────────────────────────────────

export function welcomeTrialHtml(opts: {
  firstName?: string;
  plan: string;            // 'plus' | 'max'
  trialEnd: Date;          // when the trial ends
  billingInterval: string; // 'month' | 'year'
  appUrl: string;
}) {
  const { firstName, plan, trialEnd, billingInterval, appUrl } = opts;
  const planLabel = plan === 'max' ? 'Flow Max' : 'Flow Plus';
  const priceLine = {
    'plus:month': '3,99 €/mês',
    'plus:year':  '35,99 €/ano',
    'max:month':  '7,99 €/mês',
    'max:year':   '71,99 €/ano',
  }[`${plan}:${billingInterval}`] || '';

  const dateFmt = trialEnd.toLocaleDateString('pt-PT', {
    day: '2-digit', month: 'long', year: 'numeric',
  });

  const hi = firstName ? `Olá ${firstName},` : 'Olá,';

  return `<!DOCTYPE html>
<html lang="pt">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Bem-vindo ao ${planLabel}</title>
</head>
<body style="margin:0;padding:0;background:#0a0d1f;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#e7ecff;">
  <div style="max-width:560px;margin:0 auto;padding:40px 24px;">
    <div style="text-align:center;margin-bottom:32px;">
      <div style="font-size:22px;font-weight:800;letter-spacing:-.02em;color:#00D764;">FLOWSTATE</div>
    </div>

    <div style="background:#161a2e;border:1px solid rgba(255,255,255,.08);border-radius:20px;padding:32px 28px;">
      <div style="display:inline-block;padding:6px 12px;border-radius:20px;background:rgba(0,215,100,.15);color:#00D764;font-size:11px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;margin-bottom:20px;">
        ${planLabel} · Trial ativo
      </div>

      <h1 style="font-size:24px;font-weight:800;letter-spacing:-.02em;color:#fff;margin:0 0 16px;line-height:1.2;">
        ${hi} bem-vindo ao Flowstate.
      </h1>

      <p style="font-size:15px;line-height:1.6;color:#b8bfda;margin:0 0 16px;">
        Tens <strong style="color:#fff;">7 dias grátis</strong> para explorar tudo o que o ${planLabel} oferece.
        Sem compromisso — cancelas quando quiseres.
      </p>

      <div style="padding:16px 18px;border-radius:12px;background:rgba(0,215,100,.06);border:1px solid rgba(0,215,100,.2);margin:24px 0;">
        <div style="font-size:11px;color:#8892b0;text-transform:uppercase;letter-spacing:.1em;margin-bottom:4px;">
          Trial termina em
        </div>
        <div style="font-size:18px;font-weight:700;color:#fff;margin-bottom:6px;">
          ${dateFmt}
        </div>
        ${priceLine ? `<div style="font-size:13px;color:#b8bfda;">
          Depois dessa data será cobrado <strong style="color:#fff;">${priceLine}</strong>. Podes cancelar antes sem qualquer custo.
        </div>` : ''}
      </div>

      <div style="text-align:center;margin:28px 0 16px;">
        <a href="${appUrl}" style="display:inline-block;padding:14px 32px;border-radius:12px;background:#00D764;color:#000;font-weight:800;font-size:13px;letter-spacing:.1em;text-transform:uppercase;text-decoration:none;">
          Abrir Flowstate
        </a>
      </div>

      <div style="margin-top:28px;padding-top:20px;border-top:1px solid rgba(255,255,255,.06);">
        <div style="font-size:13px;color:#b8bfda;line-height:1.6;margin-bottom:12px;">
          <strong style="color:#fff;">O que fazer primeiro:</strong>
        </div>
        <ul style="margin:0;padding:0 0 0 18px;color:#b8bfda;font-size:13px;line-height:1.8;">
          <li>Liga as tuas contas bancárias e começa a categorizar automaticamente</li>
          <li>Define metas de poupança e acompanha o progresso</li>
          <li>Explora o painel de investimentos</li>
        </ul>
      </div>
    </div>

    <div style="text-align:center;margin-top:24px;font-size:12px;color:#6e7491;line-height:1.6;">
      Precisas de ajuda? Responde a este email ou escreve para
      <a href="mailto:suporte@flowstateapp.pt" style="color:#00D764;text-decoration:none;">suporte@flowstateapp.pt</a>.
      <br />
      Podes gerir ou cancelar a tua subscrição em qualquer momento em <em>A minha conta</em>.
    </div>
  </div>
</body>
</html>`;
}

export function welcomeTrialText(opts: {
  firstName?: string;
  plan: string;
  trialEnd: Date;
}) {
  const planLabel = opts.plan === 'max' ? 'Flow Max' : 'Flow Plus';
  const dateFmt = opts.trialEnd.toLocaleDateString('pt-PT', {
    day: '2-digit', month: 'long', year: 'numeric',
  });
  const hi = opts.firstName ? `Olá ${opts.firstName},` : 'Olá,';
  return [
    `${hi}`,
    ``,
    `Bem-vindo ao Flowstate. Tens 7 dias grátis de ${planLabel}.`,
    ``,
    `O teu trial termina em ${dateFmt}. Podes cancelar antes sem qualquer custo em A minha conta.`,
    ``,
    `— Equipa Flowstate`,
    `suporte@flowstateapp.pt`,
  ].join('\n');
}
