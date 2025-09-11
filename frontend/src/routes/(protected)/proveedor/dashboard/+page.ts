// src/routes/(protected)/proveedor/dashboard/+page.ts
export const ssr = false;

export const load = async ({ fetch }) => {
  const token = localStorage.getItem('authToken');
  
  // Verificar que el token existe antes de hacer la petición
  if (!token) {
    return { columnas: {}, error: 'Token de autenticación no encontrado' };
  }
  
  try {
    const response = await fetch('http://localhost:3000/api/tareas', {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Sesión expirada. Por favor, inicia sesión nuevamente.');
      } else if (response.status === 403) {
        throw new Error('No tienes permisos para acceder a esta información.');
      } else {
        throw new Error(`Error del servidor: ${response.status}`);
      }
    }
    
    const result = await response.json();
    return { columnas: result.data || {} };
  } catch (error) {
    console.error('Error cargando tareas:', error);
    return { columnas: {}, error: error.message };
  }
};
