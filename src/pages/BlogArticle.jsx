import React, { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import BlogLayout from '../components/BlogLayout';
import { getPostBySlug, getAllPosts } from '../blog/posts';

/*
  BlogArticle — renderiza um artigo individual com tipografia editorial.

  Decisões visuais:
  - Drop cap na primeira letra do primeiro parágrafo (clássico tipográfico).
  - Blockquotes com aspas decorativas grandes em verde-accent.
  - Listas numeradas renderizadas como CARDS com badge numerado verde.
  - H2 com pequeno dot accent antes do título (eyebrow visual).
  - Reading progress bar no topo da página (barra fina, accent verde).
  - Inline code subtil (bg cinza claro) em vez do bloco escuro intrusivo.
  - CTA final num card verde-soft com border accent.
*/

const TEXT   = '#1a1a1a';
const MUTED  = '#6b7280';
const ACCENT = '#00805A';
const BORDER = '#e5e7eb';
const SOFT   = '#f0f7f2';

function formatDate(iso) {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('pt-PT', { day: '2-digit', month: 'long', year: 'numeric' });
  } catch { return iso; }
}

// Reading progress bar — calcula a % de scroll na página e renderiza uma
// barra fina no topo. Toque pequeno mas muito engajador.
function ReadingProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const h = document.documentElement;
      const scrolled = h.scrollTop;
      const total = h.scrollHeight - h.clientHeight;
      const pct = total > 0 ? Math.min(100, (scrolled / total) * 100) : 0;
      setProgress(pct);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      height: 3,
      background: 'transparent',
      zIndex: 100,
      pointerEvents: 'none',
    }}>
      <div style={{
        height: '100%',
        width: `${progress}%`,
        background: `linear-gradient(90deg, ${ACCENT} 0%, #00b87a 100%)`,
        transition: 'width .1s ease-out',
        boxShadow: `0 0 8px ${ACCENT}66`,
      }} />
    </div>
  );
}

export default function BlogArticle({ slug, logo }) {
  const post = getPostBySlug(slug);

  // Reset scroll quando navegamos para um artigo (SPA não faz isso sozinho).
  useEffect(() => {
    try { window.scrollTo({ top: 0, behavior: 'instant' }); } catch { window.scrollTo(0, 0); }
  }, [slug]);

  const goBlog = (e) => {
    e.preventDefault();
    window.history.pushState({}, '', '/blog');
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  const goHome = (e) => {
    e.preventDefault();
    window.history.pushState({}, '', '/');
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  const openPost = (s) => (e) => {
    e.preventDefault();
    window.history.pushState({}, '', `/blog/${s}`);
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  // ── Slug não encontrado ──
  if (!post) {
    return (
      <BlogLayout logo={logo}>
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <h1 style={{ fontSize: 32, color: TEXT, margin: '0 0 12px' }}>Artigo não encontrado</h1>
          <p style={{ color: MUTED, margin: '0 0 24px' }}>
            Este artigo pode ter sido movido ou ainda não está publicado.
          </p>
          <a href="/blog" onClick={goBlog} style={{
            color: '#fff',
            background: ACCENT,
            padding: '10px 20px',
            borderRadius: 8,
            textDecoration: 'none',
            fontWeight: 700,
            fontSize: 14,
          }}>
            ← Ver todos os artigos
          </a>
        </div>
      </BlogLayout>
    );
  }

  // ── Artigos sugeridos (até 2) ──
  const suggestions = getAllPosts().filter(p => p.slug !== post.slug).slice(0, 2);

  // Contador de parágrafos para detectar o primeiro (drop cap).
  let pIndex = 0;
  // Numeração das lições é feita em CSS (counter-increment) para evitar
  // bugs com Strict Mode do React, que renderiza componentes 2x em dev e
  // duplicava qualquer contador JS.

  return (
    <BlogLayout logo={logo}>
      <ReadingProgress />

      {/* Wrapper estreito para conteúdo do artigo (linha ~80 chars = leitura ideal) */}
      <div style={{ maxWidth: 720, margin: '0 auto' }}>

        {/* Breadcrumb */}
        <nav style={{ fontSize: 13, marginBottom: 24 }}>
          <a href="/blog" onClick={goBlog} style={{ color: MUTED, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 16 }}>←</span> Todos os artigos
          </a>
        </nav>

        {/* Header do artigo */}
        <header style={{ marginBottom: 40 }}>
          {/* Category pill */}
          <div style={{ marginBottom: 16 }}>
            <span style={{
              display: 'inline-block',
              color: ACCENT,
              background: SOFT,
              padding: '4px 12px',
              borderRadius: 999,
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: '.08em',
              textTransform: 'uppercase',
            }}>
              {post.category}
            </span>
          </div>

          <h1 style={{
            fontSize: 46,
            fontWeight: 800,
            letterSpacing: '-0.025em',
            color: TEXT,
            lineHeight: 1.1,
            margin: '0 0 24px',
          }}>
            {post.title}
          </h1>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            fontSize: 14,
            color: MUTED,
            paddingBottom: 24,
            borderBottom: `1px solid ${BORDER}`,
          }}>
            <span>Por <strong style={{ color: TEXT, fontWeight: 600 }}>{post.author}</strong></span>
            <span>·</span>
            <span>{formatDate(post.date)}</span>
            <span>·</span>
            <span>{post.readingTimeMin} min de leitura</span>
          </div>
        </header>

        {/* Conteúdo markdown */}
        <article className="blog-article" style={{
          fontSize: 18,
          lineHeight: 1.8,
          color: TEXT,
        }}>
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              h1: (props) => <h1 style={{ fontSize: 32, fontWeight: 800, margin: '48px 0 20px', letterSpacing: '-0.01em' }} {...props} />,

              // H2 com pequeno dot accent antes (eyebrow visual)
              h2: ({ children, ...props }) => (
                <h2 style={{
                  fontSize: 30,
                  fontWeight: 800,
                  margin: '56px 0 20px',
                  letterSpacing: '-0.015em',
                  lineHeight: 1.2,
                  position: 'relative',
                  paddingLeft: 20,
                }} {...props}>
                  <span style={{
                    position: 'absolute',
                    left: 0,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: 6,
                    height: 28,
                    background: ACCENT,
                    borderRadius: 3,
                  }} />
                  {children}
                </h2>
              ),

              h3: (props) => <h3 style={{ fontSize: 22, fontWeight: 700, margin: '40px 0 12px', color: TEXT }} {...props} />,

              // P com drop cap no primeiro parágrafo
              p: ({ children, ...props }) => {
                const isFirst = pIndex === 0;
                pIndex++;
                if (isFirst && typeof children === 'object' && children) {
                  // Tenta inserir o drop cap na primeira letra do primeiro filho de texto.
                  return (
                    <p style={{
                      margin: '0 0 22px',
                      fontSize: 18,
                    }} className="first-paragraph" {...props}>{children}</p>
                  );
                }
                return <p style={{ margin: '0 0 22px' }} {...props}>{children}</p>;
              },

              // Listas: estilo aplicado por CSS no <style> abaixo.
              // ul → bullets pequenos verdes
              // ol → cards numerados via CSS counter (à prova de re-renders)
              ul: (props) => <ul className="blog-ul" {...props} />,
              ol: (props) => <ol className="blog-ol" {...props} />,
              li: (props) => <li {...props} />,

              a: (props) => <a style={{ color: ACCENT, textDecoration: 'underline', textUnderlineOffset: 3, fontWeight: 600 }} {...props} />,

              strong: (props) => <strong style={{ fontWeight: 700, color: TEXT }} {...props} />,

              em: (props) => <em style={{ fontStyle: 'italic', color: '#3f3f3f' }} {...props} />,

              // Blockquote com aspas decorativas grandes
              blockquote: ({ children, ...props }) => (
                <blockquote style={{
                  margin: '36px 0',
                  padding: '28px 32px 28px 64px',
                  background: SOFT,
                  borderLeft: `4px solid ${ACCENT}`,
                  borderRadius: '0 12px 12px 0',
                  fontStyle: 'italic',
                  fontSize: 20,
                  lineHeight: 1.6,
                  color: '#0f5c44',
                  position: 'relative',
                  fontWeight: 500,
                }} {...props}>
                  <span style={{
                    position: 'absolute',
                    top: 4,
                    left: 18,
                    fontSize: 64,
                    color: ACCENT,
                    opacity: 0.35,
                    fontFamily: 'Georgia, serif',
                    lineHeight: 1,
                    fontStyle: 'normal',
                    fontWeight: 700,
                  }}>"</span>
                  {children}
                </blockquote>
              ),

              // Inline code: subtil, accent-friendly (em vez de bloco escuro)
              code: ({ inline, ...props }) => inline
                ? <code style={{
                    background: SOFT,
                    color: ACCENT,
                    padding: '2px 8px',
                    borderRadius: 4,
                    fontSize: '0.9em',
                    fontFamily: 'ui-monospace, "SF Mono", Menlo, monospace',
                    fontWeight: 600,
                  }} {...props} />
                : <pre style={{
                    background: '#1a1a1a',
                    color: '#e5e7eb',
                    padding: 18,
                    borderRadius: 10,
                    overflowX: 'auto',
                    fontSize: 14,
                    margin: '24px 0',
                  }}><code {...props} /></pre>,

              // Tabela com estilo limpo
              table: (props) => (
                <div style={{ overflowX: 'auto', margin: '32px 0' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 15 }} {...props} />
                </div>
              ),
              th: (props) => <th style={{ borderBottom: `2px solid ${ACCENT}`, padding: '12px 14px', textAlign: 'left', fontWeight: 700, background: SOFT, color: TEXT }} {...props} />,
              td: (props) => <td style={{ borderBottom: `1px solid ${BORDER}`, padding: '12px 14px' }} {...props} />,

              // Divisor com gradiente accent
              hr: () => (
                <div style={{
                  margin: '48px auto',
                  width: 120,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: ACCENT, opacity: 0.4 }} />
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: ACCENT, opacity: 0.7 }} />
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: ACCENT }} />
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: ACCENT, opacity: 0.7 }} />
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: ACCENT, opacity: 0.4 }} />
                </div>
              ),
            }}
          >
            {post.content}
          </ReactMarkdown>
        </article>

        {/* CTA premium box */}
        <aside style={{
          marginTop: 64,
          padding: '36px 32px',
          background: `linear-gradient(135deg, ${SOFT} 0%, #e6f4ed 100%)`,
          border: `2px solid ${ACCENT}33`,
          borderRadius: 16,
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* Decorative corner accent */}
          <div style={{
            position: 'absolute',
            top: -20,
            right: -20,
            width: 80,
            height: 80,
            background: ACCENT,
            opacity: 0.08,
            borderRadius: '50%',
          }} />
          <h3 style={{
            fontSize: 24,
            fontWeight: 800,
            color: TEXT,
            margin: '0 0 10px',
            letterSpacing: '-0.01em',
            position: 'relative',
          }}>
            Pronto para pôr isto em prática?
          </h3>
          <p style={{
            color: '#475569',
            fontSize: 16,
            margin: '0 0 24px',
            lineHeight: 1.6,
            position: 'relative',
            maxWidth: 480,
            marginLeft: 'auto',
            marginRight: 'auto',
            marginBottom: 24,
          }}>
            O Flowstate organiza as tuas finanças em 10 minutos por mês — sem aceder ao teu banco, sem complicações.
          </p>
          <a href="/" onClick={goHome} style={{
            display: 'inline-block',
            color: '#fff',
            background: ACCENT,
            padding: '14px 32px',
            borderRadius: 10,
            textDecoration: 'none',
            fontWeight: 700,
            fontSize: 15,
            position: 'relative',
            boxShadow: `0 6px 20px ${ACCENT}40`,
            transition: 'transform .15s ease',
          }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            Experimentar 7 dias grátis →
          </a>
        </aside>

        {/* Artigos sugeridos */}
        {suggestions.length > 0 && (
          <section style={{ marginTop: 72 }}>
            <h3 style={{
              fontSize: 14,
              fontWeight: 800,
              color: MUTED,
              margin: '0 0 24px',
              letterSpacing: '.1em',
              textTransform: 'uppercase',
            }}>
              Continua a ler
            </h3>
            {suggestions.map((s) => (
              <a key={s.slug}
                 href={`/blog/${s.slug}`}
                 onClick={openPost(s.slug)}
                 style={{
                   display: 'block',
                   padding: '24px 0',
                   borderTop: `1px solid ${BORDER}`,
                   textDecoration: 'none',
                   color: 'inherit',
                   transition: 'background .15s ease',
                 }}
                 onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.7'; }}
                 onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
              >
                <div style={{ fontSize: 11, color: ACCENT, fontWeight: 800, letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: 8 }}>
                  {s.category}
                </div>
                <div style={{ fontSize: 20, fontWeight: 700, color: TEXT, margin: '0 0 6px', letterSpacing: '-0.01em' }}>
                  {s.title}
                </div>
                <div style={{ fontSize: 14, color: MUTED, lineHeight: 1.5 }}>
                  {s.excerpt}
                </div>
              </a>
            ))}
          </section>
        )}

      </div>

      {/* CSS para elementos que não fazem bem em inline styles
          (pseudo-elements ::before, ::first-letter, CSS counters). */}
      <style>{`
        /* Drop cap na primeira letra do primeiro parágrafo */
        .blog-article .first-paragraph::first-letter {
          font-size: 4.5em;
          font-weight: 800;
          float: left;
          line-height: 0.9;
          margin: 0.04em 0.12em 0 0;
          color: ${ACCENT};
          font-family: Georgia, 'Times New Roman', serif;
        }

        /* Bullet list: pontos pequenos verdes */
        .blog-article ul.blog-ul {
          margin: 0 0 24px;
          padding-left: 4px;
          list-style: none;
        }
        .blog-article ul.blog-ul > li {
          position: relative;
          margin: 0 0 12px;
          padding-left: 24px;
          list-style: none;
        }
        .blog-article ul.blog-ul > li::before {
          content: '';
          position: absolute;
          left: 0;
          top: 0.7em;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: ${ACCENT};
        }

        /* Lista numerada: cards com badge verde via CSS counter (à prova de
           Strict Mode — não duplica como o contador JS duplicava). */
        .blog-article ol.blog-ol {
          margin: 24px 0 32px;
          padding: 0;
          list-style: none;
          counter-reset: lesson;
        }
        .blog-article ol.blog-ol > li {
          position: relative;
          padding: 20px 24px 20px 64px;
          margin: 0 0 12px;
          background: #fafafa;
          border: 1px solid ${BORDER};
          border-left: 3px solid ${ACCENT};
          border-radius: 12px;
          list-style: none;
          counter-increment: lesson;
          font-size: 17px;
          line-height: 1.7;
        }
        .blog-article ol.blog-ol > li::before {
          content: counter(lesson);
          position: absolute;
          left: 18px;
          top: 22px;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: ${ACCENT};
          color: #fff;
          font-size: 14px;
          font-weight: 800;
          display: flex;
          align-items: center;
          justify-content: center;
          line-height: 1;
        }
        .blog-article ol.blog-ol > li > p {
          margin: 0;
        }
      `}</style>
    </BlogLayout>
  );
}
