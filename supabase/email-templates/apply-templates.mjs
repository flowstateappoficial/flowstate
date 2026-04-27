#!/usr/bin/env node
// Aplica os 6 templates HTML nesta pasta + os subjects ao projecto Supabase
// via Management API. Corre uma vez para configurar tudo.
//
// Uso:
//   node apply-templates.mjs
//
// Pré-requisitos:
//   1. Node 18+
//   2. Personal access token do Supabase em SUPABASE_ACCESS_TOKEN
//      Obténs em https://supabase.com/dashboard/account/tokens (botão "Generate new token")
//
// PowerShell:
//   $env:SUPABASE_ACCESS_TOKEN = "sbp_xxxxxxxxxxxx"
//   node apply-templates.mjs
//
// bash/zsh:
//   export SUPABASE_ACCESS_TOKEN="sbp_xxxxxxxxxxxx"
//   node apply-templates.mjs

import { readFileSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { homedir } from 'node:os';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_REF = 'myjgthxaldqiwxgnxjvd';

// ── 1. Resolver access token ──────────────────────────────────────────────
function resolveToken() {
  if (process.env.SUPABASE_ACCESS_TOKEN) {
    return process.env.SUPABASE_ACCESS_TOKEN.trim();
  }
  // Fallback: tentar ler do ficheiro do CLI (pode falhar se já está logado mas formato é diferente)
  const candidates = [
    resolve(homedir(), '.supabase', 'access-token'),
    process.env.APPDATA ? resolve(process.env.APPDATA, 'supabase', 'access-token') : null,
  ].filter(Boolean);
  for (const p of candidates) {
    if (existsSync(p)) {
      try {
        const v = readFileSync(p, 'utf8').trim();
        if (v) return v;
      } catch {}
    }
  }
  return null;
}

const token = resolveToken();
if (!token) {
  console.error('\n❌ Falta SUPABASE_ACCESS_TOKEN.');
  console.error('   1. Vai a https://supabase.com/dashboard/account/tokens');
  console.error('   2. Clica "Generate new token", dá-lhe um nome (ex: "flowstate-cli")');
  console.error('   3. Copia o token (sbp_...) — só aparece uma vez!');
  console.error('   4. PowerShell:  $env:SUPABASE_ACCESS_TOKEN = "sbp_..."');
  console.error('   5. Volta a correr: node apply-templates.mjs\n');
  process.exit(1);
}

// ── 2. Mapeamento template → field do API ──────────────────────────────────
const TEMPLATES = [
  {
    file: 'confirm-signup.html',
    subjectField: 'mailer_subjects_confirmation',
    contentField: 'mailer_templates_confirmation_content',
    subject: 'Confirma o teu email para começar no Flowstate',
  },
  {
    file: 'magic-link.html',
    subjectField: 'mailer_subjects_magic_link',
    contentField: 'mailer_templates_magic_link_content',
    subject: 'O teu link de acesso ao Flowstate',
  },
  {
    file: 'change-email.html',
    subjectField: 'mailer_subjects_email_change',
    contentField: 'mailer_templates_email_change_content',
    subject: 'Confirma o teu novo email',
  },
  {
    file: 'reset-password.html',
    subjectField: 'mailer_subjects_recovery',
    contentField: 'mailer_templates_recovery_content',
    subject: 'Redefinir a tua password do Flowstate',
  },
  {
    file: 'reauthentication.html',
    subjectField: 'mailer_subjects_reauthentication',
    contentField: 'mailer_templates_reauthentication_content',
    subject: 'Código de verificação Flowstate',
  },
  {
    file: 'invite.html',
    subjectField: 'mailer_subjects_invite',
    contentField: 'mailer_templates_invite_content',
    subject: 'Foste convidado para o Flowstate',
  },
];

// ── 3. Construir payload ──────────────────────────────────────────────────
const payload = {};
for (const t of TEMPLATES) {
  const path = resolve(__dirname, t.file);
  if (!existsSync(path)) {
    console.error(`❌ Ficheiro em falta: ${path}`);
    process.exit(1);
  }
  payload[t.subjectField] = t.subject;
  payload[t.contentField] = readFileSync(path, 'utf8');
  console.log(`  ✓ ${t.file.padEnd(28)} → ${t.subject}`);
}

// ── 4. PATCH ──────────────────────────────────────────────────────────────
const url = `https://api.supabase.com/v1/projects/${PROJECT_REF}/config/auth`;
console.log(`\n→ PATCH ${url}`);

const res = await fetch(url, {
  method: 'PATCH',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(payload),
});

const text = await res.text();
if (!res.ok) {
  console.error(`\n❌ Falhou (${res.status}):\n${text}\n`);
  process.exit(1);
}

console.log('\n✅ Templates aplicados com sucesso ao projecto', PROJECT_REF);
console.log('\n   Vai a https://supabase.com/dashboard/project/' + PROJECT_REF + '/auth/templates para confirmar.');
console.log('   Recomenda-se testar registando uma conta nova com um email teu pessoal.\n');
