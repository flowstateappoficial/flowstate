import React, { useState } from 'react';
import { openCustomerPortal, readCachedSubscription } from '../utils/subscription';
import { getTrialStatus } from '../utils/trial';
import { getSupabaseClient } from '../utils/supabase';
import useIsMobile from '../hooks/useIsMobile';

const PLAN_CFG = {
  free: { label: 'Free', color: '#6e7491', bg: 'rgba(110,116,145,.12)', border: 'rgba(110,116,145,.25)' },
  plus: { label: 'Flow Plus', color: '#00D764', bg: 'rgba(0,215,100,.12)', border: 'rgba(0,215,100,.3)' },
  max:  { label: 'Flow Max',  color: '#7b7fff', bg: 'rgba(123,127,255,.12)', border: 'rgba(123,127,255,.3)' },
};

const STATUS_CFG = {
  trialing: { label: 'Trial ativo', color: '#00D764' },
  active:   { label: 'Ativo',       color: '#00D764' },
  past_due: { label: 'Pagamento em atraso', color: '#ff6b6b' },
  canceled: { label: 'Cancelado',   color: '#ff6b6b' },
  incomplete: { label: 'Incompleto', color: '#ffb347' },
};

function fmtDate(iso) {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('pt-PT', { day: '2-digit', month: 'long', year: 'numeric' });
  } catch { return '—'; }
}

function fmtPrice(plan, interval) {
  const table = {
    'plus:month': '3,99 €/mês',
    'plus:year':  '35,99 €/ano',
    'max:month':  '7,99 €/mês',
    'max:year':   '71,99 €/ano',
  };
  return table[`${plan}:${interval}`] || '—';
}

export default function AccountPage({ currentUser, userPlan, onSwitchTab, onLogout }) {
  const isMobile = useIsMobile();
  const [portalLoading, setPortalLoading] = useState(false);
  const [portalError, setPortalError] = useState(null);

  // Password change
  const [pwOpen, setPwOpen] = useState(false);
  const [pwNew, setPwNew] = useState('');
  const [pwConfirm, setPwConfirm] = useState('');
  const [pwLoading, setPwLoading] = useState(false);
  const [pwMessage, setPwMessage] = useState(null); // { kind: 'success'|'error', text: string }

  const submitPasswordChange = async () => {
    setPwMessage(null);
    if (pwNew.length < 8) {
      setPwMessage({ kind: 'error', text: 'A password tem de ter pelo menos 8 caracteres.' });
      return;
    }
    if (pwNew !== pwConfirm) {
      setPwMessage({ kind: 'error', text: 'As passwords não coincidem.' });
      return;
    }
    const sb = getSupabaseClient();
    if (!sb) {
      setPwMessage({ kind: 'error', text: 'Sessão indisponível. Volta a iniciar sessão e tenta de novo.' });
      return;
    }
    setPwLoading(true);
    try {
      const { error } = await sb.auth.updateUser({ password: pwNew });
      if (error) {
        setPwMessage({ kind: 'error', text: error.message || 'Não foi possível alterar a password.' });
      } else {
        setPwMessage({ kind: 'success', text: 'Password alterada com sucesso.' });
        setPwNew(''); setPwConfirm('');
        setTimeout(() => { setPwOpen(false); setPwMessage(null); }, 1800);
      }
    } catch (e) {
      setPwMessage({ kind: 'error', text: 'Erro inesperado. Tenta novamente.' });
    } finally {
      setPwLoading(false);
    }
  };

  const sub = readCachedSubscription();
  const trialStatus = getTrialStatus();

  const plan = sub?.plan || userPlan || 'free';
  const status = sub?.status || (trialStatus.active ? 'trialing' : 'free');
  const planCfg = PLAN_CFG[plan] || PLAN_CFG.free;
  const statusCfg = STATUS_CFG[status];

  const openPortal = async () => {
    setPortalError(null);
    setPortalLoading(true);
    try {
      await openCustomerPortal({ returnTo: window.location.origin + '/?portal=return' });
      // redirects away — never returns on success
    } catch (e) {
      console.warn('Portal error:', e);
      setPortalError(
        e?.message === 'no_customer' || /no_customer/.test(String(e))
          ? 'Ainda não tens uma subscrição Stripe. Assina um plano primeiro.'
          : 'Não foi possível abrir o portal de gestão. Tenta novamente em instantes.'
      );
      setPortalLoading(false);
    }
  };

  const initial = (currentUser?.email || '?').charAt(0).toUpperCase();

  return (
    <div id="page-account" className="page active" style={{ padding: 0, minHeight: '100vh' }}>
      <div style={{ maxWidth: 720, margin: '0 auto', padding: isMobile ? '1.25rem 0.875rem 5.5rem' : '2.5rem 1.25rem 4rem' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 12 : 16, marginBottom: isMobile ? 20 : 32 }}>
          <div style={{
            width: isMobile ? 54 : 64, height: isMobile ? 54 : 64, borderRadius: '50%',
            background: 'linear-gradient(135deg,#00D764,#00b4d8)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#000', fontSize: isMobile ? 22 : 28, fontWeight: 800, letterSpacing: '-.02em',
            boxShadow: '0 0 30px rgba(0,215,100,.25)',
          }}>
            {initial}
          </div>
          <div>
            <h1 style={{ fontSize: isMobile ? 20 : 26, fontWeight: 800, color: 'var(--t1)', letterSpacing: '-.03em', marginBottom: 4 }}>
              A minha conta
            </h1>
            <div style={{ fontSize: 14, color: 'var(--t3)' }}>{currentUser?.email || '—'}</div>
          </div>
        </div>

        {/* Plan card */}
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-title" style={{ marginBottom: 16 }}>Subscrição</div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 18, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{
                fontSize: 11, fontWeight: 800, letterSpacing: '.12em', textTransform: 'uppercase',
                padding: '6px 12px', borderRadius: 20,
                background: planCfg.bg, color: planCfg.color, border: `1px solid ${planCfg.border}`,
              }}>
                {planCfg.label}
              </span>
              {statusCfg && (
                <span style={{ fontSize: 12, fontWeight: 600, color: statusCfg.color }}>
                  • {statusCfg.label}
                </span>
              )}
            </div>
            {sub?.billing_interval && (
              <div style={{ fontSize: 13, color: 'var(--t2)', fontWeight: 600 }}>
                {fmtPrice(plan, sub.billing_interval)}
              </div>
            )}
          </div>

          {/* Trial info */}
          {status === 'trialing' && (
            <div style={{
              padding: '14px 16px', borderRadius: 12, marginBottom: 14,
              background: 'rgba(0,215,100,.06)', border: '1px solid rgba(0,215,100,.18)',
            }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 6 }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#00D764' }}>
                  {trialStatus.daysLeft} {trialStatus.daysLeft === 1 ? 'dia' : 'dias'}
                </div>
                <div style={{ fontSize: 12, color: 'var(--t3)' }}>restantes no trial</div>
              </div>
              <div style={{ fontSize: 13, color: 'var(--t2)', lineHeight: 1.5 }}>
                {trialStatus.autoRenew
                  ? <>Vais ser cobrado automaticamente a <strong style={{ color: 'var(--t1)' }}>{fmtDate(sub?.trial_end)}</strong>. Cancela antes se não quiseres continuar.</>
                  : <>Trial cancelado. Manténs acesso até <strong style={{ color: 'var(--t1)' }}>{fmtDate(sub?.trial_end)}</strong>.</>
                }
              </div>
            </div>
          )}

          {/* Active info */}
          {status === 'active' && sub?.current_period_end && (
            <div style={{
              padding: '14px 16px', borderRadius: 12, marginBottom: 14,
              background: 'var(--card-hover)', border: '1px solid var(--border)',
            }}>
              <div style={{ fontSize: 12, color: 'var(--t3)', marginBottom: 4 }}>
                {sub.cancel_at_period_end ? 'Acesso até' : 'Próxima cobrança'}
              </div>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--t1)' }}>
                {fmtDate(sub.current_period_end)}
              </div>
              {sub.cancel_at_period_end && (
                <div style={{ fontSize: 12, color: '#ffb347', marginTop: 6 }}>
                  Subscrição cancelada — não será renovada.
                </div>
              )}
            </div>
          )}

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {sub?.stripe_customer_id ? (
              <button
                onClick={openPortal}
                disabled={portalLoading}
                style={{
                  flex: '1 1 auto', minWidth: 220, padding: 13, borderRadius: 12,
                  background: '#00D764', color: '#000', border: 'none',
                  fontFamily: 'var(--font)', fontSize: 11, fontWeight: 800,
                  letterSpacing: '.12em', textTransform: 'uppercase',
                  cursor: portalLoading ? 'wait' : 'pointer',
                  opacity: portalLoading ? .7 : 1,
                  boxShadow: '0 0 24px rgba(0,215,100,.25)',
                }}
              >
                {portalLoading ? 'A abrir…' : 'Gerir subscrição'}
              </button>
            ) : (
              <button
                onClick={() => onSwitchTab && onSwitchTab('pricing')}
                style={{
                  flex: '1 1 auto', minWidth: 220, padding: 13, borderRadius: 12,
                  background: '#00D764', color: '#000', border: 'none',
                  fontFamily: 'var(--font)', fontSize: 11, fontWeight: 800,
                  letterSpacing: '.12em', textTransform: 'uppercase', cursor: 'pointer',
                }}
              >
                Ver planos
              </button>
            )}
            {plan !== 'max' && sub?.stripe_customer_id && (
              <button
                onClick={() => onSwitchTab && onSwitchTab('pricing')}
                style={{
                  padding: '13px 18px', borderRadius: 12,
                  background: 'rgba(123,127,255,.12)', color: '#7b7fff',
                  border: '1px solid rgba(123,127,255,.3)',
                  fontFamily: 'var(--font)', fontSize: 11, fontWeight: 800,
                  letterSpacing: '.12em', textTransform: 'uppercase', cursor: 'pointer',
                }}
              >
                Fazer upgrade
              </button>
            )}
          </div>

          {portalError && (
            <div style={{
              marginTop: 12, padding: '10px 12px', borderRadius: 10,
              background: 'rgba(255,107,107,.08)', border: '1px solid rgba(255,107,107,.2)',
              fontSize: 12, color: '#ff6b6b',
            }}>
              {portalError}
            </div>
          )}

          <div style={{ marginTop: 14, fontSize: 11, color: 'var(--t3)', lineHeight: 1.6 }}>
            O portal de gestão é servido pela Stripe e permite atualizar o cartão, mudar de plano, transferir faturas ou cancelar a subscrição.
          </div>
        </div>

        {/* Account card */}
        <div className="card">
          <div className="card-title" style={{ marginBottom: 14 }}>Conta</div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
            <div>
              <div style={{ fontSize: 13, color: 'var(--t2)', fontWeight: 600 }}>Email</div>
              <div style={{ fontSize: 12, color: 'var(--t3)', marginTop: 2 }}>{currentUser?.email || '—'}</div>
            </div>
          </div>

          {/* Alterar password */}
          <div style={{ padding: '14px 0', borderBottom: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: 13, color: 'var(--t2)', fontWeight: 600 }}>Password</div>
                <div style={{ fontSize: 12, color: 'var(--t3)', marginTop: 2 }}>Mínimo 8 caracteres.</div>
              </div>
              <button
                onClick={() => { setPwOpen(o => !o); setPwMessage(null); setPwNew(''); setPwConfirm(''); }}
                style={{
                  padding: '10px 16px', borderRadius: 10,
                  background: pwOpen ? 'rgba(255,255,255,.1)' : 'rgba(255,255,255,.06)',
                  color: 'var(--t2)', border: '1px solid rgba(255,255,255,.12)',
                  fontFamily: 'var(--font)', fontSize: 12, fontWeight: 700, cursor: 'pointer',
                }}
              >
                {pwOpen ? 'Cancelar' : 'Alterar'}
              </button>
            </div>

            {pwOpen && (
              <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <input
                  type="password"
                  value={pwNew}
                  onChange={e => setPwNew(e.target.value)}
                  placeholder="Nova password"
                  autoComplete="new-password"
                  style={{
                    background: 'rgba(255,255,255,.07)', border: '1px solid var(--border)',
                    borderRadius: 9, padding: '10px 14px', color: 'var(--t1)',
                    fontFamily: 'var(--font)', fontSize: 14, outline: 'none',
                  }}
                />
                <input
                  type="password"
                  value={pwConfirm}
                  onChange={e => setPwConfirm(e.target.value)}
                  placeholder="Confirmar nova password"
                  autoComplete="new-password"
                  onKeyDown={e => { if (e.key === 'Enter') submitPasswordChange(); }}
                  style={{
                    background: 'rgba(255,255,255,.07)', border: '1px solid var(--border)',
                    borderRadius: 9, padding: '10px 14px', color: 'var(--t1)',
                    fontFamily: 'var(--font)', fontSize: 14, outline: 'none',
                  }}
                />
                <button
                  onClick={submitPasswordChange}
                  disabled={pwLoading}
                  style={{
                    padding: '11px 18px', borderRadius: 10,
                    background: pwLoading ? 'rgba(0,215,100,.4)' : '#00D764',
                    color: '#000', border: 'none',
                    fontFamily: 'var(--font)', fontSize: 12, fontWeight: 800,
                    letterSpacing: '.1em', textTransform: 'uppercase',
                    cursor: pwLoading ? 'wait' : 'pointer',
                  }}
                >
                  {pwLoading ? 'A guardar…' : 'Guardar nova password'}
                </button>
                {pwMessage && (
                  <div style={{
                    padding: '10px 12px', borderRadius: 10, fontSize: 12,
                    background: pwMessage.kind === 'success' ? 'rgba(0,215,100,.08)' : 'rgba(255,107,107,.08)',
                    border: '1px solid ' + (pwMessage.kind === 'success' ? 'rgba(0,215,100,.25)' : 'rgba(255,107,107,.25)'),
                    color: pwMessage.kind === 'success' ? 'var(--accent)' : '#ff6b6b',
                  }}>
                    {pwMessage.text}
                  </div>
                )}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0' }}>
            <div>
              <div style={{ fontSize: 13, color: 'var(--t2)', fontWeight: 600 }}>Terminar sessão</div>
              <div style={{ fontSize: 12, color: 'var(--t3)', marginTop: 2 }}>Sai do Flowstate neste dispositivo.</div>
            </div>
            <button
              onClick={onLogout}
              style={{
                padding: '10px 16px', borderRadius: 10,
                background: 'rgba(255,255,255,.06)', color: 'var(--t2)',
                border: '1px solid rgba(255,255,255,.12)',
                fontFamily: 'var(--font)', fontSize: 12, fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Sair
            </button>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: 24, fontSize: 11, color: 'var(--t3)' }}>
          Para apagar a conta, contacta <a href="mailto:suporte@flowstateapp.pt" style={{ color: 'var(--accent)' }}>suporte@flowstateapp.pt</a>.
        </div>
      </div>
    </div>
  );
}
