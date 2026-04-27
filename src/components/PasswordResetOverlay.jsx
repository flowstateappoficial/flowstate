import React, { useState } from 'react';
import { getSupabaseClient } from '../utils/supabase';
import useIsMobile from '../hooks/useIsMobile';

// Overlay que aparece quando o utilizador volta do email de recuperação
// (Supabase dispara o evento PASSWORD_RECOVERY após processar o link). O
// utilizador define a nova password e a sessão fica activa imediatamente.
//
// Props:
//   onDone — chamado depois da password ser alterada com sucesso (e a app
//            pode então prosseguir para o estado autenticado normal).

export default function PasswordResetOverlay({ onDone }) {
  const isMobile = useIsMobile();
  const [pw, setPw] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null); // { kind, text }

  const submit = async () => {
    setMessage(null);
    if (pw.length < 8) {
      setMessage({ kind: 'error', text: 'A password tem de ter pelo menos 8 caracteres.' });
      return;
    }
    if (pw !== confirm) {
      setMessage({ kind: 'error', text: 'As passwords não coincidem.' });
      return;
    }
    const sb = getSupabaseClient();
    if (!sb) {
      setMessage({ kind: 'error', text: 'Sessão indisponível. Volta a abrir o link do email.' });
      return;
    }
    setLoading(true);
    try {
      const { error } = await sb.auth.updateUser({ password: pw });
      if (error) {
        setMessage({ kind: 'error', text: error.message || 'Não foi possível alterar a password.' });
        setLoading(false);
        return;
      }
      setMessage({ kind: 'success', text: 'Password alterada. A entrar…' });
      setTimeout(() => { onDone && onDone(); }, 900);
    } catch (e) {
      setMessage({ kind: 'error', text: 'Erro inesperado. Tenta novamente.' });
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: '#141829',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: isMobile ? '1rem' : '2rem',
      fontFamily: 'Inter,system-ui,sans-serif',
    }}>
      <div style={{ width: '100%', maxWidth: 440, background: '#202638', borderRadius: 20, padding: isMobile ? '2rem 1.5rem' : '2.5rem 2rem', boxShadow: '0 24px 64px rgba(0,0,0,.5)' }}>
        <div style={{
          width: 64, height: 64, borderRadius: '50%',
          background: 'rgba(0,215,100,.1)',
          border: '1px solid rgba(0,215,100,.25)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 28, margin: '0 auto 1.25rem',
        }}>🔐</div>

        <h2 style={{ fontSize: 22, fontWeight: 800, color: '#fff', margin: '0 0 .5rem', letterSpacing: '-.01em', textAlign: 'center' }}>
          Define a nova password
        </h2>
        <p style={{ fontSize: 13, color: '#b8bfda', lineHeight: 1.6, margin: '0 0 1.5rem', textAlign: 'center' }}>
          Mínimo 8 caracteres. Recomendamos usar números e símbolos.
        </p>

        <div style={{ marginBottom: '.75rem' }}>
          <label style={{ display: 'block', fontSize: 10, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: '#6e7491', marginBottom: 6 }}>Nova password</label>
          <input value={pw} onChange={e => setPw(e.target.value)} type="password" placeholder="••••••••"
            autoComplete="new-password" autoFocus
            style={{ width: '100%', height: 42, padding: '0 14px', background: 'rgba(255,255,255,.07)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 10, fontSize: 14, color: '#fff', fontFamily: 'Inter,sans-serif', outline: 'none' }} />
        </div>

        <div style={{ marginBottom: '1.25rem' }}>
          <label style={{ display: 'block', fontSize: 10, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: '#6e7491', marginBottom: 6 }}>Confirmar password</label>
          <input value={confirm} onChange={e => setConfirm(e.target.value)} type="password" placeholder="••••••••"
            autoComplete="new-password"
            onKeyDown={e => { if (e.key === 'Enter') submit(); }}
            style={{ width: '100%', height: 42, padding: '0 14px', background: 'rgba(255,255,255,.07)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 10, fontSize: 14, color: '#fff', fontFamily: 'Inter,sans-serif', outline: 'none' }} />
        </div>

        {message && (
          <div style={{
            padding: '10px 12px', borderRadius: 10, fontSize: 12, marginBottom: '1rem',
            background: message.kind === 'success' ? 'rgba(0,215,100,.08)' : 'rgba(255,107,107,.08)',
            border: '1px solid ' + (message.kind === 'success' ? 'rgba(0,215,100,.25)' : 'rgba(255,107,107,.25)'),
            color: message.kind === 'success' ? '#00D764' : '#ff6b6b',
          }}>
            {message.text}
          </div>
        )}

        <button onClick={submit} disabled={loading}
          style={{ width: '100%', padding: 13, borderRadius: 12, background: '#00D764', color: '#000', border: 'none', fontFamily: 'Inter,sans-serif', fontSize: 14, fontWeight: 800, cursor: loading ? 'wait' : 'pointer', opacity: loading ? 0.7 : 1, boxShadow: '0 0 30px rgba(0,215,100,.25)' }}>
          {loading ? 'A guardar…' : 'Guardar nova password'}
        </button>
      </div>
    </div>
  );
}
