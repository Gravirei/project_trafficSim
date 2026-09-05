-- V003: junction_def — per-site geometry + phase definitions
-- Replaces the generic `signals` table for the new domain. Each row is a
-- complete junction: shape, legs, geometry, phase list, and map position.
-- This table is the single source of truth for the backend; the frontend
-- mirrors it from frontend/src/lib/sim/constants.ts.

CREATE TABLE IF NOT EXISTS junction_def (
    id          TEXT PRIMARY KEY,
    code        TEXT NOT NULL,
    name        TEXT NOT NULL,
    shape       TEXT NOT NULL
                CHECK (shape IN ('cross', 'round', 'y', 't', 'penta')),
    legs        INTEGER NOT NULL CHECK (legs BETWEEN 2 AND 8),
    leg_angles  INTEGER[] NOT NULL,
    leg_names   TEXT[] NOT NULL,
    leg_full    TEXT[] NOT NULL,
    map_pos     JSONB NOT NULL,
    geometry    JSONB NOT NULL,
    phases      JSONB NOT NULL,
    move_w      JSONB NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_junction_def_shape ON junction_def(shape);
