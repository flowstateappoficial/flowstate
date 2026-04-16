import { KW, KW_VENC } from './constants';

// ── FORMATTERS ──
export function fmtV(n) {
  return (n || 0).toLocaleString('pt-PT', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';
}

export function fmtDate(s) {
  if (!s) return '';
  const [y, m, d] = s.split('-');
  return d + '/' + m + '/' + y;
}

export function getCurrentMonth() {
  const n = new Date();
  return n.getFullYear() + '-' + String(n.getMonth() + 1).padStart(2, '0');
}

export function normalizeStr(s) {
  return String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9\s]/g, ' ').trim();
}

// ── AUTO-CATEGORIZE ──
export function autoCateg(desc, userRules = {}) {
  const norm = normalizeStr(desc);
  for (const [kw, cat] of Object.entries(userRules)) {
    if (norm.includes(normalizeStr(kw))) return cat;
  }
  for (const [cat, kws] of Object.entries(KW)) {
    if (kws.some(kw => norm.includes(normalizeStr(kw)))) return cat;
  }
  return 'Outro';
}

// ── SALARY DATE RULE ──
export function dataEfetiva(t) {
  if (t.type !== 'rendimento') return t.date;
  const desc = (t.desc || '').toLowerCase();
  if (!KW_VENC.some(k => desc.includes(k)) && t.cat !== 'Rendimento') return t.date;
  const [y, m, d] = t.date.split('-').map(Number);
  const limiar = m === 2 ? 25 : 27;
  if (d < limiar) return t.date;
  let nm = m + 1, ny = y;
  if (nm > 12) { nm = 1; ny = y + 1; }
  return `${ny}-${String(nm).padStart(2, '0')}-01`;
}

export function txsComRegra(txs) {
  return txs.map(t => ({ ...t, date: dataEfetiva(t) }));
}

// ── CALCULATOR ──
export function fv(pv, pmt, r, n) {
  if (r === 0) return pv + pmt * n;
  const R = r / 12;
  return pv * Math.pow(1 + R, n) + pmt * (Math.pow(1 + R, n) - 1) / R;
}

// ── IMPORT HELPERS ──
import { COL_DATE_KW, COL_DESC_KW, COL_VAL_KW, COL_DEBIT_KW, COL_CREDIT_KW } from './constants';

export function detectColumns(headers) {
  const h = headers.map(x => (x || '').toLowerCase().trim());
  const find = kws => { for (const kw of kws) { const i = h.findIndex(x => x.includes(kw)); if (i >= 0) return i; } return -1; };
  return { dateCol: find(COL_DATE_KW), descCol: find(COL_DESC_KW), valCol: find(COL_VAL_KW), debitCol: find(COL_DEBIT_KW), creditCol: find(COL_CREDIT_KW) };
}

export function parseAnyNumber(str) {
  if (!str) return NaN;
  let s = String(str).trim().replace(/[\s ]/g, '').replace(/[€$£¥]/g, '');
  const hC = s.includes(','), hD = s.includes('.');
  if (hC && hD) {
    if (s.lastIndexOf(',') > s.lastIndexOf('.')) s = s.replace(/\./g, '').replace(',', '.');
    else s = s.replace(/,/g, '');
  } else if (hC && !hD) s = s.replace(',', '.');
  return parseFloat(s);
}

export function parseAnyDate(raw) {
  if (!raw) return null;
  const s = String(raw).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  const dm = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
  if (dm) return `${dm[3]}-${dm[2].padStart(2, '0')}-${dm[1].padStart(2, '0')}`;
  const n = parseFloat(s);
  if (!isNaN(n) && n > 40000) { const d = new Date((n - 25569) * 86400 * 1000); return d.toISOString().slice(0, 10); }
  return null;
}

export function splitCSVLine(line) {
  const result = []; let cur = '', inQ = false;
  for (const c of line) {
    if (c === '"') inQ = !inQ;
    else if ((c === ';' || c === ',') && !inQ) { result.push(cur.trim()); cur = ''; }
    else cur += c;
  }
  result.push(cur.trim());
  return result.map(c => c.replace(/^"|"$/g, '').trim());
}

export function buildPreviewRow(cols, map, userRules = {}) {
  let val = NaN, type = 'despesa';
  if (map.valCol >= 0) {
    const v = parseAnyNumber(cols[map.valCol]);
    if (!isNaN(v)) { val = Math.abs(v); type = v >= 0 ? 'rendimento' : 'despesa'; }
  }
  if (isNaN(val) && map.debitCol >= 0 && map.creditCol >= 0) {
    const d = parseAnyNumber(cols[map.debitCol] || '');
    const c = parseAnyNumber(cols[map.creditCol] || '');
    if (!isNaN(c) && c > 0) { val = c; type = 'rendimento'; }
    else if (!isNaN(d) && d > 0) { val = d; type = 'despesa'; }
  }
  if (isNaN(val) || val === 0) return null;
  const desc = (cols[map.descCol] || 'Sem descrição').replace(/\s+/g, ' ').trim().slice(0, 80);
  const date = parseAnyDate(cols[map.dateCol]);
  if (!date) return null;
  return { desc, val, type, cat: autoCateg(desc, userRules), date };
}
