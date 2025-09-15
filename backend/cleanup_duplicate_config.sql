-- Script para limpiar registros duplicados de configuración
-- Ejecutar este script para mantener solo el registro más reciente de cada tabla

-- Limpiar costominimodiario - mantener solo el más reciente
DELETE FROM costominimodiario 
WHERE id NOT IN (
    SELECT id FROM (
        SELECT id FROM costominimodiario 
        ORDER BY fecha_actualizacion DESC 
        LIMIT 1
    )
);

-- Limpiar cuadrilla_modelo - mantener solo el más reciente
DELETE FROM cuadrilla_modelo 
WHERE id NOT IN (
    SELECT id FROM (
        SELECT id FROM cuadrilla_modelo 
        ORDER BY fecha_actualizacion DESC 
        LIMIT 1
    )
);

-- Verificar el resultado
SELECT 'costominimodiario' as tabla, COUNT(*) as registros FROM costominimodiario
UNION ALL
SELECT 'cuadrilla_modelo' as tabla, COUNT(*) as registros FROM cuadrilla_modelo;
