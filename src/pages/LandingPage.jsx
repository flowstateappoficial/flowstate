import React, { useState } from 'react';
import useIsMobile from '../hooks/useIsMobile';
import LegalOverlay from '../components/LegalOverlay';

export default function LandingPage({ logo, onShowAuth }) {
  const isMobile = useIsMobile();
  const [legalOpen, setLegalOpen] = useState(null);
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

      {/* ── Logo ── */}
      <div style={{ position: isMobile ? 'relative' : 'absolute', top: 0, left: 0, zIndex: 20, padding: isMobile ? '0.5rem 1rem 0' : '1.2rem 2rem', textAlign: isMobile ? 'center' : 'left' }}>
        <img src={logo} alt="Flowstate" style={{ height: isMobile ? 140 : 240, width: 'auto', display: isMobile ? 'inline-block' : 'block' }} />
      </div>

      {/* ── Hero ── */}
      <div style={{
        position: 'relative',
        zIndex: 10,
        textAlign: 'center',
        padding: isMobile ? '0.5rem 1.25rem 0' : '4.5rem 2rem 0'
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
          A app de gestão financeira e literacia para portugueses, segura no PC e Telemóvel.
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
                }}>FUGA MODERADA</div>
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
                  <div style={{ fontSize: 7, fontWeight: 700, color: 'rgba(0,0,0,.5)', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 4 }}>TAXA DE FUGA</div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: '#000', letterSpacing: '-.04em', lineHeight: 1 }}>50%</div>
                  <div style={{ fontSize: 6.5, color: 'rgba(0,0,0,.5)', marginTop: 4 }}>do rendimento poupado/investido</div>
                  <div style={{ fontSize: 6.5, color: 'rgba(0,0,0,.45)', marginTop: 2 }}>↑ taxa de fuga calculada</div>
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
                  <div style={{ fontSize: 6.5, fontWeight: 700, color: '#6e7491', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 6 }}>POTES AUTONOMIA</div>
                  {[
                    { nome: 'Fundo de Paz',       val: '6.200 / 7.350', pct: 84,  cor: '#00D764' },
                    { nome: 'Fundo de Liberdade', val: '8.800 inv.',    pct: 73,  cor: '#7b7fff' },
                    { nome: 'Lazer Agora',        val: '980 / 300',     pct: 100, cor: '#f7931a' },
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
                    <div style={{ fontSize: 6.5, fontWeight: 700, color: 'rgba(0,0,0,.5)', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 2 }}>TAXA DE FUGA</div>
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
