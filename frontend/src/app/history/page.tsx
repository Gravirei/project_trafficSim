"use client";

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { QueueHistory } from '@/types';
import HistoryChart from '@/components/history/HistoryChart';

export default function HistoryPage() {
  const [history, setHistory] = useState<QueueHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterSignalId, setFilterSignalId] = useState<string>('all');
  const [limit, setLimit] = useState(100);

  useEffect(() => {
    let isMounted = true;

    async function fetchData() {
      setLoading(true);
      try {
        const signalId = filterSignalId === 'all' ? undefined : parseInt(filterSignalId);
        const data = await api.getHistory(signalId, limit);
        if (isMounted) {
          setHistory(data);
        }
      } catch (err) {
        console.error("Error fetching history:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchData();

    return () => { isMounted = false; };
  }, [filterSignalId, limit]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      <header>
        <h1 style={{ fontSize: "2rem", fontWeight: 600, letterSpacing: "-0.02em", marginBottom: "0.5rem" }}>
          Historical Queue Analytics
        </h1>
        <p style={{ color: "var(--text-secondary)" }}>
          View past queue lengths and wait times recorded by the simulation engine in PostgreSQL.
        </p>
      </header>

      <div className="glass-panel" style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <label htmlFor="signal-filter" className="metrics-label">Intersection:</label>
          <select 
            id="signal-filter"
            value={filterSignalId} 
            onChange={(e) => setFilterSignalId(e.target.value)}
            style={{ 
              background: 'rgba(255,255,255,0.05)', 
              color: 'var(--text-primary)', 
              border: '1px solid var(--border)', 
              padding: '0.5rem', 
              borderRadius: '6px',
              fontFamily: 'inherit'
            }}
          >
            <option value="all">All Signals</option>
            <option value="1">Signal 1 (North Lane)</option>
            <option value="2">Signal 2 (South Lane)</option>
            <option value="3">Signal 3 (East Lane)</option>
            <option value="4">Signal 4 (West Lane)</option>
          </select>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <label htmlFor="limit-filter" className="metrics-label">Records:</label>
          <select 
            id="limit-filter"
            value={limit} 
            onChange={(e) => setLimit(parseInt(e.target.value))}
            style={{ 
              background: 'rgba(255,255,255,0.05)', 
              color: 'var(--text-primary)', 
              border: '1px solid var(--border)', 
              padding: '0.5rem', 
              borderRadius: '6px',
              fontFamily: 'inherit'
            }}
          >
            <option value={50}>Last 50</option>
            <option value={100}>Last 100</option>
            <option value={500}>Last 500</option>
          </select>
        </div>
        
        <div style={{ marginLeft: 'auto' }}>
          <button className="btn btn-outline" onClick={() => {
            setLoading(true);
            api.getHistory(filterSignalId === 'all' ? undefined : parseInt(filterSignalId), limit)
              .then(data => setHistory(data))
              .finally(() => setLoading(false));
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><path d="M3 3v5h5"></path><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"></path><path d="M16 21v-5h5"></path></svg>
            Refresh Data
          </button>
        </div>
      </div>

      {!loading && history.length > 0 && <HistoryChart history={[...history].reverse()} />}

      <div className="glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading history data...</div>
        ) : history.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>No history records found for this filter. Run the simulation to generate data.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', backgroundColor: 'rgba(255,255,255,0.02)' }}>
                  <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: 500, fontSize: '0.875rem' }}>TIME</th>
                  <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: 500, fontSize: '0.875rem' }}>SIGNAL ID</th>
                  <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: 500, fontSize: '0.875rem' }}>QUEUE LENGTH</th>
                  <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: 500, fontSize: '0.875rem' }}>AVG WAIT (Wq)</th>
                  <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: 500, fontSize: '0.875rem' }}>UTILIZATION (ρ)</th>
                </tr>
              </thead>
              <tbody>
                {history.map((record) => (
                  <tr key={record.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', transition: 'background-color 0.2s', ...({ '&:hover': { backgroundColor: 'rgba(255,255,255,0.02)' } } as any) }}>
                    <td style={{ padding: '1rem', fontFamily: 'var(--font-fira-code)', fontSize: '0.875rem' }}>
                      {new Date(record.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{ 
                        background: 'rgba(59, 130, 246, 0.1)', 
                        color: 'var(--accent-secondary)', 
                        padding: '0.25rem 0.5rem', 
                        borderRadius: '4px',
                        fontSize: '0.875rem',
                        fontWeight: 500
                      }}>
                        Lane {record.signal_id}
                      </span>
                    </td>
                    <td style={{ padding: '1rem', fontFamily: 'var(--font-fira-code)' }}>{record.queue_length}</td>
                    <td style={{ padding: '1rem', fontFamily: 'var(--font-fira-code)' }}>{Number(record.avg_wait_time).toFixed(2)}s</td>
                    <td style={{ padding: '1rem', fontFamily: 'var(--font-fira-code)' }}>
                      <span style={{ color: Number(record.utilization) > 80 ? 'var(--accent-red)' : Number(record.utilization) > 50 ? 'var(--accent-yellow)' : 'var(--text-primary)' }}>
                        {Number(record.utilization).toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
