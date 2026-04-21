import React, { useState, useEffect, useCallback } from 'react';
import { getSupabaseClient } from '../utils/supabase';
import useIsMobile from '../hooks/useIsMobile';

const ADMIN_EMAILS = ['flowstate.app.oficial@gmail.com'];

/**
 * Painel de admin para gerir convites da beta fechada.
 * Visível apenas para emails admin. Acedido via tab 'admin' no App.
 */
export default function AdminInvitesPage({ userEmail }) {
  const isMobile = useIsMobile();
  const [invites, setInvites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [note, setNote] = useState('');
  const [count, setCount] = useState(1);
  const [copied, setCopied] = useState(null);

  // ── Estado da beta ──
  const [betaEndedAt, setBetaEndedAt] = useState(null);
  const [betaStats, setBetaStats] = useState(null);           // { users, plus_months, trial_days }
  const [showEndBetaModal, setShowEndBetaModal] = useState(false);
  const [endingBeta, setEndingBeta] = useState(false);
  const [endBetaResult, setEndBetaResult] = useState(null);

  const isAdmin = ADMIN_EMAILS.includes(userEmail?.toLowerCase());

  const loadInvites = useCallback(async () => {
    const sb = getSupabaseClient();
    if (!sb) return;
    setLoading(true);
    try {
      const { data, error } = await sb
        .from('beta_invites')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error && data) setInvites(data);
    } catch {}
    setLoading(false);
  }, []);

  // Carrega estado da beta + preview de recompensas pendentes.
  const loadBetaState = useCallback(async () => {
    const sb = getSupabaseClient();
    if (!sb) return;
    try {
      // Estado global
      const { data: setting } = await sb
        .from('fs_app_settings')
        .select('value')
        .eq('key', 'beta_ended_at')
        .maybeSingle();
      setBetaEndedAt(setting?.value?.at || null);

      // Preview: quantos users, meses Plus e dias trial estão por distribuir
      // Só faz sentido mostrar se beta ainda não terminou.
      if (!setting?.value?.at) {
        const { data: rows } = await sb
          .from('fs_pending_rewards')
          .select('user_id, reward_type, quantity')
          .is('delivered_at', null);
        if (rows) {
          const users = new Set(rows.map(r => r.user_id)).size;
          const plusMonths = rows
            .filter(r => r.reward_type === 'plus_month_free')
            .reduce((s, r) => s + (r.quantity || 1), 0);
          const trialDays = rows
            .filter(r => r.reward_type === 'trial_extension_7d')
            .reduce((s, r) => s + (r.quantity || 1), 0) * 7;
          setBetaStats({ users, plusMonths, trialDays });
        }
      }
    } catch (e) {
      console.warn('loadBetaState error', e);
    }
  }, []);

  useEffect(() => {
    if (isAdmin) {
      loadInvites();
      loadBetaState();
    }
  }, [isAdmin, loadInvites, loadBetaState]);

  const handleEndBeta = async () => {
    const sb = getSupabaseClient();
    if (!sb || endingBeta) return;
    setEndingBeta(true);
    setEndBetaResult(null);
    try {
      const { data, error } = await sb.rpc('fs_end_beta');
      if (error) {
        setEndBetaResult({ ok: false, message: error.message });
      } else {
        setEndBetaResult({ ok: true, data });
        // Dispara email de anúncio (best-effort — se falhar o admin pode re-trigger).
        try {
          await sb.functions.invoke('send-beta-end-email', { body: {} });
        } catch (e) {
          console.warn('send-beta-end-email invoke failed:', e);
        }
        // Recarrega estado
        setBetaEndedAt(data?.ended_at || new Date().toISOString());
        setBetaStats(null);
      }
    } catch (e) {
      setEndBetaResult({ ok: false, message: String(e?.message || e) });
    }
    setEndingBeta(false);
  };

  const generate = async () => {
    const sb = getSupabaseClient();
    if (!sb || generating) return;
    setGenerating(true);
    try {
      for (let i = 0; i < count; i++) {
        await sb.rpc('generate_beta_invite', {
          p_note: note.trim() || `Convite beta`,
          p_max_uses: 1,
        });
      }
      setNote('');
      setCount(1);
      await loadInvites();
    } catch (e) {
      console.warn('generate invite error:', e);
    }
    setGenerating(false);
  };

  const copyCode = (code) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://flowstate.pt';
    const link = `${origin}/convite/${code}`;
    navigator.clipboard?.writeText(link).then(() => {
      setCopied(code);
      setTimeout(() => setCopied(null), 2000);
    });
  };

  const toggleActive = async (code, currentActive) => {
    const sb = getSupabaseClient();
    if (!sb) return;
    await sb.from('beta_invites').update({ active: !currentActive }).eq('code', code);
    loadInvites();
  };

  if (!isAdmin) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 2rem', color: '#6e7491' }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>🔒</div>
        <p style={{ fontSize: 14 }}>Acesso restrito a administradores.</p>
      </div>
    );
  }

  const available = invites.filter(i => i.active && i.used_count < i.max_uses);
  const used = invites.filter(i => i.used_count >= i.max_uses);
  const inactive = invites.filter(i => !i.active && i.used_count < i.max_uses);

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: isMobile ? '20px 14px' : '30px 20px' }}>
      <h2 style={{ fontSize: 22, fontWeight: 800, color: '#fff', marginBottom: 4 }}>
        🎟️ Gestão de Convites
      </h2>
      <p style={{ fontSize: 13, color: '#6e7491', marginBottom: 24 }}>
        Beta fechada · {available.length} disponíveis · {used.length} usados · {inactive.length} desativados
      </p>

      {/* ── Bloco fim de beta ── */}
      {betaEndedAt ? (
        <div style={{
          background: 'rgba(110,116,145,.08)', border: '1px solid rgba(110,116,145,.25)',
          borderRadius: 16, padding: '16px 20px', marginBottom: 28,
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <div style={{ fontSize: 24 }}>🏁</div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#b8bfda' }}>
              Beta terminada
            </div>
            <div style={{ fontSize: 11, color: '#6e7491', marginTop: 2 }}>
              {new Date(betaEndedAt).toLocaleString('pt-PT')} · recompensas desbloqueadas para resgate
            </div>
          </div>
        </div>
      ) : (
        <div style={{
          background: 'rgba(255,140,0,.06)', border: '1px solid rgba(255,140,0,.25)',
          borderRadius: 16, padding: isMobile ? '16px 14px' : '20px 22px', marginBottom: 28,
        }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#ffa040', marginBottom: 4 }}>
            🏁 Terminar Beta
          </div>
          <div style={{ fontSize: 12, color: '#b8bfda', marginBottom: 14, lineHeight: 1.5 }}>
            Ação única e irreversível. Desbloqueia todas as recompensas acumuladas (meses Plus grátis
            + dias de trial extra) para que os utilizadores as possam resgatar no próximo checkout.
            Envia também email de anúncio a todos os beneficiários.
          </div>
          {betaStats && (betaStats.users > 0) && (
            <div style={{ fontSize: 12, color: '#6e7491', marginBottom: 14 }}>
              <strong style={{ color: '#b8bfda' }}>{betaStats.users}</strong> utilizador(es) com recompensas pendentes
              {' · '}<strong style={{ color: '#b8bfda' }}>{betaStats.plusMonths}</strong> meses Plus
              {' · '}<strong style={{ color: '#b8bfda' }}>{betaStats.trialDays}</strong> dias trial
            </div>
          )}
          <button
            onClick={() => setShowEndBetaModal(true)}
            style={{
              padding: '10px 20px', borderRadius: 10, border: 'none',
              background: 'linear-gradient(135deg,#ff8c00,#ff6b00)',
              color: '#fff', fontSize: 13, fontWeight: 800,
              cursor: 'pointer', fontFamily: 'Inter,sans-serif',
            }}
          >
            Terminar Beta e distribuir recompensas
          </button>
          {endBetaResult && !endBetaResult.ok && (
            <div style={{ marginTop: 10, fontSize: 11, color: '#ff6b6b' }}>
              Erro: {endBetaResult.message}
            </div>
          )}
        </div>
      )}

      {/* ── Modal de confirmação ── */}
      {showEndBetaModal && (
        <div
          onClick={() => !endingBeta && setShowEndBetaModal(false)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,.75)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000, padding: 16,
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: '#202638', borderRadius: 20, padding: isMobile ? '24px 20px' : '32px 28px',
              maxWidth: 440, width: '100%', boxShadow: '0 24px 64px rgba(0,0,0,.5)',
            }}
          >
            <div style={{ fontSize: 32, marginBottom: 8, textAlign: 'center' }}>⚠️</div>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: '#fff', marginBottom: 8, textAlign: 'center' }}>
              Confirmar fim da beta?
            </h3>
            <p style={{ fontSize: 13, color: '#b8bfda', lineHeight: 1.6, marginBottom: 18, textAlign: 'center' }}>
              Vais distribuir{' '}
              <strong style={{ color: '#00D764' }}>
                {betaStats?.plusMonths || 0} meses Plus
              </strong>
              {' '}e{' '}
              <strong style={{ color: '#00D764' }}>
                {betaStats?.trialDays || 0} dias de trial extra
              </strong>
              {' '}a{' '}
              <strong style={{ color: '#00D764' }}>
                {betaStats?.users || 0} utilizadores
              </strong>.
            </p>
            <p style={{ fontSize: 11, color: '#6e7491', lineHeight: 1.6, marginBottom: 20, textAlign: 'center' }}>
              Esta ação é irreversível. Todos receberão um email a anunciar o lançamento público.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => setShowEndBetaModal(false)}
                disabled={endingBeta}
                style={{
                  flex: 1, padding: '11px 16px', borderRadius: 10,
                  border: '1px solid rgba(255,255,255,.12)', background: 'transparent',
                  color: '#b8bfda', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                  fontFamily: 'Inter,sans-serif',
                }}
              >
                Cancelar
              </button>
              <button
                onClick={handleEndBeta}
                disabled={endingBeta}
                style={{
                  flex: 1, padding: '11px 16px', borderRadius: 10, border: 'none',
                  background: endingBeta ? 'rgba(255,255,255,.08)' : 'linear-gradient(135deg,#ff8c00,#ff6b00)',
                  color: endingBeta ? '#6e7491' : '#fff',
                  fontSize: 13, fontWeight: 800, cursor: endingBeta ? 'default' : 'pointer',
                  fontFamily: 'Inter,sans-serif',
                }}
              >
                {endingBeta ? 'A terminar...' : 'Sim, terminar beta'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Gerar novos ── */}
      <div style={{
        background: 'rgba(0,215,100,.06)', border: '1px solid rgba(0,215,100,.2)',
        borderRadius: 16, padding: isMobile ? '16px 14px' : '20px 22px', marginBottom: 28,
      }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#00D764', marginBottom: 12 }}>Gerar novos convites</div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: '1 1 180px' }}>
            <label style={labelSt}>Nota (opcional)</label>
            <input
              value={note} onChange={e => setNote(e.target.value)}
              placeholder="Ex: Amigos da faculdade"
              style={inputSt}
            />
          </div>
          <div style={{ flex: '0 0 80px' }}>
            <label style={labelSt}>Qtd</label>
            <input
              type="number" min={1} max={50} value={count}
              onChange={e => setCount(Math.max(1, Math.min(50, +e.target.value || 1)))}
              style={{ ...inputSt, textAlign: 'center' }}
            />
          </div>
          <button onClick={generate} disabled={generating} style={{
            padding: '10px 20px', borderRadius: 10, border: 'none',
            background: generating ? 'rgba(255,255,255,.08)' : 'linear-gradient(135deg,#00D764,#00b4d8)',
            color: generating ? '#6e7491' : '#000',
            fontSize: 13, fontWeight: 800, cursor: generating ? 'default' : 'pointer',
            fontFamily: 'Inter,sans-serif', whiteSpace: 'nowrap',
          }}>
            {generating ? 'A gerar...' : `Gerar ${count > 1 ? count + ' convites' : 'convite'}`}
          </button>
        </div>
      </div>

      {/* ── Lista ── */}
      {loading ? (
        <p style={{ color: '#6e7491', textAlign: 'center' }}>A carregar...</p>
      ) : invites.length === 0 ? (
        <p style={{ color: '#6e7491', textAlign: 'center' }}>Ainda não há convites. Gera o primeiro acima!</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {invites.map(inv => {
            const isUsed = inv.used_count >= inv.max_uses;
            const isExpired = inv.expires_at && new Date(inv.expires_at) < new Date();
            const isAvail = inv.active && !isUsed && !isExpired;

            return (
              <div key={inv.code} style={{
                display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
                padding: '12px 16px', borderRadius: 12,
                background: isAvail ? 'rgba(255,255,255,.03)' : 'rgba(255,255,255,.015)',
                border: `1px solid ${isAvail ? 'rgba(0,215,100,.15)' : 'rgba(255,255,255,.06)'}`,
                opacity: isAvail ? 1 : 0.55,
              }}>
                {/* Código */}
                <code style={{
                  fontSize: 15, fontWeight: 800, letterSpacing: '.05em',
                  color: isAvail ? '#00D764' : '#6e7491',
                  fontFamily: 'monospace',
                  minWidth: 110,
                }}>
                  {inv.code}
                </code>

                {/* Badge de estado */}
                <span style={{
                  fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 6,
                  background: isUsed ? 'rgba(255,107,107,.15)' : isAvail ? 'rgba(0,215,100,.15)' : 'rgba(110,116,145,.15)',
                  color: isUsed ? '#ff6b6b' : isAvail ? '#00D764' : '#6e7491',
                }}>
                  {isUsed ? 'Usado' : isExpired ? 'Expirado' : !inv.active ? 'Desativado' : 'Disponível'}
                </span>

                {/* Nota */}
                {inv.note && (
                  <span style={{ fontSize: 11, color: '#6e7491', flex: 1 }}>{inv.note}</span>
                )}

                {/* Ações */}
                <div style={{ display: 'flex', gap: 6, marginLeft: 'auto' }}>
                  {isAvail && (
                    <button onClick={() => copyCode(inv.code)} style={btnSmall}>
                      {copied === inv.code ? '✓ Copiado!' : '📋 Copiar link'}
                    </button>
                  )}
                  <button
                    onClick={() => toggleActive(inv.code, inv.active)}
                    style={{ ...btnSmall, color: inv.active ? '#ff6b6b' : '#00D764' }}
                  >
                    {inv.active ? 'Desativar' : 'Ativar'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Estilos reutilizáveis ──
const labelSt = {
  display: 'block', fontSize: 10, fontWeight: 700,
  letterSpacing: '.08em', textTransform: 'uppercase',
  color: '#6e7491', marginBottom: 4,
};
const inputSt = {
  width: '100%', height: 38, padding: '0 12px', borderRadius: 10,
  background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)',
  color: '#fff', fontSize: 13, fontFamily: 'Inter,sans-serif', outline: 'none',
  boxSizing: 'border-box',
};
const btnSmall = {
  padding: '5px 10px', borderRadius: 8, border: '1px solid rgba(255,255,255,.1)',
  background: 'rgba(255,255,255,.04)', color: '#b8bfda',
  fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter,sans-serif',
  whiteSpace: 'nowrap',
};
