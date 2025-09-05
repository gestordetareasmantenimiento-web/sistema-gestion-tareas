// backend/controllers/tareaController.js

const db = require('../db/database');
const { ROLES_TIPO_INSPECTOR } = require('../utils/roles');

// Función auxiliar para registrar en el historial (Devuelve una Promesa)
const registrarEnHistorial = (id_tarea, id_usuario, accion, detalle) => {
  return new Promise((resolve, reject) => {
    const sql = `INSERT INTO historial_tareas (id_tarea, id_usuario, accion, detalle) VALUES (?, ?, ?, ?)`;
    db.run(sql, [id_tarea, id_usuario, accion, detalle], function(err) {
      if (err) {
        console.error('Error al registrar en historial:', err.message);
        reject(err);
      } else {
        resolve(this.lastID);
      }
    });
  });
};


exports.getAllTareas = (req, res) => {
  const { id, rol, id_proveedor, region } = req.user;
  let sql = "";
  let params = [];

  const baseQuery = `
    SELECT 
      t.*,
      prov.razon_social as proveedor_nombre,
      insp.nombre_completo as inspector_nombre
    FROM tareas t
    LEFT JOIN proveedores prov ON t.id_proveedor = prov.id
    LEFT JOIN usuarios insp ON t.id_inspector = insp.id
  `;

  const userRol = rol.toLowerCase();

  const rolConfig = {
    proveedor: {
      whereClause: 'WHERE t.id_proveedor = ?',
      getParams: () => [id_proveedor],
      grouping: (tareas) => ({
        pendientes: tareas.filter(t => t.estado === 'Asignada'),
        enAprobacion: tareas.filter(t => t.estado.toLowerCase().includes('pendiente')),
        observados: tareas.filter(t => t.estado.toLowerCase().includes('observada')),
        pasadasAPago: tareas.filter(t => t.estado === 'Pasada a Pago')
      })
    },
    inspector: {
      whereClause: 'WHERE t.id_inspector = ?',
      getParams: () => [id],
      grouping: (tareas) => {
        const estadosAprobadosEnCurso = [
            'pendiente aprobación supervisor', 'pendiente aprobación administración',
            'pendiente aprobación gerente', 'pendiente aprobación cerco',
            'observada por administración', 'observada por cerco'
        ];
        return {
          pendientes: tareas.filter(t => t.estado.toLowerCase() === 'asignada'),
          pendientesDeCertificacion: tareas.filter(t => t.estado.toLowerCase() === 'pendiente certificación inspector'),
          aprobados: tareas.filter(t => estadosAprobadosEnCurso.includes(t.estado.toLowerCase())),
          observados: tareas.filter(t => t.estado.toLowerCase() === 'observada por inspector'),
          pasadasAPago: tareas.filter(t => t.estado.toLowerCase() === 'pasada a pago')
        };
      }
    },
    supervisor: { // <-- CORREGIDO
      whereClause: 'WHERE insp.id_supervisor = ?',
      getParams: () => [id],
      grouping: (tareas) => ({
        pendientesDeAprobacion: tareas.filter(t => t.estado.toLowerCase() === 'pendiente aprobación supervisor'),
        pendientesDeCertificacion: tareas.filter(t => t.estado.toLowerCase() === 'pendiente certificación inspector'),
        enCircuito: tareas.filter(t => ![
            'asignada', 
            'pendiente certificación inspector', 
            'pendiente aprobación supervisor'
        ].includes(t.estado.toLowerCase())),
        observados: tareas.filter(t => t.estado.toLowerCase() === 'observada por inspector')
      })
    },
    administrativo: {
      whereClause: 'WHERE t.region = ?',
      getParams: () => [region],
      grouping: (tareas) => ({
        pendientesDeIcd: tareas.filter(t => !t.numero_icd),
        pendientesDeRevision: tareas.filter(t => ['Pendiente Certificación Inspector', 'Pendiente Aprobación Administración'].includes(t.estado)),
        observados: tareas.filter(t => t.estado.toLowerCase().includes('observada')),
        pasadasAPago: tareas.filter(t => t.estado === 'Pasada a Pago')
      })
    },
    gerente: {
      whereClause: 'WHERE t.region = ?',
      getParams: () => [region],
      grouping: (tareas) => ({
        pendientesDeAutorizacion: tareas.filter(t => t.estado === 'Pendiente Aprobación Gerente'),
      })
    },
    cerco: {
      whereClause: '',
      getParams: () => [],
      grouping: (tareas) => ({
        pendientesDeRevisionFinal: tareas.filter(t => t.estado === 'Pendiente Aprobación CERCO'),
        observados: tareas.filter(t => t.estado.toLowerCase().includes('observada')),
        pasadasAPago: tareas.filter(t => t.estado === 'Pasada a Pago'),
      })
    }
  };

  const config = rolConfig[userRol];
  const finalConfig = ROLES_TIPO_INSPECTOR.includes(userRol) ? rolConfig.inspector : config;

  if (!finalConfig) {
    return res.json({ message: "success", data: {} });
  }

  sql = `${baseQuery} ${finalConfig.whereClause}`;
  params = finalConfig.getParams();

  db.all(sql, params, (err, tareas) => {
    if (err) return res.status(500).json({ error: err.message });
    const columnas = finalConfig.grouping(tareas);
    res.json({ message: "success", data: columnas });
  });
};

exports.getTareaById = (req, res) => {
  const sql = `
    SELECT 
      t.*,
      prov.razon_social as proveedor_nombre,
      insp.nombre_completo as inspector_nombre,
      sup.nombre_completo as supervisor_nombre
    FROM tareas t
    LEFT JOIN proveedores prov ON t.id_proveedor = prov.id
    LEFT JOIN usuarios insp ON t.id_inspector = insp.id
    LEFT JOIN usuarios sup ON insp.id_supervisor = sup.id
    WHERE t.id = ?
  `;
  db.get(sql, [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "success", data: row });
  });
};

exports.createTarea = async (req, res) => {
  try {
    const { descripcion, direccion, id_inspector, id_proveedor, region } = req.body;
    const { id: id_usuario_creador } = req.user;

    if (!descripcion || !direccion || !id_inspector || !id_proveedor || !region) {
      return res.status(400).json({ error: "Faltan datos obligatorios." });
    }

    const id_tarea_texto = `TAREA-${Date.now()}`;
    const estado_inicial = "Asignada";

    const id_tarea_creada = await new Promise((resolve, reject) => {
      const sql = `INSERT INTO tareas (id_tarea_texto, estado, descripcion, direccion, region, id_inspector, id_proveedor) VALUES (?, ?, ?, ?, ?, ?, ?)`;
      const params = [id_tarea_texto, estado_inicial, descripcion, direccion, region, id_inspector, id_proveedor];
      db.run(sql, params, function(err) {
        if (err) {
          reject(err);
        } else {
          resolve(this.lastID);
        }
      });
    });

    await registrarEnHistorial(id_tarea_creada, id_usuario_creador, 'Creación', `Tarea creada y asignada al proveedor ID ${id_proveedor} y al inspector ID ${id_inspector}.`);

    if (req.files && req.files.length > 0) {
      const sqlAdjunto = `INSERT INTO tarea_adjuntos (id_tarea, nombre_archivo, url_archivo) VALUES (?, ?, ?)`;
      const insertPromises = req.files.map(file => {
        return new Promise((resolve, reject) => {
          const { originalname, filename } = file;
          const url_archivo = `/uploads/${filename}`;
          db.run(sqlAdjunto, [id_tarea_creada, originalname, url_archivo], (err) => {
            if (err) reject(err);
            else resolve();
          });
        });
      });
      await Promise.all(insertPromises);
      res.status(201).json({ message: "Tarea y archivos creados", data: { id: id_tarea_creada } });
    } else {
      res.status(201).json({ message: "Tarea creada exitosamente", data: { id: id_tarea_creada } });
    }

  } catch (err) {
    console.error('Error en createTarea:', err.message);
    res.status(500).json({ error: 'Error interno del servidor al crear la tarea.', detalle: err.message });
  }
};

exports.updateTarea = (req, res) => {
    const { estado, numero_icd } = req.body;
    const { id: id_usuario } = req.user;
    const id_tarea = req.params.id;

    if (!estado && !numero_icd) {
        return res.status(400).json({ "error": "No se proporcionaron datos para actualizar." });
    }
    
    const sqlSelect = `SELECT estado, numero_icd FROM tareas WHERE id = ?`;
    db.get(sqlSelect, [id_tarea], (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!row) return res.status(404).json({ error: 'Tarea no encontrada.'});

      const valorAnteriorEstado = row.estado;
      const valorAnteriorIcd = row.numero_icd;

      let setClauses = [], params = [];
      if (estado) { setClauses.push("estado = ?"); params.push(estado); }
      if (numero_icd) { setClauses.push("numero_icd = ?"); params.push(numero_icd); }
      params.push(id_tarea);

      const sql = `UPDATE tareas SET ${setClauses.join(", ")} WHERE id = ?`;
      db.run(sql, params, function(err) {
          if (err) return res.status(500).json({ error: err.message });
          
          if (estado && estado !== valorAnteriorEstado) {
            registrarEnHistorial(id_tarea, id_usuario, 'Cambio de Estado', `Estado anterior: "${valorAnteriorEstado}", Nuevo estado: "${estado}".`);
          }
          if (numero_icd && numero_icd !== valorAnteriorIcd) {
            registrarEnHistorial(id_tarea, id_usuario, 'Actualización de ICD', `ICD anterior: "${valorAnteriorIcd || 'N/A'}", Nuevo ICD: "${numero_icd}".`);
          }

          res.json({ message: "success", changes: this.changes });
      });
    });
};

exports.deleteTarea = (req, res) => {
  const sql = "DELETE FROM tareas WHERE id = ?";
  db.run(sql, [req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) {
      return res.status(404).json({ error: "No se encontró la tarea." });
    }
    res.json({ message: "Tarea eliminada exitosamente", changes: this.changes });
  });
};

exports.getAdjuntos = (req, res) => {
  const sql = "SELECT * FROM tarea_adjuntos WHERE id_tarea = ?";
  db.all(sql, [req.params.id], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "success", data: rows });
  });
};

exports.addAdjunto = (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: "No se subió ningún archivo." });
  }
  const id_tarea = req.params.id;
  const { id: id_usuario } = req.user;
  const sql = `INSERT INTO tarea_adjuntos (id_tarea, nombre_archivo, url_archivo) VALUES (?, ?, ?)`;
  const insertPromises = req.files.map(file => {
    return new Promise((resolve, reject) => {
      const { originalname, filename } = file;
      const url_archivo = `/uploads/${filename}`;
      db.run(sql, [id_tarea, originalname, url_archivo], function(err) {
        if (err) reject(err);
        registrarEnHistorial(id_tarea, id_usuario, 'Adjunto Cargado', `Archivo: ${originalname}`);
        resolve(this.lastID);
      });
    });
  });
  Promise.all(insertPromises)
    .then(() => res.status(201).json({ message: "Archivos subidos exitosamente." }))
    .catch(err => res.status(500).json({ error: err.message }));
};

exports.emitirCertificado = (req, res) => {
  const id_tarea = req.params.id;
  const { id: id_usuario, rol } = req.user;

  if (rol.toLowerCase() !== 'proveedor') {
    return res.status(403).json({ error: "Solo los proveedores pueden emitir certificados." });
  }
  
  const formData = JSON.parse(req.body.formData);
  const { fecha_inicio, fecha_fin, mano_de_obra, materiales_utilizados, materiales_recuperados } = formData;
  const archivos = req.files;

  db.serialize(() => {
    db.run("BEGIN TRANSACTION;");
    const nuevoEstado = 'Pendiente Certificación Inspector';
    const sqlUpdateTarea = `UPDATE tareas SET fecha_inicio = ?, fecha_fin = ?, estado = ? WHERE id = ?`;
    db.run(sqlUpdateTarea, [fecha_inicio, fecha_fin, nuevoEstado, id_tarea]);
    if (mano_de_obra && mano_de_obra.length > 0) {
      const stmtMO = db.prepare("INSERT INTO tarea_mano_de_obra (id_tarea, id_mano_de_obra, cantidad) VALUES (?, ?, ?)");
      mano_de_obra.forEach(item => stmtMO.run(id_tarea, item.id, item.cantidad));
      stmtMO.finalize();
    }
    if (materiales_utilizados && materiales_utilizados.length > 0) {
      const stmtMatU = db.prepare("INSERT INTO tarea_materiales (id_tarea, id_material, cantidad, tipo) VALUES (?, ?, ?, 'utilizado')");
      materiales_utilizados.forEach(item => stmtMatU.run(id_tarea, item.id, item.cantidad));
      stmtMatU.finalize();
    }
    if (materiales_recuperados && materiales_recuperados.length > 0) {
      const stmtMatR = db.prepare("INSERT INTO tarea_materiales (id_tarea, id_material, cantidad, tipo) VALUES (?, ?, ?, 'recuperado')");
      materiales_recuperados.forEach(item => stmtMatR.run(id_tarea, item.id, item.cantidad));
      stmtMatR.finalize();
    }
    if (archivos && archivos.length > 0) {
        const stmtAdj = db.prepare("INSERT INTO tarea_adjuntos (id_tarea, nombre_archivo, url_archivo) VALUES (?, ?, ?)");
        archivos.forEach(file => {
            const { originalname, filename } = file;
            const url_archivo = `/uploads/${filename}`;
            stmtAdj.run(id_tarea, originalname, url_archivo);
        });
        stmtAdj.finalize();
    }
    db.run("COMMIT;", (err) => {
        if (err) {
            db.run("ROLLBACK;");
            return res.status(500).json({ error: `Error al confirmar la transacción: ${err.message}` });
        }
        registrarEnHistorial(id_tarea, id_usuario, 'Certificado Emitido', `El proveedor ha presentado el certificado. La tarea pasa a estado: ${nuevoEstado}.`);
        res.status(200).json({ message: "Certificado emitido y guardado exitosamente." });
    });
  });
};

exports.aprobarInspector = (req, res) => {
    const id_tarea = req.params.id;
    const { id: id_usuario } = req.user;
    const nuevoEstado = 'Pendiente Aprobación Supervisor';

    const sqlSelect = `SELECT id_inspector FROM tareas WHERE id = ?`;
    db.get(sqlSelect, [id_tarea], (err, tarea) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!tarea) return res.status(404).json({ error: "Tarea no encontrada." });
        if (tarea.id_inspector !== id_usuario) {
            return res.status(403).json({ error: "No tienes permiso para aprobar esta tarea." });
        }
        const sqlUpdate = `UPDATE tareas SET estado = ? WHERE id = ?`;
        db.run(sqlUpdate, [nuevoEstado, id_tarea], function(err) {
            if (err) return res.status(500).json({ error: err.message });
            registrarEnHistorial(id_tarea, id_usuario, 'Certificado Aprobado por Inspector', `La tarea pasa a estado: ${nuevoEstado}.`);
            res.json({ message: 'Certificado aprobado exitosamente.' });
        });
    });
};

exports.observarInspector = (req, res) => {
    const id_tarea = req.params.id;
    const { id: id_usuario } = req.user;
    const { observacion } = req.body;
    const nuevoEstado = 'Observada por Inspector';

    if (!observacion) {
        return res.status(400).json({ error: "La observación no puede estar vacía." });
    }

    const sqlSelect = `SELECT id_inspector FROM tareas WHERE id = ?`;
    db.get(sqlSelect, [id_tarea], (err, tarea) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!tarea) return res.status(404).json({ error: "Tarea no encontrada." });
        if (tarea.id_inspector !== id_usuario) {
            return res.status(403).json({ error: "No tienes permiso para observar esta tarea." });
        }
        const sqlUpdate = `UPDATE tareas SET estado = ? WHERE id = ?`;
        db.run(sqlUpdate, [nuevoEstado, id_tarea], function(err) {
            if (err) return res.status(500).json({ error: err.message });
            registrarEnHistorial(id_tarea, id_usuario, 'Certificado Observado por Inspector', `Observación: "${observacion}". La tarea vuelve al proveedor.`);
            res.json({ message: 'La tarea ha sido observada.' });
        });
    });
};

exports.aprobarSupervisor = (req, res) => {
  const nuevo_estado = 'Pendiente Aprobación Administración';
  const id_tarea = req.params.id;
  const { id: id_usuario } = req.user;

  const sql = "UPDATE tareas SET estado = ? WHERE id = ?";
  db.run(sql, [nuevo_estado, id_tarea], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    registrarEnHistorial(id_tarea, id_usuario, 'Certificado Aprobado por Supervisor', `La tarea pasa a estado: ${nuevo_estado}.`);
    res.json({ message: "Tarea aprobada por supervisor", changes: this.changes });
  });
};

exports.rechazarSupervisor = (req, res) => {
  const nuevo_estado = 'Asignada'; 
  const id_tarea = req.params.id;
  const { id: id_usuario } = req.user;

  const sql = "UPDATE tareas SET estado = ? WHERE id = ?";
  db.run(sql, [nuevo_estado, id_tarea], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    registrarEnHistorial(id_tarea, id_usuario, 'Tarea Rechazada por Supervisor', `La tarea vuelve al proveedor. Nuevo estado: ${nuevo_estado}.`);
    res.json({ message: "Tarea rechazada por supervisor", changes: this.changes });
  });
};

exports.getCertificadoByTareaId = async (req, res) => {
  const id_tarea = req.params.id;

  const tareaPromise = new Promise((resolve, reject) => {
    const sql = `
      SELECT t.*,
             prov.razon_social as proveedor_nombre,
             insp.nombre_completo as inspector_nombre,
             sup.nombre_completo as supervisor_nombre
      FROM tareas t
      LEFT JOIN proveedores prov ON t.id_proveedor = prov.id
      LEFT JOIN usuarios insp ON t.id_inspector = insp.id
      LEFT JOIN usuarios sup ON insp.id_supervisor = sup.id
      WHERE t.id = ?`;
    db.get(sql, [id_tarea], (err, row) => err ? reject(err) : resolve(row));
  });

  const adjuntosPromise = new Promise((resolve, reject) => {
    const sql = "SELECT * FROM tarea_adjuntos WHERE id_tarea = ?";
    db.all(sql, [id_tarea], (err, rows) => err ? reject(err) : resolve(rows));
  });

  const manoDeObraPromise = new Promise((resolve, reject) => {
    const sql = `
      SELECT tmo.*, mo.codigo, mo.descripcion, mo.unidad_medida, mo.precio 
      FROM tarea_mano_de_obra tmo
      JOIN mano_de_obra mo ON tmo.id_mano_de_obra = mo.id
      WHERE tmo.id_tarea = ?`;
    db.all(sql, [id_tarea], (err, rows) => err ? reject(err) : resolve(rows));
  });

  const materialesPromise = new Promise((resolve, reject) => {
    const sql = `
      SELECT tm.*, m.codigo, m.descripcion
      FROM tarea_materiales tm
      JOIN materiales m ON tm.id_material = m.id
      WHERE tm.id_tarea = ?`;
    db.all(sql, [id_tarea], (err, rows) => err ? reject(err) : resolve(rows));
  });

  try {
    const [tarea, adjuntos, mano_de_obra, materiales] = await Promise.all([
      tareaPromise,
      adjuntosPromise,
      manoDeObraPromise,
      materialesPromise
    ]);

    if (!tarea) {
      return res.status(404).json({ error: 'Tarea no encontrada.' });
    }

    const certificadoData = {
      tarea,
      adjuntos,
      mano_de_obra,
      materialesUtilizados: materiales.filter(m => m.tipo === 'utilizado'),
      materialesRecuperados: materiales.filter(m => m.tipo === 'recuperado')
    };

    res.json({ message: "success", data: certificadoData });

  } catch (err) {
    res.status(500).json({ error: `Error al obtener los datos del certificado: ${err.message}` });
  }
};