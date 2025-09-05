// src/routes/(protected)/task/[id]/+page.ts

export const load = async ({ fetch, params }) => {
  const { id } = params;
  
  // Este código ahora puede ejecutarse tanto en servidor como en cliente
  // SvelteKit se encarga de pasar `fetch` con las cookies/headers correctos
  try {
    const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : '';

    // Hacemos UNA SOLA petición a nuestro nuevo endpoint
    const response = await fetch(`http://localhost:3000/api/tareas/${id}/certificado`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!response.ok) {
      const errorResult = await response.json();
      throw new Error(errorResult.error || 'No se pudieron cargar los datos de la tarea.');
    }

    const result = await response.json();
    
    // Devolvemos todos los datos bajo una sola propiedad `certificado`
    return {
      certificado: result.data
    };

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    return {
      certificado: null,
      error: message
    };
  }
};