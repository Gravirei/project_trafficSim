import pool from '../config/db';

export type LogTag = 'phase' | 'ev' | 'ped' | 'mode' | 'sys';

export interface EventLogEntry {
  id: number;
  junction_id: string;
  t: number;
  tag: LogTag;
  msg: string;
  recorded_at: Date;
}

export const EventLogModel = {
  async append(
    junctionId: string,
    t: number,
    tag: LogTag,
    msg: string,
  ): Promise<EventLogEntry> {
    const result = await pool.query<EventLogEntry>(
      `INSERT INTO event_log (junction_id, t, tag, msg)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [junctionId, t, tag, msg],
    );
    return result.rows[0];
  },

  /**
   * Returns event log rows for a junction, optionally since a given
   * wall-clock timestamp (ms since epoch). Capped at 500 rows.
   */
  async getSince(
    junctionId: string,
    sinceMs: number = 0,
    limit: number = 500,
  ): Promise<EventLogEntry[]> {
    const sinceDate = new Date(sinceMs);
    const result = await pool.query<EventLogEntry>(
      `SELECT * FROM event_log
        WHERE junction_id = $1 AND recorded_at >= $2
        ORDER BY recorded_at ASC
        LIMIT $3`,
      [junctionId, sinceDate, limit],
    );
    return result.rows;
  },

  async getRecent(junctionId: string, limit: number = 70): Promise<EventLogEntry[]> {
    const result = await pool.query<EventLogEntry>(
      `SELECT * FROM event_log
        WHERE junction_id = $1
        ORDER BY recorded_at DESC
        LIMIT $2`,
      [junctionId, limit],
    );
    // Returned newest-first; the API caller will likely reverse to oldest-first
    return result.rows;
  },
};
