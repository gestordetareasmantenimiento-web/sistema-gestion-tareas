-- Migración 001: Corregir estructura de regiones
-- Ejecutar este script para actualizar la base de datos existente

-- 1. Crear tabla regiones si no existe
CREATE TABLE IF NOT EXISTS regiones (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL UNIQUE,
    descripcion TEXT,
    activo BOOLEAN NOT NULL DEFAULT 1,
    fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 2. Crear tabla usuario_regiones si no existe
CREATE TABLE IF NOT EXISTS usuario_regiones (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    id_usuario INTEGER NOT NULL,
    id_region INTEGER NOT NULL,
    fecha_asignacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_usuario) REFERENCES usuarios (id) ON DELETE CASCADE,
    FOREIGN KEY (id_region) REFERENCES regiones (id) ON DELETE CASCADE,
    UNIQUE(id_usuario, id_region)
);

-- 3. Crear tabla observaciones si no existe
CREATE TABLE IF NOT EXISTS observaciones (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    id_tarea INTEGER NOT NULL,
    id_usuario_observador INTEGER NOT NULL,
    rol_observador TEXT NOT NULL,
    observacion TEXT NOT NULL,
    estado_anterior TEXT NOT NULL,
    estado_nuevo TEXT NOT NULL,
    fecha_observacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    resuelta BOOLEAN NOT NULL DEFAULT 0,
    fecha_resolucion DATETIME,
    id_usuario_resolutor INTEGER,
    FOREIGN KEY (id_tarea) REFERENCES tareas (id),
    FOREIGN KEY (id_usuario_observador) REFERENCES usuarios (id),
    FOREIGN KEY (id_usuario_resolutor) REFERENCES usuarios (id)
);

-- 4. Crear tabla tarea_materiales si no existe
CREATE TABLE IF NOT EXISTS tarea_materiales (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    id_tarea INTEGER NOT NULL,
    id_material INTEGER NOT NULL,
    cantidad INTEGER NOT NULL DEFAULT 1,
    tipo TEXT NOT NULL DEFAULT 'utilizado',
    fecha_registro DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_tarea) REFERENCES tareas (id)
);

-- 5. Insertar las 5 regiones operativas (solo si no existen)
INSERT OR IGNORE INTO regiones (nombre, descripcion) VALUES 
('GBA Norte', 'Gran Buenos Aires Norte'),
('GBA Sur', 'Gran Buenos Aires Sur'),
('GBA Oeste', 'Gran Buenos Aires Oeste'),
('CABA Sur', 'Ciudad Autónoma de Buenos Aires Sur'),
('CABA Norte', 'Ciudad Autónoma de Buenos Aires Norte');

-- 6. Agregar columnas faltantes a tabla tareas si no existen
-- Nota: SQLite no soporta ALTER TABLE ADD COLUMN IF NOT EXISTS, 
-- por lo que se debe verificar manualmente antes de ejecutar

-- Agregar id_region a tareas (cambiar de region TEXT a id_region INTEGER)
-- PRECAUCIÓN: Este paso requiere migración de datos existentes

-- Agregar columnas adicionales a tareas
ALTER TABLE tareas ADD COLUMN fecha_inicio DATETIME;
ALTER TABLE tareas ADD COLUMN fecha_fin DATETIME;
ALTER TABLE tareas ADD COLUMN fecha_ultima_exportacion DATETIME;
ALTER TABLE tareas ADD COLUMN observaciones TEXT;
ALTER TABLE tareas ADD COLUMN archivos_adjuntos TEXT;

-- Agregar columnas adicionales a historial_tareas
ALTER TABLE historial_tareas ADD COLUMN estado_anterior TEXT;
ALTER TABLE historial_tareas ADD COLUMN estado_nuevo TEXT;
ALTER TABLE historial_tareas ADD COLUMN datos_adicionales TEXT;

-- Agregar columnas adicionales a proveedores
ALTER TABLE proveedores ADD COLUMN centro TEXT;
ALTER TABLE proveedores ADD COLUMN almacen TEXT;
ALTER TABLE proveedores ADD COLUMN fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP;

-- 7. Migrar datos existentes de regiones
-- Crear tabla temporal para mapear regiones existentes
CREATE TEMP TABLE region_mapping AS
SELECT DISTINCT region as nombre_region FROM tareas WHERE region IS NOT NULL;

-- Insertar regiones que no existen en la tabla regiones
INSERT OR IGNORE INTO regiones (nombre, descripcion)
SELECT 
    nombre_region,
    'Región migrada desde datos existentes'
FROM region_mapping
WHERE nombre_region NOT IN (SELECT nombre FROM regiones);

-- 8. Crear tabla temporal para migrar tareas
CREATE TEMP TABLE tareas_temp AS
SELECT 
    t.*,
    r.id as id_region_nueva
FROM tareas t
LEFT JOIN regiones r ON t.region = r.nombre;

-- 9. Actualizar tareas con id_region (esto requiere recrear la tabla)
-- PRECAUCIÓN: Este es un proceso complejo que requiere backup

-- Crear nueva tabla tareas con estructura correcta
CREATE TABLE tareas_new (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    id_tarea_texto TEXT NOT NULL UNIQUE,
    numero_icd TEXT,
    estado TEXT NOT NULL,
    descripcion TEXT NOT NULL,
    direccion TEXT NOT NULL,
    id_region INTEGER NOT NULL,
    id_inspector INTEGER NOT NULL,
    id_proveedor INTEGER NOT NULL,
    fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_inicio DATETIME,
    fecha_cierre_proveedor DATETIME,
    fecha_aprobacion_final DATETIME,
    fecha_fin DATETIME,
    fecha_ultima_exportacion DATETIME,
    observaciones TEXT,
    archivos_adjuntos TEXT,
    FOREIGN KEY (id_region) REFERENCES regiones (id),
    FOREIGN KEY (id_inspector) REFERENCES usuarios (id),
    FOREIGN KEY (id_proveedor) REFERENCES proveedores (id)
);

-- Migrar datos a la nueva tabla
INSERT INTO tareas_new (
    id, id_tarea_texto, numero_icd, estado, descripcion, direccion,
    id_region, id_inspector, id_proveedor, fecha_creacion,
    fecha_cierre_proveedor, fecha_aprobacion_final
)
SELECT 
    t.id, t.id_tarea_texto, t.numero_icd, t.estado, t.descripcion, t.direccion,
    r.id as id_region, t.id_inspector, t.id_proveedor, t.fecha_creacion,
    t.fecha_cierre_proveedor, t.fecha_aprobacion_final
FROM tareas t
LEFT JOIN regiones r ON t.region = r.nombre;

-- Eliminar tabla antigua y renombrar la nueva
DROP TABLE tareas;
ALTER TABLE tareas_new RENAME TO tareas;

-- 10. Limpiar tablas temporales
DROP TABLE region_mapping;
DROP TABLE tareas_temp;

-- 11. Crear índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_tareas_region ON tareas(id_region);
CREATE INDEX IF NOT EXISTS idx_tareas_estado ON tareas(estado);
CREATE INDEX IF NOT EXISTS idx_tareas_inspector ON tareas(id_inspector);
CREATE INDEX IF NOT EXISTS idx_tareas_proveedor ON tareas(id_proveedor);
CREATE INDEX IF NOT EXISTS idx_usuario_regiones_usuario ON usuario_regiones(id_usuario);
CREATE INDEX IF NOT EXISTS idx_usuario_regiones_region ON usuario_regiones(id_region);
CREATE INDEX IF NOT EXISTS idx_historial_tarea ON historial_tareas(id_tarea);
CREATE INDEX IF NOT EXISTS idx_observaciones_tarea ON observaciones(id_tarea);
