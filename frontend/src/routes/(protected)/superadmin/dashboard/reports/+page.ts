import type { PageLoad } from './$types';

export const ssr = false;

export const load: PageLoad = async ({ fetch }) => {
  try {
    const token = localStorage.getItem('authToken');
    
    if (!token) {
      return {
        error: 'No hay token de autenticación'
      };
    }

    console.log('Superadmin Reports - Loading reports data');

    const response = await fetch('http://localhost:3000/api/superadmin/reports', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('Superadmin Reports - Response status:', response.status);

    if (!response.ok) {
      const errorData = await response.text();
      console.log('Superadmin Reports - Error response:', errorData);
      return {
        error: `Error del servidor: ${response.status}`
      };
    }

    const result = await response.json();
    console.log('Superadmin Reports - API Response:', result);
    console.log('Superadmin Reports - Resumen data:', result.data?.resumen);

    return {
      resumen: result.data?.resumen || {},
      reportes_recientes: result.data?.reportes_recientes || []
    };

  } catch (error) {
    console.log('Superadmin Reports - Error loading data:', error);
    return {
      error: 'Error al cargar los reportes'
    };
  }
};
