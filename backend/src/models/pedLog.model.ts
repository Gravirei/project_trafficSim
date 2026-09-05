import pool from '../config/db';

export interface PedLogEntry {
  id: number;
  junction_id: string;
  side: number;
  t: number;
  recorded_at: Date;
}

export const PedLogModel = {
  async append(
    junctionId: string,
    side: number,
    t: number,
  ): Promise<PedLogEntry> {
    const result = await pool.query<PedLogEntry>(
      `INSERT INTO ped_log (junction_id, side, t)
       VALUES ($1, $2, $3) RETURNING *`,
      [junctionId, side, t],
    );
    return result.rows[0];
  },

  async getSince(
    junctionId: string,
    sinceMs: number = 0,
    limit: number = 200,
  ): Promise<PedLogEntry[]> {
    const sinceDate = new Date(sinceMs);
    const result = await pool.query<PedLogEntry>(
      `SELECT * FROM ped_log
        WHERE junction_id = $1 AND recorded_at >= $2
        ORDER BY recorded_at ASC
        LIMIT $3`,
      [junctionId, sinceDate, limit],
    );
    return result.rows;
  },
};
