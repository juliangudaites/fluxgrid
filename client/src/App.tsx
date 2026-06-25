import { useCallback, useEffect, useRef, useState } from 'react';
import { completeStripeTierCheckout, fetchLiveMessages, fetchRecentMessages, fetchThread, fetchThreadMeta, postMessage } from './api';
import type { Message, ThreadMeta } from './types';
import { getStoredEmoji } from './emojis';
import { useI18n } from './i18n/context';
import { useTier } from './tiers/context';
import { filterVisibleMessages } from './utils/messages';
import { VoidBackground } from './components/VoidBackground';
import { IdLookup } from './components/IdLookup';
import { MessageCard } from './components/MessageCard';
import { ComposePanel } from './components/ComposePanel';
import { ComposeFab } from './components/ComposeFab';
import { AnonymityPanel } from './components/AnonymityPanel';
import { PlansPanel } from './components/PlansPanel';
import { DonateBanner } from './components/DonateBanner';
import { TipModal } from './components/TipModal';
import { TierPayModal } from './components/TierPayModal';
import { PaymentSuccessModal } from './components/PaymentSuccessModal';
import { SessionLimitModal } from './components/SessionLimitModal';
import { AccessCodeModal } from './components/AccessCodeModal';
import type { TierId } from './tiers/tiers';
import type { TransmitOptions } from './types';
import { ThreadView } from './components/ThreadView';
import { Toast } from './components/Toast';
import { AgeGate } from './components/AgeGate';
import { WelcomeModal } from './components/WelcomeModal';
import { LegalPanel, type LegalDocType } from './components/LegalPanel';
import { LegalFooter } from './components/LegalFooter';
import { VoidDepthCounter } from './components/VoidDepthCounter';
import { LanguageToggle } from './components/LanguageToggle';
import { ReportModal } from './components/ReportModal';
import { captureRefFromUrl } from './utils/refCapture';
import './App.css';

const FEED_POLL_MS = 2200;
const FEED_POLL_HIDDEN_MS = 7500;
const FEED_FULL_EVERY = 16;
const FEED_STAGGER_MS = 130;
const FEED_STAGGER_MAX = 5;
const THREAD_POLL_MS = 9000;
const MAX_VISIBLE = 80;

function AppContent() {
  const { t } = useI18n();
  const {
    caps,
    deviceLimitOpen,
    sessions,
    maxDevices,
    revokeSession,
    closeDeviceLimit,
    handleDeviceLimitError,
    applyAccessCode,
  } = useTier();
  const [onboarding, setOnboarding] = useState<'age' | 'welcome' | 'done'>('age');

  useEffect(() => {
    captureRefFromUrl();

    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get('stripe_session');
    if (!sessionId) return;

    (async () => {
      try {
        const result = await completeStripeTierCheckout(sessionId);
        if (result.paid && result.accessCode) {
          await applyAccessCode(result.accessCode);
          setPaymentSuccess({
            tierName: result.tierLabel ?? 'Tier',
            accessCode: result.accessCode,
            expiresAt: result.expiresAt,
          });
        } else {
          setToast('Payment pending — refresh in a moment if you completed checkout');
        }
      } catch {
        setToast('Payment verification failed — contact support if you were charged');
      }
      window.history.replaceState({}, '', window.location.pathname);
    })();
  }, [applyAccessCode]);

  const [messages, setMessages] = useState<Message[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [activeThread, setActiveThread] = useState('');
  const [threadMessages, setThreadMessages] = useState<Message[]>([]);
  const [threadLoading, setThreadLoading] = useState(false);
  const [threadMeta, setThreadMeta] = useState<ThreadMeta | null>(null);
  const [anonymityOpen, setAnonymityOpen] = useState(false);
  const [plansOpen, setPlansOpen] = useState(false);
  const [accessCodeOpen, setAccessCodeOpen] = useState(false);
  const [legalDoc, setLegalDoc] = useState<LegalDocType | null>(null);
  const [composeOpen, setComposeOpen] = useState(true);
  const [toast, setToast] = useState('');
  const [loading, setLoading] = useState(true);
  const [newIds, setNewIds] = useState<Set<string>>(new Set());
  const [liveCount, setLiveCount] = useState(0);
  const [reportMessage, setReportMessage] = useState<Message | null>(null);
  const [tipOpen, setTipOpen] = useState(false);
  const [tipAmountUsd, setTipAmountUsd] = useState<number | undefined>(undefined);
  const [tierPayOpen, setTierPayOpen] = useState(false);
  const [tierPayTarget, setTierPayTarget] = useState<{
    id: TierId;
    name: string;
    priceUsd: number;
  } | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState<{
    tierName: string;
    accessCode: string;
    expiresAt?: string;
  } | null>(null);
  const knownIdsRef = useRef<Set<string>>(new Set());
  const initialLoadRef = useRef(true);
  const feedInFlightRef = useRef(false);
  const threadInFlightRef = useRef(false);
  const pollPausedRef = useRef(false);
  const feedSinceRef = useRef<string | null>(null);
  const feedPollCountRef = useRef(0);
  const staggerTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const [tabVisible, setTabVisible] = useState(() =>
    typeof document === 'undefined' ? true : !document.hidden
  );

  const markNewMessages = useCallback((incoming: Message[]) => {
    if (initialLoadRef.current) {
      incoming.forEach((m) => knownIdsRef.current.add(m.id));
      initialLoadRef.current = false;
      return;
    }
    const fresh: string[] = [];
    for (const m of incoming) {
      if (!knownIdsRef.current.has(m.id)) {
        knownIdsRef.current.add(m.id);
        fresh.push(m.id);
      }
    }
    if (fresh.length > 0) {
      setNewIds((prev) => {
        const next = new Set(prev);
        fresh.forEach((id) => next.add(id));
        return next;
      });
      setLiveCount((c) => c + fresh.length);
      setTimeout(() => {
        setNewIds((prev) => {
          const next = new Set(prev);
          fresh.forEach((id) => next.delete(id));
          return next;
        });
      }, 2800);
    }
  }, []);

  const bumpFeedSince = useCallback((msgs: Message[], serverTime?: string) => {
    if (serverTime) {
      feedSinceRef.current = serverTime;
      return;
    }
    const newest = msgs.reduce<string | null>((acc, m) => {
      if (!acc || new Date(m.timestamp) > new Date(acc)) return m.timestamp;
      return acc;
    }, null);
    if (newest) feedSinceRef.current = newest;
  }, []);

  const clearStaggerTimers = useCallback(() => {
    staggerTimersRef.current.forEach((id) => clearTimeout(id));
    staggerTimersRef.current = [];
  }, []);

  const mergeIncoming = useCallback((prev: Message[], batch: Message[]) => {
    const seen = new Set(prev.map((m) => m.id));
    const merged = [...batch.filter((m) => !seen.has(m.id)), ...prev];
    return merged.slice(0, MAX_VISIBLE);
  }, []);

  const revealIncoming = useCallback((incoming: Message[], serverTime?: string) => {
    if (incoming.length === 0) return;
    clearStaggerTimers();

    const ordered = [...incoming].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    bumpFeedSince(ordered, serverTime);

    const head = ordered.slice(0, FEED_STAGGER_MAX);
    const tail = ordered.slice(FEED_STAGGER_MAX);

    head.forEach((msg, i) => {
      const timer = setTimeout(() => {
        markNewMessages([msg]);
        setMessages((prev) => mergeIncoming(prev, [msg]));
      }, i * FEED_STAGGER_MS);
      staggerTimersRef.current.push(timer);
    });

    if (tail.length > 0) {
      const timer = setTimeout(() => {
        markNewMessages(tail);
        setMessages((prev) => mergeIncoming(prev, tail));
      }, head.length * FEED_STAGGER_MS);
      staggerTimersRef.current.push(timer);
    }
  }, [bumpFeedSince, clearStaggerTimers, markNewMessages, mergeIncoming]);

  const loadFeed = useCallback(async (forceFull = false) => {
    if (feedInFlightRef.current || pollPausedRef.current) return;
    feedInFlightRef.current = true;
    try {
      const useDelta = !forceFull && feedSinceRef.current && !initialLoadRef.current;

      if (useDelta && feedSinceRef.current) {
        const data = await fetchLiveMessages(feedSinceRef.current, 24);
        const incoming = filterVisibleMessages(data.messages);
        if (incoming.length > 0) {
          revealIncoming(incoming, data.serverTime);
        } else if (data.serverTime) {
          bumpFeedSince([], data.serverTime);
        }
        setTotalCount(data.total ?? 0);
      } else {
        const data = await fetchRecentMessages(MAX_VISIBLE);
        const incoming = filterVisibleMessages(data.messages);
        markNewMessages(incoming);
        setMessages(incoming);
        setTotalCount(data.total ?? incoming.length);
        bumpFeedSince(incoming, data.serverTime);
      }
    } catch (err) {
      console.error(err);
    } finally {
      feedInFlightRef.current = false;
      setLoading(false);
    }
  }, [markNewMessages, bumpFeedSince, revealIncoming]);

  useEffect(() => () => clearStaggerTimers(), [clearStaggerTimers]);

  useEffect(() => {
    const onVisibility = () => setTabVisible(!document.hidden);
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  const loadThread = useCallback(async (threadId: string, silent = false) => {
    if (threadInFlightRef.current || (silent && pollPausedRef.current)) return;
    threadInFlightRef.current = true;
    if (!silent) setThreadLoading(true);
    try {
      const [data, meta] = await Promise.all([
        fetchThread(threadId),
        fetchThreadMeta(threadId),
      ]);
      setThreadMessages(filterVisibleMessages(data.messages));
      setThreadMeta(meta);
    } catch (err) {
      console.error(err);
      if (!silent) {
        setThreadMessages([]);
        setThreadMeta(null);
      }
    } finally {
      threadInFlightRef.current = false;
      if (!silent) setThreadLoading(false);
    }
  }, []);

  useEffect(() => {
    pollPausedRef.current = tipOpen || tierPayOpen;
  }, [tipOpen, tierPayOpen]);

  useEffect(() => {
    if (onboarding === 'age' || tipOpen || tierPayOpen) return;
    feedPollCountRef.current = 0;
    loadFeed(true);
    const interval = setInterval(() => {
      feedPollCountRef.current += 1;
      const forceFull = feedPollCountRef.current % FEED_FULL_EVERY === 0;
      void loadFeed(forceFull);
    }, activeThread
      ? FEED_POLL_MS + 2000
      : tabVisible
        ? FEED_POLL_MS
        : FEED_POLL_HIDDEN_MS);
    return () => clearInterval(interval);
  }, [loadFeed, onboarding, tipOpen, tierPayOpen, activeThread, tabVisible]);

  useEffect(() => {
    if (!activeThread || onboarding === 'age' || tipOpen || tierPayOpen) return;
    setThreadMessages([]);
    setThreadMeta(null);
    loadThread(activeThread, false);
    const interval = setInterval(() => loadThread(activeThread, true), THREAD_POLL_MS);
    return () => clearInterval(interval);
  }, [activeThread, loadThread, onboarding, tipOpen, tierPayOpen]);

  const handleGoHome = () => {
    setActiveThread('');
    setThreadMessages([]);
    setThreadMeta(null);
    setAnonymityOpen(false);
    setPlansOpen(false);
    setLegalDoc(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    loadFeed();
  };

  const handleLookup = (threadId: string) => setActiveThread(threadId);

  const handleShare = async (threadId: string) => {
    const text = `${t('idCopiedShare')} ${threadId}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: 'FLUXGRID', text });
      } else {
        await navigator.clipboard.writeText(threadId);
        setToast(`${t('toastIdCopied')} ${threadId}`);
      }
    } catch {
      await navigator.clipboard.writeText(threadId);
      setToast(`${t('toastIdCopied')} ${threadId}`);
    }
    setTimeout(() => setToast(''), 3000);
  };

  const handleTransmit = async (
    threadId: string,
    content: string,
    senderEmoji: string | null,
    options?: TransmitOptions
  ) => {
    pollPausedRef.current = true;
    let message;
    let threadMeta;
    try {
      ({ message, threadMeta } = await postMessage(threadId, content, senderEmoji, options));
    } catch (err) {
      if (handleDeviceLimitError(err)) return;
      throw err;
    } finally {
      pollPausedRef.current = false;
    }
    if (message.deleteToken) {
      localStorage.setItem(`fluxgrid_del_${message.id}`, message.deleteToken);
    }
    knownIdsRef.current.add(message.id);
    const wasNewChannel = !activeThread;
    setActiveThread(threadId);
    if (threadMeta) setThreadMeta(threadMeta);
    setThreadMessages((prev) => [...prev, message]);
    setMessages((prev) => [message, ...prev.filter((m) => m.id !== message.id)].slice(0, MAX_VISIBLE));
    setTotalCount((c) => c + 1);
    bumpFeedSince([message], message.timestamp);
    setNewIds((prev) => new Set(prev).add(message.id));
    setTimeout(() => {
      setNewIds((prev) => {
        const next = new Set(prev);
        next.delete(message.id);
        return next;
      });
    }, 2800);
    setComposeOpen(true);
    if (wasNewChannel) {
      requestAnimationFrame(() => {
        document.querySelector('.thread-view')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }
  };

  const handleReportSuccess = () => {
    setToast(t('reportSuccess'));
    setTimeout(() => setToast(''), 3000);
    loadFeed();
    if (activeThread) loadThread(activeThread);
  };

  const displayedMessages = activeThread
    ? messages.filter((m) => m.threadId === activeThread)
    : messages;

  if (onboarding === 'age') {
    return <AgeGate onVerified={() => setOnboarding('welcome')} />;
  }

  const welcomeOverlay =
    onboarding === 'welcome' ? (
      <WelcomeModal onContinue={() => setOnboarding('done')} />
    ) : null;

  return (
    <div className="app">
      <VoidBackground />

      <header className="header">
        <button type="button" className="header__brand" onClick={handleGoHome} title={t('backHome')}>
          <h1 className="header__logo">{t('brand')}</h1>
          <span className="header__year">{t('year')}</span>
        </button>
        <IdLookup value={activeThread} onLookup={handleLookup} onClear={() => setActiveThread('')} />
        <LanguageToggle />
        <button type="button" className="header__support" onClick={() => { setTipAmountUsd(undefined); setTipOpen(true); }}>
          {t('support')}
        </button>
        <button type="button" className="header__access-key" onClick={() => setAccessCodeOpen(true)}>
          {t('accessKey')}
        </button>
        <button type="button" className="header__plans" onClick={() => setPlansOpen(true)}>
          {t('plans')}
        </button>
        <button
          type="button"
          className="header__help"
          onClick={() => setAnonymityOpen(true)}
          aria-label={t('help')}
        >
          ?
        </button>
      </header>

      <main className={`main ${composeOpen ? 'main--compose-open' : 'main--compose-closed'}`}>
        <section className="hero">
          <h2 className="hero__title">{t('heroTitle')}</h2>
          <p className="hero__subtitle">
            {composeOpen ? t('heroSubtitleOpen') : t('heroSubtitleClosed')}
          </p>
          <div className="hero__stats">
            <span className="hero__stat hero__stat--live">
              <span className="hero__live-dot" />
              <strong>{t('live')}</strong> · {totalCount} {t('signals')}
            </span>
            {liveCount > 0 && (
              <span className="hero__stat hero__stat--new">
                +<strong>{liveCount}</strong> {t('sinceArrived')}
              </span>
            )}
            {activeThread && (
              <span className="hero__stat hero__stat--active">
                {t('channelOpen')} <strong>{activeThread}</strong>
              </span>
            )}
            <span className="hero__stat hero__stat--tier">
              <strong>{caps.label}</strong> · {t('launchEdition')}
            </span>
            <button type="button" className="hero__stat hero__stat--support" onClick={() => { setTipAmountUsd(undefined); setTipOpen(true); }}>
              {t('supportVoid')}
            </button>
          </div>
        </section>

        <DonateBanner onSupport={() => { setTipAmountUsd(undefined); setTipOpen(true); }} />

        {!activeThread && <VoidDepthCounter variant="banner" />}

        {activeThread && (
          <ThreadView
            threadId={activeThread}
            messages={threadMessages}
            loading={threadLoading}
            threadMeta={threadMeta}
            myEmoji={getStoredEmoji(activeThread)}
            onShare={handleShare}
            onMetaUpdate={setThreadMeta}
            onToast={(msg) => {
              setToast(msg);
              setTimeout(() => setToast(''), 3000);
            }}
            onRefresh={() => loadThread(activeThread, true)}
          />
        )}

        {loading ? (
          <div className="message-grid message-grid--loading">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="skeleton-card" />
            ))}
          </div>
        ) : displayedMessages.length === 0 ? (
          <div className="empty-state">
            <span className="empty-state__icon">◎</span>
            <h3>{t('emptyTitle')}</h3>
            <p>{t('emptyText')}</p>
          </div>
        ) : (
          <section className="message-grid" aria-label="Public messages">
            {(activeThread ? displayedMessages : messages).map((msg, i) => (
              <MessageCard
                key={msg.id}
                message={msg}
                index={i}
                highlighted={activeThread === msg.threadId}
                isNew={newIds.has(msg.id)}
                onSelectThread={handleLookup}
                onShare={handleShare}
                onReport={setReportMessage}
              />
            ))}
          </section>
        )}

        <LegalFooter onOpenLegal={setLegalDoc} />
      </main>

      <ComposePanel
        open={composeOpen}
        activeThreadId={activeThread}
        threadMeta={threadMeta}
        onTransmit={handleTransmit}
        onShare={handleShare}
        onClose={() => setComposeOpen(false)}
        onOpenTerms={() => setLegalDoc('terms')}
        onOpenPlans={() => setPlansOpen(true)}
      />

      {!composeOpen && (
        <ComposeFab onClick={() => setComposeOpen(true)} newCount={liveCount} />
      )}

      <AccessCodeModal open={accessCodeOpen} onClose={() => setAccessCodeOpen(false)} />
      <AnonymityPanel open={anonymityOpen} onClose={() => setAnonymityOpen(false)} />
      <PlansPanel
        open={plansOpen}
        onClose={() => setPlansOpen(false)}
        onDonate={(amountUsd) => {
          setTipAmountUsd(amountUsd);
          setTipOpen(true);
        }}
        onBuyTier={(tierId, priceUsd, tierName) => {
          setTierPayTarget({ id: tierId, name: tierName, priceUsd });
          setTierPayOpen(true);
        }}
      />
      {tierPayTarget && (
        <TierPayModal
          open={tierPayOpen}
          tierId={tierPayTarget.id}
          tierName={tierPayTarget.name}
          priceUsd={tierPayTarget.priceUsd}
          onClose={() => {
            setTierPayOpen(false);
            setTierPayTarget(null);
          }}
          onSuccess={() => {
            setToast(`${tierPayTarget.name} tier activated — features live now`);
            setTimeout(() => setToast(''), 5000);
            setPlansOpen(false);
          }}
        />
      )}
      <SessionLimitModal
        open={deviceLimitOpen}
        sessions={sessions}
        maxDevices={maxDevices}
        onRevoke={revokeSession}
        onClose={closeDeviceLimit}
      />
      <TipModal
        open={tipOpen}
        initialAmountUsd={tipAmountUsd}
        onClose={() => setTipOpen(false)}
        onSuccess={() => {
          setToast(t('tipThankYou'));
          setTimeout(() => setToast(''), 4000);
        }}
      />
      <LegalPanel open={!!legalDoc} doc={legalDoc} onClose={() => setLegalDoc(null)} />
      <ReportModal
        message={reportMessage}
        onClose={() => setReportMessage(null)}
        onSuccess={handleReportSuccess}
      />
      {paymentSuccess && (
        <PaymentSuccessModal
          open
          tierName={paymentSuccess.tierName}
          accessCode={paymentSuccess.accessCode}
          expiresAt={paymentSuccess.expiresAt}
          onClose={() => setPaymentSuccess(null)}
        />
      )}
      <Toast message={toast} visible={!!toast} />
      {welcomeOverlay}
    </div>
  );
}

function App() {
  return <AppContent />;
}

export default App;