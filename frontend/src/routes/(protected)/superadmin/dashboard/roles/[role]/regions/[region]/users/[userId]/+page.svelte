<script lang="ts">
  import { user } from '$lib/stores/auth';
  export let data;

  // Función para volver a la lista de usuarios
  function goBack() {
    window.location.href = `/superadmin/dashboard/roles/${data.role}/regions/${data.region}`;
  }

  // Función para navegar al dashboard del usuario
  function navigateToUserDashboard() {
    const dashboardRoutes = {
      'proveedor': '/proveedor/dashboard',
      'inspector': '/dashboard',
      'supervisor de mantenimiento': '/supervisor/dashboard',
      'supervisor de disponibilidad': '/supervisor/dashboard',
      'supervisor de soporte': '/supervisor/dashboard',
      'supervisor de provision': '/supervisor/dashboard',
      'administrativo': '/admin/dashboard',
      'gerente': '/gerente/dashboard',
      'cerco': '/cerco/dashboard'
    };
    
    const route = dashboardRoutes[data.user.rol] || '/dashboard';
    window.location.href = route;
  }
</script>

<div class="user-dashboard-container">
  <div class="header">
    <button class="back-button" on:click={goBack}>← Volver</button>
    <h1>👤 {data.user.nombre_completo}</h1>
    <p>Dashboard del usuario - {data.user.rol} en {data.user.region}</p>
  </div>

  {#if data.error}
    <div class="error-message">
      <p>{data.error}</p>
    </div>
  {:else}
    <!-- Información del usuario -->
    <div class="user-info-section">
      <h2>📋 Información del Usuario</h2>
      <div class="user-info-grid">
        <div class="info-card">
          <div class="info-icon">🆔</div>
          <div class="info-content">
            <h3>ID de Usuario</h3>
            <p class="info-value">{data.user.id}</p>
          </div>
        </div>
        <div class="info-card">
          <div class="info-icon">👤</div>
          <div class="info-content">
            <h3>Nombre Completo</h3>
            <p class="info-value">{data.user.nombre_completo}</p>
          </div>
        </div>
        <div class="info-card">
          <div class="info-icon">📧</div>
          <div class="info-content">
            <h3>Email</h3>
            <p class="info-value">{data.user.email || 'No especificado'}</p>
          </div>
        </div>
        <div class="info-card">
          <div class="info-icon">🏷️</div>
          <div class="info-content">
            <h3>Rol</h3>
            <p class="info-value">{data.user.rol}</p>
          </div>
        </div>
        <div class="info-card">
          <div class="info-icon">🌍</div>
          <div class="info-content">
            <h3>Región</h3>
            <p class="info-value">{data.user.region}</p>
          </div>
        </div>
        <div class="info-card">
          <div class="info-icon">⚡</div>
          <div class="info-content">
            <h3>Estado</h3>
            <p class="info-value {data.user.activo ? 'active' : 'inactive'}">
              {data.user.activo ? 'Activo' : 'Inactivo'}
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Estadísticas de tareas -->
    <div class="tasks-stats-section">
      <h2>📊 Estadísticas de Tareas</h2>
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon">📋</div>
          <div class="stat-content">
            <h3>Tareas Activas</h3>
            <p class="stat-number">{data.tareas?.length || 0}</p>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">✅</div>
          <div class="stat-content">
            <h3>Completadas</h3>
            <p class="stat-number">{data.tareas?.filter(t => t.estado === 'Finalizada - Aprobada').length || 0}</p>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">⏳</div>
          <div class="stat-content">
            <h3>En Proceso</h3>
            <p class="stat-number">{data.tareas?.filter(t => !['Finalizada - Aprobada', 'Cancelada'].includes(t.estado)).length || 0}</p>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">❌</div>
          <div class="stat-content">
            <h3>Canceladas</h3>
            <p class="stat-number">{data.tareas?.filter(t => t.estado === 'Cancelada').length || 0}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Lista de tareas -->
    {#if data.tareas && data.tareas.length > 0}
      <div class="tasks-section">
        <h2>📋 Tareas del Usuario</h2>
        <div class="tasks-table-container">
          <table class="tasks-table">
            <thead>
              <tr>
                <th>ID Tarea</th>
                <th>Descripción</th>
                <th>Estado</th>
                <th>Fecha Creación</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {#each data.tareas as tarea (tarea.id)}
                <tr>
                  <td>{tarea.id_tarea_texto}</td>
                  <td class="description-cell">{tarea.descripcion}</td>
                  <td>
                    <span class="status-badge {tarea.estado.toLowerCase().replace(/\s+/g, '-')}">
                      {tarea.estado}
                    </span>
                  </td>
                  <td>{new Date(tarea.fecha_creacion).toLocaleDateString()}</td>
                  <td>
                    <button class="action-btn small" on:click={() => window.location.href = `/task/${tarea.id}`}>
                      Ver Detalles
                    </button>
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      </div>
    {:else}
      <div class="no-tasks">
        <h2>📋 Tareas del Usuario</h2>
        <p>Este usuario no tiene tareas asignadas.</p>
      </div>
    {/if}

    <!-- Acciones -->
    <div class="actions-section">
      <h2>⚡ Acciones</h2>
      <div class="actions-grid">
        <button class="action-btn primary large" on:click={navigateToUserDashboard}>
          🚀 Ir al Dashboard del Usuario
        </button>
        <button class="action-btn secondary large" on:click={() => window.location.href = `/superadmin/users/${data.user.id}/edit`}>
          ✏️ Editar Usuario
        </button>
      </div>
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
    text-align: center;
    margin-bottom: 2rem;
    padding: 2rem;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border-radius: 12px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    position: relative;
  }

  .back-button {
    position: absolute;
    left: 2rem;
    top: 50%;
    transform: translateY(-50%);
    background: rgba(255, 255, 255, 0.2);
    border: 1px solid rgba(255, 255, 255, 0.3);
    color: white;
    padding: 0.5rem 1rem;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.3s ease;
  }

  .back-button:hover {
    background: rgba(255, 255, 255, 0.3);
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

  .user-info-section, .tasks-stats-section, .tasks-section, .actions-section, .no-tasks {
    margin-bottom: 2rem;
  }

  .user-info-section h2, .tasks-stats-section h2, .tasks-section h2, .actions-section h2, .no-tasks h2 {
    color: #333;
    margin-bottom: 1rem;
    font-size: 1.5rem;
    font-weight: 600;
  }

  .user-info-grid, .stats-grid, .actions-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1.5rem;
  }

  .info-card, .stat-card {
    background: white;
    border-radius: 12px;
    padding: 1.5rem;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .info-icon, .stat-icon {
    font-size: 2.5rem;
    opacity: 0.8;
  }

  .info-content h3, .stat-content h3 {
    margin: 0 0 0.5rem 0;
    color: #333;
    font-size: 1rem;
    font-weight: 600;
  }

  .info-value, .stat-number {
    margin: 0;
    color: #667eea;
    font-size: 1.5rem;
    font-weight: 700;
  }

  .info-value.active {
    color: #28a745;
  }

  .info-value.inactive {
    color: #dc3545;
  }

  .tasks-table-container {
    background: white;
    border-radius: 12px;
    padding: 1.5rem;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    overflow-x: auto;
  }

  .tasks-table {
    width: 100%;
    border-collapse: collapse;
  }

  .tasks-table th,
  .tasks-table td {
    padding: 1rem;
    text-align: left;
    border-bottom: 1px solid #e1e5e9;
  }

  .tasks-table th {
    background: #f8f9fa;
    font-weight: 600;
    color: #333;
  }

  .description-cell {
    max-width: 300px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .status-badge {
    padding: 0.25rem 0.75rem;
    border-radius: 20px;
    font-size: 0.8rem;
    font-weight: 600;
    text-transform: capitalize;
  }

  .status-badge.asignada {
    background: #e3f2fd;
    color: #1976d2;
  }

  .status-badge.pendiente-certificación-inspector {
    background: #fff3e0;
    color: #f57c00;
  }

  .status-badge.pendiente-aprobación-supervisor {
    background: #f3e5f5;
    color: #7b1fa2;
  }

  .status-badge.pendiente-aprobación-administración {
    background: #e8f5e8;
    color: #388e3c;
  }

  .status-badge.pendiente-aprobación-gerente {
    background: #fff8e1;
    color: #f9a825;
  }

  .status-badge.pendiente-aprobación-cerco {
    background: #fce4ec;
    color: #c2185b;
  }

  .status-badge.finalizada---aprobada {
    background: #e8f5e8;
    color: #2e7d32;
  }

  .status-badge.cancelada {
    background: #ffebee;
    color: #d32f2f;
  }

  .action-btn {
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    text-decoration: none;
    display: inline-block;
    text-align: center;
  }

  .action-btn.primary {
    background: #667eea;
    color: white;
  }

  .action-btn.primary:hover {
    background: #5a6fd8;
    transform: translateY(-2px);
  }

  .action-btn.secondary {
    background: #6c757d;
    color: white;
  }

  .action-btn.secondary:hover {
    background: #5a6268;
    transform: translateY(-2px);
  }

  .action-btn.small {
    padding: 0.5rem 1rem;
    font-size: 0.9rem;
  }

  .action-btn.large {
    padding: 1rem 2rem;
    font-size: 1.1rem;
  }

  .no-tasks {
    text-align: center;
    background: white;
    border-radius: 12px;
    padding: 2rem;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  .no-tasks p {
    color: #666;
    font-size: 1.1rem;
    margin: 0;
  }

  .error-message {
    background: #fee;
    border: 1px solid #fcc;
    color: #c33;
    padding: 1rem;
    border-radius: 8px;
    text-align: center;
    margin: 2rem 0;
  }

  @media (max-width: 768px) {
    .user-dashboard-container {
      padding: 0.5rem;
    }

    .header {
      padding: 1.5rem;
    }

    .back-button {
      position: static;
      transform: none;
      margin-bottom: 1rem;
    }

    .header h1 {
      font-size: 2rem;
    }

    .user-info-grid, .stats-grid, .actions-grid {
      grid-template-columns: 1fr;
    }

    .tasks-table-container {
      padding: 1rem;
    }

    .tasks-table th,
    .tasks-table td {
      padding: 0.5rem;
    }
  }
</style>
