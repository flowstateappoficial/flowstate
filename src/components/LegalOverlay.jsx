import React from 'react';
import { LEGAL_CONTENT } from '../utils/constants';

export default function LegalOverlay({ tipo, onClose }) {
  const data = LEGAL_CONTENT[tipo];
  if (!data) return null;

  return (
    <div onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(10,13,24,.9)', zIndex: 9500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
      <div style={{ background: '#202638', borderRadius: 20, maxWidth: 560, width: '100%', maxHeight: '80vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.5rem 2rem', borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#fff' }}>{data.title}</div>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(255,255,255,.07)', border: 'none', cursor: 'pointer', color: '#6e7491', fontSize: 16 }}>✕</button>
        </div>
        <div style={{ padding: '1.5rem 2rem', overflowY: 'auto', fontSize: 13, color: '#9ba3c4', lineHeight: 1.7 }}
          dangerouslySetInnerHTML={{ __html: data.body }} />
      </div>
    </div>
  );
}
