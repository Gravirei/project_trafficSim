import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { Signal } from '@/types';

export function useSignals() {
  const [signals, setSignals] = useState<Signal[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSignals = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.getSignals();
      setSignals(res.data);
    } catch (err) {
      console.error('Failed to fetch signals', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // The mount-fetch pattern is intentional; the rule is overly strict
    // for async loaders that need to set loading + data on mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchSignals();
  }, [fetchSignals]);

  const createSignal = async (data: {
    name: string;
    green_duration: number;
    red_duration: number;
    yellow_duration: number;
  }) => {
    const created = await api.createSignal(data);
    setSignals((prev) => [...prev, created]);
    return created;
  };

  const updateSignal = async (id: number, data: Partial<Omit<Signal, 'id' | 'current_state'>>) => {
    const updated = await api.updateSignal(id, data);
    setSignals((prev) => prev.map((s) => (s.id === id ? updated : s)));
    return updated;
  };

  const deleteSignal = async (id: number) => {
    await api.deleteSignal(id);
    setSignals((prev) => prev.filter((s) => s.id !== id));
  };

  return { signals, loading, createSignal, updateSignal, deleteSignal, refresh: fetchSignals };
}
