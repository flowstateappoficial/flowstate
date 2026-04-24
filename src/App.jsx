import React, { useState, useEffect, useCallback, useRef } from 'react';
import { LOGO_SRC } from './assets/logo';
import { 
  LS_TXS, LS_OBJ, LS_ATIVOS, LS_FE, LS_RULES, LS_PLAN, 
  LS_ONBOARDED, LS_BUDGET, LS_RENDIMENTO
} from './utils/constants';
import { fmtV, fmtDate, getCurrentMonth, txsComRegra, normalizeStr } from './utils/helpers';
import { 
  getSupabaseClient, loadTxsFromSupabase, saveTxToSupabase, deleteTxFromSupabase,
  loadGoalsFromSupabase, saveGoalToSupabase, deleteGoalFromSupabase,
  loadInvestmentsFromSupabase, saveAtivoToSupabase, deleteAtivoFromSupabase, saveAtivoEntry, saveFundoEmergencia,
  saveBudgetToSupabase, loadBudgetFromSupabase
} from './utils/supabase';

// ── Lazy-load pages ──
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import Navbar from './components/Navbar';
import BottomNav from './components/BottomNav';
import useIsMobile from './hooks/useIsMobile';
import AccountPage from './pages/AccountPage';
import DashboardPage from './pages/DashboardPage';
import TransactionsPage from './pages/TransactionsPage';
import InvestmentsPage from './pages/InvestmentsPage';
import CalculatorPage from './pages/CalculatorPage';
import PricingPage from './pages/PricingPage';
import TransactionModal from './components/TransactionModal';
import GoalModal from './components/GoalModal';
import AtivoModal from './components/AtivoModal';
import OnboardingOverlay from './components/OnboardingOverlay';
import AppTour from './components/AppTour';
import PaywallOverlay from './components/PaywallOverlay';
import LegalOverlay from './components/LegalOverlay';
import { updateStreak, evaluateBadges } from './utils/gamification';
import { evaluateNotifications, evaluateTrialNotifications, loadNotifications, loadReadIds, markAllRead as markAllReadUtil } from './utils/notifications';
import NotificationCenter from './components/NotificationCenter';
import FeedbackButton from './components/FeedbackButton';
import { initReferralData, sendInvite as sendReferralInvite, fetchReferralData, setPendingReferralCode, getPendingReferralCode, clearPendingReferralCode, applyReferralCode, logInviteShare } from './utils/referral';
import ReferralInviteModal from './components/ReferralInviteModal';
import ConvitesPage from './pages/ConvitesPage';
import AdminInvitesPage from './pages/AdminInvitesPage';
import WrappedStories from './components/WrappedStories';
import TrialBanner from './components/TrialBanner';
import TrialOfferModal from './components/TrialOfferModal';
import CancelTrialModal from './components/CancelTrialModal';
import { startTrial as startTrialUtil, effectivePlan, getTrialStatus, markConverted, markNotified, cancelTrial as cancelTrialUtil, reactivateTrial as reactivateTrialUtil, processExpiry, getChargeDate } from './utils/trial';
import { startCheckout, syncSubscription, pollSubscriptionUntilActive } from './utils/subscription';
import useBetaStatus from './hooks/useBetaStatus';

export default function App() {
  // ── RESPONSIVE ──
  const isMobile = useIsMobile();

  // ── AUTH STATE ──
  const [currentUser, setCurrentUser] = useState(null);
  const [viewMode, setViewMode] = useState('loading'); // 'loading' | 'landing' | 'auth' | 'app'
  const [activeTab, setActiveTab] = useState('dash');

  // ── TRANSACTIONS ──
  const [txs, setTxs] = useState([]);
  const [currentPeriod, setCurrentPeriod] = useState(getCurrentMonth());
  const [userRules, setUserRules] = useState({});
  const nextIdRef = useRef(1);

  // ── GOALS ──
  const [objetivos, setObjetivos] = useState([]);

  // ── INVESTMENTS ──
  const [ativos, setAtivos] = useState([]);
  const [ativoEntries, setAtivoEntries] = useState({});      // id -> { ym: valor de mercado }
  const [ativoContribs, setAtivoContribs] = useState({});    // id -> { ym: contribuição líquida (+/-) }
  const [feEntries, setFeEntries] = useState({});
  const [invMonth, setInvMonth] = useState(getCurrentMonth());
  const [invDataLoaded, setInvDataLoaded] = useState(false);

  // ── BUDGET ──
  const [budget, setBudget] = useState({});
  const [rendimentoMensal, setRendimentoMensal] = useState(0);

  // ── MODALS ──
  const [txModalOpen, setTxModalOpen] = useState(false);
  const [goalModalOpen, setGoalModalOpen] = useState(false);
  const [goalEditId, setGoalEditId] = useState(null);
  const [ativoModalOpen, setAtivoModalOpen] = useState(false);
  const [ativoEditId, setAtivoEditId] = useState(null);
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  // Quando true, o OnboardingOverlay abre em modo "edit only" — arranca no passo
  // de rendimento+orçamento, botão final é "Guardar", e não dispara o tour.
  const [onboardingEditMode, setOnboardingEditMode] = useState(false);
  const [paywallOpen, setPaywallOpen] = useState(false);
  const [paywallTab, setPaywallTab] = useState('');
  const [legalOpen, setLegalOpen] = useState(null);
  const [billingAnual, setBillingAnual] = useState(false);

  // ── GAMIFICATION ──
  const [streak, setStreak] = useState({ current: 0, best: 0, lastDate: null });
  const [badges, setBadges] = useState({});
  const [newBadges, setNewBadges] = useState([]);

  // ── NOTIFICATIONS ──
  const [notifications, setNotifications] = useState([]);
  const [readIds, setReadIds] = useState([]);
  const [notifCenterOpen, setNotifCenterOpen] = useState(false);
  const [notifToast, setNotifToast] = useState(null);

  // ── REFERRAL ──
  const [referralData, setReferralData] = useState(null);
  const [referralModalOpen, setReferralModalOpen] = useState(false);

  // ── DASHBOARD PREFS ──
  const [dashPrefs, setDashPrefs] = useState({ visible: ['hero','performance','budget','goals','subscriptions','gamification'] });

  // ── WRAPPED ──
  const [wrappedSlides, setWrappedSlides] = useState(null);

  // ── CALCULATOR OVERLAY ──
  const [calcOpen, setCalcOpen] = useState(false);

  // ── TRIAL ──
  // A simple tick that bumps whenever trial state changes (start/dismiss/ack/expire)
  // so that derived UI re-renders.
  const [trialTick, setTrialTick] = useState(0);
  const bumpTrial = useCallback(() => setTrialTick(t => t + 1), []);
  const [trialOfferOpen, setTrialOfferOpen] = useState(false);
  const [cancelTrialOpen, setCancelTrialOpen] = useState(false);

  // ── APP TOUR (after onboarding) ──
  const [tourOpen, setTourOpen] = useState(false);
  const [autoChargedToast, setAutoChargedToast] = useState(false);

  // ── PLAN ──
  const userPlan = useCallback(() => {
    try { return effectivePlan(localStorage.getItem(LS_PLAN) || 'free'); } catch { return 'free'; }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trialTick]);

  // ── BETA STATUS ──
  // Subscriptions are locked while the closed beta is running — users must
  // wait for fs_end_beta() so that fs_redeem_beta_rewards can apply their
  // earned Plus months. The PricingPage also hides the buttons, but we
  // defend here too in case a stale click leaks through.
  const { isBetaActive } = useBetaStatus();

  // Start trial via Stripe Checkout (card upfront, 7-day trial, then auto-bills).
  // Falls back to local-only trial if Stripe isn't configured yet (dev mode).
  const startTrial = useCallback(async () => {
    if (isBetaActive) {
      alert('A subscrição Plus fica disponível assim que a beta fechada terminar. Os teus meses Plus acumulados serão aplicados automaticamente no primeiro checkout.');
      return;
    }
    try {
      await startCheckout({ plan: 'plus', interval: 'month', withTrial: true });
      // redirects away; function never returns on success
    } catch (e) {
      console.warn('Stripe checkout unavailable, using local trial:', e?.message || e);
      startTrialUtil('plus', 7);
      bumpTrial();
    }
  }, [bumpTrial, isBetaActive]);

  // Subscribe without trial (user already used trial or explicitly wants to pay now).
  const subscribeViaStripe = useCallback(async (plan = 'plus', interval = 'month') => {
    if (isBetaActive) {
      alert('A subscrição fica disponível assim que a beta fechada terminar. Os teus meses Plus acumulados serão aplicados automaticamente no primeiro checkout.');
      return;
    }
    try {
      await startCheckout({ plan, interval, withTrial: false });
    } catch (e) {
      console.warn('Stripe checkout unavailable:', e?.message || e);
      alert('Pagamentos temporariamente indisponíveis. Tenta novamente em instantes.');
    }
  }, [isBetaActive]);

  // ── TRIAL: listen for changes + re-eval every hour for daysLeft ──
  useEffect(() => {
    const handler = () => bumpTrial();
    window.addEventListener('fs-trial-change', handler);
    const interval = setInterval(bumpTrial, 60 * 60 * 1000); // 1h
    return () => { window.removeEventListener('fs-trial-change', handler); clearInterval(interval); };
  }, [bumpTrial]);

  // ── REFERRAL LINK CAPTURE: /convite/:code ──
  // Runs once on mount. Stores the code in localStorage so it survives signup/OAuth redirects.
  // The code is then applied inside the "fetch referral data" effect once the user is authenticated.
  useEffect(() => {
    try {
      const path = window.location.pathname || '';
      const match = path.match(/^\/convite\/([A-Za-z0-9_-]{4,32})\/?$/);
      if (match) {
        setPendingReferralCode(match[1]);
        // Clean the URL so refreshing doesn't keep re-capturing / re-apply.
        window.history.replaceState({}, '', '/');
      }
    } catch (e) { console.warn('referral URL capture failed', e); }
  }, []);

  // ── TRIAL: auto-conversion on expiry ──
  useEffect(() => {
    const converted = processExpiry((plan) => {
      try { localStorage.setItem(LS_PLAN, plan); } catch {}
    });
    if (converted) {
      setAutoChargedToast(true);
      setTimeout(() => setAutoChargedToast(false), 8000);
    }
  }, [trialTick]);

  const handleCancelTrial = useCallback(() => {
    cancelTrialUtil();
    bumpTrial();
    setCancelTrialOpen(false);
  }, [bumpTrial]);

  const handleReactivateTrial = useCallback(() => {
    reactivateTrialUtil();
    bumpTrial();
  }, [bumpTrial]);

  // ── TRIAL: open the conversion offer modal once when ≤ 2 days left ──
  useEffect(() => {
    if (viewMode !== 'app') return;
    const s = getTrialStatus();
    if (s.active && s.daysLeft <= 2 && !s.dismissedOffer && !trialOfferOpen) {
      setTrialOfferOpen(true);
    }
  }, [viewMode, trialTick, trialOfferOpen]);

  // ── LOAD LOCAL DATA ON MOUNT ──
  useEffect(() => {
    try { const s = localStorage.getItem(LS_TXS); if (s) { const d = JSON.parse(s); setTxs(d); nextIdRef.current = d.reduce((m, t) => Math.max(m, typeof t.id === 'number' ? t.id : 0), 0) + 1; } } catch {}
    try { const d = localStorage.getItem(LS_OBJ); if (d) setObjetivos(JSON.parse(d)); } catch {}
    try { const d = localStorage.getItem(LS_RULES); if (d) setUserRules(JSON.parse(d)); } catch {}
    try { const d = localStorage.getItem(LS_BUDGET); if (d) setBudget(JSON.parse(d)); } catch {}
    try { setRendimentoMensal(parseFloat(localStorage.getItem(LS_RENDIMENTO)) || 0); } catch {}
    try { const dp = localStorage.getItem('fs_dash_prefs_v1'); if (dp) setDashPrefs(JSON.parse(dp)); } catch {}
  }, []);

  // ── GAMIFICATION: Update streak on app load + evaluate badges when data changes ──
  useEffect(() => {
    if (viewMode !== 'app') return;
    const s = updateStreak();
    setStreak(s);
    // Seed from local cache immediately (avoids UI flicker); real data arrives below.
    setReferralData(initReferralData(currentUser?.email));
  }, [viewMode]);

  // ── REFERRAL: fetch from Supabase once authenticated, apply pending code if any ──
  useEffect(() => {
    if (viewMode !== 'app' || !currentUser?.id) return;
    let cancelled = false;
    (async () => {
      // If a /convite/:code landed this user here, apply it first.
      const pending = getPendingReferralCode();
      if (pending) {
        try {
          const result = await applyReferralCode(pending);
          console.log('[referral] applyReferralCode', pending, '→', result);
          // Only clear on terminal outcomes — keep it for retry if 'error'.
          if (result !== 'error') clearPendingReferralCode();
        } catch (e) { console.warn('applyReferralCode failed', e); }
      }
      // Fetch fresh stats + code.
      const data = await fetchReferralData(currentUser.id);
      if (!cancelled && data) setReferralData(data);
    })();
    return () => { cancelled = true; };
  }, [viewMode, currentUser?.id]);

  useEffect(() => {
    if (viewMode !== 'app') return;
    const result = evaluateBadges({ txs, objetivos, ativos, feEntries, budget, streak });
    setBadges(result.all);
    if (result.newlyUnlocked.length > 0) {
      setNewBadges(result.newlyUnlocked);
      // Limpa a notificação após 4s
      setTimeout(() => setNewBadges([]), 4000);
    }
  }, [viewMode, txs, objetivos, ativos, feEntries, budget, streak]);

  // ── NOTIFICATIONS: Evaluate when data changes ──
  useEffect(() => {
    if (viewMode !== 'app') return;
    setReadIds(loadReadIds());
    const { all, newNotifs } = evaluateNotifications({
      txs, objetivos, budget, rendimentoMensal, streak,
      currentMonth: getCurrentMonth()
    });
    // Also evaluate trial-specific notifications
    const trialRes = evaluateTrialNotifications(getTrialStatus(), markNotified);
    const merged = [...trialRes.newNotifs, ...all].slice(0, 50);
    setNotifications(merged);
    const allNew = [...newNotifs, ...trialRes.newNotifs];
    if (allNew.length > 0) {
      const highPriority = allNew.find(n => n.priority === 'high') || allNew[0];
      setNotifToast(highPriority);
      setTimeout(() => setNotifToast(null), 5000);
    }
  }, [viewMode, txs, objetivos, budget, rendimentoMensal, streak, trialTick]);

  // ── CLEAR ALL USER DATA (localStorage + state) ──
  const clearAllUserData = useCallback(() => {
    // NOTA: LS_ONBOARDED e fs_tour_done ficaram per-user (ver linhas abaixo)
    // e por isso já não precisam de ser limpos aqui — cada user tem a sua
    // própria flag, que deve persistir entre logins.
    const keysToRemove = [
      LS_TXS, LS_OBJ, LS_ATIVOS, LS_FE, LS_RULES, LS_PLAN,
      LS_BUDGET, LS_RENDIMENTO,
      'fs_dash_prefs_v1', 'fs_inv_entries_v1', 'fs_inv_contribs_v1',
      'fs_streak_v1', 'fs_badges_v1',
      'fs_notifications_v1', 'fs_notifications_read_v1',
      'fs_pending_referral_code', 'fs_referral_cache_v2',
      'fs_sub_v1', 'fs_trial_v1', 'fs_sub_prefs_v1',
      'fuga_meta_v1',
    ];
    keysToRemove.forEach(k => { try { localStorage.removeItem(k); } catch {} });
    setTxs([]); setObjetivos([]); setAtivos([]); setAtivoEntries({}); setAtivoContribs({}); setFeEntries({});
    setBudget({}); setRendimentoMensal(0); setUserRules([]);
    setDashPrefs({ visible: ['hero','performance','budget','goals','subscriptions','gamification'] });
    setStreak({ current: 0, best: 0, lastDate: null }); setBadges([]);
    setNotifications([]); setReadIds([]);
    setReferralData(null);
    setInvDataLoaded(false);
  }, []);

  // ── ENTER APP ──
  const enterApp = useCallback((user) => {
    const lastUid = localStorage.getItem('fs_last_user_id');
    if (lastUid && lastUid !== user.id) {
      clearAllUserData();
    }
    localStorage.setItem('fs_last_user_id', user.id);
    setCurrentUser(user);
    setViewMode('app');
    setActiveTab('dash');
    window.scrollTo(0, 0);
  }, [clearAllUserData]);

  // ── LOGOUT ──
  const handleLogout = useCallback(async () => {
    const sb = getSupabaseClient();
    if (sb) await sb.auth.signOut();
    clearAllUserData();
    setCurrentUser(null);
    setViewMode('landing');
  }, [clearAllUserData]);

  // ── INIT SUPABASE & CHECK SESSION ──
  //
  // Nota sobre OAuth (Google): quando o user volta do provider, a URL
  // contém ?code=xxxx. O supabase-js com detectSessionInUrl:true faz a
  // troca code→session de forma ASSÍNCRONA. Há várias armadilhas:
  //   1) Se chamarmos getSession() antes do listener estar registado,
  //      podemos perder o evento SIGNED_IN disparado durante o await.
  //   2) Se o detectSessionInUrl falhar silenciosamente (ex. code_verifier
  //      inconsistente depois de um signOut + segundo login), o user
  //      ficava eternamente em 'loading' e o timeout atirava-o à landing.
  //
  // Por isso registamos PRIMEIRO o listener e depois, se existe ?code=
  // na URL, forçamos um exchangeCodeForSession explícito como fallback.
  useEffect(() => {
    const sb = getSupabaseClient();
    if (!sb) { setViewMode('landing'); return; }

    let applied = false;
    const applySession = (user) => {
      if (applied) return;
      applied = true;
      const uid = user.id;
      const lastUid = localStorage.getItem('fs_last_user_id');
      if (lastUid && lastUid !== uid) {
        clearAllUserData();
      }
      localStorage.setItem('fs_last_user_id', uid);
      setCurrentUser(user);
      setViewMode('app');
      // Limpa query params de OAuth (?code=...) da URL para não re-disparar.
      if (window.location.search.includes('code=') || window.location.hash.includes('access_token=')) {
        try { window.history.replaceState({}, '', window.location.pathname); } catch {}
      }
    };

    // 1) Listener primeiro — nunca pode perder um evento.
    const { data: sub } = sb.auth.onAuthStateChange((event, session) => {
      if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION' || event === 'TOKEN_REFRESHED') && session?.user) {
        applySession(session.user);
      } else if (event === 'SIGNED_OUT') {
        applied = false;
        setCurrentUser(null);
        setViewMode('landing');
      }
    });

    // 2) Depois, tenta resolver a sessão ativa ou fazer o exchange OAuth.
    (async () => {
      const hasOAuthCode = window.location.search.includes('code=');
      const hasOAuthHash = window.location.hash.includes('access_token=');

      try {
        const { data } = await sb.auth.getSession();
        if (data?.session?.user) {
          applySession(data.session.user);
          return;
        }
      } catch {}

      // Se não há sessão mas há code na URL, força o exchange manualmente.
      // Isto cobre o caso em que detectSessionInUrl falha silenciosamente
      // (p.ex. code_verifier stale após segundo login OAuth).
      if (hasOAuthCode) {
        try {
          const { data, error } = await sb.auth.exchangeCodeForSession(window.location.href);
          if (!error && data?.session?.user) {
            applySession(data.session.user);
            return;
          }
          // Exchange falhou — limpa query string e cai na landing.
          try { window.history.replaceState({}, '', window.location.pathname); } catch {}
          if (!applied) setViewMode('landing');
          return;
        } catch {
          try { window.history.replaceState({}, '', window.location.pathname); } catch {}
          if (!applied) setViewMode('landing');
          return;
        }
      }

      // Sem sessão e sem OAuth pendente: landing.
      if (!hasOAuthHash && !applied) {
        setViewMode('landing');
      }

      // Fallback extremo: se tudo falhar e ficarmos presos em 'loading' após 10s.
      setTimeout(() => {
        setViewMode(v => (v === 'loading' ? 'landing' : v));
      }, 10000);
    })();

    return () => {
      try { sub?.subscription?.unsubscribe?.(); } catch {}
    };
  }, [clearAllUserData]);

  // ── SYNC WITH SUPABASE WHEN ENTERING APP ──
  useEffect(() => {
    if (viewMode !== 'app' || !currentUser) return;
    
    // Sync transactions
    loadTxsFromSupabase(currentUser.id).then(remote => {
      if (remote) {
        setTxs(remote);
        nextIdRef.current = remote.reduce((m, t) => Math.max(m, typeof t.id === 'number' ? t.id : 0), 0) + 1;
        try { localStorage.setItem(LS_TXS, JSON.stringify(remote)); } catch {}
      }
    }).catch(() => {});

    // Sync goals
    loadGoalsFromSupabase(currentUser.id).then(remote => {
      if (remote) {
        setObjetivos(remote);
        try { localStorage.setItem(LS_OBJ, JSON.stringify(remote)); } catch {}
      }
    }).catch(() => {});

    // Sync budget
    loadBudgetFromSupabase(currentUser.id).then(data => {
      if (data) {
        setBudget(data.budget);
        setRendimentoMensal(data.rendimentoMensal);
        try { localStorage.setItem(LS_BUDGET, JSON.stringify(data.budget)); localStorage.setItem(LS_RENDIMENTO, String(data.rendimentoMensal)); } catch {}
      }
    }).catch(() => {});

    // Sync investments
    loadInvestmentsFromSupabase(currentUser.id).then(data => {
      if (data) {
        if (data.ativos) setAtivos(data.ativos);
        setAtivoEntries(data.ativoEntries || {});
        setAtivoContribs(data.ativoContribs || {});
        setFeEntries(data.feEntries || {});
        try {
          localStorage.setItem(LS_ATIVOS, JSON.stringify(data.ativos || []));
          localStorage.setItem('fs_inv_entries_v1', JSON.stringify(data.ativoEntries || {}));
          localStorage.setItem('fs_inv_contribs_v1', JSON.stringify(data.ativoContribs || {}));
          localStorage.setItem(LS_FE, JSON.stringify(data.feEntries || {}));
        } catch {}
      } else {
        // Fallback to localStorage
        try { const d = localStorage.getItem(LS_ATIVOS); if (d) setAtivos(JSON.parse(d)); } catch {}
        try { const d = localStorage.getItem('fs_inv_entries_v1'); if (d) setAtivoEntries(JSON.parse(d)); } catch {}
        try { const d = localStorage.getItem('fs_inv_contribs_v1'); if (d) setAtivoContribs(JSON.parse(d)); } catch {}
        try { const d = localStorage.getItem(LS_FE); if (d) setFeEntries(JSON.parse(d)); } catch {}
      }
      setInvDataLoaded(true);
    }).catch(() => {
      try { const d = localStorage.getItem(LS_ATIVOS); if (d) setAtivos(JSON.parse(d)); } catch {}
      try { const d = localStorage.getItem('fs_inv_entries_v1'); if (d) setAtivoEntries(JSON.parse(d)); } catch {}
      try { const d = localStorage.getItem('fs_inv_contribs_v1'); if (d) setAtivoContribs(JSON.parse(d)); } catch {}
      try { const d = localStorage.getItem(LS_FE); if (d) setFeEntries(JSON.parse(d)); } catch {}
      setInvDataLoaded(true);
    });

    // Check onboarding — source of truth: Supabase user_metadata.
    // Fallback para localStorage (legado + offline). Persistir no Supabase
    // garante que o tour não reaparece entre dispositivos / browsers / PWAs.
    const onboardKey = `${LS_ONBOARDED}_${currentUser.id}`;
    const tourKey = `fs_tour_done_${currentUser.id}`;
    const metaOnboardedAt = currentUser.user_metadata?.fs_onboarded_at;
    const metaTourDoneAt = currentUser.user_metadata?.fs_tour_done_at;

    // Migração: se existia a flag antiga global e ainda não temos a do user,
    // copia para a chave per-user e apaga a antiga (evita mostrar o tour a
    // quem já o fez antes desta alteração).
    if (!localStorage.getItem(onboardKey) && localStorage.getItem(LS_ONBOARDED)) {
      try {
        localStorage.setItem(onboardKey, localStorage.getItem(LS_ONBOARDED));
        const oldTour = localStorage.getItem('fs_tour_done');
        if (oldTour && !localStorage.getItem(tourKey)) localStorage.setItem(tourKey, oldTour);
        localStorage.removeItem(LS_ONBOARDED);
        localStorage.removeItem('fs_tour_done');
      } catch {}
    }

    // Hidratar localStorage a partir do user_metadata (caso o user tenha
    // completado o onboarding noutro dispositivo).
    if (metaOnboardedAt && !localStorage.getItem(onboardKey)) {
      try { localStorage.setItem(onboardKey, metaOnboardedAt); } catch {}
    }
    if (metaTourDoneAt && !localStorage.getItem(tourKey)) {
      try { localStorage.setItem(tourKey, metaTourDoneAt); } catch {}
    }

    // Espelhar localStorage → user_metadata (utilizadores que completaram
    // o tour antes desta alteração, ou que o fizeram offline).
    const sb = getSupabaseClient();
    if (sb) {
      const localOnboard = localStorage.getItem(onboardKey);
      const localTour = localStorage.getItem(tourKey);
      const metaUpdates = {};
      if (localOnboard && !metaOnboardedAt) metaUpdates.fs_onboarded_at = new Date().toISOString();
      if (localTour && !metaTourDoneAt) metaUpdates.fs_tour_done_at = new Date().toISOString();
      if (Object.keys(metaUpdates).length > 0) {
        sb.auth.updateUser({ data: metaUpdates }).catch(() => {});
      }
    }

    // Só abrir o overlay se NENHUMA das fontes (metadata OU localStorage)
    // indicar que o user já o viu.
    if (!metaOnboardedAt && !localStorage.getItem(onboardKey)) {
      setTimeout(() => setOnboardingOpen(true), 600);
    }
  }, [viewMode, currentUser]);

  // ── SUBSCRIPTION: sync from Supabase on login + after returning from Stripe Checkout ──
  useEffect(() => {
    if (!currentUser?.id) return;

    const params = new URLSearchParams(window.location.search);
    const returningFromStripe = params.get('checkout') === 'success';

    if (returningFromStripe) {
      // Webhook may take a second; poll until the row is trialing/active.
      pollSubscriptionUntilActive(currentUser.id).then(() => {
        bumpTrial();
        // Clean the URL so a refresh doesn't re-trigger.
        window.history.replaceState({}, '', window.location.pathname);
      });
    } else {
      syncSubscription(currentUser.id).then(() => bumpTrial());
    }
  }, [currentUser, bumpTrial]);

  // ── SWITCH TAB ──
  const switchTab = useCallback((id) => {
    if (id === 'inv' && userPlan() === 'free') {
      setPaywallTab('Investimentos');
      setPaywallOpen(true);
      return;
    }
    setActiveTab(id);
    setCalcOpen(false);
    window.scrollTo(0, 0);
  }, [userPlan]);

  // ── TRANSACTION HELPERS ──
  const saveTxsLocal = useCallback((newTxs) => {
    setTxs(newTxs);
    try { localStorage.setItem(LS_TXS, JSON.stringify(newTxs)); } catch {}
  }, []);

  const addTransaction = useCallback(async (t) => {
    t.id = nextIdRef.current++;
    const newTxs = [...txs, t];
    saveTxsLocal(newTxs);
    setTxModalOpen(false);
    if (currentUser) {
      await saveTxToSupabase(t, currentUser.id);
      const remote = await loadTxsFromSupabase(currentUser.id);
      if (remote) saveTxsLocal(remote);
    }
  }, [txs, currentUser, saveTxsLocal]);

  const deleteTransaction = useCallback(async (id) => {
    const newTxs = txs.filter(t => String(t.id) !== String(id));
    saveTxsLocal(newTxs);
    if (currentUser) deleteTxFromSupabase(id, currentUser.id).catch(() => {});
  }, [txs, currentUser, saveTxsLocal]);

  const changeCategory = useCallback(async (id, cat) => {
    const newTxs = txs.map(t => {
      if (String(t.id) !== String(id)) return t;
      const updated = { ...t, cat, type: cat === 'Rendimento' ? 'rendimento' : 'despesa', userSet: true };
      const words = normalizeStr(t.desc).split(' ').filter(w => w.length > 3);
      if (words.length > 0) {
        const newRules = { ...userRules, [words.slice(0, 2).join(' ')]: cat };
        setUserRules(newRules);
        try { localStorage.setItem(LS_RULES, JSON.stringify(newRules)); } catch {}
      }
      if (currentUser) saveTxToSupabase(updated, currentUser.id).catch(() => {});
      return updated;
    });
    saveTxsLocal(newTxs);
  }, [txs, currentUser, userRules, saveTxsLocal]);

  const importTransactions = useCallback(async (newTxs) => {
    const withIds = newTxs.map(t => ({ ...t, id: nextIdRef.current++ }));
    const allTxs = [...txs, ...withIds];
    saveTxsLocal(allTxs);
    if (currentUser) {
      await Promise.all(withIds.map(t => saveTxToSupabase(t, currentUser.id).catch(() => {})));
      const remote = await loadTxsFromSupabase(currentUser.id);
      if (remote) saveTxsLocal(remote);
    }
    return withIds.length;
  }, [txs, currentUser, saveTxsLocal]);

  // ── GOAL HELPERS ──
  const saveObjetivosLocal = useCallback((newObj) => {
    setObjetivos(newObj);
    try { localStorage.setItem(LS_OBJ, JSON.stringify(newObj)); } catch {}
  }, []);

  const saveGoal = useCallback(async (obj) => {
    console.log('[saveGoal] Chamado com:', obj);
    console.log('[saveGoal] objetivos atuais:', objetivos);

    // 1) Cópia dos objetivos atuais
    let newObjetivos = [...objetivos];

    // 2) Tenta guardar na Supabase
    let saved = null;
    if (currentUser) {
      try { saved = await saveGoalToSupabase(obj, currentUser.id); } catch (e) { console.error('[saveGoal] Supabase error:', e); }
    }
    console.log('[saveGoal] Supabase returned:', saved);

    // 3) Determina o ID final
    const finalId = saved?.id
      ?? (obj.id && obj.id !== '' && !String(obj.id).startsWith('local_') ? obj.id : null)
      ?? ('local_' + Date.now());

    // 4) Constrói o objeto final com os campos do formulário + ID correto
    const finalObj = {
      id: finalId,
      nome: obj.nome,
      atual: typeof obj.atual === 'number' ? obj.atual : parseFloat(obj.atual) || 0,
      meta: typeof obj.meta === 'number' ? obj.meta : parseFloat(obj.meta) || 0,
      cor: obj.cor || '#00D764',
    };
    console.log('[saveGoal] finalObj:', finalObj);

    // 5) Atualiza ou adiciona no array
    const idx = newObjetivos.findIndex(x => String(x.id) === String(finalId));
    if (idx >= 0) {
      newObjetivos[idx] = finalObj;
      console.log('[saveGoal] Updated at index', idx);
    } else {
      // Para edição: tenta encontrar pelo ID original do obj
      const idxOld = obj.id ? newObjetivos.findIndex(x => String(x.id) === String(obj.id)) : -1;
      if (idxOld >= 0) { newObjetivos[idxOld] = finalObj; console.log('[saveGoal] Updated at OLD index', idxOld); }
      else { newObjetivos.push(finalObj); console.log('[saveGoal] Pushed new goal'); }
    }

    console.log('[saveGoal] newObjetivos final:', newObjetivos);

    // 6) Atualiza estado local imediatamente
    saveObjetivosLocal(newObjetivos);
    setGoalModalOpen(false);
    setGoalEditId(null);

    // 7) Sincroniza com Supabase apenas se o save foi bem-sucedido
    if (saved && currentUser) {
      try {
        const remote = await loadGoalsFromSupabase(currentUser.id);
        if (remote && remote.length > 0) saveObjetivosLocal(remote);
      } catch {}
    }
  }, [objetivos, currentUser, saveObjetivosLocal]);

  const deleteGoal = useCallback(async (id) => {
    if (!confirm('Apagar este objetivo?')) return;
    const newObj = objetivos.filter(o => String(o.id) !== String(id));
    saveObjetivosLocal(newObj);
    if (currentUser) deleteGoalFromSupabase(id, currentUser.id);
  }, [objetivos, currentUser, saveObjetivosLocal]);

  // ── INVESTMENT HELPERS ──
  // Returns FE entry for a given month. If no entry exists, carries forward the
  // most recent prior entry (value + meta). Works for past, current AND future months —
  // consumers (e.g. charts) decide separately whether to render future months.
  const getFeForMonth = useCallback((ym) => {
    if (feEntries[ym]) return feEntries[ym];
    const meses = Object.keys(feEntries).sort();
    let ultimo = null;
    for (const mes of meses) { if (mes <= ym) ultimo = mes; }
    if (ultimo) return { value: feEntries[ultimo].value, meta: feEntries[ultimo].meta };
    return { value: 0, meta: 0 };
  }, [feEntries]);

  const getAtivoValueForMonth = useCallback((id, ym) => (ativoEntries[id] || {})[ym] || 0, [ativoEntries]);
  const getTotalInvestidoForMonth = useCallback((ym) => ativos.reduce((s, a) => s + getAtivoValueForMonth(a.id, ym), 0), [ativos, getAtivoValueForMonth]);
  const getPatrimonioForMonth = useCallback((ym) => getFeForMonth(ym).value + getTotalInvestidoForMonth(ym), [getFeForMonth, getTotalInvestidoForMonth]);

  // Investido acumulado num ativo até ao mês ym (soma das contribuições líquidas).
  // Se ainda não há contribuições registadas mas existe valor de mercado, assume
  // modo legacy: investido = valor atual (valorização = 0). Este fallback
  // evita mostrar rendimentos artificiais a utilizadores antigos até que façam
  // a primeira contribuição explícita.
  const getAtivoInvestidoForMonth = useCallback((id, ym) => {
    const contribs = ativoContribs[id] || {};
    const meses = Object.keys(contribs);
    if (meses.length === 0) {
      return getAtivoValueForMonth(id, ym);
    }
    let total = 0;
    for (const mes of meses) { if (mes <= ym) total += contribs[mes] || 0; }
    return Math.max(0, total);
  }, [ativoContribs, getAtivoValueForMonth]);

  // Valorização = valor de mercado - investido (pode ser negativa).
  const getAtivoValorizacaoForMonth = useCallback((id, ym) => {
    return getAtivoValueForMonth(id, ym) - getAtivoInvestidoForMonth(id, ym);
  }, [getAtivoValueForMonth, getAtivoInvestidoForMonth]);

  const getAtivoRendimentoPctForMonth = useCallback((id, ym) => {
    const inv = getAtivoInvestidoForMonth(id, ym);
    if (inv <= 0) return null;
    return (getAtivoValorizacaoForMonth(id, ym) / inv) * 100;
  }, [getAtivoInvestidoForMonth, getAtivoValorizacaoForMonth]);
  
  const feMetaGlobal = useCallback(() => {
    const meses = Object.keys(feEntries).sort();
    for (let i = meses.length - 1; i >= 0; i--) { if (feEntries[meses[i]].meta > 0) return feEntries[meses[i]].meta; }
    return 0;
  }, [feEntries]);

  const updateFeEntries = useCallback((newEntries) => {
    setFeEntries(newEntries);
    try { localStorage.setItem(LS_FE, JSON.stringify(newEntries)); } catch {}
  }, []);

  const updateAtivoEntries = useCallback((newEntries) => {
    setAtivoEntries(newEntries);
    try { localStorage.setItem('fs_inv_entries_v1', JSON.stringify(newEntries)); } catch {}
  }, []);

  const updateAtivoContribs = useCallback((newContribs) => {
    setAtivoContribs(newContribs);
    try { localStorage.setItem('fs_inv_contribs_v1', JSON.stringify(newContribs)); } catch {}
  }, []);

  const saveAtivosLocal = useCallback((newAtivos) => {
    setAtivos(newAtivos);
    try { localStorage.setItem(LS_ATIVOS, JSON.stringify(newAtivos)); } catch {}
  }, []);

  // ── BUDGET HELPERS ──  
  const saveBudgetLocal = useCallback(async (newBudget, newRendimento) => {
    setBudget(newBudget);
    setRendimentoMensal(newRendimento);
    try { localStorage.setItem(LS_BUDGET, JSON.stringify(newBudget)); localStorage.setItem(LS_RENDIMENTO, String(newRendimento)); } catch {}
    if (currentUser) saveBudgetToSupabase(newRendimento, newBudget, currentUser.id);
  }, [currentUser]);

  // ── COMPUTED DATA ──
  const txsWithRules = txsComRegra(txs);

  // ── RENDER ──
  if (viewMode === 'loading') {
    return <div style={{ minHeight: '100vh', background: '#141829', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <img src={LOGO_SRC} alt="Flowstate" style={{ height: 120, animation: 'pulse 2s infinite' }} />
    </div>;
  }

  if (viewMode === 'landing') {
    return (
      <>
        <LandingPage logo={LOGO_SRC} onShowAuth={() => setViewMode('auth')} />
        <FeedbackButton defaultEmail="" />
      </>
    );
  }

  if (viewMode === 'auth') {
    return (
      <>
        <AuthPage logo={LOGO_SRC} onEnterApp={enterApp} onBack={() => setViewMode('landing')} />
        <FeedbackButton defaultEmail="" />
      </>
    );
  }

  // ── APP MODE ──
  return (
    <>
      <TrialBanner
        onUpgrade={() => switchTab('pricing')}
        onCancel={() => setCancelTrialOpen(true)}
        onReactivate={handleReactivateTrial}
      />
      <Navbar
        logo={LOGO_SRC}
        activeTab={activeTab}
        onSwitchTab={switchTab}
        userPlan={userPlan()}
        userEmail={currentUser?.email}
        onLogout={handleLogout}
        unreadNotifs={notifications.filter(n => !new Set(readIds).has(n.id)).length}
        onToggleNotifs={() => setNotifCenterOpen(prev => !prev)}
      />

      <div id="app-container" style={{ display: 'block' }}>
        {activeTab === 'dash' && (
          <DashboardPage
            txs={txs}
            txsWithRules={txsWithRules}
            objetivos={objetivos}
            budget={budget}
            rendimentoMensal={rendimentoMensal}
            onOpenTxModal={() => setTxModalOpen(true)}
            onSwitchTab={switchTab}
            onEditGoal={(id) => { setGoalEditId(id); setGoalModalOpen(true); }}
            onAddGoal={() => { setGoalEditId(null); setGoalModalOpen(true); }}
            onDeleteGoal={deleteGoal}
            onOpenBudget={() => { setOnboardingEditMode(true); setOnboardingOpen(true); }}
            fmtV={fmtV}
            fmtDate={fmtDate}
            getCurrentMonth={getCurrentMonth}
            streak={streak}
            badges={badges}
            newBadges={newBadges}
            ativos={ativos}
            feEntries={feEntries}
            userPlan={userPlan()}
            onViewPlans={() => { setActiveTab('pricing'); window.scrollTo(0, 0); }}
            dashPrefs={dashPrefs}
            onUpdateDashPrefs={(newPrefs) => { setDashPrefs(newPrefs); try { localStorage.setItem('fs_dash_prefs_v1', JSON.stringify(newPrefs)); } catch {} }}
            onOpenWrapped={(slides) => setWrappedSlides(slides)}
          />
        )}

        {activeTab === 'txs' && (
          <TransactionsPage
            txs={txs}
            txsWithRules={txsWithRules}
            currentPeriod={currentPeriod}
            setCurrentPeriod={setCurrentPeriod}
            userRules={userRules}
            onOpenModal={() => setTxModalOpen(true)}
            onDeleteTx={deleteTransaction}
            onChangeCat={changeCategory}
            onImport={importTransactions}
            fmtV={fmtV}
            fmtDate={fmtDate}
            getCurrentMonth={getCurrentMonth}
          />
        )}

        {activeTab === 'inv' && (
          <InvestmentsPage
            ativos={ativos}
            ativoEntries={ativoEntries}
            ativoContribs={ativoContribs}
            feEntries={feEntries}
            invMonth={invMonth}
            setInvMonth={setInvMonth}
            txsWithRules={txsWithRules}
            currentUser={currentUser}
            getFeForMonth={getFeForMonth}
            getAtivoValueForMonth={getAtivoValueForMonth}
            getAtivoInvestidoForMonth={getAtivoInvestidoForMonth}
            getAtivoValorizacaoForMonth={getAtivoValorizacaoForMonth}
            getAtivoRendimentoPctForMonth={getAtivoRendimentoPctForMonth}
            getTotalInvestidoForMonth={getTotalInvestidoForMonth}
            getPatrimonioForMonth={getPatrimonioForMonth}
            feMetaGlobal={feMetaGlobal}
            updateFeEntries={updateFeEntries}
            updateAtivoEntries={updateAtivoEntries}
            updateAtivoContribs={updateAtivoContribs}
            saveAtivosLocal={saveAtivosLocal}
            onAddAtivo={() => { setAtivoEditId(null); setAtivoModalOpen(true); }}
            onEditAtivo={(id) => { setAtivoEditId(id); setAtivoModalOpen(true); }}
            fmtV={fmtV}
            getCurrentMonth={getCurrentMonth}
            calcOpen={calcOpen}
            onToggleCalc={() => setCalcOpen(prev => !prev)}
          />
        )}

        {/* Calculator overlay — rendered when inside Investments tab */}
        {activeTab === 'inv' && calcOpen && (
          <>
            <div onClick={() => setCalcOpen(false)} style={{
              position: 'fixed', inset: 0, background: 'rgba(10,13,24,.85)', zIndex: 8000
            }} />
            <div style={{
              position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
              zIndex: 8001, width: 700, maxWidth: '95vw', maxHeight: '90vh', overflowY: 'auto',
              background: 'linear-gradient(180deg, #1a1f35 0%, #161a2e 100%)',
              borderRadius: 24, border: '1px solid rgba(255,255,255,.08)',
              boxShadow: '0 32px 80px rgba(0,0,0,.6)', padding: '28px',
              animation: 'calcSlideIn .25s ease'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: '#fff' }}>🧮 Calculadora de Investimentos</div>
                <button onClick={() => setCalcOpen(false)} style={{
                  background: 'rgba(255,255,255,.06)', border: 'none', borderRadius: 10,
                  width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#6e7491', fontSize: 16, cursor: 'pointer'
                }}>✕</button>
              </div>
              <CalculatorPage fmtV={fmtV} embedded />
            </div>
            <style>{`@keyframes calcSlideIn{from{opacity:0;transform:translate(-50%,-50%) scale(.95)}to{opacity:1;transform:translate(-50%,-50%) scale(1)}}`}</style>
          </>
        )}

        {activeTab === 'convites' && (
          <ConvitesPage
            referralData={referralData}
            onSendInvite={async (email) => {
              await sendReferralInvite(referralData, email);
              // Re-puxa stats (o backend inseriu a linha pendente em `referrals`).
              if (currentUser?.id) {
                const fresh = await fetchReferralData(currentUser.id);
                if (fresh) setReferralData(fresh);
              }
            }}
            onLogShare={async (channel) => {
              // Optimistic bump para feedback imediato na UI.
              setReferralData(prev => prev ? { ...prev, invitesSent: (prev.invitesSent || 0) + 1 } : prev);
              const res = await logInviteShare(channel);
              // Re-sincronizar com o backend (cobre cooldown / erros).
              if (currentUser?.id) {
                const fresh = await fetchReferralData(currentUser.id);
                if (fresh) setReferralData(fresh);
              }
              return res;
            }}
          />
        )}

        {activeTab === 'pricing' && (
          <PricingPage
            billingAnual={billingAnual}
            setBillingAnual={setBillingAnual}
            logo={LOGO_SRC}
            onShowAuth={() => setViewMode('auth')}
            onStartTrial={() => { startTrial(); }}
            onSubscribe={(plan) => {
              subscribeViaStripe(plan, billingAnual ? 'year' : 'month');
            }}
          />
        )}

        {activeTab === 'account' && (
          <AccountPage
            currentUser={currentUser}
            userPlan={userPlan()}
            onSwitchTab={switchTab}
            onLogout={handleLogout}
          />
        )}

        {activeTab === 'admin' && (
          <AdminInvitesPage userEmail={currentUser?.email} />
        )}
      </div>

      {/* Bottom tab bar (mobile only) */}
      {isMobile && <BottomNav activeTab={activeTab} onSwitchTab={switchTab} />}

      {/* ── MODALS ── */}
      {txModalOpen && (
        <TransactionModal
          onClose={() => setTxModalOpen(false)}
          onAdd={addTransaction}
        />
      )}

      {goalModalOpen && (
        <GoalModal
          editId={goalEditId}
          objetivos={objetivos}
          onClose={() => { setGoalModalOpen(false); setGoalEditId(null); }}
          onSave={saveGoal}
        />
      )}

      {ativoModalOpen && (
        <AtivoModal
          editId={ativoEditId}
          ativos={ativos}
          ativoEntries={ativoEntries}
          invMonth={invMonth}
          currentUser={currentUser}
          saveAtivosLocal={saveAtivosLocal}
          updateAtivoEntries={updateAtivoEntries}
          onClose={() => { setAtivoModalOpen(false); setAtivoEditId(null); }}
          onReload={() => {
            if (currentUser) {
              loadInvestmentsFromSupabase(currentUser.id).then(data => {
                if (data) {
                  if (data.ativos) setAtivos(data.ativos);
                  setAtivoEntries(data.ativoEntries || {});
                  setFeEntries(data.feEntries || {});
                }
              });
            }
          }}
        />
      )}

      {onboardingOpen && (
        <OnboardingOverlay
          budget={budget}
          rendimentoMensal={rendimentoMensal}
          editOnly={onboardingEditMode}
          onFinish={async (newBudget, newRendimento) => {
            await saveBudgetLocal(newBudget, newRendimento);
            const wasEditMode = onboardingEditMode;
            if (!wasEditMode && currentUser?.id) {
              // Só marca fs_onboarded_at na primeira passagem (onboarding completo).
              const nowIso = new Date().toISOString();
              localStorage.setItem(`${LS_ONBOARDED}_${currentUser.id}`, nowIso);
              try {
                const sb = getSupabaseClient();
                sb && sb.auth.updateUser({ data: { fs_onboarded_at: nowIso } }).catch(() => {});
              } catch {}
            }
            setOnboardingOpen(false);
            setOnboardingEditMode(false);
            // Só dispara o tour interactivo no onboarding inicial, não quando o user só veio editar orçamento.
            if (!wasEditMode) {
              setTimeout(() => setTourOpen(true), 400);
            }
          }}
          onClose={() => { setOnboardingOpen(false); setOnboardingEditMode(false); }}
        />
      )}

      {tourOpen && (
        <AppTour
          onFinish={() => {
            setTourOpen(false);
            const nowIso = new Date().toISOString();
            if (currentUser?.id) {
              localStorage.setItem(`fs_tour_done_${currentUser.id}`, nowIso);
              try {
                const sb = getSupabaseClient();
                sb && sb.auth.updateUser({ data: { fs_tour_done_at: nowIso } }).catch(() => {});
              } catch {}
            }
          }}
          onSwitchTab={(id) => { setActiveTab(id); window.scrollTo(0, 0); }}
          isMobile={isMobile}
        />
      )}

      {paywallOpen && (
        <PaywallOverlay
          tabName={paywallTab}
          onClose={() => setPaywallOpen(false)}
          onViewPlans={() => { setPaywallOpen(false); setActiveTab('pricing'); }}
          onStartTrial={() => { setPaywallOpen(false); startTrial(); }}
        />
      )}

      {trialOfferOpen && (
        <TrialOfferModal
          onClose={() => setTrialOfferOpen(false)}
          onUpgrade={() => { setTrialOfferOpen(false); setActiveTab('pricing'); }}
        />
      )}

      {cancelTrialOpen && (
        <CancelTrialModal
          onClose={() => setCancelTrialOpen(false)}
          onConfirm={handleCancelTrial}
        />
      )}

      {autoChargedToast && (
        <div style={{
          position: 'fixed', top: 80, right: 20, zIndex: 9600,
          background: 'linear-gradient(135deg, #00D764 0%, #00b454 100%)',
          borderRadius: 16, padding: '14px 18px', maxWidth: 360,
          boxShadow: '0 12px 40px rgba(0,215,100,.35)',
          animation: 'toastSlideIn .4s ease',
          display: 'flex', gap: 12, alignItems: 'center'
        }}>
          <span style={{ fontSize: 26 }}>🎉</span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#000', marginBottom: 2 }}>Bem-vindo ao Flow Plus!</div>
            <div style={{ fontSize: 11, color: 'rgba(0,0,0,.7)', lineHeight: 1.4 }}>O teu trial terminou e o pagamento foi processado. Acesso total desbloqueado.</div>
          </div>
        </div>
      )}

      {legalOpen && (
        <LegalOverlay
          tipo={legalOpen}
          onClose={() => setLegalOpen(null)}
        />
      )}

      {/* Referral Invite Modal */}
      {referralModalOpen && (
        <ReferralInviteModal
          referralData={referralData}
          onSendInvite={async (email) => {
            await sendReferralInvite(referralData, email);
            if (currentUser?.id) {
              const fresh = await fetchReferralData(currentUser.id);
              if (fresh) setReferralData(fresh);
            }
          }}
          onClose={() => setReferralModalOpen(false)}
        />
      )}

      {/* Wrapped Stories */}
      {wrappedSlides && (
        <WrappedStories
          slides={wrappedSlides}
          onClose={() => setWrappedSlides(null)}
        />
      )}

      {/* Notification Center */}
      {notifCenterOpen && (
        <NotificationCenter
          notifications={notifications}
          readIds={readIds}
          onMarkAllRead={() => {
            const ids = markAllReadUtil(notifications);
            setReadIds(ids);
          }}
          onClose={() => setNotifCenterOpen(false)}
        />
      )}

      {/* Notification Toast */}
      {notifToast && (
        <div onClick={() => { setNotifToast(null); setNotifCenterOpen(true); }} style={{
          position: 'fixed', top: 80, right: 20, zIndex: 9500,
          background: 'linear-gradient(135deg, #1c2033 0%, #252a3a 100%)',
          border: '1px solid rgba(0,215,100,.25)', borderRadius: 16,
          padding: '14px 18px', maxWidth: 340, cursor: 'pointer',
          boxShadow: '0 12px 40px rgba(0,0,0,.5)',
          animation: 'toastSlideIn .4s ease',
          display: 'flex', gap: 12, alignItems: 'center'
        }}>
          <span style={{ fontSize: 22 }}>
            {notifToast.type === 'budget_exceeded' ? '🚨' : notifToast.type === 'goal_reached' ? '🏆' : notifToast.type === 'negative_month' ? '📉' : '🔔'}
          </span>
          <div>
            <div style={{ fontSize: 12, fontWeight: 800, color: '#fff', marginBottom: 2 }}>{notifToast.title}</div>
            <div style={{ fontSize: 10, color: '#6e7491', lineHeight: 1.4 }}>{notifToast.message?.slice(0, 80)}{notifToast.message?.length > 80 ? '...' : ''}</div>
          </div>
          <style>{`@keyframes toastSlideIn{from{opacity:0;transform:translateX(60px)}to{opacity:1;transform:translateX(0)}}`}</style>
        </div>
      )}

      {/* Feedback Button (beta fechada) — live na Navbar */}
    </>
  );
}
