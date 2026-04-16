import React from 'react';
import { getSupabaseClient } from '../utils/supabase';

/**
 * ErrorBoundary global — apanha crashes não tratados em toda a app.
 * Grava o erro na tabela `feedback` (type='crash') para o admin ver no dashboard.
 * Mostra um fallback limpo em vez de uma página branca.
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    const message = [
      `[CRASH] ${error?.message || 'Unknown error'}`,
      `Stack: ${error?.stack?.slice(0, 800) || '(sem stack)'}`,
      `Component: ${info?.componentStack?.slice(0, 400) || '(sem info)'}`,
    ].join('\n\n');

    // Grava na tabela feedback como type='crash' (reutiliza a mesma tabela).
    try {
      const sb = getSupabaseClient();
      if (sb) {
        sb.from('feedback').insert([{
          type: 'bug',
          message: `[AUTO-CRASH] ${message}`.slice(0, 5000),
          page: typeof window !== 'undefined' ? window.location.href : null,
          user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
        }]).then(() => {}).catch(() => {});
      }
    } catch {}

    console.error('[ErrorBoundary]', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          background: '#141829',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
          fontFamily: 'Inter, system-ui, sans-serif',
          textAlign: 'center',
          color: '#fff',
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>😵</div>
          <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8, color: '#fff' }}>
            Algo correu mal
          </h2>
          <p style={{ fontSize: 14, color: '#6e7491', maxWidth: 400, lineHeight: 1.6, marginBottom: 24 }}>
            Houve um erro inesperado na app. Já notificámos a equipa automaticamente.
            Tenta recarregar a página.
          </p>
          <div style={{ display: 'flex', gap: 12 }}>
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: '12px 24px',
                borderRadius: 12,
                border: 'none',
                background: 'linear-gradient(135deg, #00D764, #00b4d8)',
                color: '#000',
                fontSize: 14,
                fontWeight: 800,
                cursor: 'pointer',
                fontFamily: 'Inter, sans-serif',
              }}
            >
              Recarregar
            </button>
            <button
              onClick={() => { window.location.href = '/'; }}
              style={{
                padding: '12px 24px',
                borderRadius: 12,
                border: '1px solid rgba(255,255,255,.15)',
                background: 'rgba(255,255,255,.06)',
                color: '#b8bfda',
                fontSize: 14,
                fontWeight: 700,
                cursor: 'pointer',
                fontFamily: 'Inter, sans-serif',
              }}
            >
              Ir para o início
            </button>
          </div>
          <p style={{ fontSize: 11, color: '#3a3f56', marginTop: 32 }}>
            Erro: {this.state.error?.message || 'desconhecido'}
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}
