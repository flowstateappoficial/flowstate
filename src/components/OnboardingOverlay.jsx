import React, { useState, useEffect } from 'react';
import { BUDGET_CATS } from '../utils/constants';

export default function OnboardingOverlay({ budget: initialBudget, rendimentoMensal: initialRendimento, onFinish, onClose }) {
  const [step, setStep] = useState(1);
  const [goal, setGoal] = useState(null);
  const [rendimento, setRendimento] = useState(initialRendimento || 0);
  const [localBudget, setLocalBudget] = useState({ ...initialBudget });

  const goStep = (s) => {
    if (s === 3) {
      // Build budget suggestions
      const r = rendimento;
      const newBudget = { ...localBudget };
      BUDGET_CATS.forEach(({ cat, pct }) => {
        if (!newBudget[cat]) newBudget[cat] = r > 0 ? Math.round(r * pct / 10) * 10 : 0;
      });
      setLocalBudget(newBudget);
    }
    setStep(s);
  };

  return (
    <div style={{ display: 'flex', position: 'fixed', inset: 0, background: 'rgba(10,13,24,.92)', zIndex: 9000, alignItems: 'center', justifyContent: 'center', padding: '1.5rem', fontFamily: 'Inter,system-ui,sans-serif' }}>
      <div style={{ background: '#202638', borderRadius: 24, width: '100%', maxWidth: 480, padding: '2.5rem 2rem', boxShadow: '0 32px 80px rgba(0,0,0,.6)', position: 'relative' }}>
        {/* Progress */}
        <div style={{ display: 'flex', gap: 6, marginBottom: '2rem' }}>
          {[1, 2, 3].map(s => (
            <div key={s} style={{ flex: 1, height: 3, borderRadius: 2, background: s <= step ? 'var(--accent)' : 'rgba(255,255,255,.12)', transition: 'background .3s' }} />
          ))}
        </div>

        {/* Step 1 */}
        {step === 1 && (
          <div>
            <div style={{ fontSize: '1.8rem', marginBottom: '.75rem' }}>🎯</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#fff', marginBottom: '.4rem' }}>Bem-vindo ao FLOWSTATE!</div>
            <div style={{ fontSize: 13, color: '#6e7491', marginBottom: '1.75rem', lineHeight: 1.6 }}>Vamos configurar a tua experiência em 3 passos. Qual é o teu objetivo principal agora?</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { k: 'poupar', label: '💰 Quero poupar mais todos os meses' },
                { k: 'investir', label: '📈 Quero começar a investir' },
                { k: 'controlar', label: '📊 Quero controlar melhor as minhas despesas' },
                { k: 'tudo', label: '🚀 Quero tudo — poupar, investir e controlar' },
              ].map(g => (
                <button key={g.k} className={`ob-goal-btn${goal === g.k ? ' selected' : ''}`} onClick={() => setGoal(g.k)}>
                  {g.label}
                </button>
              ))}
            </div>
            <button onClick={() => goStep(2)} disabled={!goal}
              style={{ width: '100%', marginTop: '1.5rem', padding: 13, borderRadius: 12, background: '#00D764', color: '#000', border: 'none', fontSize: 14, fontWeight: 800, cursor: 'pointer', fontFamily: 'Inter,sans-serif', opacity: goal ? 1 : .4, pointerEvents: goal ? 'auto' : 'none' }}>
              Continuar →
            </button>
          </div>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <div>
            <div style={{ fontSize: '1.8rem', marginBottom: '.75rem' }}>💼</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#fff', marginBottom: '.4rem' }}>Qual é o teu rendimento mensal?</div>
            <div style={{ fontSize: 13, color: '#6e7491', marginBottom: '1.75rem', lineHeight: 1.6 }}>Isto ajuda-nos a calcular o teu orçamento sugerido por categoria.</div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ fontSize: 10, fontWeight: 700, color: '#6e7491', textTransform: 'uppercase', letterSpacing: '.08em', display: 'block', marginBottom: 6 }}>Rendimento líquido mensal (€)</label>
              <input type="number" value={rendimento || ''} onChange={e => setRendimento(parseFloat(e.target.value) || 0)} placeholder="Ex: 1500" min="0" step="100"
                style={{ width: '100%', height: 48, padding: '0 16px', background: 'rgba(255,255,255,.07)', border: '1px solid rgba(255,255,255,.12)', borderRadius: 12, fontSize: 16, fontWeight: 600, color: '#fff', fontFamily: 'Inter,sans-serif', outline: 'none' }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, marginBottom: '1.5rem' }}>
              {[800, 1200, 1800, 2500].map(v => (
                <button key={v} className="ob-quick-btn" onClick={() => setRendimento(v)}>{v}€</button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => goStep(1)} style={{ flex: 1, padding: 13, borderRadius: 12, background: 'rgba(255,255,255,.07)', color: '#6e7491', border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter,sans-serif' }}>← Voltar</button>
              <button onClick={() => goStep(3)} style={{ flex: 2, padding: 13, borderRadius: 12, background: '#00D764', color: '#000', border: 'none', fontSize: 14, fontWeight: 800, cursor: 'pointer', fontFamily: 'Inter,sans-serif' }}>Continuar →</button>
            </div>
          </div>
        )}

        {/* Step 3 */}
        {step === 3 && (
          <div>
            <div style={{ fontSize: '1.8rem', marginBottom: '.75rem' }}>📋</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#fff', marginBottom: '.4rem' }}>Orçamento por categoria</div>
            <div style={{ fontSize: 13, color: '#6e7491', marginBottom: '1.25rem', lineHeight: 1.6 }}>Sugerimos limites com base no teu rendimento. Ajusta à tua realidade.</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 280, overflowY: 'auto', marginBottom: '1.25rem', paddingRight: 4 }}>
              {BUDGET_CATS.map(({ cat, emoji }) => (
                <div key={cat} className="budget-cat-row">
                  <span style={{ fontSize: '1.1rem', width: 24 }}>{emoji}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--t1)', flex: 1 }}>{cat}</span>
                  <input type="number" min="0" step="10" value={localBudget[cat] || ''}
                    onChange={e => setLocalBudget({ ...localBudget, [cat]: parseFloat(e.target.value) || 0 })}
                    placeholder="0 €"
                    style={{ width: 90, background: 'rgba(255,255,255,.07)', border: '1px solid var(--border)', borderRadius: 8, padding: '6px 10px', color: 'var(--t1)', fontFamily: 'var(--font)', fontSize: 13, fontWeight: 600, outline: 'none', textAlign: 'right' }} />
                  <span style={{ fontSize: 11, color: 'var(--t3)', width: 16 }}>€</span>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => goStep(2)} style={{ flex: 1, padding: 13, borderRadius: 12, background: 'rgba(255,255,255,.07)', color: '#6e7491', border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter,sans-serif' }}>← Voltar</button>
              <button onClick={() => onFinish(localBudget, rendimento)} style={{ flex: 2, padding: 13, borderRadius: 12, background: '#00D764', color: '#000', border: 'none', fontSize: 14, fontWeight: 800, cursor: 'pointer', fontFamily: 'Inter,sans-serif' }}>Começar a usar 🚀</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
