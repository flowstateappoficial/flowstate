import React, { useState, useMemo } from 'react';
import { detectSubscriptions, toggleCancelFlag, loadSubPrefs } from '../utils/subscriptions';

const PRIORITY_CFG = {
  essencial: { label: 'Essencial', color: '#00D764', bg: 'rgba(0,215,100,.1)', border: 'rgba(0,215,100,.2)' },
  importante: { label: 'Importante', color: '#ffb347', bg: 'rgba(255,179,71,.1)', border: 'rgba(255,179,71,.2)' },
  opcional: { label: 'Opcional', color: '#7b7fff', bg: 'rgba(123,127,255,.1)', border: 'rgba(123,127,255,.2)' },
};

export default function SubscriptionsCard({ txs, fmtV }) {
  const [expanded, setExpanded] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const data = useMemo(() => detectSubscriptions(txs), [txs, refreshKey]);

  const handleToggleCancel = (key) => {
    toggleCancelFlag(key);
    setRefreshKey(k => k + 1);
  };

  if (data.subscriptions.length === 0) return null;

  return (
    <div className="card">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div className="card-title" style={{ marginBottom: 0 }}>🔄 Despesas Recorrentes</div>
        <span style={{ fontSize: 11, color: 'var(--t3)' }}>{data.count} ativas</span>
      </div>

      {/* Resumo com breakdown por prioridade */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
        <div style={{ background: 'var(--card-hover)', borderRadius: 12, padding: '14px 16px', textAlign: 'center' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 4 }}>Total / Mês</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--red-soft)' }}>{fmtV(data.totalMensal)}</div>
        </div>
        <div style={{ background: 'var(--card-hover)', borderRadius: 12, padding: '14px 16px', textAlign: 'center' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 4 }}>Total / Ano</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#fff' }}>{fmtV(data.totalAnual)}</div>
        </div>
      </div>

      {/* Breakdown por prioridade */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {Object.entries(PRIORITY_CFG).map(([key, cfg]) => {
          const val = data.byPriority[key] || 0;
          if (val === 0) return null;
          return (
            <div key={key} style={{
              flex: 1, padding: '8px 10px', borderRadius: 10,
              background: cfg.bg, border: `1px solid ${cfg.border}`, textAlign: 'center'
            }}>
              <div style={{ fontSize: 9, fontWeight: 800, color: cfg.color, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 2 }}>{cfg.label}</div>
              <div style={{ fontSize: 14, fontWeight: 800, color: cfg.color }}>{fmtV(val)}</div>
            </div>
          );
        })}
      </div>

      {/* Poupança potencial se cancelar marcadas */}
      {data.savingIfCancel > 0 && (
        <div style={{
          padding: '10px 14px', borderRadius: 10, marginBottom: 14,
          background: 'rgba(0,215,100,.06)', border: '1px solid rgba(0,215,100,.12)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center'
        }}>
          <div style={{ fontSize: 12, color: '#00D764', fontWeight: 600 }}>
            💰 Poupança se cancelares as marcadas
          </div>
          <div style={{ fontSize: 14, fontWeight: 800, color: '#00D764' }}>
            {fmtV(data.savingIfCancel)}/mês · {fmtV(Math.round(data.savingIfCancel * 12 * 100) / 100)}/ano
          </div>
        </div>
      )}

      {/* Lista de subscrições ativas */}
      {data.activeSubs.slice(0, expanded ? undefined : 5).map((sub, i) => {
        const pCfg = PRIORITY_CFG[sub.priority] || PRIORITY_CFG.opcional;
        return (
          <div key={sub.key} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '12px 0',
            borderBottom: i < (expanded ? data.activeSubs.length : Math.min(5, data.activeSubs.length)) - 1 ? '1px solid var(--border)' : 'none',
            opacity: sub.markedCancel ? 0.5 : 1,
            textDecoration: sub.markedCancel ? 'line-through' : 'none'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
              <span style={{ fontSize: 20 }}>{sub.emoji}</span>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--t1)', textDecoration: sub.markedCancel ? 'line-through' : 'none' }}>{sub.nome}</span>
                  <span style={{
                    fontSize: 8, fontWeight: 800, padding: '2px 6px', borderRadius: 4,
                    background: pCfg.bg, color: pCfg.color, border: `1px solid ${pCfg.border}`,
                    textTransform: 'uppercase', letterSpacing: '.06em'
                  }}>{pCfg.label}</span>
                  {sub.markedCancel && (
                    <span style={{ fontSize: 8, fontWeight: 800, padding: '2px 6px', borderRadius: 4, background: 'rgba(255,107,107,.1)', color: '#ff6b6b', border: '1px solid rgba(255,107,107,.2)' }}>A CANCELAR</span>
                  )}
                </div>
                <div style={{ fontSize: 11, color: 'var(--t3)', display: 'flex', gap: 6, alignItems: 'center', marginTop: 2 }}>
                  <span>{sub.cat}</span>
                  <span>·</span>
                  <span>{sub.months} meses</span>
                  {sub.priceChange && (
                    <>
                      <span>·</span>
                      <span style={{ color: sub.priceChange.pct > 0 ? '#ff6b6b' : '#00D764', fontWeight: 700 }}>
                        {sub.priceChange.pct > 0 ? '↑' : '↓'} {Math.abs(sub.priceChange.pct)}% ({sub.priceChange.pct > 0 ? '+' : ''}{fmtV(sub.priceChange.diff)})
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--red-soft)' }}>{fmtV(sub.lastVal)}</div>
                <div style={{ fontSize: 10, color: 'var(--t3)' }}>/ mês</div>
              </div>
              <button onClick={() => handleToggleCancel(sub.key)} title={sub.markedCancel ? 'Desmarcar' : 'Marcar para cancelar'} style={{
                width: 28, height: 28, borderRadius: 8, border: 'none', cursor: 'pointer',
                background: sub.markedCancel ? 'rgba(0,215,100,.15)' : 'rgba(255,107,107,.1)',
                color: sub.markedCancel ? '#00D764' : '#ff6b6b',
                fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                {sub.markedCancel ? '↩' : '✕'}
              </button>
            </div>
          </div>
        );
      })}

      {/* Inativas (se expandido) */}
      {expanded && data.subscriptions.filter(s => !s.isActive).length > 0 && (
        <>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--t3)', marginTop: 14, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '.06em' }}>
            Inativas / Antigas
          </div>
          {data.subscriptions.filter(s => !s.isActive).map((sub) => (
            <div key={sub.key} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '8px 0', opacity: .5, borderBottom: '1px solid var(--border)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 18, filter: 'grayscale(1)' }}>{sub.emoji}</span>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--t3)' }}>{sub.nome}</div>
                  <div style={{ fontSize: 10, color: 'var(--t3)' }}>Última: {sub.lastDate}</div>
                </div>
              </div>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--t3)' }}>{fmtV(sub.lastVal)}</div>
            </div>
          ))}
        </>
      )}

      {/* Toggle */}
      {(data.activeSubs.length > 5 || data.subscriptions.some(s => !s.isActive)) && (
        <button onClick={() => setExpanded(!expanded)} style={{
          background: 'none', border: 'none', color: 'var(--accent)',
          fontSize: 12, fontWeight: 700, cursor: 'pointer',
          fontFamily: 'var(--font)', padding: 0, marginTop: 10
        }}>
          {expanded ? '▲ Mostrar menos' : '▼ Ver todas'}
        </button>
      )}

      {/* Insight */}
      <div style={{
        marginTop: 14, padding: '12px 14px',
        background: 'rgba(255,107,107,.08)', borderRadius: 10, border: '1px solid rgba(255,107,107,.15)'
      }}>
        <div style={{ fontSize: 12, color: 'var(--red-soft)', fontWeight: 700, marginBottom: 4 }}>💡 Análise</div>
        <div style={{ fontSize: 12, color: 'var(--t2)', lineHeight: 1.5 }}>
          {data.byPriority.opcional > 0 && <>Gastas <strong style={{ color: '#7b7fff' }}>{fmtV(data.byPriority.opcional)}/mês</strong> em subscrições opcionais ({fmtV(Math.round(data.byPriority.opcional * 12 * 100) / 100)}/ano). </>}
          {data.activeSubs.some(s => s.priceChange && s.priceChange.pct > 0) && <><strong style={{ color: '#ff6b6b' }}>Detetámos aumentos de preço</strong> — revê as subscrições sinalizadas. </>}
          {data.byPriority.opcional === 0 && 'Bom controlo de subscrições! Sem gastos opcionais detetados.'}
          {data.cancelable.length > 0 && <> Tens <strong style={{ color: '#00D764' }}>{data.cancelable.length}</strong> marcada(s) para cancelar.</>}
        </div>
      </div>
    </div>
  );
}
