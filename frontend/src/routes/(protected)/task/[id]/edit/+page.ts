// src/routes/(protected)/task/[id]/edit/+page.ts

export const load = async ({ fetch, params }) => {
  const { id } = params;

  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('authToken');
    try {
      const response = await fetch(`http://localhost:3000/api/tareas/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('No se pudo cargar la tarea para editar.');

      const result = await response.json();
      return {
        tarea: result.data
      };
    } catch (error) {
      return { tarea: null, error: error.message };
    }
  }
  return { tarea: null };
};