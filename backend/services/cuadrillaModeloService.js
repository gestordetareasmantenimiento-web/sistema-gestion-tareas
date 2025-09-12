const db = require('../db/database');

/**
 * Servicio para manejar el cálculo automático de la cuadrilla modelo
 */

// Obtener el porcentaje actual de cuadrilla modelo
const getPorcentajeCuadrillaModelo = () => {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT porcentaje FROM cuadrilla_modelo ORDER BY fecha_actualizacion DESC LIMIT 1';
    db.get(sql, [], (err, row) => {
      if (err) reject(err);
      else resolve(row ? row.porcentaje : 40); // Valor por defecto si no existe
    });
  });
};

// Actualizar el porcentaje de cuadrilla modelo
const updatePorcentajeCuadrillaModelo = (nuevoPorcentaje) => {
  return new Promise((resolve, reject) => {
    const sql = 'INSERT INTO cuadrilla_modelo (porcentaje) VALUES (?)';
    db.run(sql, [nuevoPorcentaje], function(err) {
      if (err) reject(err);
      else resolve(this.lastID);
    });
  });
};

// Calcular el adicional de cuadrilla modelo
const calcularCuadrillaModelo = async (manoDeObraSeleccionada) => {
  try {
    const porcentaje = await getPorcentajeCuadrillaModelo();
    
    // Filtrar los items que NO son la cuadrilla modelo (5033311)
    const otrosItems = manoDeObraSeleccionada.filter(item => item.codigo !== '5033311');
    
    // Calcular el subtotal de los otros items
    const subtotalOtrosItems = otrosItems.reduce((total, item) => {
      return total + (item.precio * item.cantidad);
    }, 0);
    
    // Calcular el adicional (40% del subtotal)
    const adicional = subtotalOtrosItems * (porcentaje / 100);
    
    return {
      porcentaje,
      subtotalOtrosItems,
      adicional,
      necesitaCuadrillaModelo: subtotalOtrosItems > 0
    };
  } catch (error) {
    console.error('Error calculando cuadrilla modelo:', error);
    throw error;
  }
};

// Procesar mano de obra con cuadrilla modelo automática
const procesarManoDeObraConCuadrillaModelo = async (manoDeObraSeleccionada) => {
  try {
    const calculo = await calcularCuadrillaModelo(manoDeObraSeleccionada);
    
    let manoDeObraProcesada = [...manoDeObraSeleccionada];
    
    // Buscar si ya existe la cuadrilla modelo en la selección
    const cuadrillaModeloIndex = manoDeObraProcesada.findIndex(item => item.codigo === '5033311');
    
    if (calculo.necesitaCuadrillaModelo) {
      // Si necesita cuadrilla modelo y no existe, agregarla
      if (cuadrillaModeloIndex === -1) {
        // Obtener los datos del código 5033311
        const cuadrillaModeloItem = await new Promise((resolve, reject) => {
          const sql = 'SELECT * FROM mano_de_obra WHERE codigo = ?';
          db.get(sql, ['5033311'], (err, row) => {
            if (err) reject(err);
            else resolve(row);
          });
        });
        
        if (cuadrillaModeloItem) {
          manoDeObraProcesada.push({
            ...cuadrillaModeloItem,
            cantidad: 1, // Cantidad fija para el cálculo automático
            precioCalculado: calculo.adicional // El precio se calcula automáticamente
          });
        }
      } else {
        // Si ya existe, actualizar el precio calculado
        manoDeObraProcesada[cuadrillaModeloIndex].precioCalculado = calculo.adicional;
      }
    } else {
      // Si no necesita cuadrilla modelo, removerla si existe
      if (cuadrillaModeloIndex !== -1) {
        manoDeObraProcesada.splice(cuadrillaModeloIndex, 1);
      }
    }
    
    return {
      manoDeObraProcesada,
      calculo,
      mensaje: calculo.necesitaCuadrillaModelo 
        ? `Cuadrilla modelo aplicada: ${calculo.porcentaje}% ($${calculo.adicional.toLocaleString()})`
        : 'No se requiere cuadrilla modelo'
    };
  } catch (error) {
    console.error('Error procesando mano de obra con cuadrilla modelo:', error);
    throw error;
  }
};

module.exports = {
  getPorcentajeCuadrillaModelo,
  updatePorcentajeCuadrillaModelo,
  calcularCuadrillaModelo,
  procesarManoDeObraConCuadrillaModelo
};
