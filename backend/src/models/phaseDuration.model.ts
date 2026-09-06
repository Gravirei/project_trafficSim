import pool from '../config/db';

export interface PhaseDurations {
  junction_id: string;
  thru: number;
  left: number;
  yellow: number;
  allred: number;
  truck_share: number;
  updated_at: Date;
}

export type DurationKey = 'thru' | 'left' | 'yellow' | 'allred' | 'truck_share';

/** Maps the JS-friendly key to the actual SQL column name. */
const COL: Record<DurationKey, string> = {
  thru: 'thru',
  left: 'left_phase', // `left` is a reserved word in PostgreSQL
  yellow: 'yellow',
  allred: 'allred',
  truck_share: 'truck_share',
};

export const PhaseDurationModel = {
  async getByJunctionId(junctionId: string): Promise<PhaseDurations | null> {
    const result = await pool.query<PhaseDurations>(
      'SELECT junction_id, thru, left_phase AS "left", yellow, allred, truck_share, updated_at FROM phase_durations WHERE junction_id = $1',
      [junctionId],
    );
    return result.rows[0] || null;
  },

  async getAll(): Promise<PhaseDurations[]> {
    const result = await pool.query<PhaseDurations>(
      'SELECT junction_id, thru, left_phase AS "left", yellow, allred, truck_share, updated_at FROM phase_durations ORDER BY junction_id',
    );
    return result.rows;
  },

  /**
   * Patch a subset of the timing plan. Pass an object with any of
   * {thru, left, yellow, allred, truck_share}. Unknown keys are ignored.
   */
  async update(
    junctionId: string,
    patch: Partial<Pick<PhaseDurations, DurationKey>>,
  ): Promise<PhaseDurations | null> {
    const fields: string[] = [];
    const values: Array<string | number> = [];
    let i = 1;
    for (const key of ['thru', 'left', 'yellow', 'allred', 'truck_share'] as const) {
      if (patch[key] !== undefined) {
        fields.push(`${COL[key]} = $${i++}`);
        values.push(patch[key] as number);
      }
    }
    if (fields.length === 0) return this.getByJunctionId(junctionId);
    fields.push('updated_at = NOW()');
    values.push(junctionId);
    const result = await pool.query<PhaseDurations>(
      `UPDATE phase_durations SET ${fields.join(', ')}
        WHERE junction_id = $${i}
        RETURNING junction_id, thru, left_phase AS "left", yellow, allred, truck_share, updated_at`,
      values,
    );
    return result.rows[0] || null;
  },
};
