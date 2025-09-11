-- schema.sql
-- Script para crear la estructura de la base de datos SQLite

-- Tabla para almacenar las regiones operativas
CREATE TABLE regiones (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL UNIQUE,
    descripcion TEXT,
    activo BOOLEAN NOT NULL DEFAULT 1,
    fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Tabla para almacenar las empresas proveedoras
CREATE TABLE proveedores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    razon_social TEXT NOT NULL UNIQUE,
    cuit TEXT NOT NULL UNIQUE,
    centro TEXT,
    almacen TEXT,
    activo BOOLEAN NOT NULL DEFAULT 1,
    fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Tabla para almacenar todos los usuarios del sistema
CREATE TABLE usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre_completo TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    rol TEXT NOT NULL,
    id_supervisor INTEGER,
    id_proveedor INTEGER,
    activo BOOLEAN NOT NULL DEFAULT 1,
    fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_proveedor) REFERENCES proveedores (id)
);

-- Tabla de relación many-to-many entre usuarios y regiones
CREATE TABLE usuario_regiones (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    id_usuario INTEGER NOT NULL,
    id_region INTEGER NOT NULL,
    fecha_asignacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_usuario) REFERENCES usuarios (id) ON DELETE CASCADE,
    FOREIGN KEY (id_region) REFERENCES regiones (id) ON DELETE CASCADE,
    UNIQUE(id_usuario, id_region)
);

-- Tabla principal que contiene cada tarea
CREATE TABLE tareas (
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

-- Tabla para la "caja negra" o historial de cada tarea
CREATE TABLE historial_tareas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    id_tarea INTEGER NOT NULL,
    fecha_evento DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    id_usuario INTEGER NOT NULL,
    accion TEXT NOT NULL,
    detalle TEXT,
    estado_anterior TEXT,
    estado_nuevo TEXT,
    datos_adicionales TEXT,
    FOREIGN KEY (id_tarea) REFERENCES tareas (id),
    FOREIGN KEY (id_usuario) REFERENCES usuarios (id)
);

-- Tabla para almacenar los archivos adjuntos de cada tarea
CREATE TABLE tarea_adjuntos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    id_tarea INTEGER NOT NULL,
    nombre_archivo TEXT NOT NULL,
    url_archivo TEXT NOT NULL,
    fecha_subida DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_tarea) REFERENCES tareas (id)
);

-- Tabla para almacenar materiales de tareas
CREATE TABLE tarea_materiales (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    id_tarea INTEGER NOT NULL,
    id_material INTEGER NOT NULL,
    cantidad INTEGER NOT NULL DEFAULT 1,
    tipo TEXT NOT NULL DEFAULT 'utilizado', -- 'utilizado' o 'recuperado'
    fecha_registro DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_tarea) REFERENCES tareas (id)
);

-- Tabla para almacenar observaciones de tareas
CREATE TABLE observaciones (
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

-- Insertar las 5 regiones operativas
INSERT INTO regiones (nombre, descripcion) VALUES 
('GBA Norte', 'Gran Buenos Aires Norte'),
('GBA Sur', 'Gran Buenos Aires Sur'),
('GBA Oeste', 'Gran Buenos Aires Oeste'),
('CABA Sur', 'Ciudad Autónoma de Buenos Aires Sur'),
('CABA Norte', 'Ciudad Autónoma de Buenos Aires Norte');