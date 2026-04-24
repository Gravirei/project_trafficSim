export interface VehicleLog {
    id: number;
    signal_id: number;
    arrived_at: Date;
    served_at: Date | null;
    wait_seconds: number | null;
}
export declare const VehicleLogModel: {
    logArrival(signalId: number): Promise<VehicleLog>;
    logServed(vehicleId: number): Promise<void>;
    getQueuedVehicles(signalId: number): Promise<VehicleLog[]>;
    clear(): Promise<void>;
};
//# sourceMappingURL=vehicleLog.model.d.ts.map