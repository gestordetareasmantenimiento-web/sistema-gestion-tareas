<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { goto } from '$app/navigation';
  import TaskTable from '$lib/components/TaskTable.svelte';
  import ProviderTaskFilters from '$lib/components/ProviderTaskFilters.svelte';
  import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';
  import { user } from '$lib/stores/auth';
  import { isLoading, loadingMessage, startLoading, stopLoading } from '$lib/utils/loadingUtils';
  
  interface PageData {
    columnas?: {
      pendientes?: any[];
      certificadas?: any[];
      enAprobacion?: any[];
      observados?: any[];
      finalizadas?: any[];
      canceladas?: any[];
    };
    error?: string;
  }
  
  export let data: PageData;
  
  // Usar la columna "todas" si existe, sino combinar todas las columnas
  $: todasLasTareas = data.columnas?.todas || [
    ...(data.columnas?.pendientes || []),
    ...(data.columnas?.certificadas || []),
    ...(data.columnas?.enAprobacion || []),
    ...(data.columnas?.observados || []),
    ...(data.columnas?.finalizadas || []),
    ...(data.columnas?.canceladas || [])
  ];

  
  // Estados de filtros
  let filtros = {
    categoria: '',
    estados: [] as string[], // Por defecto mostrar todas las tareas del proveedor
    regiones: [] as string[],
    inspectores: [] as string[],
    busqueda: ''
  };
  
  // Aplicar filtros a las tareas
  $: tareasFiltradas = aplicarFiltros(todasLasTareas, filtros);
  
  function aplicarFiltros(tareas: any[], filtros: any) {
    return tareas.filter(tarea => {
      // Filtro por categoría
      if (filtros.categoria) {
        const categoriaValida = verificarCategoria(tarea, filtros.categoria);
        if (!categoriaValida) return false;
      }
      
      // Filtro por estados (múltiple)
      if (filtros.estados.length > 0 && !filtros.estados.includes(tarea.estado)) {
        return false;
      }
      
      // Filtro por regiones (múltiple)
      if (filtros.regiones.length > 0 && !filtros.regiones.includes(tarea.region)) {
        return false;
      }
      
      // Filtro por inspectores (múltiple)
      if (filtros.inspectores.length > 0 && !filtros.inspectores.includes(tarea.inspector_nombre)) {
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
      case 'pendientes':
        return tarea.estado === 'Asignada';
      case 'certificadas':
        return tarea.estado === 'Pendiente Certificación Inspector';
      case 'enAprobacion':
        return [
          'Pendiente Aprobación Supervisor',
          'Pendiente Aprobación Administración', 
          'Pendiente Aprobación Gerente',
          'Pendiente Aprobación CERCO'
        ].includes(tarea.estado);
      case 'observados':
        return tarea.estado.toLowerCase().includes('observada') || tarea.estado.toLowerCase().includes('observado');
      case 'finalizadas':
        return tarea.estado === 'Finalizada - Aprobada';
      default:
        return true;
    }
  }
  
  // Manejar cambios en los filtros
  function handleFiltrosCambiados(event: CustomEvent) {
    filtros = event.detail;
  }
  
  // Manejar acciones de la tabla
  function handleTaskAction(event: Event) {
    event.preventDefault();
    event.stopPropagation();
    
    const customEvent = event as CustomEvent;
    const { tarea, accion } = customEvent.detail;
    console.log('Acción recibida:', accion, 'Tarea:', tarea.id);
    
    // Aquí puedes implementar la lógica para cada acción
    switch (accion) {
      case 'view':
        console.log('Navegando a vista de tarea:', tarea.id);
        goto(`/task/${tarea.id}`);
        break;
      default:
        console.log('Acción no reconocida:', accion);
    }
  }
  
  // Configurar event listeners
  onMount(() => {
    window.addEventListener('taskAction', handleTaskAction);
  });
  
  onDestroy(() => {
    window.removeEventListener('taskAction', handleTaskAction);
    stopLoading();
  });
</script>

<div class="main-container">
  <div class="header">
    <h1>Dashboard de Proveedor</h1>
    <p>Tareas asignadas a tu empresa para ejecutar.</p>
  </div>

  {#if data.error}
    <p class="error">{data.error}</p>
  {/if}

  <!-- Mostrar spinner de carga si no hay datos -->
  {#if !data.columnas || Object.keys(data.columnas).length === 0}
    <LoadingSpinner message="Cargando tareas del proveedor..." size="large" />
  {:else}
    <!-- Filtros específicos para proveedores -->
    <ProviderTaskFilters on:filtrosCambiados={handleFiltrosCambiados} />

    <!-- Información de resultados -->
    <div class="results-info">
      <p>Mostrando {tareasFiltradas.length} de {todasLasTareas.length} tareas</p>
      {#if filtros.categoria}
        <span class="active-filter">Categoría: {filtros.categoria}</span>
      {/if}
      {#if filtros.estado}
        <span class="active-filter">Estado: {filtros.estado}</span>
      {/if}
      {#if filtros.region}
        <span class="active-filter">Región: {filtros.region}</span>
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
