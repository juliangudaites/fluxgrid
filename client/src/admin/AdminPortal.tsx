import { useCallback, useEffect, useState } from 'react';
import { adminApi, adminLogin, adminLogout, getAdminToken } from './adminApi';
import './AdminPortal.css';

type Tab = 'dashboard' | 'reports' | 'messages' | 'channels' | 'banned' | 'controls' | 'launch' | 'audit';

const ADMIN_PORTAL_URL = `${window.location.origin}/admin`;

interface Stats {
  messages: {
    total: number;
    active: number;
    hidden: number;
    removed: number;
    channels: number;
    burning?: number;
    burned?: number;
    boosted?: number;
    withAttachments?: number;
    pinned?: number;
    priorityChannels?: number;
  };
  reports: { total: number; pending: number; confirmed: number; dismissed: number };
  simulator: boolean;
}

export function AdminPortal() {
  const [authed, setAuthed] = useState(!!getAdminToken());
  const [pin, setPin] = useState('');
  const [loginError, setLoginError] = useState('');
  const [tab, setTab] = useState<Tab>('dashboard');
  const [stats, setStats] = useState<Stats | null>(null);
  const [reports, setReports] = useState<Record<string, unknown>[]>([]);
  const [messages, setMessages] = useState<Record<string, unknown>[]>([]);
  const [channels, setChannels] = useState<Record<string, unknown>[]>([]);
  const [banned, setBanned] = useState<Record<string, unknown>[]>([]);
  const [audit, setAudit] = useState<Record<string, unknown>[]>([]);
  const [simulatorOn, setSimulatorOn] = useState(true);
  const [banInput, setBanInput] = useState('');
  const [loading, setLoading] = useState(false);


  const refresh = useCallback(async () => {
    if (!getAdminToken()) return;
    setLoading(true);
    try {
      const [s, r, m, c, b, a] = await Promise.all([
        adminApi.stats(),
        adminApi.reports('pending'),
        adminApi.messages(300),
        adminApi.channels(),
        adminApi.banned(),
        adminApi.audit(),
      ]);
      setStats(s);
      setReports(r.reports);
      setMessages(m.messages);
      setChannels(c.channels);
      setBanned(b.channels.filter((ch: Record<string, unknown>) => ch.active));
      setAudit(a.logs);
      setSimulatorOn(s.simulator);
    } catch (e) {
      if ((e as Error).message === 'UNAUTHORIZED') setAuthed(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authed) {
      refresh();
      const iv = setInterval(refresh, 8000);
      return () => clearInterval(iv);
    }
  }, [authed, refresh]);

  const handleLogin = async (e: { preventDefault: () => void }) => {
    e.preventDefault();
    setLoginError('');
    try {
      await adminLogin(pin);
      setAuthed(true);
      setPin('');
    } catch {
      setLoginError('Invalid PIN');
    }
  };

  const handleLogout = async () => {
    await adminLogout();
    setAuthed(false);
  };

  if (!authed) {
    return (
      <div className="admin-login">
        <div className="admin-login__card">
          <span className="admin-login__eyebrow">FLUXGRID HOST</span>
          <h1>Administrator Portal</h1>
          <p>Enter your host PIN to access moderation and site controls.</p>
          <div className="admin-login__url">
            <span>Portal URL</span>
            <code>{ADMIN_PORTAL_URL}</code>
          </div>
          <form onSubmit={handleLogin}>
            <input
              type="password"
              inputMode="numeric"
              placeholder="••••••••••••"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              autoComplete="off"
            />
            {loginError && <p className="admin-login__error">{loginError}</p>}
            <button type="submit">ACCESS PORTAL</button>
          </form>
          <a href="/" className="admin-login__back">← Back to FLUXGRID</a>
        </div>
      </div>
    );
  }

  const pendingCount = stats?.reports.pending ?? 0;

  return (
    <div className="admin">
      <aside className="admin__sidebar">
        <div className="admin__brand">
          <span>FLUXGRID</span>
          <small>HOST PORTAL</small>
        </div>
        <nav className="admin__nav">
          {(
            [
              ['dashboard', 'Dashboard'],
              ['reports', `Reports ${pendingCount ? `(${pendingCount})` : ''}`],
              ['messages', 'All Messages'],
              ['channels', 'Channels'],
              ['banned', 'Banned'],
              ['controls', 'Site Controls'],
              ['launch', 'Launch Status'],
              ['audit', 'Audit Log'],
            ] as [Tab, string][]
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              className={tab === id ? 'admin__nav-btn admin__nav-btn--active' : 'admin__nav-btn'}
              onClick={() => setTab(id)}
            >
              {label}
            </button>
          ))}
        </nav>
        <div className="admin__sidebar-footer">
          <a href="/" target="_blank" rel="noreferrer">View site ↗</a>
          <button type="button" onClick={handleLogout}>Logout</button>
        </div>
      </aside>

      <main className="admin__main">
        <header className="admin__header">
          <h2>{tab.charAt(0).toUpperCase() + tab.slice(1)}</h2>
          <button type="button" className="admin__refresh" onClick={refresh} disabled={loading}>
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </header>

        {tab === 'dashboard' && stats && (
          <>
            <div className="admin__portal-url">
              <div>
                <strong>Administrator portal location</strong>
                <p>Bookmark this URL for moderators and site owner access:</p>
              </div>
              <code>{ADMIN_PORTAL_URL}</code>
              <a href="/" target="_blank" rel="noreferrer" className="admin__portal-link">Open public site ↗</a>
            </div>
            <div className="admin__grid">
              <StatCard label="Active messages" value={stats.messages.active} accent="cyan" />
              <StatCard label="Hidden (reported)" value={stats.messages.hidden} accent="amber" />
              <StatCard label="Removed" value={stats.messages.removed} accent="red" />
              <StatCard label="Pending reports" value={stats.reports.pending} accent="magenta" />
              <StatCard label="Channels" value={stats.messages.channels} accent="violet" />
              <StatCard label="Burning now" value={stats.messages.burning ?? 0} accent="amber" />
              <StatCard label="Deep void (FLUX)" value={stats.messages.boosted ?? 0} accent="lime" />
              <StatCard label="With attachments" value={stats.messages.withAttachments ?? 0} accent="violet" />
              <StatCard label="Pinned messages" value={stats.messages.pinned ?? 0} accent="violet" />
              <StatCard label="Priority channels" value={stats.messages.priorityChannels ?? 0} accent="magenta" />
              <StatCard label="Simulator" value={simulatorOn ? 'ON' : 'OFF'} accent="lime" />
            </div>
            <div className="admin__quick-guide">
              <h3>Launch mode</h3>
              <div className="admin__guide-grid">
                <div><strong>FREE TIER</strong><span>Fully operational — random IDs, emoji chat, channel lock</span></div>
                <div><strong>SIMULATOR</strong><span>Main grid only — never posts on real user channels</span></div>
                <div><strong>PAID TIERS</strong><span>LIVE — SIGNAL $6, PULSE $11, FLUX $18 via Card or Bitcoin</span></div>
                <div><strong>STRIPE</strong><span>Card / Apple Pay — STRIPE_SECRET_KEY + STRIPE_WEBHOOK_SECRET in Render env</span></div>
                <div><strong>BITCOIN</strong><span>Tips + tier payments — BITCOIN_TIP_ADDRESS in server .env</span></div>
              </div>
            </div>
          </>
        )}

        {tab === 'reports' && (
          <div className="admin__list">
            {reports.length === 0 ? (
              <p className="admin__empty">No pending reports.</p>
            ) : (
              reports.map((r) => (
                <div key={String(r.id)} className="admin__card admin__card--report">
                  <div className="admin__card-head">
                    <span className={`admin__badge admin__badge--${r.category}`}>{String(r.category)}</span>
                    <span className="admin__mono">{String(r.threadId)}</span>
                    <time>{new Date(String(r.timestamp)).toLocaleString()}</time>
                  </div>
                  <p className="admin__content">{String(r.messageContent)}</p>
                  <p className="admin__meta">Message hidden from public · awaiting your review</p>
                  <div className="admin__actions">
                    <button type="button" className="admin__btn admin__btn--danger" onClick={async () => { await adminApi.reportAction(String(r.id), 'confirm'); refresh(); }}>
                      Confirm remove
                    </button>
                    <button type="button" className="admin__btn admin__btn--warn" onClick={async () => { await adminApi.reportAction(String(r.id), 'ban_channel'); refresh(); }}>
                      Ban channel
                    </button>
                    <button type="button" className="admin__btn admin__btn--ok" onClick={async () => { await adminApi.reportAction(String(r.id), 'dismiss'); refresh(); }}>
                      Dismiss (restore)
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {tab === 'messages' && (
          <div className="admin__table-wrap">
            <table className="admin__table">
              <thead>
                <tr>
                  <th>Channel</th>
                  <th>Content</th>
                  <th>Burn</th>
                  <th>Attach</th>
                  <th>Pin</th>
                  <th>Boost</th>
                  <th>Tier</th>
                  <th>Status</th>
                  <th>Reports</th>
                  <th>Time</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {messages.map((m) => (
                  <tr key={String(m.id)}>
                    <td className="admin__mono">{String(m.threadId)}</td>
                    <td className="admin__content-cell">{String(m.content).slice(0, 80)}</td>
                    <td className="admin__mono">{m.burnAt ? new Date(String(m.burnAt)).toLocaleString() : '—'}</td>
                    <td>{m.attachmentType ? String(m.attachmentType) : '—'}</td>
                    <td>{m.pinned ? '✓' : '—'}</td>
                    <td>{m.boosted ? '✓' : '—'}</td>
                    <td className="admin__mono">{String(m.tier ?? '—')}</td>
                    <td><span className={`admin__status admin__status--${m.status ?? 'active'}`}>{String(m.status ?? 'active')}</span></td>
                    <td>{String(m.reportCount ?? 0)}</td>
                    <td>{new Date(String(m.timestamp)).toLocaleString()}</td>
                    <td className="admin__actions-cell">
                      {(m.status === 'hidden' || m.status === 'removed') && (
                        <button type="button" className="admin__btn-sm" onClick={async () => { await adminApi.messageAction(String(m.id), 'restore'); refresh(); }}>Restore</button>
                      )}
                      {m.status === 'active' && (
                        <button type="button" className="admin__btn-sm" onClick={async () => { await adminApi.messageAction(String(m.id), 'hide'); refresh(); }}>Hide</button>
                      )}
                      <button type="button" className="admin__btn-sm admin__btn-sm--danger" onClick={async () => { await adminApi.messageAction(String(m.id), 'confirm_remove'); refresh(); }}>Remove</button>
                      <button type="button" className="admin__btn-sm admin__btn-sm--danger" onClick={async () => { await adminApi.deleteMessage(String(m.id)); refresh(); }}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'channels' && (
          <div className="admin__table-wrap">
            <table className="admin__table">
              <thead>
                <tr><th>Channel ID</th><th>Total</th><th>Active</th><th>Hidden</th><th>Removed</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {channels.map((c) => (
                  <tr key={String(c.threadId)}>
                    <td className="admin__mono">{String(c.threadId)}</td>
                    <td>{String(c.total)}</td>
                    <td>{String(c.active)}</td>
                    <td>{String(c.hidden)}</td>
                    <td>{String(c.removed)}</td>
                    <td>
                      <button type="button" className="admin__btn-sm admin__btn-sm--danger" onClick={async () => { await adminApi.banChannel(String(c.threadId)); refresh(); }}>Ban</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'banned' && (
          <div className="admin__section">
            <div className="admin__ban-form">
              <input
                type="text"
                placeholder="CHANNEL ID TO BAN"
                value={banInput}
                onChange={(e) => setBanInput(e.target.value.toUpperCase())}
              />
              <button type="button" onClick={async () => { if (banInput) { await adminApi.banChannel(banInput); setBanInput(''); refresh(); } }}>
                Ban channel
              </button>
            </div>
            <div className="admin__list">
              {banned.length === 0 ? <p className="admin__empty">No banned channels.</p> : banned.map((b) => (
                <div key={String(b.threadId)} className="admin__card">
                  <span className="admin__mono">{String(b.threadId)}</span>
                  <span className="admin__meta">{String(b.reason || '')}</span>
                  <button type="button" className="admin__btn admin__btn--ok" onClick={async () => { await adminApi.unbanChannel(String(b.threadId)); refresh(); }}>Unban</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'controls' && (
          <div className="admin__controls">
            <div className="admin__control-card">
              <h3>Live dummy simulator</h3>
              <p>Generates demo messages on the main grid only. Real user-created channels are excluded automatically.</p>
              <button
                type="button"
                className={`admin__toggle ${simulatorOn ? 'admin__toggle--on' : ''}`}
                onClick={async () => {
                  const next = !simulatorOn;
                  await adminApi.setSimulator(next);
                  setSimulatorOn(next);
                  refresh();
                }}
              >
                {simulatorOn ? 'SIMULATOR ON — click to pause' : 'SIMULATOR OFF — click to enable'}
              </button>
            </div>
            <div className="admin__control-card">
              <h3>Moderation workflow</h3>
              <ul>
                <li>User reports → message <strong>hidden immediately</strong> from public</li>
                <li>You review in Reports tab</li>
                <li><strong>Confirm remove</strong> — stays removed</li>
                <li><strong>Dismiss</strong> — restore to public (false report)</li>
                <li><strong>Ban channel</strong> — block entire channel ID</li>
              </ul>
            </div>
            <div className="admin__control-card">
              <h3>FLUX message burner</h3>
              <p>Messages with a 60s burn timer are removed automatically every 3 seconds. Force-expire any overdue burns now.</p>
              <button
                type="button"
                className="admin__toggle"
                onClick={async () => {
                  const result = await adminApi.expireBurned();
                  alert(`Expired ${result.expired} burned message(s)`);
                  refresh();
                }}
              >
                RUN BURNER CLEANUP NOW
              </button>
            </div>
            <div className="admin__control-card">
              <h3>Do you need paid moderators?</h3>
              <p>At low traffic, <strong>you can moderate alone</strong> via this portal. Hire moderators or a trust &amp; safety vendor when:</p>
              <ul>
                <li>Pending reports exceed ~20/day</li>
                <li>You enable image/video uploads (paid tier)</li>
                <li>You operate in multiple countries at scale</li>
              </ul>
              <p>Early stage: check this portal 2–3× daily. CSAM reports = immediate action + legal counsel.</p>
            </div>
          </div>
        )}

        {tab === 'launch' && (
          <div className="admin__section">
            <div className="admin__control-card">
              <h3>Launch edition — free tier active</h3>
              <p>Free VOID tier is always available. Paid tiers SIGNAL, PULSE, and FLUX are live via Card (Stripe) or Bitcoin:</p>
              <ul>
                <li>Random channel IDs, 2,000 character messages</li>
                <li>Emoji group chat and channel lock</li>
                <li>Live public feed with simulator on main grid only</li>
                <li>No login, no accounts, no payment required</li>
              </ul>
            </div>
            <div className="admin__control-card">
              <h3>Paid tiers — live</h3>
              <ul>
                <li><strong>SIGNAL</strong> — custom vanity IDs ($6/mo)</li>
                <li><strong>PULSE</strong> — attachments, pinning, priority styling ($11/mo)</li>
                <li><strong>FLUX</strong> — deep void burial, burn timers ($18/mo)</li>
              </ul>
              <p>Users pay via Stripe or Bitcoin → receive FG-XXXX access key → 2 devices max per key. Stripe unlocks via webhook. Confirm pending Bitcoin payments in admin if blockchain detection misses a tx.</p>
            </div>
            <div className="admin__control-card">
              <h3>Donations & tips</h3>
              <p>Bitcoin tips and tier payments share BITCOIN_TIP_ADDRESS. Tips use any amount; tiers use unique exact satoshi amounts for auto-detection.</p>
            </div>
          </div>
        )}

        {tab === 'audit' && (
          <div className="admin__table-wrap">
            <table className="admin__table">
              <thead><tr><th>Time</th><th>Action</th><th>Details</th></tr></thead>
              <tbody>
                {audit.map((l) => (
                  <tr key={String(l.id)}>
                    <td>{new Date(String(l.timestamp)).toLocaleString()}</td>
                    <td className="admin__mono">{String(l.action)}</td>
                    <td>{JSON.stringify(l.details)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}

function StatCard({ label, value, accent }: { label: string; value: string | number; accent: string }) {
  return (
    <div className={`admin__stat admin__stat--${accent}`}>
      <span className="admin__stat-value">{value}</span>
      <span className="admin__stat-label">{label}</span>
    </div>
  );
}