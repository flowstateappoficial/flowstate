#!/usr/bin/env node
/**
 * Bump da versão do Service Worker antes de cada build.
 *
 * Substitui a constante VERSION em public/sw.js por um identificador
 * único baseado em timestamp. Isto garante que cada build gera um SW
 * diferente, obrigando os browsers a reinstalar e invalidar caches —
 * sem este passo, utilizadores com a PWA instalada ficam agarrados à
 * versão antiga indefinidamente.
 *
 * Ligado como `prebuild` no package.json, corre automaticamente.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const SW_PATH = resolve(__dirname, '..', 'public', 'sw.js');

// Versão: flowstate-YYYYMMDD-HHmm (legível, ordenável, único por minuto)
const now = new Date();
const pad = (n) => String(n).padStart(2, '0');
const version = [
  'flowstate',
  `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}`,
  `${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`,
].join('-');

let sw;
try {
  sw = readFileSync(SW_PATH, 'utf8');
} catch (e) {
  console.error(`[bump-sw-version] Falhou a ler ${SW_PATH}:`, e.message);
  process.exit(1);
}

const re = /const\s+VERSION\s*=\s*['"][^'"]*['"]\s*;/;
if (!re.test(sw)) {
  console.error('[bump-sw-version] Não encontrei `const VERSION = ...` em sw.js. Verifica o ficheiro.');
  process.exit(1);
}

const nextSW = sw.replace(re, `const VERSION = '${version}';`);
writeFileSync(SW_PATH, nextSW, 'utf8');

console.log(`[bump-sw-version] ✓ Service Worker → ${version}`);
