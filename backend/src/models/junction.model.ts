import pool from '../config/db';

/**
 * JunctionDef — the per-site geometry + phase description.
 * Mirrors frontend/src/lib/sim/types.ts: JunctionDef.
 * The JSONB columns are stored verbatim; the runtime contract is
 * validated against the frontend shape in the audit engine (Phase 3).
 */
export interface JunctionPhase {
  name: string;
  short: string;
  dur: 'thru' | 'left';
  moves: [number, 'L' | 'T' | 'R' | '*'][];
}

export interface JunctionDef {
  id: string;
  code: string;
  name: string;
  shape: 'cross' | 'round' | 'y' | 't' | 'penta';
  legs: number;
  leg_angles: number[];
  leg_names: string[];
  leg_full: string[];
  map_pos: { x: number; y: number };
  geometry: Record<string, number | boolean>;
  phases: JunctionPhase[];
  move_w: Record<'L' | 'T' | 'R' | '*', number>;
  created_at: Date;
}

/** Raw row as returned by Postgres (JSONB columns come back as objects/arrays). */
interface JunctionDefRow {
  id: string;
  code: string;
  name: string;
  shape: JunctionDef['shape'];
  legs: number;
  leg_angles: number[];
  leg_names: string[];
  leg_full: string[];
  map_pos: { x: number; y: number };
  geometry: Record<string, number | boolean>;
  phases: JunctionPhase[];
  move_w: Record<'L' | 'T' | 'R' | '*', number>;
  created_at: Date;
}

export const JunctionModel = {
  async getAll(): Promise<JunctionDef[]> {
    const result = await pool.query<JunctionDefRow>(
      'SELECT * FROM junction_def ORDER BY id',
    );
    return result.rows;
  },

  async getById(id: string): Promise<JunctionDef | null> {
    const result = await pool.query<JunctionDefRow>(
      'SELECT * FROM junction_def WHERE id = $1',
      [id],
    );
    return result.rows[0] || null;
  },

  async upsert(def: Omit<JunctionDef, 'created_at'>): Promise<JunctionDef> {
    const result = await pool.query<JunctionDefRow>(
      `INSERT INTO junction_def
        (id, code, name, shape, legs, leg_angles, leg_names, leg_full, map_pos, geometry, phases, move_w)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       ON CONFLICT (id) DO UPDATE SET
         code = EXCLUDED.code,
         name = EXCLUDED.name,
         shape = EXCLUDED.shape,
         legs = EXCLUDED.legs,
         leg_angles = EXCLUDED.leg_angles,
         leg_names = EXCLUDED.leg_names,
         leg_full = EXCLUDED.leg_full,
         map_pos = EXCLUDED.map_pos,
         geometry = EXCLUDED.geometry,
         phases = EXCLUDED.phases,
         move_w = EXCLUDED.move_w
       RETURNING *`,
      [
        def.id,
        def.code,
        def.name,
        def.shape,
        def.legs,
        def.leg_angles,
        def.leg_names,
        def.leg_full,
        def.map_pos,
        def.geometry,
        def.phases,
        def.move_w,
      ],
    );
    return result.rows[0];
  },

  async delete(id: string): Promise<boolean> {
    const result = await pool.query('DELETE FROM junction_def WHERE id = $1', [id]);
    return (result.rowCount ?? 0) > 0;
  },
};
