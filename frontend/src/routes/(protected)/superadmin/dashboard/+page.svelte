<script lang="ts">
  import { user } from '$lib/stores/auth';
  export let data;

  // Función para navegar a un rol específico
  function navigateToRole(role: string) {
    window.location.href = `/superadmin/dashboard/roles/${role}`;
  }

  // Función para navegar a todas las tareas
  function navigateToAllTasks() {
    window.location.href = '/superadmin/dashboard/tasks';
  }

  // Función para navegar a reportes
  function navigateToReports() {
    window.location.href = '/superadmin/dashboard/reports';
  }
</script>

<div class="superadmin-container">
  <div class="header">
    <h1>🔧 Panel de Superadministrador</h1>
    <p>Control total del sistema - Acceso a todos los roles y regiones</p>
  </div>

  {#if data.error}
    <div class="error-message">
      <p>{data.error}</p>
    </div>
  {:else}
    <!-- Vista de Roles -->
    <div class="roles-section">
      <h2>👥 Roles del Sistema</h2>
      <div class="roles-grid">
        {#each data.roles || [] as role (role.rol)}
          <div class="role-card" on:click={() => navigateToRole(role.rol)}>
            <div class="role-header">
              <h3>{role.rol}</h3>
              <span class="role-count">{role.total_usuarios} usuarios</span>
            </div>
            <div class="role-stats">
              <div class="stat">
                <span class="stat-label">Tareas activas:</span>
                <span class="stat-value">{role.tareas_activas}</span>
              </div>
            </div>
            <div class="role-actions">
              <button class="action-btn primary" on:click|stopPropagation={() => navigateToRole(role.rol)}>
                Ver Detalles
              </button>
            </div>
          </div>
        {/each}
      </div>
    </div>

    <!-- Resumen General -->
    <div class="summary-section">
      <h2>📊 Resumen General del Sistema</h2>
      <div class="summary-grid">
        <div class="summary-card">
          <div class="summary-icon">👥</div>
          <div class="summary-content">
            <h3>Total Usuarios</h3>
            <p class="summary-number">{data.resumen?.total_usuarios || 0}</p>
          </div>
        </div>
        <div class="summary-card">
          <div class="summary-icon">🏢</div>
          <div class="summary-content">
            <h3>Regiones</h3>
            <p class="summary-number">{data.resumen?.total_regiones || 0}</p>
          </div>
        </div>
        <div class="summary-card">
          <div class="summary-icon">📋</div>
          <div class="summary-content">
            <h3>Tareas Activas</h3>
            <p class="summary-number">{data.resumen?.tareas_activas || 0}</p>
          </div>
        </div>
        <div class="summary-card">
          <div class="summary-icon">⚡</div>
          <div class="summary-content">
            <h3>Roles Activos</h3>
            <p class="summary-number">{data.resumen?.roles_activos || 0}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Accesos Rápidos -->
    <div class="quick-access-section">
      <h2>⚡ Accesos Rápidos</h2>
      <div class="quick-access-grid">
        <button class="quick-access-btn" on:click={navigateToAllTasks}>
          <div class="quick-icon">📋</div>
          <span>Todas las Tareas</span>
        </button>
        <button class="quick-access-btn" on:click={navigateToReports}>
          <div class="quick-icon">📊</div>
          <span>Reportes</span>
        </button>
        <button class="quick-access-btn" on:click={() => window.location.href = '/superadmin/users'}>
          <div class="quick-icon">👥</div>
          <span>Gestionar Usuarios</span>
        </button>
        <button class="quick-access-btn" on:click={() => window.location.href = '/superadmin/settings'}>
          <div class="quick-icon">⚙️</div>
          <span>Configuración</span>
        </button>
      </div>
    </div>
  {/if}
</div>

<style>
  .superadmin-container {
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

  .roles-section, .summary-section, .quick-access-section {
    margin-bottom: 2rem;
  }

  .roles-section h2, .summary-section h2, .quick-access-section h2 {
    color: #333;
    margin-bottom: 1rem;
    font-size: 1.5rem;
    font-weight: 600;
  }

  .roles-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 1.5rem;
  }

  .role-card {
    background: white;
    border-radius: 12px;
    padding: 1.5rem;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    transition: all 0.3s ease;
    cursor: pointer;
    border: 2px solid transparent;
  }

  .role-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
    border-color: #667eea;
  }

  .role-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }

  .role-header h3 {
    margin: 0;
    color: #333;
    font-size: 1.3rem;
    font-weight: 600;
  }

  .role-count {
    background: #667eea;
    color: white;
    padding: 0.25rem 0.75rem;
    border-radius: 20px;
    font-size: 0.9rem;
    font-weight: 500;
  }

  .role-stats {
    margin-bottom: 1.5rem;
  }

  .stat {
    display: flex;
    justify-content: space-between;
    margin-bottom: 0.5rem;
  }

  .stat-label {
    color: #666;
    font-size: 0.9rem;
  }

  .stat-value {
    color: #333;
    font-weight: 600;
  }

  .role-actions {
    display: flex;
    justify-content: center;
  }

  .action-btn {
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
  }

  .action-btn.primary {
    background: #667eea;
    color: white;
  }

  .action-btn.primary:hover {
    background: #5a6fd8;
    transform: translateY(-2px);
  }

  .summary-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1.5rem;
  }

  .summary-card {
    background: white;
    border-radius: 12px;
    padding: 1.5rem;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .summary-icon {
    font-size: 2.5rem;
    opacity: 0.8;
  }

  .summary-content h3 {
    margin: 0 0 0.5rem 0;
    color: #333;
    font-size: 1rem;
    font-weight: 600;
  }

  .summary-number {
    margin: 0;
    color: #667eea;
    font-size: 2rem;
    font-weight: 700;
  }

  .quick-access-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1.5rem;
  }

  .quick-access-btn {
    background: white;
    border: 2px solid #e1e5e9;
    border-radius: 12px;
    padding: 1.5rem;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
  }

  .quick-access-btn:hover {
    border-color: #667eea;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.2);
  }

  .quick-icon {
    font-size: 2rem;
  }

  .quick-access-btn span {
    color: #333;
    font-weight: 600;
    font-size: 1rem;
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
    .superadmin-container {
      padding: 0.5rem;
    }

    .header {
      padding: 1.5rem;
    }

    .header h1 {
      font-size: 2rem;
    }

    .roles-grid, .summary-grid, .quick-access-grid {
      grid-template-columns: 1fr;
    }
  }
</style>