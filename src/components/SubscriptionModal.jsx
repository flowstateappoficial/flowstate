import React, { useState, useEffect } from 'react';
import { SUB_CATEGORIES, SUB_CADENCES, SUB_DEFAULT_EMOJIS } from '../utils/constants';
import { newSubscription } from '../utils/subscriptions';

export default function SubscriptionModal({ initial, onSave, onClose, onDelete }) {
  const isEditing = !!(initial && initial.id);

  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('💳');
  const [defaultAmount, setDefaultAmount] = useState('');
  const [isVariable, setIsVariable] = useState(false);
  const [cadence, setCadence] = useState('monthly');
  const [dayOfPeriod, setDayOfPeriod] = useState(1);
  const [category, setCategory] = useState('util');
  const [isTrial, setIsTrial] = useState(false);
  const [trialEndDate, setTrialEndDate] = useState('');
  const [showEmojis, setShowEmojis] = useState(false);

  useEffect(() => {
    if (initial) {
      setName(initial.name || '');
      setEmoji(initial.emoji || '💳');
      setDefaultAmount(initial.defaultAmount != null ? String(initial.defaultAmount) : '');
      setIsVariable(!!initial.isVariable);
      setCadence(initial.cadence || 'monthly');
      setDayOfPeriod(initial.dayOfPeriod || 1);
      setCategory(initial.category || 'util');
      setIsTrial(!!initial.isTrial);
      setTrialEndDate(initial.trialEndDate || '');
    } else {
      setName(''); setEmoji('💳'); setDefaultAmount('');
      setIsVariable(false); setCadence('monthly'); setDayOfPeriod(1);
      setCategory('util'); setIsTrial(false); setTrialEndDate('');
    }
  }, [initial]);

  const handleSave = () => {
    const amount = parseFloat(String(defaultAmount).replace(',', '.')) || 0;
    if (!name.trim()) return;
    if (amount < 0) return;

    const data = isEditing
      ? {
          ...initial,
          name: name.trim(),
          emoji,
          defaultAmount: amount,
          isVariable,
          cadence,
          dayOfPeriod: Math.max(1, Math.min(31, parseInt(dayOfPeriod) || 1)),
          category,
          isTrial,
          trialEndDate: isTrial && trialEndDate ? trialEndDate : null
        }
      : newSubscription({
          name: name.trim(),
          emoji,
          defaultAmount: amount,
          isVariable,
          cadence,
          dayOfPeriod: Math.max(1, Math.min(31, parseInt(dayOfPeriod) || 1)),
          category,
          isTrial,
          trialEndDate: isTrial && trialEndDate ? trialEndDate : null,
          payments: initial?.payments || {}
        });
    onSave(data);
  };

  const closeOnBg = (e) => { if (e.target === e.currentTarget) onClose(); };

  return (
    <div className="overlay open" onClick={closeOnBg}>
      <div className="modal" style={{ maxWidth: 460 }}>
        <div className="modal-title">{isEditing ? 'Editar subscrição' : 'Nova subscrição'}</div>

        {/* Nome + emoji */}
        <div className="form-field">
          <label>Nome</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              onClick={() => setShowEmojis(!showEmojis)}
              style={{
                width: 48, height: 44,
                borderRadius: 10,
                border: '1px solid rgba(255,255,255,.1)',
                background: 'rgba(255,255,255,.04)',
                fontSize: 22,
                cursor: 'pointer',
                flexShrink: 0
              }}
              title="Mudar emoji"
            >{emoji}</button>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Ex: Spotify Premium"
              style={{ flex: 1 }}
              autoFocus
            />
          </div>
          {showEmojis && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(38px, 1fr))',
              gap: 6,
              marginTop: 8,
              padding: 10,
              background: 'rgba(0,0,0,.2)',
              borderRadius: 10,
              border: '1px solid rgba(255,255,255,.06)'
            }}>
              {SUB_DEFAULT_EMOJIS.map(e => (
                <button
                  key={e}
                  type="button"
                  onClick={() => { setEmoji(e); setShowEmojis(false); }}
                  style={{
                    width: 38, height: 38,
                    borderRadius: 8,
                    border: emoji === e ? '1px solid rgba(0,215,100,.5)' : '1px solid transparent',
                    background: emoji === e ? 'rgba(0,215,100,.12)' : 'transparent',
                    fontSize: 20,
                    cursor: 'pointer'
                  }}
                >{e}</button>
              ))}
            </div>
          )}
        </div>

        {/* Valor + variável */}
        <div className="form-row">
          <div className="form-field">
            <label>Valor padrão (€)</label>
            <input
              type="number"
              inputMode="decimal"
              step="0.01"
              value={defaultAmount}
              onChange={e => setDefaultAmount(e.target.value)}
              placeholder="0,00"
              disabled={isVariable && !defaultAmount}
            />
          </div>
          <div className="form-field" style={{ display: 'flex', alignItems: 'flex-end' }}>
            <label style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              cursor: 'pointer',
              fontSize: 13,
              color: 'var(--t2)',
              padding: '11px 0',
              userSelect: 'none'
            }}>
              <input
                type="checkbox"
                checked={isVariable}
                onChange={e => setIsVariable(e.target.checked)}
                style={{ accentColor: '#00D764', width: 16, height: 16 }}
              />
              Valor variável
            </label>
          </div>
        </div>
        {isVariable && (
          <div style={{ fontSize: 11.5, color: 'var(--t3)', marginTop: -8, marginBottom: 12, lineHeight: 1.5 }}>
            Para subs com valor diferente todos os meses (ex: MEO, EDP, água). O valor padrão acima é só sugestão — vais introduzir o valor real ao marcar como pago.
          </div>
        )}

        {/* Cadência + dia */}
        <div className="form-row">
          <div className="form-field">
            <label>Frequência</label>
            <select value={cadence} onChange={e => setCadence(e.target.value)}>
              {SUB_CADENCES.map(c => (
                <option key={c.id} value={c.id}>{c.label}</option>
              ))}
            </select>
          </div>
          <div className="form-field">
            <label>Dia do mês</label>
            <input
              type="number"
              min="1"
              max="31"
              value={dayOfPeriod}
              onChange={e => setDayOfPeriod(e.target.value)}
            />
          </div>
        </div>

        {/* Categoria */}
        <div className="form-field">
          <label>Categoria</label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
            {SUB_CATEGORIES.map(c => {
              const sel = category === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCategory(c.id)}
                  style={{
                    padding: '10px 8px',
                    borderRadius: 10,
                    border: sel ? `1px solid ${c.color}` : '1px solid rgba(255,255,255,.08)',
                    background: sel ? `${c.color}1F` : 'rgba(255,255,255,.03)',
                    color: sel ? c.color : 'var(--t2)',
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                    fontFamily: 'var(--font)',
                    textAlign: 'center',
                    lineHeight: 1.3
                  }}
                >{c.label}</button>
              );
            })}
          </div>
          <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 6, lineHeight: 1.4 }}>
            {(SUB_CATEGORIES.find(c => c.id === category) || {}).desc}
          </div>
        </div>

        {/* Trial */}
        <div className="form-field">
          <label style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 10,
            cursor: 'pointer',
            fontSize: 13,
            color: 'var(--t2)',
            userSelect: 'none'
          }}>
            <input
              type="checkbox"
              checked={isTrial}
              onChange={e => setIsTrial(e.target.checked)}
              style={{ accentColor: '#f7931a', width: 16, height: 16 }}
            />
            Está em trial gratuito
          </label>
          {isTrial && (
            <div style={{ marginTop: 10 }}>
              <label style={{ display: 'block', fontSize: 12, color: 'var(--t3)', marginBottom: 6 }}>
                Fim do trial (avisamos-te 3 dias antes)
              </label>
              <input
                type="date"
                value={trialEndDate}
                onChange={e => setTrialEndDate(e.target.value)}
              />
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="modal-actions">
          <button
            type="button"
            className="btn-add"
            onClick={handleSave}
            disabled={!name.trim() || (!isVariable && (!defaultAmount || parseFloat(String(defaultAmount).replace(',','.')) < 0))}
          >Guardar</button>
          <button type="button" className="btn-close-modal" onClick={onClose}>Cancelar</button>
        </div>

        {/* Apagar (só em edit) */}
        {onDelete && (
          <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid rgba(255,255,255,.06)' }}>
            <button
              type="button"
              onClick={onDelete}
              style={{
                width: '100%',
                padding: 10,
                borderRadius: 10,
                background: 'rgba(229,57,53,.1)',
                color: 'var(--red-soft)',
                border: '1px solid rgba(229,57,53,.25)',
                fontFamily: 'var(--font)',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >Apagar esta subscrição</button>
          </div>
        )}
      </div>
    </div>
  );
}
