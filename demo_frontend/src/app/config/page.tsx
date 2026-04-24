"use client";

import { useState } from "react";
import { useSignals } from "@/hooks/useSignals";
import { Signal } from "@/types";

const inputStyle = {
  background: "var(--bg-card)",
  border: "1px solid var(--border)",
  color: "var(--text-primary)",
  padding: "0.75rem",
  borderRadius: "6px",
  fontFamily: "var(--font-fira-code)",
  fontSize: "1rem",
  outline: "none",
  width: "100%",
};

const durationFields = [
  { label: "GREEN DURATION (s)", field: "green_duration" as const, color: "var(--accent-green)", border: "rgba(16,185,129,0.3)" },
  { label: "YELLOW DURATION (s)", field: "yellow_duration" as const, color: "var(--accent-yellow)", border: "rgba(245,158,11,0.3)" },
  { label: "RED DURATION (s)", field: "red_duration" as const, color: "var(--accent-red)", border: "rgba(239,68,68,0.3)" },
];

type DurationField = (typeof durationFields)[number]["field"];

export default function ConfigPage() {
  const { signals, loading, updateSignal } = useSignals();
  const [savingId, setSavingId] = useState<number | null>(null);
  const [localEdits, setLocalEdits] = useState<Record<number, Partial<Signal>>>({});

  const getEdit = (signal: Signal) => ({ ...signal, ...localEdits[signal.id] });

  const handleEdit = (id: number, field: DurationField, value: string) => {
    const num = parseInt(value);
    setLocalEdits((prev) => ({
      ...prev,
      [id]: { ...prev[id], [field]: Math.max(1, Number.isNaN(num) ? 1 : num) },
    }));
  };

  const handleSave = async (signal: Signal) => {
    const edits = localEdits[signal.id];
    if (!edits) return;

    setSavingId(signal.id);
    try {
      await updateSignal(signal.id, edits);
      setLocalEdits((prev) => {
        const next = { ...prev };
        delete next[signal.id];
        return next;
      });
    } catch (err) {
      console.error("Save failed:", err);
    } finally {
      setTimeout(() => setSavingId(null), 800);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <header>
        <h1 style={{ fontSize: "1.75rem", fontWeight: 650, marginBottom: "0.35rem" }}>
          Signal Configuration
        </h1>
        <p style={{ color: "var(--text-secondary)" }}>
          Four permanent lane configurations. Edit timing values only.
        </p>
      </header>

      {loading ? (
        <div className="glass-panel" style={{ textAlign: "center", color: "var(--text-secondary)", padding: "4rem" }}>
          Loading signal configurations...
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "1.5rem" }}>
          {signals.slice(0, 4).map((signal) => {
            const editedSignal = getEdit(signal);
            const isDirty = Boolean(localEdits[signal.id]);

            return (
              <div key={signal.id} className="glass-panel" style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem" }}>
                  <h2 style={{ fontSize: "1.15rem", fontWeight: 600 }}>{signal.name}</h2>
                  <span style={{ background: "rgba(59,130,246,0.1)", color: "var(--accent-secondary)", padding: "0.25rem 0.5rem", borderRadius: "4px", fontSize: "0.875rem", fontWeight: 600 }}>
                    Lane {signal.id}
                  </span>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  {durationFields.map(({ label, field, color, border }) => (
                    <div key={field} style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                      <label style={{ fontSize: "0.875rem", color, fontWeight: 500 }}>{label}</label>
                      <input
                        type="number"
                        min={1}
                        value={editedSignal[field]}
                        onChange={(e) => handleEdit(signal.id, field, e.target.value)}
                        style={{ ...inputStyle, border: `1px solid ${border}` }}
                      />
                    </div>
                  ))}
                </div>

                <button
                  className="btn btn-primary"
                  onClick={() => handleSave(signal)}
                  disabled={!isDirty || savingId === signal.id}
                >
                  {savingId === signal.id ? "Saved" : "Save Changes"}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
