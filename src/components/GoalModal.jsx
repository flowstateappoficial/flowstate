import React, { useState, useEffect } from 'react';

const COLORS = [
  '#00D764', '#06d6a0', '#0ead69',
  '#00b4d8', '#3a86ff', '#7b7fff',
  '#ff6b9d', '#e63946', '#e53935',
  '#f7931a', '#ffd60a', '#fcbf49',
  '#9d4edd', '#6e7491', '#1d3557',
];

export default function GoalModal({ editId, objetivos, onClose, onSave, onDelete }) {
  const [nome, setNome] = useState('');
  const [atual, setAtual] = useState('');
  const [meta, setMeta] = useState('');
  const [cor, setCor] = useState('#00D764');

  useEffect(() => {
    if (editId) {
      const o = objetivos.find(x => String(x.id) === String(editId));
      if (o) {
        setNome(o.nome); setAtual(o.atual); setMeta(o.meta);
        setCor(o.cor || '#00D764');
      }
    } else {
      setNome(''); setAtual(''); setMeta(''); setCor('#00D764');
    }
  }, [editId, objetivos]);

  const handleSave = () => {
    if (!nome || !meta || parseFloat(meta) <= 0) return;
    onSave({
      id: editId || null,
      nome,
      atual: parseFloat(atual) || 0,
      meta: parseFloat(meta) || 0,
      cor,
    });
  };

  return (
    <div className="overlay open" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal">
        <div className="modal-title">{editId ? 'Editar objetivo' : 'Novo objetivo'}</div>
        <div className="form-field">
          <label>Nome</label>
          <input type="text" value={nome} onChange={e => setNome(e.target.value)} placeholder="Ex: Fundo de Viagem" />
        </div>
        <div className="form-row">
          <div className="form-field">
            <label>Poupado (€)</label>
            <input type="number" value={atual} onChange={e => setAtual(e.target.value)} placeholder="0" min="0" />
          </div>
          <div className="form-field">
            <label>Meta (€)</label>
            <input type="number" value={meta} onChange={e => setMeta(e.target.value)} placeholder="5000" min="0" />
          </div>
        </div>
        <div className="form-field">
          <label>Cor</label>
          <div style={{ display: 'flex', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
            {COLORS.map(c => (
              <div key={c} onClick={() => setCor(c)} style={{
                width: 24, height: 24, borderRadius: '50%', background: c, cursor: 'pointer',
                border: cor === c ? '2.5px solid white' : '2px solid transparent'
              }} />
            ))}
          </div>
        </div>
        <div className="modal-actions">
          <button className="btn-add" onClick={handleSave}>Guardar</button>
          <button className="btn-close-modal" onClick={onClose}>Cancelar</button>
        </div>
        {editId && onDelete && (
          <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid rgba(255,255,255,.06)' }}>
            <button onClick={() => onDelete(String(editId))} style={{ width: '100%', padding: 10, borderRadius: 10, background: 'rgba(229,57,53,.1)', color: 'var(--red-soft)', border: '1px solid rgba(229,57,53,.25)', fontFamily: 'var(--font)', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
              Apagar este objetivo
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
