<script lang="ts">
  import { user } from '$lib/stores/auth';
  import TaskTable from '$lib/components/TaskTable.svelte';
  export let data;

  // Función para volver a la lista de usuarios del rol
  function goBack() {
    window.location.href = `/superadmin/dashboard/${data.region}/${data.role}`;
  }

  // Función para ir al dashboard del usuario
  function goToUserDashboard() {
    // Determinar la ruta del dashboard según el rol del usuario
    let dashboardRoute = '';
    
    switch (data.user?.rol?.toLowerCase()) {
      case 'inspector':
        dashboardRoute = '/dashboard';
        break;
      case 'supervisor de mantenimiento':
      case 'supervisor de disponibilidad':
      case 'supervisor de soporte':
      case 'supervisor de provision':
        dashboardRoute = '/supervisor/dashboard';
        break;
      case 'administrativo':
        dashboardRoute = '/admin/dashboard';
        break;
      case 'gerente':
        dashboardRoute = '/admin/dashboard';
        break;
      case 'cerco':
        dashboardRoute = '/admin/dashboard';
        break;
      case 'proveedor':
        dashboardRoute = '/proveedor/dashboard';
        break;
      default:
        dashboardRoute = '/dashboard';
    }
    
    // Navegar al dashboard del usuario
    window.location.href = dashboardRoute;
  }
</script>

<div class="user-dashboard-container">
  <div class="header">
    <button class="back-button" on:click={goBack}>← Volver</button>
    <div class="header-content">
      <h1>👤 Dashboard de {data.user?.nombre_completo}</h1>
      <p>{data.user?.rol} en {data.region}</p>
    </div>
    <button class="view-dashboard-button" on:click={goToUserDashboard}>
      🖥️ Ver Dashboard
    </button>
  </div>

  {#if data.error}
    <div class="error-message">
      <p>{data.error}</p>
    </div>
  {:else if data.user}
    <!-- Información del usuario -->
    <div class="user-info-section">
      <h2>📋 Información del Usuario</h2>
      <div class="user-info-grid">
        <div class="info-card">
          <div class="info-icon">👤</div>
          <div class="info-content">
            <h3>Nombre Completo</h3>
            <p>{data.user.nombre_completo}</p>
          </div>
        </div>
        <div class="info-card">
          <div class="info-icon">📧</div>
          <div class="info-content">
            <h3>Email</h3>
            <p>{data.user.email}</p>
          </div>
        </div>
        <div class="info-card">
          <div class="info-icon">🏷️</div>
          <div class="info-content">
            <h3>Rol</h3>
            <p>{data.user.rol}</p>
          </div>
        </div>
        <div class="info-card">
          <div class="info-icon">🆔</div>
          <div class="info-content">
            <h3>ID de Usuario</h3>
            <p>{data.user.id}</p>
          </div>
        </div>
        <div class="info-card">
          <div class="info-icon">🌍</div>
          <div class="info-content">
            <h3>Regiones</h3>
            <p>{data.user.regiones || 'No asignado'}</p>
          </div>
        </div>
        <div class="info-card">
          <div class="info-icon">📊</div>
          <div class="info-content">
            <h3>Tareas Activas</h3>
            <p>{data.user.tareas_activas || 0}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Dashboard del usuario -->
    <div class="dashboard-section">
      <h2>📊 Dashboard del Usuario</h2>
      <p>Vista de las tareas desde la perspectiva de {data.user.nombre_completo}</p>
      
      {#if data.tasks && data.tasks.length > 0}
        <TaskTable tasks={data.tasks} />
      {:else}
        <div class="no-tasks">
          <p>No hay tareas disponibles para este usuario</p>
        </div>
      {/if}
    </div>
  {:else}
    <div class="no-user">
      <p>Usuario no encontrado</p>
    </div>
  {/if}
</div>

<style>
  .user-dashboard-container {
    max-width: 1400px;
    margin: 0 auto;
    padding: 1rem;
  }

  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 2rem;
    padding: 2rem;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border-radius: 12px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    position: relative;
  }

  .header-content {
    text-align: center;
    flex: 1;
  }

  .back-button {
    background: rgba(255, 255, 255, 0.2);
    color: white;
    border: none;
    border-radius: 6px;
    padding: 0.5rem 1rem;
    cursor: pointer;
    font-size: 0.9rem;
    transition: background 0.2s;
  }

  .back-button:hover {
    background: rgba(255, 255, 255, 0.3);
  }

  .view-dashboard-button {
    background: rgba(255, 255, 255, 0.2);
    color: white;
    border: none;
    border-radius: 6px;
    padding: 0.75rem 1.5rem;
    cursor: pointer;
    font-size: 1rem;
    font-weight: 600;
    transition: all 0.3s ease;
  }

  .view-dashboard-button:hover {
    background: rgba(255, 255, 255, 0.3);
    transform: translateY(-2px);
  }

  .header h1 {
    margin: 0 0 0.5rem 0;
    font-size: 2.5rem;
    font-weight: 700;
  }

  .header p {
    margin: 0;
    font-size: 1.1rem;
    opacity: 0.9;
  }

  .user-info-section, .dashboard-section {
    margin-bottom: 2rem;
  }

  .user-info-section h2, .dashboard-section h2 {
    color: #333;
    margin-bottom: 1rem;
    font-size: 1.5rem;
    font-weight: 600;
  }

  .user-info-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1.5rem;
  }

  .info-card {
    background: white;
    border-radius: 12px;
    padding: 1.5rem;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .info-icon {
    font-size: 2rem;
    width: 60px;
    height: 60px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #f8f9fa;
    border-radius: 12px;
  }

  .info-content h3 {
    margin: 0 0 0.5rem 0;
    color: #666;
    font-size: 0.9rem;
    font-weight: 500;
  }

  .info-content p {
    margin: 0;
    color: #333;
    font-size: 1.1rem;
    font-weight: 600;
  }

  .error-message {
    background: #f8d7da;
    color: #721c24;
    padding: 1rem;
    border-radius: 8px;
    border: 1px solid #f5c6cb;
    margin-bottom: 1rem;
  }

  .no-tasks, .no-user {
    text-align: center;
    padding: 3rem;
    color: #6c757d;
    font-size: 1.1rem;
    background: white;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  /* Responsive */
  @media (max-width: 768px) {
    .user-dashboard-container {
      padding: 0.5rem;
    }

    .header h1 {
      font-size: 2rem;
    }

    .back-button {
      position: static;
      transform: none;
      margin-bottom: 1rem;
    }

    .user-info-grid {
      grid-template-columns: 1fr;
    }

    .info-card {
      flex-direction: column;
      text-align: center;
    }
  }
</style>
