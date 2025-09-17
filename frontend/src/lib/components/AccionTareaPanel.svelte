<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { showConfirm, showSuccess, showError } from '../services/modalService';
  
  export let tarea: any;
  export let certificado: any = null;
  export let userRole: string;
  export let infoObservacion: any = null;
  export let isLoading = false;
  export let proveedores: any[] = [];
  export let onLoadProveedores: () => void = () => {};
  
  const dispatch = createEventDispatcher();
  
  let observacion = '';
  let correccion = '';
  let observacionAdicional = '';
  let showObservarForm = false;
  let showPasarForm = false;
  let showFinalizarForm = false;
  let showReassignForm = false;
  let nuevoProveedor = '';
  let isExporting = false;
  
  // Determinar si el usuario puede observar (NO en estado Asignada y NO finalizada)
  $: puedeObservar = userRole && !esAsignada && !esFinalizada && [
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
    'supervisor de disponibilidad', 'supervisor de soporte', 'supervisor de provision'
  ].includes(userRole.toLowerCase()) && 
  // El proveedor NO puede finalizar observaciones cuando la tarea está "Observada por inspector"
  !(userRole.toLowerCase() === 'proveedor' && tarea.estado === 'Observada por inspector');
  
  // Determinar si la tarea está en estado de observación
  $: esTareaObservada = tarea.estado && tarea.estado.toLowerCase().includes('observada');
  
  // Determinar el estado de la tarea y las acciones disponibles
  $: estadoTarea = tarea.estado?.toLowerCase() || '';
  $: esPendienteAprobacion = estadoTarea.includes('pendiente aprobación');
  $: esPendienteCertificacion = estadoTarea.includes('pendiente certificación');
  $: esAsignada = estadoTarea === 'asignada';
  $: esFinalizada = estadoTarea === 'finalizada - aprobada';
  
  // Determinar si el usuario puede reasignar proveedor
  $: puedeReasignar = esAsignada && !esFinalizada && userRole && (
    userRole.toLowerCase() === 'inspector' || 
    ['supervisor de mantenimiento', 'supervisor de disponibilidad', 'supervisor de soporte', 'supervisor de provision'].includes(userRole.toLowerCase())
  );
  
  // Determinar si el usuario puede aprobar según su rol y el estado
  $: puedeAprobar = (() => {
    if (!userRole || !tarea || esFinalizada) return false;
    
    const rol = userRole.toLowerCase();
    
    // CERCO puede aprobar tareas pendientes de aprobación CERCO
    if (rol === 'cerco' && estadoTarea === 'pendiente aprobación cerco') return true;
    
    // Gerente puede aprobar tareas pendientes de aprobación gerente
    if (rol === 'gerente' && estadoTarea === 'pendiente aprobación gerente') return true;
    
    // Administrativo puede aprobar tareas pendientes de aprobación administración
    if (rol === 'administrativo' && estadoTarea === 'pendiente aprobación administración') return true;
    
    // Supervisores pueden aprobar tareas pendientes de aprobación supervisor
    if (['supervisor de mantenimiento', 'supervisor de disponibilidad', 'supervisor de soporte', 'supervisor de provision'].includes(rol) && 
        estadoTarea === 'pendiente aprobación supervisor') return true;
    
    // Inspector puede aprobar tareas pendientes de certificación inspector
    if (rol === 'inspector' && (estadoTarea === 'pendiente certificación inspector' || estadoTarea === 'pendiente certificación inspector/supervisor')) return true;
    
    return false;
  })();
  
  // Determinar si el usuario puede editar certificado (inspectores y supervisores en tareas certificadas)
  $: puedeEditarCertificado = (() => {
    if (!userRole || !tarea || esFinalizada) return false;
    
    const rol = userRole.toLowerCase();
    
    // Solo inspectores y supervisores pueden editar certificados
    const rolesPermitidos = [
      'inspector', 
      'supervisor de mantenimiento', 
      'supervisor de disponibilidad', 
      'supervisor de soporte', 
      'supervisor de provision'
    ];
    
    if (!rolesPermitidos.includes(rol)) return false;
    
    // Solo en tareas que ya están certificadas (tienen certificado emitido)
    return esPendienteCertificacion;
  })();
  
  // Determinar si el usuario puede certificar (proveedores en tareas asignadas con WO)
  $: puedeCertificar = (() => {
    if (!userRole || !tarea || esFinalizada) return false;
    
    const rol = userRole.toLowerCase();
    
    // Solo proveedores pueden certificar
    if (rol !== 'proveedor') return false;
    
    // Solo en tareas asignadas con número de WO
    return esAsignada && !!tarea.numero_wo;
  })();

  // Determinar si el usuario CERCO puede exportar mano de obra (siempre habilitado)
  $: puedeExportarManoDeObra = (() => {
    if (!userRole || !tarea) return false;
    
    const rol = userRole.toLowerCase();
    
    // Solo CERCO puede exportar mano de obra
    if (rol === 'cerco') {
      // Siempre habilitado si hay número de WO
      return !!tarea.numero_wo;
    }
    
    return false;
  })();
  
  // Determinar el siguiente estado al aprobar
  $: siguienteEstado = (() => {
    if (!userRole) return '';
    
    const rol = userRole.toLowerCase();
    
    if (rol === 'cerco') return 'Finalizada - Aprobada';
    if (rol === 'gerente') return 'Pendiente Aprobación CERCO';
    if (rol === 'administrativo') return 'Pendiente Aprobación Gerente';
    if (['supervisor de mantenimiento', 'supervisor de disponibilidad', 'supervisor de soporte', 'supervisor de provision'].includes(rol)) {
      return 'Pendiente Aprobación Administración';
    }
    if (rol === 'inspector') return 'Pendiente Aprobación Supervisor';
    
    return '';
  })();
  
  // Determinar el mensaje de aprobación
  $: mensajeAprobacion = (() => {
    if (!userRole) return '';
    
    const rol = userRole.toLowerCase();
    
    if (rol === 'cerco') return 'Tarea aprobada y finalizada exitosamente';
    if (rol === 'gerente') return 'Tarea aprobada por Gerencia, enviada a CERCO';
    if (rol === 'administrativo') return 'Tarea aprobada por Administración, enviada a Gerencia';
    if (['supervisor de mantenimiento', 'supervisor de disponibilidad', 'supervisor de soporte', 'supervisor de provision'].includes(rol)) {
      return 'Tarea aprobada por Supervisor, enviada a Administración';
    }
    if (rol === 'inspector') return 'Tarea aprobada por Inspector, enviada a Supervisor';
    
    return '';
  })();
  
  async function handleAprobar() {
    const confirmed = await showConfirm(
      'Confirmar Aprobación',
      '¿Estás seguro de que quieres aprobar esta tarea?'
    );
    
    if (!confirmed) return;
    
    dispatch('aprobar', {
      tareaId: tarea.id,
      siguienteEstado,
      mensaje: mensajeAprobacion
    });
  }
  
  async function handleObservar() {
    if (!observacion.trim()) {
      await showError('Error', 'Debes escribir un motivo para la observación');
      return;
    }
    
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
  
  async function handleFinalizarObservacion() {
    if (!correccion.trim()) {
      await showError('Error', 'Debes describir la corrección realizada');
      return;
    }
    
    dispatch('finalizarObservacion', {
      correccion: correccion.trim(),
      tareaId: tarea.id
    });
    
    correccion = '';
    showFinalizarForm = false;
  }
  
  async function handleReasignar() {
    if (!nuevoProveedor) {
      await showError('Error', 'Debes seleccionar un proveedor');
      return;
    }
    
    const confirmed = await showConfirm(
      'Confirmar Reasignación',
      '¿Estás seguro de que quieres reasignar esta tarea al nuevo proveedor?'
    );
    
    if (!confirmed) return;
    
    dispatch('reasignar', {
      tareaId: tarea.id,
      nuevoProveedor: parseInt(nuevoProveedor)
    });
    
    nuevoProveedor = '';
    showReassignForm = false;
  }
  
  function handleEditarCertificado() {
    dispatch('editarCertificado', {
      tareaId: tarea.id
    });
  }
  
  function handleCertificar() {
    // Navegar a la página de certificación
    window.location.href = `/task/${tarea.id}/close`;
  }
  
  async function handleExportarExcel() {
    if (isExporting) return;
    
    isExporting = true;
    
    // Timeout de seguridad para resetear el estado después de 10 segundos
    const timeoutId = setTimeout(() => {
      isExporting = false;
    }, 10000);
    
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`http://localhost:3000/api/tareas/${tarea.id}/exportar-materiales`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Error al exportar los datos');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tarea-${tarea.id_tarea_texto}-materiales.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      // Pequeño delay para que el usuario vea el estado "Exportando..."
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Mostrar mensaje de éxito sin bloquear
      showSuccess('Éxito', 'Información de Mano de Obra y Materiales exportada exitosamente');
    } catch (error) {
      console.error('Error al exportar:', error);
      showError('Error', 'No se pudo exportar el archivo Excel');
    } finally {
      clearTimeout(timeoutId);
      isExporting = false;
    }
  }

  async function handleExportarManoDeObra() {
    if (isExporting) return;
    
    isExporting = true;
    
    // Timeout de seguridad para resetear el estado después de 10 segundos
    const timeoutId = setTimeout(() => {
      isExporting = false;
    }, 10000);
    
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`http://localhost:3000/api/tareas/${tarea.id}/exportar-mano-obra`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Error al exportar la mano de obra');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${tarea.numero_wo}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      // Pequeño delay para que el usuario vea el estado "Exportando..."
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Mostrar mensaje de éxito sin bloquear
      showSuccess('Éxito', 'Mano de obra exportada exitosamente para procesamiento de pago');
    } catch (error) {
      console.error('Error al exportar mano de obra:', error);
      showError('Error', 'No se pudo exportar el archivo de mano de obra');
    } finally {
      clearTimeout(timeoutId);
      isExporting = false;
    }
  }
  
  function cancelarFormulario() {
    observacion = '';
    correccion = '';
    observacionAdicional = '';
    nuevoProveedor = '';
    showObservarForm = false;
    showPasarForm = false;
    showFinalizarForm = false;
    showReassignForm = false;
  }
</script>

<div class="accion-tarea-panel">
  {#if esTareaObservada && infoObservacion}
    <!-- Panel de Tarea Observada -->
    <div class="observacion-info">
      <div class="observacion-header">
        <h3>🔍 Tarea Observada</h3>
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
    
  {:else if puedeAprobar || puedeObservar || puedeReasignar || puedeEditarCertificado || puedeCertificar || puedeExportarManoDeObra}
    <!-- Panel de Acción Principal -->
    <div class="accion-principal">
      <div class="accion-header">
        <h3>📋 Decisión Requerida</h3>
        <p>Revise toda la información de la tarea y tome una decisión:</p>
      </div>
      
      <div class="accion-buttons">
        {#if puedeAprobar}
          <button 
            class="btn btn-success btn-large" 
            on:click={handleAprobar}
            disabled={isLoading}
          >
            {#if userRole?.toLowerCase() === 'cerco'}
              ✅ Aprobar y Finalizar
            {:else}
              ✅ Aprobar
            {/if}
          </button>
        {/if}
        
        {#if puedeObservar}
          <button 
            class="btn btn-danger btn-large" 
            on:click={() => showObservarForm = true}
            disabled={isLoading}
          >
            🚨 Observar
          </button>
        {/if}
        
        <!-- Botón de exportación a Excel - solo para rol administrativo en estado Pendiente Aprobación Administración -->
        {#if userRole?.toLowerCase() === 'administrativo' && tarea.estado === 'Pendiente Aprobación Administración' && certificado && (certificado.mano_de_obra?.length > 0 || certificado.materialesUtilizados?.length > 0 || certificado.materialesRecuperados?.length > 0)}
          <button 
            class="btn btn-excel btn-large" 
            on:click={handleExportarExcel}
            disabled={isLoading || isExporting}
          >
            {isExporting ? '⏳ Exportando...' : '📊 Exportar Información MO y MAT'}
          </button>
        {/if}
        
        <!-- Botón de exportación de mano de obra - solo para rol CERCO, siempre habilitado -->
        {#if puedeExportarManoDeObra}
          <button 
            class="btn btn-excel btn-large" 
            on:click={handleExportarManoDeObra}
            disabled={isLoading || isExporting}
          >
            {isExporting ? '⏳ Exportando...' : '💰 Exportar Mano de Obra'}
          </button>
        {/if}
        
        {#if puedeEditarCertificado}
          <button 
            class="btn btn-info btn-large" 
            on:click={handleEditarCertificado}
            disabled={isLoading}
          >
            ✏️ Editar Certificado
          </button>
        {/if}
        
        {#if puedeReasignar}
          <button 
            class="btn btn-warning btn-large" 
            on:click={() => { onLoadProveedores(); showReassignForm = true; }}
            disabled={isLoading}
          >
            🔄 Reasignar Proveedor
          </button>
        {/if}
        
        {#if puedeCertificar}
          <button 
            class="btn btn-purple btn-large" 
            on:click={handleCertificar}
            disabled={isLoading}
          >
            📋 Certificar
          </button>
        {/if}
      </div>
    </div>
  {/if}
  
  <!-- Formulario de Observación -->
  {#if showObservarForm}
    <div class="form-panel">
      <h4>Crear Observación</h4>
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
      <h4>Pasar Observación</h4>
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
      <h4>Finalizar Observación</h4>
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
  
  <!-- Formulario de Reasignación -->
  {#if showReassignForm}
    <div class="form-panel">
      <h4>Reasignar Proveedor</h4>
      <p>Puedes cambiar el proveedor asignado a esta tarea.</p>
      
      <div class="form-group">
        <label for="nuevo-proveedor">Nuevo Proveedor:</label>
        <select 
          id="nuevo-proveedor" 
          bind:value={nuevoProveedor} 
          required
          disabled={isLoading}
        >
          <option value="" disabled>Selecciona un proveedor</option>
          {#each proveedores as p}
            <option value={p.id} disabled={p.id == tarea.id_proveedor}>
              {p.nombre || p.razon_social} {p.id == tarea.id_proveedor ? '(Actual)' : ''}
            </option>
          {/each}
        </select>
      </div>
      
      <div class="form-actions">
        <button 
          class="btn btn-warning" 
          on:click={handleReasignar}
          disabled={isLoading || !nuevoProveedor}
        >
          {isLoading ? '⏳ Reasignando...' : '🔄 Confirmar Reasignación'}
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
  .accion-tarea-panel {
    background: #f8f9fa;
    border: 2px solid #dee2e6;
    border-radius: 12px;
    padding: 2rem;
    margin: 2rem 0;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }
  
  .observacion-info {
    background: white;
    border: 1px solid #e9ecef;
    border-radius: 8px;
    padding: 1.5rem;
  }
  
  .observacion-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
    padding-bottom: 1rem;
    border-bottom: 2px solid #e9ecef;
  }
  
  .observacion-header h3 {
    margin: 0;
    color: #dc3545;
    font-size: 1.3rem;
  }
  
  .estado-badge {
    padding: 0.5rem 1rem;
    border-radius: 20px;
    font-size: 0.9rem;
    font-weight: 600;
  }
  
  .estado-badge.observada {
    background: #f8d7da;
    color: #721c24;
    border: 1px solid #f5c6cb;
  }
  
  .observacion-details {
    margin-bottom: 1.5rem;
  }
  
  .observacion-item {
    margin-bottom: 0.75rem;
    font-size: 1rem;
  }
  
  .observacion-item strong {
    color: #495057;
  }
  
  .observacion-actions {
    display: flex;
    gap: 1rem;
    flex-wrap: wrap;
  }
  
  .accion-principal {
    background: white;
    border: 1px solid #e9ecef;
    border-radius: 8px;
    padding: 2rem;
    text-align: center;
  }
  
  .accion-header h3 {
    margin: 0 0 0.5rem 0;
    color: #495057;
    font-size: 1.4rem;
  }
  
  .accion-header p {
    margin: 0 0 2rem 0;
    color: #6c757d;
    font-size: 1rem;
  }
  
  .accion-buttons {
    display: flex;
    gap: 1rem;
    justify-content: center;
    flex-wrap: wrap;
  }
  
  .form-panel {
    background: white;
    border: 1px solid #e9ecef;
    border-radius: 8px;
    padding: 1.5rem;
    margin-top: 1.5rem;
  }
  
  .form-panel h4 {
    margin: 0 0 1rem 0;
    color: #495057;
    font-size: 1.2rem;
  }
  
  .form-group {
    margin-bottom: 1.5rem;
  }
  
  .form-group label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 600;
    color: #495057;
    font-size: 1rem;
  }
  
  .form-group textarea {
    width: 100%;
    padding: 1rem;
    border: 2px solid #ced4da;
    border-radius: 6px;
    font-size: 1rem;
    resize: vertical;
    min-height: 100px;
    font-family: inherit;
  }
  
  .form-group textarea:focus {
    outline: none;
    border-color: #007bff;
    box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.25);
  }
  
  .form-group textarea:disabled {
    background-color: #e9ecef;
    opacity: 0.6;
  }
  
  .form-group select {
    width: 100%;
    padding: 1rem;
    border: 2px solid #ced4da;
    border-radius: 6px;
    font-size: 1rem;
    font-family: inherit;
    background-color: white;
  }
  
  .form-group select:focus {
    outline: none;
    border-color: #007bff;
    box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.25);
  }
  
  .form-group select:disabled {
    background-color: #e9ecef;
    opacity: 0.6;
  }
  
  .form-actions {
    display: flex;
    gap: 1rem;
    justify-content: flex-end;
  }
  
  .btn {
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: 6px;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    text-decoration: none;
  }
  
  .btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  
  .btn-large {
    padding: 1rem 2rem;
    font-size: 1.1rem;
  }
  
  .btn-danger {
    background: #dc3545;
    color: white;
  }
  
  .btn-danger:hover:not(:disabled) {
    background: #c82333;
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(220, 53, 69, 0.3);
  }
  
  .btn-warning {
    background: #ffc107;
    color: #212529;
  }
  
  .btn-warning:hover:not(:disabled) {
    background: #e0a800;
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(255, 193, 7, 0.3);
  }
  
  .btn-success {
    background: #28a745;
    color: white;
  }
  
  .btn-success:hover:not(:disabled) {
    background: #218838;
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(40, 167, 69, 0.3);
  }
  
  .btn-secondary {
    background: #6c757d;
    color: white;
  }
  
  .btn-secondary:hover:not(:disabled) {
    background: #5a6268;
    transform: translateY(-2px);
  }
  
  .btn-info {
    background: #17a2b8;
    color: white;
  }
  
  .btn-info:hover:not(:disabled) {
    background: #138496;
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(23, 162, 184, 0.3);
  }
  
  .btn-purple {
    background: #6f42c1;
    color: white;
  }
  
  .btn-purple:hover:not(:disabled) {
    background: #5a32a3;
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(111, 66, 193, 0.3);
  }
  
  .btn-excel {
    background: #217346;
    color: white;
  }
  
  .btn-excel:hover:not(:disabled) {
    background: #1e6b3f;
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(33, 115, 70, 0.3);
  }
  
  /* Responsive */
  @media (max-width: 768px) {
    .accion-tarea-panel {
      padding: 1rem;
      margin: 1rem 0;
    }
    
    .accion-buttons {
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
    
    .observacion-actions {
      flex-direction: column;
    }
  }
</style>
