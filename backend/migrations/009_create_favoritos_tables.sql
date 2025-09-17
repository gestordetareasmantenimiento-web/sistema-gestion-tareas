-- Migración 009: Crear tabla de favoritos de proveedores
-- Fecha: 2024-12-19

-- Tabla para almacenar proveedores favoritos por usuario
CREATE TABLE IF NOT EXISTS proveedores_favoritos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    id_usuario INTEGER NOT NULL,
    id_proveedor INTEGER NOT NULL,
    fecha_agregado DATETIME DEFAULT CURRENT_TIMESTAMP,
    activo BOOLEAN DEFAULT 1,
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (id_proveedor) REFERENCES proveedores(id) ON DELETE CASCADE,
    UNIQUE(id_usuario, id_proveedor)
);

-- Índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_proveedores_favoritos_usuario ON proveedores_favoritos(id_usuario);
CREATE INDEX IF NOT EXISTS idx_proveedores_favoritos_proveedor ON proveedores_favoritos(id_proveedor);
CREATE INDEX IF NOT EXISTS idx_proveedores_favoritos_activo ON proveedores_favoritos(activo);
