-- Traffic Signal Simulation Database Schema

-- Table 1: users
CREATE TABLE IF NOT EXISTS users (
    id            SERIAL PRIMARY KEY,
    username      VARCHAR(50)  NOT NULL UNIQUE,
    email         VARCHAR(255) UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role          VARCHAR(20)  NOT NULL DEFAULT 'VIEWER'
                  CHECK (role IN ('ADMIN', 'VIEWER')),
    created_at    TIMESTAMP DEFAULT NOW()
);

-- Table 2: signals
CREATE TABLE IF NOT EXISTS signals (
    id              SERIAL PRIMARY KEY,
    name            VARCHAR(100) NOT NULL UNIQUE,
    current_state   VARCHAR(10)  NOT NULL DEFAULT 'RED'
                    CHECK (current_state IN ('GREEN', 'YELLOW', 'RED')),
    green_duration  INTEGER NOT NULL DEFAULT 30,
    red_duration    INTEGER NOT NULL DEFAULT 30,
    yellow_duration INTEGER NOT NULL DEFAULT 5,
    created_at      TIMESTAMP DEFAULT NOW()
);

-- Table 2: queue_history
CREATE TABLE IF NOT EXISTS queue_history (
    id              SERIAL PRIMARY KEY,
    signal_id       INTEGER NOT NULL REFERENCES signals(id) ON DELETE CASCADE,
    timestamp       TIMESTAMP DEFAULT NOW(),
    queue_length    INTEGER NOT NULL DEFAULT 0,
    avg_wait_time   REAL    NOT NULL DEFAULT 0,
    utilization     REAL    NOT NULL DEFAULT 0,
    arrival_rate    REAL    NOT NULL DEFAULT 0
);

-- Table 3: vehicle_log
CREATE TABLE IF NOT EXISTS vehicle_log (
    id              SERIAL PRIMARY KEY,
    signal_id       INTEGER NOT NULL REFERENCES signals(id) ON DELETE CASCADE,
    arrived_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    served_at       TIMESTAMP,
    wait_seconds    REAL
);

-- Indexes for query performance
CREATE INDEX IF NOT EXISTS idx_queue_history_signal ON queue_history(signal_id);
CREATE INDEX IF NOT EXISTS idx_queue_history_time   ON queue_history(timestamp);
CREATE INDEX IF NOT EXISTS idx_vehicle_log_signal   ON vehicle_log(signal_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_log_arrived  ON vehicle_log(arrived_at);
