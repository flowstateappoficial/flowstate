// Flowstate Blog — Registry of posts.
//
// Cada post tem 2 partes:
//   1. Conteúdo em markdown, num ficheiro .md em src/blog/posts/<slug>.md.
//      Importamos o conteúdo como string usando o sufixo `?raw` do Vite.
//   2. Metadata (slug, título, data, excerpt, categoria, autor) — definidos
//      neste ficheiro para fácil edição e ordenação.
//
// Para adicionar um novo post:
//   1. Cria src/blog/posts/<novo-slug>.md
//   2. Adiciona uma entrada à array POSTS abaixo (no topo, ordem decrescente
//      por data)

import excelMd from './posts/excel-financas-pessoais.md?raw';
import subsMd from './posts/subscricoes-silenciosas.md?raw';

export const POSTS = [
  {
    slug: 'subscricoes-silenciosas',
    title: 'Quanto pagas em subscrições por mês? Provavelmente o dobro do que pensas.',
    excerpt: 'A maioria das pessoas subestima as subscrições em pelo menos 50%. Não é falta de atenção — é como o cérebro humano está desenhado. E há uma forma de resolver isto em 10 minutos.',
    category: 'Subscrições',
    date: '2026-05-10',
    readingTimeMin: 8,
    author: 'Cláudio Nobre',
    content: subsMd,
  },
  {
    slug: 'excel-financas-pessoais',
    title: 'Tentei controlar as minhas finanças em Excel durante 3 meses. Falhei.',
    excerpt: 'Demorei anos a perceber que o problema não era eu. Era um sistema que nunca me deu as ferramentas para começar — e isto devia ser ensinado nas escolas.',
    category: 'Mindset',
    date: '2026-05-09',
    readingTimeMin: 8,
    author: 'Cláudio Nobre',
    content: excelMd,
  },
];

// Helpers
export function getPostBySlug(slug) {
  return POSTS.find(p => p.slug === slug) || null;
}

export function getAllPosts() {
  return [...POSTS].sort((a, b) => (a.date < b.date ? 1 : -1));
}
