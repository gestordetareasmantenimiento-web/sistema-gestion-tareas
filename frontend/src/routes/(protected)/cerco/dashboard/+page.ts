// src/routes/(protected)/cerco/dashboard/+page.ts (CORREGIDO)

export const load = async ({ fetch }) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('authToken');
    try {
      const response = await fetch('http://localhost:3000/api/tareas', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('No se pudieron cargar las tareas.');
      const result = await response.json();
      // Pasamos directamente el objeto 'columnas' que nos da el backend
      return { columnas: result.data || {} };

    } catch (error) {
      return { columnas: {}, error: error.message };
    }
  }
  return { columnas: {} };
};