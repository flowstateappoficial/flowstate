import React from 'react';
import useIsMobile from '../hooks/useIsMobile';

const WIDGETS = [
  { id: 'hero', label: 'Resumo do Mês', desc: 'Ganhos, gastos e saldo', icon: '💰', required: true },
  { id: 'performance', label: 'Performance Mensal', desc: 'Comparação com o mês anterior', icon: '📊' },
  { id: 'budget', label: 'Orçamento', desc: 'Limites por categoria', icon: '📋' },
  { id: 'goals', label: 'Objetivos de Poupança', desc: 'Objetivos secundários + dica diária', icon: '🎯' },
  { id: 'mainGoal', label: 'Objetivo Principal', desc: 'Progresso da meta principal', icon: '🏆' },
  { id: 'subscriptions', label: 'Subscrições', desc: 'Despesas recorrentes detetadas', icon: '🔄' },
  { id: 'gamification', label: 'Gamificação', desc: 'Streak, medalhas e nível', icon: '🏅' },
];


export default function DashboardSettings({ prefs, onUpdate, onClose }) {
  const isMobile = useIsMobile();
  const visible = prefs.visible || WIDGETS.map(w => w.id);

  const toggleWidget = (id) => {
    const widget = WIDGETS.find(w => w.id === id);
    if (widget?.required) return;
    const newVisible = visible.includes(id)
      ? visible.filter(v => v !== id)
      : [...visible, id];
    onUpdate({ ...prefs, visible: newVisible });
  };

  return (
    <>
      <div onClick={onClose} style={{
        position: 'fixed', inset: 0, background: 'rgba(10,13,24,.85)', zIndex: 8000
      }} />
      <div style={{
        position: 'fixed',
        top: isMobile ? 'auto' : '50%',
        bottom: isMobile ? 0 : 'auto',
        left: isMobile ? 0 : '50%',
        right: isMobile ? 0 : 'auto',
        transform: isMobile ? 'none' : 'translate(-50%,-50%)',
        zIndex: 8001,
        width: isMobile ? 'auto' : 520,
        maxHeight: isMobile ? '92vh' : '85vh',
        overflowY: 'auto',
        background: 'linear-gradient(180deg, #1a1f35 0%, #161a2e 100%)',
        borderRadius: isMobile ? '20px 20px 0 0' : 24,
        border: '1px solid rgba(255,255,255,.08)',
        boxShadow: '0 32px 80px rgba(0,0,0,.6)',
        padding: isMobile ? '20px 16px calc(24px + env(safe-area-inset-bottom, 0px))' : '28px 28px 20px',
        animation: 'settingsSlideIn .25s ease'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: isMobile ? 18 : 24, gap: 10 }}>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: isMobile ? 17 : 20, fontWeight: 800, color: '#fff' }}>Personalizar Dashboard</div>
            <div style={{ fontSize: isMobile ? 12 : 13, color: '#6e7491', marginTop: 4 }}>Escolhe o que queres ver e como</div>
          </div>
          <button onClick={onClose} style={{
            background: 'rgba(255,255,255,.06)', border: 'none', borderRadius: 10,
            width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#6e7491', fontSize: 16, cursor: 'pointer'
          }}>✕</button>
        </div>

        {/* Widget toggles */}
        <div>
          <div style={{ fontSize: 11, fontWeight: 800, color: '#4a5072', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 12 }}>
            Secções visíveis
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {WIDGETS.map(w => {
              const isOn = visible.includes(w.id);
              const isRequired = w.required;
              return (
                <div key={w.id} onClick={() => toggleWidget(w.id)} style={{
                  display: 'flex', alignItems: 'center', gap: isMobile ? 10 : 14,
                  padding: isMobile ? '10px 12px' : '12px 16px', borderRadius: 12,
                  background: isOn ? 'rgba(255,255,255,.04)' : 'transparent',
                  border: '1px solid ' + (isOn ? 'rgba(255,255,255,.06)' : 'transparent'),
                  cursor: isRequired ? 'default' : 'pointer',
                  opacity: isRequired ? 0.6 : 1,
                  transition: 'all .2s',
                  minWidth: 0
                }}>
                  <span style={{ fontSize: isMobile ? 18 : 22, flexShrink: 0 }}>{w.icon}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: isMobile ? 13 : 14, fontWeight: 700, color: isOn ? '#fff' : '#6e7491' }}>
                      {w.label}
                      {isRequired && <span style={{ fontSize: 10, color: '#4a5072', marginLeft: 8 }}>Obrigatório</span>}
                    </div>
                    <div style={{ fontSize: isMobile ? 11 : 12, color: '#4a5072' }}>{w.desc}</div>
                  </div>
                  {/* Toggle switch */}
                  <div style={{
                    width: 44, height: 24, borderRadius: 12, position: 'relative',
                    background: isOn ? 'rgba(0,215,100,.3)' : 'rgba(255,255,255,.1)',
                    transition: 'background .2s', flexShrink: 0
                  }}>
                    <div style={{
                      width: 18, height: 18, borderRadius: 9, position: 'absolute',
                      top: 3, left: isOn ? 23 : 3,
                      background: isOn ? '#00D764' : '#4a5072',
                      transition: 'all .2s', boxShadow: '0 1px 4px rgba(0,0,0,.3)'
                    }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,.06)', textAlign: 'center' }}>
          <button onClick={onClose} style={{
            padding: '12px 32px', borderRadius: 12, background: '#00D764',
            color: '#000', border: 'none', fontSize: 14, fontWeight: 800,
            cursor: 'pointer', fontFamily: 'Inter,sans-serif',
            boxShadow: '0 0 20px rgba(0,215,100,.3)'
          }}>
            Guardar
          </button>
        </div>
      </div>
      <style>{`@keyframes settingsSlideIn{from{opacity:0;transform:translate(-50%,-50%) scale(.95)}to{opacity:1;transform:translate(-50%,-50%) scale(1)}}`}</style>
    </>
  );
}

export { WIDGETS };
