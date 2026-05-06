import React, { useState, useEffect, useCallback } from 'react';

/*
  AppTour — interactive tooltip tour that highlights each section of the app.
  Shown once after onboarding finishes. Uses a spotlight overlay + floating tooltip.
  Works on both mobile (BottomNav) and desktop (Navbar).
*/

const TOUR_STEPS = [
  {
    tabId: 'dash',
    icon: '🏠',
    title: 'Dashboard',
    desc: 'O teu centro de comando financeiro. Resumo do mês, comparação com o mês anterior, gráficos de gastos por categoria e progresso dos objetivos.',
    tip: 'Volta aqui sempre que quiseres saber como estão as tuas finanças.',
  },
  {
    tabId: 'txs',
    icon: '💳',
    title: 'Transações',
    desc: 'Regista despesas e rendimentos. Cada transação é categorizada e afeta o teu orçamento mensal.',
    tip: 'Usa o botão + para adicionar rapidamente.',
  },
  {
    tabId: 'subs',
    icon: '🔄',
    title: 'Subscrições',
    desc: 'Centraliza Netflix, Spotify, ginásio, telecomunicações e tudo o resto que paga sozinho. O Flowstate avisa-te antes de seres cobrado e mostra o calendário mensal num só sítio.',
    tip: 'Marca subscrições para cancelar e vê quanto poupas.',
  },
  {
    tabId: 'inv',
    icon: '📈',
    title: 'Investimentos',
    desc: 'Acompanha ETFs, PPRs, ações e o teu fundo de emergência. Vê evolução, retorno acumulado e contribuições mensais.',
    tip: 'Funcionalidade do Flow Plus — começas com 7 dias grátis.',
  },
  {
    tabId: 'convites',
    icon: '🎁',
    title: 'Convites',
    desc: 'Convida amigos para o Flowstate e ganha extensões de trial e badges. Quantos mais convidares, mais benefícios desbloqueias.',
    tip: 'Partilha o teu código único com quem ainda não conhece.',
  },
  {
    tabId: 'account',
    icon: '👤',
    title: 'A tua conta',
    desc: 'Gere perfil, subscrição, orçamento mensal e exporta o relatório PDF do mês.',
    tip: 'Aqui podes ajustar categorias do orçamento a qualquer altura.',
  },
];

export default function AppTour({ onFinish, onSwitchTab, isMobile }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [fadeIn, setFadeIn] = useState(true);
  const [tooltipPos, setTooltipPos] = useState({ top: 0, left: 0 });

  const step = TOUR_STEPS[currentStep];

  // Navigate to the tab being highlighted
  useEffect(() => {
    if (step && onSwitchTab) {
      onSwitchTab(step.tabId);
    }
  }, [currentStep, step, onSwitchTab]);

  // Position the tooltip near the relevant nav item.
  // Uses data-tab attribute (set on each nav button in Navbar.jsx + BottomNav.jsx)
  // so the lookup is robust to ordering changes.
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const btn = document.querySelector(`[data-tab="${step.tabId}"]`);
        if (btn) {
          const rect = btn.getBoundingClientRect();
          if (isMobile) {
            // Position tooltip above the bottom nav
            setTooltipPos({
              top: rect.top - 12,
              left: Math.max(16, Math.min(rect.left + rect.width / 2, window.innerWidth - 16)),
              anchor: 'bottom',
            });
          } else {
            // Position tooltip below the top nav
            setTooltipPos({
              top: rect.bottom + 12,
              left: Math.max(16, Math.min(rect.left + rect.width / 2, window.innerWidth - 16)),
              anchor: 'top',
            });
          }
        } else {
          // Tab button isn't visible (e.g. desktop 'account' lives inside the
          // avatar dropdown). Center the tooltip vertically on screen.
          setTooltipPos({
            top: Math.max(120, window.innerHeight / 2 - 200),
            left: window.innerWidth / 2,
            anchor: 'top',
          });
        }
      } catch {}
    }, 100);
    return () => clearTimeout(timer);
  }, [currentStep, step, isMobile]);

  const goNext = useCallback(() => {
    if (currentStep >= TOUR_STEPS.length - 1) {
      onFinish();
      return;
    }
    setFadeIn(false);
    setTimeout(() => {
      setCurrentStep(prev => prev + 1);
      setFadeIn(true);
    }, 200);
  }, [currentStep, onFinish]);

  const goPrev = useCallback(() => {
    if (currentStep <= 0) return;
    setFadeIn(false);
    setTimeout(() => {
      setCurrentStep(prev => prev - 1);
      setFadeIn(true);
    }, 200);
  }, [currentStep]);

  const skip = useCallback(() => {
    onFinish();
  }, [onFinish]);

  return (
    <>
      {/* Dimmed overlay */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 8000,
        background: 'rgba(10,13,24,.75)',
        pointerEvents: 'auto',
      }} onClick={goNext} />

      {/* Floating tooltip card */}
      <div style={{
        position: 'fixed',
        zIndex: 8500,
        ...(tooltipPos.anchor === 'bottom' ? {
          bottom: `${window.innerHeight - tooltipPos.top + 8}px`,
          left: 0, right: 0,
        } : {
          top: `${tooltipPos.top}px`,
          left: 0, right: 0,
        }),
        display: 'flex',
        justifyContent: 'center',
        pointerEvents: 'none',
        padding: '0 16px',
      }}>
        <div style={{
          background: '#1a1e30',
          borderRadius: 20,
          padding: '24px 20px 20px',
          maxWidth: 380,
          width: '100%',
          boxShadow: '0 20px 60px rgba(0,0,0,.6), 0 0 0 1px rgba(255,255,255,.08)',
          pointerEvents: 'auto',
          opacity: fadeIn ? 1 : 0,
          transform: fadeIn ? 'translateY(0)' : 'translateY(8px)',
          transition: 'opacity .25s ease, transform .25s ease',
          fontFamily: 'Inter,system-ui,sans-serif',
        }}>
          {/* Step counter */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ display: 'flex', gap: 4 }}>
              {TOUR_STEPS.map((_, i) => (
                <div key={i} style={{
                  width: i === currentStep ? 20 : 6, height: 6, borderRadius: 3,
                  background: i === currentStep ? '#00D764' : i < currentStep ? 'rgba(0,215,100,.3)' : 'rgba(255,255,255,.12)',
                  transition: 'all .3s ease',
                }} />
              ))}
            </div>
            <span style={{ fontSize: 11, color: '#4a4e6a', fontWeight: 600 }}>
              {currentStep + 1} / {TOUR_STEPS.length}
            </span>
          </div>

          {/* Icon + Title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: 'rgba(0,215,100,.1)',
              border: '1px solid rgba(0,215,100,.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.3rem', flexShrink: 0,
            }}>
              {step.icon}
            </div>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#fff' }}>{step.title}</div>
          </div>

          {/* Description */}
          <div style={{ fontSize: 13, color: '#8b8fa8', lineHeight: 1.7, marginBottom: 8 }}>
            {step.desc}
          </div>

          {/* Tip */}
          <div style={{
            fontSize: 12, color: '#00D764', fontWeight: 600, lineHeight: 1.5,
            padding: '8px 12px', borderRadius: 10,
            background: 'rgba(0,215,100,.06)',
            border: '1px solid rgba(0,215,100,.1)',
            marginBottom: 16,
          }}>
            💡 {step.tip}
          </div>

          {/* Buttons */}
          <div style={{ display: 'flex', gap: 8 }}>
            {currentStep > 0 && (
              <button onClick={goPrev}
                style={{ flex: 1, padding: 12, borderRadius: 12, background: 'rgba(255,255,255,.07)', color: '#6e7491', border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter,sans-serif' }}>
                ←
              </button>
            )}
            <button onClick={goNext}
              style={{ flex: 3, padding: 12, borderRadius: 12, background: '#00D764', color: '#000', border: 'none', fontSize: 14, fontWeight: 800, cursor: 'pointer', fontFamily: 'Inter,sans-serif' }}>
              {currentStep === TOUR_STEPS.length - 1 ? 'Começar a usar! 🚀' : 'Próximo →'}
            </button>
          </div>

          {/* Skip */}
          <button onClick={skip}
            style={{ display: 'block', width: '100%', marginTop: 12, padding: 6, background: 'none', border: 'none', color: '#4a4e6a', fontSize: 11, cursor: 'pointer', fontFamily: 'Inter,sans-serif' }}>
            Saltar tour
          </button>
        </div>
      </div>
    </>
  );
}
