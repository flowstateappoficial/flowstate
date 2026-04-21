import React from 'react';
import { PRICES } from '../utils/constants';
import { getTrialStatus } from '../utils/trial';
import useIsMobile from '../hooks/useIsMobile';
import useBetaStatus from '../hooks/useBetaStatus';

export default function PricingPage({ billingAnual, setBillingAnual, logo, onShowAuth, onStartTrial, onSubscribe }) {
  const isMobile = useIsMobile();
  const { isBetaActive } = useBetaStatus();
  const trialStatus = getTrialStatus();
  const canStartTrial = !trialStatus.hasTrial;
  const trialActive = trialStatus.active;
  const trialExpired = trialStatus.expired;
  const fmt = v => v.toFixed(2).replace('.', ',') + ' €';
  const pPlus = billingAnual ? PRICES.plus.anual : PRICES.plus.mensal;
  const pFreedom = billingAnual ? PRICES.freedom.anual : PRICES.freedom.mensal;

  const Check = () => (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="8" fill="rgba(0,215,100,.15)"/><path d="M5.5 9l2.5 2.5 5-5" stroke="#00D764" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
  );
  const Cross = () => (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="8" fill="rgba(255,255,255,.05)"/><path d="M6 12l6-6M12 12L6 6" stroke="#3d4260" strokeWidth="1.5" strokeLinecap="round"/></svg>
  );

  return (
    <div id="page-pricing" className="page active" style={{ padding: 0, minHeight: '100vh', position: 'relative', overflow: 'hidden', background: '#0d1120' }}>
      {/* Background effects */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
        <div style={{ position: 'absolute', top: -200, left: -200, width: 700, height: 700, background: 'radial-gradient(circle,rgba(0,215,100,.15) 0%,transparent 65%)' }} />
        <div style={{ position: 'absolute', bottom: -200, right: -200, width: 600, height: 600, background: 'radial-gradient(circle,rgba(123,127,255,.13) 0%,transparent 65%)' }} />
      </div>

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 1020, margin: '0 auto', padding: isMobile ? '1.5rem 1rem 5.5rem' : '3.5rem 1.5rem 4rem' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '.5rem' }}>
          <img src={logo} alt="Flowstate" style={{ height: isMobile ? 54 : 72, width: 'auto', display: 'inline-block' }} />
        </div>

        {/* Headline */}
        <div style={{ textAlign: 'center', marginBottom: '2.75rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(0,215,100,.1)', border: '1px solid rgba(0,215,100,.25)', borderRadius: 20, padding: '5px 14px', marginBottom: '1.1rem' }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#00D764', animation: 'pulse 2s infinite' }} />
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.1em', color: '#00D764', textTransform: 'uppercase' }}>Cancela a qualquer momento</span>
          </div>
          <h1 style={{ fontSize: 'clamp(2rem,5vw,3.2rem)', fontWeight: 800, letterSpacing: '-.05em', color: '#fff', lineHeight: 1.1, marginBottom: '.9rem' }}>
            Investe em ti.<br />
            <span style={{ background: 'linear-gradient(135deg,#00D764,#00b4d8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>A tua liberdade financeira começa aqui.</span>
          </h1>
          <p style={{ fontSize: 14, color: '#6e7491', maxWidth: 440, margin: '0 auto', lineHeight: 1.75 }}>
            {isBetaActive
              ? 'Estamos em beta fechada. A subscrição Plus ficará disponível no final da beta — os teus meses Plus acumulados através de convites serão aplicados automaticamente.'
              : canStartTrial
                ? '7 dias grátis, depois 3,99 €/mês. Cancela quando quiseres.'
                : trialActive
                  ? (trialStatus.autoRenew
                      ? `Trial ativo — faltam ${trialStatus.daysLeft} ${trialStatus.daysLeft === 1 ? 'dia' : 'dias'}. Serás cobrado automaticamente, cancela antes se não quiseres continuar.`
                      : `Trial cancelado — mantém acesso durante mais ${trialStatus.daysLeft} ${trialStatus.daysLeft === 1 ? 'dia' : 'dias'}. Reativa para continuar com Flow Plus.`)
                  : 'Cancela a qualquer momento.'}
          </p>
        </div>

        {/* Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: '3rem' }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: billingAnual ? 'var(--t3)' : 'var(--t1)' }}>Mensal</span>
          <div onClick={() => setBillingAnual(!billingAnual)} style={{ width: 52, height: 28, borderRadius: 14, background: 'rgba(0,215,100,.2)', border: '1px solid rgba(0,215,100,.4)', cursor: 'pointer', position: 'relative' }}>
            <div style={{ position: 'absolute', top: 4, left: billingAnual ? 28 : 4, width: 20, height: 20, borderRadius: '50%', background: '#00D764', transition: 'left .25s', boxShadow: '0 0 8px rgba(0,215,100,.6)' }} />
          </div>
          <span style={{ fontSize: 13, fontWeight: 600, color: billingAnual ? 'var(--t1)' : 'var(--t3)' }}>
            Anual <span style={{ marginLeft: 6, fontSize: 10, background: 'rgba(0,215,100,.15)', color: '#00D764', padding: '3px 8px', borderRadius: 20, fontWeight: 800, letterSpacing: '.04em' }}>POUPA</span>
          </span>
        </div>

        {/* Beta banner — shown while beta_ended_at is not set */}
        {isBetaActive && (
          <div style={{
            maxWidth: 720, margin: '0 auto 2rem',
            padding: isMobile ? '14px 16px' : '16px 22px',
            borderRadius: 16,
            background: 'linear-gradient(135deg, rgba(0,215,100,.12), rgba(123,127,255,.10))',
            border: '1px solid rgba(0,215,100,.3)',
            display: 'flex', alignItems: isMobile ? 'flex-start' : 'center', gap: 14,
            flexDirection: isMobile ? 'column' : 'row',
          }}>
            <div style={{
              flexShrink: 0, width: 44, height: 44, borderRadius: 12,
              background: 'rgba(0,215,100,.18)', display: 'flex',
              alignItems: 'center', justifyContent: 'center', fontSize: 22,
            }}>🔒</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#00D764', letterSpacing: '.02em', marginBottom: 4 }}>
                Subscrições fechadas durante a beta
              </div>
              <div style={{ fontSize: 12, color: '#9ba3c4', lineHeight: 1.55 }}>
                Os planos Plus e Max ficarão disponíveis assim que a beta fechada terminar. Os meses Plus que ganhaste a convidar amigos serão aplicados automaticamente no teu primeiro checkout.
              </div>
            </div>
          </div>
        )}

        {/* Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr', gap: isMobile ? 14 : 20, alignItems: 'start' }}>
          {/* FREE */}
          <div style={{ background: 'rgba(255,255,255,.04)', backdropFilter: 'blur(20px)', borderRadius: 24, padding: '2.25rem 1.75rem', border: '1px solid rgba(255,255,255,.09)' }}>
            <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '.18em', textTransform: 'uppercase', color: '#6e7491', marginBottom: '1.25rem' }}>Free</div>
            <div style={{ fontSize: '3rem', fontWeight: 800, color: '#fff', letterSpacing: '-.05em', lineHeight: 1, marginBottom: '.3rem' }}>Grátis</div>
            <div style={{ fontSize: 12, color: '#6e7491', marginBottom: '2rem' }}>Para sempre</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: '2rem' }}>
              {['Tracking de despesas e rendimentos', 'Orçamento por categoria', 'Dicas financeiras diárias'].map(f => (
                <div key={f} style={{ display: 'flex', gap: 10, alignItems: 'center' }}><Check /><span style={{ fontSize: 13, color: '#9ba3c4' }}>{f}</span></div>
              ))}
              {['Investimentos', 'Calculadora'].map(f => (
                <div key={f} style={{ display: 'flex', gap: 10, alignItems: 'center' }}><Cross /><span style={{ fontSize: 13, color: '#3d4260' }}>{f}</span></div>
              ))}
            </div>
            <button onClick={onShowAuth} style={{ width: '100%', padding: 13, borderRadius: 12, background: 'rgba(255,255,255,.07)', color: '#fff', border: '1px solid rgba(255,255,255,.12)', fontFamily: 'Inter,sans-serif', fontSize: 10, fontWeight: 800, letterSpacing: '.14em', textTransform: 'uppercase', cursor: 'pointer' }}>
              Embarcar gratuitamente
            </button>
          </div>

          {/* FLOW PLUS */}
          <div style={{ background: 'rgba(10,20,16,.7)', backdropFilter: 'blur(20px)', borderRadius: 24, padding: '2.25rem 1.75rem', border: '2px solid rgba(0,215,100,.5)', position: 'relative', boxShadow: '0 0 60px rgba(0,215,100,.15),inset 0 1px 0 rgba(0,215,100,.2)', transform: 'translateY(-8px)' }}>
            <div style={{ position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)', background: '#00D764', color: '#000', fontSize: 10, fontWeight: 800, padding: '5px 16px', borderRadius: 20, letterSpacing: '.12em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>Mais Popular</div>
            <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '.18em', textTransform: 'uppercase', color: '#00D764', marginBottom: '1.25rem' }}>Flow Plus</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: '.3rem' }}>
              <span style={{ fontSize: '3rem', fontWeight: 800, color: '#fff', letterSpacing: '-.05em', lineHeight: 1 }}>{fmt(pPlus)}</span>
              <span style={{ fontSize: 13, color: '#6e7491' }}>/mês</span>
            </div>
            <div style={{ fontSize: 12, color: '#6e7491', marginBottom: '2rem' }}>{billingAnual ? `${fmt(pPlus * 12)}/ano` : 'Faturado mensalmente'}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: '2rem' }}>
              {['Tudo do plano Free', 'Aba de Investimentos desbloqueada', 'Calculadora de investimentos', 'Objetivos ilimitados', 'Dicas avançadas de investimento'].map((f, i) => (
                <div key={f} style={{ display: 'flex', gap: 10, alignItems: 'center' }}><Check /><span style={{ fontSize: 13, color: '#9ba3c4', fontWeight: i === 1 || i === 2 ? 700 : 400 }}>{f}</span></div>
              ))}
            </div>
            {isBetaActive ? (
              <button disabled title="Disponível no final da beta" style={{ width: '100%', padding: 13, borderRadius: 12, background: 'rgba(0,215,100,.12)', color: '#00D764', border: '1px solid rgba(0,215,100,.3)', fontFamily: 'Inter,sans-serif', fontSize: 10, fontWeight: 800, letterSpacing: '.14em', textTransform: 'uppercase', cursor: 'not-allowed', opacity: .85 }}>
                🔒 Disponível após a beta
              </button>
            ) : canStartTrial && onStartTrial ? (
              <button onClick={onStartTrial} style={{ width: '100%', padding: 13, borderRadius: 12, background: '#00D764', color: '#000', border: 'none', fontFamily: 'Inter,sans-serif', fontSize: 10, fontWeight: 800, letterSpacing: '.14em', textTransform: 'uppercase', cursor: 'pointer', boxShadow: '0 0 30px rgba(0,215,100,.3)' }}>
                🎁 Experimentar 7 dias grátis
              </button>
            ) : (
              <button onClick={() => onSubscribe && onSubscribe('plus')} style={{ width: '100%', padding: 13, borderRadius: 12, background: '#00D764', color: '#000', border: 'none', fontFamily: 'Inter,sans-serif', fontSize: 10, fontWeight: 800, letterSpacing: '.14em', textTransform: 'uppercase', cursor: 'pointer', boxShadow: '0 0 30px rgba(0,215,100,.3)' }}>
                {trialActive ? 'Assinar antes do fim do trial' : trialExpired ? 'Reativar Flow Plus' : 'Assinar Flow Plus'}
              </button>
            )}
          </div>

          {/* FLOW MAX */}
          <div style={{ background: 'rgba(255,255,255,.04)', backdropFilter: 'blur(20px)', borderRadius: 24, padding: '2.25rem 1.75rem', border: '1px solid rgba(123,127,255,.3)' }}>
            <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '.18em', textTransform: 'uppercase', color: '#7b7fff', marginBottom: '1.25rem' }}>Flow Max</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: '.3rem' }}>
              <span style={{ fontSize: '3rem', fontWeight: 800, color: '#fff', letterSpacing: '-.05em', lineHeight: 1 }}>{fmt(pFreedom)}</span>
              <span style={{ fontSize: 13, color: '#6e7491' }}>/mês</span>
            </div>
            <div style={{ fontSize: 12, color: '#6e7491', marginBottom: '2rem' }}>{billingAnual ? `${fmt(pFreedom * 12)}/ano` : 'Faturado mensalmente'}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: '2rem' }}>
              {['Tudo do Flow Plus', 'Relatório PDF mensal automático', 'Simulador de independência financeira', 'Análise IA de padrões de gastos', 'Suporte prioritário'].map((f, i) => (
                <div key={f} style={{ display: 'flex', gap: 10, alignItems: 'center' }}><Check /><span style={{ fontSize: 13, color: '#9ba3c4', fontWeight: i >= 1 && i <= 3 ? 700 : 400 }}>{f}</span></div>
              ))}
            </div>
            {isBetaActive ? (
              <button disabled title="Disponível no final da beta" style={{ width: '100%', padding: 13, borderRadius: 12, background: 'rgba(123,127,255,.1)', color: '#7b7fff', border: '1px solid rgba(123,127,255,.25)', fontFamily: 'Inter,sans-serif', fontSize: 10, fontWeight: 800, letterSpacing: '.14em', textTransform: 'uppercase', cursor: 'not-allowed', opacity: .85 }}>
                🔒 Disponível após a beta
              </button>
            ) : (
              <button onClick={() => onSubscribe && onSubscribe('max')} style={{ width: '100%', padding: 13, borderRadius: 12, background: 'rgba(123,127,255,.15)', color: '#7b7fff', border: '1px solid rgba(123,127,255,.3)', fontFamily: 'Inter,sans-serif', fontSize: 10, fontWeight: 800, letterSpacing: '.14em', textTransform: 'uppercase', cursor: 'pointer' }}>
                Assinar Flow Max
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
