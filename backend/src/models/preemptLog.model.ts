import pool from '../config/db';

export interface PreemptLogEntry {
  id: number;
  junction_id: string;
  leg: number;
  t: number;
  ev_id: number | null;
  recorded_at: Date;
}

export const PreemptLogModel = {
  async append(
    junctionId: string,
    leg: number,
    t: number,
    evId: number | null = null,
  ): Promise<PreemptLogEntry> {
    const result = await pool.query<PreemptLogEntry>(
      `INSERT INTO preempt_log (junction_id, leg, t, ev_id)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [junctionId, leg, t, evId],
    );
    return result.rows[0];
  },

  async getSince(
    junctionId: string,
    sinceMs: number = 0,
    limit: number = 200,
  ): Promise<PreemptLogEntry[]> {
    const sinceDate = new Date(sinceMs);
    const result = await pool.query<PreemptLogEntry>(
      `SELECT * FROM preempt_log
        WHERE junction_id = $1 AND recorded_at >= $2
        ORDER BY recorded_at ASC
        LIMIT $3`,
      [junctionId, sinceDate, limit],
    );
    return result.rows;
  },
};
