import React from 'react';
import { getTrialStatus, getChargeDate, ackPostTrial } from '../utils/trial';
import { PRICES } from '../utils/constants';

const fmtPrice = v => v.toFixed(2).replace('.', ',') + ' €';

// Renders either:
//  (a) thin strip at top during an active trial (messaging depends on autoRenew)
//  (b) persistent post-trial banner (only when trial expired without auto-conversion)
// Returns null if nothing to show.
export default function TrialBanner({ onUpgrade, onCancel, onReactivate }) {
  const status = getTrialStatus();

  if (!status.hasTrial) return null;

  // If it was auto-converted, no banner.
  if (status.converted) return null;

  // POST-TRIAL persistent banner (only reachable when cancelled before end AND expired)
  if (status.expired) {
    if (status.postTrialAck) return null;
    return (
      <div style={{
        background: 'linear-gradient(90deg, rgba(229,57,53,.12), rgba(247,147,26,.10))',
        borderBottom: '1px solid rgba(229,57,53,.25)',
        padding: '10px 16px',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14,
        fontSize: 13, color: '#fff', flexWrap: 'wrap'
      }}>
        <span>O teu trial <strong>Flow Plus</strong> terminou. Reativa para voltares a ter acesso completo.</span>
        <button onClick={onUpgrade} style={{
          background: '#00D764', color: '#000', border: 'none', borderRadius: 8,
          padding: '6px 14px', fontSize: 12, fontWeight: 800, cursor: 'pointer',
          fontFamily: 'var(--font)'
        }}>Ver planos</button>
        <button onClick={() => { ackPostTrial(); window.dispatchEvent(new CustomEvent('fs-trial-change')); }} style={{
          background: 'transparent', color: 'rgba(255,255,255,.5)', border: 'none',
          fontSize: 18, cursor: 'pointer', padding: 0, lineHeight: 1
        }} title="Dispensar">✕</button>
      </div>
    );
  }

  if (!status.active) return null;

  // ACTIVE trial
  const { daysLeft, autoRenew, billing } = status;
  const price = billing === 'anual' ? PRICES.plus.anual * 12 : PRICES.plus.mensal;
  const priceLabel = billing === 'anual' ? `${fmtPrice(price)}/ano` : `${fmtPrice(price)}/mês`;
  const chargeDate = getChargeDate();
  const dateStr = chargeDate
    ? chargeDate.toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' })
    : '';

  const urgent = daysLeft <= 2;
  const halfway = daysLeft <= 4 && daysLeft > 2;

  const bg = urgent
    ? 'linear-gradient(90deg, rgba(229,57,53,.18), rgba(247,147,26,.15))'
    : halfway
      ? 'linear-gradient(90deg, rgba(247,147,26,.15), rgba(0,215,100,.10))'
      : 'linear-gradient(90deg, rgba(0,215,100,.14), rgba(0,180,216,.10))';
  const border = urgent ? 'rgba(229,57,53,.3)' : halfway ? 'rgba(247,147,26,.3)' : 'rgba(0,215,100,.3)';
  const accent = urgent ? '#e53935' : halfway ? '#f7931a' : '#00D764';

  let msg;
  if (autoRenew) {
    if (daysLeft <= 1) msg = <>Hoje termina o trial — serás cobrado <strong>{priceLabel}</strong>. Cancela para não seres debitado.</>;
    else msg = <>Faltam <strong>{daysLeft} dias</strong>. A {dateStr} passas a pagar <strong>{priceLabel}</strong>, a menos que canceles.</>;
  } else {
    // Cancelled — access until end, no charge
    msg = <>Trial cancelado. Mantém acesso a Flow Plus até <strong>{dateStr}</strong> — não será cobrado nada.</>;
  }

  return (
    <div style={{
      background: bg,
      borderBottom: `1px solid ${border}`,
      padding: '8px 16px',
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
      fontSize: 12.5, color: '#fff', fontWeight: 500,
      flexWrap: 'wrap'
    }}>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
        <span style={{ width: 7, height: 7, borderRadius: '50%', background: accent, boxShadow: `0 0 8px ${accent}` }} />
        {msg}
      </span>
      {autoRenew ? (
        <>
          <button onClick={onUpgrade} style={{
            background: accent, color: '#000', border: 'none', borderRadius: 8,
            padding: '5px 12px', fontSize: 11, fontWeight: 800, cursor: 'pointer',
            fontFamily: 'var(--font)', letterSpacing: '.02em'
          }}>{urgent ? 'Ver plano' : 'Gerir subscrição'}</button>
          <button onClick={onCancel} style={{
            background: 'transparent', color: 'rgba(255,255,255,.7)', border: '1px solid rgba(255,255,255,.15)',
            borderRadius: 8, padding: '5px 12px', fontSize: 11, fontWeight: 700, cursor: 'pointer',
            fontFamily: 'var(--font)'
          }}>Cancelar</button>
        </>
      ) : (
        <button onClick={onReactivate} style={{
          background: accent, color: '#000', border: 'none', borderRadius: 8,
          padding: '5px 12px', fontSize: 11, fontWeight: 800, cursor: 'pointer',
          fontFamily: 'var(--font)', letterSpacing: '.02em'
        }}>Reativar subscrição</button>
      )}
    </div>
  );
}
