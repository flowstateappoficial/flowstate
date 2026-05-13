import React from 'react';
import BlogLayout from '../components/BlogLayout';
import { getAllPosts } from '../blog/posts';
import useIsMobile from '../hooks/useIsMobile';

/*
  BlogIndex — lista de artigos publicados, ordenados por data desc.
  Cada artigo é mostrado como card simples (categoria, título, excerpt, data,
  reading time). Clicar abre o artigo individual via History API.
*/

const TEXT  = '#1a1a1a';
const MUTED = '#6b7280';
const ACCENT = '#00805A';
const BORDER = '#e5e7eb';

function formatDate(iso) {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('pt-PT', { day: '2-digit', month: 'long', year: 'numeric' });
  } catch { return iso; }
}

export default function BlogIndex({ logo }) {
  const posts = getAllPosts();
  const isMobile = useIsMobile();

  const openPost = (slug) => (e) => {
    e.preventDefault();
    window.history.pushState({}, '', `/blog/${slug}`);
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  return (
    <BlogLayout logo={logo}>
      {/* Hero do blog */}
      <section style={{ marginBottom: isMobile ? 40 : 56 }}>
        <h1 style={{
          fontSize: isMobile ? 32 : 44,
          fontWeight: 800,
          letterSpacing: '-0.02em',
          color: TEXT,
          lineHeight: 1.1,
          margin: '0 0 16px',
        }}>
          O Blog Flowstate.
        </h1>
        <p style={{
          fontSize: isMobile ? 16 : 18,
          color: MUTED,
          lineHeight: 1.65,
          margin: 0,
          maxWidth: 640,
        }}>
          Um sítio onde falo sobre a minha experiência a aprender finanças pessoais — e tento ajudar
          mais pessoas neste caminho que tem de ser traçado em Portugal: melhorar a nossa capacidade
          de gerar ativos e acabar o mês com mais dinheiro e segurança.
        </p>
      </section>

      {/* Lista de posts */}
      <section>
        {posts.length === 0 && (
          <p style={{ color: MUTED }}>Ainda não há artigos publicados. Volta em breve.</p>
        )}

        {posts.map((post, idx) => (
          <a
            key={post.slug}
            href={`/blog/${post.slug}`}
            onClick={openPost(post.slug)}
            style={{
              display: 'block',
              padding: '28px 0',
              borderTop: idx === 0 ? `1px solid ${BORDER}` : 'none',
              borderBottom: `1px solid ${BORDER}`,
              textDecoration: 'none',
              color: 'inherit',
              transition: 'background .15s ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#fafafa'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10, fontSize: 12, color: MUTED }}>
              <span style={{
                color: ACCENT,
                fontWeight: 700,
                letterSpacing: '.04em',
                textTransform: 'uppercase',
              }}>
                {post.category}
              </span>
              <span>·</span>
              <span>{formatDate(post.date)}</span>
              <span>·</span>
              <span>{post.readingTimeMin} min de leitura</span>
            </div>

            <h2 style={{
              fontSize: isMobile ? 20 : 26,
              fontWeight: 800,
              letterSpacing: '-0.01em',
              color: TEXT,
              lineHeight: 1.25,
              margin: '0 0 8px',
            }}>
              {post.title}
            </h2>

            <p style={{
              fontSize: 15,
              color: MUTED,
              lineHeight: 1.6,
              margin: 0,
            }}>
              {post.excerpt}
            </p>
          </a>
        ))}
      </section>
    </BlogLayout>
  );
}
