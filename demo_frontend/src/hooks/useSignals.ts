import { useState, useEffect } from 'react';
import { Signal } from '@/types';
import { demoSignals, subscribeDemoStore, updateDemoSignal } from '@/lib/demoData';

export function useSignals() {
    const [signals, setSignals] = useState<Signal[]>(demoSignals);
    const [loading, setLoading] = useState(false);

    const fetchSignals = async () => {
        setSignals([...demoSignals]);
        setLoading(false);
    };

    useEffect(() => {
        return subscribeDemoStore(() => setSignals([...demoSignals]));
    }, []);

    const updateSignal = async (id: number, data: Partial<Omit<Signal, 'id' | 'current_state'>>) => {
        const updated = updateDemoSignal(id, data);
        return updated;
    };

    return { signals, loading, updateSignal, refresh: fetchSignals };
}
