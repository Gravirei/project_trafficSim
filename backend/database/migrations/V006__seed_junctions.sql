-- V006: seed junction_def + phase_durations for the 5 demo sites.
-- Geometry and phases mirror frontend/src/lib/sim/constants.ts (JUNCS).
-- Keep this file in sync with the frontend — the V006 sync test
-- (backend/tests/junctionSeed.test.ts) compares this seed to the
-- frontend fixture.

-- ============================================================
-- cross — J07 · CENTRAL CROSS
-- ============================================================
INSERT INTO junction_def
    (id, code, name, shape, legs, leg_angles, leg_names, leg_full, map_pos, geometry, phases, move_w)
VALUES (
    'cross',
    'J07',
    'CENTRAL CROSS',
    'cross',
    4,
    ARRAY[90, 180, 270, 0],
    ARRAY['S', 'W', 'N', 'E'],
    ARRAY['SOUTH APPROACH · NB', 'WEST APPROACH · EB', 'NORTH APPROACH · SB', 'EAST APPROACH · WB'],
    '{"x": 560, "y": 360}'::jsonb,
    '{"hw": 68, "off0": 17, "off1": 51, "rL": 100, "rR": 38, "stopD": 96, "boxR": 70, "clearR": 104}'::jsonb,
    '[
        {"name": "N–S THROUGH", "short": "NS·T", "dur": "thru", "moves": [[2, "T"], [2, "R"], [0, "T"], [0, "R"]]},
        {"name": "N–S LEFT",    "short": "NS·L", "dur": "left", "moves": [[2, "L"], [0, "L"]]},
        {"name": "E–W THROUGH", "short": "EW·T", "dur": "thru", "moves": [[1, "T"], [1, "R"], [3, "T"], [3, "R"]]},
        {"name": "E–W LEFT",    "short": "EW·L", "dur": "left", "moves": [[1, "L"], [3, "L"]]}
    ]'::jsonb,
    '{"L": 0.18, "T": 0.6, "R": 0.22, "*": 0}'::jsonb
) ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- round — J12 · RING PLAZA (signalized roundabout)
-- ============================================================
INSERT INTO junction_def
    (id, code, name, shape, legs, leg_angles, leg_names, leg_full, map_pos, geometry, phases, move_w)
VALUES (
    'round',
    'J12',
    'RING PLAZA',
    'round',
    4,
    ARRAY[90, 180, 270, 0],
    ARRAY['S', 'W', 'N', 'E'],
    ARRAY['SOUTH APPROACH · NB', 'WEST APPROACH · EB', 'NORTH APPROACH · SB', 'EAST APPROACH · WB'],
    '{"x": 1300, "y": 360}'::jsonb,
    '{"hw": 40, "offA": 20, "singleLane": true, "R": 88, "stopD": 150, "boxR": 120, "clearR": 150, "De": 112, "Dx": 135, "kM": 22, "kE": 28}'::jsonb,
    '[
        {"name": "N+S ENTRIES", "short": "N+S", "dur": "thru", "moves": [[2, "*"], [0, "*"]]},
        {"name": "E+W ENTRIES", "short": "E+W", "dur": "thru", "moves": [[1, "*"], [3, "*"]]}
    ]'::jsonb,
    '{"L": 0.25, "T": 0.45, "R": 0.3, "*": 0}'::jsonb
) ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- y — J21 · MERIDIAN SPLIT
-- ============================================================
INSERT INTO junction_def
    (id, code, name, shape, legs, leg_angles, leg_names, leg_full, map_pos, geometry, phases, move_w)
VALUES (
    'y',
    'J21',
    'MERIDIAN SPLIT',
    'y',
    3,
    ARRAY[90, 210, 330],
    ARRAY['S', 'NW', 'NE'],
    ARRAY['SOUTH STEM · NB', 'NORTHWEST LEG · INBOUND', 'NORTHEAST LEG · INBOUND'],
    '{"x": 900, "y": 800}'::jsonb,
    '{"hw": 60, "off0": 15, "off1": 45, "rL": 96, "rR": 36, "stopD": 92, "boxR": 64, "clearR": 100}'::jsonb,
    '[
        {"name": "S LEFT · SIDES",   "short": "S·L",  "dur": "left", "moves": [[0, "L"], [1, "R"], [2, "R"]]},
        {"name": "NW LEFT · SIDES",  "short": "NW·L", "dur": "left", "moves": [[1, "L"], [2, "R"], [0, "R"]]},
        {"name": "NE LEFT · SIDES",  "short": "NE·L", "dur": "left", "moves": [[2, "L"], [0, "R"], [1, "R"]]}
    ]'::jsonb,
    '{"L": 0.5, "T": 0, "R": 0.5, "*": 0}'::jsonb
) ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- t — J33 · HARBOR TEE
-- ============================================================
INSERT INTO junction_def
    (id, code, name, shape, legs, leg_angles, leg_names, leg_full, map_pos, geometry, phases, move_w)
VALUES (
    't',
    'J33',
    'HARBOR TEE',
    't',
    3,
    ARRAY[90, 180, 270],
    ARRAY['S', 'W', 'N'],
    ARRAY['SOUTH APPROACH · NB', 'WEST STEM · EB', 'NORTH APPROACH · SB'],
    '{"x": 900, "y": 1160}'::jsonb,
    '{"hw": 68, "off0": 17, "off1": 51, "rL": 100, "rR": 38, "stopD": 96, "boxR": 70, "clearR": 104}'::jsonb,
    '[
        {"name": "S–N THROUGH",     "short": "THRU", "dur": "thru", "moves": [[0, "T"], [2, "T"], [2, "R"]]},
        {"name": "S LEFT · W RIGHT", "short": "S·L",  "dur": "left", "moves": [[0, "L"], [1, "R"]]},
        {"name": "W PROTECTED",     "short": "W·P",  "dur": "left", "moves": [[1, "L"], [1, "R"]]}
    ]'::jsonb,
    '{"L": 0.3, "T": 0.55, "R": 0.15, "*": 0}'::jsonb
) ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- penta — J45 · CIVIC PENTA (5-way)
-- ============================================================
INSERT INTO junction_def
    (id, code, name, shape, legs, leg_angles, leg_names, leg_full, map_pos, geometry, phases, move_w)
VALUES (
    'penta',
    'J45',
    'CIVIC PENTA',
    'penta',
    5,
    ARRAY[90, 162, 234, 306, 18],
    ARRAY['S', 'SW', 'NW', 'N', 'NE'],
    ARRAY['SOUTH APPROACH · NB', 'SOUTHWEST LEG · INBOUND', 'NORTHWEST LEG · INBOUND', 'NORTH APPROACH · SB', 'NORTHEAST LEG · INBOUND'],
    '{"x": 560, "y": 820}'::jsonb,
    '{"hw": 60, "off0": 15, "off1": 45, "rL": 92, "rR": 34, "stopD": 92, "boxR": 64, "clearR": 100}'::jsonb,
    '[
        {"name": "S · N THROUGH",   "short": "S·N",     "dur": "thru", "moves": [[0, "T"], [0, "R"], [3, "T"], [3, "R"]]},
        {"name": "S · N LEFT",      "short": "S·N·L",   "dur": "left", "moves": [[0, "L"], [3, "L"]]},
        {"name": "SW · NE",         "short": "SW·NE",   "dur": "thru", "moves": [[1, "T"], [1, "R"], [4, "T"], [4, "R"]]},
        {"name": "SW · NE LEFT",    "short": "SW·NE·L", "dur": "left", "moves": [[1, "L"], [4, "L"]]},
        {"name": "NW APPROACH",     "short": "NW",      "dur": "left", "moves": [[2, "L"], [2, "T"], [2, "R"]]}
    ]'::jsonb,
    '{"L": 0.22, "T": 0.5, "R": 0.28, "*": 0}'::jsonb
) ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- Default phase_durations for each junction
-- ============================================================
INSERT INTO phase_durations (junction_id, thru, left_phase, yellow, allred, truck_share)
VALUES
    ('cross', 14, 7, 3, 2, 0.10),
    ('round', 14, 7, 3, 2, 0.10),
    ('y',     14, 7, 3, 2, 0.10),
    ('t',     14, 7, 3, 2, 0.10),
    ('penta', 14, 7, 3, 2, 0.10)
ON CONFLICT (junction_id) DO NOTHING;
