import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { SimulationStatus } from '@/types';

export function useSimulation() {
    const [status, setStatus] = useState<SimulationStatus | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchStatus = useCallback(async () => {
        try {
            const data = await api.getSimStatus();
            setStatus(data);
        } catch (err) {
            console.error('Failed to fetch simulation status', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchStatus();
    }, [fetchStatus]);

    const start = async () => {
        const res = await api.startSimulation();
        setStatus(res.status);
    };

    const stop = async () => {
        const res = await api.stopSimulation();
        setStatus(res.status);
    };

    const reset = async () => {
        const res = await api.resetSimulation();
        setStatus(res.status);
    };

    const setMode = async (mode: 'MANUAL' | 'ADAPTIVE') => {
        const res = await api.setMode(mode);
        setStatus(res.status);
    };

    const setSpeed = async (multiplier: number) => {
        const res = await api.setSpeed(multiplier);
        setStatus(res.status);
    };

    const setArrivalRate = async (lambda: number) => {
        await api.setArrivalRate(lambda);
        setStatus(prev => prev ? { ...prev, arrivalRate: lambda } : prev);
    };

    const setAdaptiveThreshold = async (threshold: number) => {
        const res = await api.setAdaptiveThreshold(threshold);
        setStatus(res.status);
    };

    return {
        status,
        loading,
        start,
        stop,
        reset,
        setMode,
        setSpeed,
        setArrivalRate,
        setAdaptiveThreshold,
        refreshStatus: fetchStatus
    };
}
