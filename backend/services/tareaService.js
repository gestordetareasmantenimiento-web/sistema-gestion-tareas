const db = require('../db/database');
const { ROLES, SUPERVISOR_ROLES } = require('../utils/roles');
const historialService = require('./historialService');
const regionService = require('./regionService');
const costoMinimoService = require('./costoMinimoService');
const cuadrillaModeloService = require('./cuadrillaModeloService');

// =================================================================
// --- LÓGICA DE DATOS PRINCIPAL ---
// =================================================================


const getAllTareas = async (req, res) => {
  const userData = req.user;
  if (!userData || !userData.rol) {
    return res.status(401).json({ error: 'Usuario no autenticado o sin rol.' });
  }
  
  const { id, rol, id_proveedor } = userData;
  const userRol = rol.toLowerCase();
  
  // Obtener regiones del usuario
  let userRegions = [];
  try {
    userRegions = await regionService.getUserRegions(id);
  } catch (error) {
    console.error('Error obteniendo regiones del usuario:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }

    const baseQuery = `
      SELECT 
        t.*,
        prov.nombre as proveedor_nombre,
        prov.razon_social as proveedor_razon_social,
        prov.centro as proveedor_centro,
        prov.almacen as proveedor_almacen,
        insp.nombre_completo as inspector_nombre,
        insp.id_supervisor as inspector_supervisor_id,
        sup.nombre_completo as supervisor_nombre,
        r.nombre as region
      FROM tareas t
      LEFT JOIN proveedores prov ON t.id_proveedor = prov.id
      LEFT JOIN usuarios insp ON t.id_inspector = insp.id
      LEFT JOIN usuarios sup ON insp.id_supervisor = sup.id
      LEFT JOIN regiones r ON t.id_region = r.id
    `;

    const rolConfig = {
      [ROLES.PROVEEDOR]: {
        whereClause: 'WHERE t.id_proveedor = ?',
        getParams: () => [id_proveedor],
        grouping: (tareas) => ({
          todas: tareas, // Mostrar todas las tareas del proveedor
          pendientes: tareas.filter(t => t.estado === 'Asignada'),
          certificadas: tareas.filter(t => t.estado === 'Pendiente Certificación Inspector' || t.estado === 'Pendiente Certificación Inspector/Supervisor'),
          enAprobacion: tareas.filter(t => [
            'Pendiente Aprobación Supervisor',
            'Pendiente Aprobación Administración', 
            'Pendiente Aprobación Gerente',
            'Pendiente Aprobación CERCO'
          ].includes(t.estado)),
          observados: tareas.filter(t => t.estado.toLowerCase().includes('observada')),
          finalizadas: tareas.filter(t => t.estado === 'Finalizada - Aprobada'),
          canceladas: tareas.filter(t => t.estado === 'Cancelada')
        })
      },
      [ROLES.INSPECTOR]: {
        whereClause: 'WHERE t.id_inspector = ?',
        getParams: () => [id],
        grouping: (tareas) => ({
          todas: tareas, // Mostrar todas las tareas creadas por el inspector
          pendientes: tareas.filter(t => t.estado === 'Asignada'),
          pendientesDeCertificacion: tareas.filter(t => t.estado === 'Pendiente Certificación Inspector' || t.estado === 'Pendiente Certificación Inspector/Supervisor'),
          aprobados: tareas.filter(t => ['Pendiente Aprobación Supervisor', 'Pendiente Aprobación Administración', 'Pendiente Aprobación Gerente', 'Pendiente Aprobación CERCO'].includes(t.estado)),
          observados: tareas.filter(t => t.estado.toLowerCase().includes('observada')),
          finalizadas: tareas.filter(t => t.estado === 'Finalizada - Aprobada'),
          canceladas: tareas.filter(t => t.estado === 'Cancelada')
        })
      },
      [ROLES.SUPERVISOR_MANTENIMIENTO]: {
        whereClause: 'WHERE (t.id_inspector = ? OR insp.id_supervisor = ?)',
        getParams: () => [id, id], // Incluir tareas creadas por el supervisor Y tareas de sus inspectores
        grouping: (tareas) => ({
          todas: tareas, // Mostrar todas las tareas del supervisor y sus inspectores
          pendientesDeProveedor: tareas.filter(t => t.estado === 'Asignada'),
          pendientesDeCertificacion: tareas.filter(t => t.estado === 'Pendiente Certificación Inspector' || t.estado === 'Pendiente Certificación Inspector/Supervisor'),
          pendientesDeAprobacion: tareas.filter(t => t.estado === 'Pendiente Aprobación Supervisor'),
          enCircuito: tareas.filter(t => !['Asignada', 'Pendiente Certificación Inspector', 'Pendiente Certificación Inspector/Supervisor', 'Pendiente Aprobación Supervisor'].includes(t.estado)),
          observados: tareas.filter(t => t.estado.toLowerCase().includes('observada')),
          finalizadas: tareas.filter(t => t.estado === 'Finalizada - Aprobada'),
          canceladas: tareas.filter(t => t.estado === 'Cancelada')
        })
      },
      [ROLES.ADMINISTRATIVO]: {
        whereClause: userRegions.length > 0 ? `WHERE t.id_region IN (${userRegions.map(() => '?').join(', ')})` : 'WHERE 1=0',
        getParams: () => userRegions.map(r => r.id),
        grouping: (tareas) => ({
          todas: tareas, // Mostrar todas las tareas de la región
          pendientesDeWo: tareas.filter(t => !t.numero_wo && t.estado === 'Asignada'),
          pendientesDeAprobacion: tareas.filter(t => t.estado === 'Pendiente Aprobación Administración'),
          tareasGeneradas: tareas.filter(t => t.numero_wo && ['Asignada', 'Pendiente Certificación Inspector', 'Pendiente Certificación Inspector/Supervisor'].includes(t.estado)),
          aprobadasPorAdmin: tareas.filter(t => ['Pendiente Aprobación Gerente', 'Pendiente Aprobación CERCO', 'Finalizada - Aprobada'].includes(t.estado)),
          observados: tareas.filter(t => t.estado.toLowerCase().includes('observada')),
          finalizadas: tareas.filter(t => t.estado === 'Finalizada - Aprobada'),
          canceladas: tareas.filter(t => t.estado === 'Cancelada')
        })
      },
      [ROLES.GERENTE]: {
        whereClause: userRegions.length > 0 ? `WHERE t.id_region IN (${userRegions.map(() => '?').join(', ')})` : 'WHERE 1=0',
        getParams: () => userRegions.map(r => r.id),
        grouping: (tareas) => ({
          todas: tareas, // Mostrar todas las tareas de la región
          pendientesDeAutorizacion: tareas.filter(t => t.estado === 'Pendiente Aprobación Gerente'), // Filtro por defecto
          pendientesDeAprobacion: tareas.filter(t => t.estado === 'Pendiente Aprobación Administración'),
          enCircuito: tareas.filter(t => !['Pendiente Aprobación Gerente', 'Pendiente Aprobación Administración'].includes(t.estado)),
          observados: tareas.filter(t => t.estado.toLowerCase().includes('observada')),
          finalizadas: tareas.filter(t => t.estado === 'Finalizada - Aprobada'),
          canceladas: tareas.filter(t => t.estado === 'Cancelada'),
          // Para el gerente, mostrar por defecto las pendientes de autorización
          porDefecto: tareas.filter(t => t.estado === 'Pendiente Aprobación Gerente')
        })
      },
      [ROLES.CERCO]: {
        whereClause: '', // Sin filtros - ver todo globalmente
        getParams: () => [],
        grouping: (tareas) => ({
          todas: tareas, // Mostrar todas las tareas globalmente
          pendientesDeRevisionFinal: tareas.filter(t => t.estado === 'Pendiente Aprobación CERCO'),
          observados: tareas.filter(t => t.estado === 'Observada por CERCO'),
          pasadasAPago: tareas.filter(t => t.estado === 'Finalizada - Aprobada'),
          enCircuito: tareas.filter(t => !['Pendiente Aprobación CERCO', 'Observada por CERCO', 'Finalizada - Aprobada'].includes(t.estado)),
          canceladas: tareas.filter(t => t.estado === 'Cancelada')
        })
      }
    };
  
    const supervisorRegionalConfig = {
        whereClause: userRegions.length > 0 ? `WHERE t.id_region IN (${userRegions.map(() => '?').join(', ')})` : 'WHERE 1=0',
        getParams: () => userRegions.map(r => r.id),
        grouping: (tareas) => ({ 
          todas: tareas, // Mostrar todas las tareas de la región
          pendientes: tareas.filter(t => t.estado === 'Asignada'),
          pendientesDeCertificacion: tareas.filter(t => t.estado === 'Pendiente Certificación Inspector' || t.estado === 'Pendiente Certificación Inspector/Supervisor'),
          pendientesDeAprobacion: tareas.filter(t => t.estado === 'Pendiente Aprobación Supervisor'),
          enCircuito: tareas.filter(t => !['Asignada', 'Pendiente Certificación Inspector', 'Pendiente Certificación Inspector/Supervisor', 'Pendiente Aprobación Supervisor'].includes(t.estado)),
          observados: tareas.filter(t => t.estado.toLowerCase().includes('observada')),
          finalizadas: tareas.filter(t => t.estado === 'Finalizada - Aprobada'),
          canceladas: tareas.filter(t => t.estado === 'Cancelada')
        })
    };
  
    let config;
    if (SUPERVISOR_ROLES.includes(userRol) && userRol !== ROLES.SUPERVISOR_MANTENIMIENTO) {
        config = supervisorRegionalConfig;
    } else {
        config = rolConfig[userRol];
    }
  
    if (!config) {
      return resolve({});
    }
  
    const sql = `${baseQuery} ${config.whereClause}`;
    const params = config.getParams();
    
    // Debug logging
    console.log('SQL Query:', sql);
    console.log('Params:', params);
    console.log('User ID:', id, 'User Role:', userRol);
  
    db.all(sql, params, (err, tareas) => {
      if (err) {
        console.error('Error al obtener tareas:', err);
        return res.status(500).json({ error: 'Error al obtener las tareas.' });
      }
      console.log('Tareas encontradas:', tareas.length);
      console.log('Primeras tareas:', tareas.slice(0, 3));
      const columnas = config.grouping(tareas);
      console.log('Columnas agrupadas:', columnas);
      res.json({ message: "success", data: columnas });
    });
};

const getTareaById = (req, res) => {
  const { id } = req.params;
  const sql = `
    SELECT 
      t.*,
      prov.razon_social as proveedor_nombre,
      prov.centro as proveedor_centro,
      prov.almacen as proveedor_almacen,
      insp.nombre_completo as inspector_nombre,
      sup.nombre_completo as supervisor_nombre
    FROM tareas t
    LEFT JOIN proveedores prov ON t.id_proveedor = prov.id
    LEFT JOIN usuarios insp ON t.id_inspector = insp.id
    LEFT JOIN usuarios sup ON insp.id_supervisor = sup.id
    WHERE t.id = ?
  `;
  db.get(sql, [id], (err, row) => {
    if (err) {
      console.error('Error al obtener tarea:', err);
      return res.status(500).json({ error: 'Error al obtener la tarea.' });
    }
    if (!row) {
      return res.status(404).json({ error: 'Tarea no encontrada.' });
    }
    res.json({ message: "success", data: row });
  });
};

const createTarea = async (req, res) => {
  try {
    const { descripcion, direccion, id_inspector, id_proveedor, id_region } = req.body;
    const id_usuario_creador = req.user.id;
    const { rol: rol_usuario } = req.user;
    
    if (!descripcion || !direccion || !id_inspector || !id_proveedor || !id_region) {
      return res.status(400).json({ error: "Faltan datos obligatorios." });
    }
    
    // Validar que el usuario puede crear tareas en esta región
    const puedeCrearTarea = await regionService.validarPermisoCreacionTarea(id_usuario_creador, id_region, rol_usuario);
    if (!puedeCrearTarea) {
      return res.status(403).json({ error: "No tienes permiso para crear tareas en esta región." });
    }
    
    const id_tarea_texto = `TAREA-${Date.now()}`;
    const id_tarea_creada = await new Promise((resolve, reject) => {
      const sql = `INSERT INTO tareas (id_tarea_texto, estado, descripcion, direccion, id_region, id_inspector, id_proveedor) VALUES (?, ?, ?, ?, ?, ?, ?)`;
      db.run(sql, [id_tarea_texto, "Asignada", descripcion, direccion, id_region, id_inspector, id_proveedor], function(err) {
        if (err) reject(err);
        else resolve(this.lastID);
      });
    });
    
    // Procesar archivos adjuntos si existen
    if (req.files && req.files.length > 0) {
      for (const archivo of req.files) {
        await new Promise((resolve, reject) => {
          const sql = `INSERT INTO tarea_adjuntos (id_tarea, nombre_archivo, url_archivo) VALUES (?, ?, ?)`;
          db.run(sql, [id_tarea_creada, archivo.originalname, `/uploads/${archivo.filename}`], function(err) {
            if (err) reject(err);
            else resolve(this.lastID);
          });
        });
      }
    }
    
    await historialService.registrar(id_tarea_creada, id_usuario_creador, 'Creación', `Tarea creada y asignada.`);
    res.status(201).json({ message: "Tarea creada exitosamente", data: { id: id_tarea_creada } });
    
  } catch (error) {
    console.error('Error al crear tarea:', error);
    res.status(500).json({ error: 'Error interno del servidor al crear la tarea.' });
  }
};

const updateTarea = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado, numero_wo, id_proveedor } = req.body;
    const { id: id_usuario, rol } = req.user;
    

    if (rol === ROLES.ADMINISTRATIVO && estado) {
        return res.status(400).json({ error: "El rol administrativo solo puede modificar el Número de WO." });
    }
    if (!estado && (numero_wo === undefined || numero_wo === null) && !id_proveedor) {
        return res.status(400).json({ error: "No se proporcionaron datos para actualizar." });
    }

    const row = await new Promise((resolve, reject) => {
        db.get(`SELECT estado, numero_wo FROM tareas WHERE id = ?`, [id], (err, row) => err ? reject(err) : resolve(row));
    });

    if (!row) {
        return res.status(404).json({ error: 'Tarea no encontrada.' });
    }

    const valorAnteriorWo = row.numero_wo;
    let setClauses = [], params = [];
    
    // Validar estados válidos
    const estadosValidos = [
        'Asignada', 'Pendiente Certificación Inspector', 'Pendiente Aprobación Supervisor',
        'Pendiente Aprobación Administración', 'Pendiente Aprobación Gerente', 
        'Pendiente Aprobación CERCO', 'Finalizada - Aprobada', 'Observada por Inspector',
        'Observada por Supervisor', 'Observada por Administración', 'Observada por Gerente',
        'Observada por CERCO', 'Cancelada'
    ];
    
    if (estado) {
        if (!estadosValidos.includes(estado)) {
            return res.status(400).json({ error: 'Estado inválido. Estados válidos: ' + estadosValidos.join(', ') });
        }
        setClauses.push("estado = ?");
        params.push(estado);
    }
    
    if (numero_wo !== undefined && numero_wo !== null) {
        // Validar que el número de WO no esté duplicado
        const woExistente = await new Promise((resolve, reject) => {
            db.get(`SELECT id, id_tarea_texto FROM tareas WHERE numero_wo = ? AND id != ?`, [numero_wo, id], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
        
        if (woExistente) {
            return res.status(400).json({ 
                error: `El número de WO "${numero_wo}" ya está asignado a la tarea ${woExistente.id_tarea_texto}. No se permiten números de WO duplicados.` 
            });
        }
        
        setClauses.push("numero_wo = ?");
        params.push(numero_wo);
    }
    
    if (id_proveedor) {
        setClauses.push("id_proveedor = ?");
        params.push(id_proveedor);
    }
    
    if (setClauses.length === 0) {
        return res.status(400).json({ error: "No se proporcionaron datos válidos para actualizar." });
    }
    
    params.push(id);

    const changes = await new Promise((resolve, reject) => {
        const sql = `UPDATE tareas SET ${setClauses.join(", ")} WHERE id = ?`;
        db.run(sql, params, function(err) {
            if (err) reject(err);
            else resolve(this.changes);
        });
    });

    // Registrar cambios en el historial
    if (estado) {
        await historialService.registrar(id, id_usuario, 'Cambio de Estado', `Estado cambiado a: ${estado}`);
    }
    
    if (numero_wo !== undefined && numero_wo !== null && numero_wo !== valorAnteriorWo) {
        await historialService.registrar(id, id_usuario, 'Actualización de WO', `WO anterior: "${valorAnteriorWo || 'N/A'}", Nuevo WO: "${numero_wo}".`);
    }
    
    if (id_proveedor) {
        // Obtener nombres de proveedores para el historial
        const proveedorAnterior = await new Promise((resolve, reject) => {
            db.get(`SELECT p.nombre FROM tareas t JOIN proveedores p ON t.id_proveedor = p.id WHERE t.id = ?`, [id], (err, row) => {
                if (err) reject(err);
                else resolve(row?.nombre || 'N/A');
            });
        });
        
        const proveedorNuevo = await new Promise((resolve, reject) => {
            db.get(`SELECT nombre FROM proveedores WHERE id = ?`, [id_proveedor], (err, row) => {
                if (err) reject(err);
                else resolve(row?.nombre || 'N/A');
            });
        });
        
        await historialService.registrar(id, id_usuario, 'Reasignación de Proveedor', `Proveedor anterior: "${proveedorAnterior}", Nuevo proveedor: "${proveedorNuevo}".`);
    }
    
    res.json({ message: "Tarea actualizada exitosamente." });
    
  } catch (error) {
    console.error('Error al actualizar tarea:', error);
    res.status(500).json({ error: 'Error interno del servidor al actualizar la tarea.' });
  }
};

const deleteTarea = (req, res) => {
  const { id } = req.params;
  const sql = "DELETE FROM tareas WHERE id = ?";
  db.run(sql, [id], function(err) {
    if (err) {
      console.error('Error al eliminar tarea:', err);
      return res.status(500).json({ error: 'Error al eliminar la tarea.' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: "No se encontró la tarea." });
    }
    res.json({ message: "Tarea eliminada exitosamente", changes: this.changes });
  });
};


const getCertificadoByTareaId = async (req, res) => {
  try {
    const { id } = req.params;
    const id_tarea = id;
    
    const adjuntosPromise = new Promise((resolve, reject) => {
      const sql = "SELECT * FROM tarea_adjuntos WHERE id_tarea = ?";
      db.all(sql, [id_tarea], (err, rows) => err ? reject(err) : resolve(rows));
    });
    const manoDeObraPromise = new Promise((resolve, reject) => {
      const sql = `
        SELECT tmo.id, tmo.cantidad, mo.codigo, mo.descripcion, mo.unidad_medida, mo.precio 
        FROM tarea_mano_de_obra tmo
        JOIN mano_de_obra mo ON tmo.id_mano_de_obra = mo.id
        WHERE tmo.id_tarea = ?`;
      db.all(sql, [id_tarea], (err, rows) => err ? reject(err) : resolve(rows));
    });
    const materialesPromise = new Promise((resolve, reject) => {
      const sql = `
        SELECT tm.id, tm.cantidad, tm.tipo, m.codigo, m.descripcion, m.unidad_medida
        FROM tarea_materiales tm
        JOIN materiales m ON tm.id_material = m.codigo
        WHERE tm.id_tarea = ?`;
      db.all(sql, [id_tarea], (err, rows) => err ? reject(err) : resolve(rows));
    });

    // Obtener datos de la tarea directamente
    const tareaPromise = new Promise((resolve, reject) => {
      const sql = `
        SELECT 
          t.*,
          prov.nombre as proveedor_nombre,
          prov.centro as proveedor_centro,
          prov.almacen as proveedor_almacen,
          insp.nombre_completo as inspector_nombre,
          sup.nombre_completo as supervisor_nombre
        FROM tareas t
        LEFT JOIN proveedores prov ON t.id_proveedor = prov.id
        LEFT JOIN usuarios insp ON t.id_inspector = insp.id
        LEFT JOIN usuarios sup ON insp.id_supervisor = sup.id
        WHERE t.id = ?
      `;
      db.get(sql, [id_tarea], (err, row) => err ? reject(err) : resolve(row));
    });

    const [tarea, adjuntos, mano_de_obra, materiales] = await Promise.all([
      tareaPromise, adjuntosPromise, manoDeObraPromise, materialesPromise
    ]);

    if (!tarea) {
      return res.status(404).json({ error: 'Tarea no encontrada.' });
    }

    const certificado = { 
        tarea, 
        adjuntos, 
        mano_de_obra, 
        materialesUtilizados: materiales.filter(m => m.tipo === 'utilizado'), 
        materialesRecuperados: materiales.filter(m => m.tipo === 'recuperado') 
    };
    
    res.json({ message: "success", data: certificado });
    
  } catch (error) {
    console.error('Error al obtener certificado:', error);
    res.status(500).json({ error: 'Error interno del servidor al obtener el certificado.' });
  }
};

const emitirCertificado = async (req, res) => {
  try {
    const { id } = req.params;
    const id_usuario = req.user.id;
    
    // Extraer datos del FormData
    const fecha_inicio = req.body.fecha_inicio;
    const fecha_fin = req.body.fecha_fin;
    const observaciones = req.body.observaciones || '';
    const mano_de_obra = JSON.parse(req.body.mano_de_obra || '[]');
    const materiales_utilizados = JSON.parse(req.body.materiales_utilizados || '[]');
    const materiales_recuperados = JSON.parse(req.body.materiales_recuperados || '[]');
    
    // Validar datos obligatorios
    if (!fecha_inicio || !fecha_fin) {
      return res.status(400).json({ error: 'Las fechas de inicio y fin son obligatorias.' });
    }
    
    // Actualizar la tarea con las fechas y cambiar estado
    await new Promise((resolve, reject) => {
      const sql = `UPDATE tareas SET fecha_inicio = ?, fecha_fin = ?, estado = ? WHERE id = ?`;
      db.run(sql, [fecha_inicio, fecha_fin, 'Pendiente Certificación Inspector/Supervisor', id], function(err) {
        if (err) reject(err);
        else resolve(this.changes);
      });
    });
    
    // Procesar mano de obra - solo aplicar cálculos automáticos si los códigos fueron seleccionados
    let manoDeObraProcesada = mano_de_obra || [];
    if (manoDeObraProcesada.length > 0) {
      try {
        // Verificar si el usuario seleccionó explícitamente el costo mínimo diario
        const tieneCostoMinimo = manoDeObraProcesada.some(item => item.codigo === '5020982');
        
        if (tieneCostoMinimo) {
          // Solo procesar si fue seleccionado explícitamente
          const resultadoCostoMinimo = await costoMinimoService.procesarManoDeObraConCostoMinimo(manoDeObraProcesada);
          manoDeObraProcesada = resultadoCostoMinimo.manoDeObraProcesada;
          console.log('Costo mínimo diario procesado:', resultadoCostoMinimo.mensaje);
        }
        
        // Verificar si el usuario seleccionó explícitamente la cuadrilla modelo
        const tieneCuadrillaModelo = manoDeObraProcesada.some(item => item.codigo === '5033311');
        
        if (tieneCuadrillaModelo) {
          // Solo procesar si fue seleccionado explícitamente
          const resultadoCuadrillaModelo = await cuadrillaModeloService.procesarManoDeObraConCuadrillaModelo(manoDeObraProcesada);
          manoDeObraProcesada = resultadoCuadrillaModelo.manoDeObraProcesada;
          console.log('Cuadrilla modelo procesada:', resultadoCuadrillaModelo.mensaje);
        }
      } catch (error) {
        console.error('Error procesando cálculos automáticos:', error);
        return res.status(400).json({ error: error.message });
      }
    }
    
    // Guardar mano de obra procesada
    if (manoDeObraProcesada && manoDeObraProcesada.length > 0) {
      for (const item of manoDeObraProcesada) {
        // Obtener el ID real de la mano de obra basado en el código
        const manoDeObraReal = await new Promise((resolve, reject) => {
          const sql = `SELECT id FROM mano_de_obra WHERE codigo = ?`;
          db.get(sql, [item.codigo], (err, row) => {
            if (err) reject(err);
            else resolve(row);
          });
        });
        
        if (!manoDeObraReal) {
          console.error(`❌ No se encontró mano de obra con código: ${item.codigo}`);
          continue;
        }
        
        await new Promise((resolve, reject) => {
          // Para el costo mínimo diario, usar el precio calculado en lugar del precio original
          const precioFinal = item.precioCalculado !== undefined ? item.precioCalculado : item.precio;
          const sql = `INSERT INTO tarea_mano_de_obra (id_tarea, id_mano_de_obra, cantidad, precio_calculado) VALUES (?, ?, ?, ?)`;
          db.run(sql, [id, manoDeObraReal.id, item.cantidad, precioFinal], function(err) {
            if (err) reject(err);
            else resolve(this.lastID);
          });
        });
      }
    }
    
    // Guardar materiales utilizados
    if (materiales_utilizados && materiales_utilizados.length > 0) {
      for (const item of materiales_utilizados) {
        await new Promise((resolve, reject) => {
          const sql = `INSERT INTO tarea_materiales (id_tarea, id_material, cantidad, tipo) VALUES (?, ?, ?, ?)`;
          db.run(sql, [id, item.id, item.cantidad, 'utilizado'], function(err) {
            if (err) reject(err);
            else resolve(this.lastID);
          });
        });
      }
    }
    
    // Guardar materiales recuperados
    if (materiales_recuperados && materiales_recuperados.length > 0) {
      for (const item of materiales_recuperados) {
        await new Promise((resolve, reject) => {
          const sql = `INSERT INTO tarea_materiales (id_tarea, id_material, cantidad, tipo) VALUES (?, ?, ?, ?)`;
          db.run(sql, [id, item.id, item.cantidad, 'recuperado'], function(err) {
            if (err) reject(err);
            else resolve(this.lastID);
          });
        });
      }
    }
    
    // Procesar archivos adjuntos si existen
    if (req.files && req.files.length > 0) {
      for (const archivo of req.files) {
        await new Promise((resolve, reject) => {
          const sql = `INSERT INTO tarea_adjuntos (id_tarea, nombre_archivo, url_archivo) VALUES (?, ?, ?)`;
          db.run(sql, [id, archivo.originalname, `/uploads/${archivo.filename}`], function(err) {
            if (err) reject(err);
            else resolve(this.lastID);
          });
        });
      }
    }
    
    // Registrar en el historial
    await historialService.registrar(id, id_usuario, 'Certificado Emitido', 'El proveedor ha emitido el certificado de trabajo.');
    
    res.json({ message: 'Certificado emitido exitosamente.' });
    
  } catch (error) {
    console.error('Error al emitir certificado:', error);
    res.status(500).json({ error: 'Error interno del servidor al emitir el certificado.' });
  }
};

const getAdjuntos = async (req, res) => {
  try {
    const { id } = req.params;
    const sql = "SELECT * FROM tarea_adjuntos WHERE id_tarea = ? ORDER BY fecha_subida DESC";
    db.all(sql, [id], (err, rows) => {
      if (err) {
        console.error('Error al obtener adjuntos:', err);
        return res.status(500).json({ error: 'Error al obtener los adjuntos.' });
      }
      res.json({ data: rows });
    });
  } catch (error) {
    console.error('Error en getAdjuntos:', error);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
};

const addAdjunto = async (req, res) => {
  try {
    const { id } = req.params;
    const id_usuario = req.user.id;
    
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No se proporcionaron archivos.' });
    }
    
    const archivos = req.files;
    const adjuntosGuardados = [];
    
    for (const archivo of archivos) {
      const sql = `INSERT INTO tarea_adjuntos (id_tarea, nombre_archivo, url_archivo) VALUES (?, ?, ?)`;
      
      await new Promise((resolve, reject) => {
        db.run(sql, [id, archivo.originalname, `/uploads/${archivo.filename}`], function(err) {
          if (err) reject(err);
          else resolve(this.lastID);
        });
      });
      
      adjuntosGuardados.push({
        id: archivo.filename,
        nombre_archivo: archivo.originalname,
        url_archivo: `/uploads/${archivo.filename}`
      });
    }
    
    // Registrar en el historial
    await historialService.registrar(id, id_usuario, 'Adjuntos Agregados', `Se agregaron ${archivos.length} archivo(s) adjunto(s).`);
    
    res.json({ 
      message: 'Archivos subidos exitosamente.',
      data: adjuntosGuardados 
    });
    
  } catch (error) {
    console.error('Error al agregar adjuntos:', error);
    res.status(500).json({ error: 'Error interno del servidor al subir archivos.' });
  }
};

const exportarMateriales = async (req, res) => {
  try {
    const { id } = req.params;
    const id_tarea = id;
    const id_usuario = req.user.id;
  const materialesPromise = new Promise((resolve, reject) => {
    const sql = `
      SELECT m.codigo, m.descripcion, tm.cantidad, tm.tipo
      FROM tarea_materiales tm
      JOIN materiales m ON tm.id_material = m.id
      WHERE tm.id_tarea = ?`;
    db.all(sql, [id_tarea], (err, rows) => err ? reject(err) : resolve(rows));
  });
  const proveedorInfoPromise = new Promise((resolve, reject) => {
    const sql = `
      SELECT p.centro, p.almacen 
      FROM proveedores p 
      JOIN tareas t ON t.id_proveedor = p.id 
      WHERE t.id = ?`;
    db.get(sql, [id_tarea], (err, row) => err ? reject(err) : resolve(row));
  });

  const [materiales, proveedorInfo] = await Promise.all([materialesPromise, proveedorInfoPromise]);
    
  const dataParaExportar = {
      utilizados: materiales
          .filter(m => m.tipo === 'utilizado')
          .map(m => ({ 
              Codigo: m.codigo, 
              Descripcion: m.descripcion, 
              Cantidad: m.cantidad, 
              Centro: proveedorInfo.centro, 
              Almacen: proveedorInfo.almacen 
          })),
      recuperados: materiales
          .filter(m => m.tipo === 'recuperado')
          .map(m => ({ 
              Codigo: m.codigo, 
              Descripcion: m.descripcion, 
              Cantidad: m.cantidad, 
              Centro: proveedorInfo.centro, 
              Almacen: proveedorInfo.almacen 
          }))
  };
    
  await new Promise((resolve, reject) => {
    const sql = `UPDATE tareas SET fecha_ultima_exportacion = CURRENT_TIMESTAMP WHERE id = ?`;
    db.run(sql, [id_tarea], (err) => err ? reject(err) : resolve());
  });
  await historialService.registrar(id_tarea, id_usuario, 'Exportación de Materiales', 'El usuario ha exportado la lista de materiales a Excel.');

  res.json({ message: "success", data: dataParaExportar });
  
  } catch (error) {
    console.error('Error al exportar materiales:', error);
    res.status(500).json({ error: 'Error interno del servidor al exportar materiales.' });
  }
};

// Obtener el historial completo de una tarea
const getHistorialTarea = async (req, res) => {
  try {
    const { id } = req.params;
    const historial = await historialService.obtenerHistorial(id);
    
    res.json({ 
      message: "success", 
      data: historial 
    });
  } catch (error) {
    console.error('Error al obtener historial:', error);
    res.status(500).json({ error: 'Error interno del servidor al obtener historial.' });
  }
};

// Función para editar certificado cuando hay observación
const editarCertificado = async (req, res) => {
  try {
    console.log('🔧 Iniciando editarCertificado...');
    const { id } = req.params;
    const id_usuario = req.user.id;
    console.log('📋 Parámetros:', { id, id_usuario });
    console.log('📋 Body keys:', Object.keys(req.body));
    console.log('📋 Files:', req.files ? req.files.length : 'No files');
    
    // Verificar que la tarea esté en estado de observación
    const tarea = await new Promise((resolve, reject) => {
      const sql = `SELECT estado FROM tareas WHERE id = ?`;
      db.get(sql, [id], (err, row) => err ? reject(err) : resolve(row));
    });
    
    if (!tarea) {
      return res.status(404).json({ error: 'Tarea no encontrada.' });
    }
    
    // Permitir editar si la tarea está observada o si está pendiente de certificación (después de corrección)
    const estadoPermitido = tarea.estado.toLowerCase().includes('observada') || 
                           tarea.estado === 'Pendiente Certificación Inspector' ||
                           tarea.estado === 'Pendiente Certificación Inspector/Supervisor';
    
    if (!estadoPermitido) {
      return res.status(400).json({ error: 'Solo se pueden editar certificados de tareas observadas o pendientes de certificación.' });
    }
    
    // Extraer datos del FormData
    const fecha_inicio = req.body.fecha_inicio;
    const fecha_fin = req.body.fecha_fin;
    const observaciones = req.body.observaciones || '';
    const mano_de_obra = JSON.parse(req.body.mano_de_obra || '[]');
    const materiales_utilizados = JSON.parse(req.body.materiales_utilizados || '[]');
    const materiales_recuperados = JSON.parse(req.body.materiales_recuperados || '[]');
    
    console.log('📋 Datos extraídos:', {
      fecha_inicio,
      fecha_fin,
      observaciones: observaciones ? observaciones.substring(0, 50) + '...' : 'Sin observaciones',
      mano_de_obra_count: mano_de_obra ? mano_de_obra.length : 0,
      materiales_utilizados_count: materiales_utilizados ? materiales_utilizados.length : 0,
      materiales_recuperados_count: materiales_recuperados ? materiales_recuperados.length : 0
    });
    
    // Validar datos obligatorios
    if (!fecha_inicio || !fecha_fin) {
      return res.status(400).json({ error: 'Las fechas de inicio y fin son obligatorias.' });
    }
    
    // Obtener el rol del usuario para determinar si debe cambiar el estado
    const rolUsuario = req.user.rol.toLowerCase();
    console.log('👤 Rol del usuario:', rolUsuario);
    
    // Solo cambiar estado si es proveedor, inspector/supervisor mantiene el estado actual
    let nuevoEstado = null;
    if (rolUsuario === 'proveedor') {
      nuevoEstado = 'Pendiente Certificación Inspector/Supervisor';
      console.log('🔄 Proveedor editando - cambiando estado a:', nuevoEstado);
    } else {
      console.log('🔄 Inspector/Supervisor editando - manteniendo estado actual');
    }
    
    // Actualizar la tarea con las fechas
    console.log('🔄 Actualizando tarea...');
    await new Promise((resolve, reject) => {
      let sql, params;
      if (nuevoEstado) {
        // Proveedor: actualizar fechas y cambiar estado
        sql = `UPDATE tareas SET fecha_inicio = ?, fecha_fin = ?, estado = ? WHERE id = ?`;
        params = [fecha_inicio, fecha_fin, nuevoEstado, id];
      } else {
        // Inspector/Supervisor: solo actualizar fechas
        sql = `UPDATE tareas SET fecha_inicio = ?, fecha_fin = ? WHERE id = ?`;
        params = [fecha_inicio, fecha_fin, id];
      }
      
      db.run(sql, params, function(err) {
        if (err) {
          console.error('❌ Error actualizando tarea:', err);
          reject(err);
        } else {
          console.log('✅ Tarea actualizada exitosamente');
          resolve(this.changes);
        }
      });
    });
    
    // Solo eliminar y reinsertar datos si hay cambios
    console.log('🔍 Verificando si hay cambios en mano de obra y materiales...');
    
    // Eliminar mano de obra anterior solo si hay nueva mano de obra
    if (mano_de_obra && mano_de_obra.length > 0) {
      console.log('🗑️ Eliminando mano de obra anterior...');
      await new Promise((resolve, reject) => {
        const sql = `DELETE FROM tarea_mano_de_obra WHERE id_tarea = ?`;
        db.run(sql, [id], function(err) {
          if (err) reject(err);
          else resolve(this.changes);
        });
      });
    } else {
      console.log('⏭️ No hay mano de obra nueva, manteniendo la anterior');
    }
    
    // Eliminar materiales anteriores solo si hay nuevos materiales
    if ((materiales_utilizados && materiales_utilizados.length > 0) || 
        (materiales_recuperados && materiales_recuperados.length > 0)) {
      console.log('🗑️ Eliminando materiales anteriores...');
      await new Promise((resolve, reject) => {
        const sql = `DELETE FROM tarea_materiales WHERE id_tarea = ?`;
        db.run(sql, [id], function(err) {
          if (err) reject(err);
          else resolve(this.changes);
        });
      });
    } else {
      console.log('⏭️ No hay materiales nuevos, manteniendo los anteriores');
    }
    
    // NO eliminar archivos adjuntos anteriores - solo agregar nuevos si existen
    
    // Procesar mano de obra con cálculo automático del costo mínimo diario
    let manoDeObraProcesada = mano_de_obra || [];
    if (manoDeObraProcesada.length > 0) {
      try {
        // Solo procesar costo mínimo diario si hay códigos que lo requieran
        const tieneCostoMinimo = manoDeObraProcesada.some(item => item.codigo === '5020982');
        if (tieneCostoMinimo) {
          const resultadoCostoMinimo = await costoMinimoService.procesarManoDeObraConCostoMinimo(manoDeObraProcesada);
          manoDeObraProcesada = resultadoCostoMinimo.manoDeObraProcesada;
          console.log('Costo mínimo diario:', resultadoCostoMinimo.mensaje);
        }
        
        // Solo procesar cuadrilla modelo si hay códigos que lo requieran
        const tieneCuadrillaModelo = manoDeObraProcesada.some(item => item.codigo === '5033311');
        if (tieneCuadrillaModelo) {
          const resultadoCuadrillaModelo = await cuadrillaModeloService.procesarManoDeObraConCuadrillaModelo(manoDeObraProcesada);
          manoDeObraProcesada = resultadoCuadrillaModelo.manoDeObraProcesada;
          console.log('Cuadrilla modelo:', resultadoCuadrillaModelo.mensaje);
        }
      } catch (error) {
        console.error('Error procesando cálculos automáticos:', error);
        return res.status(400).json({ error: error.message });
      }
    }
    
    // Guardar mano de obra procesada
    if (manoDeObraProcesada && manoDeObraProcesada.length > 0) {
      console.log(`🔧 Guardando ${manoDeObraProcesada.length} items de mano de obra...`);
      for (const item of manoDeObraProcesada) {
        // Obtener el ID real de la mano de obra basado en el código
        const manoDeObraReal = await new Promise((resolve, reject) => {
          const sql = `SELECT id FROM mano_de_obra WHERE codigo = ?`;
          db.get(sql, [item.codigo], (err, row) => {
            if (err) reject(err);
            else resolve(row);
          });
        });
        
        if (!manoDeObraReal) {
          console.error(`❌ No se encontró mano de obra con código: ${item.codigo}`);
          continue;
        }
        
        console.log(`✅ Guardando mano de obra: ${item.codigo} - ${item.descripcion}`);
        await new Promise((resolve, reject) => {
          // Para el costo mínimo diario, usar el precio calculado en lugar del precio original
          const precioFinal = item.precioCalculado !== undefined ? item.precioCalculado : item.precio;
          const sql = `INSERT INTO tarea_mano_de_obra (id_tarea, id_mano_de_obra, cantidad, precio_calculado) VALUES (?, ?, ?, ?)`;
          db.run(sql, [id, manoDeObraReal.id, item.cantidad, precioFinal], function(err) {
            if (err) reject(err);
            else resolve(this.lastID);
          });
        });
      }
      console.log('✅ Mano de obra guardada exitosamente');
    } else {
      console.log('🔧 No hay mano de obra para guardar');
    }
    
    // Guardar materiales utilizados
    if (materiales_utilizados && materiales_utilizados.length > 0) {
      console.log(`📦 Guardando ${materiales_utilizados.length} materiales utilizados...`);
      for (const item of materiales_utilizados) {
        console.log(`✅ Guardando material utilizado: ${item.codigo || 'Sin código'} - ${item.descripcion || 'Sin descripción'}`);
        await new Promise((resolve, reject) => {
          const sql = `INSERT INTO tarea_materiales (id_tarea, id_material, cantidad, tipo) VALUES (?, ?, ?, ?)`;
          db.run(sql, [id, item.id, item.cantidad, 'utilizado'], function(err) {
            if (err) reject(err);
            else resolve(this.lastID);
          });
        });
      }
      console.log('✅ Materiales utilizados guardados exitosamente');
    } else {
      console.log('📦 No hay materiales utilizados para guardar');
    }
    
    // Guardar materiales recuperados
    if (materiales_recuperados && materiales_recuperados.length > 0) {
      console.log(`📦 Guardando ${materiales_recuperados.length} materiales recuperados...`);
      for (const item of materiales_recuperados) {
        console.log(`✅ Guardando material recuperado: ${item.codigo || 'Sin código'} - ${item.descripcion || 'Sin descripción'}`);
        await new Promise((resolve, reject) => {
          const sql = `INSERT INTO tarea_materiales (id_tarea, id_material, cantidad, tipo) VALUES (?, ?, ?, ?)`;
          db.run(sql, [id, item.id, item.cantidad, 'recuperado'], function(err) {
            if (err) reject(err);
            else resolve(this.lastID);
          });
        });
      }
      console.log('✅ Materiales recuperados guardados exitosamente');
    } else {
      console.log('📦 No hay materiales recuperados para guardar');
    }
    
    // Procesar archivos adjuntos si existen (se agregaron nuevos archivos)
    if (req.files && req.files.length > 0) {
      console.log(`📎 Procesando ${req.files.length} archivos nuevos...`);
      for (const archivo of req.files) {
        await new Promise((resolve, reject) => {
          const sql = `INSERT INTO tarea_adjuntos (id_tarea, nombre_archivo, url_archivo) VALUES (?, ?, ?)`;
          db.run(sql, [id, archivo.originalname, `/uploads/${archivo.filename}`], function(err) {
            if (err) reject(err);
            else resolve(this.lastID);
          });
        });
      }
      console.log('✅ Archivos nuevos agregados exitosamente');
    } else {
      console.log('📎 No hay archivos nuevos para agregar');
    }
    
    // Registrar en el historial
    console.log('📝 Registrando en historial...');
    try {
      let mensajeHistorial, mensajeRespuesta, estadoRespuesta;
      
      if (rolUsuario === 'proveedor') {
        mensajeHistorial = `Certificado editado por proveedor. Tarea vuelve a estado: Pendiente Certificación Inspector/Supervisor.`;
        mensajeRespuesta = 'Certificado editado exitosamente. La tarea vuelve a estado: Pendiente Certificación Inspector/Supervisor.';
        estadoRespuesta = 'Pendiente Certificación Inspector/Supervisor';
      } else {
        mensajeHistorial = `Certificado editado por ${rolUsuario}. Estado de la tarea se mantiene.`;
        mensajeRespuesta = 'Certificado editado exitosamente. Los cambios se han guardado.';
        estadoRespuesta = tarea.estado; // Mantener el estado actual
      }
      
      await historialService.registrar(id, id_usuario, 'Certificado Editado', mensajeHistorial);
      console.log('✅ Historial registrado exitosamente');
      
      console.log('📤 Enviando respuesta exitosa...');
      res.json({ 
        message: mensajeRespuesta,
        data: { 
          estado: estadoRespuesta,
          fecha_inicio,
          fecha_fin
        }
      });
    } catch (historialError) {
      console.error('❌ Error al registrar en historial:', historialError);
      // No fallar por error de historial, continuar con la respuesta
      res.json({ 
        message: rolUsuario === 'proveedor' ? 
          'Certificado editado exitosamente. La tarea vuelve a estado: Pendiente Certificación Inspector/Supervisor.' :
          'Certificado editado exitosamente. Los cambios se han guardado.',
        data: { 
          estado: rolUsuario === 'proveedor' ? 'Pendiente Certificación Inspector/Supervisor' : tarea.estado,
          fecha_inicio,
          fecha_fin
        }
      });
    }
    
  } catch (error) {
    console.error('Error al editar certificado:', error);
    res.status(500).json({ error: 'Error interno del servidor al editar el certificado.' });
  }
};

module.exports = {
    getAllTareas,
    getTareaById,
    createTarea,
    updateTarea,
    deleteTarea,
    getCertificadoByTareaId,
    emitirCertificado,
    editarCertificado,
    getAdjuntos,
    addAdjunto,
    exportarMateriales,
    getHistorialTarea
};

