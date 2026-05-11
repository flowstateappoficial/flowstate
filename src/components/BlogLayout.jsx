import React from 'react';

/*
  BlogLayout — wrapper para todas as páginas do blog (index + artigos).
  Tema CLARO (fundo branco, texto escuro), em contraste com a app que tem
  tema escuro. Razão: leitura longa cansa menos olhos em fundo claro.

  Header: logo + link para a app (à direita).
  Footer: link de volta para a home + créditos.
*/

const ACCENT = '#00805A';
const TEXT   = '#1a1a1a';
const MUTED  = '#6b7280';
const BORDER = '#e5e7eb';

export default function BlogLayout({ children, logo }) {
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
          padding: '8px 32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
        }}>
          <a href="/blog" onClick={goBlog} style={{ display: 'flex', alignItems: 'center', gap: 14, textDecoration: 'none' }}>
            {logo && (
              <img
                src={logo}
                alt="Flowstate"
                style={{
                  height: 120,
                  width: 'auto',
                  display: 'block',
                  // Logo original é branco (desenhado p/ fundo escuro da app).
                  // Em fundo claro, brightness(0) converte tudo a preto sólido,
                  // mantendo formas mas invertendo a luminosidade.
                  filter: 'brightness(0)',
                }}
              />
            )}
            <span style={{
              fontSize: 14,
              fontWeight: 700,
              color: TEXT,
              letterSpacing: '.08em',
              borderLeft: `1px solid ${BORDER}`,
              paddingLeft: 14,
            }}>BLOG</span>
          </a>
          <nav style={{ display: 'flex', alignItems: 'center', gap: 18, fontSize: 14 }}>
            <a href="/blog" onClick={goBlog} style={{ color: MUTED, textDecoration: 'none', fontWeight: 600 }}>
              Artigos
            </a>
            <a href="/" onClick={goHome} style={{
              color: '#fff',
              background: ACCENT,
              padding: '8px 14px',
              borderRadius: 8,
              textDecoration: 'none',
              fontWeight: 700,
              fontSize: 13,
            }}>
              Conhecer o Flowstate →
            </a>
          </nav>
        </div>
      </header>

      {/* Content */}
      <main style={{
        maxWidth: 960,
        margin: '0 auto',
        padding: '56px 32px 96px',
      }}>
        {children}
      </main>

      {/* Footer */}
      <footer style={{
        borderTop: `1px solid ${BORDER}`,
        background: '#fafafa',
        padding: '32px 24px',
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
