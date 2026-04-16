import React, { useMemo, useState } from 'react';
import useIsMobile from '../hooks/useIsMobile';
import { BUDGET_CATS, CC, CB, PT_M, PT_MESES } from '../utils/constants';
import { txsComRegra } from '../utils/helpers';
import { getDicaDoDia } from '../utils/dicas';
import GamificationCard from '../components/GamificationCard';
import SubscriptionsCard from '../components/SubscriptionsCard';
import { openReportInNewTab, openReportPreviewInNewTab } from '../utils/reportGenerator';
import ReportUpgradeOverlay from '../components/ReportUpgradeOverlay';
import DashboardSettings from '../components/DashboardSettings';
import { generateWrappedData } from '../utils/wrappedAnalysis';

export default function DashboardPage({ txs, txsWithRules, objetivos, budget, rendimentoMensal, onOpenTxModal, onSwitchTab, onEditGoal, onAddGoal, onDeleteGoal, onReforcoMeta, onOpenBudget, fmtV, fmtDate, getCurrentMonth, streak, badges, newBadges, ativos, feEntries, userPlan, onViewPlans, dashPrefs, onUpdateDashPrefs, onOpenWrapped }) {
  const isMobile = useIsMobile();
  const [reportOverlay, setReportOverlay] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [reportPickerOpen, setReportPickerOpen] = useState(false);

  const visible = dashPrefs?.visible || ['hero','performance','budget','goals','mainGoal','subscriptions','gamification'];
  const show = (id) => visible.includes(id);
  const curYM = getCurrentMonth();
  const cur = useMemo(() => txsWithRules.filter(t => t.date.startsWith(curYM)), [txsWithRules, curYM]);

  const totalIn = cur.filter(t => t.type === 'rendimento').reduce((s, t) => s + t.val, 0);
  const totalOut = cur.filter(t => t.type === 'despesa').reduce((s, t) => s + t.val, 0);
  const saldo = totalIn - totalOut;

  // Previous month
  const pm = new Date(); pm.setMonth(pm.getMonth() - 1);
  const prevYM = pm.getFullYear() + '-' + String(pm.getMonth() + 1).padStart(2, '0');
  const prev = txsWithRules.filter(t => t.date.startsWith(prevYM));
  const prevIn = prev.filter(t => t.type === 'rendimento').reduce((s, t) => s + t.val, 0);
  const prevOut = prev.filter(t => t.type === 'despesa').reduce((s, t) => s + t.val, 0);

  const diffIn = prevIn > 0 ? Math.round(((totalIn - prevIn) / prevIn) * 100) : null;
  const spendDiff = prevOut > 0 ? Math.round(((totalOut - prevOut) / prevOut) * 100) : null;
  const saving = spendDiff !== null && spendDiff < 0;
  const incomeDiff = prevIn > 0 ? Math.round(((totalIn - prevIn) / prevIn) * 100) : null;
  const incomeUp = incomeDiff !== null && incomeDiff >= 0;

  const sorted = [...cur].sort((a, b) => b.date.localeCompare(a.date));
  const main = objetivos.find(o => o.isMain) || (objetivos.length > 0 ? objetivos[0] : null);
  const secObjetivos = objetivos.filter(o => o !== main);
  const dica = getDicaDoDia();

  // Budget
  const budgetCats = Object.keys(budget).filter(c => budget[c] > 0);
  const txMes = txsWithRules.filter(t => t.date.startsWith(curYM) && t.type === 'despesa');

  // Bar max values
  const maxOut = Math.max(totalOut, prevOut, 1);
  const maxIn = Math.max(totalIn, prevIn, 1);

  return (
    <div id="page-dash" className="page active" style={{ paddingTop: '1rem' }}>
      {/* Top bar: settings + wrapped + report */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 10, gap: 8, position: 'relative', zIndex: 100 }}>
        <button onClick={() => setSettingsOpen(true)} style={{
          background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 12,
          padding: '9px 18px', color: '#b8bfda', fontSize: 12, fontWeight: 700,
          cursor: 'pointer', fontFamily: 'var(--font)', display: 'flex', alignItems: 'center', gap: 6,
          transition: 'all .2s'
        }}>
          ⚙️ Personalizar
        </button>
        <button onClick={() => {
          if (userPlan !== 'max') {
            setReportOverlay('needMax');
          } else {
            const wrappedData = generateWrappedData({ txs, objetivos, year: new Date().getFullYear() });
            if (wrappedData) onOpenWrapped(wrappedData.slides);
            else alert('Sem transações suficientes para gerar o Wrapped.');
          }
        }} style={{
          background: 'rgba(255,255,255,.04)', border: '1px solid rgba(123,127,255,.2)', borderRadius: 12,
          padding: '9px 18px', color: '#7b7fff', fontSize: 12, fontWeight: 700,
          cursor: 'pointer', fontFamily: 'var(--font)', display: 'flex', alignItems: 'center', gap: 6,
          transition: 'all .2s'
        }}>
          ✨ Wrapped {new Date().getFullYear()}
          {userPlan !== 'max' && <span style={{ fontSize: 9, background: 'rgba(123,127,255,.12)', color: '#7b7fff', padding: '2px 6px', borderRadius: 6, fontWeight: 800 }}>MAX</span>}
        </button>
        <div style={{ position: 'relative' }}>
          <button onClick={() => {
            if (userPlan === 'free') {
              setReportOverlay('needPlus');
            } else {
              setReportPickerOpen(prev => !prev);
            }
          }} style={{
            background: 'rgba(255,255,255,.04)', border: '1px solid rgba(0,215,100,.2)', borderRadius: 12,
            padding: '9px 18px', color: '#00D764', fontSize: 12, fontWeight: 700,
            cursor: 'pointer', fontFamily: 'var(--font)', display: 'flex', alignItems: 'center', gap: 6,
            transition: 'all .2s'
          }}>
            📄 Relatório Mensal
            {userPlan === 'free' && <span style={{ fontSize: 9, background: 'rgba(0,215,100,.12)', color: '#00D764', padding: '2px 6px', borderRadius: 6, fontWeight: 800 }}>PLUS</span>}
          </button>

          {/* Month picker dropdown */}
          {reportPickerOpen && (
            <>
              <div onClick={() => setReportPickerOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 7999 }} />
              <div style={{
                position: 'absolute', top: '100%', right: 0, marginTop: 8, zIndex: 8000,
                background: 'linear-gradient(180deg, #1e2340 0%, #181c30 100%)',
                border: '1px solid rgba(255,255,255,.1)', borderRadius: 16,
                padding: '16px 18px', width: 280,
                boxShadow: '0 20px 60px rgba(0,0,0,.6)',
                animation: 'reportPickerIn .2s ease'
              }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#fff', marginBottom: 12 }}>
                  Escolhe o mês do relatório
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
                  {PT_M.map((label, i) => {
                    const y = new Date().getFullYear();
                    const mo = y + '-' + String(i + 1).padStart(2, '0');
                    const now = new Date();
                    const isFuture = i + 1 > now.getMonth() + 1 && y >= now.getFullYear();
                    const hasTxs = txs.some(t => t.date && t.date.startsWith(mo));
                    const disabled = isFuture || !hasTxs;
                    const isCurrent = mo === curYM;
                    return (
                      <button key={mo} disabled={disabled} onClick={() => {
                        setReportPickerOpen(false);
                        const reportData = { txs, objetivos, ativos, feEntries, budget, rendimentoMensal, month: mo };
                        if (userPlan === 'plus') {
                          openReportPreviewInNewTab({ ...reportData, canExport: false });
                        } else {
                          openReportInNewTab(reportData);
                        }
                      }} style={{
                        padding: '10px 6px', borderRadius: 10, fontSize: 12, fontWeight: 700,
                        fontFamily: 'var(--font)', cursor: disabled ? 'default' : 'pointer',
                        border: isCurrent ? '1px solid rgba(0,215,100,.4)' : '1px solid rgba(255,255,255,.06)',
                        background: disabled ? 'transparent' : isCurrent ? 'rgba(0,215,100,.1)' : 'rgba(255,255,255,.04)',
                        color: disabled ? 'rgba(255,255,255,.15)' : isCurrent ? '#00D764' : '#b8bfda',
                        transition: 'all .15s',
                        opacity: disabled ? 0.4 : 1
                      }}>
                        {label}
                      </button>
                    );
                  })}
                </div>
                <div style={{ fontSize: 10, color: '#4a5072', marginTop: 10, textAlign: 'center' }}>
                  Apenas meses com transações registadas
                </div>
              </div>
              <style>{`@keyframes reportPickerIn{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:translateY(0)}}`}</style>
            </>
          )}
        </div>
      </div>

      {/* Report upgrade overlay */}
      {reportOverlay && (
        <ReportUpgradeOverlay
          type={reportOverlay}
          onClose={() => setReportOverlay(null)}
          onViewPlans={() => { setReportOverlay(null); onViewPlans(); }}
        />
      )}

      {/* Dashboard settings */}
      {settingsOpen && (
        <DashboardSettings
          prefs={dashPrefs || {}}
          onUpdate={onUpdateDashPrefs}
          onClose={() => setSettingsOpen(false)}
        />
      )}

      {/* Hero cards — always visible */}
      <div className="hero-cards">
        <div className="hc dark-hero">
          <div className="hc-lbl">Ganho no mês</div>
          <div className="hc-val">{fmtV(totalIn)}</div>
          <div className="hc-sub">rendimento do mês</div>
          <div className="hc-delta">{diffIn !== null ? (diffIn >= 0 ? `↑ +${diffIn}%` : `↓ ${diffIn}%`) + ' vs mês anterior' : '↓ -100% vs mês anterior'}</div>
        </div>
        <div className="hc">
          <div className="hc-lbl">Gasto no mês</div>
          <div className="hc-val" style={{ color: 'var(--red-soft)' }}>{fmtV(totalOut)}</div>
          <div className="hc-sub">total de despesas do mês</div>
          <div className="hc-sub">{cur.filter(t => t.type === 'despesa').length} saídas registadas</div>
        </div>
        <div className="hc">
          <div className="hc-lbl">Saldo do mês</div>
          <div className="hc-val" style={{ color: saldo >= 0 ? 'var(--accent)' : 'var(--red-soft)' }}>{fmtV(saldo)}</div>
          <div className="hc-sub">{cur.filter(t => t.type === 'rendimento').length} entr. · {cur.filter(t => t.type === 'despesa').length} saídas</div>
          <div className="hc-delta" style={{ color: saldo >= 0 ? 'var(--accent)' : 'var(--red-soft)' }}>
            {saldo >= 0 ? '↑ ' : '↓ '}{fmtV(Math.abs(saldo))} saldo acumulado
          </div>
        </div>
      </div>

      {/* Performance vs previous month */}
      {show('performance') && <div className="card" style={{ marginBottom: '2rem' }}>
        <div className="card-title">Performance vs mês anterior</div>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span style={{ fontSize: 20, color: saving ? 'var(--accent)' : 'var(--red-soft)' }}>{spendDiff !== null ? (saving ? '↓' : '↑') : '📊'}</span>
              <span style={{ fontSize: 28, fontWeight: 800, color: saving ? 'var(--accent)' : 'var(--red-soft)' }}>
                {spendDiff !== null ? (spendDiff >= 0 ? '+' : '') + spendDiff + '%' : '—'}
              </span>
            </div>
            <div style={{ fontSize: 12, color: 'var(--t3)' }}>{spendDiff !== null ? (saving ? 'gastaste menos este mês' : 'gastaste mais este mês') : 'sem dados do mês anterior'}</div>
            <div style={{ fontSize: 12, color: 'var(--t2)', marginTop: 8 }}>{saving ? '🏆 Boa gestão! Continua assim.' : '💪 Vamos controlar mais as despesas.'}</div>
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span style={{ fontSize: 20, color: incomeUp ? 'var(--accent)' : 'var(--red-soft)' }}>{incomeDiff !== null ? (incomeUp ? '↑' : '↓') : '📊'}</span>
              <span style={{ fontSize: 28, fontWeight: 800, color: incomeUp ? 'var(--accent)' : 'var(--red-soft)' }}>
                {incomeDiff !== null ? (incomeDiff >= 0 ? '+' : '') + incomeDiff + '%' : '—'}
              </span>
            </div>
            <div style={{ fontSize: 12, color: 'var(--t3)' }}>variação de rendimento vs mês passado</div>
            <div style={{ fontSize: 12, color: 'var(--t2)', marginTop: 8 }}>{incomeUp ? 'receitas a crescer' : 'receitas em queda'}</div>
          </div>
        </div>

        {/* Bars */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16, marginTop: '1.4rem', paddingTop: '1.2rem', borderTop: '1px solid var(--border)' }}>
          <div>
            <div className="slbl">Despesas</div>
            {[{ label: 'Mês passado', val: prevOut, pct: prevOut / maxOut }, { label: 'Mês atual', val: totalOut, pct: totalOut / maxOut }].map((b, i) => (
              <div key={i} style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 11, color: i === 0 ? 'var(--t3)' : 'var(--t1)' }}>{b.label}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--t2)' }}>{fmtV(b.val)}</span>
                </div>
                <div style={{ height: 6, background: 'rgba(255,255,255,.08)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ height: '100%', borderRadius: 3, background: i === 0 ? 'rgba(229,57,53,.3)' : 'var(--red-soft)', width: Math.min(100, Math.round(b.pct * 100)) + '%', transition: 'width 1s' }} />
                </div>
              </div>
            ))}
          </div>
          <div>
            <div className="slbl">Receitas</div>
            {[{ label: 'Mês passado', val: prevIn, pct: prevIn / maxIn }, { label: 'Mês atual', val: totalIn, pct: totalIn / maxIn }].map((b, i) => (
              <div key={i} style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 11, color: i === 0 ? 'var(--t3)' : 'var(--t1)' }}>{b.label}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--t2)' }}>{fmtV(b.val)}</span>
                </div>
                <div style={{ height: 6, background: 'rgba(255,255,255,.08)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ height: '100%', borderRadius: 3, background: i === 0 ? 'rgba(0,215,100,.3)' : 'var(--accent)', width: Math.min(100, Math.round(b.pct * 100)) + '%', transition: 'width 1s' }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Summary row */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4,1fr)', gap: 10, marginTop: '1.4rem', paddingTop: '1.2rem', borderTop: '1px solid var(--border)' }}>
          {[
            { label: 'Rendimento', val: fmtV(totalIn), sub: cur.filter(t => t.type === 'rendimento').length + ' entrada(s)', cls: 'dp' },
            { label: 'Despesas', val: fmtV(totalOut), sub: cur.filter(t => t.type === 'despesa').length + ' saída(s)', cls: 'dn' },
            { label: 'Sobrou', val: fmtV(saldo), sub: 'receitas − gastos', color: saldo >= 0 ? 'var(--accent)' : 'var(--red-soft)' },
            { label: 'Saldo', val: fmtV(saldo), sub: 'balanço líquido', color: saldo >= 0 ? 'var(--accent)' : 'var(--red-soft)' },
          ].map((item, i) => (
            <div key={i}>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--t3)', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 5 }}>{item.label}</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: item.color || 'var(--t1)' }}>{item.val}</div>
              <div className={item.cls} style={{ fontSize: 11, color: item.color || 'var(--t3)' }}>{item.sub}</div>
            </div>
          ))}
        </div>
      </div>}

      {/* Budget */}
      {show('budget') && <><div className="slbl" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span>Orçamento do mês</span>
        <button onClick={onOpenBudget} style={{ fontSize: 11, fontWeight: 600, color: 'var(--accent)', background: 'var(--accent-dim)', border: 'none', borderRadius: 8, padding: '5px 12px', cursor: 'pointer', fontFamily: 'var(--font)' }}>⚙️ Gerir</button>
      </div>
      <div className="card" style={{ marginBottom: '2rem' }}>
        {budgetCats.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--t3)', fontSize: 13 }}>
            Sem orçamento definido. <button onClick={onOpenBudget} style={{ color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font)', fontSize: 13, fontWeight: 700 }}>Configurar agora →</button>
          </div>
        ) : budgetCats.map(cat => {
          const limite = budget[cat] || 0;
          const gasto = txMes.filter(t => t.cat === cat).reduce((s, t) => s + t.val, 0);
          const pct = limite > 0 ? Math.min(100, Math.round((gasto / limite) * 100)) : 0;
          const cor = pct >= 100 ? 'var(--red-soft)' : pct >= 80 ? '#f7931a' : 'var(--accent)';
          const emoji = BUDGET_CATS.find(b => b.cat === cat)?.emoji || '📦';
          return (
            <div key={cat} style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--t1)' }}>{emoji} {cat}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: cor }}>{fmtV(gasto)} <span style={{ color: 'var(--t3)', fontWeight: 400 }}>/ {fmtV(limite)}</span></span>
              </div>
              <div className="budget-bar-wrap"><div className="budget-bar-fill" style={{ width: pct + '%', background: cor }} /></div>
              {pct >= 80 && <div style={{ fontSize: 10, color: cor, marginTop: 3 }}>{pct >= 100 ? '⚠️ Limite ultrapassado' : '⚡ A aproximar do limite'}</div>}
            </div>
          );
        })}
      </div></>}

      {/* Two columns: Objectives + Daily tip */}
      {show('goals') && <div className="two-col">
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.1rem' }}>
            <div className="card-title" style={{ marginBottom: 0 }}>Objetivos de poupança</div>
            <button onClick={onAddGoal} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 600, color: 'var(--accent)', background: 'var(--accent-dim)', border: 'none', borderRadius: 8, padding: '5px 12px', cursor: 'pointer', fontFamily: 'var(--font)' }}>
              + Novo objetivo
            </button>
          </div>
          {secObjetivos.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--t3)', fontSize: 13 }}>
              <div style={{ fontSize: '1.8rem', marginBottom: '.5rem' }}>🎯</div>
              <div style={{ fontWeight: 700, color: 'var(--t2)', marginBottom: '.35rem' }}>Sem objetivos.</div>
              Adiciona o teu primeiro!
            </div>
          ) : secObjetivos.map(o => {
            const pct = Math.min(100, o.meta > 0 ? Math.round((o.atual / o.meta) * 100) : 0);
            return (
              <div className="obj-row" key={o.id}>
                <div className="obj-top">
                  <span className="obj-name">{o.nome}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className="obj-vals"><strong>{o.atual.toLocaleString('pt-PT')} €</strong> / {o.meta.toLocaleString('pt-PT')} €</span>
                    <span className="obj-pct">{pct}%</span>
                    <div className="obj-actions">
                      <button className="obj-btn" onClick={() => onEditGoal(String(o.id))}>✏️</button>
                      <button className="obj-btn del" onClick={() => onDeleteGoal(String(o.id))}>✕</button>
                    </div>
                  </div>
                </div>
                <div className="bar-bg"><div className="bar-fill" style={{ width: pct + '%', background: o.cor || 'var(--accent)' }} /></div>
              </div>
            );
          })}
        </div>

        {/* Daily tip */}
        <div className="card daily-card">
          <div className="daily-header">
            <span className="daily-title">Daily Flow</span>
            <span className="daily-num">#{dica.num}</span>
          </div>
          <span className="daily-cat">{dica.cat}</span>
          <div className="daily-quote">{dica.txt}</div>
          <div className="daily-footer">
            <span className="daily-saving">{dica.sub}</span>
            <button className="daily-share" onClick={() => {
              const texto = '💡 Dica FLOWSTATE: ' + dica.txt;
              if (navigator.share) navigator.share({ text: texto });
              else navigator.clipboard.writeText(texto).catch(() => {});
            }}>
              Partilhar
            </button>
          </div>
        </div>
      </div>}

      {/* Main goal progress */}
      {show('mainGoal') && <div className="prog-card">
        <div className="prog-header">
          <div className="prog-title-wrap">
            <span>{main?.emoji || '🎯'}</span>
            <span>{main?.nome || 'Objetivo Principal'}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 12, color: 'var(--t3)' }}>{main ? 'Meta: ' + main.meta.toLocaleString('pt-PT') + ' €' : 'Sem meta definida'}</span>
            <button className="edit-btn" onClick={() => {
              if (main) onEditGoal(String(main.id));
              else onAddGoal();
            }}>✏️ Editar</button>
            <button className="edit-btn" onClick={onReforcoMeta}>+ Reforço</button>
          </div>
        </div>
        <div className="prog-bar-bg">
          <div className="prog-bar-fill" style={{ width: main ? Math.min(100, Math.round((main.atual / main.meta) * 100)) + '%' : '0%' }} />
        </div>
        <div className="prog-labels">
          <span>{main ? main.atual.toLocaleString('pt-PT') + ' € (' + Math.min(100, Math.round((main.atual / main.meta) * 100)) + '%)' : '0 € (0%)'}</span>
          <span>{main ? main.meta.toLocaleString('pt-PT') + ' €' : '0 €'}</span>
        </div>
      </div>}

      {/* Subscriptions */}
      {show('subscriptions') && <SubscriptionsCard txs={txs} fmtV={fmtV} />}

      {/* Separador visual */}
      {show('subscriptions') && show('gamification') && <div style={{ height: 1, background: 'var(--border)', margin: '8px 0' }} />}

      {/* Gamification */}
      {show('gamification') && streak && <GamificationCard streak={streak} badges={badges || {}} newBadges={newBadges} />}

    </div>
  );
}
