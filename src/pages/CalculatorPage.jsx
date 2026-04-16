import React, { useState, useEffect, useRef } from 'react';
import { Chart, LineController, LineElement, PointElement, LinearScale, CategoryScale, Filler, Tooltip } from 'chart.js';
import { fv } from '../utils/helpers';

Chart.register(LineController, LineElement, PointElement, LinearScale, CategoryScale, Filler, Tooltip);

export default function CalculatorPage({ fmtV, embedded }) {
  const [cap, setCap] = useState(5000);
  const [men, setMen] = useState(200);
  const [tax, setTax] = useState(7);
  const [ano, setAno] = useState(20);
  const [editingId, setEditingId] = useState(null);
  const [editVal, setEditVal] = useState('');
  const chartRef = useRef(null);
  const chartInstRef = useRef(null);

  const fmt = (n) => n.toLocaleString('pt-PT', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';

  const n = ano * 12;
  const r = tax / 100;
  const final = fv(cap, men, r, n);
  const invested = cap + men * n;
  const juros = final - invested;
  const renda = final * 0.04 / 12;
  const bonus = fv(cap, men + 100, r, n) - final;
  const jPct = final > 0 ? Math.round(juros / final * 100) : 0;

  // Build chart data
  const buildChartData = () => {
    const labels = [];
    const dataTotal = [];
    const dataInv = [];
    for (let i = 0; i <= ano; i++) {
      labels.push(i === 0 ? 'Agora' : 'Ano ' + i);
      dataTotal.push(parseFloat(fv(cap, men, r, i * 12).toFixed(2)));
      dataInv.push(parseFloat((cap + men * i * 12).toFixed(2)));
    }
    return { labels, dataTotal, dataInv };
  };

  // Create chart once
  useEffect(() => {
    if (!chartRef.current) return;
    if (chartInstRef.current) return; // Already created
    const { labels, dataTotal, dataInv } = buildChartData();
    const ctx = chartRef.current.getContext('2d');
    const grad = ctx.createLinearGradient(0, 0, 0, 250);
    grad.addColorStop(0, 'rgba(0,215,100,0.3)');
    grad.addColorStop(1, 'rgba(0,215,100,0.02)');
    chartInstRef.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          { label: 'Valor total', data: dataTotal, borderColor: '#00D764', backgroundColor: grad, borderWidth: 2.5, fill: true, tension: .4, pointRadius: 0 },
          { label: 'Total investido', data: dataInv, borderColor: 'rgba(255,255,255,0.2)', backgroundColor: 'transparent', borderWidth: 1.5, fill: false, tension: .4, pointRadius: 0, borderDash: [5, 3] }
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        animation: { duration: 0 },
        plugins: { legend: { display: false }, tooltip: { callbacks: { label: c => c.dataset.label + ': ' + fmt(c.raw) } } },
        scales: { x: { grid: { display: false }, ticks: { color: '#6e7491', font: { size: 10 }, maxTicksLimit: 8 } }, y: { grid: { color: 'rgba(255,255,255,.05)' }, ticks: { color: '#6e7491', font: { size: 10 }, callback: v => v >= 1000 ? (v / 1000).toFixed(0) + 'k €' : fmt(v) } } }
      }
    });
    return () => { if (chartInstRef.current) { chartInstRef.current.destroy(); chartInstRef.current = null; } };
  }, []);

  // Update chart data without destroying/recreating
  useEffect(() => {
    if (!chartInstRef.current) return;
    const { labels, dataTotal, dataInv } = buildChartData();
    chartInstRef.current.data.labels = labels;
    chartInstRef.current.data.datasets[0].data = dataTotal;
    chartInstRef.current.data.datasets[1].data = dataInv;
    chartInstRef.current.update('none'); // 'none' = no animation, instant update
  }, [cap, men, tax, ano]);

  const marcos = [1, 2, 5, 10, 20, 30, 40].filter(y => y <= ano);

  return (
    <div id="page-calc" className={embedded ? '' : 'page active'}>
      {!embedded && <div className="calc-header">
        <h1>Calculadora de Investimento</h1>
        <p>Simula o crescimento do teu dinheiro com juros compostos.</p>
      </div>}

      <div className="sliders-grid">
        {[
          { id: 's-cap', label: 'Capital inicial', val: cap, set: setCap, display: fmt(cap), suffix: ' €', min: 0, max: 100000, step: 500 },
          { id: 's-men', label: 'Investimento mensal', val: men, set: setMen, display: fmt(men), suffix: ' €', min: 0, max: 5000, step: 25 },
          { id: 's-tax', label: 'Retorno anual', val: tax, set: setTax, display: tax.toFixed(1) + '%', suffix: '%', min: 0, max: 20, step: 0.5 },
          { id: 's-ano', label: 'Horizonte temporal', val: ano, set: setAno, display: ano + ' anos', suffix: '', min: 1, max: 50, step: 1 },
        ].map(s => {
          const isEditing = editingId === s.id;
          const startEdit = () => {
            setEditingId(s.id);
            setEditVal(String(s.val));
          };
          const confirmEdit = () => {
            const parsed = parseFloat(editVal);
            if (!isNaN(parsed)) {
              const clamped = Math.min(s.max, Math.max(s.min, parsed));
              s.set(clamped);
            }
            setEditingId(null);
          };
          return (
            <div className="sg" key={s.id}>
              <div className="sg-top">
                <span className="sg-lbl">{s.label}</span>
                {isEditing ? (
                  <input
                    type="number"
                    className="sg-val-input"
                    value={editVal}
                    min={s.min}
                    max={s.max}
                    step={s.step}
                    onChange={e => setEditVal(e.target.value)}
                    onBlur={confirmEdit}
                    onKeyDown={e => { if (e.key === 'Enter') confirmEdit(); if (e.key === 'Escape') setEditingId(null); }}
                    autoFocus
                  />
                ) : (
                  <span className="sg-val" onClick={startEdit} title="Clica para editar">{s.display}</span>
                )}
              </div>
              <input type="range" min={s.min} max={s.max} step={s.step} value={s.val}
                onChange={e => s.set(parseFloat(e.target.value))} />
            </div>
          );
        })}
      </div>

      {/* Results */}
      <div className="results-grid">
        <div className="rc hero-c" style={{ gridColumn: 'span 2' }}>
          <div>
            <div className="rc-lbl">Valor Final</div>
            <div className="rc-val">{fmt(final)}</div>
            <div className="rc-sub">total após {ano} anos</div>
          </div>
          <div className="hero-r" style={{ textAlign: 'right' }}>
            <div className="rc-lbl">Renda passiva (4%)</div>
            <div className="rc-val">{fmt(renda)}</div>
            <div className="rc-sub">/mês</div>
          </div>
        </div>
        <div className="rc plain">
          <div className="rc-lbl">Total investido</div>
          <div className="rc-val">{fmt(invested)}</div>
          <div className="rc-sub">capital + contribuições</div>
        </div>
        <div className="rc plain">
          <div className="rc-lbl">Juros ganhos</div>
          <div className="rc-val">{fmt(juros)}</div>
          <div className="rc-sub">equivale a {invested > 0 ? Math.round(juros / invested * 100) : 0}% do investido</div>
        </div>
      </div>

      {/* Insight */}
      <div className="insight">
        <div className="insight-dot" />
        <div className="insight-txt">
          Com {fmt(men)}/mês durante {ano} anos a {tax}% ao ano, acumulas {fmt(final)}. Os juros compostos geram {fmt(juros)} — {jPct}% do total.
        </div>
      </div>

      {/* Chart */}
      <div className="chart-card-c">
        <div className="chart-legend">
          <div className="li"><div className="lsq" style={{ background: '#00D764' }} />Valor total</div>
          <div className="li"><div className="lsq" style={{ background: 'rgba(255,255,255,.2)' }} />Total investido</div>
        </div>
        <div className="chart-wrap"><canvas ref={chartRef} /></div>
      </div>

      {/* Bottom grid */}
      <div className="bot-grid">
        <div className="bot-card">
          <div className="bot-title">Juros compostos</div>
          <div style={{ fontSize: 12, color: 'var(--t3)', marginBottom: 8 }}>Proporção juros vs investido</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--accent)' }}>{jPct}%</div>
          <div className="pbar-bg"><div className="pbar-fill" style={{ width: jPct + '%' }} /></div>
          <div style={{ fontSize: 11, color: 'var(--t3)' }}>dos ganhos são juros compostos</div>
          <div className="bonus-box">
            <div className="bonus-lbl">Se investires +100€/mês</div>
            <div className="bonus-val">+{fmt(bonus)}</div>
            <div className="bonus-sub">valor extra acumulado</div>
          </div>
        </div>
        <div className="bot-card">
          <div className="bot-title">Marcos de crescimento</div>
          {marcos.map(y => (
            <div key={y} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
              <span style={{ color: 'var(--t2)' }}>Ano {y}</span>
              <span style={{ fontWeight: 700, color: 'var(--t1)' }}>{fmt(fv(cap, men, r, y * 12))}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
