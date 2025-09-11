import type { PageLoad } from './$types';

export const load: PageLoad = async ({ params, fetch }) => {
  try {
    const token = localStorage.getItem('authToken');
    
    if (!token) {
      return {
        error: 'No hay token de autenticación'
      };
    }

    const region = decodeURIComponent(params.region);
    const role = decodeURIComponent(params.role);
    const userId = params.userId;
    
    console.log('User Dashboard - Region:', region, 'Role:', role, 'UserId:', userId);

    // Obtener información del usuario
    const userResponse = await fetch(`http://localhost:3000/api/superadmin/dashboard/${encodeURIComponent(region)}/${encodeURIComponent(role)}/${userId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('User Dashboard - User Response status:', userResponse.status);

    if (!userResponse.ok) {
      const errorData = await userResponse.text();
      console.log('User Dashboard - Error response:', errorData);
      return {
        error: `Error del servidor: ${userResponse.status}`,
        region,
        role,
        userId
      };
    }

    const userResult = await userResponse.json();
    console.log('User Dashboard - User API Response:', userResult);

    // Obtener tareas del usuario (simulando el login como ese usuario)
    let tasks = [];
    try {
      // Crear un token temporal para el usuario específico
      const tempTokenResponse = await fetch('http://localhost:3000/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: userResult.data?.user?.email,
          password: 'password123' // Contraseña por defecto
        })
      });

      if (tempTokenResponse.ok) {
        const tempTokenResult = await tempTokenResponse.json();
        const tempToken = tempTokenResult.token;

        // Obtener tareas con el token temporal
        const tasksResponse = await fetch('http://localhost:3000/api/tareas', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${tempToken}`,
            'Content-Type': 'application/json'
          }
        });

        if (tasksResponse.ok) {
          const tasksResult = await tasksResponse.json();
          tasks = tasksResult.data || [];
        }
      }
    } catch (error) {
      console.log('Error obteniendo tareas del usuario:', error);
    }

    return {
      region,
      role,
      userId,
      user: userResult.data?.user || null,
      tasks
    };

  } catch (error) {
    console.log('User Dashboard - Error loading data:', error);
    return {
      error: 'Error al cargar el dashboard del usuario',
      region: params.region,
      role: params.role,
      userId: params.userId
    };
  }
};
