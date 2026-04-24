import {
    demoSignals,
    updateDemoSignal,
} from './demoData';
import { Signal } from '@/types';

const delay = <T,>(value: T) => new Promise<T>((resolve) => setTimeout(() => resolve(value), 120));

export const api = {
    // Signals
    getSignals: () => delay([...demoSignals]),
    updateSignal: (id: number, data: Partial<Omit<Signal, 'id'>>) => delay(updateDemoSignal(id, data)),
};
