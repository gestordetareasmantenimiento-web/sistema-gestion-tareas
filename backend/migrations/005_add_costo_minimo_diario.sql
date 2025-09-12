-- Migración 005: Agregar tabla de costo mínimo diario
-- Fecha: 2024-01-XX
-- Descripción: Crear tabla para almacenar el costo mínimo diario para cálculos automáticos

-- Crear la tabla costominimodiario
CREATE TABLE IF NOT EXISTS costominimodiario (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    valor REAL NOT NULL DEFAULT 0,
    fecha_actualizacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Insertar el valor inicial del costo mínimo diario (735000 pesos)
INSERT INTO costominimodiario (valor) VALUES (735000);
