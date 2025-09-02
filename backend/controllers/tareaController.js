const db = require('../db/database');


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

  // --- SUGERENCIA: Centralizar la lógica por rol ---
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
      grouping: (tareas) => ({
        pendientes: tareas.filter(t => t.estado === 'Asignada'),
        enAprobacion: tareas.filter(t => t.estado.toLowerCase().includes('pendiente')),
        observados: tareas.filter(t => t.estado.toLowerCase().includes('observada')),
        pasadasAPago: tareas.filter(t => t.estado === 'Pasada a Pago')
      })
    },
    supervisor: {
      whereClause: 'WHERE insp.id_supervisor = ?',
      getParams: () => [id],
      grouping: (tareas) => ({
        pendientesDeProveedor: tareas.filter(t => t.estado === 'Asignada'),
        pendientesDeCertificacion: tareas.filter(t => t.estado === 'Pendiente Certificación Inspector'),
        pendientesDeAutorizacion: tareas.filter(t => t.estado === 'Pendiente Aprobación Supervisor'),
        enCircuito: tareas.filter(t => !['Asignada', 'Pendiente Certificación Inspector', 'Pendiente Aprobación Supervisor'].includes(t.estado))
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
      whereClause: '', // Sin filtro WHERE
      getParams: () => [],
      grouping: (tareas) => ({
        pendientesDeRevisionFinal: tareas.filter(t => t.estado === 'Pendiente Aprobación CERCO'),
        observados: tareas.filter(t => t.estado.toLowerCase().includes('observada')),
        pasadasAPago: tareas.filter(t => t.estado === 'Pasada a Pago'),
      })
    }
  };

  const config = rolConfig[userRol];

  if (!config) {
    return res.json({ message: "success", data: {} }); // Rol no reconocido o sin tareas visibles
  }

  sql = `${baseQuery} ${config.whereClause}`;
  params = config.getParams();

  db.all(sql, params, (err, tareas) => {
    if (err) return res.status(500).json({ error: err.message });

    const columnas = config.grouping(tareas);
    res.json({ message: "success", data: columnas });
  });
};

// ... (resto de tus funciones existentes: getTareaById, createTarea, etc.) ...

// --- AÑADE ESTAS DOS NUEVAS FUNCIONES AL FINAL ---

// Aprobar una tarea como Supervisor
exports.aprobarSupervisor = (req, res) => {
  const nuevo_estado = 'Pendiente Certificación Inspector';
  const sql = "UPDATE tareas SET estado = ? WHERE id = ?";
  db.run(sql, [nuevo_estado, req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "Tarea aprobada por supervisor", changes: this.changes });
  });
};

// Rechazar una tarea como Supervisor
exports.rechazarSupervisor = (req, res) => {
  // Devolvemos la tarea al estado 'Asignada' para que el proveedor corrija.
  const nuevo_estado = 'Asignada'; 
  const sql = "UPDATE tareas SET estado = ? WHERE id = ?";
  db.run(sql, [nuevo_estado, req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "Tarea rechazada por supervisor", changes: this.changes });
  });
};

// Obtener una tarea por ID
exports.getTareaById = (req, res) => {
  const sql = "SELECT * FROM tareas WHERE id = ?";
  db.get(sql, [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "success", data: row });
  });
};

// backend/controllers/tareaController.js (reemplazar esta función)

exports.createTarea = (req, res) => {
  // Los datos de texto ahora vienen en req.body
  const { descripcion, direccion, id_inspector, id_proveedor, region } = req.body;

  if (!descripcion || !direccion || !id_inspector || !id_proveedor || !region) {
    return res.status(400).json({ "error": "Faltan datos obligatorios." });
  }

  const id_tarea_texto = `TAREA-${Date.now()}`;
  const estado_inicial = "Asignada";

  const sql = `INSERT INTO tareas (id_tarea_texto, estado, descripcion, direccion, region, id_inspector, id_proveedor) VALUES (?, ?, ?, ?, ?, ?, ?)`;
  const params = [id_tarea_texto, estado_inicial, descripcion, direccion, region, id_inspector, id_proveedor];

  db.run(sql, params, function(err) {
    if (err) return res.status(500).json({ error: err.message });

    const id_tarea_creada = this.lastID;

    // Ahora, si hay archivos, los guardamos
    if (req.files && req.files.length > 0) {
      const sqlAdjunto = `INSERT INTO tarea_adjuntos (id_tarea, nombre_archivo, url_archivo) VALUES (?, ?, ?)`;
      const insertPromises = req.files.map(file => {
        return new Promise((resolve, reject) => {
          const { originalname, filename } = file;
          const url_archivo = `/uploads/${filename}`;
          db.run(sqlAdjunto, [id_tarea_creada, originalname, url_archivo], (err) => {
            if (err) reject(err);
            resolve();
          });
        });
      });

      Promise.all(insertPromises)
        .then(() => res.status(201).json({ message: "Tarea y archivos creados", data: { id: id_tarea_creada } }))
        .catch(err => res.status(500).json({ error: err.message }));

    } else {
      // Si no hay archivos, respondemos como antes
      res.status(201).json({ message: "Tarea creada exitosamente", data: { id: id_tarea_creada } });
    }
  });
};

// Actualizar una tarea
exports.updateTarea = (req, res) => {
    const { estado, numero_icd } = req.body;
    if (!estado && !numero_icd) {
        return res.status(400).json({ "error": "No se proporcionaron datos para actualizar." });
    }
    let setClauses = [], params = [];
    if (estado) { setClauses.push("estado = ?"); params.push(estado); }
    if (numero_icd) { setClauses.push("numero_icd = ?"); params.push(numero_icd); }
    params.push(req.params.id);
    const sql = `UPDATE tareas SET ${setClauses.join(", ")} WHERE id = ?`;
    db.run(sql, params, function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "success", changes: this.changes });
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

// backend/controllers/tareaController.js (añadir estas funciones al final)

// ... (funciones existentes) ...

// Obtener los adjuntos de una tarea
exports.getAdjuntos = (req, res) => {
  const sql = "SELECT * FROM tarea_adjuntos WHERE id_tarea = ?";
  db.all(sql, [req.params.id], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "success", data: rows });
  });
};

// Añadir uno o varios adjuntos a una tarea
exports.addAdjunto = (req, res) => {
  // multer ahora nos deja la información en req.files (un array)
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: "No se subió ningún archivo." });
  }

  const id_tarea = req.params.id;
  const sql = `INSERT INTO tarea_adjuntos (id_tarea, nombre_archivo, url_archivo) VALUES (?, ?, ?)`;

  // Usamos un bucle para preparar todas las inserciones
  const insertPromises = req.files.map(file => {
    return new Promise((resolve, reject) => {
      const { originalname, filename } = file;
      const url_archivo = `/uploads/${filename}`;
      db.run(sql, [id_tarea, originalname, url_archivo], function(err) {
        if (err) reject(err);
        resolve(this.lastID);
      });
    });
  });

  // Ejecutamos todas las promesas de inserción
  Promise.all(insertPromises)
    .then(() => {
      res.status(201).json({ message: "Archivos subidos exitosamente." });
    })
    .catch(err => {
      res.status(500).json({ error: err.message });
    });
};

// backend/controllers/tareaController.js (esta función ya está preparada)

exports.emitirCertificado = async (req, res) => {
  const id_tarea = req.params.id;
  // Los datos del formulario ahora vienen como un string JSON que debemos parsear
  const formData = JSON.parse(req.body.formData);
  const { fecha_inicio, fecha_fin, mano_de_obra, materiales_utilizados, materiales_recuperados } = formData;
  // Los archivos vienen por separado en req.files
  const archivos = req.files;

  // ... (el resto de la lógica es muy similar a la anterior) ...
  // (código completo en el bloque final)
};