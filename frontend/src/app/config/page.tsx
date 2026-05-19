"use client";

import { useState } from 'react';
import { useSignals } from '@/hooks/useSignals';
import { Signal } from '@/types';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

const inputStyle = {
  background: "rgba(0,0,0,0.2)",
  border: "1px solid var(--border)",
  color: "var(--text-primary)",
  padding: "0.75rem",
  borderRadius: "6px",
  fontFamily: "var(--font-fira-code)",
  fontSize: "1rem",
  outline: "none",
  width: "100%",
};

export default function ConfigPage() {
  const { signals, loading, createSignal, updateSignal, deleteSignal } = useSignals();
  const [savingId, setSavingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [localEdits, setLocalEdits] = useState<Record<number, Partial<Signal>>>({});
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newSignal, setNewSignal] = useState({ name: '', green_duration: 30, red_duration: 30, yellow_duration: 5 });
  const [creating, setCreating] = useState(false);

  const getEdit = (signal: Signal) => ({ ...signal, ...localEdits[signal.id] });

  const handleEdit = (id: number, field: keyof Signal, value: string) => {
    const num = parseInt(value);
    setLocalEdits(prev => ({
      ...prev,
      [id]: { ...prev[id], [field]: isNaN(num) || field === 'name' ? value : Math.max(1, num) },
    }));
  };

  const handleSave = async (signal: Signal) => {
    const edits = localEdits[signal.id];
    if (!edits) return;
    setSavingId(signal.id);
    try {
      await updateSignal(signal.id, edits);
      setLocalEdits(prev => { const n = { ...prev }; delete n[signal.id]; return n; });
    } catch (err) {
      console.error('Save failed:', err);
    } finally {
      setTimeout(() => setSavingId(null), 800);
    }
  };

  const handleDelete = async (id: number) => {
    setDeletingId(id);
    try {
      await deleteSignal(id);
    } catch (err) {
      console.error('Delete failed:', err);
      setDeletingId(null);
    }
  };

  const handleCreate = async () => {
    if (!newSignal.name.trim()) return;
    setCreating(true);
    try {
      await createSignal(newSignal);
      setNewSignal({ name: '', green_duration: 30, red_duration: 30, yellow_duration: 5 });
      setShowCreateForm(false);
    } catch (err) {
      console.error('Create failed:', err);
    } finally {
      setCreating(false);
    }
  };

  return (
    <ProtectedRoute requiredRole="ADMIN">
      <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h1 style={{ fontSize: "2rem", fontWeight: 600, letterSpacing: "-0.02em", marginBottom: "0.5rem" }}>
            System Configuration
          </h1>
          <p style={{ color: "var(--text-secondary)" }}>
            Configure phase durations for all traffic signals.
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreateForm(v => !v)}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          New Signal
        </button>
      </header>

      {/* Create form */}
      {showCreateForm && (
        <div className="glass-panel" style={{ borderColor: "var(--accent-secondary)", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <h3 style={{ fontSize: "1.1rem", fontWeight: 600, color: "var(--accent-secondary)" }}>New Signal</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <label style={{ fontSize: "0.875rem", color: "var(--text-secondary)", fontWeight: 500 }}>Name</label>
              <input type="text" value={newSignal.name} onChange={e => setNewSignal(p => ({ ...p, name: e.target.value }))} placeholder="e.g. East Lane" style={inputStyle} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <label style={{ fontSize: "0.875rem", color: "var(--accent-green)", fontWeight: 500 }}>GREEN (s)</label>
              <input type="number" value={newSignal.green_duration} onChange={e => setNewSignal(p => ({ ...p, green_duration: Math.max(1, parseInt(e.target.value) || 1) }))} style={{ ...inputStyle, border: "1px solid rgba(16,185,129,0.3)" }} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <label style={{ fontSize: "0.875rem", color: "var(--accent-yellow)", fontWeight: 500 }}>YELLOW (s)</label>
              <input type="number" value={newSignal.yellow_duration} onChange={e => setNewSignal(p => ({ ...p, yellow_duration: Math.max(1, parseInt(e.target.value) || 1) }))} style={{ ...inputStyle, border: "1px solid rgba(245,158,11,0.3)" }} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <label style={{ fontSize: "0.875rem", color: "var(--accent-red)", fontWeight: 500 }}>RED (s)</label>
              <input type="number" value={newSignal.red_duration} onChange={e => setNewSignal(p => ({ ...p, red_duration: Math.max(1, parseInt(e.target.value) || 1) }))} style={{ ...inputStyle, border: "1px solid rgba(239,68,68,0.3)" }} />
            </div>
          </div>
          <div style={{ display: "flex", gap: "0.75rem" }}>
            <button className="btn btn-primary" onClick={handleCreate} disabled={creating || !newSignal.name.trim()}>
              {creating ? 'Creating...' : 'Create Signal'}
            </button>
            <button className="btn btn-outline" onClick={() => setShowCreateForm(false)}>Cancel</button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="glass-panel" style={{ textAlign: "center", color: "var(--text-secondary)", padding: "4rem" }}>
          Loading signal configurations...
        </div>
      ) : signals.length === 0 ? (
        <div className="glass-panel" style={{ textAlign: "center", color: "var(--text-secondary)", padding: "4rem" }}>
          No signals configured. Click "New Signal" to add one.
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "1.5rem" }}>
          {signals.map(signal => {
            const s = getEdit(signal);
            const isDirty = !!localEdits[signal.id];
            return (
              <div key={signal.id} className="glass-panel" style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <input
                    type="text"
                    value={s.name}
                    onChange={e => handleEdit(signal.id, 'name', e.target.value)}
                    style={{ ...inputStyle, fontSize: "1.1rem", fontFamily: "var(--font-fira-sans)", fontWeight: 500, border: "1px solid transparent", background: "transparent", padding: "0.25rem 0.5rem", width: "auto", flex: 1 }}
                  />
                  <span style={{ background: 'rgba(59,130,246,0.1)', color: 'var(--accent-secondary)', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.875rem', fontWeight: 600, marginLeft: '0.5rem' }}>
                    ID: {signal.id}
                  </span>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  {[
                    { label: "GREEN DURATION (s)", field: "green_duration" as keyof Signal, color: "var(--accent-green)", border: "rgba(16,185,129,0.3)" },
                    { label: "YELLOW DURATION (s)", field: "yellow_duration" as keyof Signal, color: "var(--accent-yellow)", border: "rgba(245,158,11,0.3)" },
                    { label: "RED DURATION (s)", field: "red_duration" as keyof Signal, color: "var(--accent-red)", border: "rgba(239,68,68,0.3)" },
                  ].map(({ label, field, color, border }) => (
                    <div key={field} style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                      <label style={{ fontSize: "0.875rem", color, fontWeight: 500, letterSpacing: "0.05em" }}>{label}</label>
                      <input
                        type="number"
                        value={s[field] as number}
                        onChange={e => handleEdit(signal.id, field, e.target.value)}
                        style={{ ...inputStyle, border: `1px solid ${border}` }}
                      />
                    </div>
                  ))}
                </div>

                <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}>
                  <button
                    className="btn btn-primary"
                    onClick={() => handleSave(signal)}
                    disabled={!isDirty || savingId === signal.id}
                    style={{ flex: 1 }}
                  >
                    {savingId === signal.id ? 'Saved ✓' : 'Save Changes'}
                  </button>
                  <button
                    className="btn btn-outline"
                    onClick={() => handleDelete(signal.id)}
                    disabled={deletingId === signal.id}
                    style={{ color: 'var(--accent-red)', borderColor: 'rgba(239,68,68,0.3)' }}
                  >
                    {deletingId === signal.id ? '...' : 'Delete'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
      </div>
    </ProtectedRoute>
  );
}
