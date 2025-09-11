import type { PageLoad } from './$types';

export const load: PageLoad = async ({ params, fetch }) => {
  try {
    const token = localStorage.getItem('authToken');
    
    if (!token) {
      return {
        error: 'No hay token de autenticación'
      };
    }

    const region = decodeURIComponent(params.region);
    console.log('Region Details - Region:', region);

    const response = await fetch(`http://localhost:3000/api/superadmin/dashboard/${encodeURIComponent(region)}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('Region Details - Response status:', response.status);

    if (!response.ok) {
      const errorData = await response.text();
      console.log('Region Details - Error response:', errorData);
      return {
        error: `Error del servidor: ${response.status}`,
        region
      };
    }

    const result = await response.json();
    console.log('Region Details - API Response:', result);

    return {
      region,
      roles: result.data?.roles || []
    };

  } catch (error) {
    console.log('Region Details - Error loading data:', error);
    return {
      error: 'Error al cargar los datos de la región',
      region: params.region
    };
  }
};
