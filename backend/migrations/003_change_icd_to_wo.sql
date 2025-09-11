-- Migración para cambiar de ICD a WO (Work Order)
-- Formato: SA-XXXXXX (SA- seguido de 6 números)

-- Renombrar la columna numero_icd a numero_wo
ALTER TABLE tareas RENAME COLUMN numero_icd TO numero_wo;

-- Actualizar cualquier referencia en el historial si existe
-- (El historial probablemente almacena texto, así que no necesita cambios estructurales)
