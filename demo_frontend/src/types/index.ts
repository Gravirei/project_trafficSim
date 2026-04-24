export interface Signal {
    id: number;
    name: string;
    current_state: 'GREEN' | 'YELLOW' | 'RED';
    green_duration: number;
    red_duration: number;
    yellow_duration: number;
}

export interface TickPayload {
    tick: number;
    signals: SignalTick[];
    mode: 'MANUAL';
}

export interface SignalTick {
    signalId: number;
    name: string;
    state: 'GREEN' | 'YELLOW' | 'RED';
    timeRemaining: number;
    queueLength: number;
    theoreticalLq: number;
    avgWaitTime: number;
    utilization: number;
    arrivalRate: number;
}

export interface SimulationStatus {
    running: boolean;
    currentTick: number;
    mode: 'MANUAL';
    signalCount: number;
    speedMultiplier: number;
    arrivalRate: number;
}

export interface QueueHistory {
    id: number;
    signal_id: number;
    timestamp: string;
    queue_length: number;
    avg_wait_time: number;
    utilization: number;
    arrival_rate: number;
}
