<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import TaskTable from '$lib/components/TaskTable.svelte';
  import AdminTaskFilters from '$lib/components/AdminTaskFilters.svelte';
  import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';
  import { user } from '$lib/stores/auth';
  import { isLoading, loadingMessage, startLoading, stopLoading } from '$lib/utils/loadingUtils';
  
  interface PageData {
    columnas?: {
      pendientesDeWo?: any[];
      pendientesDeAprobacion?: any[];
      tareasGeneradas?: any[];
      aprobadasPorAdmin?: any[];
      observados?: any[];
    };
    error?: string;
  }
  
  export let data: PageData;
  
  // Combinar todas las tareas de todas las columnas
  $: todasLasTareas = [
    ...(data.columnas?.pendientesDeWo || []),
    ...(data.columnas?.pendientesDeAprobacion || []),
    ...(data.columnas?.tareasGeneradas || []),
    ...(data.columnas?.aprobadasPorAdmin || []),
    ...(data.columnas?.observados || [])
  ];
  
  // Estados de filtros
  let filtros = {
    categorias: [] as string[],
    estados: [] as string[],
    inspectores: [] as string[],
    proveedores: [] as string[],
    regiones: [] as string[],
    busqueda: ''
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
      
      // Filtro por búsqueda
      if (filtros.busqueda) {
        const busqueda = filtros.busqueda.toLowerCase();
        const cumpleBusqueda = 
          tarea.id_tarea_texto?.toLowerCase().includes(busqueda) ||
          tarea.direccion?.toLowerCase().includes(busqueda) ||
          tarea.numero_wo?.toLowerCase().includes(busqueda);
        if (!cumpleBusqueda) return false;
      }
      
      return true;
    });
  }
  
  function verificarCategoria(tarea: any, categoria: string): boolean {
    switch (categoria) {
      case 'pendientesDeWo':
        return !tarea.numero_wo && tarea.estado === 'Asignada';
      case 'pendientesDeAprobacion':
        return tarea.estado === 'Pendiente Aprobación Administración';
      case 'tareasGeneradas':
        return tarea.numero_wo && ['Asignada', 'Pendiente Certificación Inspector'].includes(tarea.estado);
      case 'aprobadasPorAdmin':
        return ['Pendiente Aprobación Gerente', 'Pendiente Aprobación CERCO', 'Finalizada - Aprobada'].includes(tarea.estado);
      case 'observados':
        return tarea.estado.toLowerCase().includes('observada');
      default:
        return true;
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
    
    // Aquí puedes implementar la lógica para cada acción
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
      startLoading('Cargando tareas administrativas...');
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
      <h1>Dashboard de Administración</h1>
      <p>Tareas correspondientes a tu región.</p>
  </div>

  {#if data.error}
    <p class="error">{data.error}</p>
  {/if}

  <!-- Mostrar spinner de carga si está cargando -->
  {#if $isLoading}
    <LoadingSpinner message={$loadingMessage} size="large" />
  {:else}
    <!-- Filtros específicos para administrativos -->
    <AdminTaskFilters on:filtrosCambiados={handleFiltrosCambiados} />

    <!-- Información de resultados -->
    <div class="results-info">
      <p>Mostrando {tareasFiltradas.length} de {todasLasTareas.length} tareas</p>
      {#if filtros.categorias.length > 0}
        <span class="active-filter">Categorías: {filtros.categorias.join(', ')}</span>
      {/if}
      {#if filtros.estados.length > 0}
        <span class="active-filter">Estados: {filtros.estados.join(', ')}</span>
      {/if}
      {#if filtros.inspectores.length > 0}
        <span class="active-filter">Inspectores: {filtros.inspectores.join(', ')}</span>
      {/if}
      {#if filtros.proveedores.length > 0}
        <span class="active-filter">Proveedores: {filtros.proveedores.join(', ')}</span>
      {/if}
      {#if filtros.regiones.length > 0}
        <span class="active-filter">Regiones: {filtros.regiones.join(', ')}</span>
      {/if}
      {#if filtros.busqueda}
        <span class="active-filter">Búsqueda: "{filtros.busqueda}"</span>
      {/if}
    </div>

    <!-- Tabla con tareas filtradas -->
    <TaskTable 
      tareas={tareasFiltradas} 
      userRole={$user?.rol || ''} 
      loading={false}
      showFilters={false}
    />
  {/if}
</div>

<style>
  .main-container {
    width: 100%;
    max-width: 100vw;
    margin: 0;
    padding: 1rem;
    box-sizing: border-box;
  }
  
  .header {
    margin-bottom: 1.5rem;
    padding: 0;
  }
  
  .header h1 {
    margin-bottom: 0.5rem;
    color: #333;
    font-size: 1.8rem;
  }
  
  .header p {
    color: #666;
    margin-top: 0;
    font-size: 1rem;
  }
  
  .error { 
    color: #dc3545;
    background: #f8d7da;
    border: 1px solid #f5c6cb;
    padding: 0.75rem;
    border-radius: 4px;
    margin-bottom: 1rem;
  }
  
  .results-info {
    background: #e9ecef;
    border: 1px solid #dee2e6;
    border-radius: 4px;
    padding: 0.75rem;
    margin-bottom: 1rem;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 1rem;
  }
  
  .results-info p {
    margin: 0;
    font-weight: 600;
    color: #495057;
  }
  
  .active-filter {
    background: #007bff;
    color: white;
    padding: 0.25rem 0.5rem;
    border-radius: 12px;
    font-size: 0.8rem;
    font-weight: 500;
  }
</style>

