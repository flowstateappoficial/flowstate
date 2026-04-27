import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

// Sistema de diálogos custom (alert / confirm / prompt) com identidade visual
// Flowstate. Substitui as caixas nativas do browser que ficavam estranhas.
//
// Uso:
//   const dialog = useDialog();
//
//   await dialog.alert({ message: 'Não foi possível guardar.' });
//
//   const ok = await dialog.confirm({
//     title: 'Apagar objetivo?',
//     message: 'Esta acção não pode ser desfeita.',
//     confirmText: 'Apagar',
//     danger: true,
//   });
//
//   const valor = await dialog.prompt({
//     title: '+ Reforçar Fundo',
//     message: 'Quanto queres adicionar?',
//     placeholder: '0',
//     type: 'number',
//     suffix: '€',
//   });
//   if (valor === null) return; // utilizador cancelou
//
// Apenas um diálogo de cada vez (a maioria dos casos não precisa de mais).

const DialogContext = createContext(null);

export function useDialog() {
  const ctx = useContext(DialogContext);
  if (!ctx) throw new Error('useDialog must be used inside <DialogProvider>');
  return ctx;
}

export function DialogProvider({ children }) {
  const [state, setState] = useState(null); // { type, opts, resolve } | null

  const close = useCallback((value) => {
    setState((prev) => {
      if (prev?.resolve) prev.resolve(value);
      return null;
    });
  }, []);

  const api = useMemo(() => ({
    alert: (opts) => new Promise((resolve) => {
      const o = typeof opts === 'string' ? { message: opts } : (opts || {});
      setState({ type: 'alert', opts: o, resolve });
    }),
    confirm: (opts) => new Promise((resolve) => {
      const o = typeof opts === 'string' ? { message: opts } : (opts || {});
      setState({ type: 'confirm', opts: o, resolve });
    }),
    prompt: (opts) => new Promise((resolve) => {
      const o = typeof opts === 'string' ? { message: opts } : (opts || {});
      setState({ type: 'prompt', opts: o, resolve });
    }),
  }), []);

  return (
    <DialogContext.Provider value={api}>
      {children}
      {state && <DialogModal state={state} onClose={close} />}
    </DialogContext.Provider>
  );
}

function DialogModal({ state, onClose }) {
  const { type, opts } = state;
  const [value, setValue] = useState(opts.initialValue ?? '');
  const [error, setError] = useState(null);
  const inputRef = useRef(null);

  // Focus automático no input quando é prompt, ou no botão de confirmar caso contrário.
  useEffect(() => {
    const t = setTimeout(() => {
      if (type === 'prompt' && inputRef.current) {
        inputRef.current.focus();
        inputRef.current.select();
      }
    }, 50);
    return () => clearTimeout(t);
  }, [type]);

  // Esc cancela; Enter confirma (excepto em textareas).
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleCancel();
      } else if (e.key === 'Enter' && !e.shiftKey) {
        if (e.target?.tagName === 'TEXTAREA') return;
        e.preventDefault();
        handleConfirm();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, value]);

  const handleConfirm = () => {
    if (type === 'prompt') {
      const v = String(value).trim();
      if (opts.required !== false && v === '') {
        setError('Indica um valor.');
        return;
      }
      if (opts.validate) {
        const err = opts.validate(v);
        if (err) { setError(err); return; }
      }
      onClose(v);
    } else if (type === 'confirm') {
      onClose(true);
    } else {
      onClose();
    }
  };

  const handleCancel = () => {
    if (type === 'prompt') onClose(null);
    else if (type === 'confirm') onClose(false);
    else onClose();
  };

  const danger = !!opts.danger;
  const confirmBg = danger ? 'rgba(229,57,53,.85)' : 'var(--accent)';
  const confirmColor = danger ? '#fff' : '#000';
  const confirmText = opts.confirmText || (type === 'prompt' ? 'Guardar' : type === 'confirm' ? 'Confirmar' : 'OK');
  const cancelText = opts.cancelText || 'Cancelar';
  const title = opts.title || (type === 'confirm' ? 'Confirmar' : type === 'prompt' ? '' : '');

  return (
    <>
      <div onClick={handleCancel} style={{
        position: 'fixed', inset: 0, background: 'rgba(10,13,24,.85)', zIndex: 9990,
        backdropFilter: 'blur(3px)',
      }} />
      <div role="dialog" aria-modal="true" style={{
        position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
        zIndex: 9991,
        width: '92%', maxWidth: 420,
        background: 'linear-gradient(180deg, #1a1f35 0%, #161a2e 100%)',
        borderRadius: 18,
        border: '1px solid rgba(255,255,255,.1)',
        boxShadow: '0 24px 64px rgba(0,0,0,.6)',
        padding: '22px 22px 18px',
        fontFamily: 'var(--font, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif)',
        color: 'var(--t1, #e7ecff)',
      }}>
        {title && (
          <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--t1, #fff)', marginBottom: 10, letterSpacing: '-.01em' }}>
            {title}
          </div>
        )}

        {opts.message && (
          <div style={{ fontSize: 13, color: 'var(--t2, #b8bfda)', lineHeight: 1.6, marginBottom: type === 'prompt' ? 14 : 18, whiteSpace: 'pre-wrap' }}>
            {opts.message}
          </div>
        )}

        {type === 'prompt' && (
          <div style={{ marginBottom: 8 }}>
            <div style={{ display: 'flex', gap: 6, alignItems: 'stretch' }}>
              <input
                ref={inputRef}
                type={opts.type || 'text'}
                inputMode={opts.type === 'number' ? 'decimal' : undefined}
                value={value}
                onChange={(e) => { setValue(e.target.value); if (error) setError(null); }}
                placeholder={opts.placeholder || ''}
                style={{
                  flex: 1, height: 42, padding: '0 14px',
                  background: 'rgba(255,255,255,.07)',
                  border: '1px solid ' + (error ? 'rgba(229,57,53,.5)' : 'rgba(255,255,255,.1)'),
                  borderRadius: 10, fontSize: 15, color: 'var(--t1, #fff)',
                  fontFamily: 'inherit', outline: 'none',
                }}
              />
              {opts.suffix && (
                <span style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  padding: '0 12px', borderRadius: 10,
                  background: 'rgba(255,255,255,.04)',
                  border: '1px solid rgba(255,255,255,.08)',
                  fontSize: 15, fontWeight: 700, color: 'var(--t2, #b8bfda)',
                }}>{opts.suffix}</span>
              )}
            </div>
            {error && (
              <div style={{ fontSize: 11, color: '#ff6b6b', marginTop: 6 }}>{error}</div>
            )}
          </div>
        )}

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 14 }}>
          {(type === 'confirm' || type === 'prompt') && (
            <button onClick={handleCancel} style={{
              padding: '10px 16px', borderRadius: 10,
              background: 'rgba(255,255,255,.06)',
              color: 'var(--t2, #b8bfda)',
              border: '1px solid rgba(255,255,255,.1)',
              fontFamily: 'inherit', fontSize: 13, fontWeight: 700,
              cursor: 'pointer',
            }}>
              {cancelText}
            </button>
          )}
          <button onClick={handleConfirm} style={{
            padding: '10px 18px', borderRadius: 10,
            background: confirmBg, color: confirmColor,
            border: danger ? '1px solid rgba(229,57,53,.4)' : 'none',
            fontFamily: 'inherit', fontSize: 13, fontWeight: 800,
            cursor: 'pointer',
            boxShadow: danger ? 'none' : '0 0 18px rgba(0,215,100,.25)',
          }}>
            {confirmText}
          </button>
        </div>
      </div>
    </>
  );
}
