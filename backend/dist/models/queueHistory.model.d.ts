export interface QueueHistory {
    id: number;
    signal_id: number;
    timestamp: Date;
    queue_length: number;
    avg_wait_time: number;
    utilization: number;
    arrival_rate: number;
}
export declare const QueueHistoryModel: {
    insert(signalId: number, queueLength: number, avgWaitTime: number, utilization: number, arrivalRate: number): Promise<QueueHistory>;
    getBySignalId(signalId: number, limit?: number): Promise<QueueHistory[]>;
    getAll(limit?: number): Promise<QueueHistory[]>;
    clear(): Promise<void>;
    getAggregatedSummary(): Promise<any>;
};
//# sourceMappingURL=queueHistory.model.d.ts.map