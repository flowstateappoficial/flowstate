import React, { useState } from 'react';
import { getRewardsInfo, getReferralLink, getShareText } from '../utils/referral';
import useIsMobile from '../hooks/useIsMobile';

export default function ReferralInviteModal({ referralData, onSendInvite, onClose }) {
  const isMobile = useIsMobile();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const { all } = getRewardsInfo(referralData?.invitesAccepted || 0);
  const link = getReferralLink(referralData?.code || '');

  const handleSend = async () => {
    if (!email.includes('@')) return;
    try { await onSendInvite(email); } catch {}
    setSent(true);
    setEmail('');
    setTimeout(() => setSent(false), 3000);
  };

  const shareWhatsApp = () => {
    const text = encodeURIComponent(getShareText(referralData?.code || ''));
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const copyLink = () => {
    navigator.clipboard.writeText(link).catch(() => {});
  };

  return (
    <>
      <div onClick={onClose} style={{
        position: 'fixed', inset: 0, background: 'rgba(10,13,24,.88)', zIndex: 8000
      }} />
      <div style={{
        position: 'fixed',
        top: isMobile ? 'auto' : '50%',
        bottom: isMobile ? 0 : 'auto',
        left: isMobile ? 0 : '50%',
        right: isMobile ? 0 : 'auto',
        transform: isMobile ? 'none' : 'translate(-50%,-50%)',
        zIndex: 8001,
        width: isMobile ? 'auto' : 500,
        maxHeight: isMobile ? '92vh' : '90vh',
        overflowY: 'auto',
        background: 'linear-gradient(180deg, #1a1f35 0%, #161a2e 100%)',
        borderRadius: isMobile ? '20px 20px 0 0' : 24,
        border: '1px solid rgba(255,255,255,.08)',
        boxShadow: '0 32px 80px rgba(0,0,0,.6)',
        padding: isMobile ? '20px 18px 32px' : '32px',
        animation: 'inviteSlideIn .25s ease'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#fff' }}>Convidar amigos</div>
            <div style={{ fontSize: 13, color: '#6e7491', marginTop: 4 }}>Partilha o Flowstate e ganha recompensas</div>
          </div>
          <button onClick={onClose} style={{
            background: 'rgba(255,255,255,.06)', border: 'none', borderRadius: 10,
            width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#6e7491', fontSize: 16, cursor: 'pointer'
          }}>✕</button>
        </div>

        {/* Invite by email */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: '#4a5072', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 10 }}>
            Enviar convite por email
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              placeholder="email@exemplo.com"
              style={{
                flex: 1, padding: '12px 16px', borderRadius: 12,
                background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)',
                color: '#fff', fontSize: 14, fontFamily: 'Inter,sans-serif',
                outline: 'none'
              }}
            />
            <button onClick={handleSend} style={{
              background: sent ? 'rgba(0,215,100,.2)' : 'linear-gradient(135deg, #7b7fff 0%, #6366f1 100%)',
              border: 'none', borderRadius: 12, padding: '12px 24px',
              color: sent ? '#00D764' : '#fff', fontSize: 14, fontWeight: 800,
              cursor: 'pointer', fontFamily: 'Inter,sans-serif',
              transition: 'all .3s', whiteSpace: 'nowrap'
            }}>
              {sent ? '✓ Enviado!' : 'Enviar'}
            </button>
          </div>
        </div>

        {/* Share options */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: '#4a5072', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 10 }}>
            Ou partilha diretamente
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
            <button onClick={shareWhatsApp} style={{
              padding: '14px', borderRadius: 14, border: '1px solid rgba(37,211,102,.2)',
              background: 'rgba(37,211,102,.08)', cursor: 'pointer', textAlign: 'center'
            }}>
              <div style={{ fontSize: 24, marginBottom: 4 }}>💬</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#25d366' }}>WhatsApp</div>
            </button>
            <button onClick={copyLink} style={{
              padding: '14px', borderRadius: 14, border: '1px solid rgba(123,127,255,.2)',
              background: 'rgba(123,127,255,.08)', cursor: 'pointer', textAlign: 'center'
            }}>
              <div style={{ fontSize: 24, marginBottom: 4 }}>🔗</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#7b7fff' }}>Copiar link</div>
            </button>
            <button onClick={() => {
              const text = getShareText(referralData?.code || '');
              if (navigator.share) navigator.share({ title: 'Flowstate', text }).catch(() => {});
              else navigator.clipboard.writeText(text).catch(() => {});
            }} style={{
              padding: '14px', borderRadius: 14, border: '1px solid rgba(0,215,100,.2)',
              background: 'rgba(0,215,100,.08)', cursor: 'pointer', textAlign: 'center'
            }}>
              <div style={{ fontSize: 24, marginBottom: 4 }}>📤</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#00D764' }}>Partilhar</div>
            </button>
          </div>
        </div>

        {/* Referral code display */}
        <div style={{
          background: 'rgba(255,255,255,.04)', borderRadius: 14, padding: '16px 20px',
          border: '1px solid rgba(255,255,255,.06)', marginBottom: 24, textAlign: 'center'
        }}>
          <div style={{ fontSize: 11, color: '#4a5072', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 6 }}>O teu código de convite</div>
          <div style={{ fontSize: 28, fontWeight: 900, color: '#7b7fff', letterSpacing: '.08em' }}>{referralData?.code}</div>
        </div>

        {/* Rewards roadmap */}
        <div>
          <div style={{ fontSize: 11, fontWeight: 800, color: '#4a5072', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 12 }}>
            Mapa de recompensas
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {all.map((r, i) => {
              const isUnlocked = (referralData?.invitesAccepted || 0) >= r.invites;
              return (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: '12px 16px', borderRadius: 12,
                  background: isUnlocked ? 'rgba(0,215,100,.06)' : 'rgba(255,255,255,.02)',
                  border: '1px solid ' + (isUnlocked ? 'rgba(0,215,100,.15)' : 'rgba(255,255,255,.04)'),
                  opacity: isUnlocked ? 1 : 0.6
                }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                    background: isUnlocked ? 'rgba(0,215,100,.15)' : 'rgba(255,255,255,.06)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 16, color: isUnlocked ? '#00D764' : '#4a5072'
                  }}>
                    {isUnlocked ? '✓' : r.invites}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: isUnlocked ? '#fff' : '#6e7491' }}>
                      {r.reward}
                    </div>
                    <div style={{ fontSize: 11, color: '#4a5072' }}>
                      {r.desc || (r.invites + (r.invites === 1 ? ' convite aceite' : ' convites aceites'))}
                    </div>
                  </div>
                  {isUnlocked && <span style={{ fontSize: 11, color: '#00D764', fontWeight: 800 }}>Desbloqueado</span>}
                </div>
              );
            })}
          </div>
        </div>

        {/* Activation info */}
        <div style={{
          marginTop: 16, padding: '14px 18px', borderRadius: 12,
          background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.05)'
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#4a5072', marginBottom: 6 }}>Como funciona a ativação?</div>
          <div style={{ fontSize: 12, color: '#6e7491', lineHeight: 1.6 }}>
            O convite conta quando o teu amigo: se regista no Flowstate, completa o onboarding e regista pelo menos 3 transações. Limite de 10 convites por mês.
          </div>
        </div>
      </div>
      <style>{`@keyframes inviteSlideIn{from{opacity:0;transform:translate(-50%,-50%) scale(.95)}to{opacity:1;transform:translate(-50%,-50%) scale(1)}}`}</style>
    </>
  );
}
