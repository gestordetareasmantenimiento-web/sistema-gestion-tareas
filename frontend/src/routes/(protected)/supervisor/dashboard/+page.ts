// src/routes/(protected)/supervisor/dashboard/+page.ts (CORREGIDO)

export const load = async ({ fetch }) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('authToken');
    console.log('Supervisor Dashboard load function - Token:', token ? 'Present' : 'Missing');
    
    if (!token) {
      return { columnas: {}, error: 'No hay token de autenticación. Por favor, inicia sesión nuevamente.' };
    }
    
    try {
      console.log('Making request to API from supervisor dashboard...');
      const response = await fetch('http://localhost:3000/api/tareas', {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error(`Error ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      console.log('Supervisor Dashboard API Response:', result);

      // Pasamos directamente el objeto 'columnas' que nos da el backend
      return { columnas: result.data || {} };

    } catch (error) {
      console.error('Error loading tasks in supervisor dashboard:', error);
      return { columnas: {}, error: error.message };
    }
  }
  return { columnas: {} };
};