import React, { useState, useEffect } from 'react';

const COLORS = ['#00D764', '#7b7fff', '#f7931a', '#00b4d8', '#e53935'];

export default function GoalModal({ editId, objetivos, onClose, onSave }) {
  const [nome, setNome] = useState('');
  const [atual, setAtual] = useState('');
  const [meta, setMeta] = useState('');
  const [cor, setCor] = useState('#00D764');
  const [isMain, setIsMain] = useState(false);

  useEffect(() => {
    if (editId) {
      const o = objetivos.find(x => String(x.id) === String(editId));
      if (o) {
        setNome(o.nome); setAtual(o.atual); setMeta(o.meta);
        setCor(o.cor || '#00D764'); setIsMain(!!o.isMain);
      }
    } else {
      setNome(''); setAtual(''); setMeta(''); setCor('#00D764');
      // Auto-marcar como principal se não existir nenhum objetivo principal
      setIsMain(!objetivos.some(o => o.isMain));
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
      isMain
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
          <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
            {COLORS.map(c => (
              <div key={c} onClick={() => setCor(c)} style={{
                width: 24, height: 24, borderRadius: '50%', background: c, cursor: 'pointer',
                border: cor === c ? '2.5px solid white' : '2px solid transparent'
              }} />
            ))}
          </div>
        </div>
        <div className="form-field" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <input type="checkbox" checked={isMain} onChange={e => setIsMain(e.target.checked)}
            style={{ width: 16, height: 16, accentColor: 'var(--accent)' }} />
          <label style={{ textTransform: 'none', fontSize: 13, letterSpacing: 0, color: 'var(--t2)' }}>
            Definir como objetivo principal
          </label>
        </div>
        <div className="modal-actions">
          <button className="btn-add" onClick={handleSave}>Guardar</button>
          <button className="btn-close-modal" onClick={onClose}>Cancelar</button>
        </div>
      </div>
    </div>
  );
}
