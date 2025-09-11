<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  
  export let tarea: any;
  export let userRole: string;
  export let infoObservacion: any = null;
  export let isLoading = false;
  
  const dispatch = createEventDispatcher();
  
  let observacion = '';
  let correccion = '';
  let observacionAdicional = '';
  let showObservarForm = false;
  let showPasarForm = false;
  let showFinalizarForm = false;
  
  // Determinar si el usuario puede observar
  $: puedeObservar = userRole && [
    'inspector', 'supervisor de mantenimiento', 'supervisor de disponibilidad',
    'supervisor de soporte', 'supervisor de provision', 'administrativo', 
    'gerente', 'cerco'
  ].includes(userRole.toLowerCase());
  
  // Determinar si el usuario puede pasar observación
  $: puedePasarObservacion = infoObservacion && infoObservacion.puede_pasar && [
    'administrativo', 'inspector', 'supervisor de mantenimiento',
    'supervisor de disponibilidad', 'supervisor de soporte', 'supervisor de provision'
  ].includes(userRole.toLowerCase());
  
  // Determinar si el usuario puede finalizar observación
  $: puedeFinalizarObservacion = infoObservacion && infoObservacion.puede_finalizar && [
    'administrativo', 'inspector', 'supervisor de mantenimiento',
    'supervisor de disponibilidad', 'supervisor de soporte', 'supervisor de provision', 'proveedor'
  ].includes(userRole.toLowerCase());
  
  // Determinar si la tarea está en estado de observación
  $: esTareaObservada = tarea.estado && tarea.estado.toLowerCase().includes('observada');
  
  function handleObservar() {
    if (!observacion.trim()) return;
    
    dispatch('observar', {
      observacion: observacion.trim(),
      tareaId: tarea.id
    });
    
    observacion = '';
    showObservarForm = false;
  }
  
  function handlePasarObservacion() {
    dispatch('pasarObservacion', {
      observacion_adicional: observacionAdicional.trim(),
      tareaId: tarea.id
    });
    
    observacionAdicional = '';
    showPasarForm = false;
  }
  
  function handleFinalizarObservacion() {
    dispatch('finalizarObservacion', {
      correccion: correccion.trim(),
      tareaId: tarea.id
    });
    
    correccion = '';
    showFinalizarForm = false;
  }
  
  function cancelarFormulario() {
    observacion = '';
    correccion = '';
    observacionAdicional = '';
    showObservarForm = false;
    showPasarForm = false;
    showFinalizarForm = false;
  }
</script>

<div class="observacion-panel">
  {#if esTareaObservada && infoObservacion}
    <!-- Panel de Tarea Observada -->
    <div class="observacion-info">
      <div class="observacion-header">
        <h4>🔍 Tarea Observada</h4>
        <span class="estado-badge observada">{tarea.estado}</span>
      </div>
      
      <div class="observacion-details">
        <div class="observacion-item">
          <strong>Observador Original:</strong> {infoObservacion.observador_original}
        </div>
        <div class="observacion-item">
          <strong>Observación:</strong> {infoObservacion.observacion}
        </div>
        <div class="observacion-item">
          <strong>Fecha:</strong> {new Date(infoObservacion.fecha_observacion).toLocaleDateString()}
        </div>
        <div class="observacion-item">
          <strong>Retornará a:</strong> {infoObservacion.estado_retorno}
        </div>
      </div>
      
      <!-- Opciones de Acción -->
      <div class="observacion-actions">
        {#if puedeFinalizarObservacion}
          <button 
            class="btn btn-success" 
            on:click={() => showFinalizarForm = true}
            disabled={isLoading}
          >
            ✅ Finalizar Observación
          </button>
        {/if}
        
        {#if puedePasarObservacion}
          <button 
            class="btn btn-warning" 
            on:click={() => showPasarForm = true}
            disabled={isLoading}
          >
            ➡️ Pasar Observación
          </button>
        {/if}
      </div>
    </div>
    
  {:else if puedeObservar && !esTareaObservada}
    <!-- Panel para Crear Observación -->
    <div class="observar-panel">
      <div class="observar-header">
        <h4>⚠️ Crear Observación</h4>
        <p>Si encuentras problemas con esta tarea, puedes crear una observación para que sea corregida.</p>
      </div>
      
      <button 
        class="btn btn-danger" 
        on:click={() => showObservarForm = true}
        disabled={isLoading}
      >
        🚨 Observar Tarea
      </button>
    </div>
  {/if}
  
  <!-- Formulario de Observación -->
  {#if showObservarForm}
    <div class="form-panel">
      <h5>Crear Nueva Observación</h5>
      <div class="form-group">
        <label for="observacion">Describe el problema encontrado:</label>
        <textarea 
          id="observacion"
          bind:value={observacion}
          placeholder="Ej: Falta documentación del proveedor, información incompleta, etc."
          rows="4"
          disabled={isLoading}
        ></textarea>
      </div>
      
      <div class="form-actions">
        <button 
          class="btn btn-danger" 
          on:click={handleObservar}
          disabled={isLoading || !observacion.trim()}
        >
          {isLoading ? '⏳ Procesando...' : '🚨 Crear Observación'}
        </button>
        <button 
          class="btn btn-secondary" 
          on:click={cancelarFormulario}
          disabled={isLoading}
        >
          Cancelar
        </button>
      </div>
    </div>
  {/if}
  
  <!-- Formulario de Pasar Observación -->
  {#if showPasarForm}
    <div class="form-panel">
      <h5>Pasar Observación</h5>
      <div class="form-group">
        <label for="observacion-adicional">Observación adicional (opcional):</label>
        <textarea 
          id="observacion-adicional"
          bind:value={observacionAdicional}
          placeholder="Agrega información adicional sobre por qué pasas esta observación..."
          rows="3"
          disabled={isLoading}
        ></textarea>
      </div>
      
      <div class="form-actions">
        <button 
          class="btn btn-warning" 
          on:click={handlePasarObservacion}
          disabled={isLoading}
        >
          {isLoading ? '⏳ Procesando...' : '➡️ Pasar Observación'}
        </button>
        <button 
          class="btn btn-secondary" 
          on:click={cancelarFormulario}
          disabled={isLoading}
        >
          Cancelar
        </button>
      </div>
    </div>
  {/if}
  
  <!-- Formulario de Finalizar Observación -->
  {#if showFinalizarForm}
    <div class="form-panel">
      <h5>Finalizar Observación</h5>
      <div class="form-group">
        <label for="correccion">Describe la corrección realizada:</label>
        <textarea 
          id="correccion"
          bind:value={correccion}
          placeholder="Ej: Se adjuntó la documentación faltante, se corrigió la información, etc."
          rows="4"
          disabled={isLoading}
        ></textarea>
      </div>
      
      <div class="form-actions">
        <button 
          class="btn btn-success" 
          on:click={handleFinalizarObservacion}
          disabled={isLoading || !correccion.trim()}
        >
          {isLoading ? '⏳ Procesando...' : '✅ Finalizar Observación'}
        </button>
        <button 
          class="btn btn-secondary" 
          on:click={cancelarFormulario}
          disabled={isLoading}
        >
          Cancelar
        </button>
      </div>
    </div>
  {/if}
</div>

<style>
  .observacion-panel {
    background: #f8f9fa;
    border: 1px solid #dee2e6;
    border-radius: 8px;
    padding: 1.5rem;
    margin: 1rem 0;
  }
  
  .observacion-info {
    background: white;
    border: 1px solid #e9ecef;
    border-radius: 6px;
    padding: 1rem;
  }
  
  .observacion-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
    padding-bottom: 0.5rem;
    border-bottom: 1px solid #e9ecef;
  }
  
  .observacion-header h4 {
    margin: 0;
    color: #dc3545;
    font-size: 1.1rem;
  }
  
  .estado-badge {
    padding: 0.25rem 0.75rem;
    border-radius: 12px;
    font-size: 0.8rem;
    font-weight: 600;
  }
  
  .estado-badge.observada {
    background: #f8d7da;
    color: #721c24;
    border: 1px solid #f5c6cb;
  }
  
  .observacion-details {
    margin-bottom: 1rem;
  }
  
  .observacion-item {
    margin-bottom: 0.5rem;
    font-size: 0.9rem;
  }
  
  .observacion-item strong {
    color: #495057;
  }
  
  .observacion-actions {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
  }
  
  .observar-panel {
    background: white;
    border: 1px solid #e9ecef;
    border-radius: 6px;
    padding: 1rem;
    text-align: center;
  }
  
  .observar-header h4 {
    margin: 0 0 0.5rem 0;
    color: #dc3545;
  }
  
  .observar-header p {
    margin: 0 0 1rem 0;
    color: #6c757d;
    font-size: 0.9rem;
  }
  
  .form-panel {
    background: white;
    border: 1px solid #e9ecef;
    border-radius: 6px;
    padding: 1rem;
    margin-top: 1rem;
  }
  
  .form-panel h5 {
    margin: 0 0 1rem 0;
    color: #495057;
  }
  
  .form-group {
    margin-bottom: 1rem;
  }
  
  .form-group label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 600;
    color: #495057;
    font-size: 0.9rem;
  }
  
  .form-group textarea {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid #ced4da;
    border-radius: 4px;
    font-size: 0.9rem;
    resize: vertical;
    min-height: 80px;
  }
  
  .form-group textarea:focus {
    outline: none;
    border-color: #007bff;
    box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
  }
  
  .form-group textarea:disabled {
    background-color: #e9ecef;
    opacity: 0.6;
  }
  
  .form-actions {
    display: flex;
    gap: 0.5rem;
    justify-content: flex-end;
  }
  
  .btn {
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 4px;
    font-size: 0.9rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
  }
  
  .btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  
  .btn-danger {
    background: #dc3545;
    color: white;
  }
  
  .btn-danger:hover:not(:disabled) {
    background: #c82333;
  }
  
  .btn-warning {
    background: #ffc107;
    color: #212529;
  }
  
  .btn-warning:hover:not(:disabled) {
    background: #e0a800;
  }
  
  .btn-success {
    background: #28a745;
    color: white;
  }
  
  .btn-success:hover:not(:disabled) {
    background: #218838;
  }
  
  .btn-secondary {
    background: #6c757d;
    color: white;
  }
  
  .btn-secondary:hover:not(:disabled) {
    background: #5a6268;
  }
  
  /* Responsive */
  @media (max-width: 768px) {
    .observacion-actions {
      flex-direction: column;
    }
    
    .form-actions {
      flex-direction: column;
    }
    
    .observacion-header {
      flex-direction: column;
      align-items: flex-start;
      gap: 0.5rem;
    }
  }
</style>
