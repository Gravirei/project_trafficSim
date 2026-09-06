-- V004: phase_durations — per-junction timing plan
-- One row per junction; updated when the operator moves timing sliders.
-- The audit engine reads from this table; the frontend's DEFAULT_DURATIONS
-- in constants.ts is the initial mirror.
--
-- Note: `left` is a reserved word in PostgreSQL, so the column is named
-- `left_phase` in the DB. The JS API key remains `left` for readability.

CREATE TABLE IF NOT EXISTS phase_durations (
    junction_id  TEXT PRIMARY KEY REFERENCES junction_def(id) ON DELETE CASCADE,
    thru         NUMERIC(5,2) NOT NULL DEFAULT 12.00,
    left_phase   NUMERIC(5,2) NOT NULL DEFAULT 8.00,
    yellow       NUMERIC(5,2) NOT NULL DEFAULT 3.00,
    allred       NUMERIC(5,2) NOT NULL DEFAULT 1.00,
    truck_share  NUMERIC(4,3) NOT NULL DEFAULT 0.100
                  CHECK (truck_share BETWEEN 0 AND 1),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
