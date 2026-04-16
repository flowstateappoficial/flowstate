import React, { useState, useEffect } from 'react';
import { BADGE_DEFS, loadBadges, calcFinancialLevel } from '../utils/gamification';

export default function GamificationCard({ streak, badges, newBadges }) {
  const [showAll, setShowAll] = useState(false);
  const [flashBadge, setFlashBadge] = useState(null);

  const level = calcFinancialLevel(badges);
  const unlockedIds = Object.keys(badges);
  const unlockedDefs = BADGE_DEFS.filter(b => unlockedIds.includes(b.id));
  const lockedDefs = BADGE_DEFS.filter(b => !unlockedIds.includes(b.id));

  // Flash animation para novos badges
  useEffect(() => {
    if (newBadges && newBadges.length > 0) {
      setFlashBadge(newBadges[0]);
      const timer = setTimeout(() => setFlashBadge(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [newBadges]);

  return (
    <>
      {/* Toast de novo badge */}
      {flashBadge && (() => {
        const def = BADGE_DEFS.find(b => b.id === flashBadge);
        if (!def) return null;
        return (
          <div style={{
            position: 'fixed', top: 20, right: 20, zIndex: 9999,
            background: 'linear-gradient(135deg, #1c2033 0%, #252a3a 100%)',
            border: '1.5px solid var(--accent)',
            borderRadius: 16, padding: '16px 22px',
            display: 'flex', alignItems: 'center', gap: 14,
            boxShadow: '0 8px 32px rgba(0,215,100,.25)',
            animation: 'slideIn .4s ease'
          }}>
            <span style={{ fontSize: 32 }}>{def.emoji}</span>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '.08em' }}>Nova Conquista!</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginTop: 2 }}>{def.nome}</div>
              <div style={{ fontSize: 12, color: 'var(--t3)', marginTop: 1 }}>{def.desc}</div>
            </div>
          </div>
        );
      })()}

      {/* Card principal */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <div className="card-title" style={{ marginBottom: 14 }}>🏅 Progresso Financeiro</div>

        {/* Streak + Nível lado a lado */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
          {/* Streak */}
          <div style={{
            background: 'var(--card-hover)', borderRadius: 12, padding: '14px 16px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: 28, lineHeight: 1 }}>🔥</div>
            <div style={{
              fontSize: 26, fontWeight: 800, color: streak.current >= 7 ? 'var(--accent)' : '#fff',
              marginTop: 4
            }}>
              {streak.current}
            </div>
            <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 2 }}>
              {streak.current === 1 ? 'dia seguido' : 'dias seguidos'}
            </div>
            {streak.best > streak.current && (
              <div style={{ fontSize: 10, color: 'var(--t3)', marginTop: 4, opacity: .7 }}>
                Recorde: {streak.best} dias
              </div>
            )}
          </div>

          {/* Nível */}
          <div style={{
            background: 'var(--card-hover)', borderRadius: 12, padding: '14px 16px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: 28, lineHeight: 1 }}>⭐</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#fff', marginTop: 4 }}>
              Nível {level.level}
            </div>
            <div style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 700, marginTop: 2 }}>
              {level.title}
            </div>
            <div style={{
              height: 4, background: 'rgba(255,255,255,.08)', borderRadius: 2,
              marginTop: 8, overflow: 'hidden'
            }}>
              <div style={{
                height: '100%', background: 'var(--accent)', borderRadius: 2,
                width: level.progress + '%', transition: 'width .6s ease'
              }} />
            </div>
            <div style={{ fontSize: 10, color: 'var(--t3)', marginTop: 4 }}>
              {level.unlocked || 0}/{level.total || BADGE_DEFS.length} conquistas
            </div>
          </div>
        </div>

        {/* Badges desbloqueados */}
        {unlockedDefs.length > 0 && (
          <>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--t2)', marginBottom: 8 }}>
              Conquistas desbloqueadas
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: lockedDefs.length > 0 ? 12 : 0 }}>
              {unlockedDefs.map(b => (
                <div key={b.id} title={b.nome + ': ' + b.desc} style={{
                  background: 'var(--card-hover)', borderRadius: 10,
                  padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 8,
                  border: newBadges?.includes(b.id) ? '1.5px solid var(--accent)' : '1px solid transparent',
                  transition: 'all .3s ease'
                }}>
                  <span style={{ fontSize: 18 }}>{b.emoji}</span>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>{b.nome}</div>
                    <div style={{ fontSize: 10, color: 'var(--t3)' }}>{b.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Badges bloqueados (toggle) */}
        {lockedDefs.length > 0 && (
          <>
            <button onClick={() => setShowAll(!showAll)} style={{
              background: 'none', border: 'none', color: 'var(--accent)',
              fontSize: 12, fontWeight: 700, cursor: 'pointer',
              fontFamily: 'var(--font)', padding: 0
            }}>
              {showAll ? '▲ Esconder bloqueadas' : `▼ Ver ${lockedDefs.length} conquistas por desbloquear`}
            </button>

            {showAll && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
                {lockedDefs.map(b => (
                  <div key={b.id} title={b.desc} style={{
                    background: 'var(--card-hover)', borderRadius: 10,
                    padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 8,
                    opacity: .4
                  }}>
                    <span style={{ fontSize: 18, filter: 'grayscale(1)' }}>{b.emoji}</span>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--t3)' }}>{b.nome}</div>
                      <div style={{ fontSize: 10, color: 'var(--t3)' }}>???</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* CSS animation for toast */}
      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100px); opacity: 0; }
          to   { transform: translateX(0);     opacity: 1; }
        }
      `}</style>
    </>
  );
}
