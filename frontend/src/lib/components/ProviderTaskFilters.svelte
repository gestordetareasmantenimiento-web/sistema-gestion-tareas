<script lang="ts">
  import { onMount, createEventDispatcher } from 'svelte';
  import { startLoading, stopLoading } from '$lib/utils/loadingUtils';
  import MultiSelect from './MultiSelect.svelte';
  
  const dispatch = createEventDispatcher();
  
  // Estados de filtros específicos para proveedores
  let filtroCategoria = '';
  let filtrosEstado: string[] = []; // Sin filtro por defecto, mostrar todas las tareas
  let filtrosRegion: string[] = [];
  let filtrosInspector: string[] = [];
  let busqueda = '';
  
  // Regiones disponibles (para proveedores siempre se muestra)
  let regionesDisponibles: any[] = [];
  
  // Categorías específicas para proveedores
  const categorias = [
    { value: '', label: 'Todas las categorías' },
    { value: 'pendientes', label: 'Pendientes de trabajo (Asignadas)' },
    { value: 'certificadas', label: 'Certificadas (en revisión)' },
    { value: 'enAprobacion', label: 'En proceso de aprobación' },
    { value: 'observados', label: 'Observados (requieren corrección)' },
    { value: 'finalizadas', label: 'Finalizadas y aprobadas' }
  ];
  
  // Estados específicos para proveedores
  const estados = [
    { value: '', label: 'Todos los estados' },
    { value: 'Asignada', label: 'Asignada (por defecto)' },
    { value: 'Pendiente Certificación Inspector', label: 'Pendiente Certificación Inspector' },
    { value: 'Pendiente Aprobación Supervisor', label: 'Pendiente Aprobación Supervisor' },
    { value: 'Pendiente Aprobación Administración', label: 'Pendiente Aprobación Administración' },
    { value: 'Pendiente Aprobación Gerente', label: 'Pendiente Aprobación Gerente' },
    { value: 'Pendiente Aprobación CERCO', label: 'Pendiente Aprobación CERCO' },
    { value: 'Finalizada - Aprobada', label: 'Finalizada - Aprobada' },
    { value: 'Observada por Inspector', label: 'Observada por Inspector' },
    { value: 'Observada por Supervisor', label: 'Observada por Supervisor' },
    { value: 'Observada por Administración', label: 'Observada por Administración' },
    { value: 'Observada por Gerente', label: 'Observada por Gerente' },
    { value: 'Observada por CERCO', label: 'Observada por CERCO' }
  ];
  
  // Función para limpiar todos los filtros
  function limpiarFiltros() {
    filtroCategoria = '';
    filtrosEstado = []; // Sin filtro por defecto
    filtrosRegion = [];
    filtrosInspector = [];
    busqueda = '';
    emitirFiltros();
  }
  
  // Función para emitir los filtros al componente padre
  function emitirFiltros() {
    dispatch('filtrosCambiados', {
      categoria: filtroCategoria,
      estados: filtrosEstado,
      regiones: filtrosRegion,
      inspectores: filtrosInspector,
      busqueda: busqueda
    });
  }
  
  // Cargar regiones disponibles al montar el componente
  onMount(async () => {
    const token = localStorage.getItem('authToken');
    if (!token) return;
    
    startLoading('Cargando filtros...');
    
    try {
      // Cargar regiones del usuario
      const regionesRes = await fetch('http://localhost:3000/api/user/regions', { 
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (regionesRes.ok) {
        regionesDisponibles = (await regionesRes.json()).data;
      }
    } catch (error) {
      console.error('Error cargando regiones:', error);
    } finally {
      stopLoading();
    }
    
    // Emitir filtros iniciales (sin filtro por defecto)
    emitirFiltros();
  });
  
  // Emitir filtros cuando cambien
  $: if (filtroCategoria || filtrosEstado.length > 0 || filtrosRegion.length > 0 || filtrosInspector.length > 0 || busqueda) {
    emitirFiltros();
  }
</script>

<div class="provider-filters-container">
  <div class="filters-header">
    <h3>🔍 Filtros de Proveedor</h3>
    <p>Filtra tus tareas según el estado y región de trabajo</p>
  </div>
  
  <div class="filters-grid">
    <!-- Filtro de categoría (específico para proveedores) -->
    <div class="filter-group">
      <label for="categoria">Categoría:</label>
      <select id="categoria" bind:value={filtroCategoria} class="filter-select">
        {#each categorias as categoria}
          <option value={categoria.value}>{categoria.label}</option>
        {/each}
      </select>
    </div>
    
    <!-- Filtro de estado (por defecto "Asignada") -->
    <div class="filter-group">
      <MultiSelect
        label="Estados:"
        id="estados-filter"
        options={estados.filter(e => e.value)}
        selectedValues={filtrosEstado}
        placeholder="Seleccionar estados..."
        on:change={(e) => {
          filtrosEstado = e.detail;
          emitirFiltros();
        }}
      />
    </div>
    
    <!-- Filtro de región (siempre visible para proveedores) -->
    <div class="filter-group">
      <MultiSelect
        label="Regiones:"
        id="regiones-filter"
        options={regionesDisponibles.map(r => ({ value: r.nombre, label: r.nombre }))}
        selectedValues={filtrosRegion}
        placeholder="Seleccionar regiones..."
        on:change={(e) => {
          filtrosRegion = e.detail;
          emitirFiltros();
        }}
      />
    </div>
    
    <!-- Filtro de inspector -->
    <div class="filter-group">
      <MultiSelect
        label="Inspectores:"
        id="inspectores-filter"
        options={[]}
        selectedValues={filtrosInspector}
        placeholder="Seleccionar inspectores..."
        on:change={(e) => {
          filtrosInspector = e.detail;
          emitirFiltros();
        }}
      />
    </div>
    
    <!-- Búsqueda general -->
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
  </div>
  
  <div class="filters-actions">
    <button class="clear-filters-btn" on:click={limpiarFiltros}>
      🗑️ Limpiar Filtros
    </button>
  </div>
</div>

<style>
  .provider-filters-container {
    background: #f8f9fa;
    border: 1px solid #dee2e6;
    border-radius: 8px;
    padding: 1.5rem;
    margin-bottom: 1.5rem;
  }
  
  .filters-header {
    margin-bottom: 1rem;
  }
  
  .filters-header h3 {
    margin: 0 0 0.5rem 0;
    color: #495057;
    font-size: 1.1rem;
  }
  
  .filters-header p {
    margin: 0;
    color: #6c757d;
    font-size: 0.9rem;
  }
  
  .filters-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
    margin-bottom: 1rem;
  }
  
  .filter-group {
    display: flex;
    flex-direction: column;
  }
  
  .filter-group label {
    font-size: 0.8rem;
    font-weight: 600;
    color: #495057;
    margin-bottom: 0.25rem;
  }
  
  .filter-select, .search-input {
    padding: 0.5rem;
    border: 1px solid #ced4da;
    border-radius: 4px;
    font-size: 0.9rem;
    background: white;
  }
  
  .search-input {
    min-width: 200px;
  }
  
  .filters-actions {
    display: flex;
    justify-content: center;
    gap: 1rem;
  }
  
  .clear-filters-btn {
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.9rem;
    background: #6c757d;
    color: white;
  }
  
  .clear-filters-btn:hover {
    background: #5a6268;
  }
  
  /* Responsive */
  @media (max-width: 768px) {
    .filters-grid {
      grid-template-columns: 1fr;
    }
    
    .search-input {
      min-width: auto;
    }
    
    .filters-actions {
      flex-direction: column;
    }
  }
</style>
