const db = require('../db/database');
const { ROLES } = require('../utils/roles');

// Dashboard principal del superadministrador
const getDashboard = async (req, res) => {
  try {
    console.log('Superadmin Dashboard - Getting dashboard data');

    // Obtener todos los roles con estadísticas (sin información de regiones)
    const rolesQuery = `
      SELECT 
        u.rol,
        COUNT(DISTINCT u.id) as total_usuarios,
        COUNT(DISTINCT t.id) as tareas_activas
      FROM usuarios u
      LEFT JOIN tareas t ON (
        (u.rol = 'proveedor' AND t.id_proveedor = u.id) OR
        (u.rol = 'inspector' AND t.id_inspector = u.id) OR
        (u.rol IN ('supervisor de mantenimiento', 'supervisor de disponibilidad', 'supervisor de soporte', 'supervisor de provision') AND t.id_inspector IN (
          SELECT id FROM usuarios WHERE id_supervisor = u.id
        )) OR
        (u.rol = 'administrativo' AND t.estado IN ('Pendiente Aprobación Administración', 'Pendiente Aprobación Gerente', 'Pendiente Aprobación CERCO')) OR
        (u.rol = 'gerente' AND t.estado IN ('Pendiente Aprobación Gerente', 'Pendiente Aprobación CERCO')) OR
        (u.rol = 'cerco' AND t.estado = 'Pendiente Aprobación CERCO')
      ) AND t.estado NOT IN ('Finalizada - Aprobada', 'Cancelada')
      WHERE u.activo = 1
      GROUP BY u.rol
      ORDER BY u.rol
    `;

    const roles = await new Promise((resolve, reject) => {
      db.all(rolesQuery, [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    // Obtener resumen general
    const resumenQuery = `
      SELECT 
        COUNT(DISTINCT u.id) as total_usuarios,
        COUNT(DISTINCT r.id) as total_regiones,
        COUNT(DISTINCT t.id) as tareas_activas,
        COUNT(DISTINCT u.rol) as roles_activos
      FROM usuarios u
      LEFT JOIN regiones r ON u.id_region = r.id
      LEFT JOIN tareas t ON t.estado NOT IN ('Finalizada - Aprobada', 'Cancelada')
      WHERE u.activo = 1
    `;

    const resumen = await new Promise((resolve, reject) => {
      db.get(resumenQuery, [], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    console.log('Superadmin Dashboard - Data retrieved:', { roles, resumen });

    res.json({
      success: true,
      data: {
        roles,
        resumen
      }
    });

  } catch (error) {
    console.error('Error en getDashboard:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
};

// Obtener detalles de un rol específico
const getRoleDetails = async (req, res) => {
  try {
    const { role } = req.params;
    console.log('Superadmin Role Details - Role:', role);

    // Obtener regiones donde existe este rol - mostrar usuarios únicos por región
    const regionesQuery = `
      SELECT 
        r.nombre,
        COUNT(DISTINCT u.id) as total_usuarios,
        0 as tareas_activas
      FROM regiones r
      LEFT JOIN usuario_regiones ur ON r.id = ur.id_region
      LEFT JOIN usuarios u ON ur.id_usuario = u.id AND u.rol = ? AND u.activo = 1
      GROUP BY r.id, r.nombre
      HAVING COUNT(DISTINCT u.id) > 0
      ORDER BY r.nombre
    `;

    const regiones = await new Promise((resolve, reject) => {
      db.all(regionesQuery, [role], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    // Obtener resumen del rol
    const resumenQuery = `
      SELECT 
        COUNT(DISTINCT u.id) as total_usuarios,
        COUNT(DISTINCT r.id) as total_regiones,
        COUNT(DISTINCT t.id) as tareas_activas
      FROM usuarios u
      LEFT JOIN regiones r ON u.id_region = r.id
      LEFT JOIN tareas t ON (
        (u.rol = 'proveedor' AND t.id_proveedor = u.id) OR
        (u.rol = 'inspector' AND t.id_inspector = u.id) OR
        (u.rol IN ('supervisor de mantenimiento', 'supervisor de disponibilidad', 'supervisor de soporte', 'supervisor de provision') AND t.id_inspector IN (
          SELECT id FROM usuarios WHERE id_supervisor = u.id
        )) OR
        (u.rol = 'administrativo' AND t.estado IN ('Pendiente Aprobación Administración', 'Pendiente Aprobación Gerente', 'Pendiente Aprobación CERCO')) OR
        (u.rol = 'gerente' AND t.estado IN ('Pendiente Aprobación Gerente', 'Pendiente Aprobación CERCO')) OR
        (u.rol = 'cerco' AND t.estado = 'Pendiente Aprobación CERCO')
      ) AND t.estado NOT IN ('Finalizada - Aprobada', 'Cancelada')
      WHERE u.rol = ? AND u.activo = 1
    `;

    const resumen = await new Promise((resolve, reject) => {
      db.get(resumenQuery, [role], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    console.log('Superadmin Role Details - Data retrieved:', { regiones, resumen });

    res.json({
      success: true,
      data: {
        regiones,
        resumen
      }
    });

  } catch (error) {
    console.error('Error en getRoleDetails:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
};

// Obtener usuarios de un rol en una región específica
const getRoleRegionUsers = async (req, res) => {
  try {
    const { role, region } = req.params;
    console.log('Superadmin Role Region Users - Role:', role, 'Region:', region);

    // Obtener usuarios del rol en la región específica usando la nueva tabla de relación
    const usuariosQuery = `
      SELECT 
        u.id,
        u.nombre_completo,
        u.email,
        u.rol,
        u.activo,
        r.nombre as region,
        COUNT(DISTINCT t.id) as tareas_activas
      FROM usuarios u
      INNER JOIN usuario_regiones ur ON u.id = ur.id_usuario
      INNER JOIN regiones r ON ur.id_region = r.id
      LEFT JOIN tareas t ON (
        (u.rol = 'proveedor' AND t.id_proveedor = u.id) OR
        (u.rol = 'inspector' AND t.id_inspector = u.id) OR
        (u.rol IN ('supervisor de mantenimiento', 'supervisor de disponibilidad', 'supervisor de soporte', 'supervisor de provision') AND t.id_inspector IN (
          SELECT id FROM usuarios WHERE id_supervisor = u.id
        )) OR
        (u.rol = 'administrativo' AND t.estado IN ('Pendiente Aprobación Administración', 'Pendiente Aprobación Gerente', 'Pendiente Aprobación CERCO')) OR
        (u.rol = 'gerente' AND t.estado IN ('Pendiente Aprobación Gerente', 'Pendiente Aprobación CERCO')) OR
        (u.rol = 'cerco' AND t.estado = 'Pendiente Aprobación CERCO')
      ) AND t.estado NOT IN ('Finalizada - Aprobada', 'Cancelada')
      WHERE u.rol = ? AND r.nombre = ? AND u.activo = 1
      GROUP BY u.id, u.nombre_completo, u.email, u.rol, u.activo, r.nombre
      ORDER BY u.nombre_completo
    `;

    const usuarios = await new Promise((resolve, reject) => {
      db.all(usuariosQuery, [role, region], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    console.log('Superadmin Role Region Users - Data retrieved:', { usuarios });

    res.json({
      success: true,
      data: {
        usuarios
      }
    });

  } catch (error) {
    console.error('Error en getRoleRegionUsers:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
};

// Obtener detalles de una región específica
const getRegionDetails = async (req, res) => {
  try {
    const { region } = req.params;
    console.log('Superadmin Region Details - Region:', region);

    // Obtener roles y usuarios de la región
    const rolesQuery = `
      SELECT 
        u.rol,
        COUNT(DISTINCT u.id) as total_usuarios,
        COUNT(DISTINCT t.id) as tareas_activas
      FROM usuarios u
      LEFT JOIN usuario_region ur ON u.id = ur.usuario_id
      LEFT JOIN regiones r ON ur.region_id = r.id
      LEFT JOIN tareas t ON t.region = r.nombre AND t.estado NOT IN ('Completada', 'Cancelada')
      WHERE r.nombre = ?
      GROUP BY u.rol
      ORDER BY u.rol
    `;

    const roles = await new Promise((resolve, reject) => {
      db.all(rolesQuery, [region], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    res.json({
      success: true,
      data: {
        region,
        roles
      }
    });

  } catch (error) {
    console.error('Error en getRegionDetails:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
};

// Obtener usuarios de un rol específico en una región
const getRoleUsers = async (req, res) => {
  try {
    const { region, role } = req.params;
    console.log('Superadmin Role Users - Region:', region, 'Role:', role);

    const usersQuery = `
      SELECT 
        u.id,
        u.nombre_completo,
        u.email,
        u.rol,
        r.nombre as region,
        COUNT(DISTINCT t.id) as tareas_activas
      FROM usuarios u
      LEFT JOIN usuario_region ur ON u.id = ur.usuario_id
      LEFT JOIN regiones r ON ur.region_id = r.id
      LEFT JOIN tareas t ON t.region = r.nombre AND t.estado NOT IN ('Completada', 'Cancelada')
      WHERE r.nombre = ? AND u.rol = ?
      GROUP BY u.id, u.nombre_completo, u.email, u.rol, r.nombre
      ORDER BY u.nombre_completo
    `;

    const users = await new Promise((resolve, reject) => {
      db.all(usersQuery, [region, role], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    res.json({
      success: true,
      data: {
        region,
        role,
        users
      }
    });

  } catch (error) {
    console.error('Error en getRoleUsers:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
};

// Obtener dashboard específico de un usuario
const getUserDashboard = async (req, res) => {
  try {
    const { role, region, userId } = req.params;
    console.log('Superadmin User Dashboard - Role:', role, 'Region:', region, 'UserId:', userId);

    // Obtener información del usuario usando la nueva tabla de relación
    const userQuery = `
      SELECT 
        u.id,
        u.nombre_completo,
        u.email,
        u.rol,
        u.activo,
        r.nombre as region
      FROM usuarios u
      INNER JOIN usuario_regiones ur ON u.id = ur.id_usuario
      INNER JOIN regiones r ON ur.id_region = r.id
      WHERE u.id = ? AND u.rol = ? AND r.nombre = ?
    `;

    const user = await new Promise((resolve, reject) => {
      db.get(userQuery, [userId, role, region], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Usuario no encontrado'
      });
    }

    // Obtener tareas del usuario según su rol
    let tareasQuery = '';
    let tareasParams = [];

    switch (role) {
      case 'inspector':
        tareasQuery = `
          SELECT t.*, p.nombre as proveedor_nombre, r.nombre as region
          FROM tareas t
          LEFT JOIN proveedores p ON t.id_proveedor = p.id
          LEFT JOIN regiones r ON t.region = r.nombre
          WHERE t.id_inspector = ?
          ORDER BY t.fecha_creacion DESC
        `;
        tareasParams = [userId];
        break;
      
      case 'supervisor de mantenimiento':
        tareasQuery = `
          SELECT t.*, p.nombre as proveedor_nombre, i.nombre_completo as inspector_nombre, r.nombre as region
          FROM tareas t
          LEFT JOIN proveedores p ON t.id_proveedor = p.id
          LEFT JOIN usuarios i ON t.id_inspector = i.id
          LEFT JOIN regiones r ON t.region = r.nombre
          WHERE i.id_supervisor = ?
          ORDER BY t.fecha_creacion DESC
        `;
        tareasParams = [userId];
        break;
      
      default:
        tareasQuery = `
          SELECT t.*, p.nombre as proveedor_nombre, i.nombre_completo as inspector_nombre, r.nombre as region
          FROM tareas t
          LEFT JOIN proveedores p ON t.id_proveedor = p.id
          LEFT JOIN usuarios i ON t.id_inspector = i.id
          LEFT JOIN regiones r ON t.region = r.nombre
          WHERE r.nombre = ?
          ORDER BY t.fecha_creacion DESC
        `;
        tareasParams = [region];
    }

    const tareas = await new Promise((resolve, reject) => {
      db.all(tareasQuery, tareasParams, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    res.json({
      success: true,
      data: {
        user,
        tareas,
        region,
        role
      }
    });

  } catch (error) {
    console.error('Error en getUserDashboard:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
};

// Obtener todos los usuarios del sistema
const getAllUsers = async (req, res) => {
  try {
    const usersQuery = `
      SELECT 
        u.*,
        GROUP_CONCAT(r.nombre, ', ') as regiones
      FROM usuarios u
      LEFT JOIN usuario_region ur ON u.id = ur.usuario_id
      LEFT JOIN regiones r ON ur.region_id = r.id
      GROUP BY u.id
      ORDER BY u.nombre_completo
    `;

    const users = await new Promise((resolve, reject) => {
      db.all(usersQuery, [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    res.json({
      success: true,
      data: { users }
    });

  } catch (error) {
    console.error('Error en getAllUsers:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
};

// Obtener todas las tareas del sistema
const getAllTasks = async (req, res) => {
  try {
    console.log('Superadmin All Tasks - Starting query');
    
    // Consulta simplificada primero
    const tasksQuery = `
      SELECT 
        t.id,
        t.id_tarea_texto,
        t.descripcion,
        t.estado,
        t.region,
        t.fecha_creacion,
        u_proveedor.nombre_completo as proveedor_nombre,
        u_inspector.nombre_completo as inspector_nombre
      FROM tareas t
      LEFT JOIN usuarios u_proveedor ON t.id_proveedor = u_proveedor.id
      LEFT JOIN usuarios u_inspector ON t.id_inspector = u_inspector.id
      ORDER BY t.fecha_creacion DESC
    `;

    const tasks = await new Promise((resolve, reject) => {
      db.all(tasksQuery, [], (err, rows) => {
        if (err) {
          console.error('Error en consulta de tareas:', err);
          reject(err);
        } else {
          console.log('Tareas encontradas:', rows?.length || 0);
          resolve(rows);
        }
      });
    });

    console.log('Superadmin All Tasks - Tasks retrieved:', tasks?.length || 0);

    res.json({
      success: true,
      data: { tasks: tasks || [] }
    });

  } catch (error) {
    console.error('Error en getAllTasks:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
};

// Obtener reportes del sistema
const getReports = async (req, res) => {
  try {
    console.log('=== FUNCIÓN GETREPORTS EJECUTÁNDOSE ===');
    console.log('Superadmin Reports - Getting reports data');

    // Obtener resumen general para reportes - consultas separadas
    const totalUsuarios = await new Promise((resolve, reject) => {
      db.get('SELECT COUNT(*) as count FROM usuarios WHERE activo = 1', [], (err, row) => {
        if (err) reject(err);
        else resolve(row?.count || 0);
      });
    });

    const totalRegiones = await new Promise((resolve, reject) => {
      db.get('SELECT COUNT(*) as count FROM regiones', [], (err, row) => {
        if (err) reject(err);
        else resolve(row?.count || 0);
      });
    });

    const totalTareas = await new Promise((resolve, reject) => {
      db.get('SELECT COUNT(*) as count FROM tareas', [], (err, row) => {
        if (err) reject(err);
        else resolve(row?.count || 0);
      });
    });

    const rolesActivos = await new Promise((resolve, reject) => {
      db.get('SELECT COUNT(DISTINCT rol) as count FROM usuarios WHERE activo = 1', [], (err, row) => {
        if (err) reject(err);
        else resolve(row?.count || 0);
      });
    });

    const resumen = {
      total_usuarios: totalUsuarios,
      total_regiones: totalRegiones,
      total_tareas: totalTareas,
      roles_activos: rolesActivos
    };

    // Obtener reportes recientes (placeholder)
    const reportes_recientes = [];

    console.log('Superadmin Reports - Data retrieved:', { resumen, reportes_recientes });
    console.log('Superadmin Reports - Resumen details:', resumen);
    console.log('Superadmin Reports - Total usuarios:', totalUsuarios);
    console.log('Superadmin Reports - Total regiones:', totalRegiones);
    console.log('Superadmin Reports - Total tareas:', totalTareas);

    res.json({
      success: true,
      data: {
        resumen,
        reportes_recientes
      }
    });

  } catch (error) {
    console.error('Error en getReports:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
};

// Placeholder para configuración
const getSettings = async (req, res) => {
  res.json({
    success: true,
    data: { message: 'Configuración en desarrollo' }
  });
};

const updateSettings = async (req, res) => {
  res.json({
    success: true,
    data: { message: 'Configuración actualizada' }
  });
};

// Generar reporte de tareas
const generateTaskReport = async (req, res) => {
  try {
    console.log('Generando reporte de tareas...');
    
    const tasksQuery = `
      SELECT 
        t.id,
        t.id_tarea_texto,
        t.descripcion,
        t.estado,
        t.region,
        t.fecha_creacion,
        t.fecha_inicio,
        t.fecha_cierre_proveedor,
        t.fecha_aprobacion_final,
        t.fecha_fin,
        u_proveedor.nombre_completo as proveedor_nombre,
        u_inspector.nombre_completo as inspector_nombre,
        u_supervisor.nombre_completo as supervisor_nombre
      FROM tareas t
      LEFT JOIN usuarios u_proveedor ON t.id_proveedor = u_proveedor.id
      LEFT JOIN usuarios u_inspector ON t.id_inspector = u_inspector.id
      LEFT JOIN usuarios u_supervisor ON u_inspector.id_supervisor = u_supervisor.id
      ORDER BY t.fecha_creacion DESC
    `;

    const tasks = await new Promise((resolve, reject) => {
      db.all(tasksQuery, [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });

    // Estadísticas por estado
    const statsQuery = `
      SELECT 
        estado,
        COUNT(*) as cantidad
      FROM tareas 
      GROUP BY estado
      ORDER BY cantidad DESC
    `;

    const stats = await new Promise((resolve, reject) => {
      db.all(statsQuery, [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });

    res.json({
      success: true,
      data: {
        tipo: 'Reporte de Tareas',
        fecha_generacion: new Date().toISOString(),
        resumen: {
          total_tareas: tasks.length,
          estadisticas_por_estado: stats
        },
        tareas: tasks
      }
    });
  } catch (error) {
    console.error('Error generando reporte de tareas:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
};

// Generar reporte de usuarios
const generateUserReport = async (req, res) => {
  try {
    console.log('Generando reporte de usuarios...');
    
    const usersQuery = `
      SELECT 
        u.id,
        u.nombre_completo,
        u.email,
        u.rol,
        u.activo,
        u.fecha_creacion,
        r.nombre as region_nombre,
        COUNT(DISTINCT t.id) as tareas_asignadas
      FROM usuarios u
      LEFT JOIN usuario_regiones ur ON u.id = ur.id_usuario
      LEFT JOIN regiones r ON ur.id_region = r.id
      LEFT JOIN tareas t ON (
        (u.rol = 'proveedor' AND t.id_proveedor = u.id) OR
        (u.rol = 'inspector' AND t.id_inspector = u.id)
      )
      WHERE u.activo = 1
      GROUP BY u.id, u.nombre_completo, u.email, u.rol, u.activo, u.fecha_creacion, r.nombre
      ORDER BY u.rol, u.nombre_completo
    `;

    const users = await new Promise((resolve, reject) => {
      db.all(usersQuery, [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });

    // Estadísticas por rol
    const roleStatsQuery = `
      SELECT 
        rol,
        COUNT(*) as cantidad,
        SUM(CASE WHEN activo = 1 THEN 1 ELSE 0 END) as activos
      FROM usuarios 
      GROUP BY rol
      ORDER BY cantidad DESC
    `;

    const roleStats = await new Promise((resolve, reject) => {
      db.all(roleStatsQuery, [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });

    res.json({
      success: true,
      data: {
        tipo: 'Reporte de Usuarios',
        fecha_generacion: new Date().toISOString(),
        resumen: {
          total_usuarios: users.length,
          estadisticas_por_rol: roleStats
        },
        usuarios: users
      }
    });
  } catch (error) {
    console.error('Error generando reporte de usuarios:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
};

// Generar reporte por región
const generateRegionReport = async (req, res) => {
  try {
    console.log('Generando reporte por región...');
    
    const regionQuery = `
      SELECT 
        r.id,
        r.nombre,
        COUNT(DISTINCT ur.id_usuario) as total_usuarios,
        COUNT(DISTINCT t.id) as total_tareas,
        COUNT(DISTINCT CASE WHEN t.estado = 'Finalizada - Aprobada' THEN t.id END) as tareas_finalizadas,
        COUNT(DISTINCT CASE WHEN t.estado NOT IN ('Finalizada - Aprobada', 'Cancelada') THEN t.id END) as tareas_activas
      FROM regiones r
      LEFT JOIN usuario_regiones ur ON r.id = ur.id_region
      LEFT JOIN usuarios u ON ur.id_usuario = u.id AND u.activo = 1
      LEFT JOIN tareas t ON t.region = r.nombre
      GROUP BY r.id, r.nombre
      ORDER BY r.nombre
    `;

    const regions = await new Promise((resolve, reject) => {
      db.all(regionQuery, [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });

    res.json({
      success: true,
      data: {
        tipo: 'Reporte por Región',
        fecha_generacion: new Date().toISOString(),
        resumen: {
          total_regiones: regions.length
        },
        regiones: regions
      }
    });
  } catch (error) {
    console.error('Error generando reporte por región:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
};

// Generar reporte por rol
const generateRoleReport = async (req, res) => {
  try {
    console.log('Generando reporte por rol...');
    
    const roleQuery = `
      SELECT 
        u.rol,
        COUNT(DISTINCT u.id) as total_usuarios,
        COUNT(DISTINCT t.id) as tareas_asignadas,
        COUNT(DISTINCT CASE WHEN t.estado = 'Finalizada - Aprobada' THEN t.id END) as tareas_finalizadas,
        COUNT(DISTINCT CASE WHEN t.estado NOT IN ('Finalizada - Aprobada', 'Cancelada') THEN t.id END) as tareas_activas
      FROM usuarios u
      LEFT JOIN tareas t ON (
        (u.rol = 'proveedor' AND t.id_proveedor = u.id) OR
        (u.rol = 'inspector' AND t.id_inspector = u.id) OR
        (u.rol IN ('supervisor de mantenimiento', 'supervisor de disponibilidad', 'supervisor de soporte', 'supervisor de provision') AND t.id_inspector IN (
          SELECT id FROM usuarios WHERE id_supervisor = u.id
        )) OR
        (u.rol = 'administrativo' AND t.estado IN ('Pendiente Aprobación Administración', 'Pendiente Aprobación Gerente', 'Pendiente Aprobación CERCO')) OR
        (u.rol = 'gerente' AND t.estado IN ('Pendiente Aprobación Gerente', 'Pendiente Aprobación CERCO')) OR
        (u.rol = 'cerco' AND t.estado = 'Pendiente Aprobación CERCO')
      )
      WHERE u.activo = 1
      GROUP BY u.rol
      ORDER BY total_usuarios DESC
    `;

    const roles = await new Promise((resolve, reject) => {
      db.all(roleQuery, [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });

    res.json({
      success: true,
      data: {
        tipo: 'Reporte por Rol',
        fecha_generacion: new Date().toISOString(),
        resumen: {
          total_roles: roles.length
        },
        roles: roles
      }
    });
  } catch (error) {
    console.error('Error generando reporte por rol:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
};

// Generar reporte de rendimiento
const generatePerformanceReport = async (req, res) => {
  try {
    console.log('Generando reporte de rendimiento...');
    
    // Tiempo promedio de procesamiento por estado
    const performanceQuery = `
      SELECT 
        estado,
        COUNT(*) as cantidad,
        AVG(CASE 
          WHEN fecha_fin IS NOT NULL 
          THEN (julianday(fecha_fin) - julianday(fecha_creacion)) * 24 
          ELSE NULL 
        END) as tiempo_promedio_horas
      FROM tareas 
      WHERE fecha_creacion IS NOT NULL
      GROUP BY estado
      ORDER BY cantidad DESC
    `;

    const performance = await new Promise((resolve, reject) => {
      db.all(performanceQuery, [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });

    // Tareas por mes
    const monthlyQuery = `
      SELECT 
        strftime('%Y-%m', fecha_creacion) as mes,
        COUNT(*) as tareas_creadas,
        COUNT(CASE WHEN estado = 'Finalizada - Aprobada' THEN 1 END) as tareas_finalizadas
      FROM tareas 
      WHERE fecha_creacion IS NOT NULL
      GROUP BY strftime('%Y-%m', fecha_creacion)
      ORDER BY mes DESC
      LIMIT 12
    `;

    const monthly = await new Promise((resolve, reject) => {
      db.all(monthlyQuery, [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });

    res.json({
      success: true,
      data: {
        tipo: 'Reporte de Rendimiento',
        fecha_generacion: new Date().toISOString(),
        resumen: {
          total_estados: performance.length
        },
        rendimiento_por_estado: performance,
        tendencia_mensual: monthly
      }
    });
  } catch (error) {
    console.error('Error generando reporte de rendimiento:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
};

// Generar reporte temporal
const generateTemporalReport = async (req, res) => {
  try {
    console.log('Generando reporte temporal...');
    
    // Tareas por día de la semana
    const weeklyQuery = `
      SELECT 
        CASE strftime('%w', fecha_creacion)
          WHEN '0' THEN 'Domingo'
          WHEN '1' THEN 'Lunes'
          WHEN '2' THEN 'Martes'
          WHEN '3' THEN 'Miércoles'
          WHEN '4' THEN 'Jueves'
          WHEN '5' THEN 'Viernes'
          WHEN '6' THEN 'Sábado'
        END as dia_semana,
        COUNT(*) as cantidad
      FROM tareas 
      WHERE fecha_creacion IS NOT NULL
      GROUP BY strftime('%w', fecha_creacion)
      ORDER BY strftime('%w', fecha_creacion)
    `;

    const weekly = await new Promise((resolve, reject) => {
      db.all(weeklyQuery, [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });

    // Tareas por hora del día
    const hourlyQuery = `
      SELECT 
        strftime('%H', fecha_creacion) as hora,
        COUNT(*) as cantidad
      FROM tareas 
      WHERE fecha_creacion IS NOT NULL
      GROUP BY strftime('%H', fecha_creacion)
      ORDER BY hora
    `;

    const hourly = await new Promise((resolve, reject) => {
      db.all(hourlyQuery, [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });

    // Tendencias por mes (últimos 6 meses)
    const trendsQuery = `
      SELECT 
        strftime('%Y-%m', fecha_creacion) as mes,
        COUNT(*) as tareas_creadas,
        COUNT(CASE WHEN estado = 'Finalizada - Aprobada' THEN 1 END) as tareas_finalizadas,
        ROUND(COUNT(CASE WHEN estado = 'Finalizada - Aprobada' THEN 1 END) * 100.0 / COUNT(*), 2) as porcentaje_completado
      FROM tareas 
      WHERE fecha_creacion >= date('now', '-6 months')
      GROUP BY strftime('%Y-%m', fecha_creacion)
      ORDER BY mes DESC
    `;

    const trends = await new Promise((resolve, reject) => {
      db.all(trendsQuery, [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });

    res.json({
      success: true,
      data: {
        tipo: 'Reporte Temporal',
        fecha_generacion: new Date().toISOString(),
        resumen: {
          patrones_semanales: weekly.length,
          patrones_horarios: hourly.length,
          tendencias_mensuales: trends.length
        },
        patrones_semanales: weekly,
        patrones_horarios: hourly,
        tendencias_mensuales: trends
      }
    });
  } catch (error) {
    console.error('Error generando reporte temporal:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
};

// Función para obtener datos crudos de tareas
const getRawTasksData = (req, res) => {
  console.log('Superadmin - Obteniendo datos crudos de tareas');
  
  const query = `
    SELECT 
      t.*,
      u_inspector.nombre_completo as inspector_nombre,
      u_proveedor.nombre_completo as proveedor_nombre
    FROM tareas t
    LEFT JOIN usuarios u_inspector ON t.id_inspector = u_inspector.id
    LEFT JOIN usuarios u_proveedor ON t.id_proveedor = u_proveedor.id
    ORDER BY t.fecha_creacion DESC
  `;
  
  db.all(query, (err, tareas) => {
    if (err) {
      console.error('Error obteniendo datos crudos de tareas:', err);
      return res.status(500).json({
        success: false,
        error: 'Error interno del servidor al obtener datos de tareas'
      });
    }
    
    console.log(`Superadmin - Obtenidas ${tareas.length} tareas crudas`);
    console.log('Tipo de tareas:', typeof tareas);
    console.log('Es array tareas:', Array.isArray(tareas));
    console.log('Primeras 2 tareas:', tareas.slice(0, 2));
    
    const response = {
      success: true,
      data: {
        tareas: tareas,
        total: tareas.length,
        fecha_exportacion: new Date().toISOString()
      }
    };
    
    console.log('Respuesta que se enviará:', JSON.stringify(response, null, 2));
    
    res.json(response);
  });
};

// Función para obtener datos crudos del historial
const getRawHistorialData = (req, res) => {
  console.log('Superadmin - Obteniendo datos crudos del historial');
  
  const query = `
    SELECT 
      h.*,
      u.nombre_completo as usuario_nombre
    FROM historial_tareas h
    LEFT JOIN usuarios u ON h.id_usuario = u.id
    ORDER BY h.fecha_evento DESC
  `;
  
  db.all(query, (err, historial) => {
    if (err) {
      console.error('Error obteniendo datos crudos del historial:', err);
      return res.status(500).json({
        success: false,
        error: 'Error interno del servidor al obtener datos del historial'
      });
    }
    
    console.log(`Superadmin - Obtenidos ${historial.length} registros de historial crudos`);
    console.log('Tipo de historial:', typeof historial);
    console.log('Es array historial:', Array.isArray(historial));
    console.log('Primeros 2 registros:', historial.slice(0, 2));
    
    const response = {
      success: true,
      data: {
        historial: historial,
        total: historial.length,
        fecha_exportacion: new Date().toISOString()
      }
    };
    
    console.log('Respuesta que se enviará:', JSON.stringify(response, null, 2));
    
    res.json(response);
  });
};

// Función para obtener datos crudos completos (tareas + historial)
const getRawCompleteData = async (req, res) => {
  try {
    console.log('Superadmin - Obteniendo datos crudos completos');
    
    // Obtener tareas
    const tareasQuery = `
      SELECT 
        t.*,
        u_inspector.nombre_completo as inspector_nombre,
        u_proveedor.nombre_completo as proveedor_nombre
      FROM tareas t
      LEFT JOIN usuarios u_inspector ON t.id_inspector = u_inspector.id
      LEFT JOIN usuarios u_proveedor ON t.id_proveedor = u_proveedor.id
      ORDER BY t.fecha_creacion DESC
    `;
    
    // Obtener historial
    const historialQuery = `
      SELECT 
        h.*,
        u.nombre_completo as usuario_nombre
      FROM historial_tareas h
      LEFT JOIN usuarios u ON h.id_usuario = u.id
      ORDER BY h.fecha_evento DESC
    `;
    
    const [tareas, historial] = await Promise.all([
      db.all(tareasQuery),
      db.all(historialQuery)
    ]);
    
    console.log(`Superadmin - Obtenidos ${tareas.length} tareas y ${historial.length} registros de historial crudos`);
    
    res.json({
      success: true,
      data: {
        tareas: tareas,
        historial: historial,
        total_tareas: tareas.length,
        total_historial: historial.length,
        fecha_exportacion: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('Error obteniendo datos crudos completos:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor al obtener datos completos'
    });
  }
};

module.exports = {
  getDashboard,
  getRoleDetails,
  getRoleRegionUsers,
  getRegionDetails,
  getRoleUsers,
  getUserDashboard,
  getAllUsers,
  getAllTasks,
  getReports,
  getSettings,
  updateSettings,
  generateTaskReport,
  generateUserReport,
  generateRegionReport,
  generateRoleReport,
  generatePerformanceReport,
  generateTemporalReport,
  getRawTasksData,
  getRawHistorialData,
  getRawCompleteData,
};
