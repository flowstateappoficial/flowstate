// ── MONTHLY REPORT GENERATOR — PREMIUM DESIGN ──
import { detectSubscriptions } from './subscriptions';
import { LOGO_SRC } from '../assets/logo';

const PT_MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

function fmtE(val) {
  return (val || 0).toLocaleString('pt-PT', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';
}

export function generateMonthlyReport({ txs, objetivos, ativos, feEntries, budget, rendimentoMensal, month }) {
  const [year, m] = (month || new Date().toISOString().slice(0, 7)).split('-').map(Number);
  const monthName = PT_MESES[m - 1] + ' ' + year;
  const ym = `${year}-${String(m).padStart(2, '0')}`;
  const pm = m === 1 ? 12 : m - 1;
  const py = m === 1 ? year - 1 : year;
  const prevYM = `${py}-${String(pm).padStart(2, '0')}`;

  const curTxs = txs.filter(t => t.date?.startsWith(ym));
  const prevTxs = txs.filter(t => t.date?.startsWith(prevYM));

  const totalIn = curTxs.filter(t => t.type === 'rendimento').reduce((s, t) => s + t.val, 0);
  const totalOut = curTxs.filter(t => t.type === 'despesa').reduce((s, t) => s + t.val, 0);
  const saldo = totalIn - totalOut;
  const fuga = totalIn > 0 ? Math.round(((totalIn - totalOut) / totalIn) * 100) : 0;

  const prevIn = prevTxs.filter(t => t.type === 'rendimento').reduce((s, t) => s + t.val, 0);
  const prevOut = prevTxs.filter(t => t.type === 'despesa').reduce((s, t) => s + t.val, 0);
  const diffOut = prevOut > 0 ? Math.round(((totalOut - prevOut) / prevOut) * 100) : null;
  const diffIn = prevIn > 0 ? Math.round(((totalIn - prevIn) / prevIn) * 100) : null;

  const catSpend = {};
  curTxs.filter(t => t.type === 'despesa').forEach(t => { catSpend[t.cat] = (catSpend[t.cat] || 0) + t.val; });
  const catSorted = Object.entries(catSpend).sort((a, b) => b[1] - a[1]);

  const topGoals = (objetivos || []).slice(0, 3);
  const subs = detectSubscriptions(txs);
  const topExpenses = curTxs.filter(t => t.type === 'despesa').sort((a, b) => b.val - a.val).slice(0, 5);

  const catColors = {
    'Alimentação': '#00D764', 'Habitação': '#7b7fff', 'Transportes': '#00b4d8',
    'Lazer': '#f7931a', 'Saúde': '#ff6b9d', 'Investimento': '#06d6a0',
    'Poupança': '#06d6a0', 'Outro': '#6e7491'
  };

  const html = `<!DOCTYPE html>
<html lang="pt">
<head>
<meta charset="UTF-8">
<title>FLOWSTATE — ${monthName}</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
*{margin:0;padding:0;box-sizing:border-box}

@page{size:A4;margin:0}

body{
  font-family:'Inter',system-ui,-apple-system,sans-serif;
  background:#0f1220;color:#b8bfda;
  width:210mm;min-height:297mm;margin:0 auto;
  padding:48px 52px;
  -webkit-print-color-adjust:exact!important;
  print-color-adjust:exact!important;
  color-adjust:exact!important;
  font-size:13px;line-height:1.55;letter-spacing:.01em;
}

/* ── PRINT: forçar cores + comprimir em 1 página ── */
@media print{
  @page{margin:0!important;size:A4}
  *{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;color-adjust:exact!important}
  html{background:#0f1220!important;margin:0!important;padding:0!important}
  body{padding:20px 30px!important;min-height:auto!important;font-size:12px!important;line-height:1.35!important;margin:0!important;width:100vw!important;box-sizing:border-box!important;box-shadow:0 0 0 50px #0f1220!important;-webkit-print-color-adjust:exact!important}
  .no-print{display:none!important}
  .hdr{margin-bottom:14px!important}
  .hdr-month{font-size:26px!important}
  .hdr-sub{font-size:11px!important}
  .logo-img{height:90px!important}
  .kpi-row{margin-bottom:12px!important}
  .kpi{padding:14px 12px!important}
  .kpi-val{font-size:22px!important}
  .kpi-label{font-size:9px!important;margin-bottom:3px!important}
  .kpi-delta{font-size:9px!important;margin-top:3px!important}
  .fuga{padding:10px 18px!important;margin-bottom:12px!important}
  .fuga-circle{width:48px!important;height:48px!important}
  .fuga-pct{font-size:17px!important}
  .fuga-text h3{font-size:13px!important}
  .fuga-text p{font-size:10px!important}
  .sec{margin-bottom:10px!important}
  .sec-title{font-size:9px!important;margin-bottom:6px!important}
  .tbl td{padding:4px 0!important;font-size:11px!important}
  .tbl th{font-size:8px!important;padding:0 0 4px!important}
  .card{padding:12px!important;border-radius:10px!important}
  .card-lbl{font-size:9px!important;margin-bottom:6px!important}
  .g2{gap:10px!important}
  .goal-name{font-size:14px!important}
  .goal-sub{font-size:11px!important;margin-bottom:4px!important}
  .goal-pct{font-size:16px!important;margin-top:4px!important}
  .goal-vals{font-size:10px!important;margin-top:2px!important}
  .summary{padding:14px!important;border-radius:10px!important}
  .summary-icon{font-size:22px!important;margin-bottom:2px!important}
  .summary h2{font-size:14px!important;margin-bottom:2px!important}
  .summary p{font-size:11px!important;line-height:1.4!important}
  .ftr{margin-top:8px!important;padding-top:6px!important;font-size:9px!important}
  .divider{margin:8px 0!important}
}

/* ── HEADER ── */
.hdr{display:flex;justify-content:space-between;align-items:center;margin-bottom:44px}
.hdr-left{display:flex;align-items:center;gap:18px}
.logo-img{height:120px;width:auto;object-fit:contain}
.hdr-right{text-align:right}
.hdr-month{font-size:28px;font-weight:800;color:#fff;letter-spacing:-.03em;line-height:1.1}
.hdr-sub{font-size:11px;color:#4a5072;margin-top:4px;letter-spacing:.02em}

/* ── DIVIDER ── */
.divider{height:1px;background:linear-gradient(90deg,transparent 0%,rgba(255,255,255,.06) 20%,rgba(255,255,255,.06) 80%,transparent 100%);margin:32px 0}

/* ── KPI ROW ── */
.kpi-row{display:grid;grid-template-columns:1fr 1fr 1fr;gap:0;margin-bottom:36px;border-radius:16px;overflow:hidden;border:1px solid rgba(255,255,255,.05)}
.kpi{padding:28px 24px;background:#161a2e;text-align:center;position:relative}
.kpi:not(:last-child)::after{content:'';position:absolute;right:0;top:20%;height:60%;width:1px;background:rgba(255,255,255,.05)}
.kpi-label{font-size:10px;font-weight:600;color:#4a5072;text-transform:uppercase;letter-spacing:.12em;margin-bottom:10px}
.kpi-val{font-size:28px;font-weight:800;letter-spacing:-.03em;line-height:1}
.kpi-val.up{color:#00D764}.kpi-val.down{color:#ff6b6b}.kpi-val.neutral{color:#fff}
.kpi-delta{font-size:10px;margin-top:8px;font-weight:600}
.kpi-delta.up{color:#00D764}.kpi-delta.down{color:#ff6b6b}.kpi-delta.muted{color:#4a5072}

/* ── FUGA BANNER ── */
.fuga{
  display:flex;align-items:center;justify-content:space-between;
  padding:24px 32px;border-radius:16px;margin-bottom:36px;
}
.fuga.positive{
  background:linear-gradient(135deg,rgba(0,215,100,.12) 0%,rgba(0,215,100,.04) 100%);
  border:1px solid rgba(0,215,100,.15);
}
.fuga.negative{
  background:linear-gradient(135deg,rgba(255,107,107,.12) 0%,rgba(255,107,107,.04) 100%);
  border:1px solid rgba(255,107,107,.15);
}
.fuga-left{display:flex;align-items:center;gap:20px}
.fuga-circle{
  width:72px;height:72px;border-radius:50%;
  display:flex;flex-direction:column;align-items:center;justify-content:center;
}
.fuga-circle.positive{border:3px solid #00D764}
.fuga-circle.negative{border:3px solid #ff6b6b}
.fuga-pct{font-size:24px;font-weight:900;line-height:1}
.fuga-pct.positive{color:#00D764}
.fuga-pct.negative{color:#ff6b6b}
.fuga-text h3{font-size:15px;font-weight:700;color:#fff;margin-bottom:3px}
.fuga-text p{font-size:12px;color:#6e7491}

/* ── SECTION ── */
.sec{margin-bottom:32px}
.sec-title{
  font-size:10px;font-weight:700;color:#4a5072;
  text-transform:uppercase;letter-spacing:.15em;margin-bottom:18px;
  display:flex;align-items:center;gap:8px;
}
.sec-title::after{content:'';flex:1;height:1px;background:rgba(255,255,255,.04)}

/* ── GRID ── */
.g2{display:grid;grid-template-columns:1fr 1fr;gap:20px}

/* ── TABLE ── */
.tbl{width:100%;border-collapse:collapse}
.tbl th{
  font-size:9px;font-weight:700;color:#4a5072;text-transform:uppercase;
  letter-spacing:.12em;padding:0 0 10px;text-align:left;
  border-bottom:1px solid rgba(255,255,255,.06);
}
.tbl th:last-child{text-align:right}
.tbl td{padding:12px 0;border-bottom:1px solid rgba(255,255,255,.03);font-size:13px}
.tbl td:last-child{text-align:right;font-weight:700;font-variant-numeric:tabular-nums}
.tbl tr:last-child td{border-bottom:none}
.cat-dot{display:inline-block;width:8px;height:8px;border-radius:50%;margin-right:8px;vertical-align:middle}

/* ── BAR ── */
.bar-wrap{height:6px;background:rgba(255,255,255,.04);border-radius:3px;overflow:hidden;margin-top:6px}
.bar-fill{height:100%;border-radius:3px;transition:width .4s ease}

/* ── CARD ── */
.card{background:#161a2e;border-radius:14px;padding:24px;border:1px solid rgba(255,255,255,.04)}
.card-lbl{font-size:10px;font-weight:700;color:#4a5072;text-transform:uppercase;letter-spacing:.1em;margin-bottom:14px}

/* ── GOAL ── */
.goal-name{font-size:16px;font-weight:700;color:#fff;margin-bottom:4px}
.goal-sub{font-size:12px;color:#6e7491;margin-bottom:14px}
.goal-bar{height:8px;background:rgba(255,255,255,.04);border-radius:4px;overflow:hidden}
.goal-bar-fill{height:100%;border-radius:4px}
.goal-vals{display:flex;justify-content:space-between;font-size:11px;color:#6e7491;margin-top:8px}
.goal-pct{text-align:center;font-size:20px;font-weight:800;color:#00D764;margin-top:12px}

/* ── SUMMARY ── */
.summary{
  text-align:center;padding:32px;border-radius:16px;
  background:linear-gradient(135deg,#161a2e 0%,#1a1f35 100%);
  border:1px solid rgba(255,255,255,.04);
}
.summary-icon{font-size:36px;margin-bottom:8px}
.summary h2{font-size:18px;font-weight:800;color:#fff;margin-bottom:8px;letter-spacing:-.02em}
.summary p{font-size:13px;color:#6e7491;line-height:1.7;max-width:520px;margin:0 auto}

/* ── FOOTER ── */
.ftr{
  margin-top:48px;padding-top:24px;
  border-top:1px solid rgba(255,255,255,.04);
  display:flex;justify-content:space-between;align-items:center;
  font-size:10px;color:#3a3f5a;
}

/* ── PRINT BTN ── */
.btn-save{
  position:fixed;bottom:28px;right:28px;z-index:999;
  background:linear-gradient(135deg,#00D764,#00b856);color:#000;border:none;
  padding:16px 32px;border-radius:14px;
  font-size:14px;font-weight:800;cursor:pointer;font-family:'Inter',sans-serif;
  box-shadow:0 8px 32px rgba(0,215,100,.3);letter-spacing:.02em;
  transition:transform .15s ease;
}
.btn-save:hover{transform:translateY(-2px)}
</style>
</head>
<body>

<div class="no-print" style="position:fixed;bottom:80px;right:20px;z-index:999;font-size:10px;color:#4a5072;background:#161a2e;padding:10px 14px;border-radius:10px;border:1px solid rgba(255,255,255,.08);max-width:240px;line-height:1.5;box-shadow:0 4px 16px rgba(0,0,0,.3)">
  💡 Ativa <strong style="color:#b8bfda">"Gráficos de fundo"</strong> e desativa <strong style="color:#b8bfda">"Cabeçalhos e rodapés"</strong> nas opções de impressão.
</div>
<button class="btn-save no-print" onclick="window.print()">Guardar como PDF</button>

<!-- HEADER -->
<div class="hdr">
  <div class="hdr-left">
    <img class="logo-img" src="${LOGO_SRC}" alt="Flowstate">
  </div>
  <div class="hdr-right">
    <div class="hdr-month">${monthName}</div>
    <div class="hdr-sub">Relatório financeiro mensal · Gerado em ${new Date().toLocaleDateString('pt-PT')}</div>
  </div>
</div>

<!-- KPI ROW -->
<div class="kpi-row">
  <div class="kpi">
    <div class="kpi-label">Rendimento</div>
    <div class="kpi-val up">${fmtE(totalIn)}</div>
    <div class="kpi-delta ${diffIn !== null ? (diffIn >= 0 ? 'up' : 'down') : 'muted'}">${diffIn !== null ? (diffIn >= 0 ? '↑ +' : '↓ ') + Math.abs(diffIn) + '% vs mês anterior' : '—'}</div>
  </div>
  <div class="kpi">
    <div class="kpi-label">Despesas</div>
    <div class="kpi-val down">${fmtE(totalOut)}</div>
    <div class="kpi-delta ${diffOut !== null ? (diffOut <= 0 ? 'up' : 'down') : 'muted'}">${diffOut !== null ? (diffOut <= 0 ? '↓ ' : '↑ +') + Math.abs(diffOut) + '% vs mês anterior' : '—'}</div>
  </div>
  <div class="kpi">
    <div class="kpi-label">Saldo do mês</div>
    <div class="kpi-val ${saldo >= 0 ? 'up' : 'down'}">${saldo >= 0 ? '+' : ''}${fmtE(saldo)}</div>
    <div class="kpi-delta muted">${curTxs.length} transações registadas</div>
  </div>
</div>

<!-- TAXA DE POUPANÇA -->
<div class="fuga ${fuga >= 0 ? 'positive' : 'negative'}">
  <div class="fuga-left">
    <div class="fuga-circle ${fuga >= 0 ? 'positive' : 'negative'}">
      <div class="fuga-pct ${fuga >= 0 ? 'positive' : 'negative'}">${fuga}%</div>
    </div>
    <div class="fuga-text">
      <h3>Taxa de Poupança</h3>
      <p>${fuga >= 50 ? 'Excelente! Estás a poupar/investir mais de metade do rendimento.' : fuga >= 30 ? 'Bom progresso. Tenta chegar aos 50% para acelerar os teus objetivos.' : 'Em crescimento. Cada euro poupado conta — foca-te em reduzir despesas não essenciais.'}</p>
    </div>
  </div>
</div>

<!-- DESPESAS POR CATEGORIA -->
<div class="sec">
  <div class="sec-title">Despesas por categoria</div>
  <table class="tbl">
    <thead><tr><th>Categoria</th><th style="text-align:center">Peso</th><th>Valor</th></tr></thead>
    <tbody>
      ${catSorted.map(([cat, val]) => {
        const pct = totalOut > 0 ? Math.round((val / totalOut) * 100) : 0;
        const color = catColors[cat] || '#6e7491';
        const budgetLimit = budget?.[cat] || 0;
        const overBudget = budgetLimit > 0 && val > budgetLimit;
        return `<tr>
          <td><span class="cat-dot" style="background:${color}"></span>${cat}${overBudget ? ' <span style="color:#ff6b6b;font-size:10px;font-weight:600">ACIMA DO LIMITE</span>' : ''}</td>
          <td style="text-align:center">
            <div style="display:flex;align-items:center;gap:10px">
              <div style="flex:1;height:6px;background:rgba(255,255,255,.04);border-radius:3px;overflow:hidden">
                <div style="height:100%;width:${pct}%;background:${color};border-radius:3px"></div>
              </div>
              <span style="font-size:11px;font-weight:600;color:#6e7491;min-width:32px;text-align:right">${pct}%</span>
            </div>
          </td>
          <td style="color:${overBudget ? '#ff6b6b' : '#fff'}">${fmtE(val)}</td>
        </tr>`;
      }).join('')}
    </tbody>
  </table>
</div>

<!-- TOP DESPESAS + SUBSCRIÇÕES -->
<div class="sec">
  <div class="g2">
    <div class="card">
      <div class="card-lbl">Maiores despesas do mês</div>
      <table class="tbl">
        <tbody>
          ${topExpenses.map((t, i) => `<tr>
            <td style="color:#fff;font-weight:600">${t.desc}</td>
            <td style="color:#ff6b6b">${fmtE(t.val)}</td>
          </tr>`).join('')}
          ${topExpenses.length === 0 ? '<tr><td colspan="2" style="color:#4a5072;text-align:center;padding:20px 0">Sem despesas</td></tr>' : ''}
        </tbody>
      </table>
    </div>
    <div class="card">
      <div class="card-lbl">Subscrições recorrentes</div>
      ${subs.activeSubs.length > 0 ? `
        <div style="display:flex;align-items:baseline;gap:6px;margin-bottom:16px">
          <span style="font-size:24px;font-weight:800;color:#ff6b6b">${fmtE(subs.totalMensal)}</span>
          <span style="font-size:11px;color:#4a5072">/mês</span>
          <span style="font-size:11px;color:#4a5072;margin-left:auto">${fmtE(subs.totalAnual)} /ano</span>
        </div>
        <table class="tbl"><tbody>
          ${subs.activeSubs.slice(0, 4).map(s => `<tr>
            <td>${s.emoji} ${s.nome}</td>
            <td style="color:#ff6b6b">${fmtE(s.lastVal)}</td>
          </tr>`).join('')}
        </tbody></table>
      ` : '<div style="color:#4a5072;font-size:12px;padding:20px 0;text-align:center">Nenhuma subscrição detetada</div>'}
    </div>
  </div>
</div>

<!-- OBJETIVOS DE POUPANÇA -->
${topGoals.length > 0 ? `
<div class="sec">
  <div class="sec-title">Objetivos de poupança</div>
  ${topGoals.map(g => {
    const pct = g.meta > 0 ? Math.min(100, Math.round((g.atual / g.meta) * 100)) : 0;
    return `
  <div class="card" style="display:flex;align-items:center;gap:32px;margin-bottom:10px">
    <div style="flex:1">
      <div class="goal-name">${g.nome}</div>
      <div class="goal-sub">${g.meta > g.atual ? 'Faltam ' + fmtE(g.meta - g.atual) + ' para atingir a meta' : 'Meta atingida!'}</div>
      <div class="goal-bar"><div class="goal-bar-fill" style="width:${pct}%;background:${g.cor || '#00D764'}"></div></div>
      <div class="goal-vals"><span>${fmtE(g.atual)}</span><span>${fmtE(g.meta)}</span></div>
    </div>
    <div style="text-align:center;min-width:90px">
      <div class="goal-pct">${pct}%</div>
      <div style="font-size:10px;color:#4a5072;margin-top:2px">concluído</div>
    </div>
  </div>`;
  }).join('')}
</div>
` : ''}

<!-- RESUMO FINAL -->
<div class="summary">
  <div class="summary-icon">${saldo >= 0 ? '🏆' : '📊'}</div>
  <h2>${saldo >= 0 ? 'Mês positivo — bom trabalho!' : 'Mês em défice — hora de rever'}</h2>
  <p>${saldo >= 0
    ? `Poupaste <strong style="color:#00D764">${fmtE(saldo)}</strong> este mês com uma Taxa de Poupança de ${fuga}%. ${fuga >= 50 ? 'Resultado excelente — estás no caminho certo para a liberdade financeira.' : 'Continua a otimizar as tuas despesas para chegar aos 50%.'}`
    : `Gastaste mais <strong style="color:#ff6b6b">${fmtE(Math.abs(saldo))}</strong> do que ganhaste. Identifica as categorias com mais peso e define limites de orçamento.`
  }</p>
</div>

<!-- FOOTER -->
<div class="ftr">
  <div>FLOWSTATE · Relatório financeiro pessoal</div>
  <div>${monthName} · Este documento não constitui aconselhamento financeiro</div>
</div>

</body>
</html>`;

  return html;
}

export function openReportInNewTab(data) {
  const html = generateMonthlyReport(data);
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank');
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

export function openReportPreviewInNewTab(data) {
  const html = generateMonthlyReport(data);
  // Replace the save button with an upgrade CTA (Premium users can view but not export)
  const modified = html
    .replace(
      /<button class="btn-save no-print" onclick="window\.print\(\)">Guardar como PDF<\/button>/,
      `<div class="no-print" style="position:fixed;bottom:20px;right:20px;z-index:999;display:flex;flex-direction:column;align-items:flex-end;gap:10px">
        <div style="background:linear-gradient(135deg,#1a1f35 0%,#252b45 100%);border:1px solid rgba(123,127,255,.3);border-radius:16px;padding:20px 24px;max-width:300px;box-shadow:0 8px 32px rgba(0,0,0,.5)">
          <div style="font-size:13px;font-weight:800;color:#fff;margin-bottom:6px">🔒 Exportação PDF — Flow Max</div>
          <div style="font-size:11px;color:#6e7491;line-height:1.6;margin-bottom:14px">Faz upgrade para o plano <strong style="color:#7b7fff">Flow Max</strong> para guardar e partilhar os teus relatórios em PDF.</div>
          <button onclick="window.close()" style="width:100%;padding:10px;border-radius:10px;background:linear-gradient(135deg,#7b7fff 0%,#6366f1 100%);color:#fff;border:none;font-family:Inter,sans-serif;font-size:12px;font-weight:800;cursor:pointer;box-shadow:0 0 20px rgba(123,127,255,.3)">Ver planos →</button>
        </div>
      </div>`
    )
    .replace(
      /💡 Ativa.*?<\/div>/s,
      '</div>'
    );
  const blob = new Blob([modified], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank');
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}
