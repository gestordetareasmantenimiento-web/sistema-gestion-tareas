<script lang="ts">
  import { goto } from '$app/navigation';
  import { onMount, onDestroy } from 'svelte';
  import VerticalCertificationForm from '$lib/components/VerticalCertificationForm.svelte';
  import { user } from '$lib/stores/auth';
  export let data;

  // --- Estado del Formulario ---
  let showCertificationForm = true;
  let tarea = null;
  let taskId = data?.taskId || null;
  let listaManoDeObra = [];
  let listaMateriales = [];
  let loading = true;
  let error = null;

  // --- Cargar datos desde el cliente ---
  onMount(async () => {
    console.log('Client onMount - data:', data);
    console.log('Current URL:', window.location.href);
    
    const token = localStorage.getItem('authToken');
    if (!token) {
      goto('/login');
      return;
    }

    // Fallback: extraer ID de la URL si no viene en data
    if (!taskId) {
      const urlParts = window.location.pathname.split('/');
      const taskIndex = urlParts.findIndex(part => part === 'task');
      if (taskIndex !== -1 && urlParts[taskIndex + 1]) {
        taskId = urlParts[taskIndex + 1];
        console.log('Extracted taskId from URL:', taskId);
      }
    }

    if (!taskId) {
      console.error('No taskId provided, data:', data, 'URL:', window.location.pathname);
      error = 'ID de tarea no válido';
      loading = false;
      return;
    }

    try {
      console.log('Fetching tarea with ID:', taskId);
      // Obtener datos de la tarea
      const tareaResponse = await fetch(`http://localhost:3000/api/tareas/${taskId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!tareaResponse.ok) {
        if (tareaResponse.status === 401) {
          goto('/login');
          return;
        }
        throw new Error('Error al cargar la tarea');
      }

      tarea = await tareaResponse.json();

      // Obtener listas de mano de obra y materiales
      const [manoDeObraResponse, materialesResponse] = await Promise.all([
        fetch('http://localhost:3000/api/listas/mano-de-obra', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }),
        fetch('http://localhost:3000/api/listas/materiales', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
      ]);

      if (manoDeObraResponse.ok) {
        const manoDeObraData = await manoDeObraResponse.json();
        listaManoDeObra = manoDeObraData.data || [];
        console.log('✅ Mano de obra cargada:', listaManoDeObra.length, 'elementos');
      } else {
        console.error('❌ Error cargando mano de obra:', manoDeObraResponse.status);
      }
      
      if (materialesResponse.ok) {
        const materialesData = await materialesResponse.json();
        listaMateriales = materialesData.data || [];
        console.log('✅ Materiales cargados:', listaMateriales.length, 'elementos');
      } else {
        console.error('❌ Error cargando materiales:', materialesResponse.status);
      }
      
      loading = false;
    } catch (err) {
      console.error('Error cargando datos:', err);
      error = 'Error al cargar los datos';
      loading = false;
    }
  });

  // --- Funciones de manejo de eventos ---
  function handleCertificadoEmitido(event: CustomEvent) {
    console.log('Certificado emitido:', event.detail);
    showCertificationForm = false;
    
    // Redirigir al dashboard correcto según el rol del usuario
    setTimeout(() => {
      // Obtener el rol del usuario desde el store
      let userRole = '';
      const unsubscribe = user.subscribe(currentUser => {
        if (currentUser) {
          userRole = currentUser.rol;
        }
      });
      unsubscribe(); // Limpiar la suscripción inmediatamente
      
      // Determinar el dashboard correcto según el rol
      let dashboardPath = '/dashboard'; // fallback por defecto
      
      switch (userRole) {
        case 'proveedor':
          dashboardPath = '/proveedor/dashboard';
          break;
        case 'inspector':
          dashboardPath = '/dashboard';
          break;
        case 'supervisor_mantenimiento':
          dashboardPath = '/supervisor/dashboard';
          break;
        case 'supervisor_obra':
          dashboardPath = '/supervisor/dashboard';
          break;
        case 'administrativo':
          dashboardPath = '/admin/dashboard';
          break;
        case 'gerente':
          dashboardPath = '/gerente/dashboard';
          break;
        case 'cerco':
          dashboardPath = '/cerco/dashboard';
          break;
        default:
          dashboardPath = '/dashboard';
      }
      
      console.log(`Redirigiendo a dashboard para rol ${userRole}: ${dashboardPath}`);
      goto(dashboardPath);
      
      // Recargar la página después de un breve delay para asegurar que la navegación se complete
      setTimeout(() => {
        console.log('🔄 Recargando página para actualizar datos...');
        window.location.reload();
      }, 500);
    }, 2000);
  }
  
  function handleClose() {
    console.log('handleClose called - taskId:', taskId, 'tarea:', tarea);
    if (taskId) {
      console.log('Navigating to task:', taskId);
      goto(`/task/${taskId}`);
    } else if (tarea && tarea.id_tarea) {
      console.log('Navigating to task using tarea.id_tarea:', tarea.id_tarea);
      goto(`/task/${tarea.id_tarea}`);
    } else {
      console.log('No valid task ID found, going to dashboard');
      goto('/dashboard');
    }
  }
</script>

<div class="certification-page">
  {#if loading}
    <div class="loading-container">
      <div class="loading-spinner"></div>
      <p>Cargando certificado...</p>
    </div>
  {:else if error}
    <div class="error-container">
      <h2>Error</h2>
      <p>{error}</p>
      <button on:click={() => goto('/dashboard')}>Volver al Dashboard</button>
    </div>
  {:else if showCertificationForm && tarea}
    {console.log('Rendering VerticalCertificationForm with taskId:', taskId)}
    <VerticalCertificationForm 
      tarea={tarea}
      taskId={taskId}
      manoDeObra={listaManoDeObra}
      materiales={listaMateriales}
      on:certificadoEmitido={handleCertificadoEmitido}
      on:close={handleClose}
    />
  {/if}
</div>

<style>
  :global(body) {
    overflow: hidden;
  }
  
  :global(header) {
    display: none !important;
  }
  
  .certification-page {
    width: 100vw;
    max-width: 100vw;
    margin: 0;
    padding: 0;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    background: #f5f5f5;
    box-sizing: border-box;
    position: fixed;
    top: 0;
    left: 0;
    z-index: 9999;
  }
  
  .loading-container, .error-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 50vh;
    text-align: center;
  }
  
  .loading-spinner {
    width: 40px;
    height: 40px;
    border: 4px solid #f3f3f3;
    border-top: 4px solid #667eea;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 1rem;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  .error-container h2 {
    color: #dc3545;
    margin-bottom: 1rem;
  }
  
  .error-container button {
    background: #007bff;
    color: white;
    border: none;
    padding: 0.75rem 1.5rem;
    border-radius: 4px;
    cursor: pointer;
    margin-top: 1rem;
  }
  
</style>