-- Reset the seeded admin password during this one-time upgrade. The migration
-- runner replaces this placeholder with a bcrypt hash of ADMIN_PASSWORD.
UPDATE users
   SET password_hash = '!seed-placeholder-replaced-by-runner'
 WHERE username = 'admin';
