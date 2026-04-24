import { useEffect, useState } from 'react';
import { TickPayload } from '@/types';
import { createDemoTick, demoStatus, subscribeDemoStore, updateDemoStatus } from '@/lib/demoData';

let globalData: TickPayload | null = createDemoTick();
let globalHistory: TickPayload[] = [globalData];

export function useSocket() {
    const [data, setData] = useState<TickPayload | null>(globalData);
    const [history, setHistory] = useState<TickPayload[]>(globalHistory);
    const [storeVersion, setStoreVersion] = useState(0);

    useEffect(() => {
        function updateView() {
            const payload = createDemoTick();
            globalData = payload;
            setData(payload);
            setStoreVersion((version) => version + 1);
            setHistory(prev => {
                if (payload.tick === 0) {
                    globalHistory = [payload];
                    return [payload];
                }
                const newHistory = [...prev, payload];
                if (newHistory.length > 60) newHistory.shift();
                globalHistory = newHistory;
                return newHistory;
            });
        }

        updateView();
        return subscribeDemoStore(updateView);
    }, []);

    useEffect(() => {
        const delay = Math.max(120, 1000 / Math.max(1, demoStatus.speedMultiplier));
        const id = window.setInterval(() => {
            if (!demoStatus.running) return;
            updateDemoStatus({ currentTick: demoStatus.currentTick + 1 });
        }, delay);

        return () => window.clearInterval(id);
    }, [storeVersion]);

    return { data, history, connected: true };
}
