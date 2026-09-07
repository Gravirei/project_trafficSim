'use client';

import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Search,
  Bell,
  Map as LucideMap,
  LogOut,
  User as LucideUser,
  Gauge,
  CalendarClock,
  MapPin,
  ServerCog,
  Siren,
  Plus,
  Minus,
  Maximize,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { JUNCS, JUNCTION_IDS, fmtClock } from '@/lib/sim';
import { useViewController } from '@/hooks/useViewController';
import { useAuth } from '@/components/auth/AuthProvider';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { Panel, PanelHeader, Block } from '@/components/ui/Panel';
import { useMapController } from '@/views/map/useMapController';
import s from './dashboard.module.css';

interface AlertItem {
  id: number;
  sev: 'critical' | 'warning' | 'info';
  junc: string;
  t: number; // seconds offset
  ack: boolean;
  txt: string;
}

const FLEET: Record<
  string,
  {
    district: string;
    comms: 'ok' | 'warn' | 'bad';
    power: 'ok' | 'warn' | 'bad';
    detFaults: number;
    firmware: string;
    checkin: number;
  }
> = {
  cross: { district: 'DOWNTOWN CORE', comms: 'ok', power: 'ok', detFaults: 0, firmware: 'v4.2.1', checkin: 40 },
  round: { district: 'RING DISTRICT', comms: 'warn', power: 'ok', detFaults: 1, firmware: 'v4.2.1', checkin: 660 },
  y: { district: 'MERIDIAN', comms: 'ok', power: 'warn', detFaults: 0, firmware: 'v4.1.8', checkin: 90 },
  t: { district: 'HARBOR SIDE', comms: 'ok', power: 'ok', detFaults: 0, firmware: 'v4.2.1', checkin: 220 },
  penta: { district: 'FIVE POINTS', comms: 'ok', power: 'ok', detFaults: 0, firmware: 'v4.2.1', checkin: 15 },
};

const INITIAL_ALERTS: AlertItem[] = [
  {
    id: 1,
    sev: 'critical',
    junc: 'round',
    t: -260,
    ack: false,
    txt: 'Detector loop 3 dropout on Entry C — actuated phasing fell back to fixed timing.',
  },
  {
    id: 2,
    sev: 'warning',
    junc: 'y',
    t: -540,
    ack: false,
    txt: 'Cabinet has been running on battery backup — mains power not detected.',
  },
  {
    id: 3,
    sev: 'warning',
    junc: 'cross',
    t: -1400,
    ack: false,
    txt: 'Pedestrian call rate 40% above baseline for this hour.',
  },
  {
    id: 4,
    sev: 'info',
    junc: 't',
    t: -900,
    ack: true,
    txt: 'Timing plan synced from depot.',
  },
  {
    id: 5,
    sev: 'info',
    junc: 'y',
    t: -2200,
    ack: true,
    txt: 'Controller firmware check completed — no updates required.',
  },
];

const UPTIME: number[] = [
  99, 100, 100, 98, 100, 100, 100, 97, 100, 100, 99, 100, 100, 100, 96, 100, 100, 99, 100, 100, 100, 98, 100, 100,
  100, 99, 100, 100, 95, 100,
];

function fmtAgo(sec: number): string {
  const s = Math.max(0, Math.floor(sec));
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  return `${h}h ${m % 60}m ago`;
}

export function DashboardView() {
  const router = useRouter();
  const { showLanding, showMap } = useViewController();
  const { user, logout } = useAuth();

  const [search, setSearch] = useState('');
  const [fleetFilter, setFleetFilter] = useState<'all' | 'issue'>('all');
  const [alertFilter, setAlertFilter] = useState<'all' | 'critical' | 'warning' | 'info'>('all');
  const [alerts, setAlerts] = useState<AlertItem[]>(INITIAL_ALERTS);
  const [clockStr, setClockStr] = useState('07:00:00');
  const [fleetCollapsed, setFleetCollapsed] = useState(false);
  const [alertsCollapsed, setAlertsCollapsed] = useState(false);

  const sparkRef = useRef<HTMLCanvasElement | null>(null);
  const mapCvRef = useRef<HTMLCanvasElement | null>(null);

  // Network map controller integration
  const mapCtl = useMapController({
    cvRef: mapCvRef,
    autoFit: true,
    searchQuery: search,
    onJunctionClick: (id) => router.push('/desk/' + id),
  });

  // Live RAF simulation clock
  useEffect(() => {
    let raf = 0;
    let clockT = 0;
    let last = performance.now();

    const tick = (now: number) => {
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      clockT += dt;
      setClockStr(fmtClock(7 * 3600 + clockT));
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  // Draw 30-day uptime sparkline
  useEffect(() => {
    const cv = sparkRef.current;
    if (!cv) return;
    const ctx = cv.getContext('2d');
    if (!ctx) return;

    const w = cv.width;
    const h = cv.height;
    ctx.clearRect(0, 0, w, h);

    const bw = w / UPTIME.length;
    UPTIME.forEach((val, i) => {
      const barH = ((val - 92) / 8) * (h - 4);
      ctx.fillStyle = val < 98 ? '#e5484d' : '#f0a63c';
      ctx.fillRect(i * bw + 1, h - Math.max(2, barH), bw - 2, Math.max(2, barH));
    });

    ctx.strokeStyle = '#26282e';
    ctx.lineWidth = 1;
    ctx.strokeRect(0.5, 0.5, w - 1, h - 1);
  }, []);

  const handleAck = useCallback((id: number) => {
    setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, ack: !a.ack } : a)));
  }, []);

  const handleLogout = useCallback(() => {
    logout();
    router.push('/login');
  }, [logout, router]);

  // Derived metrics
  const junctions = useMemo(() => JUNCTION_IDS.map((id) => JUNCS[id]).filter(Boolean), []);
  const onlineCount = useMemo(
    () => junctions.filter((j) => FLEET[j.id]?.comms === 'ok').length,
    [junctions],
  );
  const openAlerts = useMemo(() => alerts.filter((a) => !a.ack), [alerts]);
  const critOpenCount = useMemo(() => openAlerts.filter((a) => a.sev === 'critical').length, [openAlerts]);
  const avgUptime = useMemo(() => (UPTIME.reduce((a, b) => a + b, 0) / UPTIME.length).toFixed(1), []);

  const filteredFleet = useMemo(() => {
    const q = search.trim().toLowerCase();
    return junctions.filter((j) => {
      const f = FLEET[j.id];
      const hasIssue = f.comms !== 'ok' || f.power !== 'ok' || f.detFaults > 0;
      if (fleetFilter === 'issue' && !hasIssue) return false;
      if (q) {
        const text = `${j.name} ${j.code} ${f.district}`.toLowerCase();
        if (!text.includes(q)) return false;
      }
      return true;
    });
  }, [junctions, fleetFilter, search]);

  const filteredAlerts = useMemo(() => {
    return alerts
      .filter((a) => (alertFilter === 'all' ? true : a.sev === alertFilter))
      .slice()
      .sort((a, b) => Number(a.ack) - Number(b.ack) || a.t - b.t);
  }, [alerts, alertFilter]);

  const avatarInitials = useMemo(() => {
    const raw = user?.username || 'GW';
    return raw.replace(/[^A-Za-z0-9]/g, '').slice(0, 2).toUpperCase() || 'GW';
  }, [user]);

  return (
    <div id="dashboard" className={s.dashboard}>
      {/* Topbar */}
      <header className={s.topbar}>
        <button
          className={s.tbBtn}
          onClick={() => showLanding()}
          aria-label="Back to briefing"
        >
          <ArrowLeft size={14} strokeWidth={2} /> BRIEFING
        </button>

        <span className={s.tbTitle}>
          GREENWAVE · <b>OPS DASHBOARD</b>
        </span>

        <span className={s.modeChip}>
          FLEET <b>{onlineCount}/{junctions.length}</b> ONLINE
        </span>

        <div className={s.tbSearch}>
          <Search size={13} strokeWidth={2} color="var(--dim)" />
          <input
            type="text"
            placeholder="SEARCH SITE, CODE OR DISTRICT…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search site, code or district"
          />
        </div>

        <div className={s.tbRight}>
          <button
            type="button"
            className={`${s.alertchip} ${openAlerts.length === 0 ? s.alertchipClear : ''}`}
            onClick={() => setAlertsCollapsed((prev) => !prev)}
            title={alertsCollapsed ? 'Click to expand alerts panel' : 'Click to collapse alerts panel'}
            aria-label={alertsCollapsed ? 'Expand alerts panel' : 'Collapse alerts panel'}
            role="status"
          >
            <Bell size={12} strokeWidth={2} />
            {openAlerts.length > 0
              ? `${openAlerts.length} ALERT${openAlerts.length > 1 ? 'S' : ''}${
                  critOpenCount > 0 ? ` · ${critOpenCount} CRIT` : ''
                }`
              : 'NO ALERTS'}
          </button>

          <button
            className={s.tbBtn}
            onClick={() => showMap()}
            aria-label="Open full network map"
          >
            <LucideMap size={14} strokeWidth={2} /> FULL MAP
          </button>

          <ThemeToggle />

          <span className={s.clock} role="timer" aria-label="Network ops clock">
            {clockStr}
          </span>

          <button
            className={s.tbBtn}
            onClick={handleLogout}
            aria-label="Sign out"
          >
            <LogOut size={14} strokeWidth={2} /> SIGN OUT
          </button>
        </div>
      </header>

      {/* Main Grid */}
      <main className={`${s.dashwrap} ${alertsCollapsed ? s.dashwrapAlertsCollapsed : ''}`}>
        {/* Column 1: Operator & KPIs */}
        <div className={`${s.dashcol} ${s.dashcolL}`}>
          {/* Operator Panel */}
          <Panel>
            <PanelHeader right={<LucideUser size={14} strokeWidth={2} />}>
              OPERATOR
            </PanelHeader>
            <Block className={s.profileblk}>
              <div className={s.avatar}>{avatarInitials}</div>
              <div className={s.pinfo}>
                <div className={s.pname}>{user?.username || 'GW OPERATOR'}</div>
                <div className={s.prole}>
                  TRAFFIC OPERATOR · ID <b>GW-{user?.id ?? '04'}</b>
                </div>
              </div>
            </Block>
            <Block>
              <div className={s.meta}>
                SHIFT <b>DAY · 07:00–15:00</b>
                <br />
                STATION <b>DESK 4 · OPS FLOOR</b>
                <br />
                SIGNED IN <b>07:00</b>
              </div>
            </Block>
          </Panel>

          {/* Network KPIs Panel */}
          <Panel>
            <PanelHeader right={<Gauge size={14} strokeWidth={2} />}>
              NETWORK KPIs
            </PanelHeader>
            <Block>
              <div className={s.statsGrid}>
                <div className={s.sg}>
                  <div className={s.k}>SITES ONLINE</div>
                  <div className={s.v}>
                    {onlineCount}
                    <b>/{junctions.length}</b>
                  </div>
                </div>
                <div className={s.sg}>
                  <div className={s.k}>OPEN ALERTS</div>
                  <div className={s.v}>{openAlerts.length}</div>
                </div>
                <div className={s.sg}>
                  <div className={s.k}>DESKS OPEN</div>
                  <div className={s.v}>{junctions.length}</div>
                </div>
                <div className={s.sg}>
                  <div className={s.k}>MTTR (30D)</div>
                  <div className={s.v}>
                    38<b>min</b>
                  </div>
                </div>
              </div>

              <canvas
                ref={sparkRef}
                className={s.uptimeSpark}
                width={230}
                height={42}
                aria-label="30-day uptime sparkline"
              />
              <div className={s.sparkCap}>
                UPTIME · LAST 30 DAYS · <span>{avgUptime}% AVG</span>
              </div>
            </Block>
          </Panel>

          {/* Today Panel */}
          <Panel>
            <PanelHeader right={<CalendarClock size={14} strokeWidth={2} />}>
              TODAY
            </PanelHeader>
            <Block>
              <div className={s.meta}>
                PREEMPTIONS TODAY <b>3</b>
                <br />
                ALARMS OPENED <b>{alerts.length}</b> · CLOSED{' '}
                <b>{alerts.filter((a) => a.ack).length}</b>
                <br />
                SHIFT COVERAGE <b>ON TRACK</b>
              </div>
            </Block>
          </Panel>
        </div>

        {/* Column 2: Live City Map & Fleet Health */}
        <div className={`${s.dashcol} ${s.dashcolC}`}>
          {/* Live City Map Panel */}
          <Panel className={s.minimapPanel}>
            <PanelHeader right={<MapPin size={14} strokeWidth={2} />}>
              LIVE CITY MAP
            </PanelHeader>
            <div className={s.minimapStage}>
              <canvas ref={mapCvRef} className={s.minimapCanvas} />
              <div className={s.minimapControls}>
                <button
                  className={s.miniBtn}
                  onClick={mapCtl.zoomIn}
                  aria-label="Zoom in"
                  title="Zoom in"
                >
                  <Plus size={12} strokeWidth={2} />
                </button>
                <button
                  className={s.miniBtn}
                  onClick={mapCtl.zoomOut}
                  aria-label="Zoom out"
                  title="Zoom out"
                >
                  <Minus size={12} strokeWidth={2} />
                </button>
                <button
                  className={s.miniBtn}
                  onClick={mapCtl.fit}
                  aria-label="Fit network map"
                  title="Fit network"
                >
                  <Maximize size={12} strokeWidth={2} />
                </button>
              </div>
              <div className={s.minimapLegend}>
                <span>
                  <i style={{ background: 'var(--grn)' }} />
                  ONLINE / GREEN
                </span>
                <span>
                  <i style={{ background: 'var(--yel)' }} />
                  YELLOW
                </span>
                <span>
                  <i style={{ background: 'var(--red)' }} />
                  ALL-RED
                </span>
              </div>
              <div className={s.minimapHint}>
                CLICK A JUNCTION TO OPEN DESK
              </div>
            </div>
          </Panel>

          {/* Fleet Health Panel */}
          <Panel className={`${s.fleetPanel} ${fleetCollapsed ? s.fleetPanelCollapsed : ''}`}>
            <PanelHeader
              right={
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <div className={`${s.fleetFilterWrap} ${fleetCollapsed ? s.fleetFilterWrapCollapsed : ''}`}>
                    <span className={s.fseg} role="tablist" aria-label="Fleet filter">
                      <button
                        className={fleetFilter === 'all' ? s.on : ''}
                        onClick={() => setFleetFilter('all')}
                        type="button"
                      >
                        ALL
                      </button>
                      <button
                        className={fleetFilter === 'issue' ? s.on : ''}
                        onClick={() => setFleetFilter('issue')}
                        type="button"
                      >
                        ISSUES
                      </button>
                    </span>
                  </div>
                  <button
                    className={s.panelToggleBtn}
                    onClick={() => setFleetCollapsed((prev) => !prev)}
                    title={fleetCollapsed ? 'Expand Fleet Health' : 'Collapse Fleet Health'}
                    aria-label={fleetCollapsed ? 'Expand Fleet Health' : 'Collapse Fleet Health'}
                    type="button"
                  >
                    <ChevronUp
                      size={14}
                      strokeWidth={2}
                      className={`${s.chevronIcon} ${fleetCollapsed ? s.chevronIconCollapsed : ''}`}
                    />
                  </button>
                </div>
              }
            >
              <span
                onClick={() => fleetCollapsed && setFleetCollapsed(false)}
                style={{ cursor: fleetCollapsed ? 'pointer' : 'default', display: 'inline-flex', alignItems: 'center' }}
              >
                FLEET HEALTH <ServerCog size={14} strokeWidth={2} style={{ verticalAlign: -2, marginLeft: 4 }} />
                <span className={`${s.fleetCollapsedTag} ${fleetCollapsed ? s.fleetCollapsedTagVisible : ''}`}>
                  {onlineCount}/{junctions.length} ONLINE
                </span>
              </span>
            </PanelHeader>
            <div className={`${s.fleetCollapsible} ${fleetCollapsed ? s.fleetCollapsibleCollapsed : ''}`}>
              <div className={s.fleetCollapsibleInner}>
                <div className={s.fleetTableWrap}>
                  <table className={s.fleetTable}>
                    <thead>
                      <tr>
                        <th>SITE</th>
                        <th>DISTRICT</th>
                        <th>COMMS</th>
                        <th>POWER</th>
                        <th>DETECTORS</th>
                        <th>FIRMWARE</th>
                        <th />
                      </tr>
                    </thead>
                    <tbody>
                      {filteredFleet.map((j) => {
                        const f = FLEET[j.id];
                        const commsCls =
                          f.comms === 'ok' ? s.fstatOk : f.comms === 'warn' ? s.fstatWarn : s.fstatBad;
                        const powerCls =
                          f.power === 'ok' ? s.fstatOk : f.power === 'warn' ? s.fstatWarn : s.fstatBad;
                        const detCls = f.detFaults > 0 ? s.fstatWarn : s.fstatOk;

                        return (
                          <tr key={j.id}>
                            <td>
                              <span className={s.siteCode}>{j.code}</span>
                              <span className={s.siteName}>{j.name}</span>
                            </td>
                            <td>{f.district}</td>
                            <td>
                              <span className={`${s.fstat} ${commsCls}`}>
                                <i className={s.fstatDot} />
                                {f.comms === 'ok' ? 'ONLINE' : f.comms === 'warn' ? 'DEGRADED' : 'OFFLINE'}
                              </span>
                            </td>
                            <td>
                              <span className={`${s.fstat} ${powerCls}`}>
                                <i className={s.fstatDot} />
                                {f.power === 'ok' ? 'MAINS' : f.power === 'warn' ? 'BATTERY' : 'LOW BATT'}
                              </span>
                            </td>
                            <td>
                              <span className={`${s.fstat} ${detCls}`}>
                                <i className={s.fstatDot} />
                                {f.detFaults > 0 ? `${f.detFaults} FAULT` : 'OK'}
                              </span>
                            </td>
                            <td>{f.firmware}</td>
                            <td>
                              <button
                                className={s.fopen}
                                onClick={() => router.push('/desk/' + j.id)}
                                aria-label={`Open desk for ${j.name}`}
                              >
                                OPEN →
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                      {filteredFleet.length === 0 && (
                        <tr>
                          <td colSpan={7} className={s.emptyHint}>
                            NO SITES MATCHING FILTER.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </Panel>
        </div>

        {/* Column 3: Alerts */}
        <div className={`${s.dashcol} ${s.dashcolR} ${alertsCollapsed ? s.dashcolRCollapsed : ''}`}>
          {/* Expanded Alerts Panel */}
          <div className={`${s.alertExpandedContainer} ${alertsCollapsed ? s.alertExpandedHidden : ''}`}>
            <Panel className={s.alertPanel}>
              <PanelHeader
                right={
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <Siren size={14} strokeWidth={2} />
                    <button
                      className={s.panelToggleBtn}
                      onClick={() => setAlertsCollapsed(true)}
                      title="Collapse alerts"
                      aria-label="Collapse alerts"
                      type="button"
                    >
                      <ChevronRight size={14} strokeWidth={2} />
                    </button>
                  </div>
                }
              >
                ALERTS
              </PanelHeader>

              <Block className={s.alertFilterBlock}>
                <div className={s.fseg} style={{ width: '100%', display: 'flex' }}>
                  <button
                    style={{ flex: 1 }}
                    className={alertFilter === 'all' ? s.on : ''}
                    onClick={() => setAlertFilter('all')}
                    type="button"
                  >
                    ALL
                  </button>
                  <button
                    style={{ flex: 1 }}
                    className={alertFilter === 'critical' ? s.on : ''}
                    onClick={() => setAlertFilter('critical')}
                    type="button"
                  >
                    CRIT
                  </button>
                  <button
                    style={{ flex: 1 }}
                    className={alertFilter === 'warning' ? s.on : ''}
                    onClick={() => setAlertFilter('warning')}
                    type="button"
                  >
                    WARN
                  </button>
                  <button
                    style={{ flex: 1 }}
                    className={alertFilter === 'info' ? s.on : ''}
                    onClick={() => setAlertFilter('info')}
                    type="button"
                  >
                    INFO
                  </button>
                </div>
              </Block>

              <div className={s.alertlistBlk}>
                {filteredAlerts.map((a) => {
                  const j = JUNCS[a.junc];
                  const sevCls =
                    a.sev === 'critical'
                      ? s.sevCritical
                      : a.sev === 'warning'
                      ? s.sevWarning
                      : s.sevInfo;
                  const asevCls =
                    a.sev === 'critical'
                      ? s.asevCritical
                      : a.sev === 'warning'
                      ? s.asevWarning
                      : s.asevInfo;

                  return (
                    <div
                      key={a.id}
                      className={`${s.aitem} ${sevCls} ${a.ack ? s.ack : `${s.unack} ${sevCls}`}`}
                    >
                      <div className={s.arow1}>
                        <span className={`${s.asev} ${asevCls}`}>{a.sev}</span>
                        <span className={s.atime}>{fmtAgo(-a.t)}</span>
                      </div>
                      <div className={s.atxt}>{a.txt}</div>
                      <div className={s.aloc}>{j ? `${j.code} · ${j.name}` : ''}</div>
                      <button
                        className={`${s.aack} ${a.ack ? s.aackAcked : ''}`}
                        onClick={() => handleAck(a.id)}
                      >
                        {a.ack ? '✓ ACKNOWLEDGED' : 'ACKNOWLEDGE'}
                      </button>
                    </div>
                  );
                })}
                {filteredAlerts.length === 0 && (
                  <div className={s.emptyHint}>NO ALERTS IN THIS FILTER.</div>
                )}
              </div>
            </Panel>
          </div>

          {/* Collapsed Rail Panel */}
          <div className={`${s.alertRailContainer} ${!alertsCollapsed ? s.alertRailHidden : ''}`}>
            <Panel
              className={s.alertPanelCollapsed}
              onClick={() => setAlertsCollapsed(false)}
              title="Click to expand alerts"
            >
              <button
                className={s.railToggleBtn}
                onClick={(e) => {
                  e.stopPropagation();
                  setAlertsCollapsed(false);
                }}
                title="Expand alerts"
                aria-label="Expand alerts"
                type="button"
              >
                <ChevronLeft size={14} strokeWidth={2} />
              </button>
              <div className={s.railIcon}>
                <Siren size={15} strokeWidth={2} className={critOpenCount > 0 ? s.railIconCrit : ''} />
              </div>
              {openAlerts.length > 0 && (
                <span className={`${s.railBadge} ${critOpenCount > 0 ? s.railBadgeCrit : ''}`}>
                  {openAlerts.length}
                </span>
              )}
              <div className={s.railText}>ALERTS</div>
            </Panel>
          </div>
        </div>
      </main>
    </div>
  );
}
