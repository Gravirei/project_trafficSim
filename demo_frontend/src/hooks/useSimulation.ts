import { useState, useEffect } from 'react';
import { SimulationStatus } from '@/types';
import { demoStatus, resetDemoSimulation, subscribeDemoStore, updateDemoStatus } from '@/lib/demoData';

export function useSimulation() {
    const [status, setStatus] = useState<SimulationStatus | null>(demoStatus);
    const [loading, setLoading] = useState(false);

    const fetchStatus = async () => {
        setStatus(demoStatus);
        setLoading(false);
    };

    useEffect(() => {
        return subscribeDemoStore(() => setStatus({ ...demoStatus }));
    }, []);

    const start = async () => {
        updateDemoStatus({ running: true });
    };

    const stop = async () => {
        updateDemoStatus({ running: false });
    };

    const reset = async () => {
        resetDemoSimulation();
    };

    const setSpeed = async (multiplier: number) => {
        updateDemoStatus({ speedMultiplier: multiplier });
    };

    const setArrivalRate = async (lambda: number) => {
        updateDemoStatus({ arrivalRate: lambda });
    };

    return {
        status,
        loading,
        start,
        stop,
        reset,
        setSpeed,
        setArrivalRate,
        refreshStatus: fetchStatus
    };
}
