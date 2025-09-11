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

    console.log('Superadmin All Tasks - Loading all tasks');

    const response = await fetch('http://localhost:3000/api/superadmin/tasks', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('Superadmin All Tasks - Response status:', response.status);

    if (!response.ok) {
      const errorData = await response.text();
      console.log('Superadmin All Tasks - Error response:', errorData);
      return {
        error: `Error del servidor: ${response.status}`
      };
    }

    const result = await response.json();
    console.log('Superadmin All Tasks - API Response:', result);
    console.log('Superadmin All Tasks - Tasks data:', result.data?.tasks);
    console.log('Superadmin All Tasks - Tasks length:', result.data?.tasks?.length);

    return {
      tareas: result.data?.tasks || []
    };

  } catch (error) {
    console.log('Superadmin All Tasks - Error loading data:', error);
    return {
      error: 'Error al cargar las tareas'
    };
  }
};
