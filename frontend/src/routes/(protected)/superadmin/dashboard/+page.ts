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

    console.log('Superadmin Dashboard - Token:', token);

    const response = await fetch('http://localhost:3000/api/superadmin/dashboard', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('Superadmin Dashboard - Response status:', response.status);
    console.log('Superadmin Dashboard - Response ok:', response.ok);

    if (!response.ok) {
      const errorData = await response.text();
      console.log('Superadmin Dashboard - Error response:', errorData);
      return {
        error: `Error del servidor: ${response.status}`
      };
    }

    const result = await response.json();
    console.log('Superadmin Dashboard - API Response:', result);

    return {
      roles: result.data?.roles || [],
      resumen: result.data?.resumen || {}
    };

  } catch (error) {
    console.log('Superadmin Dashboard - Error loading data:', error);
    return {
      error: 'Error al cargar los datos del dashboard'
    };
  }
};
