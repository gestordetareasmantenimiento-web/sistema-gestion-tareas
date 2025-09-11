<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import MultiSelect from './MultiSelect.svelte';
  
  const dispatch = createEventDispatcher();
  
  // Estados de filtros
  let filtrosCategoria = '';
  let filtrosEstado: string[] = [];
  let filtrosInspector: string[] = [];
  let filtrosProveedor: string[] = [];
  let filtrosRegion: string[] = [];
  let busqueda = '';
  let mostrarPasadasAPago = false; // Filtro especial para tareas pasadas a pago
  
  // Listas para los filtros
  let regionesUsuario: any[] = [];
  let inspectores: any[] = [];
  let proveedores: any[] = [];
  
  // Categorías específicas para CERCO
  const categorias = [
    { value: 'pendientesDeRevisionFinal', label: 'Pendientes de Revisión Final' },
    { value: 'observados', label: 'Observados' },
    { value: 'pasadasAPago', label: 'Pasadas a Pago' }
  ];
  
  // Estados específicos para CERCO
  const estados = [
    { value: 'Pendiente Aprobación CERCO', label: 'Pendiente Aprobación CERCO' },
    { value: 'Observada por CERCO', label: 'Observada por CERCO' },
    { value: 'Finalizada - Aprobada', label: 'Finalizada - Aprobada' }
  ];
  
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
  
  // Emitir filtros cuando cambien
  function emitirFiltros() {
    dispatch('filtrosCambiados', {
      categorias: filtrosCategoria ? [filtrosCategoria] : [],
      estados: filtrosEstado,
      inspectores: filtrosInspector,
      proveedores: filtrosProveedor,
      regiones: filtrosRegion,
      busqueda,
      mostrarPasadasAPago
    });
  }
  
  // Limpiar todos los filtros
  function limpiarFiltros() {
    filtrosCategoria = '';
    filtrosEstado = [];
    filtrosInspector = [];
    filtrosProveedor = [];
    filtrosRegion = [];
    busqueda = '';
    mostrarPasadasAPago = false;
    emitirFiltros();
  }
  
  // Cargar datos iniciales
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
      if (inspectoresRes.ok) {
        const inspectoresData = (await inspectoresRes.json()).data || [];
        inspectores = inspectoresData;
      }
    } catch (error) {
      console.error('Error cargando datos:', error);
    }
  });
  
  // Emitir filtros cuando cambien
  $: if (filtrosCategoria || filtrosEstado.length > 0 || filtrosInspector.length > 0 || filtrosProveedor.length > 0 || filtrosRegion.length > 0 || busqueda || mostrarPasadasAPago !== undefined) {
    emitirFiltros();
  }
</script>

<div class="cerco-filters-container">
  <div class="filters-header">
    <h3>Filtros de CERCO</h3>
    <p>Filtra las tareas según tus necesidades específicas</p>
  </div>
  
  <div class="filters-grid">
    <!-- Filtro de categorías -->
    <div class="filter-group">
      <MultiSelect
        label="Categorías:"
        id="categorias-filter"
        options={categorias.filter(c => c.value)}
        selectedValues={filtrosCategoria ? [filtrosCategoria] : []}
        placeholder="Seleccionar categorías..."
        on:change={(e) => {
          filtrosCategoria = e.detail.length > 0 ? e.detail[0] : '';
          emitirFiltros();
        }}
      />
    </div>
    
    <!-- Filtro de búsqueda -->
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
    
    <!-- Filtro de estados -->
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
        options={inspectores.map(i => ({ 
          value: i.nombre, 
          label: `${i.nombre} (${i.rol === 'inspector' ? 'Inspector' : 'Supervisor'})` 
        }))}
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
    
    <!-- Filtro de región (siempre visible para CERCO) -->
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
    
    <!-- Filtro especial para tareas pasadas a pago -->
    <div class="filter-group special-filter">
      <label class="checkbox-label">
        <input
          type="checkbox"
          bind:checked={mostrarPasadasAPago}
          class="checkbox-input"
        />
        <span class="checkbox-text">📊 Mostrar tareas pasadas a pago</span>
      </label>
    </div>
  </div>
  
  <div class="filters-actions">
    <button class="clear-filters-btn" on:click={limpiarFiltros}>
      🗑️ Limpiar Filtros
    </button>
  </div>
</div>

<style>
  .cerco-filters-container {
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
    gap: 0.5rem;
  }
  
  .filter-group label {
    font-weight: 500;
    color: #495057;
    font-size: 0.9rem;
  }
  
  .search-input {
    padding: 0.5rem;
    border: 1px solid #ced4da;
    border-radius: 4px;
    font-size: 0.9rem;
    transition: border-color 0.2s;
  }
  
  .search-input:focus {
    outline: none;
    border-color: #667eea;
    box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.2);
  }
  
  .special-filter {
    grid-column: 1 / -1;
    padding: 1rem;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 8px;
    color: white;
  }
  
  .checkbox-label {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    cursor: pointer;
    font-weight: 500;
  }
  
  .checkbox-input {
    width: 18px;
    height: 18px;
    accent-color: white;
  }
  
  .checkbox-text {
    color: white;
    font-size: 1rem;
  }
  
  .filters-actions {
    display: flex;
    justify-content: flex-end;
    gap: 1rem;
  }
  
  .clear-filters-btn {
    background-color: #6c757d;
    color: white;
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.9rem;
    transition: background-color 0.2s;
  }
  
  .clear-filters-btn:hover {
    background-color: #5a6268;
  }
</style>
