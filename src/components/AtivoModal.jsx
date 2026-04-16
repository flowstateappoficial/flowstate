import React, { useState, useEffect } from 'react';
import { saveAtivoToSupabase, saveAtivoEntry } from '../utils/supabase';

const COLORS = ['#00D764', '#7b7fff', '#f7931a', '#00b4d8', '#e53935', '#ffd60a'];
const TIPOS = ['ETF', 'PPR', 'Ação', 'Crypto', 'Obrigação', 'Imobiliário', 'Outro'];

export default function AtivoModal({ editId, ativos, ativoEntries, invMonth, currentUser, saveAtivosLocal, updateAtivoEntries, onClose, onReload }) {
  const [nome, setNome] = useState('');
  const [tipo, setTipo] = useState('ETF');
  const [valor, setValor] = useState('');
  const [notas, setNotas] = useState('');
  const [cor, setCor] = useState('#00D764');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editId) {
      const a = ativos.find(x => String(x.id) === String(editId));
      if (a) {
        setNome(a.nome); setTipo(a.tipo); setCor(a.cor || '#00D764'); setNotas(a.notas || '');
        const val = (ativoEntries[editId] || {})[invMonth] || '';
        setValor(val);
      }
    } else {
      setNome(''); setTipo('ETF'); setValor(''); setNotas(''); setCor('#00D764');
    }
  }, [editId, ativos, ativoEntries, invMonth]);

  const handleSave = async () => {
    if (!nome) return;
    setSaving(true);
    const obj = { id: editId || null, nome, tipo, cor, notas };
    let savedId = obj.id;

    if (currentUser) {
      const id = await saveAtivoToSupabase(obj, currentUser.id);
      if (id) savedId = id;
    }
    if (!savedId) savedId = 'local_' + Date.now();
    obj.id = savedId;

    const newAtivos = [...ativos];
    if (editId) {
      const i = newAtivos.findIndex(x => String(x.id) === String(editId));
      if (i >= 0) newAtivos[i] = obj; else newAtivos.push(obj);
    } else {
      newAtivos.push(obj);
    }
    saveAtivosLocal(newAtivos);

    const v = parseFloat(valor) || 0;
    if (v > 0) {
      const newEntries = { ...ativoEntries };
      if (!newEntries[obj.id]) newEntries[obj.id] = {};
      newEntries[obj.id][invMonth] = v;
      updateAtivoEntries(newEntries);
      if (currentUser) saveAtivoEntry(obj.id, invMonth, v, currentUser.id);
    }

    setSaving(false);
    onClose();
    if (currentUser) onReload();
  };

  return (
    <div className="overlay open" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal">
        <div className="modal-title">{editId ? 'Editar ativo' : 'Adicionar ativo'}</div>
        <div className="form-field">
          <label>Nome do ativo</label>
          <input type="text" value={nome} onChange={e => setNome(e.target.value)} placeholder="Ex: VWCE, Bitcoin, PPR Arrojado" />
        </div>
        <div className="form-row">
          <div className="form-field">
            <label>Tipo</label>
            <select value={tipo} onChange={e => setTipo(e.target.value)}>
              {TIPOS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="form-field">
            <label>Valor neste mês (€)</label>
            <input type="number" value={valor} onChange={e => setValor(e.target.value)} placeholder="0.00" min="0" step="10" />
          </div>
        </div>
        <div className="form-field">
          <label>Notas (opcional)</label>
          <input type="text" value={notas} onChange={e => setNotas(e.target.value)} placeholder="Ex: Trade Republic · 42 unidades" />
        </div>
        <div className="form-field">
          <label>Cor no gráfico</label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 6 }}>
            {COLORS.map(c => (
              <div key={c} onClick={() => setCor(c)} style={{
                width: 28, height: 28, borderRadius: '50%', background: c, cursor: 'pointer',
                border: cor === c ? '2.5px solid white' : '2px solid transparent'
              }} />
            ))}
          </div>
        </div>
        <div className="modal-actions">
          <button className="btn-add" onClick={handleSave} disabled={saving}>
            {saving ? 'A guardar...' : 'Guardar'}
          </button>
          <button className="btn-close-modal" onClick={onClose}>Cancelar</button>
        </div>
      </div>
    </div>
  );
}
