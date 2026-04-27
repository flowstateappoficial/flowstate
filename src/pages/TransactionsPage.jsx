import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Chart, DoughnutController, ArcElement, Tooltip } from 'chart.js';
import { CATS, CC, CB, PT_M, PT_MESES } from '../utils/constants';
import { autoCateg, detectColumns, splitCSVLine, buildPreviewRow, parseAnyNumber, parseAnyDate } from '../utils/helpers';

Chart.register(DoughnutController, ArcElement, Tooltip);

export default function TransactionsPage({ txs, txsWithRules, currentPeriod, setCurrentPeriod, userRules, onOpenModal, onDeleteTx, onChangeCat, onImport, fmtV, fmtDate, getCurrentMonth }) {
  const [previewTxs, setPreviewTxs] = useState([]);
  const [showPreview, setShowPreview] = useState(false);
  const [importSummary, setImportSummary] = useState(null);
  const [importError, setImportError] = useState(null);
  const [catDropOpen, setCatDropOpen] = useState(null);
  const [periodMenuOpen, setPeriodMenuOpen] = useState(false);
  const donutRef = useRef(null);
  const chartRef = useRef(null);
  const fileRef = useRef(null);
  const periodMenuRef = useRef(null);

  // Close period menu on outside click / Escape
  useEffect(() => {
    if (!periodMenuOpen) return;
    const onDocClick = (e) => {
      if (periodMenuRef.current && !periodMenuRef.current.contains(e.target)) setPeriodMenuOpen(false);
    };
    const onEsc = (e) => { if (e.key === 'Escape') setPeriodMenuOpen(false); };
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onEsc);
    };
  }, [periodMenuOpen]);

  const currentPeriodLabel = currentPeriod === 'all'
    ? 'Todos os meses'
    : (() => {
        const [yy, mm] = currentPeriod.split('-');
        return `${PT_MESES[parseInt(mm) - 1]} ${yy}`;
      })();

  const filtered = currentPeriod === 'all' ? txsWithRules : txsWithRules.filter(t => t.date.startsWith(currentPeriod));
  const ins = filtered.filter(t => t.type === 'rendimento');
  const outs = filtered.filter(t => t.type === 'despesa');
  const totalIn = ins.reduce((s, t) => s + t.val, 0);
  const totalOut = outs.reduce((s, t) => s + t.val, 0);
  const saldo = totalIn - totalOut;
  const sorted = [...filtered].sort((a, b) => b.date.localeCompare(a.date));

  // Period buttons
  const year = new Date().getFullYear();
  const months = PT_M.map((_, i) => `${year}-${String(i + 1).padStart(2, '0')}`);

  // Donut chart
  useEffect(() => {
    if (!donutRef.current) return;
    if (chartRef.current) chartRef.current.destroy();
    const catTotals = {};
    outs.forEach(t => { catTotals[t.cat] = (catTotals[t.cat] || 0) + t.val; });
    const labels = Object.keys(catTotals);
    const vals = Object.values(catTotals);
    const colors = labels.map(l => CC[l] || '#6e7491');
    if (labels.length > 0) {
      chartRef.current = new Chart(donutRef.current.getContext('2d'), {
        type: 'doughnut',
        data: { labels, datasets: [{ data: vals, backgroundColor: colors, borderWidth: 0, hoverOffset: 5 }] },
        options: { responsive: true, maintainAspectRatio: false, cutout: '70%', plugins: { legend: { display: false }, tooltip: { callbacks: { label: c => ' ' + fmtV(c.raw) } } } }
      });
    }
    return () => { if (chartRef.current) chartRef.current.destroy(); };
  }, [filtered]);

  const catTotals = {};
  outs.forEach(t => { catTotals[t.cat] = (catTotals[t.cat] || 0) + t.val; });
  const tot = Object.values(catTotals).reduce((s, v) => s + v, 0);

  // Import handlers
  const handleFile = (file) => {
    if (!file) return;
    setImportSummary(null);
    setImportError(null);

    // Validar extensão antes de processar — evita silêncio quando o utilizador
    // arrasta um PDF, imagem, ou outro formato qualquer não suportado.
    const name = file.name.toLowerCase();
    const ok = /\.(csv|xlsx|xls)$/.test(name);
    if (!ok) {
      const ext = name.match(/\.[a-z0-9]+$/)?.[0] || '(sem extensão)';
      setImportError(`Formato ${ext} não suportado. Aceitamos apenas CSV ou Excel (.xlsx, .xls). Exporta o extrato bancário num desses formatos.`);
      // Limpa o input para que voltar a seleccionar o mesmo ficheiro dispare onChange
      if (fileRef.current) fileRef.current.value = '';
      return;
    }

    if (file.name.toLowerCase().match(/\.xlsx?$/)) {
      const r = new FileReader();
      r.onload = (e) => {
        const s = document.createElement('script');
        s.src = 'https://cdn.sheetjs.com/xlsx-0.20.0/package/dist/xlsx.full.min.js';
        s.onload = () => {
          const wb = window.XLSX.read(e.target.result, { type: 'array', cellDates: true });
          const ws = wb.Sheets[wb.SheetNames[0]];
          const rows = window.XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
          processRows(rows);
        };
        document.head.appendChild(s);
      };
      r.readAsArrayBuffer(file);
    } else {
      const r = new FileReader();
      r.onload = (e) => {
        const lines = e.target.result.split(/\r?\n/).filter(l => l.trim());
        let hi = 0;
        for (let i = 0; i < Math.min(lines.length, 15); i++) {
          const c = splitCSVLine(lines[i]);
          if (c.length >= 3 && !c[0].match(/^\d{1,2}[\/\-]/)) { hi = i; break; }
        }
        const map = detectColumns(splitCSVLine(lines[hi]));
        const result = [];
        for (let i = hi + 1; i < lines.length; i++) {
          const c = splitCSVLine(lines[i]);
          if (c.length < 2) continue;
          const r = buildPreviewRow(c, map, userRules);
          if (r) result.push(r);
        }
        setPreviewTxs(result);
        setShowPreview(true);
      };
      r.readAsText(file, 'UTF-8');
    }
  };

  const processRows = (rows) => {
    let hi = 0;
    const COL_DATE_KW = ['data','date','datum','fecha'];
    const COL_VAL_KW = ['montante','valor','amount'];
    for (let i = 0; i < Math.min(rows.length, 15); i++) {
      const r = rows[i].map(c => String(c || '').toLowerCase());
      if (r.some(c => COL_DATE_KW.some(k => c.includes(k))) || r.some(c => COL_VAL_KW.some(k => c.includes(k)))) { hi = i; break; }
    }
    const map = detectColumns(rows[hi].map(c => String(c || '')));
    const result = [];
    for (let i = hi + 1; i < rows.length; i++) {
      const c = rows[i].map(c => c instanceof Date ? c.toISOString().slice(0, 10) : String(c || ''));
      const r = buildPreviewRow(c, map, userRules);
      if (r) result.push(r);
    }
    setPreviewTxs(result);
    setShowPreview(true);
  };

  const confirmImport = async () => {
    const count = await onImport(previewTxs);
    setPreviewTxs([]);
    setShowPreview(false);
    setImportSummary(`✅ Sucesso! ${count} transações importadas.`);
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <div id="page-txs" className="page active">
      <div className="topbar">
        <div ref={periodMenuRef} style={{ position: 'relative', display: 'inline-block', width: '100%', maxWidth: 280, zIndex: periodMenuOpen ? 9999 : 'auto' }}>
          <button
            onClick={() => setPeriodMenuOpen(o => !o)}
            aria-haspopup="menu"
            aria-expanded={periodMenuOpen}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              gap: 12, width: '100%',
              padding: '11px 16px', borderRadius: 12,
              background: periodMenuOpen ? 'rgba(0,215,100,.12)' : 'rgba(255,255,255,.05)',
              border: '1px solid ' + (periodMenuOpen ? 'rgba(0,215,100,.35)' : 'rgba(255,255,255,.1)'),
              color: 'var(--t1)', fontSize: 14, fontWeight: 700,
              cursor: 'pointer', fontFamily: 'var(--font)',
              transition: 'all .15s'
            }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
              <span style={{ fontSize: 15 }}>📅</span>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{currentPeriodLabel}</span>
            </span>
            <span style={{ fontSize: 10, color: 'var(--t3)', transform: periodMenuOpen ? 'rotate(180deg)' : 'none', transition: 'transform .15s' }}>▾</span>
          </button>
          {periodMenuOpen && (
            <div role="menu" style={{
              position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0,
              maxHeight: 360, overflowY: 'auto',
              padding: 6, borderRadius: 14,
              background: '#161a2e', border: '1px solid rgba(255,255,255,.15)',
              boxShadow: '0 14px 40px rgba(0,0,0,.6)',
              zIndex: 9999
            }}>
              <button onClick={() => { setCurrentPeriod('all'); setPeriodMenuOpen(false); }}
                role="menuitem"
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  width: '100%', padding: '10px 12px', borderRadius: 10,
                  background: currentPeriod === 'all' ? 'rgba(0,215,100,.12)' : 'transparent',
                  color: currentPeriod === 'all' ? 'var(--accent)' : 'var(--t2)',
                  border: 'none', cursor: 'pointer', textAlign: 'left',
                  fontFamily: 'var(--font)', fontSize: 13, fontWeight: 700,
                  marginBottom: 4
                }}>
                <span>Todos os meses</span>
                {currentPeriod === 'all' && <span style={{ fontSize: 12, fontWeight: 800 }}>✓</span>}
              </button>
              <div style={{ height: 1, background: 'rgba(255,255,255,.06)', margin: '4px 6px 6px' }} />
              {months.map(mo => {
                const monthIdx = parseInt(mo.split('-')[1]);
                const isActive = mo === currentPeriod;
                return (
                  <button key={mo} onClick={() => { setCurrentPeriod(mo); setPeriodMenuOpen(false); }}
                    role="menuitem"
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      width: '100%', padding: '10px 12px', borderRadius: 10,
                      background: isActive ? 'rgba(0,215,100,.12)' : 'transparent',
                      color: isActive ? 'var(--accent)' : 'var(--t2)',
                      border: 'none', cursor: 'pointer', textAlign: 'left',
                      fontFamily: 'var(--font)', fontSize: 13, fontWeight: 600
                    }}>
                    <span>{PT_MESES[monthIdx - 1]} {year}</span>
                    {isActive && <span style={{ fontSize: 12, fontWeight: 800 }}>✓</span>}
                  </button>
                );
              })}
            </div>
          )}
        </div>
        <button className="btn-new" onClick={onOpenModal}>
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14"><line x1="8" y1="3" x2="8" y2="13"/><line x1="3" y1="8" x2="13" y2="8"/></svg>
          Nova transação
        </button>
      </div>

      {/* Summary pills */}
      <div className="summary-row">
        <div className="pill in"><div className="pill-lbl">Receitas</div><div className="pill-val">{fmtV(totalIn)}</div><div className="pill-sub">{ins.length} entrada(s)</div></div>
        <div className="pill out"><div className="pill-lbl">Despesas</div><div className="pill-val">{fmtV(totalOut)}</div><div className="pill-sub">{outs.length} saída(s)</div></div>
        <div className="pill saldo"><div className="pill-lbl">Saldo</div><div className="pill-val" style={{ color: saldo >= 0 ? 'var(--accent)' : 'var(--red-soft)' }}>{fmtV(saldo)}</div></div>
      </div>

      {/* Import */}
      <div className="import-card" style={{ marginBottom: 16 }}>
        <div className="import-title">Importar extrato</div>
        <div className="drop-zone" onClick={() => fileRef.current?.click()}
          onDragOver={e => { e.preventDefault(); e.currentTarget.classList.add('drag'); }}
          onDragLeave={e => e.currentTarget.classList.remove('drag')}
          onDrop={e => { e.preventDefault(); e.currentTarget.classList.remove('drag'); handleFile(e.dataTransfer?.files?.[0]); }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="22" height="22" style={{ margin: '0 auto 10px', display: 'block', color: 'var(--t3)' }}>
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
          </svg>
          <p>Arrasta ou clica para importar</p>
          <span style={{ fontSize: 11, color: 'var(--t3)' }}>CSV ou Excel (.xlsx) do teu banco</span>
          <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" style={{ display: 'none' }} onChange={e => handleFile(e.target.files[0])} />
        </div>

        {importError && (
          <div style={{
            marginTop: 10, padding: '12px 14px', borderRadius: 10,
            background: 'rgba(229,57,53,.08)', border: '1px solid rgba(229,57,53,.25)',
            display: 'flex', gap: 10, alignItems: 'flex-start'
          }}>
            <span style={{ fontSize: 16, flexShrink: 0 }}>⚠️</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--red-soft)', marginBottom: 3 }}>Ficheiro não suportado</div>
              <div style={{ fontSize: 12, color: 'var(--t2)', lineHeight: 1.5 }}>{importError}</div>
            </div>
            <button onClick={() => setImportError(null)} aria-label="Fechar"
              style={{ background: 'transparent', border: 'none', color: 'var(--t3)', fontSize: 16, cursor: 'pointer', padding: 2 }}>×</button>
          </div>
        )}

        {showPreview && previewTxs.length > 0 && (
          <div style={{ marginTop: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--t1)' }}>Pré-visualização</span>
              <span style={{ fontSize: 11, color: 'var(--t3)' }}>{previewTxs.length} transações detetadas</span>
            </div>
            <div style={{ overflowX: 'auto', maxHeight: 200 }}>
              <table className="preview-table">
                <thead><tr><th>Data</th><th>Descrição</th><th>Valor</th><th>Categoria</th></tr></thead>
                <tbody>
                  {previewTxs.slice(0, 10).map((t, i) => (
                    <tr key={i}>
                      <td>{t.date}</td>
                      <td>{t.desc}</td>
                      <td style={{ color: t.type === 'rendimento' ? 'var(--accent)' : 'var(--red-soft)' }}>
                        {t.type === 'rendimento' ? '+' : '-'}{t.val.toLocaleString('pt-PT', { minimumFractionDigits: 2 })} €
                      </td>
                      <td>
                        <select value={t.cat} onChange={e => {
                          const np = [...previewTxs];
                          np[i] = { ...np[i], cat: e.target.value, type: e.target.value === 'Rendimento' ? 'rendimento' : 'despesa' };
                          setPreviewTxs(np);
                        }} style={{ background: 'var(--card)', color: 'var(--t1)', border: '1px solid var(--border)', borderRadius: 6, padding: '3px 6px', fontSize: 11 }}>
                          {CATS.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="preview-actions">
              <button className="btn-confirm" onClick={confirmImport}>✓ Importar tudo</button>
              <button className="btn-discard" onClick={() => { setPreviewTxs([]); setShowPreview(false); }}>Cancelar</button>
            </div>
          </div>
        )}

        {importSummary && (
          <div style={{ marginTop: 12, background: 'var(--accent-dim)', borderRadius: 10, padding: '12px 16px', fontWeight: 700, color: 'var(--accent)', fontSize: 13 }}>
            {importSummary}
          </div>
        )}
      </div>

      {/* Main grid: list + chart */}
      <div className="main-grid">
        <div className="tcard">
          <div className="tcard-header">
            <span className="tcard-title">Registos</span>
            <span className="tx-count">{filtered.length} registo{filtered.length !== 1 ? 's' : ''}</span>
          </div>
          {sorted.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2.5rem 1rem' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>💸</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--t1)', marginBottom: '.5rem' }}>Ainda sem transações</div>
              <div style={{ fontSize: 13, color: 'var(--t3)', marginBottom: '1.5rem', lineHeight: 1.6 }}>Regista o teu primeiro movimento ou importa o extrato do teu banco.</div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
                <button onClick={onOpenModal} style={{ padding: '10px 20px', borderRadius: 10, background: 'var(--accent)', color: '#000', border: 'none', fontFamily: 'var(--font)', fontSize: 13, fontWeight: 800, cursor: 'pointer' }}>+ Adicionar transação</button>
              </div>
            </div>
          ) : sorted.map(t => {
            const pillBg = CB[t.cat] || 'rgba(110,116,145,.15)';
            const pillColor = CC[t.cat] || '#6e7491';
            return (
              <div className="tx-row" key={t.id}>
                <div className="tx-icon" style={{ background: pillBg, color: pillColor }}>
                  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" width="15" height="15"><circle cx="8" cy="8" r="5"/></svg>
                </div>
                <div className="tx-body">
                  <div className="tx-desc">{t.desc}</div>
                  <div className="tx-meta">
                    <span className="tx-meta-date">{fmtDate(t.date)}</span>
                    <span style={{ color: 'var(--border-md)' }}>·</span>
                    <span className="cat-pill" style={{ background: pillBg, color: pillColor, position: 'relative' }}
                      onClick={(e) => { e.stopPropagation(); setCatDropOpen(catDropOpen === t.id ? null : t.id); }}>
                      {t.cat}
                      <svg viewBox="0 0 10 6" fill="none" stroke="currentColor" strokeWidth="1.5" width="9" height="9"><path d="M1 1l4 4 4-4"/></svg>
                    </span>
                    {catDropOpen === t.id && (
                      <div style={{ position: 'absolute', zIndex: 9999, background: '#252b3d', border: '1px solid rgba(255,255,255,.14)', borderRadius: 14, padding: 6, minWidth: 175, boxShadow: '0 16px 48px rgba(0,0,0,.6)', top: '100%', left: 0 }}>
                        {CATS.map(c => (
                          <div key={c} className="cat-opt" onClick={(e) => { e.stopPropagation(); onChangeCat(t.id, c); setCatDropOpen(null); }}>
                            <div className="cat-opt-dot" style={{ background: CC[c] || '#888' }} />{c}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="tx-right">
                  <div className={`tx-amt ${t.type === 'rendimento' ? 'pos' : 'neg'}`}>
                    {t.type === 'rendimento' ? '+' : '−'}{fmtV(t.val)}
                  </div>
                  <button className="tx-del" onClick={() => onDeleteTx(t.id)}>
                    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" width="12" height="12"><line x1="3" y1="3" x2="13" y2="13"/><line x1="13" y1="3" x2="3" y2="13"/></svg>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Donut chart */}
        <div className="chart-card">
          <div className="chart-title">Distribuição de despesas</div>
          <div className="donut-wrap"><canvas ref={donutRef} /></div>
          <div className="cl-list">
            {Object.keys(catTotals).length > 0 ? Object.entries(catTotals).map(([label, val]) => (
              <div className="cl-item" key={label}>
                <div className="cl-left">
                  <div className="cl-dot" style={{ background: CC[label] || '#6e7491' }} />
                  <span className="cl-name">{label}</span>
                </div>
                <div className="cl-right">
                  <span className="cl-amt">{fmtV(val)}</span>
                  <span className="cl-pct">{tot > 0 ? ((val / tot) * 100).toFixed(0) : 0}%</span>
                </div>
              </div>
            )) : (
              <div style={{ fontSize: 12, color: 'var(--t3)', textAlign: 'center', padding: '.5rem' }}>Sem despesas no período</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
