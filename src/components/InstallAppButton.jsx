import React, { useEffect, useState } from 'react';
import { subscribeInstall, promptInstall, isStandalone } from '../utils/pwa';
import useIsMobile from '../hooks/useIsMobile';

// Botão "Instalar app" que só aparece quando o browser permite instalação
// (Chrome/Edge/Android). No iOS, o utilizador usa "Partilhar → Adicionar ao ecrã
// principal" no Safari, por isso mostramos dica se for iOS e ainda não estiver instalado.
function isIOS() {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  return /iPhone|iPad|iPod/.test(ua) && !/CriOS|FxiOS/.test(ua);
}

export default function InstallAppButton({ style, className, iosHint = true, compact = 'auto', title = 'Instalar app' }) {
  const isMobile = useIsMobile();
  const [canInstall, setCanInstall] = useState(false);
  const [installed, setInstalled] = useState(isStandalone());
  const [showIOSTip, setShowIOSTip] = useState(false);
  const isCompact = compact === true || (compact === 'auto' && isMobile);

  useEffect(() => subscribeInstall(({ canInstall }) => setCanInstall(canInstall)), []);

  useEffect(() => {
    const onInstalled = () => setInstalled(true);
    window.addEventListener('appinstalled', onInstalled);
    return () => window.removeEventListener('appinstalled', onInstalled);
  }, []);

  if (installed) return null;

  const handleClick = async () => {
    if (canInstall) {
      await promptInstall();
    } else if (isIOS() && iosHint) {
      setShowIOSTip(true);
    }
  };

  if (!canInstall && !(isIOS() && iosHint)) return null;

  return (
    <>
      <button
        onClick={handleClick}
        className={className}
        title={title}
        aria-label={title}
        style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          gap: isCompact ? 0 : 8,
          padding: isCompact ? 0 : '8px 14px',
          width: isCompact ? 36 : 'auto',
          height: isCompact ? 36 : 'auto',
          borderRadius: isCompact ? 10 : 10,
          background: 'linear-gradient(135deg,#00D764,#00b4d8)',
          color: '#000', border: 'none', cursor: 'pointer',
          fontSize: isCompact ? 16 : 13, fontWeight: 800, fontFamily: 'Inter,sans-serif',
          boxShadow: '0 4px 14px rgba(0,215,100,.22)',
          flexShrink: 0,
          ...style,
        }}
      >
        <span style={{ fontSize: isCompact ? 16 : 14, lineHeight: 1 }}>⬇️</span>
        {!isCompact && <span>Instalar app</span>}
      </button>

      {showIOSTip && (
        <div
          onClick={() => setShowIOSTip(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(10,13,24,.6)',
            display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%', maxWidth: 420,
              background: '#161a2e', color: '#fff',
              borderRadius: '18px 18px 0 0',
              padding: '20px 20px calc(24px + env(safe-area-inset-bottom, 0px))',
              border: '1px solid rgba(255,255,255,.08)',
              fontFamily: 'Inter,sans-serif',
            }}
          >
            <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 10 }}>
              Instalar no iPhone
            </div>
            <ol style={{ paddingLeft: 20, margin: 0, lineHeight: 1.6, fontSize: 13, color: '#b8bfda' }}>
              <li>Toca no botão <b>Partilhar</b> na barra do Safari.</li>
              <li>Escolhe <b>Adicionar ao Ecrã Principal</b>.</li>
              <li>Confirma em <b>Adicionar</b>.</li>
            </ol>
            <button
              onClick={() => setShowIOSTip(false)}
              style={{
                marginTop: 14, width: '100%',
                padding: '10px 14px', borderRadius: 10, border: 'none',
                background: 'rgba(255,255,255,.08)', color: '#fff',
                fontSize: 13, fontWeight: 700, cursor: 'pointer',
              }}
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </>
  );
}
