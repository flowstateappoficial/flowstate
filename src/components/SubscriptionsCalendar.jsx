import React, { useMemo, useState } from 'react';
import useIsMobile from '../hooks/useIsMobile';
import { PT_MESES, SUB_CATEGORIES, SUB_CADENCES } from '../utils/constants';
import {
  getActiveSubs,
  isPaidInPeriod,
  getPeriodKey
} from '../utils/subscriptions';

const DAY_LABELS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

const cadenceShort = id => ({ monthly: 'M', quarterly: 'T', semiannual: 'S', annual: 'A' }[id] || 'M');
const categoryColor = id => (SUB_CATEGORIES.find(c => c.id === id) || SUB_CATEGORIES[1]).color;

/**
 * Para uma sub, devolve true se cai no `month`/`year` apresentado.
 * - monthly: cai todos os meses
 * - quarterly: cai nos meses 1,4,7,10 do calendário (alinhado a trimestres civis)
 * - semiannual: cai em Janeiro e Julho
 * - annual: cai em Janeiro
 *
 * Nota: Sem campo "anchor month" guardado, usamos defaults de calendário civil PT.
 * Se quiseres customizar (ex: anuidade do cartão em Setembro), edita a sub e altera o dia.
 */
function fallsInMonth(sub, year, month /* 0-based */) {
  const m = month + 1; // 1..12
  switch (sub.cadence) {
    case 'monthly':    return true;
    case 'quarterly':  return [1, 4, 7, 10].includes(m);
    case 'semiannual': return [1, 7].includes(m);
    case 'annual':     return m === 1;
    default:           return true;
  }
}

/** Garante o dia dentro do mês (Feb 31 → Feb 28/29) */
function clampDay(day, year, month) {
  const lastDay = new Date(year, month + 1, 0).getDate();
  return Math.min(Math.max(1, day || 1), lastDay);
}

/** Dia da semana com Mon=0, Sun=6 (PT-style) */
function dowMondayFirst(date) {
  const d = date.getDay(); // Sun=0..Sat=6
  return (d + 6) % 7;
}

export default function SubscriptionsCalendar({ subs, onMarkPaid, onUnmarkPaid, onOpenSub, fmtV }) {
  const isMobile = useIsMobile();
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState(null);

  const active = useMemo(() => getActiveSubs(subs || []), [subs]);

  // Subs que caem neste mês
  const subsThisMonth = useMemo(
    () => active.filter(s => fallsInMonth(s, viewYear, viewMonth)),
    [active, viewYear, viewMonth]
  );

  // Mapa: dia → array de subs
  const byDay = useMemo(() => {
    const m = {};
    for (const s of subsThisMonth) {
      const d = clampDay(s.dayOfPeriod, viewYear, viewMonth);
      (m[d] = m[d] || []).push(s);
    }
    return m;
  }, [subsThisMonth, viewYear, viewMonth]);

  // Total previsto este mês
  const monthTotal = useMemo(
    () => subsThisMonth.reduce((sum, s) => sum + (s.defaultAmount || 0), 0),
    [subsThisMonth]
  );

  // Total já pago este mês
  const monthPaid = useMemo(() => {
    let sum = 0;
    for (const s of subsThisMonth) {
      const pk = getPeriodKey(new Date(viewYear, viewMonth, 1), s.cadence);
      const p = s.payments?.[pk];
      if (p) sum += p.amount;
    }
    return sum;
  }, [subsThisMonth, viewYear, viewMonth]);

  // Build grid: array de células (algumas vazias antes do dia 1, algumas vazias depois)
  const firstDay = new Date(viewYear, viewMonth, 1);
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const startOffset = dowMondayFirst(firstDay);
  const totalCells = Math.ceil((startOffset + daysInMonth) / 7) * 7;
  const cells = [];
  for (let i = 0; i < totalCells; i++) {
    const dayNum = i - startOffset + 1;
    if (dayNum < 1 || dayNum > daysInMonth) {
      cells.push(null);
    } else {
      cells.push(dayNum);
    }
  }

  const goPrevMonth = () => {
    const m = viewMonth - 1;
    if (m < 0) { setViewMonth(11); setViewYear(viewYear - 1); }
    else setViewMonth(m);
    setSelectedDay(null);
  };
  const goNextMonth = () => {
    const m = viewMonth + 1;
    if (m > 11) { setViewMonth(0); setViewYear(viewYear + 1); }
    else setViewMonth(m);
    setSelectedDay(null);
  };
  const goToday = () => {
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
    setSelectedDay(today.getDate());
  };

  const isToday = (dayNum) =>
    dayNum === today.getDate() &&
    viewMonth === today.getMonth() &&
    viewYear === today.getFullYear();

  const periodKeyForCellSub = (sub) =>
    getPeriodKey(new Date(viewYear, viewMonth, 1), sub.cadence);

  // ─────────────────────────────────────────────────────────────────────
  return (
    <div>
      {/* Header com nav */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 14,
        flexWrap: 'wrap',
        gap: 10
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button onClick={goPrevMonth} style={navBtn} aria-label="Mês anterior">‹</button>
          <button onClick={goToday} style={{
            ...navBtn,
            padding: '6px 12px',
            fontSize: 12,
            fontWeight: 700
          }}>Hoje</button>
          <button onClick={goNextMonth} style={navBtn} aria-label="Mês seguinte">›</button>
        </div>
        <div style={{
          fontSize: isMobile ? 16 : 18,
          fontWeight: 800,
          color: 'var(--t1)',
          letterSpacing: '-.01em'
        }}>
          {PT_MESES[viewMonth]} {viewYear}
        </div>
        <div style={{ fontSize: 12, color: 'var(--t3)', textAlign: 'right' }}>
          <div>Previsto: <strong style={{ color: 'var(--t1)' }}>{fmtV(monthTotal)}</strong></div>
          <div>Pago: <strong style={{ color: '#00D764' }}>{fmtV(monthPaid)}</strong></div>
        </div>
      </div>

      {/* Headers dos dias */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          background: 'rgba(0,0,0,.2)',
          borderBottom: '1px solid rgba(255,255,255,.06)'
        }}>
          {DAY_LABELS.map(d => (
            <div key={d} style={{
              padding: '8px 4px',
              textAlign: 'center',
              fontSize: 10.5,
              fontWeight: 800,
              color: 'var(--t3)',
              textTransform: 'uppercase',
              letterSpacing: '.08em'
            }}>{d}</div>
          ))}
        </div>

        {/* Grid de dias */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gridAutoRows: isMobile ? 'minmax(60px, auto)' : 'minmax(80px, auto)'
        }}>
          {cells.map((dayNum, i) => {
            if (dayNum == null) {
              return <div key={i} style={{
                background: 'rgba(0,0,0,.08)',
                borderRight: (i % 7 < 6) ? '1px solid rgba(255,255,255,.04)' : 'none',
                borderBottom: '1px solid rgba(255,255,255,.04)'
              }} />;
            }
            const daySubs = byDay[dayNum] || [];
            const todayCell = isToday(dayNum);
            const selected = selectedDay === dayNum;
            return (
              <button
                key={i}
                onClick={() => setSelectedDay(daySubs.length > 0 ? dayNum : null)}
                style={{
                  background: selected
                    ? 'rgba(0,215,100,.10)'
                    : todayCell
                      ? 'rgba(0,215,100,.04)'
                      : 'transparent',
                  border: 'none',
                  borderRight: (i % 7 < 6) ? '1px solid rgba(255,255,255,.04)' : 'none',
                  borderBottom: '1px solid rgba(255,255,255,.04)',
                  padding: 6,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  gap: 4,
                  cursor: daySubs.length > 0 ? 'pointer' : 'default',
                  fontFamily: 'var(--font)',
                  position: 'relative',
                  transition: 'background .12s ease',
                  textAlign: 'left'
                }}
              >
                <div style={{
                  fontSize: 11,
                  fontWeight: todayCell ? 800 : 600,
                  color: todayCell ? '#00D764' : daySubs.length > 0 ? 'var(--t1)' : 'var(--t3)',
                  alignSelf: 'flex-end'
                }}>{dayNum}</div>

                {/* Indicadores das subs neste dia */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2, width: '100%' }}>
                  {daySubs.slice(0, isMobile ? 2 : 3).map(s => {
                    const pk = periodKeyForCellSub(s);
                    const paid = isPaidInPeriod(s, pk);
                    return (
                      <div key={s.id} style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 3,
                        padding: '2px 4px',
                        borderRadius: 4,
                        background: paid ? 'rgba(0,215,100,.15)' : `${categoryColor(s.category)}1A`,
                        border: `1px solid ${paid ? 'rgba(0,215,100,.3)' : categoryColor(s.category) + '33'}`,
                        fontSize: 9.5,
                        color: paid ? '#00D764' : 'var(--t2)',
                        opacity: paid ? 0.85 : 1,
                        textDecoration: paid ? 'line-through' : 'none',
                        overflow: 'hidden',
                        whiteSpace: 'nowrap'
                      }}>
                        <span style={{ fontSize: 10, flexShrink: 0 }}>{s.emoji}</span>
                        <span style={{
                          fontWeight: 700,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          flex: 1
                        }}>{isMobile ? '' : s.name}</span>
                      </div>
                    );
                  })}
                  {daySubs.length > (isMobile ? 2 : 3) && (
                    <div style={{
                      fontSize: 9,
                      color: 'var(--t3)',
                      paddingLeft: 4,
                      fontWeight: 700
                    }}>+{daySubs.length - (isMobile ? 2 : 3)} mais</div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Painel detalhes do dia seleccionado */}
      {selectedDay && byDay[selectedDay]?.length > 0 && (
        <div style={{
          marginTop: 16,
          background: 'linear-gradient(145deg, rgba(0,215,100,.06), rgba(0,215,100,.02))',
          border: '1px solid rgba(0,215,100,.18)',
          borderRadius: 14,
          padding: isMobile ? '14px 16px' : '18px 22px'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'baseline',
            justifyContent: 'space-between',
            marginBottom: 12,
            gap: 10
          }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--t1)' }}>
              {selectedDay} de {PT_MESES[viewMonth]}
            </div>
            <button onClick={() => setSelectedDay(null)} style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--t3)',
              fontSize: 18,
              cursor: 'pointer',
              padding: 0
            }} aria-label="Fechar">×</button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {byDay[selectedDay].map(s => {
              const pk = periodKeyForCellSub(s);
              const paid = isPaidInPeriod(s, pk);
              return (
                <div key={s.id} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '10px 12px',
                  background: 'rgba(255,255,255,.03)',
                  borderRadius: 10,
                  border: '1px solid rgba(255,255,255,.06)'
                }}>
                  <div style={{ fontSize: 22, flexShrink: 0 }}>{s.emoji}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: 14,
                      fontWeight: 700,
                      color: 'var(--t1)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>{s.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 2 }}>
                      {fmtV(s.defaultAmount)}
                      {s.cadence !== 'monthly' && (
                        <span style={{ marginLeft: 6, padding: '1px 5px', background: 'rgba(255,255,255,.06)', borderRadius: 3, fontSize: 9.5, fontWeight: 800 }}>
                          {cadenceShort(s.cadence)}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={async () => {
                      if (paid) {
                        await onUnmarkPaid(s.id, pk);
                      } else if (!s.isVariable) {
                        await onMarkPaid(s.id);
                      } else {
                        // Para variáveis, abre o detalhe na lista (mais fácil) — deixa o user navegar
                        onOpenSub && onOpenSub(s);
                      }
                    }}
                    style={{
                      background: paid ? 'transparent' : '#00D764',
                      color: paid ? 'var(--t3)' : '#000',
                      border: paid ? '1px solid rgba(255,255,255,.15)' : 'none',
                      borderRadius: 8,
                      padding: '6px 12px',
                      fontSize: 12,
                      fontWeight: 800,
                      cursor: 'pointer',
                      fontFamily: 'var(--font)',
                      flexShrink: 0
                    }}
                  >
                    {paid ? '✓ Pago' : s.isVariable ? 'Marcar' : 'Marcar pago'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty state */}
      {subsThisMonth.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: '2rem 1rem',
          color: 'var(--t3)',
          fontSize: 13
        }}>
          Sem subscrições previstas para {PT_MESES[viewMonth]}.
        </div>
      )}
    </div>
  );
}

const navBtn = {
  width: 32,
  height: 32,
  borderRadius: 8,
  border: '1px solid rgba(255,255,255,.08)',
  background: 'rgba(255,255,255,.04)',
  color: 'var(--t2)',
  fontSize: 16,
  cursor: 'pointer',
  fontFamily: 'var(--font)',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontWeight: 700
};
