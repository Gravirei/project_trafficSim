import { useEffect, useState } from 'react';
import { socketService } from '@/lib/socket';
import { TickPayload } from '@/types';

let globalData: TickPayload | null = null;
let globalHistory: TickPayload[] = [];
let globalConnected = false;

export function useSocket() {
    const [data, setData] = useState<TickPayload | null>(globalData);
    const [history, setHistory] = useState<TickPayload[]>(globalHistory);
    const [connected, setConnected] = useState(globalConnected);

    useEffect(() => {
        const socket = socketService.connect();
        setConnected(socket.connected);
        globalConnected = socket.connected;

        function onConnect() {
            setConnected(true);
            globalConnected = true;
        }

        function onDisconnect() {
            setConnected(false);
            globalConnected = false;
        }

        function onTickUpdate(payload: TickPayload) {
            globalData = payload;
            setData(payload);
            setHistory(prev => {
                const newHistory = [...prev, payload];
                if (newHistory.length > 60) newHistory.shift();
                globalHistory = newHistory;
                return newHistory;
            });
        }

        socket.on('connect', onConnect);
        socket.on('disconnect', onDisconnect);
        socket.on('tick-update', onTickUpdate);

        return () => {
            socket.off('connect', onConnect);
            socket.off('disconnect', onDisconnect);
            socket.off('tick-update', onTickUpdate);
        };
    }, []);

    return { data, history, connected };
}
