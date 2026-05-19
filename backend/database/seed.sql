-- Seed data: 4 signals (one per approach of a 4-way intersection)
INSERT INTO signals (name, green_duration, red_duration, yellow_duration)
VALUES
    ('North Lane', 30, 30, 5),
    ('South Lane', 30, 30, 5),
    ('East Lane',  30, 30, 5),
    ('West Lane',  30, 30, 5)
ON CONFLICT (name) DO NOTHING;

-- Default admin: username=admin, password=Tr4ff1cS1m@2026!
INSERT INTO users (username, email, password_hash, role) VALUES
    ('admin', 'admin_auth@gravirei.com', '$2b$10$tIJVonuhwAbEmYR6W8qe/eSSReFJpCxvLbum.n5Oq7/MWgDDxFj2S', 'ADMIN')
ON CONFLICT (username) DO NOTHING;

