-- schema.sql
-- Script para crear la estructura de la base de datos SQLite

-- Tabla para almacenar las empresas proveedoras
CREATE TABLE proveedores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    razon_social TEXT NOT NULL UNIQUE,
    cuit TEXT NOT NULL UNIQUE,
    activo BOOLEAN NOT NULL DEFAULT 1
);

-- Tabla para almacenar todos los usuarios del sistema
CREATE TABLE usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre_completo TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    rol TEXT NOT NULL,
    region TEXT,
    id_supervisor INTEGER,
    id_proveedor INTEGER,
    activo BOOLEAN NOT NULL DEFAULT 1,
    fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_proveedor) REFERENCES proveedores (id)
);

-- Tabla principal que contiene cada tarea
CREATE TABLE tareas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    id_tarea_texto TEXT NOT NULL UNIQUE,
    numero_icd TEXT,
    estado TEXT NOT NULL,
    descripcion TEXT NOT NULL,
    direccion TEXT NOT NULL,
    region TEXT NOT NULL,
    id_inspector INTEGER NOT NULL,
    id_proveedor INTEGER NOT NULL,
    fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_cierre_proveedor DATETIME,
    fecha_aprobacion_final DATETIME,
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