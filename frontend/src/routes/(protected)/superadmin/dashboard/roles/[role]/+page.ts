import type { PageLoad } from './$types';

export const load: PageLoad = async ({ fetch, params }) => {
  try {
    const token = localStorage.getItem('authToken');
    
    if (!token) {
      return {
        error: 'No hay token de autenticación'
      };
    }

    console.log('Superadmin Role Details - Role:', params.role);

    const response = await fetch(`http://localhost:3000/api/superadmin/dashboard/roles/${params.role}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('Superadmin Role Details - Response status:', response.status);

    if (!response.ok) {
      const errorData = await response.text();
      console.log('Superadmin Role Details - Error response:', errorData);
      return {
        error: `Error del servidor: ${response.status}`,
        role: params.role
      };
    }

    const result = await response.json();
    console.log('Superadmin Role Details - API Response:', result);

    return {
      role: params.role,
      regiones: result.data?.regiones || [],
      resumen: result.data?.resumen || {}
    };

  } catch (error) {
    console.log('Superadmin Role Details - Error loading data:', error);
    return {
      error: 'Error al cargar los datos del rol',
      role: params.role
    };
  }
};
