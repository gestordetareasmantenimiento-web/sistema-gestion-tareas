<script lang="ts">
  import { user } from '$lib/stores/auth';
  export let data;

  // Función para navegar a usuarios de un rol específico
  function navigateToRole(role: string) {
    window.location.href = `/superadmin/dashboard/${data.region}/${role}`;
  }

  // Función para volver al dashboard principal
  function goBack() {
    window.location.href = '/superadmin/dashboard';
  }
</script>

<div class="region-details-container">
  <div class="header">
    <button class="back-button" on:click={goBack}>← Volver</button>
    <h1>🌍 {data.region}</h1>
    <p>Detalles de la región y sus roles</p>
  </div>

  {#if data.error}
    <div class="error-message">
      <p>{data.error}</p>
    </div>
  {:else}
    <!-- Resumen de la región -->
    <div class="region-summary">
      <h2>📊 Resumen de la Región</h2>
      <div class="summary-grid">
        <div class="summary-card">
          <div class="summary-icon">👥</div>
          <div class="summary-content">
            <h3>Total Usuarios</h3>
            <p class="summary-number">{data.roles?.reduce((total, role) => total + role.total_usuarios, 0) || 0}</p>
          </div>
        </div>
        <div class="summary-card">
          <div class="summary-icon">🏢</div>
          <div class="summary-content">
            <h3>Roles Activos</h3>
            <p class="summary-number">{data.roles?.length || 0}</p>
          </div>
        </div>
        <div class="summary-card">
          <div class="summary-icon">📋</div>
          <div class="summary-content">
            <h3>Tareas Activas</h3>
            <p class="summary-number">{data.roles?.reduce((total, role) => total + role.tareas_activas, 0) || 0}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Roles de la región -->
    <div class="roles-section">
      <h2>👥 Roles en {data.region}</h2>
      <div class="roles-grid">
        {#each data.roles || [] as role (role.rol)}
          <div class="role-card" on:click={() => navigateToRole(role.rol)}>
            <div class="role-header">
              <h3>{role.rol}</h3>
              <span class="role-count">{role.total_usuarios} usuarios</span>
            </div>
            <div class="role-stats">
              <div class="stat">
                <span class="stat-label">Usuarios:</span>
                <span class="stat-value">{role.total_usuarios}</span>
              </div>
              <div class="stat">
                <span class="stat-label">Tareas activas:</span>
                <span class="stat-value">{role.tareas_activas}</span>
              </div>
            </div>
            <div class="role-actions">
              <button class="action-btn primary" on:click|stopPropagation={() => navigateToRole(role.rol)}>
                Ver Usuarios
              </button>
            </div>
          </div>
        {/each}
      </div>
    </div>

    {#if data.roles?.length === 0}
      <div class="no-data">
        <p>No hay usuarios asignados a esta región</p>
      </div>
    {/if}
  {/if}
</div>

<style>
  .region-details-container {
    max-width: 1200px;
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
    left: 1rem;
    top: 50%;
    transform: translateY(-50%);
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

  .region-summary, .roles-section {
    margin-bottom: 2rem;
  }

  .region-summary h2, .roles-section h2 {
    color: #333;
    margin-bottom: 1rem;
    font-size: 1.5rem;
    font-weight: 600;
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
    font-size: 2rem;
    width: 60px;
    height: 60px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #f8f9fa;
    border-radius: 12px;
  }

  .summary-content h3 {
    margin: 0 0 0.5rem 0;
    color: #666;
    font-size: 0.9rem;
    font-weight: 500;
  }

  .summary-number {
    margin: 0;
    color: #333;
    font-size: 2rem;
    font-weight: 700;
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
    cursor: pointer;
    transition: all 0.3s ease;
    border: 2px solid transparent;
  }

  .role-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
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
    background: #e3f2fd;
    color: #1976d2;
    padding: 0.25rem 0.75rem;
    border-radius: 20px;
    font-size: 0.9rem;
    font-weight: 500;
  }

  .role-stats {
    margin-bottom: 1rem;
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
    gap: 0.5rem;
  }

  .action-btn {
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-size: 0.9rem;
    font-weight: 500;
    transition: all 0.2s;
  }

  .action-btn.primary {
    background: #667eea;
    color: white;
  }

  .action-btn.primary:hover {
    background: #5a6fd8;
  }

  .error-message {
    background: #f8d7da;
    color: #721c24;
    padding: 1rem;
    border-radius: 8px;
    border: 1px solid #f5c6cb;
    margin-bottom: 1rem;
  }

  .no-data {
    text-align: center;
    padding: 3rem;
    color: #6c757d;
    font-size: 1.1rem;
  }

  /* Responsive */
  @media (max-width: 768px) {
    .region-details-container {
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

    .summary-grid, .roles-grid {
      grid-template-columns: 1fr;
    }
  }
</style>
