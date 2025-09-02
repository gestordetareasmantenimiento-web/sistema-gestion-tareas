| Nombre de Columna | Tipo de Dato       | Descripción                          | Ejemplo              |
| ----------------- | ------------------ | ------------------------------------ | -------------------- |
| id                | INTEGER PRIMARY KEY| Identificador único para cada usuario (se autoincrementa)| 1, 2, 3|
| nombre_completo   | TEXT NOT NULL      | Nombre y apellido del usuario.       | "Juan Pérez"         |
| email             | TEXT NOT NULL UNIQUE| Email corporativo, se usará para el login. No se puede repetir.| "juan.perez@empresa.com" |
| password_hash     | TEXT NOT NULL      | La contraseña del usuario, pero encriptada (nunca en texto plano). | "j29f029jfo2..."   |
| rol               | TEXT NOT NULL      | El rol del usuario en el sistema.   | "inspector", "proveedor" |
| region            | TEXT               | La región a la que pertenece (si aplica).  | "Norte", "Sur"       |
| id_supervisor     | INTEGER            | Si es Inspector, el ID del usuario que es su supervisor.| 5   |
| id_proveedor      | INTEGER            | Si es un usuario de Proveedor, el ID de la empresa a la que pertenece. | 12  |
| activo            | BOOLEAN NOT NULL   | Pasra poder desactivar un usuario sin borrarlo.  | true    |
| fecha_creacion    | DATETIME NOT NULL  | Fecha y hora en que se creó el usuario.  | "2025-08-20 10:30:00" |