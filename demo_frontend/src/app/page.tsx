"use client";

import { useSocket } from "@/hooks/useSocket";
import { useSimulation } from "@/hooks/useSimulation";
import SignalLight from "@/components/dashboard/SignalLight";
import QueueBar from "@/components/dashboard/QueueBar";
import LiveMetrics from "@/components/dashboard/LiveMetrics";
import ControlPanel from "@/components/dashboard/ControlPanel";
import IntersectionVisualizer from "@/components/dashboard/IntersectionVisualizer";

export default function Dashboard() {
  const { data, connected } = useSocket();
  const { status, start, stop, reset, setSpeed, setArrivalRate } = useSimulation();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 650, marginBottom: "0.35rem" }}>
            Traffic Dashboard
          </h1>
          <p style={{ color: "var(--text-secondary)" }}>
            Source: <span style={{ color: connected ? "var(--accent-green)" : "var(--accent-red)" }}>
              {connected ? "local demo data" : "offline"}
            </span>
          </p>
        </div>
        {data && (
          <div className="glass-panel" style={{ padding: "0.5rem 1rem", display: "flex", alignItems: "center", gap: "1rem" }}>
            <span className="metrics-label">System Mode</span>
            <span style={{ color: "var(--accent-secondary)", fontWeight: 600 }}>MANUAL</span>
            <div style={{ width: "1px", height: "20px", background: "var(--border)" }}></div>
            <span className="metrics-label">Tick</span>
            <span className="metrics-value">{data.tick}</span>
          </div>
        )}
      </header>

      <ControlPanel 
        status={status}
        onStart={start}
        onStop={stop}
        onReset={reset}
        onSetSpeed={setSpeed}
        onSetArrivalRate={setArrivalRate}
      />

      {data?.signals?.some(sig => sig.utilization >= 100) && (
        <div className="glass-panel" style={{
          borderColor: "var(--accent-red)",
          background: "rgba(239, 68, 68, 0.05)",
          display: "flex",
          alignItems: "center",
          gap: "1rem",
          padding: "1rem 1.5rem",
        }}>
          <span style={{ fontSize: "1.25rem" }}>⚠</span>
          <div>
            <strong style={{ color: "var(--accent-red)" }}>Unstable System — ρ ≥ 1 detected.</strong>
            <span style={{ color: "var(--text-secondary)", marginLeft: "0.5rem" }}>
              Arrival rate exceeds service capacity. Queue will grow indefinitely. Lower λ or raise μ.
            </span>
          </div>
        </div>
      )}

      <IntersectionVisualizer signals={data?.signals} />

      {data?.signals && data.signals.length > 0 ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1.5rem" }}>
          {data.signals.map(sig => (
            <div key={sig.signalId} className="glass-panel" style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h3 style={{ fontSize: "1.25rem", fontWeight: 500 }}>{sig.name}</h3>
                <SignalLight state={sig.state} timeRemaining={sig.timeRemaining} />
              </div>
              
              <QueueBar length={sig.queueLength} />
              <LiveMetrics
                lambda={sig.arrivalRate}
                rho={sig.utilization}
                lq={sig.theoreticalLq}
                wq={sig.avgWaitTime}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="glass-panel" style={{ textAlign: "center", padding: "4rem", color: "var(--text-secondary)" }}>
          Waiting for demo data...
        </div>
      )}

    </div>
  );
}
