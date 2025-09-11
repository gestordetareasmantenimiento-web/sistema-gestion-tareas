<script lang="ts">
  import { user } from '$lib/stores/auth';
  export let data;

  // Función para navegar al dashboard de un usuario específico
  function navigateToUser(userId: number) {
    window.location.href = `/superadmin/dashboard/${data.region}/${data.role}/${userId}`;
  }

  // Función para volver a los detalles de la región
  function goBack() {
    window.location.href = `/superadmin/dashboard/${data.region}`;
  }
</script>

<div class="role-users-container">
  <div class="header">
    <button class="back-button" on:click={goBack}>← Volver</button>
    <h1>👥 {data.role} en {data.region}</h1>
    <p>Usuarios con rol {data.role} en la región {data.region}</p>
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
            <p class="summary-number">{data.users?.length || 0}</p>
          </div>
        </div>
        <div class="summary-card">
          <div class="summary-icon">📋</div>
          <div class="summary-content">
            <h3>Tareas Activas</h3>
            <p class="summary-number">{data.users?.reduce((total, user) => total + (user.tareas_activas || 0), 0) || 0}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Lista de usuarios -->
    <div class="users-section">
      <h2>👤 Usuarios</h2>
      <div class="users-grid">
        {#each data.users || [] as user (user.id)}
          <div class="user-card" on:click={() => navigateToUser(user.id)}>
            <div class="user-header">
              <div class="user-avatar">
                {user.nombre_completo.charAt(0).toUpperCase()}
              </div>
              <div class="user-info">
                <h3>{user.nombre_completo}</h3>
                <p class="user-email">{user.email}</p>
              </div>
            </div>
            <div class="user-stats">
              <div class="stat">
                <span class="stat-label">ID:</span>
                <span class="stat-value">{user.id}</span>
              </div>
              <div class="stat">
                <span class="stat-label">Rol:</span>
                <span class="stat-value">{user.rol}</span>
              </div>
              <div class="stat">
                <span class="stat-label">Tareas activas:</span>
                <span class="stat-value">{user.tareas_activas || 0}</span>
              </div>
            </div>
            <div class="user-actions">
              <button class="action-btn primary" on:click|stopPropagation={() => navigateToUser(user.id)}>
                Ver Dashboard
              </button>
            </div>
          </div>
        {/each}
      </div>
    </div>

    {#if data.users?.length === 0}
      <div class="no-data">
        <p>No hay usuarios con rol {data.role} en la región {data.region}</p>
      </div>
    {/if}
  {/if}
</div>

<style>
  .role-users-container {
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

  .role-summary, .users-section {
    margin-bottom: 2rem;
  }

  .role-summary h2, .users-section h2 {
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
    cursor: pointer;
    transition: all 0.3s ease;
    border: 2px solid transparent;
  }

  .user-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
    border-color: #667eea;
  }

  .user-header {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 1rem;
  }

  .user-avatar {
    width: 50px;
    height: 50px;
    border-radius: 50%;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.5rem;
    font-weight: 600;
  }

  .user-info h3 {
    margin: 0 0 0.25rem 0;
    color: #333;
    font-size: 1.2rem;
    font-weight: 600;
  }

  .user-email {
    margin: 0;
    color: #666;
    font-size: 0.9rem;
  }

  .user-stats {
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

  .user-actions {
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
    .role-users-container {
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

    .summary-grid, .users-grid {
      grid-template-columns: 1fr;
    }

    .user-header {
      flex-direction: column;
      text-align: center;
    }
  }
</style>
