import React, { useState } from 'react';
import { getSupabaseClient } from '../utils/supabase';
import useIsMobile from '../hooks/useIsMobile';
import LegalOverlay from '../components/LegalOverlay';

export default function AuthPage({ logo, onEnterApp, onBack }) {
  const isMobile = useIsMobile();
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [name, setName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [legalOpen, setLegalOpen] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  // Ecrã dedicado pós-registo a pedir para verificar o email
  // (em vez de mostrar mensagem vermelha no formulário).
  const [pendingEmailVerification, setPendingEmailVerification] = useState(null);

  // Captura convite da URL (/convite/:code) se existir no localStorage.
  React.useEffect(() => {
    try {
      const pending = localStorage.getItem('fs_pending_referral_code');
      if (pending) setInviteCode(pending);
    } catch {}
  }, []);

  const handleSubmit = async () => {
    if (!email || !pass) { setError('Preenche o e-mail e a password.'); return; }
    if (pass.length < 6) { setError('A password deve ter pelo menos 6 caracteres.'); return; }
    const sb = getSupabaseClient();
    if (!sb) { setError('Erro de ligação. Tenta recarregar a página.'); return; }
    setLoading(true); setError('');
    try {
      // ── Termos obrigatórios no registo ──
      if (mode === 'register' && !acceptedTerms) {
        setError('Tens de aceitar os Termos e a Política de Privacidade para criar conta.');
        setLoading(false);
        return;
      }
      // ── Beta fechada: validar convite OU código de referral antes do registo ──
      // Aceitamos duas formas de entrada:
      //   • FS-XXXXXX  → beta_invite (gerado pelo admin)
      //   • FLOWxxxxxx → referral_code (de um utilizador existente)
      let codeType = null;  // 'beta' | 'referral'
      if (mode === 'register') {
        const code = inviteCode.trim().toUpperCase();
        if (!code) {
          setError('Precisas de um código de convite para criar conta durante a beta fechada.');
          setLoading(false);
          return;
        }

        // Tenta primeiro referral (mais comum — partilhado por amigos)
        const { data: isReferral } = await sb.rpc('fs_validate_referral_code', { p_code: code });
        if (isReferral) {
          codeType = 'referral';
          try { localStorage.setItem('fs_pending_referral_code', code); } catch {}
        } else {
          // Fallback: beta_invite FS-XXXXXX
          const { data: isBeta, error: invErr } = await sb.rpc('validate_beta_invite', { p_code: code });
          if (invErr || !isBeta) {
            setError('Código inválido, já usado ou expirado.');
            setLoading(false);
            return;
          }
          codeType = 'beta';
        }
      }

      let result;
      if (mode === 'register') {
        result = await sb.auth.signUp({ email, password: pass, options: { data: { full_name: name } } });
      } else {
        result = await sb.auth.signInWithPassword({ email, password: pass });
      }
      if (result.error) { setError(result.error.message); setLoading(false); return; }
      if (mode === 'register' && !result.data?.session) {
        // Signup OK mas email ainda por confirmar. Mostra ecrã dedicado
        // em vez de mensagem de erro (mais friendly).
        setPendingEmailVerification(email);
        setLoading(false);
        return;
      }

      // ── Pós-registo: consumir beta_invite OU aplicar referral ──
      if (mode === 'register' && inviteCode.trim()) {
        const code = inviteCode.trim().toUpperCase();
        try {
          if (codeType === 'beta') {
            await sb.rpc('claim_beta_invite', { p_code: code });
          } else if (codeType === 'referral') {
            await sb.rpc('fs_apply_referral', { p_code: code });
            try { localStorage.removeItem('fs_pending_referral_code'); } catch {}
          }
        } catch {}
      }

      const user = result.data.user || result.data.session?.user;
      onEnterApp(user);
    } catch (e) {
      const msg = e.message || '';
      if (msg.includes('fetch') || msg.includes('Network')) {
        setError('❌ Erro de ligação. O projeto Supabase pode estar pausado. Usa "Explorar sem conta" para testar.');
      } else setError(msg);
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    const sb = getSupabaseClient();
    if (!sb) return;
    try { await sb.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.href } }); }
    catch (e) { setError(e.message); }
  };

  const handleBypass = () => {
    onEnterApp({ email: 'demo@flowstate.app', name: 'Demo' });
  };

  const handleResendEmail = async () => {
    const sb = getSupabaseClient();
    if (!sb || !pendingEmailVerification) return;
    try {
      await sb.auth.resend({ type: 'signup', email: pendingEmailVerification });
    } catch {}
  };

  // ── ECRÃ DEDICADO: verificação de email pós-registo ──
  if (pendingEmailVerification) {
    return (
      <div id="page-auth-verify" style={{ minHeight: '100vh', background: '#141829', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: isMobile ? '1rem' : '2rem', fontFamily: 'Inter,system-ui,sans-serif' }}>
        <div style={{ marginBottom: '0.3rem', textAlign: 'center' }}>
          <img src={logo} alt="Flowstate" style={{ height: isMobile ? 140 : 200, width: 'auto', display: 'block', margin: '0 auto' }} />
        </div>
        <div style={{ width: '100%', maxWidth: 440, background: '#202638', borderRadius: 20, padding: isMobile ? '2rem 1.5rem' : '2.5rem 2rem', boxShadow: '0 24px 64px rgba(0,0,0,.5)', textAlign: 'center' }}>
          <div style={{
            width: 72, height: 72, borderRadius: '50%',
            background: 'rgba(0,215,100,.1)',
            border: '1px solid rgba(0,215,100,.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 32, margin: '0 auto 1.5rem',
          }}>📬</div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: '#fff', margin: '0 0 .75rem', letterSpacing: '-.01em' }}>
            Confirma o teu e-mail
          </h2>
          <p style={{ fontSize: 14, color: '#b8bfda', lineHeight: 1.6, margin: '0 0 .5rem' }}>
            Enviámos um link de verificação para
          </p>
          <p style={{ fontSize: 15, color: '#00D764', fontWeight: 700, margin: '0 0 1.5rem', wordBreak: 'break-all' }}>
            {pendingEmailVerification}
          </p>
          <div style={{
            padding: '14px 16px', borderRadius: 12,
            background: 'rgba(0,215,100,.06)',
            border: '1px solid rgba(0,215,100,.15)',
            marginBottom: '1.5rem', textAlign: 'left',
          }}>
            <div style={{ fontSize: 12, color: '#b8bfda', lineHeight: 1.6 }}>
              <strong style={{ color: '#fff' }}>Próximo passo:</strong> abre o e-mail e carrega no link para ativar a conta. Podes fechar esta janela — quando voltares, faz login normalmente.
            </div>
          </div>
          <p style={{ fontSize: 12, color: '#6e7491', lineHeight: 1.6, margin: '0 0 1.25rem' }}>
            Não chegou? Verifica a pasta de spam ou{' '}
            <button onClick={handleResendEmail}
              style={{ background: 'none', border: 'none', color: '#00D764', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter,sans-serif', padding: 0, textDecoration: 'underline' }}>
              reenviar agora
            </button>.
          </p>
          <button onClick={() => { setPendingEmailVerification(null); setMode('login'); setError(''); setPass(''); }}
            style={{ width: '100%', padding: 13, borderRadius: 12, background: 'rgba(255,255,255,.06)', color: '#fff', border: '1px solid rgba(255,255,255,.1)', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter,sans-serif' }}>
            Voltar ao login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div id="page-auth" style={{ minHeight: '100vh', background: '#141829', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: isMobile ? '1rem' : '2rem', fontFamily: 'Inter,system-ui,sans-serif' }}>
      <div style={{ marginBottom: '0.3rem', textAlign: 'center' }}>
        <img src={logo} alt="Flowstate" style={{ height: isMobile ? 180 : 320, maxHeight: 'none', width: 'auto', display: 'block', margin: '0 auto' }} />
        <p style={{ fontSize: isMobile ? 12 : 13, color: '#6e7491', fontWeight: 500 }}>A tua liberdade financeira começa aqui.</p>
      </div>
      <div style={{ width: '100%', maxWidth: 400, background: '#202638', borderRadius: 20, padding: isMobile ? '1.5rem 1.25rem' : '2rem 2.5rem', boxShadow: '0 24px 64px rgba(0,0,0,.5)' }}>
        {/* Tabs */}
        <div style={{ display: 'flex', background: 'rgba(255,255,255,.06)', borderRadius: 10, padding: 3, marginBottom: '1.75rem' }}>
          <button onClick={() => { setMode('login'); setError(''); }}
            style={{ flex: 1, padding: 8, borderRadius: 8, border: 'none', fontFamily: 'Inter,sans-serif', fontSize: 13, fontWeight: mode === 'login' ? 700 : 600, cursor: 'pointer', background: mode === 'login' ? '#00D764' : 'transparent', color: mode === 'login' ? '#000' : '#6e7491', transition: 'all .2s' }}>
            Entrar
          </button>
          <button onClick={() => { setMode('register'); setError(''); }}
            style={{ flex: 1, padding: 8, borderRadius: 8, border: 'none', fontFamily: 'Inter,sans-serif', fontSize: 13, fontWeight: mode === 'register' ? 700 : 600, cursor: 'pointer', background: mode === 'register' ? '#00D764' : 'transparent', color: mode === 'register' ? '#000' : '#6e7491', transition: 'all .2s' }}>
            Criar conta
          </button>
        </div>

        {/* Google */}
        <button onClick={handleGoogle}
          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, padding: 13, borderRadius: 12, background: '#fff', color: '#1a1a1a', border: 'none', fontFamily: 'Inter,sans-serif', fontSize: 14, fontWeight: 600, cursor: 'pointer', marginBottom: '1.25rem' }}>
          <svg width="20" height="20" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
          Continuar com Google
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '1.25rem' }}>
          <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,.08)' }} />
          <span style={{ fontSize: 11, color: '#6e7491' }}>ou com e-mail</span>
          <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,.08)' }} />
        </div>

        {mode === 'register' && (
          <>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: 10, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: '#6e7491', marginBottom: 6 }}>Nome</label>
              <input value={name} onChange={e => setName(e.target.value)} type="text" placeholder="O teu nome"
                style={{ width: '100%', height: 42, padding: '0 14px', background: 'rgba(255,255,255,.07)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 10, fontSize: 14, color: '#fff', fontFamily: 'Inter,sans-serif', outline: 'none' }} />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: 10, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: '#00D764', marginBottom: 6 }}>
                🎟️ Código de convite
              </label>
              <input
                value={inviteCode}
                onChange={e => setInviteCode(e.target.value.toUpperCase())}
                type="text"
                placeholder="FS-XXXXXX ou FLOW..."
                maxLength={16}
                style={{
                  width: '100%', height: 42, padding: '0 14px',
                  background: 'rgba(0,215,100,.08)',
                  border: '1px solid rgba(0,215,100,.25)',
                  borderRadius: 10, fontSize: 15, fontWeight: 700,
                  color: '#00D764', fontFamily: 'Inter,sans-serif',
                  outline: 'none', letterSpacing: '.08em', textAlign: 'center',
                }}
              />
              <p style={{ fontSize: 10, color: '#6e7491', marginTop: 4, textAlign: 'center' }}>
                Beta fechada — código de convite ou código de um amigo
              </p>
            </div>
          </>
        )}

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', fontSize: 10, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: '#6e7491', marginBottom: 6 }}>E-mail</label>
          <input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="o.teu@email.com"
            style={{ width: '100%', height: 42, padding: '0 14px', background: 'rgba(255,255,255,.07)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 10, fontSize: 14, color: '#fff', fontFamily: 'Inter,sans-serif', outline: 'none' }} />
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', fontSize: 10, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: '#6e7491', marginBottom: 6 }}>Password</label>
          <input value={pass} onChange={e => setPass(e.target.value)} type="password" placeholder="••••••••"
            onKeyDown={e => { if (e.key === 'Enter') handleSubmit(); }}
            style={{ width: '100%', height: 42, padding: '0 14px', background: 'rgba(255,255,255,.07)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 10, fontSize: 14, color: '#fff', fontFamily: 'Inter,sans-serif', outline: 'none' }} />
        </div>

        {mode === 'register' && (
          <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'flex-start', gap: 8 }}>
            <input
              type="checkbox"
              checked={acceptedTerms}
              onChange={e => setAcceptedTerms(e.target.checked)}
              style={{ marginTop: 2, accentColor: '#00D764', cursor: 'pointer' }}
            />
            <span style={{ fontSize: 11, color: '#6e7491', lineHeight: 1.5 }}>
              Li e aceito os{' '}
              <button onClick={() => setLegalOpen('termos')} style={{ background: 'none', border: 'none', color: '#00D764', cursor: 'pointer', fontFamily: 'Inter,sans-serif', fontSize: 11, textDecoration: 'underline', padding: 0 }}>
                Termos e Condições
              </button>{' '}e a{' '}
              <button onClick={() => setLegalOpen('privacidade')} style={{ background: 'none', border: 'none', color: '#00D764', cursor: 'pointer', fontFamily: 'Inter,sans-serif', fontSize: 11, textDecoration: 'underline', padding: 0 }}>
                Política de Privacidade
              </button>.
            </span>
          </div>
        )}

        {error && (
          <div style={{ background: 'rgba(229,57,53,.15)', border: '1px solid rgba(229,57,53,.3)', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#ff6b6b', marginBottom: '1rem' }}>
            {error}
          </div>
        )}

        <button onClick={handleSubmit} disabled={loading}
          style={{ width: '100%', padding: 13, borderRadius: 12, background: '#00D764', color: '#000', border: 'none', fontFamily: 'Inter,sans-serif', fontSize: 14, fontWeight: 800, cursor: 'pointer', boxShadow: '0 0 30px rgba(0,215,100,.25)' }}>
          {loading ? 'A processar...' : (mode === 'register' ? 'Criar conta' : 'Entrar')}
        </button>

        <div style={{ textAlign: 'center', marginTop: '1rem' }}>
          <button onClick={handleBypass} style={{ background: 'none', border: 'none', fontSize: 11, color: '#6e7491', cursor: 'pointer', fontFamily: 'Inter,sans-serif', textDecoration: 'underline' }}>
            Explorar sem conta (demo)
          </button>
        </div>
      </div>
      <p style={{ marginTop: '1.5rem', fontSize: 11, color: '#6e7491', textAlign: 'center' }}>🔒 Os teus dados estão seguros e encriptados.</p>

      {legalOpen && <LegalOverlay tipo={legalOpen} onClose={() => setLegalOpen(null)} />}
    </div>
  );
}
