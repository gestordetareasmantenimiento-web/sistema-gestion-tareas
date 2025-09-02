// src/routes/(protected)/task/[id]/close/+page.ts

// La función load recibe 'params', que contiene el ID de la tarea desde la URL
export const load = async ({ fetch, params }) => {
  const { id } = params; 

  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('authToken');
    try {
      // Pedimos los datos de la tarea específica
      const response = await fetch(`http://localhost:3000/api/tareas/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error('No se pudo cargar la tarea.');
      }

      const result = await response.json();
      // Retornamos el objeto de la tarea para que la página lo pueda usar
      return {
        tarea: result.data 
      };
    } catch (error) {
      console.error("Error al cargar la tarea:", error);
      return { tarea: null, error: error.message };
    }
  }
  return { tarea: null };
};