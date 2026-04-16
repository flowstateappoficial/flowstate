import React, { useState, useEffect, useCallback } from 'react';

function ProgressBar({ total, current }) {
  return (
    <div style={{ display: 'flex', gap: 4, padding: '16px 24px 0' }}>
      {Array.from({ length: total }, (_, i) => (
        <div key={i} style={{
          flex: 1, height: 3, borderRadius: 2,
          background: i <= current ? 'rgba(255,255,255,.9)' : 'rgba(255,255,255,.2)',
          transition: 'background .3s'
        }} />
      ))}
    </div>
  );
}

function SlideIntro({ slide }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', textAlign: 'center', padding: '0 40px' }}>
      <div style={{ fontSize: 64, marginBottom: 20, animation: 'wrappedPop .6s ease' }}>✨</div>
      <div style={{ fontSize: 48, fontWeight: 900, color: '#fff', lineHeight: 1.1, marginBottom: 12, animation: 'wrappedFadeUp .6s ease .1s both' }}>{slide.title}</div>
      <div style={{ fontSize: 28, fontWeight: 300, color: slide.accent, marginBottom: 24, animation: 'wrappedFadeUp .6s ease .2s both' }}>{slide.subtitle}</div>
      <div style={{ fontSize: 16, color: 'rgba(255,255,255,.6)', lineHeight: 1.6, maxWidth: 400, animation: 'wrappedFadeUp .6s ease .3s both' }}>{slide.content}</div>
    </div>
  );
}

function SlideTotals({ slide }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', textAlign: 'center', padding: '0 40px' }}>
      <div style={{ fontSize: 24, fontWeight: 800, color: '#fff', marginBottom: 40, animation: 'wrappedFadeUp .5s ease both' }}>{slide.title}</div>
      {slide.stats.map((s, i) => (
        <div key={i} style={{ marginBottom: 28, animation: `wrappedFadeUp .5s ease ${.1 + i * .15}s both` }}>
          <div style={{ fontSize: 14, color: 'rgba(255,255,255,.5)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.15em', marginBottom: 6 }}>{s.label}</div>
          <div style={{ fontSize: 42, fontWeight: 900, color: s.color || '#fff' }}>{s.val}</div>
        </div>
      ))}
      {slide.footer && <div style={{ fontSize: 14, color: 'rgba(255,255,255,.4)', marginTop: 20, animation: 'wrappedFadeUp .5s ease .6s both' }}>{slide.footer}</div>}
    </div>
  );
}

function SlideHighlight({ slide }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', textAlign: 'center', padding: '0 40px' }}>
      <div style={{ fontSize: 64, marginBottom: 16, animation: 'wrappedPop .6s ease' }}>{slide.emoji}</div>
      <div style={{ fontSize: 18, fontWeight: 600, color: 'rgba(255,255,255,.5)', textTransform: 'uppercase', letterSpacing: '.15em', marginBottom: 12, animation: 'wrappedFadeUp .5s ease .1s both' }}>{slide.title}</div>
      <div style={{ fontSize: 48, fontWeight: 900, color: slide.accent, marginBottom: 16, animation: 'wrappedFadeUp .5s ease .2s both' }}>{slide.highlight}</div>
      <div style={{ fontSize: 16, color: 'rgba(255,255,255,.6)', lineHeight: 1.6, maxWidth: 380, animation: 'wrappedFadeUp .5s ease .3s both' }}>{slide.content}</div>
    </div>
  );
}

function SlideCategories({ slide }) {
  const colors = ['#00D764', '#7b7fff', '#ff6b6b', '#ffb347', '#e056a0'];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', padding: '0 40px' }}>
      <div style={{ fontSize: 18, fontWeight: 600, color: 'rgba(255,255,255,.5)', textTransform: 'uppercase', letterSpacing: '.15em', marginBottom: 32, animation: 'wrappedFadeUp .5s ease both' }}>{slide.title}</div>
      {(slide.categories || []).map((c, i) => (
        <div key={i} style={{
          display: 'flex', alignItems: 'center', gap: 16, width: '100%', maxWidth: 380,
          marginBottom: 16, animation: `wrappedFadeUp .4s ease ${.1 + i * .1}s both`
        }}>
          <div style={{ fontSize: 32, fontWeight: 900, color: colors[i % colors.length], width: 40, textAlign: 'right' }}>#{i + 1}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>{c.cat}</div>
            <div style={{ height: 6, background: 'rgba(255,255,255,.1)', borderRadius: 3, marginTop: 6, overflow: 'hidden' }}>
              <div style={{ height: '100%', borderRadius: 3, background: colors[i % colors.length], width: c.pct + '%', transition: 'width 1s ease .5s' }} />
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: colors[i % colors.length] }}>{c.pct}%</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function SlideEvolution({ slide }) {
  const chart = slide.chart || [];
  const maxVal = Math.max(...chart.map(m => Math.max(m.in, m.out)), 1);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', padding: '0 32px' }}>
      <div style={{ fontSize: 18, fontWeight: 600, color: 'rgba(255,255,255,.5)', textTransform: 'uppercase', letterSpacing: '.15em', marginBottom: 32, animation: 'wrappedFadeUp .5s ease both' }}>{slide.title}</div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, width: '100%', maxWidth: 440, height: 180, animation: 'wrappedFadeUp .5s ease .2s both' }}>
        {chart.map((m, i) => (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
            <div style={{ width: '100%', display: 'flex', gap: 2, alignItems: 'flex-end', height: 140 }}>
              <div style={{ flex: 1, borderRadius: '3px 3px 0 0', background: '#00D764', height: Math.max(4, (m.in / maxVal) * 140), transition: `height 1s ease ${.3 + i * .05}s`, opacity: .7 }} />
              <div style={{ flex: 1, borderRadius: '3px 3px 0 0', background: '#ff6b6b', height: Math.max(4, (m.out / maxVal) * 140), transition: `height 1s ease ${.3 + i * .05}s`, opacity: .7 }} />
            </div>
            <div style={{ fontSize: 9, color: 'rgba(255,255,255,.4)', fontWeight: 700 }}>{m.month}</div>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 20, marginTop: 20, animation: 'wrappedFadeUp .5s ease .4s both' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><div style={{ width: 10, height: 10, borderRadius: 2, background: '#00D764' }} /><span style={{ fontSize: 11, color: 'rgba(255,255,255,.5)' }}>Rendimentos</span></div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><div style={{ width: 10, height: 10, borderRadius: 2, background: '#ff6b6b' }} /><span style={{ fontSize: 11, color: 'rgba(255,255,255,.5)' }}>Despesas</span></div>
      </div>
      {slide.footer && <div style={{ fontSize: 13, color: 'rgba(255,255,255,.4)', marginTop: 20, textAlign: 'center', animation: 'wrappedFadeUp .5s ease .5s both' }}>{slide.footer}</div>}
    </div>
  );
}

function SlideProfile({ slide }) {
  const p = slide.profile;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', textAlign: 'center', padding: '0 40px' }}>
      <div style={{ fontSize: 80, marginBottom: 20, animation: 'wrappedPop .6s ease' }}>{p.emoji}</div>
      <div style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,.4)', textTransform: 'uppercase', letterSpacing: '.2em', marginBottom: 12, animation: 'wrappedFadeUp .5s ease .1s both' }}>{slide.title}</div>
      <div style={{ fontSize: 36, fontWeight: 900, color: slide.accent, marginBottom: 16, animation: 'wrappedFadeUp .5s ease .2s both' }}>{p.title}</div>
      <div style={{ fontSize: 16, color: 'rgba(255,255,255,.5)', lineHeight: 1.6, maxWidth: 360, animation: 'wrappedFadeUp .5s ease .3s both' }}>{p.desc}</div>
    </div>
  );
}

function SlideSummary({ slide, onShare }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', textAlign: 'center', padding: '0 40px' }}>
      <div style={{ fontSize: 20, fontWeight: 800, color: '#fff', marginBottom: 32, animation: 'wrappedFadeUp .5s ease both' }}>{slide.title}</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, width: '100%', maxWidth: 340, marginBottom: 32 }}>
        {(slide.stats || []).map((s, i) => (
          <div key={i} style={{
            background: 'rgba(255,255,255,.06)', borderRadius: 16, padding: '18px 14px',
            border: '1px solid rgba(255,255,255,.08)',
            animation: `wrappedFadeUp .4s ease ${.1 + i * .1}s both`
          }}>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,.4)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontSize: 20, fontWeight: 900, color: '#fff' }}>{s.val}</div>
          </div>
        ))}
      </div>
      <button onClick={onShare} style={{
        background: 'linear-gradient(135deg, #00D764 0%, #00b856 100%)',
        border: 'none', borderRadius: 14, padding: '14px 32px',
        color: '#000', fontSize: 15, fontWeight: 800, cursor: 'pointer',
        fontFamily: 'Inter,sans-serif', boxShadow: '0 0 30px rgba(0,215,100,.3)',
        animation: 'wrappedFadeUp .5s ease .5s both'
      }}>
        📤 Partilhar o meu Wrapped
      </button>
      <div style={{ fontSize: 12, color: 'rgba(255,255,255,.3)', marginTop: 16, animation: 'wrappedFadeUp .5s ease .6s both' }}>{slide.footer}</div>
    </div>
  );
}

// ── MAIN COMPONENT ──
export default function WrappedStories({ slides, onClose }) {
  const [current, setCurrent] = useState(0);
  const total = slides.length;

  const goNext = useCallback(() => {
    if (current < total - 1) setCurrent(c => c + 1);
    else onClose();
  }, [current, total, onClose]);

  const goPrev = useCallback(() => {
    if (current > 0) setCurrent(c => c - 1);
  }, [current]);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'ArrowRight' || e.key === ' ') goNext();
      if (e.key === 'ArrowLeft') goPrev();
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [goNext, goPrev, onClose]);

  const slide = slides[current];

  const handleShare = () => {
    const text = `O meu Flowstate Wrapped ${slide.stats?.map(s => `${s.label}: ${s.val}`).join(' · ') || ''}`;
    if (navigator.share) navigator.share({ title: 'Flowstate Wrapped', text }).catch(() => {});
    else navigator.clipboard.writeText(text).catch(() => {});
  };

  const renderSlide = () => {
    switch (slide.id) {
      case 'intro': return <SlideIntro slide={slide} />;
      case 'totals': case 'summary': return slide.id === 'summary'
        ? <SlideSummary slide={slide} onShare={handleShare} />
        : <SlideTotals slide={slide} />;
      case 'bestMonth': case 'expensiveDay': case 'frequentExpense': case 'goals':
        return <SlideHighlight slide={slide} />;
      case 'topCategories': return <SlideCategories slide={slide} />;
      case 'evolution': return <SlideEvolution slide={slide} />;
      case 'profile': return <SlideProfile slide={slide} />;
      default: return <SlideHighlight slide={slide} />;
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: slide.bg || '#0f1220',
      display: 'flex', flexDirection: 'column',
      fontFamily: 'Inter, system-ui, sans-serif',
      transition: 'background .5s ease',
      overflow: 'hidden'
    }}>
      {/* Progress */}
      <ProgressBar total={total} current={current} />

      {/* Close button */}
      <button onClick={onClose} style={{
        position: 'absolute', top: 28, right: 24, zIndex: 10,
        background: 'rgba(255,255,255,.1)', border: 'none', borderRadius: 10,
        width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#fff', fontSize: 16, cursor: 'pointer'
      }}>✕</button>

      {/* Slide content */}
      <div key={current} style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {renderSlide()}
      </div>

      {/* Tap zones */}
      <div onClick={goPrev} style={{ position: 'absolute', left: 0, top: 60, bottom: 0, width: '30%', cursor: 'pointer' }} />
      <div onClick={goNext} style={{ position: 'absolute', right: 0, top: 60, bottom: 0, width: '70%', cursor: 'pointer' }} />

      {/* Navigation hint */}
      <div style={{ textAlign: 'center', padding: '12px 0 20px', fontSize: 11, color: 'rgba(255,255,255,.2)' }}>
        {current + 1}/{total} · Toca para avançar
      </div>

      <style>{`
        @keyframes wrappedFadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        @keyframes wrappedPop{0%{transform:scale(0);opacity:0}60%{transform:scale(1.2)}100%{transform:scale(1);opacity:1}}
      `}</style>
    </div>
  );
}
