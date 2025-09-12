-- Migración 006: Agregar columna precio_calculado a tarea_mano_de_obra
-- Fecha: 2024-01-XX
-- Descripción: Agregar columna para almacenar el precio calculado automáticamente (ej: costo mínimo diario)

-- Agregar la columna precio_calculado a la tabla tarea_mano_de_obra
ALTER TABLE tarea_mano_de_obra ADD COLUMN precio_calculado REAL;
