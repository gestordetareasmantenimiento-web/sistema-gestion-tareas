import type { PageLoad } from './$types';

export const load: PageLoad = async ({ fetch }) => {
  try {
    // Verificar que el usuario esté autenticado
    const token = localStorage.getItem('authToken');
    if (!token) {
      return {
        error: 'No autorizado'
      };
    }

    // Cargar datos de configuración
    const [costoResponse, cuadrillaResponse] = await Promise.all([
      fetch('http://localhost:3000/api/costo-minimo/valor', {
        headers: { 'Authorization': `Bearer ${token}` }
      }),
      fetch('http://localhost:3000/api/cuadrilla-modelo/porcentaje', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
    ]);

    const costoData = costoResponse.ok ? await costoResponse.json() : { data: { valor: 0 } };
    const cuadrillaData = cuadrillaResponse.ok ? await cuadrillaResponse.json() : { data: { porcentaje: 0 } };

    return {
      costoMinimo: costoData.data?.valor || 0,
      cuadrillaModelo: cuadrillaData.data?.porcentaje || 0
    };
  } catch (error) {
    console.error('Error loading settings:', error);
    return {
      error: 'Error al cargar la configuración'
    };
  }
};
