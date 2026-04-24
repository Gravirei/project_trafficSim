import { Signal, SignalTick, SimulationStatus, TickPayload } from "@/types";

type Listener = () => void;

const listeners = new Set<Listener>();

export let demoSignals: Signal[] = [
  { id: 1, name: "North Lane", current_state: "GREEN", green_duration: 28, yellow_duration: 4, red_duration: 28 },
  { id: 2, name: "South Lane", current_state: "RED", green_duration: 26, yellow_duration: 4, red_duration: 30 },
  { id: 3, name: "East Lane", current_state: "RED", green_duration: 24, yellow_duration: 4, red_duration: 32 },
  { id: 4, name: "West Lane", current_state: "GREEN", green_duration: 30, yellow_duration: 4, red_duration: 26 },
];

export let demoStatus: SimulationStatus = {
  running: true,
  currentTick: 1,
  mode: "MANUAL",
  signalCount: demoSignals.length,
  speedMultiplier: 1,
  arrivalRate: 0.65,
};

function notify() {
  listeners.forEach((listener) => listener());
}

export function subscribeDemoStore(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function updateDemoStatus(next: Partial<SimulationStatus>) {
  demoStatus = {
    ...demoStatus,
    ...next,
    mode: "MANUAL",
    signalCount: demoSignals.length,
  };
  notify();
}

export function resetDemoSimulation() {
  updateDemoStatus({ currentTick: 0, running: false });
}

export function updateDemoSignal(id: number, data: Partial<Omit<Signal, "id">>) {
  let updated = demoSignals.find((signal) => signal.id === id);
  demoSignals = demoSignals.map((signal) => {
    if (signal.id !== id) return signal;
    updated = { ...signal, ...data };
    return updated;
  });
  notify();
  return updated;
}

function signalState(signal: Signal, tick: number, index: number): Signal["current_state"] {
  const cycle = signal.green_duration + signal.yellow_duration + signal.red_duration;
  const phase = (tick + index * 17) % cycle;

  if (phase < signal.green_duration) return "GREEN";
  if (phase < signal.green_duration + signal.yellow_duration) return "YELLOW";
  return "RED";
}

export function createDemoTick(tick = demoStatus.currentTick): TickPayload {
  const rawSignals = demoSignals.map((signal, index) => {
    const state = signalState(signal, tick, index);
    const laneFactor = 0.86 + index * 0.09;
    const arrivalRate = Number((demoStatus.arrivalRate * laneFactor).toFixed(2));
    const wave = Math.abs(Math.sin((tick + index * 11) / 8));
    const pressure = state === "GREEN" ? 3 + wave * 8 : state === "YELLOW" ? 8 + wave * 10 : 13 + wave * 14;
    const queueLength = Math.max(0, Math.round(pressure));
    const utilization = Math.min(135, Math.round((arrivalRate / 0.9) * 72 + queueLength * 2.1));
    const theoreticalLq = Number(Math.max(0, queueLength * 0.74 + wave * 2).toFixed(2));
    const avgWaitTime = Number(Math.max(0.8, queueLength * 1.35 + wave * 3).toFixed(2));

    return {
      signalId: signal.id,
      name: signal.name,
      state,
      timeRemaining: Math.max(1, signal.green_duration - (tick % Math.max(1, signal.green_duration))),
      queueLength,
      theoreticalLq,
      avgWaitTime,
      utilization,
      arrivalRate,
    } satisfies SignalTick;
  });

  return {
    tick,
    signals: rawSignals,
    mode: "MANUAL",
  };
}
