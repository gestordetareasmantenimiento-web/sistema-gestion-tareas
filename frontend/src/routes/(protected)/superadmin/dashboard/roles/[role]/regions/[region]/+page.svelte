<script lang="ts">
  import { user } from '$lib/stores/auth';
  export let data;

  // Función para navegar al dashboard de un usuario específico
  function navigateToUser(userId: number) {
    window.location.href = `/superadmin/dashboard/roles/${data.role}/regions/${data.region}/users/${userId}`;
  }

  // Función para volver al rol
  function goBack() {
    window.location.href = `/superadmin/dashboard/roles/${data.role}`;
  }
</script>

<div class="region-users-container">
  <div class="header">
    <button class="back-button" on:click={goBack}>← Volver</button>
    <h1>🌍 {data.region} - {data.role}</h1>
    <p>Usuarios del rol en esta región</p>
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
            <p class="summary-number">{data.usuarios?.length || 0}</p>
          </div>
        </div>
        <div class="summary-card">
          <div class="summary-icon">📋</div>
          <div class="summary-content">
            <h3>Tareas Activas</h3>
            <p class="summary-number">{data.usuarios?.reduce((total, user) => total + (user.tareas_activas || 0), 0) || 0}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Lista de usuarios -->
    <div class="users-section">
      <h2>👥 Usuarios de {data.role} en {data.region}</h2>
      {#if data.usuarios && data.usuarios.length > 0}
        <div class="users-grid">
          {#each data.usuarios as usuario (usuario.id)}
            <div class="user-card" role="button" tabindex="0" on:click={() => navigateToUser(usuario.id)} on:keydown={(e) => e.key === 'Enter' && navigateToUser(usuario.id)}>
              <div class="user-header">
                <h3>{usuario.nombre_completo}</h3>
                <span class="user-id">ID: {usuario.id}</span>
              </div>
              <div class="user-info">
                <div class="info-item">
                  <span class="info-label">Email:</span>
                  <span class="info-value">{usuario.email || 'No especificado'}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Rol:</span>
                  <span class="info-value">{usuario.rol}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Región:</span>
                  <span class="info-value">{usuario.region}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Estado:</span>
                  <span class="info-value {usuario.activo ? 'active' : 'inactive'}">
                    {usuario.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
                <div class="info-item">
                  <span class="info-label">Tareas activas:</span>
                  <span class="info-value">{usuario.tareas_activas || 0}</span>
                </div>
              </div>
              <div class="user-actions">
                <button class="action-btn primary" on:click|stopPropagation={() => navigateToUser(usuario.id)}>
                  Ver Dashboard
                </button>
              </div>
            </div>
          {/each}
        </div>
      {:else}
        <div class="no-users">
          <p>No hay usuarios de este rol en esta región.</p>
        </div>
      {/if}
    </div>
  {/if}
</div>

<style>
  .region-users-container {
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

  .region-summary, .users-section {
    margin-bottom: 2rem;
  }

  .region-summary h2, .users-section h2 {
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

  .users-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
    gap: 1.5rem;
  }

  .user-card {
    background: white;
    border-radius: 12px;
    padding: 1.5rem;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    transition: all 0.3s ease;
    cursor: pointer;
    border: 2px solid transparent;
  }

  .user-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
    border-color: #667eea;
  }

  .user-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid #e1e5e9;
  }

  .user-header h3 {
    margin: 0;
    color: #333;
    font-size: 1.3rem;
    font-weight: 600;
  }

  .user-id {
    background: #f8f9fa;
    color: #666;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    font-size: 0.8rem;
  }

  .user-info {
    margin-bottom: 1.5rem;
  }

  .info-item {
    display: flex;
    justify-content: space-between;
    margin-bottom: 0.5rem;
  }

  .info-label {
    color: #666;
    font-size: 0.9rem;
    font-weight: 500;
  }

  .info-value {
    color: #333;
    font-weight: 600;
  }

  .info-value.active {
    color: #28a745;
  }

  .info-value.inactive {
    color: #dc3545;
  }

  .user-actions {
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

  .no-users {
    text-align: center;
    background: white;
    border-radius: 12px;
    padding: 2rem;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  .no-users p {
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
    .region-users-container {
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

    .summary-grid, .users-grid {
      grid-template-columns: 1fr;
    }
  }
</style>
