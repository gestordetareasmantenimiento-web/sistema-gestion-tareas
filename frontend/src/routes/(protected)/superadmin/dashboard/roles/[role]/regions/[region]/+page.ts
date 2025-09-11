import type { PageLoad } from './$types';

export const load: PageLoad = async ({ fetch, params }) => {
  try {
    const token = localStorage.getItem('authToken');
    
    if (!token) {
      return {
        error: 'No hay token de autenticación'
      };
    }

    console.log('Superadmin Region Users - Role:', params.role, 'Region:', params.region);

    const response = await fetch(`http://localhost:3000/api/superadmin/dashboard/roles/${params.role}/regions/${params.region}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('Superadmin Region Users - Response status:', response.status);

    if (!response.ok) {
      const errorData = await response.text();
      console.log('Superadmin Region Users - Error response:', errorData);
      return {
        error: `Error del servidor: ${response.status}`,
        role: params.role,
        region: params.region
      };
    }

    const result = await response.json();
    console.log('Superadmin Region Users - API Response:', result);

    return {
      role: params.role,
      region: params.region,
      usuarios: result.data?.usuarios || []
    };

  } catch (error) {
    console.log('Superadmin Region Users - Error loading data:', error);
    return {
      error: 'Error al cargar los usuarios de la región',
      role: params.role,
      region: params.region
    };
  }
};
