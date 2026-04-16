import React from 'react';
import { getTrialStatus } from '../utils/trial';

export default function PaywallOverlay({ tabName, onClose, onViewPlans, onStartTrial }) {
  const status = getTrialStatus();
  const canStartTrial = !status.hasTrial;
  const trialExpired = status.expired;

  return (
    <div onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(10,13,24,.88)', zIndex: 8000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
      <div style={{ background: '#202638', borderRadius: 24, maxWidth: 420, width: '100%', padding: '2.5rem 2rem', textAlign: 'center', boxShadow: '0 32px 80px rgba(0,0,0,.6)' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>⚡</div>
        <div style={{ fontSize: 20, fontWeight: 800, color: '#fff', marginBottom: '.5rem' }}>Funcionalidade Premium</div>
        <div style={{ fontSize: 13, color: '#6e7491', marginBottom: '1.75rem', lineHeight: 1.7 }}>
          A aba <strong style={{ color: '#fff' }}>{tabName}</strong> está disponível nos planos <strong style={{ color: '#00D764' }}>Flow Plus</strong> e <strong style={{ color: '#7b7fff' }}>Flow Max</strong>.
          {canStartTrial && <><br /><br />Experimenta grátis durante <strong style={{ color: '#00D764' }}>7 dias</strong>, sem cartão de crédito.</>}
          {trialExpired && <><br /><br />O teu trial já terminou. Subscreve para continuares a usar esta funcionalidade.</>}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {canStartTrial && onStartTrial && (
            <button onClick={onStartTrial}
              style={{ width: '100%', padding: 13, borderRadius: 12, background: '#00D764', color: '#000', border: 'none', fontFamily: 'Inter,sans-serif', fontSize: 14, fontWeight: 800, cursor: 'pointer', boxShadow: '0 0 24px rgba(0,215,100,.3)' }}>
              🎁 Experimentar 7 dias grátis
            </button>
          )}
          <button onClick={onViewPlans}
            style={{ width: '100%', padding: 13, borderRadius: 12, background: canStartTrial ? 'rgba(255,255,255,.06)' : '#00D764', color: canStartTrial ? '#fff' : '#000', border: canStartTrial ? '1px solid rgba(255,255,255,.12)' : 'none', fontFamily: 'Inter,sans-serif', fontSize: 14, fontWeight: 800, cursor: 'pointer' }}>
            Ver planos →
          </button>
          <button onClick={onClose}
            style={{ width: '100%', padding: 12, borderRadius: 12, background: 'transparent', color: '#6e7491', border: 'none', fontFamily: 'Inter,sans-serif', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            Ficar no plano Free
          </button>
        </div>
      </div>
    </div>
  );
}
