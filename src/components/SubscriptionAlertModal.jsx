import React, { useState } from 'react';
import useIsMobile from '../hooks/useIsMobile';

/**
 * Pop-up "AVISO" — só aparece quando há trials a terminar (≤3 dias) ou subs em atraso (≥3 dias).
 * Mostra-se uma vez por sessão. "Lembra amanhã" dismissa pelo resto do dia.
 *
 * Props:
 *  urgent: { trials: [{sub, daysLeft}], lateSubs: [{sub, periodKey, daysLate}] }
 *  onMarkPaid: async (subId, amountOverride) => void
 *  onSnooze: () => void
 *  onClose: () => void
 *  onOpenSub: (sub) => void  (abre modal de edit no contexto)
 *  fmtV: (val) => string
 */
export default function SubscriptionAlertModal({ urgent, onMarkPaid, onSnooze, onClose, onOpenSub, fmtV }) {
  const isMobile = useIsMobile();
  const [busy, setBusy] = useState(null); // sub.id em curso de marcação
  const [variableInputs, setVariableInputs] = useState({}); // {subId: value}

  const totalItems = (urgent?.trials?.length || 0) + (urgent?.lateSubs?.length || 0);
  if (totalItems === 0) return null;

  const handleMarkPaid = async (sub, amountOverride = null) => {
    setBusy(sub.id);
    try {
      await onMarkPaid(sub.id, amountOverride);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="overlay open" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal" style={{ maxWidth: 520, padding: 0, overflow: 'hidden' }}>
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(247,147,26,.15), rgba(229,57,53,.10))',
          padding: isMobile ? '18px 20px' : '22px 26px',
          borderBottom: '1px solid rgba(255,255,255,.06)'
        }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '4px 10px',
            background: 'rgba(247,147,26,.2)',
            border: '1px solid rgba(247,147,26,.4)',
            borderRadius: 999,
            fontSize: 10,
            fontWeight: 800,
            color: '#f7931a',
            letterSpacing: '.14em',
            textTransform: 'uppercase',
            marginBottom: 10
          }}>⚠ Aviso</div>
          <div style={{
            fontSize: isMobile ? 18 : 20,
            fontWeight: 800,
            color: 'var(--t1)',
            letterSpacing: '-.02em',
            lineHeight: 1.25
          }}>
            {totalItems === 1
              ? 'Tens 1 subscrição que precisa da tua atenção'
              : `Tens ${totalItems} subscrições que precisam da tua atenção`}
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: isMobile ? '16px 18px' : '20px 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* Trials */}
          {(urgent.trials || []).map(({ sub, daysLeft }) => (
            <div key={`t-${sub.id}`} style={{
              padding: isMobile ? '12px 14px' : '14px 16px',
              background: 'rgba(247,147,26,.08)',
              border: '1px solid rgba(247,147,26,.25)',
              borderRadius: 12,
              display: 'flex',
              alignItems: 'flex-start',
              gap: 12
            }}>
              <div style={{ fontSize: 22, flexShrink: 0 }}>{sub.emoji}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--t1)', marginBottom: 4 }}>
                  Trial {sub.name} termina {daysLeft === 0 ? 'hoje' : daysLeft === 1 ? 'amanhã' : `em ${daysLeft} dias`}
                </div>
                <div style={{ fontSize: 12.5, color: 'var(--t3)', marginBottom: 10, lineHeight: 1.45 }}>
                  Se não cancelares antes, vais ser cobrado {fmtV(sub.defaultAmount || 0)}.
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button onClick={() => onOpenSub(sub)} style={{
                    background: '#f7931a', color: '#000', border: 'none',
                    borderRadius: 8, padding: '7px 14px', fontSize: 12, fontWeight: 800,
                    cursor: 'pointer', fontFamily: 'var(--font)'
                  }}>Gerir trial</button>
                  <button onClick={() => onSnooze()} style={{
                    background: 'transparent', color: 'var(--t3)', border: '1px solid rgba(255,255,255,.12)',
                    borderRadius: 8, padding: '7px 14px', fontSize: 12, fontWeight: 700,
                    cursor: 'pointer', fontFamily: 'var(--font)'
                  }}>Lembra amanhã</button>
                </div>
              </div>
            </div>
          ))}

          {/* Late subs */}
          {(urgent.lateSubs || []).map(({ sub, daysLate }) => {
            const isVar = sub.isVariable;
            const inputVal = variableInputs[sub.id] ?? String(sub.defaultAmount || '');
            return (
              <div key={`l-${sub.id}`} style={{
                padding: isMobile ? '12px 14px' : '14px 16px',
                background: 'rgba(123,127,255,.06)',
                border: '1px solid rgba(123,127,255,.25)',
                borderRadius: 12,
                display: 'flex',
                alignItems: 'flex-start',
                gap: 12
              }}>
                <div style={{ fontSize: 22, flexShrink: 0 }}>{sub.emoji}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--t1)', marginBottom: 4 }}>
                    {sub.name} — {fmtV(sub.defaultAmount || 0)}
                  </div>
                  <div style={{ fontSize: 12.5, color: 'var(--t3)', marginBottom: 10, lineHeight: 1.45 }}>
                    Estava previsto para o dia {sub.dayOfPeriod} (há {daysLate} {daysLate === 1 ? 'dia' : 'dias'}).
                    {' '}Já pagaste?
                  </div>

                  {/* Variable amount input */}
                  {isVar && (
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 8 }}>
                      <span style={{ fontSize: 11, color: 'var(--t3)' }}>Valor real:</span>
                      <input
                        type="number"
                        inputMode="decimal"
                        step="0.01"
                        value={inputVal}
                        onChange={e => setVariableInputs(prev => ({ ...prev, [sub.id]: e.target.value }))}
                        placeholder="0,00"
                        style={{
                          width: 90,
                          padding: '5px 8px',
                          fontSize: 13,
                          background: 'rgba(255,255,255,.06)',
                          border: '1px solid rgba(123,127,255,.4)',
                          borderRadius: 6,
                          color: 'var(--t1)',
                          fontFamily: 'var(--font)',
                          textAlign: 'right'
                        }}
                      />
                      <span style={{ fontSize: 11, color: 'var(--t3)' }}>€</span>
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <button
                      onClick={() => {
                        const amt = isVar ? parseFloat(String(inputVal).replace(',', '.')) : null;
                        if (isVar && (!isFinite(amt) || amt <= 0)) return;
                        handleMarkPaid(sub, amt);
                      }}
                      disabled={busy === sub.id || (isVar && (!inputVal || parseFloat(String(inputVal).replace(',', '.')) <= 0))}
                      style={{
                        background: '#00D764', color: '#000', border: 'none',
                        borderRadius: 8, padding: '7px 14px', fontSize: 12, fontWeight: 800,
                        cursor: busy === sub.id ? 'wait' : 'pointer',
                        fontFamily: 'var(--font)',
                        opacity: busy === sub.id ? 0.6 : 1
                      }}>{busy === sub.id ? 'A marcar…' : '✓ Sim, já paguei'}</button>
                    <button onClick={() => onSnooze()} style={{
                      background: 'transparent', color: 'var(--t3)', border: '1px solid rgba(255,255,255,.12)',
                      borderRadius: 8, padding: '7px 14px', fontSize: 12, fontWeight: 700,
                      cursor: 'pointer', fontFamily: 'var(--font)'
                    }}>Lembra amanhã</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div style={{
          padding: isMobile ? '12px 18px 16px' : '14px 24px 20px',
          borderTop: '1px solid rgba(255,255,255,.06)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 12,
          flexWrap: 'wrap'
        }}>
          <div style={{ fontSize: 11.5, color: 'var(--t3)', flex: 1, minWidth: 200 }}>
            Avisamos sempre que abres a app. Vê tudo no sino 🔔 acima.
          </div>
          <button onClick={onClose} style={{
            background: 'rgba(255,255,255,.06)',
            color: 'var(--t2)',
            border: '1px solid rgba(255,255,255,.1)',
            borderRadius: 8,
            padding: '8px 16px',
            fontSize: 12,
            fontWeight: 700,
            cursor: 'pointer',
            fontFamily: 'var(--font)'
          }}>Fechar</button>
        </div>
      </div>
    </div>
  );
}
