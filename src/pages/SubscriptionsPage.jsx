import React, { useMemo, useState } from 'react';
import useIsMobile from '../hooks/useIsMobile';
import { SUB_CATEGORIES, SUB_CADENCES, PT_MESES } from '../utils/constants';
import {
  detectSubscriptions,
  getActiveSubs,
  isPaidThisPeriod,
  getMonthlyEquivalent,
  getYearlyEquivalent,
  getTotals,
  getCurrentPeriodKey,
  getTrialsEndingSoon,
  daysUntilTrialEnd
} from '../utils/subscriptions';
import SubscriptionModal from '../components/SubscriptionModal';
import SubscriptionsCalendar from '../components/SubscriptionsCalendar';
import { useDialog } from '../components/Dialog';

const cadenceLabel = id => (SUB_CADENCES.find(c => c.id === id) || {}).label || 'Mensal';
const categoryMeta = id => SUB_CATEGORIES.find(c => c.id === id) || SUB_CATEGORIES[1];

export default function SubscriptionsPage({
  recurrings = [],
  txs = [],
  onAddRecurring,
  onUpdateRecurring,
  onDeleteRecurring,
  onMarkRecurringPaid,
  onUnmarkRecurringPaid,
  fmtV
}) {
  const isMobile = useIsMobile();
  const dialog = useDialog();

  const [view, setView] = useState('list'); // 'list' | 'calendar'
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSub, setEditingSub] = useState(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [variableAmountSubId, setVariableAmountSubId] = useState(null); // sub.id em modo "introduzir valor"
  const [variableAmountInput, setVariableAmountInput] = useState('');

  const active = useMemo(() => getActiveSubs(recurrings), [recurrings]);
  const totals = useMemo(() => getTotals(recurrings), [recurrings]);
  const trialsEnding = useMemo(() => getTrialsEndingSoon(recurrings, 3), [recurrings]);

  // Sugestões: deteção automática mas só sobre subs que ainda NÃO foram adicionadas manualmente
  const detected = useMemo(() => detectSubscriptions(txs), [txs]);
  const knownNames = useMemo(() =>
    new Set(active.map(s => (s.name || '').toLowerCase().trim())),
    [active]
  );
  const suggestions = useMemo(() =>
    (detected?.activeSubs || []).filter(d =>
      d.isKnown &&
      !knownNames.has((d.nome || '').toLowerCase().trim())
    ),
    [detected, knownNames]
  );

  // Agrupa por categoria
  const grouped = useMemo(() => {
    const g = { essencial: [], util: [], corte: [] };
    for (const s of active) (g[s.category] || g.util).push(s);
    return g;
  }, [active]);

  // Pagas vs pendentes do período actual
  const paidCount = useMemo(() => active.filter(isPaidThisPeriod).length, [active]);

  // Handlers
  const openAdd = () => { setEditingSub(null); setModalOpen(true); };
  const openEdit = (sub) => { setEditingSub(sub); setModalOpen(true); };
  const handleSave = async (sub) => {
    // Distinguir add vs edit pelo estado `editingSub` (que tem id quando estamos a editar real),
    // não pelo `sub.id` — modais novos também trazem id local atribuído por newSubscription().
    const isEditing = !!(editingSub && editingSub.id);
    if (isEditing) await onUpdateRecurring(sub);
    else await onAddRecurring(sub);
    setModalOpen(false);
    setEditingSub(null);
  };
  const handleDelete = async (sub) => {
    const ok = await dialog.confirm({
      title: 'Apagar subscrição?',
      message: `Vais apagar "${sub.name}". O histórico de pagamentos é perdido. Esta ação não pode ser desfeita.`,
      confirmLabel: 'Apagar',
      danger: true
    });
    if (!ok) return;
    await onDeleteRecurring(sub.id);
    setModalOpen(false);
    setEditingSub(null);
  };

  const toggleCheck = async (sub) => {
    const paid = isPaidThisPeriod(sub);
    if (paid) {
      await onUnmarkRecurringPaid(sub.id);
      return;
    }
    if (sub.isVariable) {
      // Pede valor inline
      setVariableAmountSubId(sub.id);
      setVariableAmountInput(String(sub.defaultAmount || ''));
      return;
    }
    await onMarkRecurringPaid(sub.id);
  };

  const confirmVariableAmount = async (sub) => {
    const v = parseFloat(String(variableAmountInput).replace(',', '.'));
    if (!isFinite(v) || v <= 0) {
      await dialog.alert({ title: 'Valor inválido', message: 'Introduz um valor maior que zero.' });
      return;
    }
    await onMarkRecurringPaid(sub.id, v);
    setVariableAmountSubId(null);
    setVariableAmountInput('');
  };

  // ─────────────────────────────────────────────────────────────────────
  return (
    <div id="page-subs" className="page active" style={{ padding: 0, minHeight: '100vh' }}>
      <div style={{ maxWidth: 980, margin: '0 auto', padding: isMobile ? '1rem 1rem 5rem' : '2rem 1.5rem 4rem' }}>

        {/* ── Header ── */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: isMobile ? 'flex-start' : 'center',
          gap: 14,
          marginBottom: '1.4rem',
          flexDirection: isMobile ? 'column' : 'row'
        }}>
          <div>
            <h1 style={{
              fontSize: isMobile ? '1.6rem' : '2rem',
              fontWeight: 800,
              letterSpacing: '-.03em',
              color: 'var(--t1)',
              margin: 0
            }}>Subscrições</h1>
            <div style={{ fontSize: 13, color: 'var(--t3)', marginTop: 4 }}>
              {active.length === 0
                ? 'Adiciona as tuas subscrições para começares a controlar despesas recorrentes.'
                : `${paidCount} de ${active.length} marcadas como pagas neste período.`}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, alignItems: 'center', width: isMobile ? '100%' : 'auto' }}>
            {/* Toggle vista */}
            <div style={{
              display: 'inline-flex',
              background: 'rgba(255,255,255,.04)',
              border: '1px solid rgba(255,255,255,.08)',
              borderRadius: 10,
              padding: 3
            }}>
              {[
                { id: 'list', label: '📋', title: 'Lista' },
                { id: 'calendar', label: '📅', title: 'Calendário' }
              ].map(v => (
                <button
                  key={v.id}
                  title={v.title}
                  onClick={() => setView(v.id)}
                  style={{
                    background: view === v.id ? 'rgba(0,215,100,.15)' : 'transparent',
                    border: 'none',
                    borderRadius: 8,
                    padding: '6px 10px',
                    fontSize: 14,
                    cursor: 'pointer',
                    color: view === v.id ? '#00D764' : 'var(--t3)',
                    fontFamily: 'var(--font)'
                  }}
                >{v.label}</button>
              ))}
            </div>

            <button onClick={openAdd} style={{
              background: '#00D764',
              color: '#000',
              border: 'none',
              borderRadius: 12,
              padding: '10px 16px',
              fontSize: 13,
              fontWeight: 800,
              cursor: 'pointer',
              fontFamily: 'var(--font)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              flex: isMobile ? 1 : 'none',
              justifyContent: 'center'
            }}>+ Adicionar</button>
          </div>
        </div>

        {/* ── Trial banner ── */}
        {trialsEnding.length > 0 && (
          <div style={{
            background: 'linear-gradient(135deg, rgba(247,147,26,.12), rgba(247,147,26,.04))',
            border: '1px solid rgba(247,147,26,.3)',
            borderRadius: 14,
            padding: isMobile ? '14px 16px' : '16px 20px',
            marginBottom: '1.3rem',
            display: 'flex',
            alignItems: 'flex-start',
            gap: 14
          }}>
            <div style={{
              flexShrink: 0,
              width: 38,
              height: 38,
              borderRadius: 10,
              background: 'rgba(247,147,26,.18)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 18
            }}>⏳</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#f7931a', marginBottom: 6 }}>
                {trialsEnding.length === 1 ? 'Trial a terminar' : `${trialsEnding.length} trials a terminar`}
              </div>
              {trialsEnding.map(s => {
                const d = daysUntilTrialEnd(s);
                return (
                  <div key={s.id} style={{
                    fontSize: 13,
                    color: 'var(--t2)',
                    marginBottom: 4,
                    lineHeight: 1.4
                  }}>
                    <strong style={{ color: 'var(--t1)' }}>{s.emoji} {s.name}</strong>
                    {' '}—{' '}
                    {d === 0 ? 'termina hoje' : d === 1 ? 'termina amanhã' : `termina em ${d} dias`}.
                    {' '}
                    <button onClick={() => openEdit(s)} style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#f7931a',
                      fontWeight: 700,
                      fontSize: 13,
                      cursor: 'pointer',
                      padding: 0,
                      textDecoration: 'underline'
                    }}>Gerir</button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Hero summary ── */}
        {active.length > 0 && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(3, 1fr)',
            gap: 12,
            marginBottom: '1.3rem'
          }}>
            <div className="card" style={{ textAlign: 'center' }}>
              <div className="card-title">Por mês</div>
              <div style={{ fontSize: '1.7rem', fontWeight: 800, color: 'var(--t1)', letterSpacing: '-.03em' }}>{fmtV(totals.monthly)}</div>
              <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 3 }}>equivalente mensal</div>
            </div>
            <div className="card" style={{ textAlign: 'center' }}>
              <div className="card-title">Por ano</div>
              <div style={{ fontSize: '1.7rem', fontWeight: 800, color: '#00D764', letterSpacing: '-.03em' }}>{fmtV(totals.yearly)}</div>
              <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 3 }}>se mantiveres tudo</div>
            </div>
            <div className="card" style={{ textAlign: 'center', gridColumn: isMobile ? '1 / -1' : 'auto' }}>
              <div className="card-title">Pago este período</div>
              <div style={{ fontSize: '1.7rem', fontWeight: 800, color: 'var(--t1)', letterSpacing: '-.03em' }}>
                {paidCount}<span style={{ color: 'var(--t3)', fontSize: '1rem', fontWeight: 600 }}> / {active.length}</span>
              </div>
              <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 3 }}>checklist do mês</div>
            </div>
          </div>
        )}

        {/* ── Empty state ── */}
        {active.length === 0 && suggestions.length === 0 && (
          <div className="card" style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
            <div style={{ fontSize: 44, marginBottom: 12 }}>💳</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--t1)', marginBottom: 6 }}>Sem subscrições adicionadas</div>
            <div style={{ fontSize: 13, color: 'var(--t3)', marginBottom: 18, maxWidth: 360, margin: '0 auto 18px' }}>
              Adiciona as tuas subscrições mensais (Spotify, Netflix, MEO, etc.) para começares a controlar quanto sai todos os meses.
            </div>
            <button onClick={openAdd} style={{
              background: '#00D764', color: '#000', border: 'none', borderRadius: 12,
              padding: '11px 22px', fontSize: 13, fontWeight: 800, cursor: 'pointer', fontFamily: 'var(--font)'
            }}>+ Adicionar primeira subscrição</button>
          </div>
        )}

        {/* ── Lista agrupada ── */}
        {view === 'list' && active.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {SUB_CATEGORIES.map(cat => {
              const items = grouped[cat.id] || [];
              if (items.length === 0) return null;
              const yearlyTotal = items.reduce((s, sub) => s + getYearlyEquivalent(sub), 0);
              return (
                <div key={cat.id}>
                  {/* Header da categoria */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'baseline',
                    justifyContent: 'space-between',
                    marginBottom: 8,
                    paddingLeft: 4
                  }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                      <div style={{
                        width: 6, height: 6, borderRadius: '50%',
                        background: cat.color, alignSelf: 'center'
                      }} />
                      <div style={{
                        fontSize: 11,
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        letterSpacing: '.12em',
                        color: cat.color
                      }}>{cat.label}</div>
                      <div style={{ fontSize: 11, color: 'var(--t3)' }}>{cat.desc}</div>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--t3)', fontWeight: 700 }}>
                      {fmtV(yearlyTotal)}/ano
                    </div>
                  </div>

                  {/* Items */}
                  <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    {items.map((sub, i) => {
                      const paid = isPaidThisPeriod(sub);
                      const inputting = variableAmountSubId === sub.id;
                      return (
                        <div key={sub.id} style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 12,
                          padding: isMobile ? '12px 14px' : '14px 18px',
                          borderBottom: i < items.length - 1 ? '1px solid rgba(255,255,255,.05)' : 'none',
                          background: paid ? 'rgba(0,215,100,.04)' : 'transparent',
                          transition: 'background .15s ease'
                        }}>
                          {/* Check toggle — visualmente óbvio: pendente = pulse verde tracejado, pago = sólido com check */}
                          <button
                            onClick={() => toggleCheck(sub)}
                            title={paid ? 'Desmarcar' : 'Marcar como pago'}
                            aria-label={paid ? 'Desmarcar pagamento' : 'Marcar como pago'}
                            style={{
                              flexShrink: 0,
                              width: 34, height: 34,
                              borderRadius: '50%',
                              background: paid ? '#00D764' : 'rgba(0,215,100,.10)',
                              border: paid
                                ? '2px solid #00D764'
                                : '2px dashed rgba(0,215,100,.55)',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              transition: 'transform .15s ease, background .15s ease, border-color .15s ease, box-shadow .15s ease',
                              padding: 0,
                              boxShadow: paid
                                ? '0 0 0 4px rgba(0,215,100,.10)'
                                : '0 0 0 0 rgba(0,215,100,0)'
                            }}
                            onMouseEnter={e => {
                              if (!paid) {
                                e.currentTarget.style.background = 'rgba(0,215,100,.22)';
                                e.currentTarget.style.borderColor = '#00D764';
                                e.currentTarget.style.transform = 'scale(1.06)';
                                e.currentTarget.style.boxShadow = '0 0 0 5px rgba(0,215,100,.12)';
                              } else {
                                e.currentTarget.style.transform = 'scale(1.06)';
                              }
                            }}
                            onMouseLeave={e => {
                              if (!paid) {
                                e.currentTarget.style.background = 'rgba(0,215,100,.10)';
                                e.currentTarget.style.borderColor = 'rgba(0,215,100,.55)';
                                e.currentTarget.style.transform = 'scale(1)';
                                e.currentTarget.style.boxShadow = '0 0 0 0 rgba(0,215,100,0)';
                              } else {
                                e.currentTarget.style.transform = 'scale(1)';
                              }
                            }}
                          >
                            {paid ? (
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                            ) : (
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#00D764" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.65 }}>
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                            )}
                          </button>

                          {/* Emoji */}
                          <div style={{ fontSize: 22, flexShrink: 0 }}>{sub.emoji}</div>

                          {/* Name + meta */}
                          <div
                            onClick={() => openEdit(sub)}
                            style={{ flex: 1, minWidth: 0, cursor: 'pointer' }}
                            role="button"
                            tabIndex={0}
                          >
                            <div style={{
                              fontSize: 14.5,
                              fontWeight: 700,
                              color: 'var(--t1)',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              textDecoration: paid ? 'line-through' : 'none',
                              opacity: paid ? 0.6 : 1
                            }}>{sub.name}</div>
                            <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 2, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                              <span>{cadenceLabel(sub.cadence)}</span>
                              <span>·</span>
                              <span>dia {sub.dayOfPeriod}</span>
                              {sub.isTrial && (
                                <>
                                  <span>·</span>
                                  <span style={{ color: '#f7931a', fontWeight: 700 }}>trial</span>
                                </>
                              )}
                              {sub.isVariable && (
                                <>
                                  <span>·</span>
                                  <span style={{ color: 'var(--t3)' }}>valor variável</span>
                                </>
                              )}
                            </div>
                          </div>

                          {/* Amount or input */}
                          {inputting ? (
                            <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}>
                              <input
                                type="number"
                                inputMode="decimal"
                                step="0.01"
                                autoFocus
                                value={variableAmountInput}
                                onChange={e => setVariableAmountInput(e.target.value)}
                                onKeyDown={e => {
                                  if (e.key === 'Enter') confirmVariableAmount(sub);
                                  if (e.key === 'Escape') { setVariableAmountSubId(null); setVariableAmountInput(''); }
                                }}
                                placeholder="0,00"
                                style={{
                                  width: 80,
                                  padding: '6px 8px',
                                  fontSize: 13,
                                  background: 'rgba(255,255,255,.06)',
                                  border: '1px solid rgba(0,215,100,.4)',
                                  borderRadius: 8,
                                  color: 'var(--t1)',
                                  fontFamily: 'var(--font)',
                                  textAlign: 'right'
                                }}
                              />
                              <button onClick={() => confirmVariableAmount(sub)} style={{
                                background: '#00D764', color: '#000', border: 'none',
                                borderRadius: 8, padding: '6px 10px', fontSize: 12, fontWeight: 800,
                                cursor: 'pointer', fontFamily: 'var(--font)'
                              }}>OK</button>
                              <button onClick={() => { setVariableAmountSubId(null); setVariableAmountInput(''); }} style={{
                                background: 'transparent', color: 'var(--t3)', border: 'none',
                                fontSize: 18, cursor: 'pointer', padding: '0 4px'
                              }}>×</button>
                            </div>
                          ) : (
                            <div style={{ textAlign: 'right', flexShrink: 0 }}>
                              <div style={{
                                fontSize: 14,
                                fontWeight: 800,
                                color: paid ? 'var(--t3)' : 'var(--t1)',
                                opacity: paid ? 0.7 : 1
                              }}>{fmtV(sub.defaultAmount || 0)}</div>
                              {sub.cadence !== 'monthly' && (
                                <div style={{ fontSize: 10, color: 'var(--t3)', marginTop: 1 }}>
                                  ≈ {fmtV(getMonthlyEquivalent(sub))}/mês
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Calendário ── */}
        {view === 'calendar' && active.length > 0 && (
          <SubscriptionsCalendar
            subs={recurrings}
            onMarkPaid={onMarkRecurringPaid}
            onUnmarkPaid={onUnmarkRecurringPaid}
            onOpenSub={(sub) => openEdit(sub)}
            fmtV={fmtV}
          />
        )}

        {/* ── Sugestões (auto-detect) ── */}
        {suggestions.length > 0 && (
          <div style={{ marginTop: '2rem' }}>
            <button
              onClick={() => setShowSuggestions(!showSuggestions)}
              style={{
                background: 'rgba(123,127,255,.08)',
                border: '1px solid rgba(123,127,255,.25)',
                borderRadius: 12,
                padding: '12px 16px',
                color: '#7b7fff',
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
                fontFamily: 'var(--font)',
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 10
              }}>
              <span>💡 Detectámos {suggestions.length} {suggestions.length === 1 ? 'subscrição' : 'subscrições'} no teu histórico de transações</span>
              <span style={{ transform: showSuggestions ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform .2s' }}>▾</span>
            </button>

            {showSuggestions && (
              <div className="card" style={{ marginTop: 10, padding: 0, overflow: 'hidden' }}>
                {suggestions.map((sug, i) => (
                  <div key={sug.key} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: isMobile ? '12px 14px' : '14px 18px',
                    borderBottom: i < suggestions.length - 1 ? '1px solid rgba(255,255,255,.05)' : 'none'
                  }}>
                    <div style={{ fontSize: 22, flexShrink: 0 }}>{sug.emoji}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--t1)' }}>{sug.nome}</div>
                      <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 2 }}>
                        Detectada em {sug.months} {sug.months === 1 ? 'mês' : 'meses'} · média {fmtV(sug.avgVal)}
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setEditingSub({
                          name: sug.nome,
                          emoji: sug.emoji,
                          defaultAmount: sug.avgVal,
                          isVariable: false,
                          cadence: 'monthly',
                          dayOfPeriod: new Date().getDate(),
                          category: sug.priority === 'essencial' ? 'essencial'
                                  : sug.priority === 'opcional' ? 'corte' : 'util',
                          isTrial: false,
                          payments: {}
                        });
                        setModalOpen(true);
                      }}
                      style={{
                        background: 'rgba(0,215,100,.15)',
                        border: '1px solid rgba(0,215,100,.3)',
                        borderRadius: 8,
                        padding: '7px 12px',
                        color: '#00D764',
                        fontSize: 12,
                        fontWeight: 800,
                        cursor: 'pointer',
                        fontFamily: 'var(--font)',
                        flexShrink: 0
                      }}>+ Adicionar</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>

      {/* ── Modal Add/Edit ── */}
      {modalOpen && (
        <SubscriptionModal
          initial={editingSub}
          onSave={handleSave}
          onClose={() => { setModalOpen(false); setEditingSub(null); }}
          onDelete={editingSub?.id ? () => handleDelete(editingSub) : null}
        />
      )}
    </div>
  );
}
