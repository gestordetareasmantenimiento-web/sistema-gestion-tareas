<script lang="ts">
  import { user } from '$lib/stores/auth';
  export let data;

  // Función para navegar a usuarios de una región específica
  function navigateToRegion(region: string) {
    window.location.href = `/superadmin/dashboard/roles/${data.role}/regions/${region}`;
  }

  // Función para volver al dashboard principal
  function goBack() {
    window.location.href = '/superadmin/dashboard';
  }

  // Función para navegar directamente a todos los usuarios del rol (si no está dividido por regiones)
  function navigateToAllUsers() {
    window.location.href = `/superadmin/dashboard/roles/${data.role}/users`;
  }
</script>

<div class="role-details-container">
  <div class="header">
    <button class="back-button" on:click={goBack}>← Volver</button>
    <h1>👥 {data.role}</h1>
    <p>Detalles del rol y sus usuarios</p>
  </div>

  {#if data.error}
    <div class="error-message">
      <p>{data.error}</p>
    </div>
  {:else}
    <!-- Resumen del rol -->
    <div class="role-summary">
      <h2>📊 Resumen del Rol</h2>
      <div class="summary-grid">
        <div class="summary-card">
          <div class="summary-icon">👥</div>
          <div class="summary-content">
            <h3>Total Usuarios</h3>
            <p class="summary-number">{data.regiones?.reduce((total, region) => total + region.total_usuarios, 0) || 0}</p>
          </div>
        </div>
        <div class="summary-card">
          <div class="summary-icon">🏢</div>
          <div class="summary-content">
            <h3>Regiones</h3>
            <p class="summary-number">{data.regiones?.length || 0}</p>
          </div>
        </div>
        <div class="summary-card">
          <div class="summary-icon">📋</div>
          <div class="summary-content">
            <h3>Tareas Activas</h3>
            <p class="summary-number">{data.regiones?.reduce((total, region) => total + region.tareas_activas, 0) || 0}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Regiones del rol -->
    {#if data.regiones && data.regiones.length > 0}
      <div class="regions-section">
        <h2>🌍 Regiones de {data.role}</h2>
        <div class="regions-grid">
          {#each data.regiones as region (region.nombre)}
            <div class="region-card" on:click={() => navigateToRegion(region.nombre)}>
              <div class="region-header">
                <h3>{region.nombre}</h3>
                <span class="region-count">{region.total_usuarios} usuarios</span>
              </div>
              <div class="region-stats">
                <div class="stat">
                  <span class="stat-label">Tareas activas:</span>
                  <span class="stat-value">{region.tareas_activas}</span>
                </div>
              </div>
              <div class="region-actions">
                <button class="action-btn primary" on:click|stopPropagation={() => navigateToRegion(region.nombre)}>
                  Ver Usuarios
                </button>
              </div>
            </div>
          {/each}
        </div>
      </div>
    {:else}
      <!-- Si no hay regiones, mostrar botón directo a usuarios -->
      <div class="no-regions-section">
        <h2>👥 Usuarios de {data.role}</h2>
        <p>Este rol no está dividido por regiones. Puedes ver todos los usuarios directamente.</p>
        <button class="action-btn primary large" on:click={navigateToAllUsers}>
          Ver Todos los Usuarios
        </button>
      </div>
    {/if}
  {/if}
</div>

<style>
  .role-details-container {
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

  .role-summary, .regions-section, .no-regions-section {
    margin-bottom: 2rem;
  }

  .role-summary h2, .regions-section h2, .no-regions-section h2 {
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

  .regions-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 1.5rem;
  }

  .region-card {
    background: white;
    border-radius: 12px;
    padding: 1.5rem;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    transition: all 0.3s ease;
    cursor: pointer;
    border: 2px solid transparent;
  }

  .region-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
    border-color: #667eea;
  }

  .region-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }

  .region-header h3 {
    margin: 0;
    color: #333;
    font-size: 1.3rem;
    font-weight: 600;
  }

  .region-count {
    background: #667eea;
    color: white;
    padding: 0.25rem 0.75rem;
    border-radius: 20px;
    font-size: 0.9rem;
    font-weight: 500;
  }

  .region-stats {
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

  .region-actions {
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

  .action-btn.large {
    padding: 1rem 2rem;
    font-size: 1.1rem;
  }

  .no-regions-section {
    text-align: center;
    background: white;
    border-radius: 12px;
    padding: 2rem;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  .no-regions-section p {
    color: #666;
    margin-bottom: 2rem;
    font-size: 1.1rem;
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
    .role-details-container {
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

    .summary-grid, .regions-grid {
      grid-template-columns: 1fr;
    }
  }
</style>
