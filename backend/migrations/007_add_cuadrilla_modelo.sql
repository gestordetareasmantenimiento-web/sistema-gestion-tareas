-- Migración 007: Agregar tabla de cuadrilla modelo
-- Fecha: 2024-01-XX
-- Descripción: Agregar tabla para almacenar el porcentaje de adicional cuadrilla modelo

-- Tabla para almacenar el porcentaje de cuadrilla modelo
CREATE TABLE cuadrilla_modelo (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    porcentaje REAL NOT NULL DEFAULT 40,
    fecha_actualizacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Insertar el valor inicial del porcentaje de cuadrilla modelo (40%)
INSERT INTO cuadrilla_modelo (porcentaje) VALUES (40);
