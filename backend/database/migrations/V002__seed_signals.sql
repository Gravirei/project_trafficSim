-- Seed data: 4 signals (one per approach of a 4-way intersection)
INSERT INTO signals (name, green_duration, red_duration, yellow_duration)
VALUES
    ('North Lane', 30, 30, 5),
    ('South Lane', 30, 30, 5),
    ('East Lane',  30, 30, 5),
    ('West Lane',  30, 30, 5)
ON CONFLICT (name) DO NOTHING;

-- Default admin user. password_hash is a placeholder; the migration runner
-- will overwrite it with a bcrypt hash of process.env.ADMIN_PASSWORD
-- (default: Admin@123!) immediately after this migration is applied.
INSERT INTO users (username, email, password_hash, role) VALUES
    ('admin', 'admin_auth@gravirei.com', '!seed-placeholder-replaced-by-runner', 'ADMIN')
ON CONFLICT (username) DO NOTHING;
