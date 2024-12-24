BEGIN;

CREATE TABLE IF NOT EXISTS users (
    id          SERIAL PRIMARY KEY,
    code        TEXT UNIQUE NOT NULL CHECK (code = LOWER(code)),
    password    TEXT NOT NULL,
    createdAt   TIMESTAMP DEFAULT NOW(),
    updatedAt   TIMESTAMP DEFAULT NOW()
);

COMMIT;