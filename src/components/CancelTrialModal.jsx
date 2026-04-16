import React from 'react';
import { getTrialStatus, getChargeDate } from '../utils/trial';

export default function CancelTrialModal({ onClose, onConfirm }) {
  const status = getTrialStatus();
  if (!status.active) return null;
  const chargeDate = getChargeDate();
  const dateStr = chargeDate
    ? chargeDate.toLocaleDateString('pt-PT', { day: '2-digit', month: 'long', year: 'numeric' })
    : '';

  return (
    <div onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(10,13,24,.88)', zIndex: 8500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
      <div style={{
        background: 'linear-gradient(180deg, #1a1f35 0%, #161a2e 100%)',
        borderRadius: 24, maxWidth: 440, width: '100%', padding: '2.25rem 2rem',
        textAlign: 'center', boxShadow: '0 32px 80px rgba(0,0,0,.6)',
        border: '1px solid rgba(229,57,53,.2)'
      }}>
        <div style={{ fontSize: '2.25rem', marginBottom: '.75rem' }}>🤔</div>
        <div style={{ fontSize: 20, fontWeight: 800, color: '#fff', marginBottom: '.6rem' }}>
          Cancelar o trial?
        </div>
        <div style={{ fontSize: 13, color: '#9ba3c4', marginBottom: '1.5rem', lineHeight: 1.7 }}>
          Continuas com acesso ao <strong style={{ color: '#00D764' }}>Flow Plus</strong> até {dateStr ? <strong style={{ color: '#fff' }}>{dateStr}</strong> : 'ao fim do trial'}.<br />
          Depois dessa data <strong style={{ color: '#fff' }}>não serás cobrado</strong> e voltas automaticamente ao plano Free.
        </div>

        <div style={{
          background: 'rgba(229,57,53,.08)', border: '1px solid rgba(229,57,53,.2)',
          borderRadius: 12, padding: '14px 16px', marginBottom: '1.5rem', textAlign: 'left'
        }}>
          <div style={{ fontSize: 12, color: '#e53935', fontWeight: 700, marginBottom: 6 }}>O que vais perder:</div>
          <div style={{ fontSize: 12.5, color: '#9ba3c4', lineHeight: 1.75 }}>
            · Aba de Investimentos<br />
            · Calculadora de investimentos<br />
            · Objetivos ilimitados<br />
            · Dicas avançadas
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button onClick={onClose} style={{
            width: '100%', padding: 13, borderRadius: 12,
            background: '#00D764', color: '#000', border: 'none',
            fontFamily: 'Inter,sans-serif', fontSize: 13, fontWeight: 800, cursor: 'pointer'
          }}>
            Manter o trial
          </button>
          <button onClick={onConfirm} style={{
            width: '100%', padding: 12, borderRadius: 12,
            background: 'transparent', color: '#e53935',
            border: '1px solid rgba(229,57,53,.3)',
            fontFamily: 'Inter,sans-serif', fontSize: 12, fontWeight: 700, cursor: 'pointer'
          }}>
            Sim, cancelar mesmo assim
          </button>
        </div>
      </div>
    </div>
  );
}
