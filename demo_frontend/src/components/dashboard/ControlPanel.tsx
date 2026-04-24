import { SimulationStatus } from "@/types";

interface ControlPanelProps {
  status: SimulationStatus | null;
  onStart: () => void;
  onStop: () => void;
  onReset: () => void;
  onSetSpeed: (speed: number) => void;
  onSetArrivalRate: (lambda: number) => void;
}

export default function ControlPanel({ status, onStart, onStop, onReset, onSetSpeed, onSetArrivalRate }: ControlPanelProps) {
  const isRunning = status?.running;
  const speed = status?.speedMultiplier || 1;
  const arrivalRate = status?.arrivalRate || 0.5;

  return (
    <div className="glass-panel" style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "1rem" }}>
      <div style={{ display: "flex", gap: "0.5rem" }}>
        {isRunning ? (
          <button className="btn interactive" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--accent-red)', border: '1px solid var(--accent-red)' }} onClick={onStop}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>
            Pause
          </button>
        ) : (
          <button className="btn btn-primary" onClick={onStart}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
            Start
          </button>
        )}
        <button className="btn btn-outline" onClick={onReset}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><path d="M3 3v5h5"></path></svg>
          Reset
        </button>
      </div>

      <div style={{ display: "flex", gap: "2rem", alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem", minWidth: "150px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.875rem" }}>
              <span className="metrics-label">Arrival Rate (λ)</span>
              <span className="metrics-value">{arrivalRate.toFixed(2)} /s</span>
            </div>
            <input 
              type="range" 
              min="0.1" 
              max="1.5" 
              step="0.05"
              value={arrivalRate}
              onChange={(e) => onSetArrivalRate(parseFloat(e.target.value))}
              style={{ accentColor: "var(--accent-blue)" }}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
            <span className="metrics-label">Sim Speed</span>
            <div style={{ display: "flex", gap: "0.25rem", background: "rgba(0,0,0,0.3)", padding: "0.25rem", borderRadius: "8px" }}>
              {[1, 5, 10].map(s => (
                <button
                  key={s}
                  onClick={() => onSetSpeed(s)}
                  className="btn interactive"
                  style={{
                    backgroundColor: speed === s ? "rgba(255,255,255,0.1)" : "transparent",
                    color: speed === s ? "var(--text-primary)" : "var(--text-secondary)",
                    border: "none",
                    fontFamily: "var(--font-fira-code)",
                    fontWeight: speed === s ? 600 : 400,
                    cursor: "pointer"
                  }}
                >
                  {s}x
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
