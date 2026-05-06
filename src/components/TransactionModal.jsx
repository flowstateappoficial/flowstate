import React, { useState } from 'react';
import { CATS } from '../utils/constants';

export default function TransactionModal({ onClose, onAdd }) {
  const [desc, setDesc] = useState('');
  const [val, setVal] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [cat, setCat] = useState('Alimentação');

  // Tipo é derivado da Categoria: 'Rendimento' → rendimento, tudo o resto → despesa.
  // Sanitiza input do valor: remove sinais +/− e qualquer carácter não numérico
  // (excepto vírgula e ponto, separadores decimais válidos).
  const handleValChange = (raw) => {
    const cleaned = String(raw).replace(/[^0-9.,]/g, '').replace(',', '.');
    setVal(cleaned);
  };

  const handleSubmit = () => {
    if (!desc || !val || !date) return;
    const parsed = Math.abs(parseFloat(val));
    if (isNaN(parsed) || parsed <= 0) return;
    const type = cat === 'Rendimento' ? 'rendimento' : 'despesa';
    onAdd({ desc, val: parsed, date, type, cat });
  };

  const isRendimento = cat === 'Rendimento';

  return (
    <div className="overlay open" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal">
        <div className="modal-title">Nova transação</div>
        <div className="form-field">
          <label>Descrição</label>
          <input type="text" value={desc} onChange={e => setDesc(e.target.value)} placeholder="Ex: Supermercado Continente" />
        </div>
        <div className="form-row">
          <div className="form-field">
            <label>Valor (€)</label>
            <input type="text" inputMode="decimal" value={val} onChange={e => handleValChange(e.target.value)} placeholder="0.00" />
          </div>
          <div className="form-field">
            <label>Data</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} />
          </div>
        </div>
        <div className="form-field">
          <label>Categoria</label>
          <select value={cat} onChange={e => setCat(e.target.value)}>
            {CATS.map(c => <option key={c}>{c}</option>)}
          </select>
          <div style={{
            fontSize: 11,
            color: isRendimento ? '#00D764' : '#ff6b6b',
            fontWeight: 700,
            marginTop: 6,
            letterSpacing: '.02em'
          }}>
            {isRendimento ? '+ Rendimento (entrada)' : '− Despesa (saída)'}
          </div>
        </div>
        <div className="modal-actions">
          <button className="btn-add" onClick={handleSubmit}>Adicionar transação</button>
          <button className="btn-close-modal" onClick={onClose}>Cancelar</button>
        </div>
      </div>
    </div>
  );
}
