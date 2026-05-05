import React, { useState } from 'react';
import useIsMobile from '../hooks/useIsMobile';
import LegalOverlay from '../components/LegalOverlay';

export default function LandingPage({ logo, onShowAuth }) {
  const isMobile = useIsMobile();
  const [legalOpen, setLegalOpen] = useState(null);
  const [pricingPeriod, setPricingPeriod] = useState('anual'); // 'anual' | 'mensal'
  const [whyNotFreeOpen, setWhyNotFreeOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState(null); // index da FAQ aberta, null = nenhuma
  return (
    <div style={{
      minHeight: '100vh',
      background: '#141829',
      position: 'relative',
      overflowX: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: 'Inter, system-ui, sans-serif'
    }}>

      {/* ── Navbar (fixed — sempre visível durante scroll) ── */}
      <nav style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        background: 'rgba(20, 24, 41, 0.78)',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        padding: isMobile ? '10px 14px' : '12px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: isMobile ? 8 : 16
      }}>
        {/* Logo */}
        <a href="#top" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', flexShrink: 0 }}>
          <img src={logo} alt="Flowstate" style={{ height: isMobile ? 60 : 76, width: 'auto' }} />
        </a>

        {/* Links centrais (ocultos em mobile) */}
        {!isMobile && (
          <div style={{
            display: 'flex',
            gap: 28,
            position: 'absolute',
            left: '50%',
            transform: 'translateX(-50%)'
          }}>
            {[
              { label: 'Funcionalidades', href: '#funcionalidades' },
              { label: 'Preços',          href: '#precos'           },
              { label: 'FAQ',             href: '#faq'              },
            ].map(link => (
              <a key={link.href} href={link.href} style={{
                color: '#c8d0e7',
                fontSize: 14,
                fontWeight: 600,
                textDecoration: 'none',
                letterSpacing: '-0.005em',
                transition: 'color .15s ease'
              }}
              onMouseEnter={e => e.currentTarget.style.color = '#fff'}
              onMouseLeave={e => e.currentTarget.style.color = '#c8d0e7'}
              >{link.label}</a>
            ))}
          </div>
        )}

        {/* CTAs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 8 : 14, flexShrink: 0 }}>
          <button onClick={onShowAuth} style={{
            background: 'transparent',
            border: 'none',
            color: '#c8d0e7',
            fontSize: isMobile ? 13 : 14,
            fontWeight: 600,
            cursor: 'pointer',
            padding: '6px 8px'
          }}>Entrar</button>
          <button onClick={onShowAuth} style={{
            background: '#00D764',
            color: '#000',
            border: 'none',
            borderRadius: 20,
            padding: isMobile ? '7px 14px' : '9px 18px',
            fontSize: isMobile ? 13 : 14,
            fontWeight: 800,
            cursor: 'pointer',
            boxShadow: '0 0 24px rgba(0,215,100,.25)'
          }}>Começar</button>
        </div>
      </nav>

      {/* ── Hero ── */}
      <div id="top" style={{
        position: 'relative',
        zIndex: 10,
        textAlign: 'center',
        padding: isMobile ? '6.5rem 1.25rem 0' : '9rem 2rem 0'
      }}>
        <h1 style={{
          fontSize: 'clamp(2.2rem, 3.8vw, 4rem)',
          fontWeight: 800,
          letterSpacing: '-0.05em',
          lineHeight: 1.08,
          color: '#fff',
          margin: '0 0 0.3rem'
        }}>
          Domina as tuas <span style={{ color: '#00D764' }}>Finanças</span>,<br />em qualquer lugar.
        </h1>
        <p style={{
          fontSize: 'clamp(.9rem, 1.15vw, 1.08rem)',
          color: '#8F92A1',
          lineHeight: 1.6,
          margin: '0 0 0.7rem'
        }}>
          A app de gestão financeira e literacia financeira para portugueses. Funciona em qualquer dispositivo.
        </p>
        <button onClick={onShowAuth} style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 10,
          padding: '14px 34px',
          borderRadius: 30,
          background: '#00D764',
          color: '#000',
          border: 'none',
          fontSize: 15,
          fontWeight: 800,
          cursor: 'pointer',
          boxShadow: '0 0 40px rgba(0,215,100,.35)'
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
            <polyline points="16 7 22 7 22 13" />
          </svg>
          Começar a poupar e investir
        </button>
        <p style={{ marginTop: '.3rem', fontSize: 12, color: '#6e7491' }}>
          Gratuito · Sem cartão de crédito · Dados privados
        </p>
      </div>

      {/* ── Devices — laptop + telemóvel (desktop) / só telemóvel (mobile) ── */}
      <div style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: isMobile ? 0 : 24,
        padding: isMobile ? '1.5rem 1rem 2rem' : '2rem 2rem 3rem',
        marginTop: isMobile ? 0 : 'auto',
        zIndex: 5
      }}>

        {/* ─────────── LAPTOP (só desktop) ─────────── */}
        {!isMobile && (
        <div style={{
          width: 'min(640px, 46vw)',
          flexShrink: 0,
          position: 'relative',
          filter: 'drop-shadow(0 30px 60px rgba(0,0,0,.55))'
        }}>
          {/* Laptop body wrapper */}
          <div style={{
            background: 'linear-gradient(145deg,#2a3044 0%,#141729 50%,#0a0d18 100%)',
            borderRadius: '14px 14px 6px 6px',
            padding: 8,
            boxShadow: 'inset 0 0 0 1.5px rgba(255,255,255,.08), inset 0 1px 0 rgba(255,255,255,.12)'
          }}>
          <div style={{ background: '#000', borderRadius: 8, padding: 3 }}>
          <div>
            {/* Dots */}
            <div style={{
              background: '#111621',
              borderRadius: '10px 10px 0 0',
              height: 18,
              display: 'flex',
              alignItems: 'center',
              padding: '0 10px',
              gap: 5,
              marginBottom: 5
            }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#ff5f57' }} />
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#ffbd2e' }} />
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#28ca41' }} />
            </div>

            {/* Ecrã */}
            <div style={{ background: '#141829', padding: '10px 16px 14px' }}>
              {/* Navbar */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 16,
                paddingBottom: 8, marginBottom: 10,
                borderBottom: '1px solid rgba(255,255,255,.06)'
              }}>
                <span style={{ fontSize: 9.5, fontWeight: 800, color: '#fff', letterSpacing: '1.2px' }}>FLOWSTATE</span>
                <span style={{ fontSize: 8.5, color: '#00D764', fontWeight: 700, borderBottom: '1.5px solid #00D764', paddingBottom: 2 }}>Dashboard</span>
                <span style={{ fontSize: 8.5, color: '#6e7491' }}>Transações</span>
                <span style={{ fontSize: 8.5, color: '#6e7491' }}>Calculadora</span>
                <div style={{
                  marginLeft: 'auto', background: '#00D764', color: '#000',
                  fontSize: 8, fontWeight: 800, padding: '3px 10px', borderRadius: 5, letterSpacing: '.5px'
                }}>POUPANÇA MODERADA</div>
              </div>

              {/* Património */}
              <div style={{ textAlign: 'center', marginBottom: 12 }}>
                <div style={{ fontSize: 7.5, color: '#6e7491', letterSpacing: '.12em', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>PATRIMÓNIO TOTAL</div>
                <div style={{ fontSize: 34, fontWeight: 800, color: '#fff', letterSpacing: '-.05em', lineHeight: 1 }}>18.340 €</div>
                <div style={{ fontSize: 9, color: '#00D764', fontWeight: 700, marginTop: 4 }}>↑ +340 € este mês</div>
              </div>

              {/* Fila 1 — 3 cards */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 8 }}>
                <div style={{ background: '#00D764', borderRadius: 10, padding: '11px 13px' }}>
                  <div style={{ fontSize: 7, fontWeight: 700, color: 'rgba(0,0,0,.5)', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 4 }}>TAXA DE POUPANÇA</div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: '#000', letterSpacing: '-.04em', lineHeight: 1 }}>50%</div>
                  <div style={{ fontSize: 6.5, color: 'rgba(0,0,0,.5)', marginTop: 4 }}>do rendimento poupado/investido</div>
                  <div style={{ fontSize: 6.5, color: 'rgba(0,0,0,.45)', marginTop: 2 }}>↑ taxa de poupança calculada</div>
                </div>
                <div style={{ background: '#1c2033', borderRadius: 10, padding: '11px 13px' }}>
                  <div style={{ fontSize: 7, fontWeight: 700, color: '#6e7491', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 4 }}>FALTA PARA META</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#fff', lineHeight: 1 }}>18.360 €</div>
                  <div style={{ fontSize: 7, color: '#6e7491', marginTop: 4 }}>🏦 Independência Financeira</div>
                  <div style={{ fontSize: 6.5, color: '#6e7491', marginTop: 2 }}>202 anos - meta 200.000 €</div>
                </div>
                <div style={{ background: '#1c2033', borderRadius: 10, padding: '11px 13px' }}>
                  <div style={{ fontSize: 7, fontWeight: 700, color: '#6e7491', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 4 }}>SALDO DO MÊS</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#00D764', lineHeight: 1 }}>1.215,50 €</div>
                  <div style={{ fontSize: 7, color: '#6e7491', marginTop: 4 }}>1 entrada · 9 despesas</div>
                  <div style={{ fontSize: 6.5, color: '#00D764', marginTop: 2 }}>↑ +1.215,50 € saldo acumulado</div>
                </div>
              </div>

              {/* Fila 2 */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 8 }}>
                {[
                  { label: 'RENDIMENTO', val: '1231,00 €', sub: '1 entrada',       color: '#fff'    },
                  { label: 'DESPESAS',   val: '1244,00 €', sub: '8 saídas hoje',   color: '#ff6b6b' },
                  { label: 'SALDO MÊS',  val: '1255,90 €', sub: '5 saídas depois', color: '#00D764' },
                ].map((item, i) => (
                  <div key={i} style={{ background: '#1c2033', borderRadius: 10, padding: '9px 12px' }}>
                    <div style={{ fontSize: 6.5, fontWeight: 700, color: '#6e7491', letterSpacing: '.07em', textTransform: 'uppercase', marginBottom: 3 }}>{item.label}</div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: item.color, lineHeight: 1 }}>{item.val}</div>
                    <div style={{ fontSize: 6.5, color: '#6e7491', marginTop: 3 }}>{item.sub}</div>
                  </div>
                ))}
              </div>

              {/* Fila 3 — Potes + Radar */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: 8 }}>
                <div style={{ background: '#1c2033', borderRadius: 10, padding: '9px 12px' }}>
                  <div style={{ fontSize: 6.5, fontWeight: 700, color: '#6e7491', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 6 }}>OBJETIVOS DE POUPANÇA</div>
                  {[
                    { nome: 'Fundo de Emergência', val: '6.200 / 7.200', pct: 86, cor: '#00D764' },
                    { nome: 'Carro Usado',         val: '4.500 / 8.000', pct: 56, cor: '#7b7fff' },
                    { nome: 'Férias 2026',         val: '1.200 / 2.500', pct: 48, cor: '#f7931a' },
                  ].map((p, i) => (
                    <div key={i} style={{ marginBottom: i < 2 ? 6 : 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                        <span style={{ fontSize: 7, color: '#c8d0e7' }}>{p.nome}</span>
                        <span style={{ fontSize: 6.5, color: '#6e7491' }}>{p.val}</span>
                      </div>
                      <div style={{ height: 4, background: 'rgba(255,255,255,.08)', borderRadius: 2, overflow: 'hidden' }}>
                        <div style={{ height: '100%', background: p.cor, width: p.pct + '%', borderRadius: 2 }} />
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ background: '#1c2033', borderRadius: 10, padding: '9px 12px' }}>
                  <div style={{ fontSize: 6.5, fontWeight: 700, color: '#6e7491', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 6 }}>RADAR DE ATIVOS</div>
                  {[
                    { nome: 'VWCE — Vanguard All World', sub: 'Trade Republic · +0 m',    dot: '#00D764' },
                    { nome: 'Optimize PPR Arrojado',      sub: 'Defore · Benefício fiscal', dot: '#7b7fff' },
                    { nome: 'Bitcoin',                    sub: 'Market · minimal',          dot: '#f7931a' },
                  ].map((a, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 6, marginBottom: i < 2 ? 6 : 0 }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: a.dot, flexShrink: 0, marginTop: 1 }} />
                      <div>
                        <div style={{ fontSize: 7, fontWeight: 600, color: '#c8d0e7' }}>{a.nome}</div>
                        <div style={{ fontSize: 6, color: '#6e7491', marginTop: 1 }}>{a.sub}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          </div>
          </div>
          {/* Laptop base / stand */}
          <div style={{
            height: 10,
            margin: '0 -3%',
            background: 'linear-gradient(180deg,#2a3044 0%,#1a1f2e 100%)',
            borderRadius: '0 0 10px 10px',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,.1)'
          }} />
          <div style={{
            width: '20%',
            height: 3,
            margin: '0 auto',
            background: 'rgba(0,0,0,.35)',
            borderRadius: '0 0 6px 6px'
          }} />
        </div>
        )}

        {/* ─────────── TELEMÓVEL (iPhone-style) ─────────── */}
        <div style={{
          width: isMobile ? 'min(215px, 55vw)' : 'min(230px, 16vw)',
          aspectRatio: '9 / 19.5',
          flexShrink: 0,
          position: 'relative',
          zIndex: 2,
          marginLeft: isMobile ? 0 : '-4%',
          filter: 'drop-shadow(0 30px 60px rgba(0,0,0,.55))'
        }}>
          {/* Side buttons */}
          <div style={{ position: 'absolute', left: -3, top: '15%', width: 3, height: 28, background: 'linear-gradient(90deg,#1a1f2e,#2a3044)', borderRadius: '2px 0 0 2px' }} />
          <div style={{ position: 'absolute', left: -3, top: '26%', width: 3, height: 46, background: 'linear-gradient(90deg,#1a1f2e,#2a3044)', borderRadius: '2px 0 0 2px' }} />
          <div style={{ position: 'absolute', left: -3, top: '36%', width: 3, height: 46, background: 'linear-gradient(90deg,#1a1f2e,#2a3044)', borderRadius: '2px 0 0 2px' }} />
          <div style={{ position: 'absolute', right: -3, top: '24%', width: 3, height: 62, background: 'linear-gradient(270deg,#1a1f2e,#2a3044)', borderRadius: '0 2px 2px 0' }} />

          {/* Phone frame */}
          <div style={{
            background: 'linear-gradient(145deg,#2a3044 0%,#141729 50%,#0a0d18 100%)',
            borderRadius: 34,
            padding: 4,
            height: '100%',
            boxShadow: 'inset 0 0 0 1.5px rgba(255,255,255,.08), inset 0 1px 0 rgba(255,255,255,.12)',
          }}>
            {/* Inner bezel */}
            <div style={{
              background: '#000',
              borderRadius: 30,
              padding: 2.5,
              height: '100%',
              boxShadow: 'inset 0 0 0 1px rgba(255,255,255,.04)'
            }}>
              {/* Screen */}
              <div style={{
                background: '#141829',
                borderRadius: 28,
                padding: '24px 8px 8px',
                position: 'relative',
                overflow: 'hidden',
                height: '100%',
                display: 'flex',
                flexDirection: 'column'
              }}>
                {/* Dynamic Island */}
                <div style={{
                  position: 'absolute',
                  top: 6,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: 56,
                  height: 15,
                  background: '#000',
                  borderRadius: 10,
                  zIndex: 3,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  paddingRight: 5,
                  gap: 4
                }}>
                  <div style={{ width: 3, height: 3, borderRadius: '50%', background: '#1a1a1a', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,.06)' }} />
                </div>

                {/* Status bar */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 8px 6px', fontSize: 7, fontWeight: 700, color: '#fff' }}>
                  <span>9:41</span>
                  <span style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
                    <span style={{ fontSize: 6 }}>●●●</span>
                    <span style={{ fontSize: 6 }}>📶</span>
                    <span style={{
                      display: 'inline-block', width: 13, height: 6.5, border: '1px solid #fff',
                      borderRadius: 1.5, position: 'relative', padding: .5
                    }}>
                      <span style={{ display: 'block', width: '80%', height: '100%', background: '#fff', borderRadius: 1 }} />
                    </span>
                  </span>
                </div>

                {/* App content */}
                <div style={{ background: '#141829', borderRadius: 12, padding: '6px 8px', flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                    <span style={{ fontSize: 9, fontWeight: 800, color: '#fff', letterSpacing: '1px' }}>FLOWSTATE</span>
                    <span style={{ background: 'rgba(123,127,255,.15)', color: '#7b7fff', fontSize: 6.5, fontWeight: 800, padding: '2px 6px', borderRadius: 4, letterSpacing: '.5px' }}>FLOW MAX</span>
                  </div>
                  <div style={{ textAlign: 'center', marginBottom: 8 }}>
                    <div style={{ fontSize: 6.5, color: '#6e7491', letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 3 }}>PATRIMÓNIO TOTAL</div>
                    <div style={{ fontSize: 26, fontWeight: 800, color: '#fff', letterSpacing: '-.03em', lineHeight: 1 }}>18.340 €</div>
                    <div style={{ fontSize: 7.5, color: '#00D764', fontWeight: 700, marginTop: 3 }}>↑ +340 € este mês</div>
                  </div>
                  <div style={{ background: '#00D764', borderRadius: 10, padding: '9px 11px', marginBottom: 7 }}>
                    <div style={{ fontSize: 6.5, fontWeight: 700, color: 'rgba(0,0,0,.5)', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 2 }}>TAXA DE POUPANÇA</div>
                    <div style={{ fontSize: 26, fontWeight: 800, color: '#000', letterSpacing: '-.04em', lineHeight: 1 }}>50%</div>
                    <div style={{ fontSize: 6.5, color: 'rgba(0,0,0,.5)', marginTop: 2 }}>↑ do rendimento poupado</div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 7 }}>
                    <div style={{ background: '#1c2033', borderRadius: 8, padding: '7px 9px' }}>
                      <div style={{ fontSize: 6, fontWeight: 700, color: '#6e7491', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 2 }}>ENTRADAS</div>
                      <div style={{ fontSize: 13, fontWeight: 800, color: '#00D764' }}>2.000 €</div>
                    </div>
                    <div style={{ background: '#1c2033', borderRadius: 8, padding: '7px 9px' }}>
                      <div style={{ fontSize: 6, fontWeight: 700, color: '#6e7491', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 2 }}>SAÍDAS</div>
                      <div style={{ fontSize: 13, fontWeight: 800, color: '#ff6b6b' }}>1.000 €</div>
                    </div>
                  </div>
                  <div style={{ background: '#1c2033', borderRadius: 8, padding: '8px 10px' }}>
                    <div style={{ fontSize: 6.5, fontWeight: 700, color: '#6e7491', letterSpacing: '.07em', textTransform: 'uppercase', marginBottom: 6 }}>RADAR DE ATIVOS</div>
                    {[
                      { nome: 'VWCE — Vanguard All World', val: '5.040 €', dot: '#00D764' },
                      { nome: 'Optimize PPR Arrojado',     val: '2.500 €', dot: '#7b7fff' },
                      { nome: 'Bitcoin',                   val: '1.300 €', dot: '#f7931a' },
                    ].map((a, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: i < 2 ? 5 : 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                          <div style={{ width: 5, height: 5, borderRadius: '50%', background: a.dot, flexShrink: 0 }} />
                          <span style={{ fontSize: 7, color: '#c8d0e7' }}>{a.nome}</span>
                        </div>
                        <span style={{ fontSize: 7.5, fontWeight: 700, color: '#fff' }}>{a.val}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Home indicator */}
                <div style={{
                  width: '32%', height: 3, background: 'rgba(255,255,255,.85)',
                  borderRadius: 2, margin: '6px auto 0'
                }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Hook 1 — Investido vs. Valor de Mercado ── */}
      <section id="funcionalidades" style={{
        padding: isMobile ? '4.5rem 1.25rem' : '7rem 2rem',
        position: 'relative',
        zIndex: 5
      }}>
        <div style={{
          maxWidth: 1100,
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
          gap: isMobile ? 36 : 64,
          alignItems: 'center'
        }}>
          {/* ── Coluna texto ── */}
          <div>
            <div style={{
              fontSize: 12,
              color: '#00D764',
              fontWeight: 800,
              letterSpacing: '.18em',
              textTransform: 'uppercase',
              marginBottom: 18
            }}>
              O que nos distingue
            </div>
            <h2 style={{
              fontSize: 'clamp(1.8rem, 3vw, 3rem)',
              fontWeight: 800,
              letterSpacing: '-.04em',
              lineHeight: 1.1,
              color: '#fff',
              margin: '0 0 1.2rem'
            }}>
              O que <span style={{ color: '#00D764' }}>poupaste</span> vs o que o <span style={{ color: '#00D764' }}>mercado</span> te deu
            </h2>
            <p style={{
              fontSize: 'clamp(1rem, 1.2vw, 1.15rem)',
              color: '#c8d0e7',
              lineHeight: 1.55,
              margin: '0 0 1.6rem'
            }}>
              A maioria das apps mostra-te um número. A Flowstate mostra-te dois — para nunca confundires sorte com esforço.
            </p>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {[
                'Vês quanto vem do teu esforço — e quanto vem do mercado a oscilar.',
                'Quando o mercado cai, o teu esforço continua lá. Quando sobe, percebes o ganho real.'
              ].map((b, i) => (
                <li key={i} style={{
                  display: 'flex',
                  gap: 12,
                  alignItems: 'flex-start',
                  marginBottom: 12,
                  color: '#c8d0e7',
                  fontSize: 14.5,
                  lineHeight: 1.55
                }}>
                  <span style={{
                    color: '#00D764',
                    fontSize: 16,
                    lineHeight: 1.4,
                    flexShrink: 0,
                    fontWeight: 800
                  }}>✓</span>
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* ── Coluna mockup do ativo card ── */}
          <div style={{
            background: 'linear-gradient(145deg, #1c2033 0%, #141829 100%)',
            borderRadius: 20,
            padding: isMobile ? 22 : 28,
            border: '1px solid rgba(255,255,255,.06)',
            boxShadow: '0 30px 60px rgba(0,0,0,.4)'
          }}>
            {/* Header do ativo */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 22
            }}>
              <div>
                <div style={{
                  fontSize: 10.5,
                  color: '#6e7491',
                  letterSpacing: '.08em',
                  textTransform: 'uppercase',
                  marginBottom: 4,
                  fontWeight: 700
                }}>ATIVO</div>
                <div style={{ fontSize: 18, color: '#fff', fontWeight: 800, letterSpacing: '-.01em' }}>VWCE</div>
                <div style={{ fontSize: 12, color: '#6e7491' }}>Vanguard FTSE All-World</div>
              </div>
              <div style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                background: 'rgba(0,215,100,.15)',
                border: '1px solid rgba(0,215,100,.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#00D764" strokeWidth="2.5">
                  <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
                  <polyline points="16 7 22 7 22 13" />
                </svg>
              </div>
            </div>

            {/* Investido vs Valor — duas colunas */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 12,
              marginBottom: 16
            }}>
              <div style={{
                background: 'rgba(255,255,255,.04)',
                borderRadius: 12,
                padding: '14px 16px'
              }}>
                <div style={{
                  fontSize: 10,
                  color: '#6e7491',
                  letterSpacing: '.07em',
                  textTransform: 'uppercase',
                  marginBottom: 6,
                  fontWeight: 700
                }}>INVESTIDO</div>
                <div style={{
                  fontSize: 22,
                  fontWeight: 800,
                  color: '#fff',
                  letterSpacing: '-.02em',
                  lineHeight: 1
                }}>5.000 €</div>
                <div style={{ fontSize: 11, color: '#6e7491', marginTop: 4 }}>o teu esforço</div>
              </div>
              <div style={{
                background: 'rgba(0,215,100,.10)',
                borderRadius: 12,
                padding: '14px 16px',
                border: '1px solid rgba(0,215,100,.2)'
              }}>
                <div style={{
                  fontSize: 10,
                  color: '#00D764',
                  letterSpacing: '.07em',
                  textTransform: 'uppercase',
                  marginBottom: 6,
                  fontWeight: 700
                }}>VALOR ATUAL</div>
                <div style={{
                  fontSize: 22,
                  fontWeight: 800,
                  color: '#fff',
                  letterSpacing: '-.02em',
                  lineHeight: 1
                }}>5.420 €</div>
                <div style={{ fontSize: 11, color: '#00D764', marginTop: 4 }}>o que vale hoje</div>
              </div>
            </div>

            {/* Delta do mercado */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 16px',
              background: 'rgba(0,215,100,.08)',
              borderRadius: 10,
              border: '1px dashed rgba(0,215,100,.25)'
            }}>
              <span style={{
                fontSize: 11,
                color: '#6e7491',
                textTransform: 'uppercase',
                letterSpacing: '.07em',
                fontWeight: 700
              }}>Vindo do mercado</span>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <span style={{ fontSize: 16, color: '#00D764', fontWeight: 800 }}>+420 €</span>
                <span style={{ fontSize: 13, color: '#00D764', fontWeight: 700 }}>(+8,4%)</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Hook 2 — Tudo num sítio (grelha 2x2) ── */}
      <section style={{
        padding: isMobile ? '4.5rem 1.25rem' : '7rem 2rem',
        position: 'relative',
        zIndex: 5,
        background: 'rgba(255,255,255,.015)',
        borderTop: '1px solid rgba(255,255,255,.04)',
        borderBottom: '1px solid rgba(255,255,255,.04)'
      }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          {/* Heading centrado */}
          <div style={{ textAlign: 'center', marginBottom: isMobile ? 36 : 56 }}>
            <div style={{
              fontSize: 12,
              color: '#00D764',
              fontWeight: 800,
              letterSpacing: '.18em',
              textTransform: 'uppercase',
              marginBottom: 18
            }}>
              Tudo num sítio
            </div>
            <h2 style={{
              fontSize: 'clamp(1.8rem, 3vw, 3rem)',
              fontWeight: 800,
              letterSpacing: '-.04em',
              lineHeight: 1.1,
              color: '#fff',
              margin: '0 auto 1rem',
              maxWidth: 720
            }}>
              Acompanha cada euro. Sem folhas de Excel
            </h2>
            <p style={{
              fontSize: 'clamp(1rem, 1.2vw, 1.15rem)',
              color: '#c8d0e7',
              lineHeight: 1.55,
              margin: '0 auto',
              maxWidth: 580
            }}>
              Transações, orçamento, subscrições e progresso — tudo a falar a mesma língua.
            </p>
          </div>

          {/* Grelha 2x2 */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
            gap: isMobile ? 16 : 20
          }}>
            {/* ── Card 1 — Categorização ── */}
            <div style={{
              background: 'linear-gradient(145deg, #1c2033 0%, #161a2c 100%)',
              borderRadius: 18,
              padding: isMobile ? 22 : 28,
              border: '1px solid rgba(255,255,255,.06)',
              display: 'flex',
              flexDirection: 'column'
            }}>
              {/* Visual: lista de transações */}
              <div style={{
                background: 'rgba(0,0,0,.25)',
                borderRadius: 12,
                padding: '14px 14px 4px',
                marginBottom: 22,
                border: '1px solid rgba(255,255,255,.04)'
              }}>
                {[
                  { nome: 'Continente Carnaxide',  cat: 'Mercearia',     emoji: '🛒', cor: '#00D764', val: '-42,80 €' },
                  { nome: 'Glovo · Pizzaria Lume', cat: 'Restaurantes',  emoji: '🍕', cor: '#f7931a', val: '-18,50 €' },
                  { nome: 'MB WAY · André',        cat: 'Transferência', emoji: '↗',  cor: '#7b7fff', val: '-25,00 €' }
                ].map((t, i) => (
                  <div key={i} style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '6px 0',
                    borderBottom: i < 2 ? '1px solid rgba(255,255,255,.04)' : 'none'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                      <div style={{
                        width: 26, height: 26, borderRadius: 8,
                        background: 'rgba(255,255,255,.05)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 13, flexShrink: 0
                      }}>{t.emoji}</div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 12, color: '#fff', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.nome}</div>
                        <div style={{ fontSize: 10, color: t.cor, fontWeight: 700 }}>{t.cat}</div>
                      </div>
                    </div>
                    <div style={{ fontSize: 12, color: '#ff6b6b', fontWeight: 700, flexShrink: 0, marginLeft: 8 }}>{t.val}</div>
                  </div>
                ))}
              </div>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#fff', marginBottom: 8, letterSpacing: '-.01em' }}>
                Vê para onde vai o dinheiro
              </div>
              <div style={{ fontSize: 14, color: '#c8d0e7', lineHeight: 1.55 }}>
                Cada transação no sítio certo. Em 10 segundos sabes em que gastaste mais este mês.
              </div>
            </div>

            {/* ── Card 2 — Orçamento ── */}
            <div style={{
              background: 'linear-gradient(145deg, #1c2033 0%, #161a2c 100%)',
              borderRadius: 18,
              padding: isMobile ? 22 : 28,
              border: '1px solid rgba(255,255,255,.06)',
              display: 'flex',
              flexDirection: 'column'
            }}>
              {/* Visual: barras de orçamento */}
              <div style={{
                background: 'rgba(0,0,0,.25)',
                borderRadius: 12,
                padding: '16px 14px',
                marginBottom: 22,
                border: '1px solid rgba(255,255,255,.04)'
              }}>
                {[
                  { nome: 'Restaurantes', spent: 215, limit: 250, cor: '#f7931a' },
                  { nome: 'Mercearia',    spent: 180, limit: 320, cor: '#00D764' },
                  { nome: 'Lazer',        spent: 95,  limit: 80,  cor: '#ff6b6b' }
                ].map((b, i) => {
                  const pct = Math.min(100, Math.round((b.spent / b.limit) * 100));
                  const over = b.spent > b.limit;
                  return (
                    <div key={i} style={{ marginBottom: i < 2 ? 12 : 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                        <span style={{ fontSize: 11, color: '#fff', fontWeight: 600 }}>{b.nome}</span>
                        <span style={{ fontSize: 10, color: over ? '#ff6b6b' : '#6e7491', fontWeight: 700 }}>
                          {b.spent}€ / {b.limit}€
                        </span>
                      </div>
                      <div style={{ height: 5, background: 'rgba(255,255,255,.06)', borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{ height: '100%', background: b.cor, width: pct + '%', borderRadius: 3 }} />
                      </div>
                    </div>
                  );
                })}
              </div>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#fff', marginBottom: 8, letterSpacing: '-.01em' }}>
                Define limites mensais
              </div>
              <div style={{ fontSize: 14, color: '#c8d0e7', lineHeight: 1.55 }}>
                Põe um orçamento por categoria. A app avisa-te quando estás perto do limite — antes do estoiro.
              </div>
            </div>

            {/* ── Card 3 — Subscrições ── */}
            <div style={{
              background: 'linear-gradient(145deg, #1c2033 0%, #161a2c 100%)',
              borderRadius: 18,
              padding: isMobile ? 22 : 28,
              border: '1px solid rgba(255,255,255,.06)',
              display: 'flex',
              flexDirection: 'column'
            }}>
              {/* Visual: subscrições detectadas */}
              <div style={{
                background: 'rgba(0,0,0,.25)',
                borderRadius: 12,
                padding: '14px',
                marginBottom: 22,
                border: '1px solid rgba(255,255,255,.04)'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 10
                }}>
                  <span style={{ fontSize: 10, color: '#6e7491', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em' }}>
                    Detectadas este mês
                  </span>
                  <span style={{ fontSize: 11, color: '#00D764', fontWeight: 800 }}>
                    36,97 € /mês
                  </span>
                </div>
                {[
                  { nome: 'Spotify Premium',     val: '6,99 €',  emoji: '🎵' },
                  { nome: 'Netflix Standard',    val: '13,99 €', emoji: '🎬' },
                  { nome: 'iCloud+ 200 GB',      val: '2,99 €',  emoji: '☁️' },
                  { nome: 'MEO Fibra · Mensal',  val: '13,00 €', emoji: '📡' }
                ].map((s, i) => (
                  <div key={i} style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '5px 0',
                    borderBottom: i < 3 ? '1px solid rgba(255,255,255,.04)' : 'none'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                      <span style={{ fontSize: 12 }}>{s.emoji}</span>
                      <span style={{ fontSize: 11.5, color: '#fff', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.nome}</span>
                    </div>
                    <span style={{ fontSize: 11, color: '#c8d0e7', fontWeight: 700, flexShrink: 0 }}>{s.val}</span>
                  </div>
                ))}
              </div>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#fff', marginBottom: 8, letterSpacing: '-.01em' }}>
                Apanha subscrições esquecidas
              </div>
              <div style={{ fontSize: 14, color: '#c8d0e7', lineHeight: 1.55 }}>
                A Flowstate detecta automaticamente o que pagas todos os meses. Cancela as que já não usas.
              </div>
            </div>

            {/* ── Card 4 — Relatório mensal em PDF ── */}
            <div style={{
              background: 'linear-gradient(145deg, #1c2033 0%, #161a2c 100%)',
              borderRadius: 18,
              padding: isMobile ? 22 : 28,
              border: '1px solid rgba(255,255,255,.06)',
              display: 'flex',
              flexDirection: 'column'
            }}>
              {/* Visual: thumbnail de PDF mensal */}
              <div style={{
                background: 'rgba(0,0,0,.25)',
                borderRadius: 12,
                padding: '18px 14px',
                marginBottom: 22,
                border: '1px solid rgba(255,255,255,.04)',
                position: 'relative',
                overflow: 'hidden'
              }}>
                {/* "Página" do PDF — efeito papel */}
                <div style={{
                  background: '#0f1220',
                  borderRadius: 6,
                  padding: '12px 12px 10px',
                  border: '1px solid rgba(255,255,255,.05)',
                  boxShadow: '0 6px 18px rgba(0,0,0,.4)'
                }}>
                  {/* Header do PDF */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingBottom: 8,
                    marginBottom: 10,
                    borderBottom: '1px solid rgba(255,255,255,.06)'
                  }}>
                    <span style={{ fontSize: 8, fontWeight: 800, color: '#fff', letterSpacing: '1.2px' }}>FLOWSTATE</span>
                    <span style={{ fontSize: 8, color: '#00D764', fontWeight: 700 }}>Abril 2026</span>
                  </div>

                  {/* Resumo do mês — 2 colunas */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
                    <div>
                      <div style={{ fontSize: 6.5, color: '#6e7491', textTransform: 'uppercase', letterSpacing: '.08em', fontWeight: 700, marginBottom: 2 }}>Rendimento</div>
                      <div style={{ fontSize: 12, color: '#fff', fontWeight: 800 }}>2.000 €</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 6.5, color: '#6e7491', textTransform: 'uppercase', letterSpacing: '.08em', fontWeight: 700, marginBottom: 2 }}>Despesas</div>
                      <div style={{ fontSize: 12, color: '#ff6b6b', fontWeight: 800 }}>1.000 €</div>
                    </div>
                  </div>

                  {/* Taxa de Poupança destacada */}
                  <div style={{
                    background: 'rgba(0,215,100,.10)',
                    borderRadius: 6,
                    padding: '6px 10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 10,
                    border: '1px solid rgba(0,215,100,.2)'
                  }}>
                    <span style={{ fontSize: 7, color: '#6e7491', textTransform: 'uppercase', letterSpacing: '.08em', fontWeight: 700 }}>Taxa de Poupança</span>
                    <span style={{ fontSize: 11, color: '#00D764', fontWeight: 800 }}>50%</span>
                  </div>

                  {/* Mini breakdown de categorias */}
                  <div>
                    <div style={{ fontSize: 6.5, color: '#6e7491', textTransform: 'uppercase', letterSpacing: '.08em', fontWeight: 700, marginBottom: 5 }}>Top categorias</div>
                    {[
                      { nome: 'Mercearia',     val: 320, max: 500, cor: '#00D764' },
                      { nome: 'Restaurantes',  val: 215, max: 500, cor: '#f7931a' },
                      { nome: 'Habitação',     val: 410, max: 500, cor: '#7b7fff' }
                    ].map((c, i) => (
                      <div key={i} style={{ marginBottom: i < 2 ? 4 : 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                          <span style={{ fontSize: 7, color: '#c8d0e7' }}>{c.nome}</span>
                          <span style={{ fontSize: 6.5, color: '#6e7491', fontWeight: 700 }}>{c.val}€</span>
                        </div>
                        <div style={{ height: 3, background: 'rgba(255,255,255,.06)', borderRadius: 2 }}>
                          <div style={{ height: '100%', width: (c.val / c.max * 100) + '%', background: c.cor, borderRadius: 2 }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Etiqueta "PDF" */}
                <div style={{
                  position: 'absolute',
                  top: 10,
                  right: 10,
                  background: '#00D764',
                  color: '#000',
                  fontSize: 8,
                  fontWeight: 800,
                  padding: '3px 7px',
                  borderRadius: 4,
                  letterSpacing: '.5px'
                }}>PDF</div>
              </div>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#fff', marginBottom: 8, letterSpacing: '-.01em' }}>
                Recebe um relatório mensal
              </div>
              <div style={{ fontSize: 14, color: '#c8d0e7', lineHeight: 1.55 }}>
                Todos os meses, um PDF profissional com o teu resumo: o que entrou, o que saiu, e onde podes melhorar.
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── Hook 3 — Fundo de Emergência educativo ── */}
      <section style={{
        padding: isMobile ? '4.5rem 1.25rem' : '7rem 2rem',
        position: 'relative',
        zIndex: 5
      }}>
        <div style={{
          maxWidth: 1100,
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
          gap: isMobile ? 36 : 64,
          alignItems: 'center'
        }}>
          {/* ── Coluna mockup (esquerda em desktop, depois em mobile) ── */}
          <div style={{
            order: isMobile ? 2 : 1,
            background: 'linear-gradient(145deg, #1c2033 0%, #141829 100%)',
            borderRadius: 20,
            padding: isMobile ? 22 : 28,
            border: '1px solid rgba(255,255,255,.06)',
            boxShadow: '0 30px 60px rgba(0,0,0,.4)'
          }}>
            {/* Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 18
            }}>
              <div>
                <div style={{
                  fontSize: 10.5,
                  color: '#6e7491',
                  letterSpacing: '.08em',
                  textTransform: 'uppercase',
                  marginBottom: 4,
                  fontWeight: 700
                }}>FUNDO DE EMERGÊNCIA</div>
                <div style={{ fontSize: 12, color: '#c8d0e7' }}>Para 6 meses sem rendimento</div>
              </div>
              <div style={{
                fontSize: 11,
                color: '#00D764',
                fontWeight: 800,
                background: 'rgba(0,215,100,.10)',
                padding: '5px 9px',
                borderRadius: 6,
                border: '1px solid rgba(0,215,100,.25)'
              }}>🛡 Cobertura: 4,5 meses</div>
            </div>

            {/* Saldo grande */}
            <div style={{ textAlign: 'center', marginBottom: 18 }}>
              <div style={{
                fontSize: 36,
                fontWeight: 800,
                color: '#fff',
                letterSpacing: '-.04em',
                lineHeight: 1
              }}>5.400 €</div>
              <div style={{ fontSize: 12, color: '#00D764', fontWeight: 700, marginTop: 6 }}>
                ↑ 75% do teu alvo
              </div>
            </div>

            {/* Barra de progresso */}
            <div style={{ marginBottom: 18 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 11, color: '#6e7491', fontWeight: 700 }}>0 €</span>
                <span style={{ fontSize: 11, color: '#6e7491', fontWeight: 700 }}>7.200 €</span>
              </div>
              <div style={{
                height: 8,
                background: 'rgba(255,255,255,.06)',
                borderRadius: 4,
                overflow: 'hidden',
                position: 'relative'
              }}>
                <div style={{
                  height: '100%',
                  width: '75%',
                  background: 'linear-gradient(90deg, #00b052 0%, #00D764 100%)',
                  borderRadius: 4,
                  boxShadow: '0 0 14px rgba(0,215,100,.4)'
                }} />
              </div>
            </div>

            {/* Cálculo do alvo */}
            <div style={{
              background: 'rgba(0,0,0,.25)',
              borderRadius: 10,
              padding: '12px 14px',
              border: '1px solid rgba(255,255,255,.04)'
            }}>
              <div style={{
                fontSize: 10,
                color: '#6e7491',
                textTransform: 'uppercase',
                letterSpacing: '.07em',
                fontWeight: 700,
                marginBottom: 8
              }}>Como calculámos o teu alvo</div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: 12,
                color: '#c8d0e7'
              }}>
                <span>Despesas essenciais</span>
                <span style={{ color: '#fff', fontWeight: 700 }}>1.200 €/mês</span>
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: 12,
                color: '#c8d0e7',
                marginTop: 4
              }}>
                <span>× 6 meses de cobertura</span>
                <span style={{ color: '#00D764', fontWeight: 800 }}>= 7.200 €</span>
              </div>
            </div>
          </div>

          {/* ── Coluna texto (direita em desktop, primeiro em mobile) ── */}
          <div style={{ order: isMobile ? 1 : 2 }}>
            <div style={{
              fontSize: 12,
              color: '#00D764',
              fontWeight: 800,
              letterSpacing: '.18em',
              textTransform: 'uppercase',
              marginBottom: 18
            }}>
              Fundo de Emergência
            </div>
            <h2 style={{
              fontSize: 'clamp(1.8rem, 3vw, 3rem)',
              fontWeight: 800,
              letterSpacing: '-.04em',
              lineHeight: 1.1,
              color: '#fff',
              margin: '0 0 1.2rem'
            }}>
              Cria a tua <span style={{ color: '#00D764' }}>rede de segurança</span>
            </h2>
            <p style={{
              fontSize: 'clamp(1rem, 1.2vw, 1.15rem)',
              color: '#c8d0e7',
              lineHeight: 1.55,
              margin: '0 0 1.6rem'
            }}>
              A regra é simples: 3 a 6 meses das tuas despesas essenciais, em conta separada, fora do mercado. A Flowstate calcula o teu alvo a partir do teu padrão real — sem adivinhar.
            </p>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {[
                'Quando o imprevisto vier — desemprego, casa, saúde — não precisas de mexer nas poupanças de longo prazo.',
                'Vês ao mês quantos meses de cobertura tens. Se estás em 4,5, sabes exatamente o que falta para chegar a 6.'
              ].map((b, i) => (
                <li key={i} style={{
                  display: 'flex',
                  gap: 12,
                  alignItems: 'flex-start',
                  marginBottom: 12,
                  color: '#c8d0e7',
                  fontSize: 14.5,
                  lineHeight: 1.55
                }}>
                  <span style={{
                    color: '#00D764',
                    fontSize: 16,
                    lineHeight: 1.4,
                    flexShrink: 0,
                    fontWeight: 800
                  }}>✓</span>
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ── Hook 5 — Privacidade & GDPR ── */}
      <section style={{
        padding: isMobile ? '4.5rem 1.25rem' : '7rem 2rem',
        position: 'relative',
        zIndex: 5,
        background: 'rgba(255,255,255,.015)',
        borderTop: '1px solid rgba(255,255,255,.04)',
        borderBottom: '1px solid rgba(255,255,255,.04)'
      }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          {/* Heading centrado */}
          <div style={{ textAlign: 'center', marginBottom: isMobile ? 36 : 56 }}>
            <div style={{
              fontSize: 12,
              color: '#00D764',
              fontWeight: 800,
              letterSpacing: '.18em',
              textTransform: 'uppercase',
              marginBottom: 18
            }}>
              Privacidade
            </div>
            <h2 style={{
              fontSize: 'clamp(1.8rem, 3vw, 3rem)',
              fontWeight: 800,
              letterSpacing: '-.04em',
              lineHeight: 1.1,
              color: '#fff',
              margin: '0 auto 1rem',
              maxWidth: 720
            }}>
              Os teus dados são <span style={{ color: '#00D764' }}>teus</span>
            </h2>
            <p style={{
              fontSize: 'clamp(1rem, 1.2vw, 1.15rem)',
              color: '#c8d0e7',
              lineHeight: 1.55,
              margin: '0 auto',
              maxWidth: 580
            }}>
              Sem ads. Sem partilhas. Sem letra miúda.
            </p>
          </div>

          {/* 3 cards horizontais */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr',
            gap: isMobile ? 14 : 18
          }}>
            {[
              {
                icon: (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#00D764" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    <path d="M9 12l2 2 4-4" />
                  </svg>
                ),
                title: 'Sem ads',
                desc: 'Não há banners, pop-ups nem patrocínios. Pagas a app, tens a app.'
              },
              {
                icon: (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#00D764" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                ),
                title: 'Sem venda de dados',
                desc: 'Os teus dados financeiros não são vendidos a anunciantes, brokers ou parceiros. Nunca.'
              },
              {
                icon: (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#00D764" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M2 12h20" />
                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                  </svg>
                ),
                title: 'Servidores em UE',
                desc: 'Tudo armazenado em servidores europeus, conforme RGPD. Os teus dados não saem da UE.'
              }
            ].map((card, i) => (
              <div key={i} style={{
                background: 'linear-gradient(145deg, #1c2033 0%, #161a2c 100%)',
                borderRadius: 16,
                padding: isMobile ? 22 : 28,
                border: '1px solid rgba(255,255,255,.06)',
                display: 'flex',
                flexDirection: 'column'
              }}>
                <div style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: 'rgba(0,215,100,.10)',
                  border: '1px solid rgba(0,215,100,.25)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 18
                }}>
                  {card.icon}
                </div>
                <div style={{
                  fontSize: 17,
                  fontWeight: 800,
                  color: '#fff',
                  marginBottom: 8,
                  letterSpacing: '-.01em'
                }}>{card.title}</div>
                <div style={{
                  fontSize: 14,
                  color: '#c8d0e7',
                  lineHeight: 1.55
                }}>{card.desc}</div>
              </div>
            ))}
          </div>

          {/* Footer line — projeto português */}
          <div style={{
            textAlign: 'center',
            marginTop: isMobile ? 32 : 48,
            fontSize: 13,
            color: '#6e7491'
          }}>
            🇵🇹 Projeto português · Equipa pequena · Sem investidores que pressionem por dados
          </div>
        </div>
      </section>

      {/* ── Carta do Fundador ── */}
      <section style={{
        padding: isMobile ? '4.5rem 1.25rem' : '7rem 2rem',
        position: 'relative',
        zIndex: 5
      }}>
        <div style={{
          maxWidth: 720,
          margin: '0 auto',
          textAlign: 'center'
        }}>
          {/* Eyebrow */}
          <div style={{
            fontSize: 12,
            color: '#00D764',
            fontWeight: 800,
            letterSpacing: '.18em',
            textTransform: 'uppercase',
            marginBottom: 28
          }}>
            Do fundador
          </div>

          {/* Texto da carta */}
          <div style={{
            fontSize: 'clamp(1.05rem, 1.3vw, 1.25rem)',
            color: '#e5e9f5',
            lineHeight: 1.7,
            textAlign: 'left',
            marginBottom: 36,
            fontWeight: 400,
            letterSpacing: '-.005em'
          }}>
            <p style={{ margin: '0 0 1.1rem' }}>
              Construí a Flowstate porque vejo, todos os dias, a dificuldade de ganhar dinheiro no nosso país — e o acesso muito limitado a conhecimento sobre como lidar com ele.
            </p>
            <p style={{ margin: '0 0 1.1rem' }}>
              Comecei por construí-la só para mim. Quando decidi pôr as minhas finanças em dia, não encontrei nenhuma plataforma simples, adaptada à realidade portuguesa. A frustração rapidamente transformou-se em projeto — porque se me fazia falta a mim, faria falta a muitos.
            </p>
            <p style={{ margin: 0 }}>
              Espero que vos seja útil. E que acrescente algo à vossa vida.
            </p>
          </div>

          {/* Assinatura à mão (PNG branco no dark via CSS filter) */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            marginBottom: 14
          }}>
            <img
              src="/assinatura.png"
              alt="Cláudio"
              style={{
                height: isMobile ? 64 : 78,
                width: 'auto',
                filter: 'invert(1) brightness(1.6)',
                opacity: 0.95
              }}
            />
          </div>

          {/* Nome + cargo */}
          <div style={{
            fontSize: 15,
            color: '#fff',
            fontWeight: 700,
            letterSpacing: '-.01em',
            marginBottom: 4
          }}>
            Cláudio Nobre
          </div>
          <div style={{
            fontSize: 13,
            color: '#6e7491',
            fontWeight: 500
          }}>
            Fundador da Flowstate
          </div>
        </div>
      </section>

      {/* ── Pricing — 2 cards (Grátis + Plus) ── */}
      <section id="precos" style={{
        padding: isMobile ? '4.5rem 1.25rem' : '7rem 2rem',
        position: 'relative',
        zIndex: 5,
        background: 'rgba(255,255,255,.015)',
        borderTop: '1px solid rgba(255,255,255,.04)',
        borderBottom: '1px solid rgba(255,255,255,.04)'
      }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          {/* Heading */}
          <div style={{ textAlign: 'center', marginBottom: isMobile ? 32 : 48 }}>
            <div style={{
              fontSize: 12,
              color: '#00D764',
              fontWeight: 800,
              letterSpacing: '.18em',
              textTransform: 'uppercase',
              marginBottom: 18
            }}>
              Preços
            </div>
            <h2 style={{
              fontSize: 'clamp(1.8rem, 3vw, 3rem)',
              fontWeight: 800,
              letterSpacing: '-.04em',
              lineHeight: 1.1,
              color: '#fff',
              margin: '0 0 1rem'
            }}>
              Começa grátis. Cresce ao teu ritmo
            </h2>
            <p style={{
              fontSize: 'clamp(1rem, 1.2vw, 1.15rem)',
              color: '#c8d0e7',
              lineHeight: 1.55,
              margin: 0
            }}>
              Sobe para o plano Plus quando estiveres pronto.
            </p>
          </div>

          {/* Cards grid — Grátis + Plus */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
            gap: isMobile ? 18 : 22,
            alignItems: 'start'
          }}>

            {/* ── Card 1 — GRÁTIS ── */}
            <div style={{
              background: 'linear-gradient(145deg, #1c2033 0%, #161a2c 100%)',
              borderRadius: 22,
              padding: isMobile ? '28px 24px' : '36px 32px',
              border: '1px solid rgba(255,255,255,.08)',
              display: 'flex',
              flexDirection: 'column'
            }}>
              <div style={{
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: '.18em',
                textTransform: 'uppercase',
                color: '#6e7491',
                marginBottom: 14
              }}>
                Grátis
              </div>
              <div style={{
                fontSize: 'clamp(2.4rem, 4vw, 3rem)',
                fontWeight: 800,
                color: '#fff',
                letterSpacing: '-.04em',
                lineHeight: 1,
                marginBottom: 6
              }}>
                Grátis
              </div>
              <div style={{
                fontSize: 13,
                color: '#6e7491',
                marginBottom: 26
              }}>
                Sem custo. Sem prazo. Para sempre.
              </div>

              {/* Features Grátis */}
              <div style={{
                borderTop: '1px solid rgba(255,255,255,.06)',
                paddingTop: 20,
                marginBottom: 24,
                flex: 1
              }}>
                {[
                  'Dashboard de ganhos e despesas',
                  'Objetivos de poupança',
                  'Orçamento por categoria',
                  'Dicas de literacia financeira'
                ].map((feat, i) => (
                  <div key={i} style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 12,
                    marginBottom: i < 3 ? 10 : 0,
                    fontSize: 14,
                    color: '#e5e9f5',
                    lineHeight: 1.5
                  }}>
                    <span style={{ color: '#00D764', fontWeight: 800, flexShrink: 0, marginTop: 1 }}>✓</span>
                    <span>{feat}</span>
                  </div>
                ))}
              </div>

              {/* CTA Grátis */}
              <button onClick={onShowAuth} style={{
                width: '100%',
                background: 'rgba(255,255,255,.06)',
                color: '#fff',
                border: '1px solid rgba(255,255,255,.12)',
                borderRadius: 14,
                padding: '13px 20px',
                fontSize: 14,
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'background .15s ease'
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,.10)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,.06)'}
              >
                Começar grátis
              </button>
            </div>

            {/* ── Card 2 — COMPLETO ── */}
            <div style={{
              background: 'linear-gradient(145deg, #1c2033 0%, #141829 100%)',
              borderRadius: 22,
              padding: isMobile ? '28px 24px' : '36px 32px',
              border: '1px solid rgba(0,215,100,.25)',
              boxShadow: '0 30px 80px rgba(0,0,0,.5), 0 0 0 1px rgba(0,215,100,.06)',
              display: 'flex',
              flexDirection: 'column',
              position: 'relative'
            }}>
              {/* Badge "Recomendado" */}
              <div style={{
                position: 'absolute',
                top: -11,
                left: 24,
                background: '#00D764',
                color: '#000',
                fontSize: 10,
                fontWeight: 800,
                padding: '4px 10px',
                borderRadius: 6,
                letterSpacing: '.1em',
                textTransform: 'uppercase'
              }}>
                Recomendado
              </div>

              <div style={{
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: '.18em',
                textTransform: 'uppercase',
                color: '#00D764',
                marginBottom: 14
              }}>
                Flow Plus
              </div>

              {/* Toggle Anual/Mensal — dentro do card pago */}
              <div style={{
                display: 'inline-flex',
                background: 'rgba(0,0,0,.25)',
                border: '1px solid rgba(255,255,255,.06)',
                borderRadius: 999,
                padding: 3,
                gap: 3,
                marginBottom: 16,
                alignSelf: 'flex-start'
              }}>
                {[
                  { id: 'anual',  label: 'Anual', badge: '−20%' },
                  { id: 'mensal', label: 'Mensal' }
                ].map(opt => {
                  const active = pricingPeriod === opt.id;
                  return (
                    <button key={opt.id} onClick={() => setPricingPeriod(opt.id)} style={{
                      background: active ? '#00D764' : 'transparent',
                      color: active ? '#000' : '#c8d0e7',
                      border: 'none',
                      borderRadius: 999,
                      padding: '6px 12px',
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      transition: 'background .15s ease, color .15s ease'
                    }}>
                      {opt.label}
                      {opt.badge && (
                        <span style={{
                          fontSize: 9.5,
                          fontWeight: 800,
                          padding: '1px 5px',
                          borderRadius: 3,
                          background: active ? 'rgba(0,0,0,.15)' : 'rgba(0,215,100,.15)',
                          color: active ? '#000' : '#00D764'
                        }}>{opt.badge}</span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Preço */}
              <div style={{ display: 'inline-flex', alignItems: 'baseline', gap: 6, marginBottom: 6 }}>
                <span style={{
                  fontSize: 'clamp(2.4rem, 4vw, 3rem)',
                  fontWeight: 800,
                  color: '#fff',
                  letterSpacing: '-.04em',
                  lineHeight: 1
                }}>
                  {pricingPeriod === 'anual' ? '€3,99' : '€4,99'}
                </span>
                <span style={{ fontSize: 16, color: '#6e7491', fontWeight: 600 }}>/mês</span>
              </div>
              <div style={{ fontSize: 13, color: '#6e7491', marginBottom: 26 }}>
                {pricingPeriod === 'anual'
                  ? 'faturado €47,90/ano · poupas €11,98/ano'
                  : 'faturado mensalmente'}
              </div>

              {/* Features Flow Plus */}
              <div style={{
                borderTop: '1px solid rgba(255,255,255,.06)',
                paddingTop: 20,
                marginBottom: 24,
                flex: 1
              }}>
                {[
                  { text: 'Tudo do plano Grátis', strong: true },
                  { text: 'Investimentos com investido vs. valor de mercado' },
                  { text: 'Fundo de Emergência educativo' },
                  { text: 'Calculadora de investimentos' },
                  { text: 'Objetivos ilimitados' },
                  { text: 'Deteção automática de subscrições' },
                  { text: 'Relatório mensal em PDF' },
                  { text: 'Suporte prioritário' }
                ].map((feat, i, arr) => (
                  <div key={i} style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 12,
                    marginBottom: i < arr.length - 1 ? 10 : 0,
                    fontSize: 14,
                    color: '#e5e9f5',
                    lineHeight: 1.5,
                    fontWeight: feat.strong ? 700 : 400
                  }}>
                    <span style={{ color: '#00D764', fontWeight: 800, flexShrink: 0, marginTop: 1 }}>✓</span>
                    <span>{feat.text}</span>
                  </div>
                ))}
              </div>

              {/* CTA */}
              <button onClick={onShowAuth} style={{
                width: '100%',
                background: '#00D764',
                color: '#000',
                border: 'none',
                borderRadius: 14,
                padding: '14px 20px',
                fontSize: 15,
                fontWeight: 800,
                cursor: 'pointer',
                boxShadow: '0 0 30px rgba(0,215,100,.3)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8
              }}>
                Experimentar 7 dias grátis
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M5 12h14" />
                  <path d="m12 5 7 7-7 7" />
                </svg>
              </button>

              {/* Small print */}
              <div style={{
                fontSize: 11.5,
                color: '#6e7491',
                textAlign: 'center',
                marginTop: 14,
                lineHeight: 1.5
              }}>
                Cartão necessário para o trial. Cancela a qualquer momento durante os 7 dias sem ser cobrado.
              </div>
            </div>

          </div>

          {/* Why isn't it free? */}
          <div style={{ textAlign: 'center', marginTop: 40 }}>
            <button onClick={() => setWhyNotFreeOpen(!whyNotFreeOpen)} style={{
              background: 'transparent',
              border: 'none',
              color: '#c8d0e7',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              padding: '8px 12px',
              textDecoration: 'underline',
              textUnderlineOffset: 4,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6
            }}>
              Porque o plano Plus é pago?
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                   style={{ transform: whyNotFreeOpen ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform .2s' }}>
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            {whyNotFreeOpen && (
              <div style={{
                maxWidth: 640,
                margin: '18px auto 0',
                background: 'rgba(255,255,255,.03)',
                border: '1px solid rgba(255,255,255,.06)',
                borderRadius: 14,
                padding: isMobile ? '20px 18px' : '26px 30px',
                textAlign: 'left',
                color: '#e5e9f5',
                fontSize: 14.5,
                lineHeight: 1.65
              }}>
                <p style={{ margin: '0 0 .9rem' }}>
                  Quero construir a Flowstate a longo prazo. Continuar a melhorar a app durante anos exige tempo, foco — e capital.
                </p>
                <p style={{ margin: 0 }}>
                  Cobrar um preço justo por um produto bem feito é uma das formas mais honestas de manter o projeto vivo. Eu posso continuar a fazer o trabalho que adoro, e tu tens a tranquilidade de saber que nunca vou vender os teus dados — e que cada euro que pagas volta para a app, em melhorias e novas funcionalidades.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" style={{
        padding: isMobile ? '4.5rem 1.25rem' : '7rem 2rem',
        position: 'relative',
        zIndex: 5
      }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          {/* Heading */}
          <div style={{ textAlign: 'center', marginBottom: isMobile ? 32 : 48 }}>
            <div style={{
              fontSize: 12,
              color: '#00D764',
              fontWeight: 800,
              letterSpacing: '.18em',
              textTransform: 'uppercase',
              marginBottom: 18
            }}>
              Perguntas frequentes
            </div>
            <h2 style={{
              fontSize: 'clamp(1.8rem, 3vw, 3rem)',
              fontWeight: 800,
              letterSpacing: '-.04em',
              lineHeight: 1.1,
              color: '#fff',
              margin: '0 0 1rem'
            }}>
              Tudo o que queres saber
            </h2>
          </div>

          {/* FAQ list */}
          <div>
            {[
              {
                q: 'Qual a diferença entre o plano Grátis e o Plus?',
                a: 'O plano Grátis dá acesso ao dashboard de despesas e rendimentos, orçamento por categoria, objetivos de poupança e dicas de literacia financeira — para sempre, sem cartão. O Plus desbloqueia a aba de investimentos com investido vs. valor de mercado, fundo de emergência educativo, calculadora de investimentos, objetivos ilimitados, deteção automática de subscrições, relatório mensal em PDF e suporte prioritário.'
              },
              {
                q: 'Como cancelo o trial dos 7 dias?',
                a: 'Em qualquer altura durante os 7 dias, vai a Conta → Subscrições e clica em "Cancelar". Se cancelares antes do fim do trial, não és cobrado. Sem perguntas, sem retenção forçada.'
              },
              {
                q: 'A Flowstate sincroniza automaticamente com o meu banco?',
                a: 'Ainda não. Hoje as transações são introduzidas manualmente ou por importação de extrato bancário em CSV/Excel. A integração com Open Banking (PSD2) está no roadmap — quando chegar, fica disponível para clientes Plus.'
              },
              {
                q: 'Funciona no iPhone, Android e computador? Como instalo?',
                a: 'Sim, em todos. A Flowstate é uma PWA — funciona em qualquer dispositivo via browser, sem App Store. Para instalares no telemóvel, abre flowstateapp.pt no browser → menu → "Adicionar ao Ecrã Principal" (iPhone) ou "Instalar app" (Android/Chrome). No computador funciona como qualquer site.'
              },
              {
                q: 'Como apago a minha conta?',
                a: 'Envia um email para suporte@flowstateapp.pt a pedir o apagamento. Removemos os teus dados em 30 dias, conforme RGPD.'
              }
            ].map((item, i) => {
              const isOpen = openFaq === i;
              return (
                <div key={i} style={{
                  borderBottom: '1px solid rgba(255,255,255,.08)',
                  ...(i === 0 ? { borderTop: '1px solid rgba(255,255,255,.08)' } : {})
                }}>
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : i)}
                    style={{
                      width: '100%',
                      background: 'transparent',
                      border: 'none',
                      padding: isMobile ? '20px 4px' : '24px 8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 16,
                      cursor: 'pointer',
                      textAlign: 'left',
                      fontFamily: 'inherit'
                    }}
                  >
                    <span style={{
                      fontSize: isMobile ? 15 : 16.5,
                      fontWeight: 700,
                      color: '#fff',
                      letterSpacing: '-.005em',
                      lineHeight: 1.4
                    }}>{item.q}</span>
                    <span style={{
                      flexShrink: 0,
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      background: isOpen ? 'rgba(0,215,100,.15)' : 'rgba(255,255,255,.05)',
                      border: '1px solid ' + (isOpen ? 'rgba(0,215,100,.3)' : 'rgba(255,255,255,.1)'),
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'background .15s ease, border-color .15s ease'
                    }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                           stroke={isOpen ? '#00D764' : '#c8d0e7'} strokeWidth="2.5" strokeLinecap="round"
                           style={{
                             transform: isOpen ? 'rotate(180deg)' : 'rotate(0)',
                             transition: 'transform .25s ease'
                           }}>
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </span>
                  </button>
                  {isOpen && (
                    <div style={{
                      padding: isMobile ? '0 4px 22px' : '0 8px 26px',
                      fontSize: 14.5,
                      color: '#c8d0e7',
                      lineHeight: 1.65,
                      maxWidth: 640
                    }}>
                      {item.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── CTA Final ── */}
      <section style={{
        padding: isMobile ? '6rem 1.25rem' : '10rem 2rem',
        position: 'relative',
        zIndex: 5,
        overflow: 'hidden'
      }}>
        {/* Padrão de pontos no fundo (textura subtil) */}
        <div aria-hidden="true" style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,.045) 1px, transparent 0)',
          backgroundSize: '28px 28px',
          maskImage: 'radial-gradient(ellipse at center, black 30%, transparent 75%)',
          WebkitMaskImage: 'radial-gradient(ellipse at center, black 30%, transparent 75%)',
          pointerEvents: 'none',
          zIndex: 0
        }} />

        {/* Glow radial verde principal */}
        <div aria-hidden="true" style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          width: 1100,
          height: 700,
          background: 'radial-gradient(ellipse at center, rgba(0,215,100,.16) 0%, rgba(0,215,100,.04) 35%, transparent 65%)',
          pointerEvents: 'none',
          zIndex: 0
        }} />

        {/* Glow secundário azulado em baixo */}
        <div aria-hidden="true" style={{
          position: 'absolute',
          left: '50%',
          bottom: -300,
          transform: 'translateX(-50%)',
          width: 700,
          height: 500,
          background: 'radial-gradient(ellipse at center, rgba(123,127,255,.08) 0%, transparent 60%)',
          pointerEvents: 'none',
          zIndex: 0
        }} />

        <div style={{
          maxWidth: 820,
          margin: '0 auto',
          textAlign: 'center',
          position: 'relative',
          zIndex: 1
        }}>
          {/* Eyebrow */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            fontSize: 11.5,
            color: '#00D764',
            fontWeight: 800,
            letterSpacing: '.22em',
            textTransform: 'uppercase',
            marginBottom: 26,
            padding: '7px 16px',
            background: 'rgba(0,215,100,.08)',
            border: '1px solid rgba(0,215,100,.2)',
            borderRadius: 999
          }}>
            <span style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: '#00D764',
              boxShadow: '0 0 10px rgba(0,215,100,.7)'
            }} />
            Pronto para começar?
          </div>

          {/* Headline em duas linhas — segunda linha com gradient */}
          <h2 style={{
            fontSize: 'clamp(2.2rem, 4.5vw, 4rem)',
            fontWeight: 800,
            letterSpacing: '-.05em',
            lineHeight: 1.02,
            color: '#fff',
            margin: '0 0 1.4rem'
          }}>
            Toma o controlo do teu dinheiro.
            <br />
            <span style={{
              backgroundImage: 'linear-gradient(135deg, #00D764 0%, #5fff8e 50%, #00D764 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              fontStyle: 'italic'
            }}>
              Começa hoje.
            </span>
          </h2>

          <p style={{
            fontSize: 'clamp(1rem, 1.3vw, 1.2rem)',
            color: '#c8d0e7',
            lineHeight: 1.55,
            margin: '0 auto 2.6rem',
            maxWidth: 540
          }}>
            Grátis para começar. Sem cartão. Sem prazos.
          </p>

          {/* Card glassmórfico a conter os CTAs */}
          <div style={{
            display: 'inline-flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 14,
            padding: isMobile ? '20px 22px' : '22px 28px',
            background: 'rgba(255,255,255,.025)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid rgba(255,255,255,.08)',
            borderRadius: 22,
            boxShadow: '0 30px 80px rgba(0,0,0,.4), inset 0 1px 0 rgba(255,255,255,.05)'
          }}>
            <button onClick={onShowAuth} style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 12,
              padding: isMobile ? '15px 30px' : '17px 38px',
              borderRadius: 999,
              background: 'linear-gradient(135deg, #00D764 0%, #00b052 100%)',
              color: '#000',
              border: 'none',
              fontSize: isMobile ? 15 : 16,
              fontWeight: 800,
              cursor: 'pointer',
              boxShadow: '0 0 50px rgba(0,215,100,.5), inset 0 1px 0 rgba(255,255,255,.3)',
              transition: 'transform .15s ease, box-shadow .15s ease',
              fontFamily: 'inherit'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 0 70px rgba(0,215,100,.65), inset 0 1px 0 rgba(255,255,255,.3)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 0 50px rgba(0,215,100,.5), inset 0 1px 0 rgba(255,255,255,.3)';
            }}
            >
              Criar conta grátis
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M5 12h14" />
                <path d="m12 5 7 7-7 7" />
              </svg>
            </button>

            <div style={{
              fontSize: 12.5,
              color: '#6e7491'
            }}>
              ou experimenta o{' '}
              <button onClick={onShowAuth} style={{
                background: 'transparent',
                border: 'none',
                color: '#00D764',
                fontWeight: 700,
                fontSize: 12.5,
                cursor: 'pointer',
                padding: 0,
                fontFamily: 'inherit',
                textDecoration: 'underline',
                textUnderlineOffset: 3
              }}>Plus 7 dias grátis</button>
            </div>
          </div>

          {/* Detalhe pequeno no fundo — toque pessoal */}
          <div style={{
            marginTop: 36,
            fontSize: 12,
            color: '#6e7491',
            letterSpacing: '.04em',
            opacity: 0.85
          }}>
            Construído em Portugal 🇵🇹 com cuidado, em código aberto à melhoria contínua.
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <div style={{
        position: 'relative',
        textAlign: 'center',
        padding: isMobile ? '1rem .6rem 1.5rem' : '.6rem .6rem 1rem',
        fontSize: isMobile ? 10 : 11,
        color: '#6e7491',
        zIndex: 1
      }}>
        © 2026 Flowstate · Feito em Portugal para portugueses 🇵🇹
        <br />
        <a href="/termos" style={{ color: '#6e7491', fontFamily: 'Inter,sans-serif', fontSize: isMobile ? 10 : 11, textDecoration: 'underline' }}>
          Termos e Condições
        </a>
        {' · '}
        <a href="/privacidade" style={{ color: '#6e7491', fontFamily: 'Inter,sans-serif', fontSize: isMobile ? 10 : 11, textDecoration: 'underline' }}>
          Política de Privacidade
        </a>
      </div>

      {legalOpen && <LegalOverlay tipo={legalOpen} onClose={() => setLegalOpen(null)} />}
    </div>
  );
}
