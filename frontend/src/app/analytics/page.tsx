"use client";

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Signal } from '@/types';

interface AnalyticsSummary {
  systemAvgWait: number;
  peakQueueLength: number;
  avgUtilization: number;
  totalRecords: number;
}

export default function AnalyticsPage() {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [signalStats, setSignalStats] = useState<any[]>([]);

  async function fetchAnalytics() {
    setLoading(true);
    try {
      const [summaryData, signals] = await Promise.all([
        api.getAnalyticsSummary(),
        api.getSignals(),
      ]);
      setSummary(summaryData);

      const stats = await Promise.all(
        (signals as Signal[]).map((s: Signal) => api.getSignalStats(s.id))
      );
      setSignalStats(stats);
    } catch (err) {
      console.error("Failed to load analytics:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAnalytics();
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h1 style={{ fontSize: "2rem", fontWeight: 600, letterSpacing: "-0.02em", marginBottom: "0.5rem" }}>
            Executive Analytics
          </h1>
          <p style={{ color: "var(--text-secondary)" }}>
            High-level operational metrics and system efficiency aggregates across all traffic signals.
          </p>
        </div>
        <button className="btn btn-outline" onClick={fetchAnalytics} disabled={loading}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }}>
            <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
            <path d="M3 3v5h5"></path>
            <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"></path>
            <path d="M16 21v-5h5"></path>
          </svg>
          {loading ? 'Crunching Numbers...' : 'Refresh Metrics'}
        </button>
      </header>

      {/* Aggregate Metric Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.5rem" }}>
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', borderTop: '3px solid var(--accent-blue)' }}>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: 600, letterSpacing: '0.05em' }}>
            TOTAL RECORDS LOGGED
          </div>
          <div style={{ fontSize: '2.5rem', fontWeight: 700, fontFamily: 'var(--font-fira-code)', color: 'var(--text-primary)' }}>
            {loading ? '--' : summary?.totalRecords.toLocaleString()}
          </div>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            Data points continuously recorded via tick cycles.
          </div>
        </div>

        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', borderTop: '3px solid var(--accent-red)' }}>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: 600, letterSpacing: '0.05em' }}>
            PEAK QUEUE LENGTH
          </div>
          <div style={{ fontSize: '2.5rem', fontWeight: 700, fontFamily: 'var(--font-fira-code)', color: 'var(--text-primary)' }}>
            {loading ? '--' : summary?.peakQueueLength}
            <span style={{ fontSize: '1.25rem', color: 'var(--text-secondary)', marginLeft: '0.5rem' }}>veh</span>
          </div>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            The maximum traffic jam magnitude recorded across any lane.
          </div>
        </div>

        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', borderTop: '3px solid var(--accent-yellow)' }}>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: 600, letterSpacing: '0.05em' }}>
            GLOBAL AVERAGE WAIT (Wq)
          </div>
          <div style={{ fontSize: '2.5rem', fontWeight: 700, fontFamily: 'var(--font-fira-code)', color: 'var(--accent-yellow)' }}>
            {loading ? '--' : summary?.systemAvgWait.toFixed(2)}
            <span style={{ fontSize: '1.25rem', color: 'var(--text-secondary)', marginLeft: '0.5rem' }}>sec</span>
          </div>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            The mean time delay introduced per vehicle across all intersections.
          </div>
        </div>

        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', borderTop: '3px solid var(--accent-green)' }}>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: 600, letterSpacing: '0.05em' }}>
            SYSTEM-WIDE UTILIZATION (ρ)
          </div>
          <div style={{ fontSize: '2.5rem', fontWeight: 700, fontFamily: 'var(--font-fira-code)', color: 'var(--accent-green)' }}>
            {loading ? '--' : summary?.avgUtilization.toFixed(1)}
            <span style={{ fontSize: '1.25rem', color: 'var(--text-secondary)', marginLeft: '0.5rem' }}>%</span>
          </div>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            Overall lane capacity consumed by moving traffic.
          </div>
        </div>
      </div>

      {/* Per-Signal Breakdown */}
      {signalStats.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 600, color: "var(--text-secondary)", letterSpacing: "0.05em" }}>
            PER-SIGNAL BREAKDOWN
          </h2>
          <div className="glass-panel" style={{ padding: 0, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)", backgroundColor: "rgba(255,255,255,0.02)" }}>
                  {["SIGNAL", "STATE", "QUEUE LENGTH", "AVG WAIT (Wq)", "UTILIZATION (ρ)", "ARRIVAL RATE (λ)"].map(h => (
                    <th key={h} style={{ padding: "1rem", color: "var(--text-secondary)", fontWeight: 500, fontSize: "0.875rem" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {signalStats.map((stat: any) => {
                  const u = Number(stat.utilization);
                  const uColor = u > 80 ? "var(--accent-red)" : u > 50 ? "var(--accent-yellow)" : "var(--accent-green)";
                  const stateColor = stat.state === 'GREEN' ? "var(--accent-green)" : stat.state === 'YELLOW' ? "var(--accent-yellow)" : "var(--accent-red)";
                  return (
                    <tr key={stat.signalId} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                      <td style={{ padding: "1rem", fontWeight: 500 }}>{stat.name}</td>
                      <td style={{ padding: "1rem" }}>
                        <span style={{ color: stateColor, fontFamily: "var(--font-fira-code)", fontSize: "0.875rem", fontWeight: 600 }}>
                          ● {stat.state}
                        </span>
                      </td>
                      <td style={{ padding: "1rem", fontFamily: "var(--font-fira-code)" }}>{stat.queueLength} veh</td>
                      <td style={{ padding: "1rem", fontFamily: "var(--font-fira-code)" }}>{Number(stat.avgWaitTime).toFixed(2)}s</td>
                      <td style={{ padding: "1rem", fontFamily: "var(--font-fira-code)", color: uColor, fontWeight: 600 }}>
                        {u.toFixed(1)}%
                      </td>
                      <td style={{ padding: "1rem", fontFamily: "var(--font-fira-code)" }}>{Number(stat.arrivalRate).toFixed(2)} /s</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
