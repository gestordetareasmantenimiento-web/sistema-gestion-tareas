<script lang="ts">
  import { onMount } from 'svelte';
  import { user } from '$lib/stores/auth';
  
  export let tareas: any[] = [];
  export let userRole: string = '';
  export let loading: boolean = false;
  export let showFilters: boolean = true;
  
  // Estados de filtros
  let filtroEstado = '';
  let filtroInspector = '';
  let filtroProveedor = '';
  let filtroRegion = '';
  let busqueda = '';
  
  // Regiones del usuario
  let regionesUsuario: any[] = [];
  
  // Obtener valores únicos para los filtros
  $: estadosUnicos = [...new Set(tareas.map(t => t.estado))].sort();
  $: inspectoresUnicos = [...new Set(tareas.map(t => t.inspector_nombre).filter(Boolean))].sort();
  $: proveedoresUnicos = [...new Set(tareas.map(t => t.proveedor_nombre).filter(Boolean))].sort();
  $: regionesUnicas = [...new Set(tareas.map(t => t.region).filter(Boolean))].sort();
  
  // Determinar si mostrar el filtro de región
  $: mostrarFiltroRegion = regionesUsuario.length > 1;
  
  // Filtrar tareas
  $: tareasFiltradas = tareas.filter(tarea => {
    const cumpleEstado = !filtroEstado || tarea.estado === filtroEstado;
    const cumpleInspector = !filtroInspector || tarea.inspector_nombre === filtroInspector;
    const cumpleProveedor = !filtroProveedor || tarea.proveedor_nombre === filtroProveedor;
    const cumpleRegion = !filtroRegion || tarea.region === filtroRegion;
    const cumpleBusqueda = !busqueda || 
      tarea.id_tarea_texto?.toLowerCase().includes(busqueda.toLowerCase()) ||
      tarea.direccion?.toLowerCase().includes(busqueda.toLowerCase()) ||
      tarea.numero_wo?.toLowerCase().includes(busqueda.toLowerCase());
    
    return cumpleEstado && cumpleInspector && cumpleProveedor && cumpleRegion && cumpleBusqueda;
  });
  
  // Función para limpiar filtros
  function limpiarFiltros() {
    filtroEstado = '';
    filtroInspector = '';
    filtroProveedor = '';
    filtroRegion = '';
    busqueda = '';
  }
  
  // Función para obtener el color del estado
  function getEstadoColor(estado: string): string {
    const estadoLower = estado.toLowerCase();
    if (estadoLower.includes('observada')) return '#fd7e14';
    if (estadoLower.includes('pendiente certificación')) return '#6f42c1';
    if (estadoLower.includes('asignada')) return '#ffc107';
    if (estadoLower.includes('aprobación')) return '#17a2b8';
    if (estadoLower.includes('completada')) return '#28a745';
    return '#6c757d';
  }
  
  // Función para manejar acciones rápidas
  function handleAccion(tarea: any, accion: string) {
    // Emitir evento para que el componente padre maneje la acción
    const event = new CustomEvent('taskAction', {
      detail: { tarea, accion }
    });
    window.dispatchEvent(event);
  }
  
  // Cargar regiones del usuario al montar el componente
  onMount(async () => {
    const token = localStorage.getItem('authToken');
    if (!token) return;
    
    const headers = { 'Authorization': `Bearer ${token}` };
    
    try {
      const regionesRes = await fetch('http://localhost:3000/api/user/regions', { headers });
      if (regionesRes.ok) {
        regionesUsuario = (await regionesRes.json()).data;
      }
    } catch (error) {
      console.error('Error cargando regiones del usuario:', error);
    }
  });
</script>

<div class="task-table-container">
  <!-- Filtros -->
  {#if showFilters}
  <div class="filters-section">
    <div class="filters-row">
      <div class="filter-group">
        <label for="busqueda">Buscar:</label>
        <input 
          type="text" 
          id="busqueda"
          bind:value={busqueda}
          placeholder="ID, dirección, WO..."
          class="search-input"
        />
      </div>
      
      <div class="filter-group">
        <label for="estado">Estado:</label>
        <select id="estado" bind:value={filtroEstado} class="filter-select">
          <option value="">Todos</option>
          {#each estadosUnicos as estado}
            <option value={estado}>{estado}</option>
          {/each}
        </select>
      </div>
      
      {#if userRole === 'administrativo' || userRole === 'gerente' || userRole === 'cerco'}
        <div class="filter-group">
          <label for="inspector">Inspector:</label>
          <select id="inspector" bind:value={filtroInspector} class="filter-select">
            <option value="">Todos</option>
            {#each inspectoresUnicos as inspector}
              <option value={inspector}>{inspector}</option>
            {/each}
          </select>
        </div>
        
        <div class="filter-group">
          <label for="proveedor">Proveedor:</label>
          <select id="proveedor" bind:value={filtroProveedor} class="filter-select">
            <option value="">Todos</option>
            {#each proveedoresUnicos as proveedor}
              <option value={proveedor}>{proveedor}</option>
            {/each}
          </select>
        </div>
      {/if}
      
      {#if userRole === 'inspector' || userRole === 'supervisor de mantenimiento'}
        <div class="filter-group">
          <label for="proveedor">Proveedor:</label>
          <select id="proveedor" bind:value={filtroProveedor} class="filter-select">
            <option value="">Todos</option>
            {#each proveedoresUnicos as proveedor}
              <option value={proveedor}>{proveedor}</option>
            {/each}
          </select>
        </div>
      {/if}
      
      {#if mostrarFiltroRegion}
        <div class="filter-group">
          <label for="region">Región:</label>
          <select id="region" bind:value={filtroRegion} class="filter-select">
            <option value="">Todas</option>
            {#each regionesUnicas as region}
              <option value={region}>{region}</option>
            {/each}
          </select>
        </div>
      {/if}
      
      <button class="clear-filters-btn" on:click={limpiarFiltros}>
        Limpiar Filtros
      </button>
    </div>
    
    <div class="results-info">
      Mostrando {tareasFiltradas.length} de {tareas.length} tareas
    </div>
  </div>
  {/if}
  
  <!-- Tabla -->
  <div class="table-container">
    {#if loading}
      <div class="loading">Cargando tareas...</div>
    {:else if tareasFiltradas.length === 0}
      <div class="no-results">No se encontraron tareas</div>
    {:else}
      <table class="task-table">
        <thead>
          <tr>
            <th>ID Tarea</th>
            <th>Estado</th>
            <th>Dirección</th>
            <th>WO</th>
            <th>Región</th>
            {#if userRole === 'administrativo' || userRole === 'gerente' || userRole === 'cerco'}
              <th>Proveedor</th>
              <th>Inspector/Supervisor</th>
              <th>Supervisor</th>
            {/if}
            {#if userRole === 'supervisor de mantenimiento'}
              <th>Proveedor</th>
              <th>Inspector</th>
            {/if}
            {#if userRole === 'inspector'}
              <th>Proveedor</th>
            {/if}
            {#if userRole === 'proveedor'}
              <th>Inspector/Supervisor</th>
            {/if}
            <th>Fechas</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {#each tareasFiltradas as tarea (tarea.id)}
            <tr class="task-row">
              <td class="task-id">
                <a href="/task/{tarea.id}" class="task-link">
                  {tarea.id_tarea_texto}
                </a>
              </td>
              <td class="task-status">
                <span 
                  class="status-badge" 
                  style="background-color: {getEstadoColor(tarea.estado)}"
                >
                  {tarea.estado}
                </span>
              </td>
              <td class="task-address">{tarea.direccion}</td>
              <td class="task-wo">{tarea.numero_wo || 'N/A'}</td>
              <td class="task-region">{tarea.region}</td>
              
              {#if userRole === 'administrativo' || userRole === 'gerente' || userRole === 'cerco'}
                <td class="task-provider">{tarea.proveedor_nombre || 'N/A'}</td>
                <td class="task-inspector">
                  {#if tarea.inspector_nombre}
                    <div class="inspector-info">
                      <div class="inspector-name">{tarea.inspector_nombre}</div>
                    </div>
                  {:else}
                    N/A
                  {/if}
                </td>
                <td class="task-supervisor">{tarea.supervisor_nombre || 'N/A'}</td>
              {/if}
              
              {#if userRole === 'supervisor de mantenimiento'}
                <td class="task-provider">{tarea.proveedor_nombre || 'N/A'}</td>
                <td class="task-inspector">{tarea.inspector_nombre || 'N/A'}</td>
              {/if}
              
              {#if userRole === 'inspector'}
                <td class="task-provider">{tarea.proveedor_nombre || 'N/A'}</td>
              {/if}
              
              {#if userRole === 'proveedor'}
                <td class="task-inspector">
                  {#if tarea.inspector_nombre}
                    <div class="inspector-info">
                      <div class="inspector-name">{tarea.inspector_nombre}</div>
                    </div>
                  {:else}
                    N/A
                  {/if}
                </td>
              {/if}
              
              <td class="task-dates">
                <div class="date-info">
                  {#if tarea.fecha_inicio}
                    <div class="date-item">
                      <strong>Inicio:</strong> {new Date(tarea.fecha_inicio).toLocaleDateString()}
                    </div>
                  {/if}
                  {#if tarea.fecha_fin}
                    <div class="date-item">
                      <strong>Fin:</strong> {new Date(tarea.fecha_fin).toLocaleDateString()}
                    </div>
                  {/if}
                </div>
              </td>
              
              <td class="task-actions">
                <div class="action-buttons">
                  <button 
                    class="action-btn view-btn" 
                    on:click={() => handleAccion(tarea, 'view')}
                    title="Ver detalles"
                  >
                    👁️
                  </button>
                  
                  
                  
                </div>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    {/if}
  </div>
</div>

<style>
  .task-table-container {
    width: 100%;
    background: white;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    overflow: hidden;
  }
  
  .filters-section {
    background: #f8f9fa;
    padding: 1rem;
    border-bottom: 1px solid #dee2e6;
  }
  
  .filters-row {
    display: flex;
    gap: 1rem;
    align-items: end;
    flex-wrap: wrap;
    margin-bottom: 0.5rem;
  }
  
  .filter-group {
    display: flex;
    flex-direction: column;
    min-width: 150px;
  }
  
  .filter-group label {
    font-size: 0.8rem;
    font-weight: 600;
    color: #495057;
    margin-bottom: 0.25rem;
  }
  
  .search-input, .filter-select {
    padding: 0.5rem;
    border: 1px solid #ced4da;
    border-radius: 4px;
    font-size: 0.9rem;
    background: white;
  }
  
  .search-input {
    min-width: 200px;
  }
  
  .clear-filters-btn {
    padding: 0.5rem 1rem;
    background: #6c757d;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.9rem;
    height: fit-content;
  }
  
  .clear-filters-btn:hover {
    background: #5a6268;
  }
  
  .results-info {
    font-size: 0.9rem;
    color: #6c757d;
    font-weight: 500;
  }
  
  .table-container {
    overflow-x: auto;
  }
  
  .task-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.9rem;
  }
  
  .task-table th {
    background: #e9ecef;
    padding: 0.75rem 0.5rem;
    text-align: left;
    font-weight: 600;
    color: #495057;
    border-bottom: 2px solid #dee2e6;
    white-space: nowrap;
  }
  
  .task-table td {
    padding: 0.75rem 0.5rem;
    border-bottom: 1px solid #dee2e6;
    vertical-align: top;
  }
  
  .task-row:hover {
    background: #f8f9fa;
  }
  
  .task-link {
    color: #007bff;
    text-decoration: none;
    font-weight: 600;
  }
  
  .task-link:hover {
    text-decoration: underline;
  }
  
  .status-badge {
    display: inline-block;
    padding: 0.25rem 0.5rem;
    border-radius: 12px;
    color: white;
    font-size: 0.8rem;
    font-weight: 500;
    white-space: nowrap;
  }
  
  .task-address {
    max-width: 200px;
    word-wrap: break-word;
  }
  
  .task-icd {
    font-family: monospace;
    font-size: 0.85rem;
  }
  
  .date-info {
    font-size: 0.8rem;
  }
  
  .date-item {
    margin-bottom: 0.25rem;
  }
  
  .date-item strong {
    color: #495057;
  }
  
  .inspector-info {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }
  
  .inspector-name {
    font-weight: 500;
    color: #212529;
  }
  
  .supervisor-auth {
    font-size: 0.75rem;
    color: #28a745;
    font-weight: 500;
    background-color: #d4edda;
    padding: 0.125rem 0.375rem;
    border-radius: 3px;
    border: 1px solid #c3e6cb;
  }
  
  .action-buttons {
    display: flex;
    gap: 0.25rem;
    align-items: center;
    flex-wrap: wrap;
  }
  
  .action-btn {
    padding: 0.25rem 0.5rem;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.9rem;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    gap: 0.25rem;
    min-width: 32px;
    height: 32px;
    justify-content: center;
  }
  
  .view-btn {
    background: #17a2b8;
    color: white;
  }
  
  
  
  .action-btn:hover {
    opacity: 0.8;
    transform: scale(1.05);
  }
  
  .loading, .no-results {
    text-align: center;
    padding: 2rem;
    color: #6c757d;
    font-size: 1.1rem;
  }
  
  .loading {
    color: #007bff;
  }
  
  /* Responsive */
  @media (max-width: 1200px) {
    .filters-row {
      flex-direction: column;
      align-items: stretch;
    }
    
    .filter-group {
      min-width: auto;
    }
    
    .search-input {
      min-width: auto;
    }
  }
</style>
