"use client";

import { useMemo, useState } from "react";
import { QueueHistory } from "@/types";

const historyRows: QueueHistory[] = [
  { id: 1, signal_id: 1, timestamp: "2026-04-24T08:00:00.000Z", queue_length: 8, avg_wait_time: 11.4, utilization: 48, arrival_rate: 0.56 },
  { id: 2, signal_id: 2, timestamp: "2026-04-24T08:05:00.000Z", queue_length: 13, avg_wait_time: 18.7, utilization: 66, arrival_rate: 0.62 },
  { id: 3, signal_id: 3, timestamp: "2026-04-24T08:10:00.000Z", queue_length: 6, avg_wait_time: 9.3, utilization: 42, arrival_rate: 0.51 },
  { id: 4, signal_id: 4, timestamp: "2026-04-24T08:15:00.000Z", queue_length: 17, avg_wait_time: 24.2, utilization: 79, arrival_rate: 0.71 },
  { id: 5, signal_id: 1, timestamp: "2026-04-24T08:20:00.000Z", queue_length: 11, avg_wait_time: 15.6, utilization: 58, arrival_rate: 0.61 },
  { id: 6, signal_id: 2, timestamp: "2026-04-24T08:25:00.000Z", queue_length: 19, avg_wait_time: 27.8, utilization: 84, arrival_rate: 0.77 },
  { id: 7, signal_id: 3, timestamp: "2026-04-24T08:30:00.000Z", queue_length: 10, avg_wait_time: 14.9, utilization: 55, arrival_rate: 0.58 },
  { id: 8, signal_id: 4, timestamp: "2026-04-24T08:35:00.000Z", queue_length: 7, avg_wait_time: 10.8, utilization: 44, arrival_rate: 0.52 },
  { id: 9, signal_id: 1, timestamp: "2026-04-24T08:40:00.000Z", queue_length: 15, avg_wait_time: 21.1, utilization: 73, arrival_rate: 0.69 },
  { id: 10, signal_id: 2, timestamp: "2026-04-24T08:45:00.000Z", queue_length: 9, avg_wait_time: 12.6, utilization: 50, arrival_rate: 0.55 },
  { id: 11, signal_id: 3, timestamp: "2026-04-24T08:50:00.000Z", queue_length: 21, avg_wait_time: 31.5, utilization: 88, arrival_rate: 0.81 },
  { id: 12, signal_id: 4, timestamp: "2026-04-24T08:55:00.000Z", queue_length: 12, avg_wait_time: 17.2, utilization: 63, arrival_rate: 0.64 },
];

const laneNames: Record<number, string> = {
  1: "North Lane",
  2: "South Lane",
  3: "East Lane",
  4: "West Lane",
};

export default function HistoryPage() {
  const [filterSignalId, setFilterSignalId] = useState("all");

  const filteredHistory = useMemo(() => {
    if (filterSignalId === "all") return historyRows;
    return historyRows.filter((row) => row.signal_id === Number(filterSignalId));
  }, [filterSignalId]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <header>
        <h1 style={{ fontSize: "1.75rem", fontWeight: 650, marginBottom: "0.35rem" }}>
          Queue History
        </h1>
        <p style={{ color: "var(--text-secondary)" }}>
          Fixed sample records for queue length, wait time, and utilization.
        </p>
      </header>

      <div className="glass-panel" style={{ display: "flex", gap: "1rem", alignItems: "center", flexWrap: "wrap" }}>
        <label htmlFor="signal-filter" className="metrics-label">Intersection</label>
        <select
          id="signal-filter"
          value={filterSignalId}
          onChange={(e) => setFilterSignalId(e.target.value)}
          style={{
            background: "var(--bg-card)",
            color: "var(--text-primary)",
            border: "1px solid var(--border)",
            padding: "0.5rem",
            borderRadius: "6px",
            fontFamily: "inherit",
          }}
        >
          <option value="all">All Signals</option>
          <option value="1">North Lane</option>
          <option value="2">South Lane</option>
          <option value="3">East Lane</option>
          <option value="4">West Lane</option>
        </select>
      </div>

      <div className="glass-panel" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)", backgroundColor: "rgba(15, 23, 42, 0.03)" }}>
                <th style={{ padding: "1rem", color: "var(--text-secondary)", fontWeight: 500, fontSize: "0.875rem" }}>TIME</th>
                <th style={{ padding: "1rem", color: "var(--text-secondary)", fontWeight: 500, fontSize: "0.875rem" }}>SIGNAL</th>
                <th style={{ padding: "1rem", color: "var(--text-secondary)", fontWeight: 500, fontSize: "0.875rem" }}>QUEUE LENGTH</th>
                <th style={{ padding: "1rem", color: "var(--text-secondary)", fontWeight: 500, fontSize: "0.875rem" }}>AVG WAIT</th>
                <th style={{ padding: "1rem", color: "var(--text-secondary)", fontWeight: 500, fontSize: "0.875rem" }}>UTILIZATION</th>
                <th style={{ padding: "1rem", color: "var(--text-secondary)", fontWeight: 500, fontSize: "0.875rem" }}>ARRIVAL RATE</th>
              </tr>
            </thead>
            <tbody>
              {filteredHistory.map((record) => (
                <tr key={record.id} style={{ borderBottom: "1px solid var(--border)" }}>
                  <td style={{ padding: "1rem", fontFamily: "var(--font-fira-code)", fontSize: "0.875rem" }}>
                    {new Date(record.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </td>
                  <td style={{ padding: "1rem" }}>{laneNames[record.signal_id]}</td>
                  <td style={{ padding: "1rem", fontFamily: "var(--font-fira-code)" }}>{record.queue_length}</td>
                  <td style={{ padding: "1rem", fontFamily: "var(--font-fira-code)" }}>{record.avg_wait_time.toFixed(1)}s</td>
                  <td style={{ padding: "1rem", fontFamily: "var(--font-fira-code)" }}>
                    <span style={{ color: record.utilization > 80 ? "var(--accent-red)" : record.utilization > 65 ? "var(--accent-yellow)" : "var(--text-primary)" }}>
                      {record.utilization.toFixed(1)}%
                    </span>
                  </td>
                  <td style={{ padding: "1rem", fontFamily: "var(--font-fira-code)" }}>{record.arrival_rate.toFixed(2)} /s</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
