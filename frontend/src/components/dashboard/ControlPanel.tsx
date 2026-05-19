import { SimulationStatus } from "@/types";
import { useAuth } from "@/context/AuthContext";

interface ControlPanelProps {
  status: SimulationStatus | null;
  onStart: () => void;
  onStop: () => void;
  onReset: () => void;
  onSetMode: (mode: 'MANUAL' | 'ADAPTIVE') => void;
  onSetSpeed: (speed: number) => void;
  onSetArrivalRate: (rate: number) => void;
  onSetAdaptiveThreshold: (threshold: number) => void;
}

export default function ControlPanel({ status, onStart, onStop, onReset, onSetMode, onSetSpeed, onSetArrivalRate, onSetAdaptiveThreshold }: ControlPanelProps) {
  const { isAdmin } = useAuth();
  const isRunning = status?.running;
  const isAdaptive = status?.mode === 'ADAPTIVE';
  const speed = status?.speedMultiplier || 1;
  const arrivalRate = status?.arrivalRate || 0.5;
  const adaptiveThreshold = status?.adaptiveThreshold || 10;

  return (
    <div className="glass-panel" style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "1rem" }}>
      <div style={{ display: "flex", gap: "0.5rem" }}>
        {isRunning ? (
          <button className="btn interactive" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--accent-red)', border: '1px solid var(--accent-red)', opacity: !isAdmin ? 0.5 : 1, cursor: !isAdmin ? 'not-allowed' : 'pointer' }} onClick={onStop} disabled={!isAdmin}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>
            Pause Engine
          </button>
        ) : (
          <button className="btn btn-primary" onClick={onStart} disabled={!isAdmin} style={{ opacity: !isAdmin ? 0.5 : 1, cursor: !isAdmin ? 'not-allowed' : 'pointer' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
            Start Engine
          </button>
        )}
        <button className="btn btn-outline" onClick={onReset} disabled={!isAdmin} style={{ opacity: !isAdmin ? 0.5 : 1, cursor: !isAdmin ? 'not-allowed' : 'pointer' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><path d="M3 3v5h5"></path></svg>
          Reset Simulation
        </button>
      </div>

      <div style={{ display: "flex", gap: "2rem", alignItems: "center", flexWrap: "wrap" }}>
        {/* Sliders */}
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
              disabled={!isAdmin}
              style={{ accentColor: "var(--accent-blue)", cursor: !isAdmin ? "not-allowed" : "pointer", opacity: !isAdmin ? 0.5 : 1 }}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem", minWidth: "150px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.875rem" }}>
              <span className="metrics-label" style={{ color: isAdaptive ? "var(--cta)" : "inherit" }}>AI Threshold</span>
              <span className="metrics-value">{adaptiveThreshold} veh</span>
            </div>
            <input 
              type="range" 
              min="1" 
              max="50" 
              step="1"
              value={adaptiveThreshold}
              onChange={(e) => onSetAdaptiveThreshold(parseInt(e.target.value))}
              disabled={!isAdmin || !isAdaptive}
              style={{ accentColor: "var(--cta)", cursor: (!isAdmin || !isAdaptive) ? "not-allowed" : "pointer", opacity: (!isAdmin || !isAdaptive) ? 0.5 : 1 }}
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
                    opacity: !isAdmin ? 0.5 : 1,
                    cursor: !isAdmin ? "not-allowed" : "pointer"
                  }}
                  disabled={!isAdmin}
                >
                  {s}x
                </button>
              ))}
            </div>
          </div>
        </div>

        <div style={{ width: "1px", height: "30px", background: "var(--border)" }}></div>

        {/* Mode Toggles */}
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", background: "rgba(0,0,0,0.3)", padding: "0.25rem", borderRadius: "8px" }}>
          <button 
            onClick={() => onSetMode('MANUAL')}
            className="btn interactive"
            disabled={!isAdmin}
            style={{ 
              backgroundColor: !isAdaptive ? "rgba(255,255,255,0.1)" : "transparent",
              color: !isAdaptive ? "var(--text-primary)" : "var(--text-secondary)",
              border: 'none',
              opacity: !isAdmin ? 0.5 : 1,
              cursor: !isAdmin ? "not-allowed" : "pointer"
            }}>
            Manual
          </button>
          <button 
            onClick={() => onSetMode('ADAPTIVE')}
            className="btn interactive"
            disabled={!isAdmin}
            style={{ 
              backgroundColor: isAdaptive ? "rgba(245, 158, 11, 0.2)" : "transparent",
              color: isAdaptive ? "var(--cta)" : "var(--text-secondary)",
              border: 'none',
              boxShadow: isAdaptive ? '0 0 10px rgba(245, 158, 11, 0.2)' : 'none',
              opacity: !isAdmin ? 0.5 : 1,
              cursor: !isAdmin ? "not-allowed" : "pointer"
            }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: '4px'}}><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path></svg>
            Adaptive AI
          </button>
        </div>
      </div>
    </div>
  );
}
