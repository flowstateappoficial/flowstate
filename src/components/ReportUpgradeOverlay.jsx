import React from 'react';

export default function ReportUpgradeOverlay({ type, onClose, onViewPlans }) {
  const isPlusGate = type === 'needPlus';

  return (
    <div onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(10,13,24,.88)',
        zIndex: 8000, display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '1.5rem'
      }}>
      <div style={{
        background: 'linear-gradient(180deg, #1e2340 0%, #181c30 100%)',
        borderRadius: 24, maxWidth: 440, width: '100%',
        padding: '2.5rem 2rem', textAlign: 'center',
        boxShadow: '0 32px 80px rgba(0,0,0,.6)',
        border: '1px solid rgba(255,255,255,.06)'
      }}>
        {/* Icon */}
        <div style={{
          width: 64, height: 64, borderRadius: 20, margin: '0 auto 1.2rem',
          background: isPlusGate
            ? 'linear-gradient(135deg, rgba(0,215,100,.15) 0%, rgba(0,215,100,.05) 100%)'
            : 'linear-gradient(135deg, rgba(123,127,255,.15) 0%, rgba(123,127,255,.05) 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 28
        }}>
          📊
        </div>

        {/* Title */}
        <div style={{ fontSize: 20, fontWeight: 800, color: '#fff', marginBottom: 8 }}>
          {isPlusGate ? 'Relatório Mensal Completo' : 'Exportação PDF'}
        </div>

        {/* Description */}
        <div style={{ fontSize: 13, color: '#6e7491', marginBottom: '1.5rem', lineHeight: 1.7 }}>
          {isPlusGate ? (
            <>
              O relatório financeiro completo com análise detalhada de categorias, subscrições e objetivos está disponível no plano{' '}
              <strong style={{ color: '#00D764' }}>Flow Plus</strong>.
              <br /><br />
              Experimenta grátis durante <strong style={{ color: '#00D764' }}>7 dias</strong>, sem cartão de crédito.
            </>
          ) : (
            <>
              A exportação para PDF está disponível no plano{' '}
              <strong style={{ color: '#7b7fff' }}>Flow Max</strong>.
              <br /><br />
              Guarda e partilha os teus relatórios financeiros em formato profissional.
            </>
          )}
        </div>

        {/* Feature preview (only for free users) */}
        {isPlusGate && (
          <div style={{
            background: 'rgba(255,255,255,.03)', borderRadius: 14,
            padding: '14px 16px', marginBottom: '1.5rem', textAlign: 'left',
            border: '1px solid rgba(255,255,255,.05)'
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#4a5072', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 }}>
              Incluído no relatório
            </div>
            {[
              { icon: '📈', text: 'KPIs com comparação mensal' },
              { icon: '🎯', text: 'Taxa de poupança com análise visual' },
              { icon: '📋', text: 'Despesas por categoria com progresso' },
              { icon: '🔄', text: 'Subscrições e custos recorrentes' },
              { icon: '🏆', text: 'Progresso dos objetivos financeiros' },
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '5px 0' }}>
                <span style={{ fontSize: 14 }}>{item.icon}</span>
                <span style={{ fontSize: 12, color: '#b8bfda' }}>{item.text}</span>
              </div>
            ))}
          </div>
        )}

        {/* Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button onClick={onViewPlans}
            style={{
              width: '100%', padding: 14, borderRadius: 12, border: 'none',
              fontFamily: 'Inter,sans-serif', fontSize: 14, fontWeight: 800, cursor: 'pointer',
              background: isPlusGate
                ? 'linear-gradient(135deg, #00D764 0%, #00b856 100%)'
                : 'linear-gradient(135deg, #7b7fff 0%, #6366f1 100%)',
              color: isPlusGate ? '#000' : '#fff',
              boxShadow: isPlusGate
                ? '0 0 24px rgba(0,215,100,.3)'
                : '0 0 24px rgba(123,127,255,.3)'
            }}>
            Ver planos →
          </button>
          <button onClick={onClose}
            style={{
              width: '100%', padding: 12, borderRadius: 12,
              background: 'rgba(255,255,255,.06)', color: '#6e7491',
              border: 'none', fontFamily: 'Inter,sans-serif',
              fontSize: 13, fontWeight: 600, cursor: 'pointer'
            }}>
            Agora não
          </button>
        </div>
      </div>
    </div>
  );
}
