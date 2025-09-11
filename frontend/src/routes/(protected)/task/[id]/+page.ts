// src/routes/(protected)/task/[id]/+page.ts

// Deshabilitar SSR para esta página para evitar problemas con localStorage
export const ssr = false;

export const load = async ({ fetch, params, cookies, url }) => {
  const { id } = params;
  
  try {
    // Obtener el token del localStorage (siempre en cliente con ssr = false)
    const token = localStorage.getItem('authToken') || '';
    
    if (!token) {
      return {
        certificado: null,
        error: 'No se encontró token de autenticación. Por favor, inicia sesión nuevamente.'
      };
    }

    // Hacemos petición para obtener los datos completos del certificado
    const response = await fetch(`http://localhost:3000/api/tareas/${id}/certificado`, {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      let errorMessage = 'Error al cargar los datos de la tarea.';
      
      try {
        const errorResult = await response.json();
        errorMessage = errorResult.error || errorMessage;
      } catch (parseError) {
        // Si no se puede parsear el error, usar mensaje genérico
        if (response.status === 404) {
          errorMessage = 'Tarea no encontrada.';
        } else if (response.status === 500) {
          errorMessage = 'Error interno del servidor.';
        } else if (response.status === 401) {
          errorMessage = 'No autorizado. Por favor, inicia sesión nuevamente.';
        }
      }
      
      return {
        certificado: null,
        error: errorMessage
      };
    }

    const result = await response.json();
    
    // Verificar que los datos sean válidos
    if (!result.data) {
      return {
        certificado: null,
        error: 'Los datos de la tarea están vacíos o son inválidos.'
      };
    }
    
    // Devolvemos los datos de la tarea como certificado para mantener compatibilidad
    return {
      certificado: result.data
    };

  } catch (error) {
    console.error('Error en load function:', error);
    
    let errorMessage = 'Error desconocido al cargar la tarea.';
    
    if (error instanceof Error) {
      if (error.message.includes('fetch')) {
        errorMessage = 'No se pudo conectar con el servidor. Verifica que el backend esté ejecutándose.';
      } else {
        errorMessage = error.message;
      }
    }
    
    return {
      certificado: null,
      error: errorMessage
    };
  }
};