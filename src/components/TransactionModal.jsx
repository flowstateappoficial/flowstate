import React, { useState } from 'react';
import { CATS } from '../utils/constants';

export default function TransactionModal({ onClose, onAdd }) {
  const [desc, setDesc] = useState('');
  const [val, setVal] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [type, setType] = useState('despesa');
  const [cat, setCat] = useState('Alimentação');

  // Sanitiza input do valor: remove sinais +/− e qualquer carácter não numérico
  // (excepto vírgula e ponto, que são separadores decimais válidos). Evita que
  // o utilizador insira valores negativos por engano — o sinal é determinado
  // pela escolha de "Despesa" vs "Rendimento" no campo Tipo.
  const handleValChange = (raw) => {
    const cleaned = String(raw).replace(/[^0-9.,]/g, '').replace(',', '.');
    setVal(cleaned);
  };

  const handleSubmit = () => {
    if (!desc || !val || !date) return;
    const parsed = Math.abs(parseFloat(val));
    if (isNaN(parsed) || parsed <= 0) return;
    onAdd({ desc, val: parsed, date, type, cat });
  };

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
        <div className="form-row">
          <div className="form-field">
            <label>Tipo</label>
            <select value={type} onChange={e => setType(e.target.value)}>
              <option value="despesa">Despesa</option>
              <option value="rendimento">Rendimento</option>
            </select>
          </div>
          <div className="form-field">
            <label>Categoria</label>
            <select value={cat} onChange={e => setCat(e.target.value)}>
              {CATS.map(c => <option key={c}>{c}</option>)}
            </select>
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
