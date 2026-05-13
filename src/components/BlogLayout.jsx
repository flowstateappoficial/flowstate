import React from 'react';
import useIsMobile from '../hooks/useIsMobile';

/*
  BlogLayout — wrapper para todas as páginas do blog (index + artigos).
  Tema CLARO (fundo branco, texto escuro), em contraste com a app que tem
  tema escuro. Razão: leitura longa cansa menos olhos em fundo claro.

  Responsivo:
  - Desktop: logo grande (120px), botão CTA largo "Conhecer o Flowstate →"
  - Mobile: logo pequeno (44px), botão compacto "App →", padding reduzido

  Header sticky no topo. Footer simples.
*/

const ACCENT = '#00805A';
const TEXT   = '#1a1a1a';
const MUTED  = '#6b7280';
const BORDER = '#e5e7eb';

export default function BlogLayout({ children, logo }) {
  const isMobile = useIsMobile();

  // Logo e link "Artigos" voltam ao índice do blog (convenção: clicar no logo
  // numa secção leva ao topo dessa secção, não para fora dela).
  const goBlog = (e) => {
    e.preventDefault();
    window.history.pushState({}, '', '/blog');
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  // Botão "Conhecer o Flowstate" e footer levam à landing (saída explícita).
  const goHome = (e) => {
    e.preventDefault();
    window.history.pushState({}, '', '/');
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#ffffff',
      color: TEXT,
      fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
      WebkitFontSmoothing: 'antialiased',
      MozOsxFontSmoothing: 'grayscale',
    }}>
      {/* Header */}
      <header style={{
        borderBottom: `1px solid ${BORDER}`,
        background: 'rgba(255,255,255,.92)',
        backdropFilter: 'blur(12px)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}>
        <div style={{
          maxWidth: 960,
          margin: '0 auto',
          padding: isMobile ? '10px 16px' : '8px 32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: isMobile ? 8 : 16,
        }}>
          {/* Logo + "BLOG" label */}
          <a href="/blog" onClick={goBlog} style={{
            display: 'flex',
            alignItems: 'center',
            gap: isMobile ? 10 : 14,
            textDecoration: 'none',
            minWidth: 0, // permite truncar se necessário
          }}>
            {logo && (
              <img
                src={logo}
                alt="Flowstate"
                style={{
                  height: isMobile ? 40 : 120,
                  width: 'auto',
                  display: 'block',
                  flexShrink: 0,
                  // brightness(0) → silhueta preta sólida para destacar no fundo branco.
                  filter: 'brightness(0)',
                }}
              />
            )}
            <span style={{
              fontSize: isMobile ? 11 : 14,
              fontWeight: 700,
              color: TEXT,
              letterSpacing: isMobile ? '.1em' : '.08em',
              borderLeft: `1px solid ${BORDER}`,
              paddingLeft: isMobile ? 10 : 14,
              whiteSpace: 'nowrap',
            }}>BLOG</span>
          </a>

          {/* Nav direita */}
          <nav style={{
            display: 'flex',
            alignItems: 'center',
            gap: isMobile ? 10 : 18,
            fontSize: isMobile ? 13 : 14,
            flexShrink: 0,
          }}>
            <a href="/blog" onClick={goBlog} style={{
              color: MUTED,
              textDecoration: 'none',
              fontWeight: 600,
              whiteSpace: 'nowrap',
            }}>
              Artigos
            </a>
            <a href="/" onClick={goHome} style={{
              color: '#fff',
              background: ACCENT,
              padding: isMobile ? '7px 12px' : '8px 14px',
              borderRadius: 8,
              textDecoration: 'none',
              fontWeight: 700,
              fontSize: isMobile ? 12 : 13,
              whiteSpace: 'nowrap',
            }}>
              {isMobile ? 'App →' : 'Conhecer o Flowstate →'}
            </a>
          </nav>
        </div>
      </header>

      {/* Content */}
      <main style={{
        maxWidth: 960,
        margin: '0 auto',
        padding: isMobile ? '32px 20px 64px' : '56px 32px 96px',
      }}>
        {children}
      </main>

      {/* Footer */}
      <footer style={{
        borderTop: `1px solid ${BORDER}`,
        background: '#fafafa',
        padding: isMobile ? '24px 20px' : '32px 24px',
        textAlign: 'center',
        fontSize: 13,
        color: MUTED,
      }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <p style={{ margin: '0 0 6px' }}>
            <a href="/" onClick={goHome} style={{ color: ACCENT, textDecoration: 'none', fontWeight: 600 }}>
              Flowstate
            </a>
            {' '}— A tua liberdade financeira.
          </p>
          <p style={{ margin: 0, fontSize: 12 }}>
            © {new Date().getFullYear()} Flowstate. Conteúdo informativo, não constitui aconselhamento financeiro.
          </p>
        </div>
      </footer>
    </div>
  );
}
