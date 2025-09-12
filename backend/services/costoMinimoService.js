const db = require('../db/database');

/**
 * Servicio para manejar el cálculo automático del costo mínimo diario
 */

// Obtener el valor actual del costo mínimo diario
const getCostoMinimoDiario = () => {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT valor FROM costominimodiario ORDER BY fecha_actualizacion DESC LIMIT 1';
    db.get(sql, [], (err, row) => {
      if (err) reject(err);
      else resolve(row ? row.valor : 735000); // Valor por defecto si no existe
    });
  });
};

// Actualizar el valor del costo mínimo diario
const updateCostoMinimoDiario = (nuevoValor) => {
  return new Promise((resolve, reject) => {
    const sql = 'INSERT INTO costominimodiario (valor) VALUES (?)';
    db.run(sql, [nuevoValor], function(err) {
      if (err) reject(err);
      else resolve(this.lastID);
    });
  });
};

// Calcular el costo mínimo diario automático
const calcularCostoMinimoDiario = async (manoDeObraSeleccionada) => {
  try {
    const costoMinimoDiario = await getCostoMinimoDiario();
    
    // Filtrar los items que NO son el costo mínimo diario (5020982)
    const otrosItems = manoDeObraSeleccionada.filter(item => item.codigo !== '5020982');
    
    // Calcular el subtotal de los otros items
    const subtotalOtrosItems = otrosItems.reduce((total, item) => {
      return total + (item.precio * item.cantidad);
    }, 0);
    
    // Calcular la diferencia
    const diferencia = costoMinimoDiario - subtotalOtrosItems;
    
    return {
      costoMinimoDiario,
      subtotalOtrosItems,
      diferencia,
      necesitaCostoMinimo: diferencia > 0
    };
  } catch (error) {
    console.error('Error calculando costo mínimo diario:', error);
    throw error;
  }
};

// Validar que no se supere el costo mínimo diario
const validarCostoMinimoDiario = async (manoDeObraSeleccionada) => {
  try {
    const calculo = await calcularCostoMinimoDiario(manoDeObraSeleccionada);
    
    if (calculo.subtotalOtrosItems > calculo.costoMinimoDiario) {
      return {
        valido: false,
        error: `El subtotal de los otros items ($${calculo.subtotalOtrosItems.toLocaleString()}) supera el costo mínimo diario ($${calculo.costoMinimoDiario.toLocaleString()}). Debe revisar las cantidades o eliminar el costo mínimo diario.`,
        calculo
      };
    }
    
    return {
      valido: true,
      calculo
    };
  } catch (error) {
    console.error('Error validando costo mínimo diario:', error);
    throw error;
  }
};

// Procesar mano de obra con costo mínimo diario automático
const procesarManoDeObraConCostoMinimo = async (manoDeObraSeleccionada) => {
  try {
    const validacion = await validarCostoMinimoDiario(manoDeObraSeleccionada);
    
    if (!validacion.valido) {
      throw new Error(validacion.error);
    }
    
    const { calculo } = validacion;
    let manoDeObraProcesada = [...manoDeObraSeleccionada];
    
    // Buscar si ya existe el costo mínimo diario en la selección
    const costoMinimoIndex = manoDeObraProcesada.findIndex(item => item.codigo === '5020982');
    
    if (calculo.necesitaCostoMinimo) {
      // Si necesita costo mínimo diario y no existe, agregarlo
      if (costoMinimoIndex === -1) {
        // Obtener los datos del código 5020982
        const costoMinimoItem = await new Promise((resolve, reject) => {
          const sql = 'SELECT * FROM mano_de_obra WHERE codigo = ?';
          db.get(sql, ['5020982'], (err, row) => {
            if (err) reject(err);
            else resolve(row);
          });
        });
        
        if (costoMinimoItem) {
          manoDeObraProcesada.push({
            ...costoMinimoItem,
            cantidad: 1, // Cantidad fija para el cálculo automático
            precioCalculado: calculo.diferencia // El precio se calcula automáticamente
          });
        }
      } else {
        // Si ya existe, actualizar el precio calculado
        manoDeObraProcesada[costoMinimoIndex].precioCalculado = calculo.diferencia;
      }
    } else {
      // Si no necesita costo mínimo diario, removerlo si existe
      if (costoMinimoIndex !== -1) {
        manoDeObraProcesada.splice(costoMinimoIndex, 1);
      }
    }
    
    return {
      manoDeObraProcesada,
      calculo,
      mensaje: calculo.necesitaCostoMinimo 
        ? `Costo mínimo diario aplicado: $${calculo.diferencia.toLocaleString()}`
        : 'No se requiere costo mínimo diario'
    };
  } catch (error) {
    console.error('Error procesando mano de obra con costo mínimo:', error);
    throw error;
  }
};

module.exports = {
  getCostoMinimoDiario,
  updateCostoMinimoDiario,
  calcularCostoMinimoDiario,
  validarCostoMinimoDiario,
  procesarManoDeObraConCostoMinimo
};
