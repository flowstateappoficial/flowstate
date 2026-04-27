import React, { useState, useEffect, useRef } from 'react';
import useIsMobile from '../hooks/useIsMobile';
import { Chart, LineController, LineElement, PointElement, LinearScale, CategoryScale, Filler, DoughnutController, ArcElement, Tooltip } from 'chart.js';
import { PT_M, PT_MESES, TIPO_COLORS } from '../utils/constants';
import { txsComRegra } from '../utils/helpers';
import { saveFundoEmergencia, saveFundoContrib, saveAtivoEntry, saveAtivoContrib, deleteAtivoFromSupabase } from '../utils/supabase';
import InvestmentsTutorial from '../components/InvestmentsTutorial';
import { useDialog } from '../components/Dialog';

Chart.register(LineController, LineElement, PointElement, LinearScale, CategoryScale, Filler, DoughnutController, ArcElement, Tooltip);

const INV_TUTORIAL_KEY = 'fs_inv_tutorial_seen_v1';

export default function InvestmentsPage({ ativos, ativoEntries, ativoContribs, feEntries, feContribs, invMonth, setInvMonth, txsWithRules, currentUser, getFeForMonth, getAtivoValueForMonth, getAtivoInvestidoForMonth, getAtivoValorizacaoForMonth, getAtivoRendimentoPctForMonth, getFeInvestidoForMonth, getFeValorizacaoForMonth, getFeRendimentoPctForMonth, getTotalInvestidoForMonth, getPatrimonioForMonth, feMetaGlobal, updateFeEntries, updateFeContribs, updateAtivoEntries, updateAtivoContribs, saveAtivosLocal, onAddAtivo, onEditAtivo, fmtV, getCurrentMonth, calcOpen, onToggleCalc }) {
  const isMobile = useIsMobile();
  const dialog = useDialog();
  const patrimonioRef = useRef(null);
  const patrimonioChartRef = useRef(null);
  const donutRef = useRef(null);
  const donutChartRef = useRef(null);
  const [feEditMeta, setFeEditMeta] = useState(false);
  const [feMetaInput, setFeMetaInput] = useState('');
  const [monthMenuOpen, setMonthMenuOpen] = useState(false);
  const monthMenuRef = useRef(null);
  const [tutorialOpen, setTutorialOpen] = useState(false);

  // Tutorial de formação — aparece na primeira visita ao separador.
  useEffect(() => {
    try {
      const seen = localStorage.getItem(INV_TUTORIAL_KEY);
      if (!seen) setTutorialOpen(true);
    } catch {}
  }, []);

  const closeTutorial = () => {
    setTutorialOpen(false);
    try { localStorage.setItem(INV_TUTORIAL_KEY, '1'); } catch {}
  };

  // Close month menu on outside click / Escape
  useEffect(() => {
    if (!monthMenuOpen) return;
    const onDocClick = (e) => {
      if (monthMenuRef.current && !monthMenuRef.current.contains(e.target)) setMonthMenuOpen(false);
    };
    const onEsc = (e) => { if (e.key === 'Escape') setMonthMenuOpen(false); };
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onEsc);
    };
  }, [monthMenuOpen]);

  const year = new Date().getFullYear();
  const [y, m] = invMonth.split('-').map(Number);
  const prevM = m === 1 ? 12 : m - 1;
  const prevY = m === 1 ? y - 1 : y;
  const prevMonth = `${prevY}-${String(prevM).padStart(2, '0')}`;

  const patAtual = getPatrimonioForMonth(invMonth);
  const patAnterior = getPatrimonioForMonth(prevMonth);
  const fe = getFeForMonth(invMonth);
  const metaGlobal = feMetaGlobal();
  const metaEfetiva = fe.meta || metaGlobal;
  const totalInvestido = getTotalInvestidoForMonth(invMonth) + fe.value;

  // Average expenses for coverage
  const avgExpenses = (() => {
    let totalOut = 0, cnt = 0;
    for (let i = 0; i < 6; i++) {
      const d = new Date(new Date().getFullYear(), new Date().getMonth() - i, 1);
      const ym = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
      const mo = txsWithRules.filter(t => t.date.startsWith(ym) && t.type === 'despesa').reduce((s, t) => s + t.val, 0);
      if (mo > 0) { totalOut += mo; cnt++; }
    }
    return cnt > 0 ? totalOut / cnt : 0;
  })();

  // Patrimonio chart
  useEffect(() => {
    if (!patrimonioRef.current) return;
    if (patrimonioChartRef.current) patrimonioChartRef.current.destroy();
    const months = [];
    for (let m = 1; m <= 12; m++) months.push(year + '-' + String(m).padStart(2, '0'));
    const labels = months.map(ym => PT_M[parseInt(ym.split('-')[1]) - 1]);
    const curYM = getCurrentMonth();
    const data = months.map(ym => {
      // Não projectar património em meses futuros — o gráfico mostra só até ao mês atual
      if (ym > curYM) return null;
      const p = getPatrimonioForMonth(ym);
      return p > 0 ? p : null;
    });
    const ctx = patrimonioRef.current.getContext('2d');
    const grad = ctx.createLinearGradient(0, 0, 0, 200);
    grad.addColorStop(0, 'rgba(0,215,100,0.3)'); grad.addColorStop(1, 'rgba(0,215,100,0.02)');
    patrimonioChartRef.current = new Chart(ctx, {
      type: 'line', data: { labels, datasets: [{ label: 'Património', data, borderColor: '#00D764', backgroundColor: grad, borderWidth: 2.5, pointRadius: data.map(v => v !== null ? 4 : 0), pointBackgroundColor: '#00D764', fill: true, tension: .35, spanGaps: false }] },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { callbacks: { label: c => c.raw !== null ? fmtV(c.raw) : '—' } } }, scales: { x: { grid: { color: 'rgba(255,255,255,.05)' }, ticks: { color: '#6e7491', font: { size: 10 } } }, y: { grid: { color: 'rgba(255,255,255,.05)' }, ticks: { color: '#6e7491', font: { size: 10 }, callback: v => v >= 1000 ? (v / 1000).toFixed(1) + 'k €' : v + '€' }, beginAtZero: true } } }
    });
    return () => { if (patrimonioChartRef.current) patrimonioChartRef.current.destroy(); };
  }, [ativos, ativoEntries, feEntries, invMonth]);

  // Donut chart
  useEffect(() => {
    if (!donutRef.current) return;
    if (donutChartRef.current) donutChartRef.current.destroy();
    const labels = ['Fundo Emergência', ...ativos.map(a => a.nome)];
    const vals = [Math.max(0, fe.value), ...ativos.map(a => getAtivoValueForMonth(a.id, invMonth))];
    const colors = ['#00D764', ...ativos.map(a => a.cor || TIPO_COLORS[a.tipo] || '#6e7491')];
    const total = vals.reduce((s, v) => s + v, 0);
    if (total > 0) {
      donutChartRef.current = new Chart(donutRef.current.getContext('2d'), {
        type: 'doughnut', data: { labels, datasets: [{ data: vals, backgroundColor: colors, borderWidth: 0, hoverOffset: 5 }] },
        options: { responsive: true, maintainAspectRatio: false, cutout: '65%', plugins: { legend: { display: false } } }
      });
    }
    return () => { if (donutChartRef.current) donutChartRef.current.destroy(); };
  }, [ativos, ativoEntries, feEntries, invMonth]);

  // Fundo helpers
  // Garante que existe pelo menos uma contribuição registada para o FE. Se for
  // legacy (FE com valor mas sem contribs), faz backfill: a primeira
  // contribuição fica igual ao valor do primeiro mês registado.
  const ensureFeContribsBackfilled = () => {
    if (Object.keys(feContribs || {}).length > 0) return feContribs || {};
    const meses = Object.keys(feEntries).sort();
    if (meses.length === 0) return {};
    const primeiro = meses[0];
    return { [primeiro]: (feEntries[primeiro]?.value) || 0 };
  };

  const handleReforcar = async () => {
    const raw = await dialog.prompt({
      title: '+ Reforçar Fundo de Emergência',
      message: 'Quanto queres adicionar?',
      type: 'number', placeholder: '0', suffix: '€',
      confirmText: 'Reforçar',
    });
    if (raw === null) return;
    const valor = parseFloat(String(raw).replace(',', '.'));
    if (!valor || isNaN(valor) || valor <= 0) return;

    const baseContribs = ensureFeContribsBackfilled();
    const novoContribMes = (baseContribs[invMonth] || 0) + valor;
    const newContribs = { ...feContribs, ...baseContribs, [invMonth]: novoContribMes };
    updateFeContribs(newContribs);
    if (currentUser) {
      saveFundoContrib(invMonth, novoContribMes, currentUser.id);
      if (Object.keys(feContribs || {}).length === 0) {
        const primeiro = Object.keys(baseContribs).find(m => m !== invMonth);
        if (primeiro) saveFundoContrib(primeiro, baseContribs[primeiro], currentUser.id);
      }
    }

    const newEntries = { ...feEntries };
    if (!newEntries[invMonth]) newEntries[invMonth] = { value: fe.value, meta: metaGlobal };
    newEntries[invMonth] = { ...newEntries[invMonth], value: (newEntries[invMonth].value || 0) + valor };
    updateFeEntries(newEntries);
    if (currentUser) saveFundoEmergencia(invMonth, newEntries[invMonth].value, newEntries[invMonth].meta, currentUser.id);
  };

  const handleRetirar = async () => {
    const raw = await dialog.prompt({
      title: '− Retirar do Fundo de Emergência',
      message: 'Quanto queres retirar?',
      type: 'number', placeholder: '0', suffix: '€',
      confirmText: 'Retirar', danger: true,
    });
    if (raw === null) return;
    const valor = parseFloat(String(raw).replace(',', '.'));
    if (!valor || isNaN(valor) || valor <= 0) return;

    const baseContribs = ensureFeContribsBackfilled();
    const novoContribMes = (baseContribs[invMonth] || 0) - valor;
    const newContribs = { ...feContribs, ...baseContribs, [invMonth]: novoContribMes };
    updateFeContribs(newContribs);
    if (currentUser) {
      saveFundoContrib(invMonth, novoContribMes, currentUser.id);
      if (Object.keys(feContribs || {}).length === 0) {
        const primeiro = Object.keys(baseContribs).find(m => m !== invMonth);
        if (primeiro) saveFundoContrib(primeiro, baseContribs[primeiro], currentUser.id);
      }
    }

    const newEntries = { ...feEntries };
    if (!newEntries[invMonth]) newEntries[invMonth] = { value: fe.value, meta: metaGlobal };
    newEntries[invMonth] = { ...newEntries[invMonth], value: Math.max(0, (newEntries[invMonth].value || 0) - valor) };
    updateFeEntries(newEntries);
    if (currentUser) saveFundoEmergencia(invMonth, newEntries[invMonth].value, newEntries[invMonth].meta, currentUser.id);
  };

  const handleAtualizarValorFE = async () => {
    const novoStr = await dialog.prompt({
      title: '💰 Valor atual do Fundo',
      message: `Valor registado: ${fe.value.toLocaleString('pt-PT')} €\n\nUsa este botão quando os juros do banco/produto fizerem o valor mexer. Para depositar ou levantar dinheiro teu, usa + Reforçar / − Retirar.`,
      type: 'number', placeholder: String(fe.value), suffix: '€',
      confirmText: 'Atualizar',
    });
    if (novoStr === null) return;
    const novo = parseFloat(String(novoStr).replace(',', '.'));
    if (isNaN(novo) || novo < 0) return;
    const newEntries = { ...feEntries };
    if (!newEntries[invMonth]) newEntries[invMonth] = { value: 0, meta: metaGlobal };
    newEntries[invMonth] = { ...newEntries[invMonth], value: novo };
    updateFeEntries(newEntries);
    if (currentUser) saveFundoEmergencia(invMonth, novo, newEntries[invMonth].meta, currentUser.id);
  };

  const handleSaveFeMeta = async () => {
    const nova = parseFloat(feMetaInput) || 0;
    if (nova <= 0) return;
    const newEntries = { ...feEntries };
    if (!newEntries[invMonth]) newEntries[invMonth] = { value: fe.value, meta: 0 };
    newEntries[invMonth].meta = nova;
    updateFeEntries(newEntries);
    if (currentUser) saveFundoEmergencia(invMonth, newEntries[invMonth].value, nova, currentUser.id);
    setFeEditMeta(false);
  };

  const handleDefinirMeta = async (metaVal) => {
    const meta = parseFloat(metaVal) || 0;
    if (meta <= 0) { dialog.alert({ message: 'Insere um valor válido.' }); return; }
    const newEntries = { ...feEntries };
    if (!newEntries[invMonth]) newEntries[invMonth] = { value: 0, meta: 0 };
    newEntries[invMonth].meta = meta;
    updateFeEntries(newEntries);
    if (currentUser) saveFundoEmergencia(invMonth, newEntries[invMonth].value, meta, currentUser.id);
  };

  // Garante que um ativo tem pelo menos uma entrada em ativoContribs. Se for
  // legacy (ativoEntries com dados mas sem contribs), faz backfill silencioso:
  // a primeira contribuição fica igual ao valor do primeiro mês registado.
  const ensureContribsBackfilled = (ativId, existingContribs) => {
    if (Object.keys(existingContribs || {}).length > 0) return existingContribs || {};
    const entradas = ativoEntries[ativId] || {};
    const meses = Object.keys(entradas).sort();
    if (meses.length === 0) return {};
    const primeiro = meses[0];
    return { [primeiro]: entradas[primeiro] || 0 };
  };

  const persistContribForMonth = async (ativId, ym, novoContribMes, allContribs) => {
    const newContribs = { ...allContribs };
    if (!newContribs[ativId]) newContribs[ativId] = {};
    newContribs[ativId] = { ...newContribs[ativId], [ym]: novoContribMes };
    updateAtivoContribs(newContribs);
    if (currentUser) saveAtivoContrib(ativId, ym, novoContribMes, currentUser.id);
  };

  const persistEntryForMonth = async (ativId, ym, novoValor) => {
    const newEntries = { ...ativoEntries };
    if (!newEntries[ativId]) newEntries[ativId] = {};
    newEntries[ativId] = { ...newEntries[ativId], [ym]: novoValor };
    updateAtivoEntries(newEntries);
    if (currentUser) saveAtivoEntry(ativId, ym, novoValor, currentUser.id);
  };

  const handleReforcarAtivo = async (ativId) => {
    const atual = getAtivoValueForMonth(ativId, invMonth);
    const raw = await dialog.prompt({
      title: '+ Reforçar ativo',
      message: `Valor atual: ${atual.toLocaleString('pt-PT')} €\n\nQuanto queres adicionar?`,
      type: 'number', placeholder: '0', suffix: '€',
      confirmText: 'Reforçar',
    });
    if (raw === null) return;
    const valor = parseFloat(String(raw).replace(',', '.'));
    if (!valor || isNaN(valor) || valor <= 0) return;

    const base = ensureContribsBackfilled(ativId, ativoContribs[ativId]);
    const novaBaseContribs = { ...ativoContribs, [ativId]: base };
    const contribAtualMes = (base[invMonth] || 0) + valor;
    await persistContribForMonth(ativId, invMonth, contribAtualMes, novaBaseContribs);

    if (currentUser && Object.keys(ativoContribs[ativId] || {}).length === 0) {
      const primeiro = Object.keys(base).find(m => m !== invMonth);
      if (primeiro) saveAtivoContrib(ativId, primeiro, base[primeiro], currentUser.id);
    }

    await persistEntryForMonth(ativId, invMonth, atual + valor);
  };

  const handleRetirarAtivo = async (ativId) => {
    const atual = getAtivoValueForMonth(ativId, invMonth);
    if (atual <= 0) { await dialog.alert({ message: 'Não há valor para retirar neste mês.' }); return; }
    const raw = await dialog.prompt({
      title: '− Retirar do ativo',
      message: `Valor atual: ${atual.toLocaleString('pt-PT')} €\n\nQuanto queres retirar?`,
      type: 'number', placeholder: '0', suffix: '€',
      confirmText: 'Retirar', danger: true,
    });
    if (raw === null) return;
    const valor = parseFloat(String(raw).replace(',', '.'));
    if (!valor || isNaN(valor) || valor <= 0) return;

    const base = ensureContribsBackfilled(ativId, ativoContribs[ativId]);
    const novaBaseContribs = { ...ativoContribs, [ativId]: base };
    const contribAtualMes = (base[invMonth] || 0) - valor;
    await persistContribForMonth(ativId, invMonth, contribAtualMes, novaBaseContribs);

    if (currentUser && Object.keys(ativoContribs[ativId] || {}).length === 0) {
      const primeiro = Object.keys(base).find(m => m !== invMonth);
      if (primeiro) saveAtivoContrib(ativId, primeiro, base[primeiro], currentUser.id);
    }

    await persistEntryForMonth(ativId, invMonth, Math.max(0, atual - valor));
  };

  const handleAtualizarValorAtivo = async (ativId) => {
    const atual = getAtivoValueForMonth(ativId, invMonth);
    const novoStr = await dialog.prompt({
      title: '💰 Valor atual do investimento',
      message: `Valor registado: ${atual.toLocaleString('pt-PT')} €\n\nUsa este botão quando o mercado mexer. Para adicionar ou retirar dinheiro teu, usa + Reforçar / − Retirar.`,
      type: 'number', placeholder: String(atual), suffix: '€',
      confirmText: 'Atualizar',
    });
    if (novoStr === null) return;
    const novo = parseFloat(String(novoStr).replace(',', '.'));
    if (isNaN(novo) || novo < 0) return;
    await persistEntryForMonth(ativId, invMonth, novo);
  };

  const handleDeleteAtivo = async (id) => {
    const ok = await dialog.confirm({
      title: 'Apagar ativo?',
      message: 'O ativo e todo o seu histórico são apagados. Esta acção não pode ser desfeita.',
      confirmText: 'Apagar', danger: true,
    });
    if (!ok) return;
    const newAtivos = ativos.filter(a => String(a.id) !== String(id));
    const newEntries = { ...ativoEntries };
    delete newEntries[id];
    const newContribs = { ...ativoContribs };
    delete newContribs[id];
    saveAtivosLocal(newAtivos);
    updateAtivoEntries(newEntries);
    updateAtivoContribs(newContribs);
    if (currentUser) deleteAtivoFromSupabase(id, currentUser.id);
  };

  const pctFe = metaEfetiva > 0 ? Math.min(100, Math.round((fe.value / metaEfetiva) * 100)) : 0;

  return (
    <div id="page-inv" className="page active">
      {/* Month selector */}
      <div style={{ display: 'flex', alignItems: isMobile ? 'stretch' : 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: 10, flexDirection: isMobile ? 'column' : 'row', position: 'relative', zIndex: 500 }}>
        <div style={{ minWidth: 0, flex: isMobile ? '1 1 auto' : '0 1 auto' }}>
          <div className="slbl" style={{ marginBottom: 8 }}>Mês a visualizar / editar</div>
          <div ref={monthMenuRef} style={{ position: 'relative', display: 'inline-block', width: isMobile ? '100%' : 'auto', zIndex: monthMenuOpen ? 9999 : 'auto' }}>
            <button
              onClick={() => setMonthMenuOpen(o => !o)}
              aria-haspopup="menu"
              aria-expanded={monthMenuOpen}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                gap: 12, width: isMobile ? '100%' : 220,
                padding: '11px 16px', borderRadius: 12,
                background: monthMenuOpen ? 'rgba(0,215,100,.12)' : 'rgba(255,255,255,.05)',
                border: '1px solid ' + (monthMenuOpen ? 'rgba(0,215,100,.35)' : 'rgba(255,255,255,.1)'),
                color: 'var(--t1)', fontSize: 14, fontWeight: 700,
                cursor: 'pointer', fontFamily: 'var(--font)',
                transition: 'all .15s'
              }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 15 }}>📅</span>
                <span>{PT_MESES[m - 1]} {y}</span>
              </span>
              <span style={{ fontSize: 10, color: 'var(--t3)', transform: monthMenuOpen ? 'rotate(180deg)' : 'none', transition: 'transform .15s' }}>▾</span>
            </button>
            {monthMenuOpen && (
              <div role="menu" style={{
                position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: isMobile ? 0 : 'auto',
                minWidth: isMobile ? '100%' : 220,
                maxHeight: 320, overflowY: 'auto',
                padding: 6, borderRadius: 14,
                background: '#161a2e', border: '1px solid rgba(255,255,255,.15)',
                boxShadow: '0 14px 40px rgba(0,0,0,.6)',
                zIndex: 9999
              }}>
                {PT_MESES.map((label, i) => {
                  const mo = year + '-' + String(i + 1).padStart(2, '0');
                  const isActive = mo === invMonth;
                  return (
                    <button key={mo} onClick={() => { setInvMonth(mo); setMonthMenuOpen(false); }}
                      role="menuitem"
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        width: '100%', padding: '10px 12px', borderRadius: 10,
                        background: isActive ? 'rgba(0,215,100,.12)' : 'transparent',
                        color: isActive ? 'var(--accent)' : 'var(--t2)',
                        border: 'none', cursor: 'pointer', textAlign: 'left',
                        fontFamily: 'var(--font)', fontSize: 13, fontWeight: 600,
                        transition: 'background .12s'
                      }}>
                      <span>{label} {year}</span>
                      {isActive && <span style={{ fontSize: 12, fontWeight: 800 }}>✓</span>}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <button onClick={onToggleCalc} style={{
            background: calcOpen ? 'rgba(123,127,255,.2)' : 'rgba(123,127,255,.08)',
            border: '1px solid rgba(123,127,255,.25)', borderRadius: 12,
            padding: '10px 18px', color: '#7b7fff', fontSize: 13, fontWeight: 700,
            cursor: 'pointer', fontFamily: 'var(--font)', display: 'flex', alignItems: 'center', gap: 7,
            transition: 'all .2s',
            width: isMobile ? '100%' : 'auto', justifyContent: 'center'
          }}>
            🧮 Calculadora de Investimentos
          </button>
        </div>
      </div>

      {/* 3 summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'minmax(0,1fr)' : 'repeat(3,minmax(0,1fr))', gap: 12, marginBottom: '2rem' }}>
        <div className="card" style={{ textAlign: 'center' }}>
          <div className="card-title">Património Total</div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--t1)', letterSpacing: '-.04em' }}>{fmtV(patAtual)}</div>
          <div style={{ fontSize: 12, color: patAtual === 0 ? 'var(--t3)' : patAnterior === 0 ? 'var(--t3)' : ((patAtual - patAnterior) / patAnterior * 100) >= 0 ? 'var(--accent)' : 'var(--red-soft)', marginTop: 4 }}>
            {patAtual === 0 ? 'Sem dados neste mês' : patAnterior === 0 ? 'Primeiro registo' : `${((patAtual - patAnterior) / patAnterior * 100) >= 0 ? '↑ +' : '↓ '}${((patAtual - patAnterior) / patAnterior * 100).toFixed(1)}% vs ${PT_MESES[prevM - 1]}`}
          </div>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <div className="card-title">Total Investido</div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#7b7fff', letterSpacing: '-.04em' }}>{fmtV(totalInvestido)}</div>
          <div style={{ fontSize: 12, color: 'var(--t3)', marginTop: 4 }}>ativos + fundo emergência</div>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <div className="card-title">Património do Mês</div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--t1)', letterSpacing: '-.04em' }}>{fmtV(patAtual)}</div>
          <div style={{ fontSize: 12, color: 'var(--t3)', marginTop: 4 }}>{PT_MESES[m - 1]} {y}</div>
        </div>
      </div>

      {/* Chart */}
      <div className="card" style={{ marginBottom: '2rem', padding: '1.5rem' }}>
        <div style={{ fontSize: 13, color: 'var(--t3)', marginBottom: '1rem' }}>Evolução do Património</div>
        <div style={{ position: 'relative', height: 200 }}><canvas ref={patrimonioRef} /></div>
      </div>

      {/* Fundo + Donut */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'minmax(0,1fr)' : 'minmax(0,1fr) minmax(0,1fr)', gap: '1.5rem', marginBottom: '2rem' }}>
        {/* Fundo */}
        <div className="card">
          {metaEfetiva === 0 ? (
            <div style={{ textAlign: 'center', padding: '1.5rem 1rem' }}>
              <div style={{ fontSize: '2rem', marginBottom: '.75rem' }}>🛡️</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--t1)', marginBottom: '.4rem' }}>Define a tua meta do Fundo de Emergência</div>
              <div style={{ fontSize: 13, color: 'var(--t3)', marginBottom: '1.25rem', lineHeight: 1.6 }}>
                Recomendado: 3 a 6 meses de despesas{avgExpenses > 0 ? ` (≈ ${fmtV(avgExpenses * 3)} – ${fmtV(avgExpenses * 6)})` : ''}.
              </div>
              <div style={{ display: 'flex', gap: 8, maxWidth: 320, margin: '0 auto' }}>
                <input type="number" placeholder="Ex: 10000" min="0" step="500" id="fe-setup-meta"
                  style={{ flex: 1, background: 'rgba(255,255,255,.07)', border: '1px solid var(--border)', borderRadius: 9, padding: '10px 14px', color: 'var(--t1)', fontFamily: 'var(--font)', fontSize: 15, fontWeight: 600, outline: 'none' }} />
                <button onClick={() => handleDefinirMeta(document.getElementById('fe-setup-meta')?.value)}
                  style={{ padding: '10px 20px', borderRadius: 9, background: 'var(--accent)', color: '#000', border: 'none', fontFamily: 'var(--font)', fontSize: 13, fontWeight: 800, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                  Definir meta
                </button>
              </div>
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <div className="card-title" style={{ margin: 0 }}>🛡️ Fundo de Emergência — {invMonth}</div>
                <button onClick={() => { setFeEditMeta(!feEditMeta); setFeMetaInput(metaEfetiva); }} style={{ fontSize: 11, color: 'var(--t3)', background: 'rgba(255,255,255,.06)', border: 'none', borderRadius: 7, padding: '5px 10px', cursor: 'pointer', fontFamily: 'var(--font)' }}>✏️ Editar meta</button>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '.5rem' }}>
                <div>
                  <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--t1)', letterSpacing: '-.04em' }}>{fmtV(fe.value)}</div>
                  <div style={{ fontSize: 12, color: 'var(--t3)', marginTop: 2 }}>de {fmtV(metaEfetiva)} meta</div>
                </div>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: pctFe >= 100 ? 'var(--accent)' : pctFe >= 50 ? '#f7931a' : 'var(--red-soft)' }}>{pctFe}%</div>
              </div>

              {/* Valorização do FE (juros, rendimento de produto) */}
              {(() => {
                const feInv = getFeInvestidoForMonth(invMonth);
                const feVal = getFeValorizacaoForMonth(invMonth);
                const feRend = getFeRendimentoPctForMonth(invMonth);
                if (feRend !== null && feInv > 0 && Math.abs(feVal) >= 0.01) {
                  const positive = feVal >= 0;
                  return (
                    <div style={{ fontSize: 11, color: positive ? 'var(--accent)' : 'var(--red-soft)', fontWeight: 700, marginBottom: 4 }}>
                      {positive ? '↑' : '↓'} {positive ? '+' : ''}{feRend.toFixed(2)}% ({positive ? '+' : ''}{fmtV(feVal)}) desde início
                    </div>
                  );
                }
                return null;
              })()}

              <div style={{ fontSize: 10, color: 'var(--t3)', marginBottom: '.75rem' }}>
                Investido: <strong style={{ color: 'var(--t2)' }}>{fmtV(getFeInvestidoForMonth(invMonth))}</strong>
              </div>

              <div className="bar-bg" style={{ height: 8, marginBottom: '.75rem' }}><div style={{ height: '100%', width: pctFe + '%', background: 'var(--accent)', borderRadius: 4, transition: 'width 1s' }} /></div>

              {feEditMeta && (
                <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                  <input type="number" value={feMetaInput} onChange={e => setFeMetaInput(e.target.value)} placeholder="Nova meta (€)" min="0" step="500"
                    style={{ flex: 1, background: 'rgba(255,255,255,.07)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px', color: 'var(--t1)', fontFamily: 'var(--font)', fontSize: 13, fontWeight: 600, outline: 'none' }} />
                  <button onClick={handleSaveFeMeta} style={{ padding: '8px 14px', borderRadius: 8, background: 'var(--accent)', color: '#000', border: 'none', fontFamily: 'var(--font)', fontSize: 12, fontWeight: 800, cursor: 'pointer' }}>Guardar</button>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'minmax(0,1fr) minmax(0,1fr)' : 'minmax(0,1fr) minmax(0,1fr) auto', gap: 8 }}>
                <button onClick={handleReforcar} style={{ padding: 11, borderRadius: 9, background: 'var(--accent)', color: '#000', border: 'none', fontFamily: 'var(--font)', fontSize: 13, fontWeight: 800, cursor: 'pointer' }}>+ Reforçar</button>
                <button onClick={handleRetirar} style={{ padding: 11, borderRadius: 9, background: 'rgba(229,57,53,.15)', color: 'var(--red-soft)', border: '1px solid rgba(229,57,53,.25)', fontFamily: 'var(--font)', fontSize: 13, fontWeight: 800, cursor: 'pointer' }}>− Retirar</button>
                <button onClick={handleAtualizarValorFE} title="Atualizar com o saldo que o banco/produto mostra (juros, rendimento)" style={{ padding: '11px 14px', borderRadius: 9, background: 'rgba(123,127,255,.12)', color: '#7b7fff', border: '1px solid rgba(123,127,255,.25)', fontFamily: 'var(--font)', fontSize: 11, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>💰 Valor atual</button>
              </div>
            </>
          )}
        </div>

        {/* Donut */}
        <div className="card">
          <div className="card-title">Distribuição do Mês</div>
          <div style={{ position: 'relative', height: 160, marginBottom: '.75rem' }}><canvas ref={donutRef} /></div>
          <div style={{ fontSize: 12 }}>
            {['Fundo Emergência', ...ativos.map(a => a.nome)].map((label, i) => {
              const vals = [fe.value, ...ativos.map(a => getAtivoValueForMonth(a.id, invMonth))];
              const colors = ['#00D764', ...ativos.map(a => a.cor || TIPO_COLORS[a.tipo] || '#6e7491')];
              const total = vals.reduce((s, v) => s + v, 0);
              const pct = total > 0 ? Math.round(vals[i] / total * 100) : 0;
              return (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><div style={{ width: 9, height: 9, borderRadius: '50%', background: colors[i] }} /><span style={{ color: 'var(--t2)', fontSize: 11 }}>{label}</span></div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}><span style={{ fontSize: 10, color: 'var(--t3)' }}>{pct}%</span><span style={{ fontWeight: 700, color: 'var(--t1)', fontSize: 11 }}>{fmtV(vals[i])}</span></div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Ativos list */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '.75rem', gap: 8, flexWrap: 'wrap' }}>
        <div className="slbl" style={{ margin: 0 }}>Ativos neste mês</div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button onClick={() => setTutorialOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 700, color: 'var(--t3)', background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 8, padding: '7px 12px', cursor: 'pointer', fontFamily: 'var(--font)' }}>ℹ️ Como funciona?</button>
          <button onClick={onAddAtivo} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 700, color: 'var(--accent)', background: 'var(--accent-dim)', border: 'none', borderRadius: 8, padding: '7px 14px', cursor: 'pointer', fontFamily: 'var(--font)' }}>+ Adicionar ativo</button>
        </div>
      </div>

      <div style={{ background: 'rgba(0,215,100,.06)', border: '1px solid rgba(0,215,100,.15)', borderRadius: 12, padding: '.9rem 1.1rem', marginBottom: '1.25rem', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
        <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>💡</span>
        <div style={{ fontSize: 12, color: 'var(--t2)', lineHeight: 1.65 }}>
          <strong style={{ color: 'var(--t1)' }}>3 acções por ativo:</strong> <strong style={{ color: 'var(--accent)' }}>+ Reforçar</strong> quando metes dinheiro, <strong style={{ color: 'var(--red-soft)' }}>− Retirar</strong> quando tiras, <strong style={{ color: '#7b7fff' }}>💰 Valor atual</strong> quando o broker mostra um valor diferente (movimento do mercado).
        </div>
      </div>

      {ativos.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '2rem', color: 'var(--t3)', marginBottom: '2rem' }}>
          <div style={{ fontSize: '2rem' }}>📈</div>
          <div style={{ fontWeight: 700, color: 'var(--t2)', margin: '.5rem 0' }}>Sem ativos ainda.</div>
          Adiciona o teu primeiro ativo acima.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'minmax(0,1fr)' : 'repeat(auto-fill,minmax(300px,1fr))', gap: 12, marginBottom: '2rem' }}>
          {ativos.map(a => {
            const val = getAtivoValueForMonth(a.id, invMonth);
            const cor = a.cor || TIPO_COLORS[a.tipo] || '#6e7491';
            const totalMes = getTotalInvestidoForMonth(invMonth) || 1;
            const pctDoMes = Math.round((val / totalMes) * 100) || 0;
            const investido = getAtivoInvestidoForMonth(a.id, invMonth);
            const valorizacao = getAtivoValorizacaoForMonth(a.id, invMonth);
            const rendPct = getAtivoRendimentoPctForMonth(a.id, invMonth);
            const positive = valorizacao >= 0;
            const prevVal = getAtivoValueForMonth(a.id, prevMonth);
            const contribMes = ((ativoContribs[a.id] || {})[invMonth] || 0);
            const variacaoMercado = prevVal > 0 ? (val - prevVal - contribMes) : 0;
            const varMercadoPct = prevVal > 0 ? ((variacaoMercado / prevVal) * 100) : null;
            return (
              <div key={a.id} style={{ background: 'rgba(255,255,255,.04)', border: '1px solid var(--border)', borderRadius: 12, padding: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                    <div style={{ width: 34, height: 34, borderRadius: 9, background: cor + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: cor }}>{a.tipo.slice(0, 2)}</div>
                    <div><div style={{ fontSize: 14, fontWeight: 700, color: 'var(--t1)' }}>{a.nome}</div><div style={{ fontSize: 11, color: 'var(--t3)' }}>{a.tipo}{a.notas ? ' · ' + a.notas : ''}</div></div>
                  </div>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button onClick={() => onEditAtivo(a.id)} style={{ width: 26, height: 26, borderRadius: 6, border: 'none', background: 'rgba(255,255,255,.08)', cursor: 'pointer', color: 'var(--t3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }}>✏️</button>
                    <button onClick={() => handleDeleteAtivo(a.id)} style={{ width: 26, height: 26, borderRadius: 6, border: 'none', background: 'rgba(229,57,53,.1)', cursor: 'pointer', color: 'var(--red-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }}>✕</button>
                  </div>
                </div>

                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--t1)' }}>{fmtV(val)}</div>

                {rendPct !== null && investido > 0 ? (
                  <div style={{ fontSize: 12, color: positive ? 'var(--accent)' : 'var(--red-soft)', marginTop: 2, fontWeight: 700 }}>
                    {positive ? '↑' : '↓'} {positive ? '+' : ''}{rendPct.toFixed(1)}% ({positive ? '+' : ''}{fmtV(valorizacao)}) desde início
                  </div>
                ) : (
                  <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 2 }}>Sem valorização calculada ainda</div>
                )}

                <div style={{ display: 'flex', gap: 10, fontSize: 10, color: 'var(--t3)', marginTop: 6, flexWrap: 'wrap' }}>
                  <span>Investido: <strong style={{ color: 'var(--t2)' }}>{fmtV(investido)}</strong></span>
                  {varMercadoPct !== null && Math.abs(varMercadoPct) >= 0.1 && (
                    <span>
                      Este mês: <strong style={{ color: variacaoMercado >= 0 ? 'var(--accent)' : 'var(--red-soft)' }}>
                        {variacaoMercado >= 0 ? '+' : ''}{varMercadoPct.toFixed(1)}%
                      </strong>
                    </span>
                  )}
                </div>

                <div style={{ height: 3, background: 'rgba(255,255,255,.06)', borderRadius: 2, marginTop: 10 }}>
                  <div style={{ width: pctDoMes + '%', height: '100%', background: cor, borderRadius: 2, transition: 'width .8s' }} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'minmax(0,1fr) minmax(0,1fr)' : 'minmax(0,1fr) minmax(0,1fr) auto', gap: 6, marginTop: 10 }}>
                  <button onClick={() => handleReforcarAtivo(a.id)} style={{ padding: 9, borderRadius: 8, background: 'var(--accent)', color: '#000', border: 'none', fontFamily: 'var(--font)', fontSize: 12, fontWeight: 800, cursor: 'pointer' }}>+ Reforçar</button>
                  <button onClick={() => handleRetirarAtivo(a.id)} style={{ padding: 9, borderRadius: 8, background: 'rgba(229,57,53,.15)', color: 'var(--red-soft)', border: '1px solid rgba(229,57,53,.25)', fontFamily: 'var(--font)', fontSize: 12, fontWeight: 800, cursor: 'pointer' }}>− Retirar</button>
                  <button onClick={() => handleAtualizarValorAtivo(a.id)} title="Atualizar o valor total segundo o broker (movimento do mercado)" style={{ padding: '9px 12px', borderRadius: 8, background: 'rgba(123,127,255,.12)', color: '#7b7fff', border: '1px solid rgba(123,127,255,.25)', fontFamily: 'var(--font)', fontSize: 11, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>💰 Valor atual</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {tutorialOpen && <InvestmentsTutorial onClose={closeTutorial} />}
    </div>
  );
}
