<script lang="ts">
  export let tarea: any;
  
  // Definir las etapas del proceso de certificación
  const etapas = [
    { 
      id: 'asignada', 
      nombre: 'Asignada', 
      estado: 'Asignada',
      icono: '📋',
      color: '#6c757d',
      descripcion: 'Tarea asignada al proveedor'
    },
    { 
      id: 'certificada', 
      nombre: 'Certificada', 
      estado: 'Pendiente Certificación Inspector',
      icono: '✅',
      color: '#28a745',
      descripcion: 'Certificado presentado por el proveedor'
    },
    { 
      id: 'supervisor', 
      nombre: 'Supervisor', 
      estado: 'Pendiente Aprobación Supervisor',
      icono: '👨‍💼',
      color: '#007bff',
      descripcion: 'Pendiente aprobación del supervisor'
    },
    { 
      id: 'administracion', 
      nombre: 'Administración', 
      estado: 'Pendiente Aprobación Administración',
      icono: '🏢',
      color: '#6610f2',
      descripcion: 'Pendiente aprobación administrativa'
    },
    { 
      id: 'gerencia', 
      nombre: 'Gerencia', 
      estado: 'Pendiente Aprobación Gerente',
      icono: '👔',
      color: '#e83e8c',
      descripcion: 'Pendiente aprobación gerencial'
    },
    { 
      id: 'cerco', 
      nombre: 'CERCO', 
      estado: 'Pendiente Aprobación CERCO',
      icono: '🔍',
      color: '#fd7e14',
      descripcion: 'Pendiente aprobación final de CERCO'
    },
    { 
      id: 'finalizada', 
      nombre: 'Finalizada', 
      estado: 'Finalizada - Aprobada',
      icono: '🎉',
      color: '#20c997',
      descripcion: 'Tarea completada y aprobada'
    }
  ];
  
  // Determinar el estado actual y los estados completados
  $: estadoActual = tarea.estado;
  $: indiceActual = etapas.findIndex(etapa => etapa.estado === estadoActual);
  $: etapasCompletadas = indiceActual >= 0 ? indiceActual : 0;
  
  // Determinar si está observada
  $: esObservada = estadoActual.toLowerCase().includes('observada');
  $: esCancelada = estadoActual === 'Cancelada';
  
  // Obtener información del estado actual
  $: etapaActual = etapas.find(etapa => etapa.estado === estadoActual);
  $: progreso = etapasCompletadas / (etapas.length - 1) * 100;
</script>

<div class="certification-progress">
  <div class="progress-header">
    <h4>📊 Progreso de Certificación</h4>
    <div class="current-status" class:observada={esObservada} class:cancelada={esCancelada}>
      <span class="status-icon">
        {#if esObservada}
          ⚠️
        {:else if esCancelada}
          ❌
        {:else if etapaActual}
          {etapaActual.icono}
        {:else}
          ❓
        {/if}
      </span>
      <span class="status-text">
        {#if esObservada}
          Observada - Requiere corrección
        {:else if esCancelada}
          Cancelada
        {:else if etapaActual}
          {etapaActual.nombre}
        {:else}
          Estado desconocido
        {/if}
      </span>
    </div>
  </div>
  
  <!-- Barra de progreso -->
  <div class="progress-bar-container">
    <div class="progress-bar">
      <div 
        class="progress-fill" 
        style="width: {progreso}%; background-color: {esObservada ? '#dc3545' : esCancelada ? '#6c757d' : '#28a745'};"
      ></div>
    </div>
    <div class="progress-text">{Math.round(progreso)}% completado</div>
  </div>
  
  <!-- Etapas del proceso -->
  <div class="etapas-container">
    {#each etapas as etapa, index}
      <div 
        class="etapa" 
        class:completada={index <= etapasCompletadas}
        class:actual={index === indiceActual}
        class:observada={esObservada && index === indiceActual}
        class:cancelada={esCancelada && index === indiceActual}
      >
        <div class="etapa-icono" style="background-color: {etapa.color};">
          {etapa.icono}
        </div>
        <div class="etapa-info">
          <div class="etapa-nombre">{etapa.nombre}</div>
          <div class="etapa-descripcion">{etapa.descripcion}</div>
        </div>
        <div class="etapa-estado">
          {#if index < etapasCompletadas}
            ✅
          {:else if index === indiceActual}
            {#if esObservada}
              ⚠️
            {:else if esCancelada}
              ❌
            {:else}
              🔄
            {/if}
          {:else}
            ⏳
          {/if}
        </div>
      </div>
    {/each}
  </div>
  
  <!-- Información adicional -->
  {#if tarea.fecha_inicio && tarea.fecha_fin}
    <div class="fechas-info">
      <div class="fecha-item">
        <span class="fecha-label">📅 Inicio:</span>
        <span class="fecha-valor">{new Date(tarea.fecha_inicio).toLocaleDateString()}</span>
      </div>
      <div class="fecha-item">
        <span class="fecha-label">🏁 Fin:</span>
        <span class="fecha-valor">{new Date(tarea.fecha_fin).toLocaleDateString()}</span>
      </div>
    </div>
  {/if}
</div>

<style>
  .certification-progress {
    background: #f8f9fa;
    border: 1px solid #dee2e6;
    border-radius: 8px;
    padding: 1.5rem;
    margin: 1rem 0;
  }
  
  .progress-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }
  
  .progress-header h4 {
    margin: 0;
    color: #495057;
    font-size: 1.1rem;
  }
  
  .current-status {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    border-radius: 20px;
    background: #e9ecef;
    color: #495057;
    font-weight: 500;
  }
  
  .current-status.observada {
    background: #f8d7da;
    color: #721c24;
  }
  
  .current-status.cancelada {
    background: #d1ecf1;
    color: #0c5460;
  }
  
  .status-icon {
    font-size: 1.2rem;
  }
  
  .progress-bar-container {
    margin-bottom: 1.5rem;
  }
  
  .progress-bar {
    width: 100%;
    height: 8px;
    background: #e9ecef;
    border-radius: 4px;
    overflow: hidden;
    margin-bottom: 0.5rem;
  }
  
  .progress-fill {
    height: 100%;
    transition: width 0.3s ease;
  }
  
  .progress-text {
    text-align: center;
    font-size: 0.9rem;
    color: #6c757d;
    font-weight: 500;
  }
  
  .etapas-container {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }
  
  .etapa {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 0.75rem;
    border-radius: 6px;
    background: white;
    border: 1px solid #dee2e6;
    transition: all 0.2s ease;
  }
  
  .etapa.completada {
    background: #d4edda;
    border-color: #c3e6cb;
  }
  
  .etapa.actual {
    background: #cce5ff;
    border-color: #80bdff;
    box-shadow: 0 2px 4px rgba(0,123,255,0.1);
  }
  
  .etapa.observada {
    background: #f8d7da;
    border-color: #f5c6cb;
  }
  
  .etapa.cancelada {
    background: #d1ecf1;
    border-color: #bee5eb;
  }
  
  .etapa-icono {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.2rem;
    color: white;
    flex-shrink: 0;
  }
  
  .etapa-info {
    flex: 1;
  }
  
  .etapa-nombre {
    font-weight: 600;
    color: #495057;
    margin-bottom: 0.25rem;
  }
  
  .etapa-descripcion {
    font-size: 0.85rem;
    color: #6c757d;
  }
  
  .etapa-estado {
    font-size: 1.2rem;
    flex-shrink: 0;
  }
  
  .fechas-info {
    margin-top: 1rem;
    padding-top: 1rem;
    border-top: 1px solid #dee2e6;
    display: flex;
    gap: 2rem;
  }
  
  .fecha-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  
  .fecha-label {
    font-weight: 500;
    color: #495057;
  }
  
  .fecha-valor {
    color: #6c757d;
  }
  
  /* Responsive */
  @media (max-width: 768px) {
    .progress-header {
      flex-direction: column;
      gap: 1rem;
      align-items: flex-start;
    }
    
    .fechas-info {
      flex-direction: column;
      gap: 0.5rem;
    }
  }
</style>
