export interface Signal {
    id: number;
    name: string;
    current_state: 'GREEN' | 'YELLOW' | 'RED';
    green_duration: number;
    red_duration: number;
    yellow_duration: number;
    created_at: Date;
}
export declare const SignalModel: {
    getAll(): Promise<Signal[]>;
    getById(id: number): Promise<Signal | null>;
    create(name: string, greenDuration?: number, redDuration?: number, yellowDuration?: number): Promise<Signal>;
    update(id: number, data: Partial<Pick<Signal, "green_duration" | "red_duration" | "yellow_duration" | "name">>): Promise<Signal | null>;
    updateState(id: number, state: "GREEN" | "YELLOW" | "RED"): Promise<void>;
    delete(id: number): Promise<boolean>;
};
//# sourceMappingURL=signal.model.d.ts.map