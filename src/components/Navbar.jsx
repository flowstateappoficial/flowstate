import React, { useState, useRef, useEffect } from 'react';
import useIsMobile from '../hooks/useIsMobile';
import InstallAppButton from './InstallAppButton';
import FeedbackButton from './FeedbackButton';

const PLAN_CFG = {
  free: { label: 'FREE', bg: 'rgba(110,116,145,.2)', color: '#6e7491', border: '1px solid rgba(110,116,145,.3)' },
  plus: { label: 'FLOW PLUS', bg: 'rgba(0,215,100,.15)', color: '#00D764', border: '1px solid rgba(0,215,100,.3)' },
  max: { label: 'FLOW MAX', bg: 'rgba(123,127,255,.15)', color: '#7b7fff', border: '1px solid rgba(123,127,255,.3)' },
};

const ADMIN_EMAILS = ['flowstate.app.oficial@gmail.com'];

const BASE_TABS = [
  { id: 'dash', label: 'Dashboard' },
  { id: 'txs', label: 'Transações' },
  { id: 'inv', label: 'Investimentos' },
  { id: 'convites', label: '🎁 Convites' },
  { id: 'pricing', label: '⚡ Planos', className: 'pricing-tab' },
];

export default function Navbar({ logo, activeTab, onSwitchTab, userPlan, userEmail, onLogout, unreadNotifs, onToggleNotifs }) {
  const isAdmin = ADMIN_EMAILS.includes(userEmail?.toLowerCase());
  const TABS = isAdmin
    ? [...BASE_TABS, { id: 'admin', label: '🛡️ Admin', className: 'admin-tab' }]
    : BASE_TABS;
  const isMobile = useIsMobile();
  const cfg = PLAN_CFG[userPlan] || PLAN_CFG.free;
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // Close the dropdown when clicking outside.
  useEffect(() => {
    if (!menuOpen) return;
    const onDocClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    const onEsc = (e) => { if (e.key === 'Escape') setMenuOpen(false); };
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onEsc);
    };
  }, [menuOpen]);

  const initial = (userEmail || '?').charAt(0).toUpperCase();

  const goTo = (tab) => {
    setMenuOpen(false);
    onSwitchTab(tab);
  };

  const doLogout = () => {
    setMenuOpen(false);
    onLogout && onLogout();
  };

  return (
    <nav className="navbar" style={isMobile ? {
      minHeight: 72,
      // Respect iOS notch / Dynamic Island / status bar safe area.
      padding: 'env(safe-area-inset-top, 0px) 14px 0',
      gap: 10,
    } : undefined}>
      <div className="nav-logo" style={isMobile ? { height: 'auto' } : undefined}>
        <img
          src={logo}
          alt="Flowstate"
          style={isMobile
            ? { height: 68, maxHeight: 'none', width: 'auto', display: 'block' }
            : { height: '200px', maxHeight: 'none', width: 'auto', display: 'block', margin: 'auto 0' }}
        />
      </div>
      {!isMobile && (
        <div className="nav-tabs">
          {TABS.map(tab => (
            <button
              key={tab.id}
              className={`nav-tab${activeTab === tab.id ? ' active' : ''}`}
              onClick={() => onSwitchTab(tab.id)}
              style={tab.id === 'pricing' ? { color: '#00D764' } : undefined}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}
      <div className="nav-right" style={isMobile ? { gap: 8 } : undefined}>
        {/* Feedback button (beta fechada) */}
        <FeedbackButton variant="navbar" defaultEmail={userEmail || ''} />

        {/* Install PWA button (auto-hides if not applicable) */}
        <InstallAppButton />

        {/* Notification bell */}
        <button onClick={onToggleNotifs} style={{
          position: 'relative', background: 'rgba(255,255,255,.06)',
          border: '1px solid rgba(255,255,255,.1)', borderRadius: 10,
          width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', fontSize: 16, color: '#b8bfda'
        }}>
          🔔
          {unreadNotifs > 0 && (
            <span style={{
              position: 'absolute', top: -4, right: -4,
              minWidth: 18, height: 18, borderRadius: 9,
              background: '#ff6b6b', color: '#fff',
              fontSize: 9, fontWeight: 800,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: '0 4px', border: '2px solid #161a2e'
            }}>
              {unreadNotifs > 9 ? '9+' : unreadNotifs}
            </span>
          )}
        </button>

        {/* Avatar + dropdown */}
        <div ref={menuRef} style={{ position: 'relative' }}>
          <button
            onClick={() => setMenuOpen(o => !o)}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            title={userEmail || 'Conta'}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '4px 10px 4px 4px', borderRadius: 24,
              background: menuOpen ? 'rgba(255,255,255,.09)' : 'rgba(255,255,255,.04)',
              border: '1px solid rgba(255,255,255,.1)',
              cursor: 'pointer', fontFamily: 'var(--font)',
            }}
          >
            <span style={{
              width: 30, height: 30, borderRadius: '50%',
              background: 'linear-gradient(135deg,#00D764,#00b4d8)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#000', fontSize: 13, fontWeight: 800,
            }}>
              {initial}
            </span>
            <span style={{
              fontSize: 9, fontWeight: 800, letterSpacing: '.1em',
              padding: '3px 8px', borderRadius: 10,
              background: cfg.bg, color: cfg.color, border: cfg.border,
            }}>
              {cfg.label}
            </span>
            <span style={{ fontSize: 10, color: 'var(--t3)', marginRight: 4 }}>▾</span>
          </button>

          {menuOpen && (
            <div
              role="menu"
              style={{
                position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                minWidth: 240, padding: 6, borderRadius: 14,
                background: '#161a2e', border: '1px solid rgba(255,255,255,.1)',
                boxShadow: '0 14px 40px rgba(0,0,0,.35)',
                zIndex: 50,
              }}
            >
              {/* Email preview */}
              <div style={{ padding: '10px 12px 12px', borderBottom: '1px solid rgba(255,255,255,.06)' }}>
                <div style={{ fontSize: 10, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 3 }}>
                  Sessão iniciada como
                </div>
                <div style={{ fontSize: 13, color: 'var(--t1)', fontWeight: 600, wordBreak: 'break-all' }}>
                  {userEmail || '—'}
                </div>
              </div>

              {/* Items */}
              <button
                onClick={() => goTo('account')}
                role="menuitem"
                style={menuItemStyle(activeTab === 'account')}
              >
                <span style={{ fontSize: 15 }}>👤</span>
                <span>A minha conta</span>
              </button>
              <button
                onClick={() => goTo('pricing')}
                role="menuitem"
                style={menuItemStyle(activeTab === 'pricing')}
              >
                <span style={{ fontSize: 15 }}>⚡</span>
                <span>Ver planos</span>
              </button>

              <div style={{ height: 1, background: 'rgba(255,255,255,.06)', margin: '4px 6px' }} />

              <button
                onClick={doLogout}
                role="menuitem"
                style={{ ...menuItemStyle(false), color: '#ff6b6b' }}
              >
                <span style={{ fontSize: 15 }}>🚪</span>
                <span>Terminar sessão</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

function menuItemStyle(active) {
  return {
    display: 'flex', alignItems: 'center', gap: 10,
    width: '100%', padding: '10px 12px', borderRadius: 10,
    background: active ? 'rgba(0,215,100,.1)' : 'transparent',
    color: active ? '#00D764' : 'var(--t2)',
    border: 'none', cursor: 'pointer', textAlign: 'left',
    fontFamily: 'var(--font)', fontSize: 13, fontWeight: 600,
  };
}
