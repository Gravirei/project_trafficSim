-- V005: event_log + preempt_log + ped_log
-- Append-only tables. 24h retention is enforced by a background job
-- (see backend/src/server.ts). The audit engine writes drift events to
-- event_log with tag='sys'.

CREATE TABLE IF NOT EXISTS event_log (
    id            BIGSERIAL PRIMARY KEY,
    junction_id   TEXT NOT NULL REFERENCES junction_def(id) ON DELETE CASCADE,
    t             NUMERIC(10,2) NOT NULL,
    tag           TEXT NOT NULL
                  CHECK (tag IN ('phase', 'ev', 'ped', 'mode', 'sys')),
    msg           TEXT NOT NULL,
    recorded_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_event_log_junction_time
    ON event_log (junction_id, recorded_at DESC);

CREATE TABLE IF NOT EXISTS preempt_log (
    id            BIGSERIAL PRIMARY KEY,
    junction_id   TEXT NOT NULL REFERENCES junction_def(id) ON DELETE CASCADE,
    leg           INTEGER NOT NULL,
    t             NUMERIC(10,2) NOT NULL,
    ev_id         BIGINT,
    recorded_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_preempt_log_junction_time
    ON preempt_log (junction_id, recorded_at DESC);

CREATE TABLE IF NOT EXISTS ped_log (
    id            BIGSERIAL PRIMARY KEY,
    junction_id   TEXT NOT NULL REFERENCES junction_def(id) ON DELETE CASCADE,
    side          INTEGER NOT NULL,
    t             NUMERIC(10,2) NOT NULL,
    recorded_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ped_log_junction_time
    ON ped_log (junction_id, recorded_at DESC);
