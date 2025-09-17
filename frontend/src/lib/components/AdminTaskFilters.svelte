<script lang="ts">
  import { onMount, createEventDispatcher } from 'svelte';
  import MultiSelect from './MultiSelect.svelte';
  
  const dispatch = createEventDispatcher();
  
  // Estados de filtros específicos para administrativos
  let filtrosCategoria: string[] = [];
  let filtrosEstado: string[] = [];
  let filtrosInspector: string[] = [];
  let filtrosProveedor: string[] = [];
  let filtrosRegion: string[] = [];
  let busqueda = '';
  
  // Regiones del usuario
  let regionesUsuario: any[] = [];
  
  // Listas para filtros
  let inspectores: any[] = [];
  let proveedores: any[] = [];
  
  // Determinar si mostrar el filtro de región
  $: mostrarFiltroRegion = regionesUsuario.length > 1;
  
  // Categorías específicas para administrativos
  const categorias = [
    { value: '', label: 'Todas las categorías' },
    { value: 'pendientesDeWo', label: 'Pendientes de carga WO' },
    { value: 'pendientesDeAprobacion', label: 'Pendientes de mi aprobación' },
    { value: 'tareasGeneradas', label: 'Tareas generadas (con WO)' },
    { value: 'aprobadasPorAdmin', label: 'Aprobadas por mí' },
    { value: 'observados', label: 'Observados' }
  ];
  
  // Estados específicos para administrativos
  const estados = [
    { value: '', label: 'Todos los estados' },
    { value: 'Asignada', label: 'Asignada' },
    { value: 'Pendiente Aprobación Administración', label: 'Pendiente Aprobación Administración' },
    { value: 'Pendiente Certificación Inspector/Supervisor', label: 'Pendiente Certificación Inspector/Supervisor' },
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
    filtrosCategoria = [];
    filtrosEstado = [];
    filtrosInspector = [];
    filtrosProveedor = [];
    filtrosRegion = [];
    busqueda = '';
    emitirFiltros();
  }
  
  // Función para emitir los filtros al componente padre
  function emitirFiltros() {
    dispatch('filtrosCambiados', {
      categorias: filtrosCategoria,
      estados: filtrosEstado,
      inspectores: filtrosInspector,
      proveedores: filtrosProveedor,
      regiones: filtrosRegion,
      busqueda: busqueda
    });
  }
  
  
  // Cargar datos necesarios al montar el componente
  onMount(async () => {
    const token = localStorage.getItem('authToken');
    if (!token) return;
    
    const headers = { 'Authorization': `Bearer ${token}` };
    
    try {
      // Cargar regiones del usuario
      const regionesRes = await fetch('http://localhost:3000/api/user/regions', { headers });
      if (regionesRes.ok) {
        regionesUsuario = (await regionesRes.json()).data;
      }
      
      // Cargar lista de proveedores
      const proveedoresRes = await fetch('http://localhost:3000/api/listas/proveedores', { headers });
      if (proveedoresRes.ok) {
        proveedores = (await proveedoresRes.json()).data || [];
      }
      
      // Cargar lista de todos los inspectores (para administrativos)
      const inspectoresRes = await fetch('http://localhost:3000/api/listas/inspectores', { headers });
      console.log('Respuesta inspectores:', inspectoresRes.status);
      if (inspectoresRes.ok) {
        const inspectoresData = (await inspectoresRes.json()).data || [];
        console.log('Datos inspectores cargados:', inspectoresData);
        inspectores = inspectoresData;
      } else {
        console.error('Error cargando inspectores:', inspectoresRes.status, await inspectoresRes.text());
      }
    } catch (error) {
      console.error('Error cargando datos:', error);
    }
  });
  
  // Emitir filtros cuando cambien
  $: if (filtrosCategoria.length > 0 || filtrosEstado.length > 0 || filtrosInspector.length > 0 || filtrosProveedor.length > 0 || filtrosRegion.length > 0 || busqueda) {
    emitirFiltros();
  }
</script>

<div class="admin-filters-container">
  <div class="filters-header">
    <h3>🔍 Filtros de Administración</h3>
    <p>Filtra las tareas según tus necesidades específicas</p>
  </div>
  
  <div class="filters-grid">
    <!-- Filtro de categoría (específico para administrativos) -->
    <div class="filter-group">
      <MultiSelect
        label="Categorías:"
        id="categorias-filter"
        options={categorias.filter(c => c.value)}
        selectedValues={filtrosCategoria}
        placeholder="Seleccionar categorías..."
        on:change={(e) => {
          filtrosCategoria = e.detail;
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
    
    <!-- Filtro de estado -->
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
    
    <!-- Filtro de inspector/supervisor -->
    <div class="filter-group">
      <MultiSelect
        label="Inspector/Supervisor:"
        id="inspectores-filter"
        options={inspectores.map(i => {
          const option = { 
            value: i.nombre, 
            label: `${i.nombre} (${i.rol === 'inspector' ? 'Inspector' : 'Supervisor'})` 
          };
          console.log('Opción generada:', option);
          return option;
        })}
        selectedValues={filtrosInspector}
        placeholder="Seleccionar inspector/supervisor..."
        on:change={(e) => {
          filtrosInspector = e.detail;
          emitirFiltros();
        }}
      />
    </div>
    
    <!-- Filtro de proveedor -->
    <div class="filter-group">
      <MultiSelect
        label="Proveedores:"
        id="proveedores-filter"
        options={proveedores.map(p => ({ value: p.nombre, label: p.nombre }))}
        selectedValues={filtrosProveedor}
        placeholder="Seleccionar proveedores..."
        on:change={(e) => {
          filtrosProveedor = e.detail;
          emitirFiltros();
        }}
      />
    </div>
    
    <!-- Filtro de región (solo si el usuario tiene múltiples regiones) -->
    {#if mostrarFiltroRegion}
      <div class="filter-group">
        <MultiSelect
          label="Regiones:"
          id="regiones-filter"
          options={regionesUsuario.map(r => ({ value: r.nombre, label: r.nombre }))}
          selectedValues={filtrosRegion}
          placeholder="Seleccionar regiones..."
          on:change={(e) => {
            filtrosRegion = e.detail;
            emitirFiltros();
          }}
        />
      </div>
    {/if}
  </div>
  
  <div class="filters-actions">
    <button class="clear-filters-btn" on:click={limpiarFiltros}>
      🗑️ Limpiar Filtros
    </button>
  </div>
</div>

<style>
  .admin-filters-container {
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
  
  .search-input {
    padding: 0.5rem;
    border: 1px solid #ced4da;
    border-radius: 4px;
    font-size: 0.9rem;
    background: white;
    min-width: 200px;
  }
  
  
  .filters-actions {
    display: flex;
    justify-content: flex-end;
  }
  
  .clear-filters-btn {
    padding: 0.5rem 1rem;
    background: #6c757d;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.9rem;
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
  }
</style>
