import React from 'react';
import { getRewardsInfo, getReferralLink, getShareText } from '../utils/referral';

export default function ReferralCard({ referralData, onOpenInvite }) {
  if (!referralData) return null;

  const { code, invitesSent, invitesAccepted } = referralData;
  const { unlocked, next } = getRewardsInfo(invitesAccepted);
  const link = getReferralLink(code);
  const progressToNext = next ? Math.round((invitesAccepted / next.invites) * 100) : 100;

  const copyCode = () => {
    navigator.clipboard.writeText(link).catch(() => {});
  };

  const share = () => {
    const text = getShareText(code);
    if (navigator.share) {
      navigator.share({ title: 'Flowstate', text }).catch(() => {});
    } else {
      navigator.clipboard.writeText(text).catch(() => {});
    }
  };

  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(123,127,255,.08) 0%, rgba(0,215,100,.05) 100%)',
      border: '1px solid rgba(123,127,255,.15)', borderRadius: 20,
      padding: '24px 28px', marginTop: '1.5rem'
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 800, color: '#fff', marginBottom: 4 }}>
            🎁 Convida amigos, ganha recompensas
          </div>
          <div style={{ fontSize: 13, color: '#6e7491' }}>
            Cada amigo que se regista desbloqueia prémios para ti
          </div>
        </div>
        <button onClick={onOpenInvite} style={{
          background: 'linear-gradient(135deg, #7b7fff 0%, #6366f1 100%)',
          border: 'none', borderRadius: 12, padding: '10px 20px',
          color: '#fff', fontSize: 13, fontWeight: 800, cursor: 'pointer',
          fontFamily: 'Inter,sans-serif', boxShadow: '0 0 20px rgba(123,127,255,.25)',
          whiteSpace: 'nowrap'
        }}>
          Convidar →
        </button>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Convites enviados', val: invitesSent, icon: '📨' },
          { label: 'Amigos registados', val: invitesAccepted, icon: '👥' },
          { label: 'Recompensas', val: unlocked.length, icon: '🏆' },
        ].map((s, i) => (
          <div key={i} style={{
            background: 'rgba(255,255,255,.04)', borderRadius: 14, padding: '14px 16px',
            border: '1px solid rgba(255,255,255,.05)'
          }}>
            <div style={{ fontSize: 12, color: '#4a5072', marginBottom: 6 }}>{s.icon} {s.label}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#fff' }}>{s.val}</div>
          </div>
        ))}
      </div>

      {/* Next reward progress */}
      {next && (
        <div style={{
          background: 'rgba(255,255,255,.03)', borderRadius: 14, padding: '16px 18px',
          border: '1px solid rgba(255,255,255,.05)', marginBottom: 16
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#b8bfda' }}>Próxima recompensa</div>
            <div style={{ fontSize: 12, color: '#6e7491' }}>{invitesAccepted}/{next.invites} convites</div>
          </div>
          <div style={{ height: 8, background: 'rgba(255,255,255,.08)', borderRadius: 4, overflow: 'hidden', marginBottom: 10 }}>
            <div style={{
              height: '100%', borderRadius: 4, width: progressToNext + '%',
              background: 'linear-gradient(90deg, #7b7fff 0%, #00D764 100%)',
              transition: 'width .6s ease'
            }} />
          </div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{next.reward}</div>
        </div>
      )}

      {/* Referral code + share */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <div style={{
          flex: 1, background: 'rgba(255,255,255,.06)', borderRadius: 12,
          padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          border: '1px solid rgba(255,255,255,.08)'
        }}>
          <div>
            <div style={{ fontSize: 10, color: '#4a5072', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 3 }}>O teu código</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#7b7fff', letterSpacing: '.05em' }}>{code}</div>
          </div>
          <button onClick={copyCode} style={{
            background: 'rgba(123,127,255,.15)', border: '1px solid rgba(123,127,255,.2)',
            borderRadius: 8, padding: '6px 12px', color: '#7b7fff',
            fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter,sans-serif'
          }}>
            Copiar link
          </button>
        </div>
        <button onClick={share} style={{
          background: 'rgba(0,215,100,.1)', border: '1px solid rgba(0,215,100,.2)',
          borderRadius: 12, padding: '12px 16px', color: '#00D764',
          fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter,sans-serif',
          whiteSpace: 'nowrap'
        }}>
          📤 Partilhar
        </button>
      </div>
    </div>
  );
}
