import type { PageLoad } from './$types';

export const load: PageLoad = async ({ fetch, params }) => {
  try {
    const token = localStorage.getItem('authToken');
    
    if (!token) {
      return {
        error: 'No hay token de autenticación'
      };
    }

    console.log('Superadmin User Dashboard - Role:', params.role, 'Region:', params.region, 'UserId:', params.userId);

    const response = await fetch(`http://localhost:3000/api/superadmin/dashboard/roles/${params.role}/regions/${params.region}/users/${params.userId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('Superadmin User Dashboard - Response status:', response.status);

    if (!response.ok) {
      const errorData = await response.text();
      console.log('Superadmin User Dashboard - Error response:', errorData);
      return {
        error: `Error del servidor: ${response.status}`,
        role: params.role,
        region: params.region,
        userId: params.userId
      };
    }

    const result = await response.json();
    console.log('Superadmin User Dashboard - API Response:', result);

    return {
      role: params.role,
      region: params.region,
      userId: params.userId,
      user: result.data?.user || {},
      tareas: result.data?.tareas || []
    };

  } catch (error) {
    console.log('Superadmin User Dashboard - Error loading data:', error);
    return {
      error: 'Error al cargar los datos del usuario',
      role: params.role,
      region: params.region,
      userId: params.userId
    };
  }
};
