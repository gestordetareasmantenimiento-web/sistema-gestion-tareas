const db = require('../db/database');

// Obtener toda la lista de mano de obra
const getManoDeObra = async (req, res) => {
  try {
    console.log('getManoDeObra - Iniciando consulta');
    const manoDeObra = await new Promise((resolve, reject) => {
      const sql = `
        SELECT id, codigo, descripcion, requiere_aprobacion_supervisor, 
               requiere_aprobacion_gerente, unidad_medida, precio
        FROM mano_de_obra 
        ORDER BY codigo
      `;
      console.log('getManoDeObra - SQL:', sql);
      db.all(sql, [], (err, rows) => {
        if (err) {
          console.error('getManoDeObra - Error en consulta:', err);
          reject(err);
        } else {
          console.log('getManoDeObra - Filas obtenidas:', rows ? rows.length : 0);
          resolve(rows);
        }
      });
    });

    console.log('getManoDeObra - Enviando respuesta exitosa');
    res.json({
      message: 'success',
      data: manoDeObra
    });
  } catch (error) {
    console.error('Error al obtener mano de obra:', error);
    res.status(500).json({ error: 'Error interno del servidor al obtener mano de obra.' });
  }
};

// Actualizar mano de obra
const updateManoDeObra = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      codigo, 
      descripcion, 
      requiere_aprobacion_supervisor, 
      requiere_aprobacion_gerente, 
      unidad_medida, 
      precio 
    } = req.body;

    // Validar datos obligatorios
    if (!codigo || !descripcion || !unidad_medida || precio === undefined) {
      return res.status(400).json({ 
        error: 'Código, descripción, unidad de medida y precio son obligatorios.' 
      });
    }

    // Verificar que el código no esté duplicado (excluyendo el registro actual)
    const codigoExistente = await new Promise((resolve, reject) => {
      const sql = `SELECT id FROM mano_de_obra WHERE codigo = ? AND id != ?`;
      db.get(sql, [codigo, id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (codigoExistente) {
      return res.status(400).json({ 
        error: `El código "${codigo}" ya está en uso por otro registro.` 
      });
    }

    // Actualizar el registro
    await new Promise((resolve, reject) => {
      const sql = `
        UPDATE mano_de_obra 
        SET codigo = ?, descripcion = ?, requiere_aprobacion_supervisor = ?, 
            requiere_aprobacion_gerente = ?, unidad_medida = ?, precio = ?
        WHERE id = ?
      `;
      db.run(sql, [
        codigo, 
        descripcion, 
        requiere_aprobacion_supervisor ? 1 : 0, 
        requiere_aprobacion_gerente ? 1 : 0, 
        unidad_medida, 
        precio, 
        id
      ], function(err) {
        if (err) reject(err);
        else resolve(this.changes);
      });
    });

    res.json({
      message: 'Mano de obra actualizada exitosamente.',
      data: { id, codigo, descripcion }
    });
  } catch (error) {
    console.error('Error al actualizar mano de obra:', error);
    res.status(500).json({ error: 'Error interno del servidor al actualizar mano de obra.' });
  }
};

// Obtener toda la lista de materiales
const getMateriales = async (req, res) => {
  try {
    console.log('getMateriales - Iniciando consulta');
    const materiales = await new Promise((resolve, reject) => {
      const sql = `
        SELECT codigo, descripcion, unidad_medida
        FROM materiales 
        ORDER BY codigo
      `;
      console.log('getMateriales - SQL:', sql);
      db.all(sql, [], (err, rows) => {
        if (err) {
          console.error('getMateriales - Error en consulta:', err);
          reject(err);
        } else {
          console.log('getMateriales - Filas obtenidas:', rows ? rows.length : 0);
          resolve(rows);
        }
      });
    });

    console.log('getMateriales - Enviando respuesta exitosa');
    res.json({
      message: 'success',
      data: materiales
    });
  } catch (error) {
    console.error('Error al obtener materiales:', error);
    res.status(500).json({ error: 'Error interno del servidor al obtener materiales.' });
  }
};

// Actualizar material
const updateMaterial = async (req, res) => {
  try {
    const { codigo } = req.params;
    const { descripcion, unidad_medida } = req.body;

    // Validar datos obligatorios
    if (!descripcion || !unidad_medida) {
      return res.status(400).json({ 
        error: 'Descripción y unidad de medida son obligatorios.' 
      });
    }

    // Actualizar el registro
    await new Promise((resolve, reject) => {
      const sql = `
        UPDATE materiales 
        SET descripcion = ?, unidad_medida = ?
        WHERE codigo = ?
      `;
      db.run(sql, [descripcion, unidad_medida, codigo], function(err) {
        if (err) reject(err);
        else resolve(this.changes);
      });
    });

    res.json({
      message: 'Material actualizado exitosamente.',
      data: { codigo, descripcion, unidad_medida }
    });
  } catch (error) {
    console.error('Error al actualizar material:', error);
    res.status(500).json({ error: 'Error interno del servidor al actualizar material.' });
  }
};

module.exports = {
  getManoDeObra,
  updateManoDeObra,
  getMateriales,
  updateMaterial
};
