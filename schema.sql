-- schema.sql
CREATE TABLE IF NOT EXISTS usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    email TEXT NOT NULL
);

INSERT INTO usuarios (nombre, email) VALUES ('Diego', 'diego@ejemplo.com');