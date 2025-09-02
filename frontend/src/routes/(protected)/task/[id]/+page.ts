// .../task/[id]/+page.ts (Actualizado)
export const load = async ({ fetch, params }) => {
  const { id } = params;
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('authToken');
    try {
      // Hacemos las dos peticiones en paralelo para más eficiencia
      const [tareaRes, adjuntosRes] = await Promise.all([
        fetch(`http://localhost:3000/api/tareas/${id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`http://localhost:3000/api/tareas/${id}/adjuntos`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (!tareaRes.ok) throw new Error('No se pudo cargar la tarea.');
      if (!adjuntosRes.ok) throw new Error('No se pudieron cargar los adjuntos.');

      const tareaResult = await tareaRes.json();
      const adjuntosResult = await adjuntosRes.json();

      return {
        tarea: tareaResult.data,
        adjuntos: adjuntosResult.data
      };
    } catch (error) {
      // ... (manejo de error existente) ...
    }
  }
  return { tarea: null, adjuntos: [] };
};