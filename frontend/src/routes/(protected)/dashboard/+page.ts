// src/routes/(protected)/dashboard/+page.ts (Ajustado)
export const load = async ({ fetch }) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('authToken');
    console.log('Token from localStorage:', token ? 'Present' : 'Missing');
    console.log('Token value:', token ? token.substring(0, 20) + '...' : 'None');
    
    if (!token) {
      return { columnas: {}, error: 'No hay token de autenticación. Por favor, inicia sesión nuevamente.' };
    }
    
    try {
      console.log('Making request to API...');
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
      console.log('API Response:', result);

      // El backend nos da { message: "success", data: columnas }
      return { columnas: result.data || {} };

    } catch (error) {
      console.error('Error loading tasks:', error);
      return { columnas: {}, error: error.message };
    }
  }
  return { columnas: {} };
};