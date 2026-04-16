import React, { useState, useEffect } from 'react';
import { getNotifType, markAllRead, saveReadIds } from '../utils/notifications';
import useIsMobile from '../hooks/useIsMobile';

function timeAgo(ts) {
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'agora';
  if (mins < 60) return `há ${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `há ${hrs}h`;
  const days = Math.floor(hrs / 24);
  return `há ${days}d`;
}

export default function NotificationCenter({ notifications, readIds, onMarkAllRead, onClose }) {
  const isMobile = useIsMobile();
  const [filter, setFilter] = useState('all'); // 'all' | 'unread'
  const readSet = new Set(readIds);
  const unreadCount = notifications.filter(n => !readSet.has(n.id)).length;

  const filtered = filter === 'unread'
    ? notifications.filter(n => !readSet.has(n.id))
    : notifications;

  return (
    <>
      {/* Backdrop */}
      <div onClick={onClose} style={{
        position: 'fixed', inset: 0, zIndex: 7000, background: 'rgba(10,13,24,.5)'
      }} />

      {/* Panel */}
      <div style={{
        position: 'fixed',
        top: isMobile ? 72 : 60,
        right: isMobile ? 8 : 20,
        left: isMobile ? 8 : 'auto',
        bottom: 'auto',
        zIndex: 7001,
        width: isMobile ? 'auto' : 480,
        maxHeight: isMobile ? 'calc(100vh - 90px)' : 'calc(100vh - 100px)',
        background: 'linear-gradient(180deg, #1a1f35 0%, #161a2e 100%)',
        borderRadius: isMobile ? 18 : 20,
        border: '1px solid rgba(255,255,255,.08)',
        boxShadow: '0 24px 80px rgba(0,0,0,.6)',
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
        animation: 'notifSlideIn .25s ease'
      }}>
        {/* Header */}
        <div style={{
          padding: isMobile ? '14px 16px 10px' : '18px 20px 14px',
          borderBottom: '1px solid rgba(255,255,255,.06)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          gap: 8, minWidth: 0
        }}>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: isMobile ? 16 : 18, fontWeight: 800, color: '#fff' }}>Notificações</div>
            {unreadCount > 0 && (
              <div style={{ fontSize: isMobile ? 12 : 13, color: '#6e7491', marginTop: 3 }}>{unreadCount} por ler</div>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
            {unreadCount > 0 && (
              <button onClick={onMarkAllRead} style={{
                background: 'rgba(0,215,100,.1)', border: '1px solid rgba(0,215,100,.2)',
                borderRadius: 8,
                padding: isMobile ? '6px 10px' : '6px 14px',
                color: '#00D764',
                fontSize: isMobile ? 11 : 12, fontWeight: 700, cursor: 'pointer',
                fontFamily: 'Inter,sans-serif', whiteSpace: 'nowrap'
              }}>
                {isMobile ? 'Ler tudo' : 'Marcar tudo lido'}
              </button>
            )}
            <button onClick={onClose} style={{
              background: 'rgba(255,255,255,.06)', border: 'none', borderRadius: 8,
              width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#6e7491', fontSize: 14, cursor: 'pointer'
            }}>✕</button>
          </div>
        </div>

        {/* Filter tabs */}
        <div style={{
          padding: isMobile ? '8px 14px' : '10px 20px',
          display: 'flex', gap: 6,
          borderBottom: '1px solid rgba(255,255,255,.04)'
        }}>
          {[{ key: 'all', label: 'Todas' }, { key: 'unread', label: 'Por ler' }].map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)} style={{
              padding: isMobile ? '6px 12px' : '7px 16px',
              borderRadius: 8, border: 'none',
              background: filter === f.key ? 'rgba(255,255,255,.1)' : 'transparent',
              color: filter === f.key ? '#fff' : '#6e7491',
              fontSize: isMobile ? 12 : 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter,sans-serif'
            }}>
              {f.label}
            </button>
          ))}
        </div>

        {/* Notification list */}
        <div style={{ flex: 1, overflowY: 'auto', padding: isMobile ? '6px 10px' : '8px 12px', minHeight: 0 }}>
          {filtered.length === 0 ? (
            <div style={{
              textAlign: 'center', padding: '40px 20px', color: '#4a5072'
            }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>🔔</div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>
                {filter === 'unread' ? 'Tudo lido!' : 'Sem notificações'}
              </div>
              <div style={{ fontSize: 11, marginTop: 4 }}>
                {filter === 'unread' ? 'Estás em dia com tudo.' : 'As tuas notificações aparecerão aqui.'}
              </div>
            </div>
          ) : (
            filtered.map(n => {
              const t = getNotifType(n.type);
              const isUnread = !readSet.has(n.id);
              return (
                <div key={n.id} style={{
                  padding: isMobile ? '12px 12px' : '16px 18px',
                  borderRadius: 14, marginBottom: 6,
                  background: isUnread ? 'rgba(255,255,255,.04)' : 'transparent',
                  border: isUnread ? '1px solid rgba(255,255,255,.06)' : '1px solid transparent',
                  transition: 'background .2s',
                  display: 'flex', gap: isMobile ? 10 : 12, alignItems: 'flex-start',
                  minWidth: 0
                }}>
                  {/* Icon */}
                  <div style={{
                    width: isMobile ? 36 : 44, height: isMobile ? 36 : 44,
                    borderRadius: isMobile ? 10 : 12, flexShrink: 0,
                    background: `${t.color}15`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: isMobile ? 16 : 20
                  }}>
                    {t.icon}
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3, gap: 6 }}>
                      <span style={{
                        fontSize: isMobile ? 10 : 11, fontWeight: 800, textTransform: 'uppercase',
                        letterSpacing: '.08em', color: t.color,
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                      }}>
                        {t.label}
                      </span>
                      <span style={{ fontSize: isMobile ? 10 : 11, color: '#4a5072', flexShrink: 0 }}>{timeAgo(n.timestamp)}</span>
                    </div>
                    <div style={{
                      fontSize: isMobile ? 13 : 14, fontWeight: 700, color: isUnread ? '#fff' : '#b8bfda',
                      marginBottom: 3, lineHeight: 1.3
                    }}>
                      {n.title}
                    </div>
                    <div style={{ fontSize: isMobile ? 12 : 13, color: '#6e7491', lineHeight: 1.5 }}>
                      {n.message}
                    </div>
                  </div>

                  {/* Unread dot */}
                  {isUnread && (
                    <div style={{
                      width: isMobile ? 8 : 10, height: isMobile ? 8 : 10, borderRadius: '50%',
                      background: '#00D764', flexShrink: 0, marginTop: 6
                    }} />
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Animation */}
      <style>{`
        @keyframes notifSlideIn {
          from { opacity: 0; transform: translateY(-10px) scale(.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes notifSlideUp {
          from { opacity: 0; transform: translateY(100%); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  );
}
