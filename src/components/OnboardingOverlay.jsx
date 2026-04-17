import React, { useState, useEffect, useRef } from 'react';
import { BUDGET_CATS } from '../utils/constants';

const WELCOME_SLIDES = [
  {
    icon: '💸',
    title: 'Controla os teus gastos',
    desc: 'Vê para onde vai o teu dinheiro com categorias automáticas e alertas inteligentes.',
  },
  {
    icon: '🎯',
    title: 'Define objetivos reais',
    desc: 'Fundo de emergência, viagem, entrada de casa — acompanha o progresso de cada um.',
  },
  {
    icon: '📈',
    title: 'Faz o teu dinheiro crescer',
    desc: 'Acompanha investimentos, ETFs e PPRs num só lugar. Tudo em português.',
  },
];

const TOTAL_STEPS = 7; // 3 welcome + goal + income + budget + celebration

export default function OnboardingOverlay({ budget: initialBudget, rendimentoMensal: initialRendimento, onFinish, onClose }) {
  const [step, setStep] = useState(0); // 0-2: welcome, 3: goal, 4: income, 5: budget, 6: celebration
  const [goal, setGoal] = useState(null);
  const [rendimento, setRendimento] = useState(initialRendimento || 0);
  const [localBudget, setLocalBudget] = useState({ ...initialBudget });
  const [fadeIn, setFadeIn] = useState(true);
  const [touchStart, setTouchStart] = useState(null);
  const containerRef = useRef(null);

  // Animate step transitions
  const goStep = (s) => {
    setFadeIn(false);
    setTimeout(() => {
      if (s === 5) {
        // Build budget suggestions before showing budget step
        const r = rendimento;
        const newBudget = { ...localBudget };
        BUDGET_CATS.forEach(({ cat, pct }) => {
          if (!newBudget[cat]) newBudget[cat] = r > 0 ? Math.round(r * pct / 10) * 10 : 0;
        });
        setLocalBudget(newBudget);
      }
      setStep(s);
      setFadeIn(true);
    }, 200);
  };

  // Swipe support for welcome screens
  const handleTouchStart = (e) => setTouchStart(e.touches[0].clientX);
  const handleTouchEnd = (e) => {
    if (touchStart === null) return;
    const diff = touchStart - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      if (diff > 0 && step < 2) goStep(step + 1);       // swipe left → next
      else if (diff < 0 && step > 0) goStep(step - 1);  // swipe right → prev
    }
    setTouchStart(null);
  };

  // Progress dots for welcome screens, progress bar for setup steps
  const isWelcome = step <= 2;
  const isSetup = step >= 3 && step <= 5;
  const setupStep = step - 2; // 1, 2, 3 for setup steps
  const isCelebration = step === 6;

  const overlayStyle = {
    display: 'flex', position: 'fixed', inset: 0,
    background: 'rgba(10,13,24,.95)', zIndex: 9000,
    alignItems: 'center', justifyContent: 'center',
    padding: '1.5rem', fontFamily: 'Inter,system-ui,sans-serif',
  };

  const modalStyle = {
    background: isWelcome ? 'transparent' : '#202638',
    borderRadius: 24, width: '100%', maxWidth: 480,
    padding: isWelcome ? '2rem' : '2.5rem 2rem',
    boxShadow: isWelcome ? 'none' : '0 32px 80px rgba(0,0,0,.6)',
    position: 'relative',
    transition: 'all .3s ease',
  };

  const contentStyle = {
    opacity: fadeIn ? 1 : 0,
    transform: fadeIn ? 'translateY(0)' : 'translateY(12px)',
    transition: 'opacity .25s ease, transform .25s ease',
  };

  return (
    <div style={overlayStyle} ref={containerRef}>
      <div style={modalStyle}>

        {/* ── WELCOME SCREENS (Steps 0-2) ── */}
        {isWelcome && (
          <div style={contentStyle} onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
            {/* Logo / Brand */}
            {step === 0 && (
              <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <div style={{ fontSize: 14, fontWeight: 800, letterSpacing: '.15em', color: '#00D764', textTransform: 'uppercase', marginBottom: 8 }}>FLOWSTATE</div>
                <div style={{ fontSize: 26, fontWeight: 800, color: '#fff', lineHeight: 1.3 }}>A tua liberdade<br />financeira começa aqui.</div>
              </div>
            )}

            {/* Slide content */}
            <div style={{ textAlign: 'center', padding: '2rem 0' }}>
              <div style={{
                width: 80, height: 80, borderRadius: 24,
                background: 'rgba(0,215,100,.1)', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                fontSize: '2.2rem', margin: '0 auto 1.5rem',
                border: '1px solid rgba(0,215,100,.15)',
              }}>
                {WELCOME_SLIDES[step].icon}
              </div>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#fff', marginBottom: '.75rem' }}>
                {WELCOME_SLIDES[step].title}
              </div>
              <div style={{ fontSize: 14, color: '#8b8fa8', lineHeight: 1.7, maxWidth: 320, margin: '0 auto' }}>
                {WELCOME_SLIDES[step].desc}
              </div>
            </div>

            {/* Dots */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, margin: '1.5rem 0 2rem' }}>
              {[0, 1, 2].map(i => (
                <div key={i} onClick={() => goStep(i)} style={{
                  width: i === step ? 24 : 8, height: 8, borderRadius: 4,
                  background: i === step ? '#00D764' : 'rgba(255,255,255,.15)',
                  transition: 'all .3s ease', cursor: 'pointer',
                }} />
              ))}
            </div>

            {/* Buttons */}
            <div style={{ display: 'flex', gap: 8 }}>
              {step > 0 && (
                <button onClick={() => goStep(step - 1)}
                  style={{ flex: 1, padding: 14, borderRadius: 14, background: 'rgba(255,255,255,.07)', color: '#6e7491', border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter,sans-serif' }}>
                  ←
                </button>
              )}
              <button onClick={() => goStep(step + 1)}
                style={{ flex: step === 0 ? 1 : 3, padding: 14, borderRadius: 14, background: '#00D764', color: '#000', border: 'none', fontSize: 15, fontWeight: 800, cursor: 'pointer', fontFamily: 'Inter,sans-serif' }}>
                {step === 2 ? 'Vamos configurar →' : 'Continuar →'}
              </button>
            </div>

            {/* Skip link */}
            <button onClick={() => goStep(3)}
              style={{ display: 'block', width: '100%', marginTop: 16, padding: 8, background: 'none', border: 'none', color: '#4a4e6a', fontSize: 12, cursor: 'pointer', fontFamily: 'Inter,sans-serif' }}>
              Saltar introdução
            </button>
          </div>
        )}

        {/* ── SETUP STEPS (Steps 3-5) ── */}
        {isSetup && (
          <>
            {/* Progress bar */}
            <div style={{ display: 'flex', gap: 6, marginBottom: '2rem' }}>
              {[1, 2, 3].map(s => (
                <div key={s} style={{ flex: 1, height: 3, borderRadius: 2, background: s <= setupStep ? '#00D764' : 'rgba(255,255,255,.12)', transition: 'background .3s' }} />
              ))}
            </div>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#4a4e6a', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: '1.25rem', marginTop: -8 }}>
              Passo {setupStep} de 3
            </div>
          </>
        )}

        {/* Step 3: Goal */}
        {step === 3 && (
          <div style={contentStyle}>
            <div style={{ fontSize: '1.8rem', marginBottom: '.75rem' }}>🎯</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#fff', marginBottom: '.4rem' }}>Qual é o teu objetivo?</div>
            <div style={{ fontSize: 13, color: '#6e7491', marginBottom: '1.75rem', lineHeight: 1.6 }}>Isto ajuda-nos a personalizar a tua experiência.</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { k: 'poupar', label: '💰 Quero poupar mais todos os meses' },
                { k: 'investir', label: '📈 Quero começar a investir' },
                { k: 'controlar', label: '📊 Quero controlar melhor as despesas' },
                { k: 'tudo', label: '🚀 Quero tudo — poupar, investir e controlar' },
              ].map(g => (
                <button key={g.k}
                  onClick={() => setGoal(g.k)}
                  style={{
                    width: '100%', padding: '13px 16px', borderRadius: 12,
                    background: goal === g.k ? 'rgba(0,215,100,.12)' : 'rgba(255,255,255,.05)',
                    border: `1px solid ${goal === g.k ? 'rgba(0,215,100,.4)' : 'rgba(255,255,255,.1)'}`,
                    color: goal === g.k ? '#fff' : '#c8cad8',
                    fontSize: 13, fontWeight: 600, textAlign: 'left',
                    cursor: 'pointer', fontFamily: 'Inter,sans-serif',
                    transition: 'all .2s ease',
                  }}>
                  {g.label}
                </button>
              ))}
            </div>
            <button onClick={() => goStep(4)} disabled={!goal}
              style={{ width: '100%', marginTop: '1.5rem', padding: 13, borderRadius: 12, background: '#00D764', color: '#000', border: 'none', fontSize: 14, fontWeight: 800, cursor: 'pointer', fontFamily: 'Inter,sans-serif', opacity: goal ? 1 : .4, pointerEvents: goal ? 'auto' : 'none' }}>
              Continuar →
            </button>
          </div>
        )}

        {/* Step 4: Income */}
        {step === 4 && (
          <div style={contentStyle}>
            <div style={{ fontSize: '1.8rem', marginBottom: '.75rem' }}>💼</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#fff', marginBottom: '.4rem' }}>Qual é o teu rendimento mensal?</div>
            <div style={{ fontSize: 13, color: '#6e7491', marginBottom: '1.75rem', lineHeight: 1.6 }}>Isto ajuda-nos a calcular o teu orçamento sugerido por categoria.</div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ fontSize: 10, fontWeight: 700, color: '#6e7491', textTransform: 'uppercase', letterSpacing: '.08em', display: 'block', marginBottom: 6 }}>Rendimento líquido mensal (€)</label>
              <input type="number" value={rendimento || ''} onChange={e => setRendimento(parseFloat(e.target.value) || 0)} placeholder="Ex: 1500" min="0" step="100"
                style={{ width: '100%', height: 48, padding: '0 16px', background: 'rgba(255,255,255,.07)', border: '1px solid rgba(255,255,255,.12)', borderRadius: 12, fontSize: 16, fontWeight: 600, color: '#fff', fontFamily: 'Inter,sans-serif', outline: 'none', boxSizing: 'border-box' }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, marginBottom: '1.5rem' }}>
              {[800, 1200, 1800, 2500].map(v => (
                <button key={v} onClick={() => setRendimento(v)}
                  style={{
                    padding: '8px 0', borderRadius: 8,
                    background: rendimento === v ? 'rgba(0,215,100,.12)' : 'rgba(255,255,255,.06)',
                    border: `1px solid ${rendimento === v ? 'rgba(0,215,100,.3)' : 'rgba(255,255,255,.08)'}`,
                    color: rendimento === v ? '#00D764' : '#6e7491',
                    fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter,sans-serif',
                    transition: 'all .2s ease',
                  }}>
                  {v}€
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => goStep(3)} style={{ flex: 1, padding: 13, borderRadius: 12, background: 'rgba(255,255,255,.07)', color: '#6e7491', border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter,sans-serif' }}>← Voltar</button>
              <button onClick={() => goStep(5)} style={{ flex: 2, padding: 13, borderRadius: 12, background: '#00D764', color: '#000', border: 'none', fontSize: 14, fontWeight: 800, cursor: 'pointer', fontFamily: 'Inter,sans-serif' }}>Continuar →</button>
            </div>
          </div>
        )}

        {/* Step 5: Budget */}
        {step === 5 && (
          <div style={contentStyle}>
            <div style={{ fontSize: '1.8rem', marginBottom: '.75rem' }}>📋</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#fff', marginBottom: '.4rem' }}>Orçamento por categoria</div>
            <div style={{ fontSize: 13, color: '#6e7491', marginBottom: '1.25rem', lineHeight: 1.6 }}>Sugerimos limites com base no teu rendimento. Ajusta à tua realidade.</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 280, overflowY: 'auto', marginBottom: '1.25rem', paddingRight: 4 }}>
              {BUDGET_CATS.map(({ cat, emoji }) => (
                <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0' }}>
                  <span style={{ fontSize: '1.1rem', width: 24 }}>{emoji}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#e0e2ea', flex: 1 }}>{cat}</span>
                  <input type="number" min="0" step="10" value={localBudget[cat] || ''}
                    onChange={e => setLocalBudget({ ...localBudget, [cat]: parseFloat(e.target.value) || 0 })}
                    placeholder="0 €"
                    style={{ width: 90, background: 'rgba(255,255,255,.07)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 8, padding: '6px 10px', color: '#fff', fontFamily: 'Inter,sans-serif', fontSize: 13, fontWeight: 600, outline: 'none', textAlign: 'right' }} />
                  <span style={{ fontSize: 11, color: '#6e7491', width: 16 }}>€</span>
                </div>
              ))}
            </div>
            {/* Total indicator */}
            {rendimento > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderTop: '1px solid rgba(255,255,255,.08)', marginBottom: '1rem', fontSize: 13 }}>
                <span style={{ color: '#6e7491' }}>Total alocado</span>
                <span style={{ fontWeight: 700, color: Object.values(localBudget).reduce((a, b) => a + (b || 0), 0) > rendimento ? '#ff6b6b' : '#00D764' }}>
                  {Object.values(localBudget).reduce((a, b) => a + (b || 0), 0)}€ / {rendimento}€
                </span>
              </div>
            )}
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => goStep(4)} style={{ flex: 1, padding: 13, borderRadius: 12, background: 'rgba(255,255,255,.07)', color: '#6e7491', border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter,sans-serif' }}>← Voltar</button>
              <button onClick={() => goStep(6)} style={{ flex: 2, padding: 13, borderRadius: 12, background: '#00D764', color: '#000', border: 'none', fontSize: 14, fontWeight: 800, cursor: 'pointer', fontFamily: 'Inter,sans-serif' }}>Continuar →</button>
            </div>
          </div>
        )}

        {/* ── CELEBRATION SCREEN (Step 6) ── */}
        {isCelebration && (
          <div style={{ ...contentStyle, textAlign: 'center', padding: '1rem 0' }}>
            <div style={{
              width: 90, height: 90, borderRadius: '50%',
              background: 'rgba(0,215,100,.12)', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              fontSize: '2.5rem', margin: '0 auto 1.5rem',
              border: '2px solid rgba(0,215,100,.25)',
              animation: 'pulse-glow 2s ease-in-out infinite',
            }}>
              🎉
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#fff', marginBottom: '.5rem' }}>Tudo pronto!</div>
            <div style={{ fontSize: 14, color: '#8b8fa8', lineHeight: 1.7, marginBottom: '.5rem' }}>
              A tua conta está configurada.
            </div>
            <div style={{ fontSize: 13, color: '#6e7491', lineHeight: 1.6, marginBottom: '2rem', maxWidth: 300, margin: '0 auto 2rem' }}>
              Começa por adicionar a tua primeira transação para veres a magia acontecer.
            </div>

            {/* Quick tips */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: '2rem', textAlign: 'left' }}>
              {[
                { icon: '➕', text: 'Clica no + para adicionar transações' },
                { icon: '📊', text: 'O dashboard atualiza em tempo real' },
                { icon: '🔔', text: 'Recebes alertas quando passares o orçamento' },
              ].map((tip, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '10px 14px', borderRadius: 10,
                  background: 'rgba(255,255,255,.04)',
                  border: '1px solid rgba(255,255,255,.06)',
                }}>
                  <span style={{ fontSize: 16 }}>{tip.icon}</span>
                  <span style={{ fontSize: 12, color: '#8b8fa8', fontWeight: 500 }}>{tip.text}</span>
                </div>
              ))}
            </div>

            <button onClick={() => onFinish(localBudget, rendimento)}
              style={{
                width: '100%', padding: 15, borderRadius: 14,
                background: '#00D764', color: '#000', border: 'none',
                fontSize: 16, fontWeight: 800, cursor: 'pointer',
                fontFamily: 'Inter,sans-serif',
              }}>
              Começar a usar o Flowstate 🚀
            </button>

            <style>{`
              @keyframes pulse-glow {
                0%, 100% { box-shadow: 0 0 0 0 rgba(0,215,100,.2); }
                50% { box-shadow: 0 0 0 16px rgba(0,215,100,0); }
              }
            `}</style>
          </div>
        )}

      </div>
    </div>
  );
}
