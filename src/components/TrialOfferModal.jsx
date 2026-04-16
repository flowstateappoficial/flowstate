import React from 'react';
import { getTrialStatus, dismissOffer } from '../utils/trial';

// Shown once during the last 2 days of an active trial, unless user dismissed it.
export default function TrialOfferModal({ onClose, onUpgrade }) {
  const status = getTrialStatus();
  if (!status.active) return null;
  if (status.daysLeft > 2) return null;
  if (status.dismissedOffer) return null;

  const handleClose = () => {
    dismissOffer();
    window.dispatchEvent(new CustomEvent('fs-trial-change'));
    onClose?.();
  };

  return (
    <div onClick={e => { if (e.target === e.currentTarget) handleClose(); }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(10,13,24,.88)', zIndex: 8500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
      <div style={{
        background: 'linear-gradient(180deg, #1a1f35 0%, #161a2e 100%)',
        borderRadius: 24, maxWidth: 460, width: '100%', padding: '2.5rem 2rem',
        textAlign: 'center', boxShadow: '0 32px 80px rgba(0,0,0,.6)',
        border: '1px solid rgba(0,215,100,.25)'
      }}>
        <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🎁</div>
        <div style={{
          display: 'inline-block', background: 'rgba(229,57,53,.15)', color: '#e53935',
          padding: '4px 12px', borderRadius: 20, fontSize: 10, fontWeight: 800,
          letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 14
        }}>
          {status.daysLeft === 1 ? 'Último dia' : `Faltam ${status.daysLeft} dias`}
        </div>
        <div style={{ fontSize: 22, fontWeight: 800, color: '#fff', marginBottom: '.6rem', lineHeight: 1.25 }}>
          Oferta especial só para ti
        </div>
        <div style={{ fontSize: 13.5, color: '#9ba3c4', marginBottom: '1.5rem', lineHeight: 1.7 }}>
          Em vez dos <strong>3,99 €/mês</strong> normais, fica com o <strong style={{ color: '#00D764' }}>Flow Plus</strong> por <strong style={{ color: '#00D764' }}>3,19 €/mês</strong> — <strong>20% off</strong> no primeiro ano.<br />
          Aplica-se automaticamente quando o trial terminar.
        </div>

        <div style={{
          background: 'rgba(0,215,100,.08)', border: '1px solid rgba(0,215,100,.2)',
          borderRadius: 14, padding: '14px', marginBottom: '1.5rem',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12
        }}>
          <span style={{ color: '#6e7491', textDecoration: 'line-through', fontSize: 14 }}>3,99 € / mês</span>
          <span style={{ color: '#00D764', fontSize: 22, fontWeight: 800 }}>3,19 € / mês</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button onClick={onUpgrade} style={{
            width: '100%', padding: 14, borderRadius: 12,
            background: '#00D764', color: '#000', border: 'none',
            fontFamily: 'Inter,sans-serif', fontSize: 14, fontWeight: 800,
            cursor: 'pointer', boxShadow: '0 0 24px rgba(0,215,100,.3)'
          }}>
            Aproveitar desconto →
          </button>
          <button onClick={handleClose} style={{
            width: '100%', padding: 11, borderRadius: 12,
            background: 'transparent', color: '#6e7491', border: 'none',
            fontFamily: 'Inter,sans-serif', fontSize: 12, fontWeight: 600, cursor: 'pointer'
          }}>
            Decido mais tarde
          </button>
        </div>
      </div>
    </div>
  );
}
