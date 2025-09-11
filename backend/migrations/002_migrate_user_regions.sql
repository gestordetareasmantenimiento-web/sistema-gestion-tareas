-- Migración 002: Migrar usuarios a la nueva estructura de regiones
-- Este script asigna usuarios a regiones basándose en la lógica operativa

-- 1. Asignar CERCO a todas las regiones
INSERT OR IGNORE INTO usuario_regiones (id_usuario, id_region)
SELECT u.id, r.id
FROM usuarios u
CROSS JOIN regiones r
WHERE u.rol = 'cerco' AND u.activo = 1;

-- 2. Asignar proveedores a todas las regiones (pueden operar en cualquier región)
INSERT OR IGNORE INTO usuario_regiones (id_usuario, id_region)
SELECT u.id, r.id
FROM usuarios u
CROSS JOIN regiones r
WHERE u.rol = 'proveedor' AND u.activo = 1;

-- 3. Asignar gerentes a sus regiones específicas
-- GBA Norte
INSERT OR IGNORE INTO usuario_regiones (id_usuario, id_region)
SELECT u.id, r.id
FROM usuarios u
CROSS JOIN regiones r
WHERE u.rol = 'gerente' 
  AND u.activo = 1
  AND r.nombre = 'GBA Norte'
  AND (u.nombre_completo LIKE '%Norte%' OR u.email LIKE '%norte%');

-- GBA Sur
INSERT OR IGNORE INTO usuario_regiones (id_usuario, id_region)
SELECT u.id, r.id
FROM usuarios u
CROSS JOIN regiones r
WHERE u.rol = 'gerente' 
  AND u.activo = 1
  AND r.nombre = 'GBA Sur'
  AND (u.nombre_completo LIKE '%Sur%' OR u.email LIKE '%sur%');

-- GBA Oeste
INSERT OR IGNORE INTO usuario_regiones (id_usuario, id_region)
SELECT u.id, r.id
FROM usuarios u
CROSS JOIN regiones r
WHERE u.rol = 'gerente' 
  AND u.activo = 1
  AND r.nombre = 'GBA Oeste'
  AND (u.nombre_completo LIKE '%Oeste%' OR u.email LIKE '%oeste%');

-- CABA Sur
INSERT OR IGNORE INTO usuario_regiones (id_usuario, id_region)
SELECT u.id, r.id
FROM usuarios u
CROSS JOIN regiones r
WHERE u.rol = 'gerente' 
  AND u.activo = 1
  AND r.nombre = 'CABA Sur'
  AND (u.nombre_completo LIKE '%CABA%' OR u.nombre_completo LIKE '%Sur%' OR u.email LIKE '%caba%');

-- CABA Norte
INSERT OR IGNORE INTO usuario_regiones (id_usuario, id_region)
SELECT u.id, r.id
FROM usuarios u
CROSS JOIN regiones r
WHERE u.rol = 'gerente' 
  AND u.activo = 1
  AND r.nombre = 'CABA Norte'
  AND (u.nombre_completo LIKE '%CABA%' OR u.nombre_completo LIKE '%Norte%' OR u.email LIKE '%caba%');

-- 4. Asignar administraciones a sus regiones específicas
-- GBA Norte
INSERT OR IGNORE INTO usuario_regiones (id_usuario, id_region)
SELECT u.id, r.id
FROM usuarios u
CROSS JOIN regiones r
WHERE u.rol = 'administrativo' 
  AND u.activo = 1
  AND r.nombre = 'GBA Norte'
  AND (u.nombre_completo LIKE '%Norte%' OR u.email LIKE '%norte%');

-- GBA Sur
INSERT OR IGNORE INTO usuario_regiones (id_usuario, id_region)
SELECT u.id, r.id
FROM usuarios u
CROSS JOIN regiones r
WHERE u.rol = 'administrativo' 
  AND u.activo = 1
  AND r.nombre = 'GBA Sur'
  AND (u.nombre_completo LIKE '%Sur%' OR u.email LIKE '%sur%');

-- GBA Oeste
INSERT OR IGNORE INTO usuario_regiones (id_usuario, id_region)
SELECT u.id, r.id
FROM usuarios u
CROSS JOIN regiones r
WHERE u.rol = 'administrativo' 
  AND u.activo = 1
  AND r.nombre = 'GBA Oeste'
  AND (u.nombre_completo LIKE '%Oeste%' OR u.email LIKE '%oeste%');

-- CABA Sur
INSERT OR IGNORE INTO usuario_regiones (id_usuario, id_region)
SELECT u.id, r.id
FROM usuarios u
CROSS JOIN regiones r
WHERE u.rol = 'administrativo' 
  AND u.activo = 1
  AND r.nombre = 'CABA Sur'
  AND (u.nombre_completo LIKE '%CABA%' OR u.nombre_completo LIKE '%Sur%' OR u.email LIKE '%caba%');

-- CABA Norte
INSERT OR IGNORE INTO usuario_regiones (id_usuario, id_region)
SELECT u.id, r.id
FROM usuarios u
CROSS JOIN regiones r
WHERE u.rol = 'administrativo' 
  AND u.activo = 1
  AND r.nombre = 'CABA Norte'
  AND (u.nombre_completo LIKE '%CABA%' OR u.nombre_completo LIKE '%Norte%' OR u.email LIKE '%caba%');

-- 5. Asignar supervisores de disponibilidad, soporte y provisión a sus regiones
-- GBA Norte
INSERT OR IGNORE INTO usuario_regiones (id_usuario, id_region)
SELECT u.id, r.id
FROM usuarios u
CROSS JOIN regiones r
WHERE u.rol IN ('supervisor de disponibilidad', 'supervisor de soporte', 'supervisor de provision')
  AND u.activo = 1
  AND r.nombre = 'GBA Norte'
  AND (u.nombre_completo LIKE '%Norte%' OR u.email LIKE '%norte%');

-- GBA Sur
INSERT OR IGNORE INTO usuario_regiones (id_usuario, id_region)
SELECT u.id, r.id
FROM usuarios u
CROSS JOIN regiones r
WHERE u.rol IN ('supervisor de disponibilidad', 'supervisor de soporte', 'supervisor de provision')
  AND u.activo = 1
  AND r.nombre = 'GBA Sur'
  AND (u.nombre_completo LIKE '%Sur%' OR u.email LIKE '%sur%');

-- GBA Oeste
INSERT OR IGNORE INTO usuario_regiones (id_usuario, id_region)
SELECT u.id, r.id
FROM usuarios u
CROSS JOIN regiones r
WHERE u.rol IN ('supervisor de disponibilidad', 'supervisor de soporte', 'supervisor de provision')
  AND u.activo = 1
  AND r.nombre = 'GBA Oeste'
  AND (u.nombre_completo LIKE '%Oeste%' OR u.email LIKE '%oeste%');

-- CABA Sur
INSERT OR IGNORE INTO usuario_regiones (id_usuario, id_region)
SELECT u.id, r.id
FROM usuarios u
CROSS JOIN regiones r
WHERE u.rol IN ('supervisor de disponibilidad', 'supervisor de soporte', 'supervisor de provision')
  AND u.activo = 1
  AND r.nombre = 'CABA Sur'
  AND (u.nombre_completo LIKE '%CABA%' OR u.nombre_completo LIKE '%Sur%' OR u.email LIKE '%caba%');

-- CABA Norte
INSERT OR IGNORE INTO usuario_regiones (id_usuario, id_region)
SELECT u.id, r.id
FROM usuarios u
CROSS JOIN regiones r
WHERE u.rol IN ('supervisor de disponibilidad', 'supervisor de soporte', 'supervisor de provision')
  AND u.activo = 1
  AND r.nombre = 'CABA Norte'
  AND (u.nombre_completo LIKE '%CABA%' OR u.nombre_completo LIKE '%Norte%' OR u.email LIKE '%caba%');

-- 6. Asignar supervisores de mantenimiento
-- GBA Norte (independiente)
INSERT OR IGNORE INTO usuario_regiones (id_usuario, id_region)
SELECT u.id, r.id
FROM usuarios u
CROSS JOIN regiones r
WHERE u.rol = 'supervisor de mantenimiento'
  AND u.activo = 1
  AND r.nombre = 'GBA Norte'
  AND (u.nombre_completo LIKE '%Norte%' OR u.email LIKE '%norte%');

-- GBA Sur (independiente)
INSERT OR IGNORE INTO usuario_regiones (id_usuario, id_region)
SELECT u.id, r.id
FROM usuarios u
CROSS JOIN regiones r
WHERE u.rol = 'supervisor de mantenimiento'
  AND u.activo = 1
  AND r.nombre = 'GBA Sur'
  AND (u.nombre_completo LIKE '%Sur%' OR u.email LIKE '%sur%');

-- GBA Oeste (independiente)
INSERT OR IGNORE INTO usuario_regiones (id_usuario, id_region)
SELECT u.id, r.id
FROM usuarios u
CROSS JOIN regiones r
WHERE u.rol = 'supervisor de mantenimiento'
  AND u.activo = 1
  AND r.nombre = 'GBA Oeste'
  AND (u.nombre_completo LIKE '%Oeste%' OR u.email LIKE '%oeste%');

-- CABA (unificado - supervisor puede operar en ambas regiones)
INSERT OR IGNORE INTO usuario_regiones (id_usuario, id_region)
SELECT u.id, r.id
FROM usuarios u
CROSS JOIN regiones r
WHERE u.rol = 'supervisor de mantenimiento'
  AND u.activo = 1
  AND r.nombre IN ('CABA Sur', 'CABA Norte')
  AND (u.nombre_completo LIKE '%CABA%' OR u.email LIKE '%caba%');

-- 7. Asignar inspectores
-- GBA Norte (solo en su región)
INSERT OR IGNORE INTO usuario_regiones (id_usuario, id_region)
SELECT u.id, r.id
FROM usuarios u
CROSS JOIN regiones r
WHERE u.rol = 'inspector'
  AND u.activo = 1
  AND r.nombre = 'GBA Norte'
  AND (u.nombre_completo LIKE '%Norte%' OR u.email LIKE '%norte%');

-- GBA Sur (solo en su región)
INSERT OR IGNORE INTO usuario_regiones (id_usuario, id_region)
SELECT u.id, r.id
FROM usuarios u
CROSS JOIN regiones r
WHERE u.rol = 'inspector'
  AND u.activo = 1
  AND r.nombre = 'GBA Sur'
  AND (u.nombre_completo LIKE '%Sur%' OR u.email LIKE '%sur%');

-- GBA Oeste (solo en su región)
INSERT OR IGNORE INTO usuario_regiones (id_usuario, id_region)
SELECT u.id, r.id
FROM usuarios u
CROSS JOIN regiones r
WHERE u.rol = 'inspector'
  AND u.activo = 1
  AND r.nombre = 'GBA Oeste'
  AND (u.nombre_completo LIKE '%Oeste%' OR u.email LIKE '%oeste%');

-- CABA (inspectores pueden operar en ambas regiones)
INSERT OR IGNORE INTO usuario_regiones (id_usuario, id_region)
SELECT u.id, r.id
FROM usuarios u
CROSS JOIN regiones r
WHERE u.rol = 'inspector'
  AND u.activo = 1
  AND r.nombre IN ('CABA Sur', 'CABA Norte')
  AND (u.nombre_completo LIKE '%CABA%' OR u.email LIKE '%caba%');

-- 8. Verificar asignaciones
-- Mostrar resumen de asignaciones por rol y región
SELECT 
    u.rol,
    r.nombre as region,
    COUNT(*) as usuarios_asignados
FROM usuarios u
JOIN usuario_regiones ur ON u.id = ur.id_usuario
JOIN regiones r ON ur.id_region = r.id
WHERE u.activo = 1
GROUP BY u.rol, r.nombre
ORDER BY u.rol, r.nombre;
