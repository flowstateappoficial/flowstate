import React, { useState, useEffect } from 'react';
import useIsMobile from '../hooks/useIsMobile';
import { submitFeedback, isFeedbackConfigured } from '../utils/feedback';

const TYPES = [
  { key: 'bug',        label: '🐛 Bug',        color: '#ff6b6b' },
  { key: 'sugestao',   label: '💡 Sugestão',   color: '#00D764' },
  { key: 'elogio',     label: '❤️ Elogio',     color: '#7b7fff' },
  { key: 'outro',      label: '💬 Outro',      color: '#6e7491' },
];

export default function FeedbackButton({ defaultEmail = '', variant = 'floating', label = 'Dá o teu feedback' }) {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState('bug');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState(defaultEmail);
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState(null); // null | 'ok' | 'err'

  useEffect(() => { setEmail(defaultEmail); }, [defaultEmail]);

  // Esconde-se se não estiver configurado (evita botão inútil).
  if (!isFeedbackConfigured()) return null;

  const reset = () => {
    setMessage(''); setStatus(null); setSending(false); setType('bug');
  };

  const close = () => { setOpen(false); reset(); };

  const send = async () => {
    if (!message.trim() || sending) return;
    setSending(true); setStatus(null);
    try {
      await submitFeedback({ type, message: message.trim(), email: email.trim() });
      setStatus('ok');
      setTimeout(() => { close(); }, 1800);
    } catch (e) {
      setStatus('err');
      setSending(false);
    }
  };

  // ── TRIGGERS ──
  const FloatingTrigger = (
    <button
      onClick={() => setOpen(true)}
      title="Enviar feedback"
      aria-label="Enviar feedback"
      style={{
        position: 'fixed',
        right: isMobile ? 14 : 22,
        bottom: isMobile ? `calc(18px + env(safe-area-inset-bottom, 0px))` : 22,
        zIndex: 6000,
        width: isMobile ? 48 : 52,
        height: isMobile ? 48 : 52,
        borderRadius: '50%',
        border: 'none',
        cursor: 'pointer',
        background: 'linear-gradient(135deg,#00D764,#00b4d8)',
        color: '#000',
        fontSize: isMobile ? 20 : 22,
        fontWeight: 800,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 10px 30px rgba(0,215,100,.35), 0 2px 6px rgba(0,0,0,.3)',
        transition: 'transform .15s ease',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.06)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
    >
      💬
    </button>
  );

  const NavbarTrigger = (
    <button
      onClick={() => setOpen(true)}
      title="Enviar feedback"
      aria-label="Enviar feedback"
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        padding: isMobile ? '7px 10px' : '8px 14px',
        borderRadius: 10,
        border: '1px solid rgba(0,215,100,.35)',
        background: 'rgba(0,215,100,.12)',
        color: '#00D764',
        cursor: 'pointer',
        fontFamily: 'var(--font, Inter, sans-serif)',
        fontSize: isMobile ? 11 : 12,
        fontWeight: 700,
        letterSpacing: '.01em',
        whiteSpace: 'nowrap',
        transition: 'background .15s ease, transform .1s ease',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(0,215,100,.22)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(0,215,100,.12)'; }}
    >
      <span style={{ fontSize: isMobile ? 13 : 14 }}>💬</span>
      <span>{isMobile ? 'Feedback' : label}</span>
    </button>
  );

  return (
    <>
      {!open && (variant === 'navbar' ? NavbarTrigger : FloatingTrigger)}

      {/* Modal */}
      {open && (
        <>
          <div onClick={close} style={{
            position: 'fixed', inset: 0, zIndex: 8000,
            background: 'rgba(10,13,24,.6)', backdropFilter: 'blur(4px)'
          }} />
          <div style={{
            position: 'fixed', zIndex: 8001,
            top: isMobile ? 'auto' : '50%',
            bottom: isMobile ? 0 : 'auto',
            left: isMobile ? 0 : '50%',
            right: isMobile ? 0 : 'auto',
            transform: isMobile ? 'none' : 'translate(-50%,-50%)',
            width: isMobile ? 'auto' : 'min(480px, 92vw)',
            background: 'linear-gradient(180deg, #1a1f35 0%, #161a2e 100%)',
            border: '1px solid rgba(255,255,255,.08)',
            borderRadius: isMobile ? '20px 20px 0 0' : 20,
            padding: isMobile ? '22px 18px calc(22px + env(safe-area-inset-bottom, 0px))' : '26px 26px 22px',
            boxShadow: '0 24px 80px rgba(0,0,0,.6)',
            fontFamily: 'Inter,sans-serif',
            color: '#fff',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <div style={{ fontSize: 18, fontWeight: 800 }}>Ajuda-nos a melhorar</div>
              <button onClick={close} style={{
                background: 'rgba(255,255,255,.06)', border: 'none', borderRadius: 8,
                width: 28, height: 28, color: '#6e7491', fontSize: 14, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>✕</button>
            </div>
            <div style={{ fontSize: 13, color: '#6e7491', marginBottom: 14 }}>
              Beta fechada · Conta-nos o que correu bem, mal, ou o que gostavas de ver.
            </div>

            {/* Tipos */}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
              {TYPES.map(t => {
                const active = type === t.key;
                return (
                  <button
                    key={t.key}
                    onClick={() => setType(t.key)}
                    style={{
                      padding: '7px 12px', borderRadius: 10,
                      background: active ? `${t.color}22` : 'rgba(255,255,255,.04)',
                      border: active ? `1px solid ${t.color}66` : '1px solid rgba(255,255,255,.08)',
                      color: active ? t.color : '#b8bfda',
                      fontSize: 12, fontWeight: 700, cursor: 'pointer',
                      fontFamily: 'Inter,sans-serif',
                    }}
                  >
                    {t.label}
                  </button>
                );
              })}
            </div>

            <label style={{ display: 'block', fontSize: 11, color: '#6e7491', textTransform: 'uppercase', letterSpacing: '.08em', fontWeight: 700, marginBottom: 6 }}>
              Mensagem
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={
                type === 'bug'
                  ? 'Descreve o que aconteceu e como reproduzir o problema…'
                  : 'O que tens em mente?'
              }
              rows={isMobile ? 4 : 5}
              style={{
                width: '100%', boxSizing: 'border-box',
                padding: '10px 12px', borderRadius: 10,
                background: 'rgba(255,255,255,.04)',
                border: '1px solid rgba(255,255,255,.08)',
                color: '#fff', fontSize: 14, lineHeight: 1.5,
                fontFamily: 'Inter,sans-serif', resize: 'vertical',
                outline: 'none',
              }}
            />

            <label style={{ display: 'block', fontSize: 11, color: '#6e7491', textTransform: 'uppercase', letterSpacing: '.08em', fontWeight: 700, margin: '12px 0 6px' }}>
              Email (opcional)
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Para te podermos responder"
              style={{
                width: '100%', boxSizing: 'border-box',
                padding: '10px 12px', borderRadius: 10,
                background: 'rgba(255,255,255,.04)',
                border: '1px solid rgba(255,255,255,.08)',
                color: '#fff', fontSize: 14,
                fontFamily: 'Inter,sans-serif',
                outline: 'none',
              }}
            />

            {status === 'err' && (
              <div style={{ marginTop: 10, fontSize: 12, color: '#ff6b6b' }}>
                Falhou. Verifica a ligação e tenta de novo.
              </div>
            )}
            {status === 'ok' && (
              <div style={{ marginTop: 10, fontSize: 13, color: '#00D764', fontWeight: 700 }}>
                ✓ Obrigado! Recebemos o teu feedback.
              </div>
            )}

            <button
              onClick={send}
              disabled={!message.trim() || sending}
              style={{
                marginTop: 16, width: '100%',
                padding: '12px 14px', borderRadius: 12, border: 'none',
                background: (!message.trim() || sending)
                  ? 'rgba(255,255,255,.08)'
                  : 'linear-gradient(135deg,#00D764,#00b4d8)',
                color: (!message.trim() || sending) ? '#6e7491' : '#000',
                fontSize: 14, fontWeight: 800, cursor: (!message.trim() || sending) ? 'default' : 'pointer',
                fontFamily: 'Inter,sans-serif',
              }}
            >
              {sending ? 'A enviar…' : status === 'ok' ? 'Enviado ✓' : 'Enviar feedback'}
            </button>
          </div>
        </>
      )}
    </>
  );
}
