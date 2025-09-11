<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import TaskTable from '$lib/components/TaskTable.svelte';
  import CercoTaskFilters from '$lib/components/CercoTaskFilters.svelte';
  import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';
  import { user } from '$lib/stores/auth';
  import { isLoading, loadingMessage, startLoading, stopLoading } from '$lib/utils/loadingUtils';
  
  interface PageData {
    columnas?: {
      pendientesDeRevisionFinal?: any[];
      observados?: any[];
      pasadasAPago?: any[];
    };
    error?: string;
  }
  
  export let data: PageData;
  
  // Combinar todas las tareas de todas las columnas
  $: todasLasTareas = [
    ...(data.columnas?.pendientesDeRevisionFinal || []),
    ...(data.columnas?.observados || []),
    ...(data.columnas?.pasadasAPago || [])
  ];
  
  // Estados de filtros
  let filtros = {
    categorias: [] as string[],
    estados: [] as string[],
    inspectores: [] as string[],
    proveedores: [] as string[],
    regiones: [] as string[],
    busqueda: '',
    mostrarPasadasAPago: false
  };
  
  // Aplicar filtros a las tareas
  $: tareasFiltradas = aplicarFiltros(todasLasTareas, filtros);
  
  function aplicarFiltros(tareas: any[], filtros: any) {
    return tareas.filter(tarea => {
      // Filtro por categorías (múltiple)
      if (filtros.categorias.length > 0) {
        const categoriaValida = filtros.categorias.some((categoria: string) => verificarCategoria(tarea, categoria));
        if (!categoriaValida) return false;
      }
      
      // Filtro por estados (múltiple)
      if (filtros.estados.length > 0 && !filtros.estados.includes(tarea.estado)) {
        return false;
      }
      
      // Filtro por inspectores/supervisores (múltiple)
      if (filtros.inspectores.length > 0) {
        const inspectorMatch = filtros.inspectores.includes(tarea.inspector_nombre);
        const supervisorMatch = tarea.supervisor_nombre && filtros.inspectores.includes(tarea.supervisor_nombre);
        if (!inspectorMatch && !supervisorMatch) {
          return false;
        }
      }
      
      // Filtro por proveedores (múltiple)
      if (filtros.proveedores.length > 0 && !filtros.proveedores.includes(tarea.proveedor_nombre)) {
        return false;
      }
      
      // Filtro por regiones (múltiple)
      if (filtros.regiones.length > 0 && !filtros.regiones.includes(tarea.region)) {
        return false;
      }
      
      // Filtro especial para tareas pasadas a pago
      if (!filtros.mostrarPasadasAPago && tarea.estado === 'Finalizada - Aprobada') {
        return false;
      }
      
      // Filtro de búsqueda
      if (filtros.busqueda) {
        const busqueda = filtros.busqueda.toLowerCase();
        return tarea.id_tarea_texto?.toLowerCase().includes(busqueda) ||
               tarea.direccion?.toLowerCase().includes(busqueda) ||
               tarea.numero_wo?.toLowerCase().includes(busqueda);
      }
      
      return true;
    });
  }
  
  // Función para verificar categoría
  function verificarCategoria(tarea: any, categoria: string): boolean {
    switch (categoria) {
      case 'pendientesDeRevisionFinal':
        return tarea.estado === 'Pendiente Aprobación CERCO';
      case 'observados':
        return tarea.estado === 'Observada por CERCO';
      case 'pasadasAPago':
        return tarea.estado === 'Finalizada - Aprobada';
      default:
        return false;
    }
  }
  
  // Manejar cambios en los filtros
  function handleFiltrosCambiados(event: CustomEvent) {
    filtros = event.detail;
  }
  
  // Manejar acciones de la tabla
  async function handleTaskAction(event: Event) {
    const customEvent = event as CustomEvent;
    const { tarea, accion } = customEvent.detail;
    console.log('Acción:', accion, 'Tarea:', tarea.id);
    
    switch (accion) {
      case 'view':
        window.location.href = `/task/${tarea.id}`;
        break;
      case 'certify':
        window.location.href = `/task/${tarea.id}/close`;
        break;
    }
  }
  
  // Configurar event listeners
  onMount(() => {
    window.addEventListener('taskAction', handleTaskAction);
    
    // Iniciar carga si no hay datos
    if (!data.columnas || Object.keys(data.columnas).length === 0) {
      startLoading('Cargando tareas de CERCO...');
    }
  });
  
  onDestroy(() => {
    window.removeEventListener('taskAction', handleTaskAction);
    stopLoading();
  });
  
  // Detener carga cuando lleguen los datos
  $: if (data.columnas && Object.keys(data.columnas).length > 0) {
    stopLoading();
  }
</script>

<div class="main-container">
  <div class="header">
    <h1>Dashboard de CERCO</h1>
    <p>Visualización de todas las tareas en etapa de certificación final.</p>
  </div>
  
  {#if $isLoading}
    <LoadingSpinner message={$loadingMessage} />
  {:else}
    <!-- Filtros -->
    <CercoTaskFilters on:filtrosCambiados={handleFiltrosCambiados} />
    
    <!-- Información de resultados -->
    <div class="results-info">
      <p>Mostrando {tareasFiltradas.length} de {todasLasTareas.length} tareas</p>
      {#if filtros.categorias.length > 0 || filtros.estados.length > 0 || filtros.inspectores.length > 0 || filtros.proveedores.length > 0 || filtros.regiones.length > 0 || filtros.busqueda || filtros.mostrarPasadasAPago}
        <div class="active-filters">
          <strong>Filtros activos:</strong>
          {#if filtros.categorias.length > 0}
            <span class="filter-tag">Categorías: {filtros.categorias.join(', ')}</span>
          {/if}
          {#if filtros.estados.length > 0}
            <span class="filter-tag">Estados: {filtros.estados.join(', ')}</span>
          {/if}
          {#if filtros.inspectores.length > 0}
            <span class="filter-tag">Inspectores: {filtros.inspectores.join(', ')}</span>
          {/if}
          {#if filtros.proveedores.length > 0}
            <span class="filter-tag">Proveedores: {filtros.proveedores.join(', ')}</span>
          {/if}
          {#if filtros.regiones.length > 0}
            <span class="filter-tag">Regiones: {filtros.regiones.join(', ')}</span>
          {/if}
          {#if filtros.busqueda}
            <span class="filter-tag">Búsqueda: "{filtros.busqueda}"</span>
          {/if}
          {#if filtros.mostrarPasadasAPago}
            <span class="filter-tag">Incluyendo pasadas a pago</span>
          {/if}
        </div>
      {/if}
    </div>
    
    <!-- Tabla de tareas -->
    <TaskTable 
      tareas={tareasFiltradas} 
      userRole={$user?.rol}
      showFilters={false}
    />
  {/if}
</div>

<style>
  .main-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 1rem;
  }
  
  .header {
    text-align: center;
    margin-bottom: 2rem;
  }
  
  .header h1 {
    color: #333;
    margin-bottom: 0.5rem;
    font-size: 2rem;
  }
  
  .header p {
    color: #666;
    font-size: 1.1rem;
  }
  
  .results-info {
    background: #f8f9fa;
    border: 1px solid #dee2e6;
    border-radius: 8px;
    padding: 1rem;
    margin-bottom: 1rem;
  }
  
  .results-info p {
    margin: 0 0 0.5rem 0;
    font-weight: 500;
    color: #495057;
  }
  
  .active-filters {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    align-items: center;
  }
  
  .active-filters strong {
    color: #495057;
    margin-right: 0.5rem;
  }
  
  .filter-tag {
    background: #667eea;
    color: white;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    font-size: 0.8rem;
    font-weight: 500;
  }
</style>