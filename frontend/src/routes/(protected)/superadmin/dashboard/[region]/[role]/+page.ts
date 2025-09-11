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
    const role = decodeURIComponent(params.role);
    
    console.log('Role Users - Region:', region, 'Role:', role);

    const response = await fetch(`http://localhost:3000/api/superadmin/dashboard/${encodeURIComponent(region)}/${encodeURIComponent(role)}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('Role Users - Response status:', response.status);

    if (!response.ok) {
      const errorData = await response.text();
      console.log('Role Users - Error response:', errorData);
      return {
        error: `Error del servidor: ${response.status}`,
        region,
        role
      };
    }

    const result = await response.json();
    console.log('Role Users - API Response:', result);

    return {
      region,
      role,
      users: result.data?.users || []
    };

  } catch (error) {
    console.log('Role Users - Error loading data:', error);
    return {
      error: 'Error al cargar los usuarios del rol',
      region: params.region,
      role: params.role
    };
  }
};
