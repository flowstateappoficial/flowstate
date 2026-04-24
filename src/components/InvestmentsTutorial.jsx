import React, { useState } from 'react';
import useIsMobile from '../hooks/useIsMobile';

// Overlay de formação — explica o modelo de investimentos (valor atual vs
// investido vs valorização) e os 3 botões (+ Reforçar, − Retirar, 💰 Valor
// atual). Aparece automaticamente na primeira visita ao separador
// Investimentos e pode ser reaberto pelo botão "Como funciona?".

const SLIDES = [
  {
    emoji: '📊',
    titulo: 'Valor atual vs Investido',
    texto: 'Separamos duas coisas que a maioria das apps mistura: quanto tu investiste com o teu dinheiro (Investido) e quanto o ativo vale hoje no mercado (Valor atual). A diferença entre os dois é a tua valorização real.',
    highlight: 'Ex: investiste 1.000 €, o ativo vale hoje 1.250 € → valorização +25% (+250 €).',
  },
  {
    emoji: '➕',
    titulo: 'Botão "+ Reforçar"',
    texto: 'Usa quando metes dinheiro teu num ativo (compra nova). Sobe o Investido e o Valor atual em partes iguais — não gera valorização artificial.',
    highlight: 'Ex: tinhas 1.000 € investidos e reforçaste com 200 €. Ficas com 1.200 € investidos e 1.200 € de valor.',
  },
  {
    emoji: '➖',
    titulo: 'Botão "− Retirar"',
    texto: 'Usa quando retiras dinheiro do ativo (venda, resgate). Baixa o Investido e o Valor atual em partes iguais.',
    highlight: 'Ex: vendes 100 € do ativo. O Investido e o Valor atual descem ambos 100 €.',
  },
  {
    emoji: '💰',
    titulo: 'Botão "Valor atual do investimento"',
    texto: 'Usa quando o broker te mostra um valor diferente do último que registaste — é o mercado a mexer. Só o Valor atual muda; o Investido fica igual. É assim que a valorização aparece.',
    highlight: 'Ex: tens 1.000 € investidos e o broker mostra agora 1.080 € → a valorização passa a +8% (+80 €).',
  },
  {
    emoji: '✅',
    titulo: 'Pronto a começar',
    texto: 'Adiciona o teu primeiro ativo e regista os 3 tipos de acção sempre que fizeres uma mexida. Em qualquer momento podes reabrir este guia no botão "ℹ️ Como funciona?".',
    highlight: null,
  },
];

export default function InvestmentsTutorial({ onClose }) {
  const isMobile = useIsMobile();
  const [step, setStep] = useState(0);
  const slide = SLIDES[step];
  const isLast = step === SLIDES.length - 1;

  const next = () => { if (!isLast) setStep(s => s + 1); else onClose(); };
  const prev = () => { if (step > 0) setStep(s => s - 1); };

  return (
    <>
      <div onClick={onClose} style={{
        position: 'fixed', inset: 0, background: 'rgba(10,13,24,.88)', zIndex: 9000,
        backdropFilter: 'blur(4px)'
      }} />
      <div style={{
        position: 'fixed',
        top: isMobile ? 'auto' : '50%',
        bottom: isMobile ? 0 : 'auto',
        left: isMobile ? 0 : '50%',
        right: isMobile ? 0 : 'auto',
        transform: isMobile ? 'none' : 'translate(-50%,-50%)',
        zIndex: 9001,
        width: isMobile ? 'auto' : 520,
        maxWidth: isMobile ? 'none' : '92vw',
        maxHeight: isMobile ? '92vh' : '85vh',
        overflowY: 'auto',
        background: 'linear-gradient(180deg, #1a1f35 0%, #161a2e 100%)',
        borderRadius: isMobile ? '20px 20px 0 0' : 20,
        border: '1px solid rgba(255,255,255,.08)',
        boxShadow: '0 32px 80px rgba(0,0,0,.6)',
        padding: isMobile ? '22px 18px calc(26px + env(safe-area-inset-bottom, 0px))' : '28px 28px 22px',
        fontFamily: 'var(--font)'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--accent)', letterSpacing: '.12em', textTransform: 'uppercase' }}>
            Como funcionam os investimentos
          </div>
          <button onClick={onClose} style={{
            background: 'rgba(255,255,255,.06)', border: 'none', borderRadius: 10,
            width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--t3)', fontSize: 16, cursor: 'pointer'
          }} aria-label="Fechar">✕</button>
        </div>

        {/* Slide */}
        <div style={{ textAlign: 'center', padding: '8px 0 20px' }}>
          <div style={{ fontSize: 48, marginBottom: 14 }}>{slide.emoji}</div>
          <div style={{ fontSize: isMobile ? 18 : 20, fontWeight: 800, color: 'var(--t1)', marginBottom: 10 }}>
            {slide.titulo}
          </div>
          <div style={{ fontSize: 13, color: 'var(--t2)', lineHeight: 1.65, marginBottom: 14, textAlign: 'left' }}>
            {slide.texto}
          </div>
          {slide.highlight && (
            <div style={{
              background: 'rgba(0,215,100,.06)',
              border: '1px solid rgba(0,215,100,.18)',
              borderRadius: 10, padding: '10px 14px',
              fontSize: 12, color: 'var(--t2)', lineHeight: 1.6,
              textAlign: 'left'
            }}>
              {slide.highlight}
            </div>
          )}
        </div>

        {/* Dots */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 18 }}>
          {SLIDES.map((_, i) => (
            <div key={i} style={{
              width: i === step ? 22 : 7, height: 7, borderRadius: 4,
              background: i === step ? 'var(--accent)' : 'rgba(255,255,255,.15)',
              transition: 'all .25s'
            }} />
          ))}
        </div>

        {/* Nav buttons */}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'space-between' }}>
          <button onClick={prev} disabled={step === 0} style={{
            padding: '10px 18px', borderRadius: 10,
            background: 'rgba(255,255,255,.05)',
            border: '1px solid rgba(255,255,255,.08)',
            color: step === 0 ? 'var(--t3)' : 'var(--t2)',
            opacity: step === 0 ? 0.4 : 1,
            fontSize: 13, fontWeight: 700,
            cursor: step === 0 ? 'default' : 'pointer',
            fontFamily: 'var(--font)'
          }}>← Anterior</button>
          <button onClick={next} style={{
            padding: '10px 22px', borderRadius: 10,
            background: 'var(--accent)', color: '#000',
            border: 'none', fontSize: 13, fontWeight: 800,
            cursor: 'pointer', fontFamily: 'var(--font)',
            boxShadow: '0 0 18px rgba(0,215,100,.28)'
          }}>{isLast ? 'Começar' : 'Seguinte →'}</button>
        </div>
      </div>
    </>
  );
}
