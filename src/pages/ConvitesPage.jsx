import React, { useState } from 'react';
import useIsMobile from '../hooks/useIsMobile';
import { getRewardsInfo, getReferralLink, getShareText, BADGES_META } from '../utils/referral';

export default function ConvitesPage({ referralData, onSendInvite }) {
  const isMobile = useIsMobile();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  if (!referralData) return (
    <div id="page-convites" className="page active" style={{ paddingTop: '1rem' }}>
      <div style={{ textAlign: 'center', padding: '4rem 2rem', color: '#6e7491' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🎁</div>
        <div style={{ fontSize: 18, fontWeight: 800, color: '#fff', marginBottom: 8 }}>Programa de Convites</div>
        <div style={{ fontSize: 14 }}>A carregar dados do programa...</div>
      </div>
    </div>
  );

  const { code, invitesSent, invitesAccepted, rewardsClaimed = 0, badges = [] } = referralData;
  const { unlocked, next, all } = getRewardsInfo(invitesAccepted);
  const fmtDate = (iso) => {
    if (!iso) return '';
    try { return new Date(iso).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric' }); } catch { return ''; }
  };
  const link = getReferralLink(code);
  const progressToNext = next ? Math.round((invitesAccepted / next.invites) * 100) : 100;

  const handleSend = () => {
    if (!email.includes('@')) return;
    onSendInvite(email);
    setSent(true);
    setEmail('');
    setTimeout(() => setSent(false), 3000);
  };

  const shareWhatsApp = () => {
    const text = encodeURIComponent(getShareText(code));
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const copyLink = () => {
    navigator.clipboard.writeText(link).catch(() => {});
  };

  return (
    <div id="page-convites" className="page active" style={{ paddingTop: '1rem' }}>
      {/* Page header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 24, fontWeight: 900, color: '#fff', marginBottom: 6 }}>
          🎁 Convites
        </div>
        <div style={{ fontSize: 14, color: '#6e7491' }}>
          Convida amigos para o Flowstate e desbloqueia recompensas exclusivas
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: isMobile ? 8 : 14, marginBottom: 24 }}>
        {[
          { label: 'Convites enviados', val: invitesSent, icon: '📨', accent: '#7b7fff' },
          { label: 'Amigos ativados', val: invitesAccepted, icon: '👥', accent: '#00D764' },
          { label: 'Recompensas ganhas', val: unlocked.length, icon: '🏆', accent: '#f7931a' },
        ].map((s, i) => (
          <div key={i} style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,.04) 0%, rgba(255,255,255,.02) 100%)',
            borderRadius: 18, padding: isMobile ? '14px 12px' : '20px 22px',
            border: '1px solid rgba(255,255,255,.06)'
          }}>
            <div style={{ fontSize: isMobile ? 11 : 13, color: '#4a5072', marginBottom: 8, fontWeight: 600 }}>
              {isMobile ? s.icon : `${s.icon} ${s.label}`}
              {isMobile && <span style={{ display: 'block', marginTop: 2 }}>{s.label}</span>}
            </div>
            <div style={{ fontSize: isMobile ? 24 : 32, fontWeight: 900, color: s.accent }}>{s.val}</div>
          </div>
        ))}
      </div>

      {/* Badges ganhas */}
      {badges.length > 0 && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(247,147,26,.07) 0%, rgba(0,215,100,.05) 100%)',
          borderRadius: 20, padding: isMobile ? '16px 14px' : '22px 26px',
          border: '1px solid rgba(247,147,26,.15)', marginBottom: 24,
          minWidth: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: '#fff' }}>✨ Badges conquistadas</div>
            <div style={{ fontSize: 12, color: '#6e7491' }}>{badges.length} de {Object.keys(BADGES_META).length}</div>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
            {badges.map((b, i) => {
              const meta = BADGES_META[b.slug] || { label: b.slug, icon: '🏅', color: '#7b7fff', desc: '' };
              return (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 16px', borderRadius: 14,
                  background: `${meta.color}14`,
                  border: `1px solid ${meta.color}33`,
                }}>
                  <div style={{
                    width: 42, height: 42, borderRadius: 12, flexShrink: 0,
                    background: `${meta.color}22`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 22
                  }}>{meta.icon}</div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: meta.color }}>{meta.label}</div>
                    <div style={{ fontSize: 11, color: '#b8bfda', marginTop: 2 }}>
                      {meta.desc}{b.earnedAt ? ` · ${fmtDate(b.earnedAt)}` : ''}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Two columns: Invite + Code */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'minmax(0, 1fr)' : 'minmax(0, 1fr) minmax(0, 1fr)', gap: 18, marginBottom: 24 }}>
        {/* Invite by email */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(123,127,255,.06) 0%, rgba(99,102,241,.04) 100%)',
          borderRadius: 20, padding: isMobile ? '18px 16px' : '24px 26px',
          border: '1px solid rgba(123,127,255,.12)',
          minWidth: 0,
        }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: '#fff', marginBottom: 14 }}>
            Enviar convite por email
          </div>
          <div style={{ display: 'flex', gap: 10, marginBottom: 18, minWidth: 0 }}>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              placeholder="email@exemplo.com"
              style={{
                flex: 1, minWidth: 0, padding: '13px 16px', borderRadius: 12,
                background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)',
                color: '#fff', fontSize: 14, fontFamily: 'Inter,sans-serif', outline: 'none'
              }}
            />
            <button onClick={handleSend} style={{
              background: sent ? 'rgba(0,215,100,.2)' : 'linear-gradient(135deg, #7b7fff 0%, #6366f1 100%)',
              border: 'none', borderRadius: 12, padding: '13px 24px',
              color: sent ? '#00D764' : '#fff', fontSize: 14, fontWeight: 800,
              cursor: 'pointer', fontFamily: 'Inter,sans-serif',
              transition: 'all .3s', whiteSpace: 'nowrap'
            }}>
              {sent ? '✓ Enviado!' : 'Enviar'}
            </button>
          </div>

          {/* Share buttons */}
          <div style={{ fontSize: 12, fontWeight: 700, color: '#4a5072', marginBottom: 10 }}>Ou partilha diretamente</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr) minmax(0,1fr)', gap: 10 }}>
            <button onClick={shareWhatsApp} style={{
              padding: '14px 10px', borderRadius: 14, border: '1px solid rgba(37,211,102,.2)',
              background: 'rgba(37,211,102,.08)', cursor: 'pointer', textAlign: 'center'
            }}>
              <div style={{ fontSize: 20, marginBottom: 4 }}>💬</div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#25d366' }}>WhatsApp</div>
            </button>
            <button onClick={copyLink} style={{
              padding: '14px 10px', borderRadius: 14, border: '1px solid rgba(123,127,255,.2)',
              background: 'rgba(123,127,255,.08)', cursor: 'pointer', textAlign: 'center'
            }}>
              <div style={{ fontSize: 20, marginBottom: 4 }}>🔗</div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#7b7fff' }}>Copiar link</div>
            </button>
            <button onClick={() => {
              const text = getShareText(code);
              if (navigator.share) navigator.share({ title: 'Flowstate', text }).catch(() => {});
              else navigator.clipboard.writeText(text).catch(() => {});
            }} style={{
              padding: '14px 10px', borderRadius: 14, border: '1px solid rgba(0,215,100,.2)',
              background: 'rgba(0,215,100,.08)', cursor: 'pointer', textAlign: 'center'
            }}>
              <div style={{ fontSize: 20, marginBottom: 4 }}>📤</div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#00D764' }}>Partilhar</div>
            </button>
          </div>
        </div>

        {/* Referral code + progress */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(0,215,100,.05) 0%, rgba(123,127,255,.04) 100%)',
          borderRadius: 20, padding: isMobile ? '18px 16px' : '24px 26px',
          border: '1px solid rgba(0,215,100,.1)',
          display: 'flex', flexDirection: 'column',
          minWidth: 0,
        }}>
          {/* Code display */}
          <div style={{
            background: 'rgba(255,255,255,.04)', borderRadius: 16, padding: '20px',
            border: '1px solid rgba(255,255,255,.06)', textAlign: 'center', marginBottom: 18
          }}>
            <div style={{ fontSize: 11, color: '#4a5072', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.12em', marginBottom: 8 }}>
              O teu código de convite
            </div>
            <div style={{ fontSize: 32, fontWeight: 900, color: '#7b7fff', letterSpacing: '.08em' }}>{code}</div>
          </div>

          {/* Next reward progress */}
          {next ? (
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#b8bfda' }}>Próxima recompensa</div>
                <div style={{ fontSize: 12, color: '#6e7491' }}>{invitesAccepted}/{next.invites} convites</div>
              </div>
              <div style={{ height: 10, background: 'rgba(255,255,255,.08)', borderRadius: 5, overflow: 'hidden', marginBottom: 12 }}>
                <div style={{
                  height: '100%', borderRadius: 5, width: Math.min(100, progressToNext) + '%',
                  background: 'linear-gradient(90deg, #7b7fff 0%, #00D764 100%)',
                  transition: 'width .6s ease'
                }} />
              </div>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>{next.reward}</div>
              <div style={{ fontSize: 12, color: '#4a5072', marginTop: 4 }}>
                Falta{next.invites - invitesAccepted > 1 ? 'm' : ''} {next.invites - invitesAccepted} convite{next.invites - invitesAccepted !== 1 ? 's' : ''} aceite{next.invites - invitesAccepted !== 1 ? 's' : ''}
              </div>
            </div>
          ) : (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
              <div>
                <div style={{ fontSize: 36, marginBottom: 8 }}>🎉</div>
                <div style={{ fontSize: 15, fontWeight: 800, color: '#00D764' }}>Todas as recompensas desbloqueadas!</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Rewards roadmap — full width */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(255,255,255,.03) 0%, rgba(255,255,255,.01) 100%)',
        borderRadius: 20, padding: isMobile ? '18px 16px' : '26px 28px',
        border: '1px solid rgba(255,255,255,.06)', marginBottom: 24,
        minWidth: 0,
      }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: '#fff', marginBottom: 18 }}>
          🗺️ Mapa de recompensas
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {all.map((r, i) => {
            const isUnlocked = invitesAccepted >= r.invites;
            return (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 16,
                padding: '16px 20px', borderRadius: 16,
                background: isUnlocked ? 'rgba(0,215,100,.06)' : 'rgba(255,255,255,.02)',
                border: '1px solid ' + (isUnlocked ? 'rgba(0,215,100,.15)' : 'rgba(255,255,255,.04)'),
                opacity: isUnlocked ? 1 : 0.55,
                transition: 'all .3s'
              }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                  background: isUnlocked ? 'rgba(0,215,100,.15)' : 'rgba(255,255,255,.06)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 18, fontWeight: 900, color: isUnlocked ? '#00D764' : '#4a5072'
                }}>
                  {isUnlocked ? '✓' : r.invites}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: isUnlocked ? '#fff' : '#6e7491' }}>
                    {r.reward}
                  </div>
                  <div style={{ fontSize: 12, color: '#4a5072', marginTop: 2 }}>
                    {r.desc || (r.invites + (r.invites === 1 ? ' convite aceite' : ' convites aceites'))}
                  </div>
                </div>
                {isUnlocked && (
                  <span style={{
                    fontSize: 11, color: '#00D764', fontWeight: 800,
                    background: 'rgba(0,215,100,.1)', padding: '4px 12px', borderRadius: 8
                  }}>Desbloqueado</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* How it works */}
      <div style={{
        background: 'rgba(255,255,255,.03)', borderRadius: 18, padding: isMobile ? '16px 14px' : '22px 26px',
        border: '1px solid rgba(255,255,255,.05)',
        minWidth: 0,
      }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: '#fff', marginBottom: 12 }}>Como funciona?</div>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr', gap: isMobile ? 10 : 16 }}>
          {[
            { step: '1', title: 'Convida', desc: 'Partilha o teu código ou envia um email ao teu amigo', icon: '📨' },
            { step: '2', title: 'Amigo ativa', desc: 'Registo + onboarding + 3 transações = ativação completa', icon: '✅' },
            { step: '3', title: 'Ganha', desc: 'Recompensas desbloqueadas automaticamente na tua conta', icon: '🎁' },
          ].map((s, i) => (
            <div key={i} style={{ textAlign: 'center', padding: '16px 12px' }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>{s.icon}</div>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#fff', marginBottom: 4 }}>{s.title}</div>
              <div style={{ fontSize: 12, color: '#6e7491', lineHeight: 1.5 }}>{s.desc}</div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 12, padding: '10px 14px', borderRadius: 10, background: 'rgba(247,147,26,.06)', border: '1px solid rgba(247,147,26,.1)', fontSize: 12, color: '#f7931a' }}>
          ⚡ Limite de 10 convites por mês para garantir qualidade do programa
        </div>
      </div>
    </div>
  );
}
