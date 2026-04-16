import React from 'react';

// ── BottomNav ──
// Fixed bottom tab bar shown on mobile (useIsMobile). Matches the top Navbar's
// 5 main tabs and adds a compact 'Conta' tab (normally inside the avatar dropdown).
// Safe-area padding via env(safe-area-inset-bottom) for iOS notch/home indicator.

const TABS = [
  { id: 'dash',     label: 'Início',    icon: '🏠' },
  { id: 'txs',      label: 'Contas',    icon: '💳' },
  { id: 'inv',      label: 'Investir',  icon: '📈' },
  { id: 'convites', label: 'Convites',  icon: '🎁' },
  { id: 'account',  label: 'Conta',     icon: '👤' },
];

export default function BottomNav({ activeTab, onSwitchTab }) {
  return (
    <nav
      role="navigation"
      aria-label="Navegação principal"
      style={{
        position: 'fixed',
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 40,
        display: 'flex',
        justifyContent: 'space-around',
        alignItems: 'stretch',
        background: 'rgba(14,17,33,.92)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(255,255,255,.08)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        fontFamily: 'var(--font)',
      }}
    >
      {TABS.map(tab => {
        const active = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onSwitchTab(tab.id)}
            aria-current={active ? 'page' : undefined}
            aria-label={tab.label}
            style={{
              flex: 1,
              minWidth: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 3,
              padding: '8px 2px 10px',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: active ? '#00D764' : '#6e7491',
              transition: 'color .2s',
              position: 'relative',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            {active && (
              <span style={{
                position: 'absolute',
                top: 0,
                left: '50%',
                transform: 'translateX(-50%)',
                width: 28,
                height: 2,
                borderRadius: 2,
                background: '#00D764',
              }} />
            )}
            <span style={{ fontSize: 20, lineHeight: 1, opacity: active ? 1 : 0.85 }}>{tab.icon}</span>
            <span style={{
              fontSize: 10,
              fontWeight: active ? 800 : 600,
              letterSpacing: '.02em',
              whiteSpace: 'nowrap',
            }}>
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
