<script lang="ts">
  import { user } from '$lib/stores/auth';
  import { onMount } from 'svelte';
  export let data;

  // Variables reactivas para filtros
  let searchTerm = '';
  let selectedEstado = '';
  let selectedRegion = '';
  let selectedInspector = '';
  let selectedProveedor = '';
  let fechaInicio = '';
  let fechaFin = '';
  let tareasFiltradas: any[] = [];
  let mostrarFiltros = false;

  // Listas para los selectores
  let estadosUnicos: string[] = [];
  let regionesUnicas: string[] = [];
  let inspectoresUnicos: string[] = [];
  let proveedoresUnicos: string[] = [];

  // Función para volver al dashboard principal
  function goBack() {
    window.location.href = '/superadmin/dashboard';
  }

  // Función para navegar a los detalles de una tarea
  function navigateToTask(taskId: number) {
    // Guardar la página de origen en localStorage para que la tarea sepa a dónde volver
    localStorage.setItem('returnTo', '/superadmin/dashboard/tasks');
    window.location.href = `/task/${taskId}`;
  }

  // Función para aplicar filtros
  function aplicarFiltros() {
    if (!data.tareas) {
      tareasFiltradas = [];
      return;
    }

    tareasFiltradas = data.tareas.filter((tarea: any) => {
      // Filtro por término de búsqueda (ID, descripción, ICD)
      if (searchTerm) {
        const termino = searchTerm.toLowerCase();
        const matchId = tarea.id_tarea_texto?.toLowerCase().includes(termino);
        const matchDescripcion = tarea.descripcion?.toLowerCase().includes(termino);
        const matchIcd = tarea.icd?.toLowerCase().includes(termino);
        
        if (!matchId && !matchDescripcion && !matchIcd) {
          return false;
        }
      }

      // Filtro por estado
      if (selectedEstado && tarea.estado !== selectedEstado) {
        return false;
      }

      // Filtro por región
      if (selectedRegion && tarea.region !== selectedRegion) {
        return false;
      }

      // Filtro por inspector
      if (selectedInspector && tarea.inspector_nombre !== selectedInspector) {
        return false;
      }

      // Filtro por proveedor
      if (selectedProveedor && tarea.proveedor_nombre !== selectedProveedor) {
        return false;
      }

      // Filtro por rango de fechas
      if (fechaInicio || fechaFin) {
        const fechaTarea = new Date(tarea.fecha_creacion);
        
        if (fechaInicio) {
          const fechaInicioDate = new Date(fechaInicio);
          if (fechaTarea < fechaInicioDate) {
            return false;
          }
        }
        
        if (fechaFin) {
          const fechaFinDate = new Date(fechaFin);
          fechaFinDate.setHours(23, 59, 59, 999); // Incluir todo el día
          if (fechaTarea > fechaFinDate) {
            return false;
          }
        }
      }

      return true;
    });
  }

  // Función para limpiar filtros
  function limpiarFiltros() {
    searchTerm = '';
    selectedEstado = '';
    selectedRegion = '';
    selectedInspector = '';
    selectedProveedor = '';
    fechaInicio = '';
    fechaFin = '';
    aplicarFiltros();
  }

  // Función para exportar tareas filtradas
  function exportarTareasFiltradas() {
    if (tareasFiltradas.length === 0) {
      alert('No hay tareas para exportar con los filtros actuales');
      return;
    }

    // Crear datos para Excel
    const datosExcel = tareasFiltradas.map((tarea: any) => ({
      'ID Tarea': tarea.id_tarea_texto,
      'Descripción': tarea.descripcion,
      'ICD': tarea.icd || 'N/A',
      'Estado': tarea.estado,
      'Región': tarea.region,
      'Inspector': tarea.inspector_nombre || 'N/A',
      'Proveedor': tarea.proveedor_nombre || 'N/A',
      'Fecha Creación': new Date(tarea.fecha_creacion).toLocaleDateString(),
      'Fecha Inicio': tarea.fecha_inicio ? new Date(tarea.fecha_inicio).toLocaleDateString() : 'N/A',
      'Fecha Cierre Proveedor': tarea.fecha_cierre_proveedor ? new Date(tarea.fecha_cierre_proveedor).toLocaleDateString() : 'N/A',
      'Fecha Aprobación Final': tarea.fecha_aprobacion_final ? new Date(tarea.fecha_aprobacion_final).toLocaleDateString() : 'N/A',
      'Fecha Fin': tarea.fecha_fin ? new Date(tarea.fecha_fin).toLocaleDateString() : 'N/A'
    }));

    // Crear archivo Excel
    const XLSX = (window as any).XLSX;
    const ws = XLSX.utils.json_to_sheet(datosExcel);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Tareas Filtradas');
    
    // Generar nombre de archivo con fecha y filtros aplicados
    const fecha = new Date().toISOString().split('T')[0];
    const nombreArchivo = `tareas_filtradas_${fecha}.xlsx`;
    
    XLSX.writeFile(wb, nombreArchivo);
  }

  // Función para exportar todas las tareas
  function exportarTodasLasTareas() {
    if (!data.tareas || data.tareas.length === 0) {
      alert('No hay tareas para exportar');
      return;
    }

    // Crear datos para Excel
    const datosExcel = data.tareas.map((tarea: any) => ({
      'ID Tarea': tarea.id_tarea_texto,
      'Descripción': tarea.descripcion,
      'ICD': tarea.icd || 'N/A',
      'Estado': tarea.estado,
      'Región': tarea.region,
      'Inspector': tarea.inspector_nombre || 'N/A',
      'Proveedor': tarea.proveedor_nombre || 'N/A',
      'Fecha Creación': new Date(tarea.fecha_creacion).toLocaleDateString(),
      'Fecha Inicio': tarea.fecha_inicio ? new Date(tarea.fecha_inicio).toLocaleDateString() : 'N/A',
      'Fecha Cierre Proveedor': tarea.fecha_cierre_proveedor ? new Date(tarea.fecha_cierre_proveedor).toLocaleDateString() : 'N/A',
      'Fecha Aprobación Final': tarea.fecha_aprobacion_final ? new Date(tarea.fecha_aprobacion_final).toLocaleDateString() : 'N/A',
      'Fecha Fin': tarea.fecha_fin ? new Date(tarea.fecha_fin).toLocaleDateString() : 'N/A'
    }));

    // Crear archivo Excel
    const XLSX = (window as any).XLSX;
    const ws = XLSX.utils.json_to_sheet(datosExcel);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Todas las Tareas');
    
    // Generar nombre de archivo con fecha
    const fecha = new Date().toISOString().split('T')[0];
    const nombreArchivo = `todas_las_tareas_${fecha}.xlsx`;
    
    XLSX.writeFile(wb, nombreArchivo);
  }

  // Inicializar datos cuando se carga el componente
  onMount(() => {
    if (data.tareas) {
      // Obtener valores únicos para los selectores
      estadosUnicos = [...new Set(data.tareas.map((t: any) => t.estado).filter(Boolean))].sort() as string[];
      regionesUnicas = [...new Set(data.tareas.map((t: any) => t.region).filter(Boolean))].sort() as string[];
      inspectoresUnicos = [...new Set(data.tareas.map((t: any) => t.inspector_nombre).filter(Boolean))].sort() as string[];
      proveedoresUnicos = [...new Set(data.tareas.map((t: any) => t.proveedor_nombre).filter(Boolean))].sort() as string[];
      
      // Aplicar filtros iniciales
      aplicarFiltros();
    }
  });

  // Aplicar filtros cuando cambien las variables
  $: if (data.tareas) {
    aplicarFiltros();
  }

  // Obtener tareas a mostrar (filtradas o todas)
  $: tareasAMostrar = tareasFiltradas.length > 0 || (searchTerm || selectedEstado || selectedRegion || selectedInspector || selectedProveedor || fechaInicio || fechaFin) 
    ? tareasFiltradas 
    : (data.tareas || []);
</script>

<script context="module">
  // Importar XLSX para exportación
  import * as XLSX from 'xlsx';
  
  // Hacer XLSX disponible globalmente
  if (typeof window !== 'undefined') {
    (window as any).XLSX = XLSX;
  }
</script>

<div class="all-tasks-container">
  <div class="header">
    <button class="back-button" on:click={goBack}>← Volver</button>
    <h1>📋 Todas las Tareas</h1>
    <p>Vista completa de todas las tareas del sistema</p>
  </div>

  {#if data.error}
    <div class="error-message">
      <p>{data.error}</p>
    </div>
  {:else}
    <!-- Panel de Filtros -->
    <div class="filters-section">
      <div class="filters-header">
        <h2>🔍 Filtros y Búsqueda</h2>
        <button class="toggle-filters-btn" on:click={() => mostrarFiltros = !mostrarFiltros}>
          {mostrarFiltros ? 'Ocultar Filtros' : 'Mostrar Filtros'}
        </button>
      </div>
      
      {#if mostrarFiltros}
        <div class="filters-panel">
          <div class="filters-grid">
            <!-- Búsqueda general -->
            <div class="filter-group">
              <label for="search">🔍 Buscar (ID, Descripción, WO)</label>
              <input 
                type="text" 
                id="search"
                bind:value={searchTerm}
                placeholder="Buscar por ID, descripción o WO..."
                class="filter-input"
              />
            </div>

            <!-- Filtro por estado -->
            <div class="filter-group">
              <label for="estado">📊 Estado</label>
              <select id="estado" bind:value={selectedEstado} class="filter-select">
                <option value="">Todos los estados</option>
                {#each estadosUnicos as estado}
                  <option value={estado}>{estado}</option>
                {/each}
              </select>
            </div>

            <!-- Filtro por región -->
            <div class="filter-group">
              <label for="region">🌍 Región</label>
              <select id="region" bind:value={selectedRegion} class="filter-select">
                <option value="">Todas las regiones</option>
                {#each regionesUnicas as region}
                  <option value={region}>{region}</option>
                {/each}
              </select>
            </div>

            <!-- Filtro por inspector -->
            <div class="filter-group">
              <label for="inspector">👨‍🔧 Inspector</label>
              <select id="inspector" bind:value={selectedInspector} class="filter-select">
                <option value="">Todos los inspectores</option>
                {#each inspectoresUnicos as inspector}
                  <option value={inspector}>{inspector}</option>
                {/each}
              </select>
            </div>

            <!-- Filtro por proveedor -->
            <div class="filter-group">
              <label for="proveedor">🏢 Proveedor</label>
              <select id="proveedor" bind:value={selectedProveedor} class="filter-select">
                <option value="">Todos los proveedores</option>
                {#each proveedoresUnicos as proveedor}
                  <option value={proveedor}>{proveedor}</option>
                {/each}
              </select>
            </div>

            <!-- Filtro por rango de fechas -->
            <div class="filter-group">
              <label for="fechaInicio">📅 Fecha Inicio</label>
              <input 
                type="date" 
                id="fechaInicio"
                bind:value={fechaInicio}
                class="filter-input"
              />
            </div>

            <div class="filter-group">
              <label for="fechaFin">📅 Fecha Fin</label>
              <input 
                type="date" 
                id="fechaFin"
                bind:value={fechaFin}
                class="filter-input"
              />
            </div>
          </div>

          <div class="filters-actions">
            <button class="action-btn primary" on:click={aplicarFiltros}>
              🔍 Aplicar Filtros
            </button>
            <button class="action-btn secondary" on:click={limpiarFiltros}>
              🗑️ Limpiar Filtros
            </button>
          </div>
        </div>
      {/if}
    </div>

    <!-- Resumen de tareas -->
    <div class="tasks-summary">
      <h2>📊 Resumen de Tareas</h2>
      <div class="summary-grid">
        <div class="summary-card">
          <div class="summary-icon">📋</div>
          <div class="summary-content">
            <h3>Total Tareas</h3>
            <p class="summary-number">{tareasAMostrar.length}</p>
            <small>{data.tareas?.length || 0} en total</small>
          </div>
        </div>
        <div class="summary-card">
          <div class="summary-icon">✅</div>
          <div class="summary-content">
            <h3>Completadas</h3>
            <p class="summary-number">{tareasAMostrar.filter((t: any) => t.estado === 'Finalizada - Aprobada').length}</p>
          </div>
        </div>
        <div class="summary-card">
          <div class="summary-icon">⏳</div>
          <div class="summary-content">
            <h3>En Proceso</h3>
            <p class="summary-number">{tareasAMostrar.filter((t: any) => !['Finalizada - Aprobada', 'Cancelada'].includes(t.estado)).length}</p>
          </div>
        </div>
        <div class="summary-card">
          <div class="summary-icon">❌</div>
          <div class="summary-content">
            <h3>Canceladas</h3>
            <p class="summary-number">{tareasAMostrar.filter((t: any) => t.estado === 'Cancelada').length}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Acciones -->
    <div class="actions-section">
      <h2>⚡ Acciones</h2>
      <div class="actions-grid">
        <button class="action-btn primary" on:click={exportarTareasFiltradas}>
          📊 Exportar Filtradas ({tareasAMostrar.length})
        </button>
        <button class="action-btn secondary" on:click={exportarTodasLasTareas}>
          📋 Exportar Todas ({data.tareas?.length || 0})
        </button>
        <button class="action-btn tertiary" on:click={() => window.location.reload()}>
          🔄 Actualizar
        </button>
      </div>
    </div>

    <!-- Lista de tareas -->
    {#if tareasAMostrar && tareasAMostrar.length > 0}
      <div class="tasks-section">
        <h2>📋 Lista de Tareas {tareasFiltradas.length > 0 ? '(Filtradas)' : ''}</h2>
        <div class="tasks-table-container">
          <table class="tasks-table">
            <thead>
              <tr>
                <th>ID Tarea</th>
                <th>Descripción</th>
                <th>ICD</th>
                <th>Estado</th>
                <th>Región</th>
                <th>Inspector</th>
                <th>Proveedor</th>
                <th>Fecha Creación</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {#each tareasAMostrar as tarea (tarea.id)}
                <tr>
                  <td>{tarea.id_tarea_texto}</td>
                  <td class="description-cell">{tarea.descripcion}</td>
                  <td>{tarea.icd || 'N/A'}</td>
                  <td>
                    <span class="status-badge {tarea.estado.toLowerCase().replace(/\s+/g, '-')}">
                      {tarea.estado}
                    </span>
                  </td>
                  <td>{tarea.region}</td>
                  <td>{tarea.inspector_nombre || 'N/A'}</td>
                  <td>{tarea.proveedor_nombre || 'N/A'}</td>
                  <td>{new Date(tarea.fecha_creacion).toLocaleDateString()}</td>
                  <td>
                    <button class="action-btn small" on:click={() => navigateToTask(tarea.id)}>
                      Ver Detalles
                    </button>
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      </div>
    {:else}
      <div class="no-tasks">
        <h2>📋 Lista de Tareas</h2>
        {#if tareasFiltradas.length === 0 && (searchTerm || selectedEstado || selectedRegion || selectedInspector || selectedProveedor || fechaInicio || fechaFin)}
          <p>No se encontraron tareas con los filtros aplicados.</p>
          <button class="action-btn primary" on:click={limpiarFiltros}>
            🗑️ Limpiar Filtros
          </button>
        {:else}
          <p>No hay tareas en el sistema.</p>
        {/if}
      </div>
    {/if}
  {/if}
</div>

<style>
  .all-tasks-container {
    max-width: 1400px;
    margin: 0 auto;
    padding: 1rem;
  }

  .header {
    text-align: center;
    margin-bottom: 2rem;
    padding: 2rem;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border-radius: 12px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    position: relative;
  }

  .back-button {
    position: absolute;
    left: 2rem;
    top: 50%;
    transform: translateY(-50%);
    background: rgba(255, 255, 255, 0.2);
    border: 1px solid rgba(255, 255, 255, 0.3);
    color: white;
    padding: 0.5rem 1rem;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.3s ease;
  }

  .back-button:hover {
    background: rgba(255, 255, 255, 0.3);
  }

  .header h1 {
    margin: 0 0 0.5rem 0;
    font-size: 2.5rem;
    font-weight: 700;
  }

  .header p {
    margin: 0;
    font-size: 1.1rem;
    opacity: 0.9;
  }

  .filters-section, .tasks-summary, .actions-section, .tasks-section, .no-tasks {
    margin-bottom: 2rem;
  }

  .filters-section h2, .tasks-summary h2, .actions-section h2, .tasks-section h2, .no-tasks h2 {
    color: #333;
    margin-bottom: 1rem;
    font-size: 1.5rem;
    font-weight: 600;
  }

  .filters-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }

  .toggle-filters-btn {
    background: #667eea;
    color: white;
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 600;
    transition: all 0.3s ease;
  }

  .toggle-filters-btn:hover {
    background: #5a6fd8;
    transform: translateY(-2px);
  }

  .filters-panel {
    background: white;
    border-radius: 12px;
    padding: 1.5rem;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    border: 1px solid #e1e5e9;
  }

  .filters-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1.5rem;
    margin-bottom: 1.5rem;
  }

  .filter-group {
    display: flex;
    flex-direction: column;
  }

  .filter-group label {
    font-weight: 600;
    color: #333;
    margin-bottom: 0.5rem;
    font-size: 0.9rem;
  }

  .filter-input, .filter-select {
    padding: 0.75rem;
    border: 1px solid #ddd;
    border-radius: 8px;
    font-size: 1rem;
    transition: all 0.3s ease;
    background: white;
  }

  .filter-input:focus, .filter-select:focus {
    outline: none;
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  }

  .filters-actions {
    display: flex;
    gap: 1rem;
    justify-content: center;
    padding-top: 1rem;
    border-top: 1px solid #e1e5e9;
  }

  .summary-grid, .actions-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1.5rem;
  }

  .summary-card {
    background: white;
    border-radius: 12px;
    padding: 1.5rem;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .summary-icon {
    font-size: 2.5rem;
    opacity: 0.8;
  }

  .summary-content h3 {
    margin: 0 0 0.5rem 0;
    color: #333;
    font-size: 1rem;
    font-weight: 600;
  }

  .summary-number {
    margin: 0;
    color: #667eea;
    font-size: 2rem;
    font-weight: 700;
  }

  .tasks-table-container {
    background: white;
    border-radius: 12px;
    padding: 1.5rem;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    overflow-x: auto;
  }

  .tasks-table {
    width: 100%;
    border-collapse: collapse;
  }

  .tasks-table th,
  .tasks-table td {
    padding: 1rem;
    text-align: left;
    border-bottom: 1px solid #e1e5e9;
  }

  .tasks-table th {
    background: #f8f9fa;
    font-weight: 600;
    color: #333;
  }

  .description-cell {
    max-width: 300px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .status-badge {
    padding: 0.25rem 0.75rem;
    border-radius: 20px;
    font-size: 0.8rem;
    font-weight: 600;
    text-transform: capitalize;
  }

  .status-badge.asignada {
    background: #e3f2fd;
    color: #1976d2;
  }

  .status-badge.pendiente-certificación-inspector {
    background: #fff3e0;
    color: #f57c00;
  }

  .status-badge.pendiente-aprobación-supervisor {
    background: #f3e5f5;
    color: #7b1fa2;
  }

  .status-badge.pendiente-aprobación-administración {
    background: #e8f5e8;
    color: #388e3c;
  }

  .status-badge.pendiente-aprobación-gerente {
    background: #fff8e1;
    color: #f9a825;
  }

  .status-badge.pendiente-aprobación-cerco {
    background: #fce4ec;
    color: #c2185b;
  }

  .status-badge.finalizada---aprobada {
    background: #e8f5e8;
    color: #2e7d32;
  }

  .status-badge.cancelada {
    background: #ffebee;
    color: #d32f2f;
  }

  .action-btn {
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    text-decoration: none;
    display: inline-block;
    text-align: center;
  }

  .action-btn.primary {
    background: #667eea;
    color: white;
  }

  .action-btn.primary:hover {
    background: #5a6fd8;
    transform: translateY(-2px);
  }

  .action-btn.secondary {
    background: #6c757d;
    color: white;
  }

  .action-btn.secondary:hover {
    background: #5a6268;
    transform: translateY(-2px);
  }

  .action-btn.tertiary {
    background: #28a745;
    color: white;
  }

  .action-btn.tertiary:hover {
    background: #218838;
    transform: translateY(-2px);
  }

  .action-btn.small {
    padding: 0.5rem 1rem;
    font-size: 0.9rem;
  }

  .no-tasks {
    text-align: center;
    background: white;
    border-radius: 12px;
    padding: 2rem;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  .no-tasks p {
    color: #666;
    font-size: 1.1rem;
    margin: 0;
  }

  .error-message {
    background: #fee;
    border: 1px solid #fcc;
    color: #c33;
    padding: 1rem;
    border-radius: 8px;
    text-align: center;
    margin: 2rem 0;
  }

  @media (max-width: 768px) {
    .all-tasks-container {
      padding: 0.5rem;
    }

    .header {
      padding: 1.5rem;
    }

    .back-button {
      position: static;
      transform: none;
      margin-bottom: 1rem;
    }

    .header h1 {
      font-size: 2rem;
    }

    .filters-header {
      flex-direction: column;
      gap: 1rem;
      align-items: stretch;
    }

    .filters-grid {
      grid-template-columns: 1fr;
      gap: 1rem;
    }

    .filters-actions {
      flex-direction: column;
    }

    .summary-grid, .actions-grid {
      grid-template-columns: 1fr;
    }

    .tasks-table-container {
      padding: 1rem;
      overflow-x: auto;
    }

    .tasks-table th,
    .tasks-table td {
      padding: 0.5rem;
      font-size: 0.9rem;
    }

    .tasks-table {
      min-width: 800px;
    }
  }
</style>
