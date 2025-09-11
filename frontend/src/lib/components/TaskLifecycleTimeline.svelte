<script lang="ts">
  import { onMount } from 'svelte';
  
  export let tareaId: number;
  export let isVisible: boolean = false;
  
  let historial: any[] = [];
  let loading = false;
  let error = '';
  
  // Función para obtener el historial
  async function cargarHistorial() {
    if (!tareaId) return;
    
    loading = true;
    error = '';
    
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`http://localhost:3000/api/tareas/${tareaId}/historial`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const result = await response.json();
        historial = result.data || [];
      } else {
        error = 'Error al cargar el historial';
      }
    } catch (err) {
      error = 'Error de conexión';
      console.error('Error cargando historial:', err);
    } finally {
      loading = false;
    }
  }
  
  // Cargar historial cuando se hace visible
  $: if (isVisible && tareaId) {
    cargarHistorial();
  }
  
  // Función para obtener el icono según la acción
  function getActionIcon(accion: string): string {
    const iconMap: { [key: string]: string } = {
      'Creación': '🎯',
      'Aprobado por Inspector': '✅',
      'Aprobado por Supervisor': '👨‍💼',
      'Aprobado por Administración': '📋',
      'Aprobado por Gerencia': '👔',
      'Aprobado por CERCO': '🏆',
      'Observado por Inspector': '👁️',
      'Observado por Supervisor': '⚠️',
      'Observado por Administración': '📝',
      'Observado por Gerencia': '🔍',
      'Observado por CERCO': '🚨',
      'Cambio de Estado': '🔄',
      'Actualización de WO': '📄',
      'Exportación de Materiales': '📊',
      'Certificado Emitido': '📜'
    };
    return iconMap[accion] || '📌';
  }
  
  // Función para obtener el color según la acción
  function getActionColor(accion: string): string {
    if (accion.includes('Aprobado')) return '#28a745';
    if (accion.includes('Observado')) return '#dc3545';
    if (accion.includes('Creación')) return '#007bff';
    if (accion.includes('Certificado')) return '#17a2b8';
    return '#6c757d';
  }
  
  // Función para formatear fecha
  function formatearFecha(fecha: string): string {
    return new Date(fecha).toLocaleString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
</script>

{#if isVisible}
  <div class="lifecycle-modal">
    <div class="lifecycle-content">
      <div class="lifecycle-header">
        <h2>🕒 Ciclo de Vida de la Tarea</h2>
        <button class="close-btn" on:click={() => isVisible = false}>✕</button>
      </div>
      
      <div class="lifecycle-body">
        {#if loading}
          <div class="loading">
            <div class="spinner"></div>
            <p>Cargando historial...</p>
          </div>
        {:else if error}
          <div class="error">
            <p>❌ {error}</p>
            <button on:click={cargarHistorial}>Reintentar</button>
          </div>
        {:else if historial.length === 0}
          <div class="empty">
            <p>📭 No hay historial disponible para esta tarea</p>
          </div>
        {:else}
          <div class="timeline">
            {#each historial as evento, index (evento.id)}
              <div class="timeline-item" style="--delay: {index * 0.1}s">
                <div class="timeline-marker" style="background-color: {getActionColor(evento.accion)}">
                  <span class="timeline-icon">{getActionIcon(evento.accion)}</span>
                </div>
                
                <div class="timeline-content">
                  <div class="timeline-header">
                    <h3 class="timeline-title">{evento.accion}</h3>
                    <span class="timeline-date">{formatearFecha(evento.fecha_evento)}</span>
                  </div>
                  
                  <div class="timeline-details">
                    <div class="timeline-user">
                      <strong>👤 Usuario:</strong> {evento.usuario_nombre} ({evento.usuario_rol})
                    </div>
                    
                    {#if evento.detalle}
                      <div class="timeline-description">
                        <strong>📝 Detalle:</strong> {evento.detalle}
                      </div>
                    {/if}
                    
                    {#if evento.estado_anterior && evento.estado_nuevo}
                      <div class="timeline-state-change">
                        <strong>🔄 Cambio de Estado:</strong>
                        <span class="state-badge old-state">{evento.estado_anterior}</span>
                        <span class="state-arrow">→</span>
                        <span class="state-badge new-state">{evento.estado_nuevo}</span>
                      </div>
                    {/if}
                    
                    {#if evento.datos_adicionales}
                      <div class="timeline-additional">
                        <strong>📊 Datos Adicionales:</strong>
                        <pre class="additional-data">{JSON.stringify(evento.datos_adicionales, null, 2)}</pre>
                      </div>
                    {/if}
                  </div>
                </div>
              </div>
            {/each}
          </div>
        {/if}
      </div>
    </div>
  </div>
{/if}

<style>
  .lifecycle-modal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.7);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
    animation: fadeIn 0.3s ease;
  }
  
  .lifecycle-content {
    background: white;
    border-radius: 12px;
    width: 90%;
    max-width: 800px;
    max-height: 90vh;
    overflow: hidden;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
    animation: slideIn 0.3s ease;
  }
  
  .lifecycle-header {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 1.5rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .lifecycle-header h2 {
    margin: 0;
    font-size: 1.5rem;
    font-weight: 600;
  }
  
  .close-btn {
    background: rgba(255, 255, 255, 0.2);
    border: none;
    color: white;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    cursor: pointer;
    font-size: 1.2rem;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.2s;
  }
  
  .close-btn:hover {
    background: rgba(255, 255, 255, 0.3);
  }
  
  .lifecycle-body {
    padding: 2rem;
    max-height: 70vh;
    overflow-y: auto;
  }
  
  .loading, .error, .empty {
    text-align: center;
    padding: 3rem;
    color: #6c757d;
  }
  
  .spinner {
    width: 40px;
    height: 40px;
    border: 4px solid #f3f3f3;
    border-top: 4px solid #667eea;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin: 0 auto 1rem;
  }
  
  .timeline {
    position: relative;
    padding-left: 2rem;
  }
  
  .timeline::before {
    content: '';
    position: absolute;
    left: 1rem;
    top: 0;
    bottom: 0;
    width: 2px;
    background: linear-gradient(to bottom, #667eea, #764ba2);
  }
  
  .timeline-item {
    position: relative;
    margin-bottom: 2rem;
    animation: slideInRight 0.5s ease forwards;
    opacity: 0;
    animation-delay: var(--delay);
  }
  
  .timeline-marker {
    position: absolute;
    left: -2rem;
    top: 0.5rem;
    width: 3rem;
    height: 3rem;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
    border: 3px solid white;
  }
  
  .timeline-icon {
    font-size: 1.2rem;
  }
  
  .timeline-content {
    background: #f8f9fa;
    border-radius: 8px;
    padding: 1.5rem;
    margin-left: 1rem;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    border-left: 4px solid var(--timeline-color, #667eea);
  }
  
  .timeline-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }
  
  .timeline-title {
    margin: 0;
    color: #333;
    font-size: 1.1rem;
    font-weight: 600;
  }
  
  .timeline-date {
    color: #6c757d;
    font-size: 0.9rem;
    font-weight: 500;
  }
  
  .timeline-details {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }
  
  .timeline-user, .timeline-description, .timeline-state-change, .timeline-additional {
    font-size: 0.95rem;
    line-height: 1.4;
  }
  
  .timeline-user strong, .timeline-description strong, .timeline-state-change strong, .timeline-additional strong {
    color: #495057;
  }
  
  .state-badge {
    display: inline-block;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    font-size: 0.8rem;
    font-weight: 500;
    margin: 0 0.25rem;
  }
  
  .old-state {
    background-color: #e9ecef;
    color: #6c757d;
  }
  
  .new-state {
    background-color: #d4edda;
    color: #155724;
  }
  
  .state-arrow {
    color: #6c757d;
    font-weight: bold;
    margin: 0 0.5rem;
  }
  
  .additional-data {
    background: #f1f3f4;
    border: 1px solid #dee2e6;
    border-radius: 4px;
    padding: 0.75rem;
    font-size: 0.8rem;
    overflow-x: auto;
    margin-top: 0.5rem;
  }
  
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  
  @keyframes slideIn {
    from { transform: translateY(-50px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }
  
  @keyframes slideInRight {
    from { transform: translateX(30px); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
</style>
