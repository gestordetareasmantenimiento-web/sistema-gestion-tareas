<script lang="ts">
  import { onMount, onDestroy, createEventDispatcher } from 'svelte';
  import { invalidateAll } from '$app/navigation';
  import { user } from '$lib/stores/auth';

  const dispatch = createEventDispatcher();

  let proveedores: any[] = [];
  let proveedoresFavoritos: any[] = [];
  let inspectoresSubordinados: any[] = [];
  let regionesUsuario: any[] = [];
  
  let direccion = '', id_region = '', descripcion = '', id_proveedor = '', id_inspector_asignado = '';
  let archivos: FileList | null = null;
  let archivosLista: { name: string; type: string; size: number }[] = [];
  
  // Estados para el sistema de favoritos
  let mostrarFavoritos = true;
  let busquedaProveedor = '';
  let proveedoresFiltrados: any[] = [];

  onMount(async () => {
    const token = localStorage.getItem('authToken');
    if (!token) return;
    const headers = { 'Authorization': `Bearer ${token}` };

    // Cargar proveedores con favoritos
    await cargarProveedores(headers);
    
    // Cargar regiones del usuario
    console.log('🔄 Cargando regiones del usuario...');
    const regionesRes = await fetch('http://localhost:3000/api/user/regions', { headers });
    console.log('📡 Response status:', regionesRes.status);
    
    if (regionesRes.ok) {
      const regionesData = await regionesRes.json();
      console.log('📋 Datos de regiones recibidos:', regionesData);
      regionesUsuario = regionesData.data || [];
      console.log('🏢 Regiones del usuario:', regionesUsuario);
      
      // Si el usuario tiene solo una región, seleccionarla automáticamente
      if (regionesUsuario.length === 1) {
        id_region = regionesUsuario[0].id;
        console.log('✅ Región única seleccionada:', id_region);
      }
    } else {
      console.error('❌ Error cargando regiones:', regionesRes.status, regionesRes.statusText);
      const errorData = await regionesRes.json().catch(() => ({}));
      console.error('❌ Error details:', errorData);
    }
    
    // Cargar inspectores subordinados si es supervisor
    if ($user?.rol && $user.rol.toLowerCase() === 'supervisor') {
      const inspRes = await fetch('http://localhost:3000/api/listas/inspectores-subordinados', { headers });
      if (inspRes.ok) inspectoresSubordinados = (await inspRes.json()).data;
    }
  });

  async function cargarProveedores(headers: any) {
    try {
      // Cargar proveedores favoritos
      const favoritosRes = await fetch('http://localhost:3000/api/favoritos/proveedores', { headers });
      if (favoritosRes.ok) {
        proveedoresFavoritos = await favoritosRes.json();
      }

      // Cargar todos los proveedores con estado de favorito
      const todosRes = await fetch('http://localhost:3000/api/favoritos/proveedores/todos', { headers });
      if (todosRes.ok) {
        proveedores = await todosRes.json();
        actualizarProveedoresFiltrados();
      }
    } catch (error) {
      console.error('Error cargando proveedores:', error);
    }
  }

  function actualizarProveedoresFiltrados() {
    const lista = mostrarFavoritos ? proveedoresFavoritos : proveedores;
    if (busquedaProveedor.trim()) {
      proveedoresFiltrados = lista.filter(p => 
        (p.nombre || p.razon_social).toLowerCase().includes(busquedaProveedor.toLowerCase())
      );
    } else {
      proveedoresFiltrados = lista;
    }
  }

  function toggleFavoritos() {
    mostrarFavoritos = !mostrarFavoritos;
    actualizarProveedoresFiltrados();
  }

  async function toggleFavoritoProveedor(proveedor: any) {
    const token = localStorage.getItem('authToken');
    if (!token) return;
    
    const headers = { 
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    try {
      if (proveedor.es_favorito) {
        // Remover de favoritos
        await fetch(`http://localhost:3000/api/favoritos/proveedores/${proveedor.id}`, {
          method: 'DELETE',
          headers
        });
      } else {
        // Agregar a favoritos
        await fetch(`http://localhost:3000/api/favoritos/proveedores/${proveedor.id}`, {
          method: 'POST',
          headers
        });
      }
      
      // Recargar proveedores
      await cargarProveedores({ 'Authorization': `Bearer ${token}` });
    } catch (error) {
      console.error('Error actualizando favorito:', error);
    }
  }

  // Manejo de archivos
  function handleFileChange(event: Event) {
    const target = event.target as HTMLInputElement;
    if (target.files) {
      // Acumular archivos en lugar de reemplazar
      const newFiles = Array.from(target.files);
      const existingFiles = archivos ? Array.from(archivos) : [];
      const allFiles = [...existingFiles, ...newFiles];
      
      // Crear nuevo FileList
      const dt = new DataTransfer();
      allFiles.forEach(file => dt.items.add(file));
      archivos = dt.files;
      
      // Actualizar lista de archivos
      archivosLista = Array.from(archivos).map(file => ({
        name: file.name,
        type: getFileType(file.name),
        size: file.size
      }));
    }
  }
  
  function getFileType(fileName: string): string {
    if (/\.(jpe?g|png|gif|webp|svg)$/i.test(fileName)) return 'Foto';
    if (/\.pdf$/i.test(fileName)) return 'PDF';
    if (/\.(xlsx?|csv)$/i.test(fileName)) return 'Excel';
    if (/\.docx?$/i.test(fileName)) return 'Documento';
    return 'Archivo';
  }
  
  function removeFile(index: number) {
    if (archivos) {
      const dt = new DataTransfer();
      Array.from(archivos).forEach((file, i) => {
        if (i !== index) dt.items.add(file);
      });
      archivos = dt.files;
      archivosLista = archivosLista.filter((_, i) => i !== index);
    }
  }

  async function handleSubmit() {
    const token = localStorage.getItem('authToken');
    const formData = new FormData();

    formData.append('direccion', direccion);
    formData.append('id_region', id_region);
    formData.append('descripcion', descripcion);
    formData.append('id_proveedor', id_proveedor);
    
    // ¡CORREGIDO AQUÍ!
    const inspectorFinalId = ($user?.rol && $user.rol.toLowerCase() === 'supervisor') ? id_inspector_asignado : String($user?.id);
    formData.append('id_inspector', inspectorFinalId);

    if (archivos) {
      for (let i = 0; i < archivos.length; i++) {
        formData.append('archivos', archivos[i]);
      }
    }
    
    const response = await fetch('http://localhost:3000/api/tareas', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
    });

    if (response.ok) {
      alert('¡Tarea creada exitosamente!');
      invalidateAll();
      dispatch('taskCreated');
    } else {
      // ¡MEJORA! Mostramos el error específico del backend si existe
      const errorData = await response.json();
      alert(`Error al crear la tarea: ${errorData.message || 'Error desconocido'}`);
    }
  }
</script>

<div class="create-task-container">
  <h2>Crear Nueva Tarea</h2>
  
  <form on:submit|preventDefault={handleSubmit} class="create-task-form">
    <!-- Columna Izquierda -->
    <div class="form-column">
      <div class="form-group">
        <label for="direccion">Dirección</label>
        <input type="text" id="direccion" bind:value={direccion} required>
      </div>

      <div class="form-group">
        <label for="region">Región</label>
        {#if regionesUsuario.length === 1}
          <!-- Mostrar región única como texto -->
          <div class="single-region-display">
            <span class="region-name">{regionesUsuario[0].nombre}</span>
            <input type="hidden" bind:value={id_region} />
          </div>
        {:else if regionesUsuario.length > 1}
          <!-- Mostrar selector para múltiples regiones -->
          <select id="region" bind:value={id_region} required>
              <option value="" disabled>Seleccione una región</option>
              {#each regionesUsuario as r}
                <option value={r.id}>{r.nombre}</option>
              {/each}
          </select>
        {:else}
          <!-- No hay regiones asignadas -->
          <p class="no-regions-warning">⚠️ No hay regiones asignadas a este usuario</p>
        {/if}
      </div>

      <div class="form-group">
        <label for="descripcion">Descripción de la Tarea</label>
        <textarea id="descripcion" rows="4" bind:value={descripcion} required></textarea>
      </div>
    </div>

    <!-- Columna Derecha -->
    <div class="form-column">
      <div class="form-group">
        <label for="proveedor">Proveedor Asignado</label>
        
        <!-- Sistema de favoritos -->
        <div class="proveedor-selector">
          <!-- Indicador de proveedor seleccionado -->
          {#if id_proveedor}
            {@const proveedorSeleccionado = [...proveedoresFavoritos, ...proveedores].find(p => p.id == id_proveedor)}
            {#if proveedorSeleccionado}
              <div class="proveedor-seleccionado">
                <span class="seleccionado-label">Proveedor seleccionado:</span>
                <span class="seleccionado-nombre">{proveedorSeleccionado.nombre || proveedorSeleccionado.razon_social}</span>
                <button type="button" class="limpiar-seleccion" on:click={() => id_proveedor = ''}>×</button>
              </div>
            {/if}
          {/if}
          
          <div class="proveedor-tabs">
            <button 
              type="button" 
              class="tab-button {mostrarFavoritos ? 'active' : ''}"
              on:click={() => { mostrarFavoritos = true; actualizarProveedoresFiltrados(); }}
            >
              ⭐ Favoritos ({proveedoresFavoritos.length})
            </button>
            <button 
              type="button" 
              class="tab-button {!mostrarFavoritos ? 'active' : ''}"
              on:click={() => { mostrarFavoritos = false; actualizarProveedoresFiltrados(); }}
            >
              📋 Todos ({proveedores.length})
            </button>
          </div>
          
          <div class="proveedor-search">
            <input 
              type="text" 
              placeholder="Buscar proveedor..."
              bind:value={busquedaProveedor}
              on:input={actualizarProveedoresFiltrados}
            />
          </div>
          
          <div class="proveedor-list">
            {#each proveedoresFiltrados as p}
              <div class="proveedor-item {id_proveedor == p.id ? 'selected' : ''}" on:click={() => id_proveedor = p.id}>
                <div class="proveedor-info">
                  <span class="proveedor-nombre">{p.nombre || p.razon_social}</span>
                </div>
                {#if !mostrarFavoritos}
                  <!-- Solo mostrar estrella en la pestaña "Todos" -->
                  <button 
                    type="button" 
                    class="favorito-btn {p.es_favorito ? 'favorito' : ''}"
                    on:click|stopPropagation={() => toggleFavoritoProveedor(p)}
                  >
                    {p.es_favorito ? '⭐' : '☆'}
                  </button>
                {/if}
              </div>
            {/each}
          </div>
        </div>
      </div>

      {#if $user?.rol && $user.rol.toLowerCase() === 'supervisor'}
        <div class="form-group">
          <label for="inspector">Inspector a Cargo</label>
          <select id="inspector" bind:value={id_inspector_asignado} required>
            <option value="" disabled>Seleccione un inspector</option>
            {#each inspectoresSubordinados as i}
              <option value={i.id}>{i.nombre_completo}</option>
            {/each}
          </select>
        </div>
      {/if}

      <div class="form-group">
        <label for="archivos">Adjuntar Documentación (opcional)</label>
        <div class="file-upload">
          <input 
            type="file" 
            id="archivos"
            multiple
            accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
            on:change={handleFileChange}
          />
          <label for="archivos" class="file-upload-label">
            <span class="upload-icon">📁</span>
            <span>Seleccionar archivos</span>
          </label>
        </div>
        
        {#if archivosLista.length > 0}
          <div class="files-list">
            <h4>Archivos seleccionados:</h4>
            {#each archivosLista as file, index}
              <div class="file-item">
                <div class="file-icon">
                  {#if file.type === 'Foto'}
                    🖼️
                  {:else if file.type === 'PDF'}
                    📄
                  {:else if file.type === 'Excel'}
                    📊
                  {:else if file.type === 'Documento'}
                    📝
                  {:else}
                    📎
                  {/if}
                </div>
                <div class="file-info">
                  <div class="file-name">{file.name}</div>
                  <div class="file-type">{file.type}</div>
                </div>
                <button class="remove-file" on:click={() => removeFile(index)}>×</button>
              </div>
            {/each}
          </div>
        {/if}
      </div>
    </div>

    <!-- Botón de envío -->
    <div class="form-actions">
      <button type="submit">Crear Tarea</button>
    </div>
  </form>
</div>

<style>
  :global(*) {
    box-sizing: border-box;
  }
  
  .create-task-container {
    width: 100%;
    max-width: 100%;
    margin: 0 auto;
    padding: 0;
    box-sizing: border-box;
  }

  .create-task-form {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
    width: 100%;
    box-sizing: border-box;
  }

  .form-column {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    box-sizing: border-box;
  }

  .form-group {
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
  }

  label { 
    margin-bottom: 0.5rem; 
    font-weight: 600;
    color: #495057;
  }

  input, select, textarea { 
    width: 100%; 
    padding: 0.65rem; 
    font-size: 0.95rem; 
    box-sizing: border-box;
    border: 1px solid #ced4da;
    border-radius: 6px;
    transition: border-color 0.3s ease;
  }

  input:focus, select:focus, textarea:focus {
    outline: none;
    border-color: #007bff;
    box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
  }

  textarea {
    resize: vertical;
    min-height: 100px;
  }

  .no-regions-warning {
    margin-top: 0.5rem;
    padding: 0.75rem;
    background-color: #fff3cd;
    border: 1px solid #ffeaa7;
    border-radius: 6px;
    color: #856404;
    font-size: 0.9rem;
    margin: 0;
  }
  
  .single-region-display {
    padding: 0.75rem;
    background-color: #e9ecef;
    border: 1px solid #ced4da;
    border-radius: 6px;
    display: flex;
    align-items: center;
  }
  
  .region-name {
    font-weight: 600;
    color: #495057;
    font-size: 1rem;
  }

  /* Sistema de favoritos */
  .proveedor-selector {
    border: 1px solid #ced4da;
    border-radius: 8px;
    overflow: hidden;
  }

  .proveedor-seleccionado {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem;
    background-color: #e8f5e8;
    border-bottom: 1px solid #dee2e6;
    font-size: 0.9rem;
  }

  .seleccionado-label {
    font-weight: 600;
    color: #495057;
  }

  .seleccionado-nombre {
    flex: 1;
    color: #28a745;
    font-weight: 500;
  }

  .limpiar-seleccion {
    background: #dc3545;
    color: white;
    border: none;
    border-radius: 50%;
    width: 20px;
    height: 20px;
    cursor: pointer;
    font-size: 0.8rem;
    line-height: 1;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .limpiar-seleccion:hover {
    background: #c82333;
  }

  .proveedor-tabs {
    display: flex;
    background-color: #f8f9fa;
    border-bottom: 1px solid #dee2e6;
  }

  .tab-button {
    flex: 1;
    padding: 0.5rem 0.75rem;
    border: none;
    background: transparent;
    cursor: pointer;
    font-size: 0.85rem;
    transition: all 0.3s ease;
    border-bottom: 2px solid transparent;
  }

  .tab-button.active {
    background-color: #007bff;
    color: white;
    border-bottom-color: #007bff;
  }

  .tab-button:hover:not(.active) {
    background-color: #e9ecef;
  }

  .proveedor-search {
    padding: 0.75rem;
    border-bottom: 1px solid #dee2e6;
  }

  .proveedor-search input {
    width: 100%;
    padding: 0.5rem;
    border: 1px solid #ced4da;
    border-radius: 4px;
    font-size: 0.9rem;
  }

  .proveedor-list {
    max-height: 200px;
    overflow-y: auto;
  }

  .proveedor-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.5rem 0.75rem;
    cursor: pointer;
    transition: background-color 0.3s ease;
    border-bottom: 1px solid #f8f9fa;
  }

  .proveedor-item:hover {
    background-color: #f8f9fa;
  }

  .proveedor-item.selected {
    background-color: #e3f2fd;
    border-left: 3px solid #007bff;
  }

  .proveedor-item:last-child {
    border-bottom: none;
  }

  .proveedor-info {
    flex: 1;
  }

  .proveedor-nombre {
    font-weight: 500;
    color: #495057;
  }

  .favorito-btn {
    background: none;
    border: none;
    font-size: 1.2rem;
    cursor: pointer;
    padding: 0.25rem;
    border-radius: 4px;
    transition: all 0.3s ease;
  }

  .favorito-btn:hover {
    background-color: #e9ecef;
  }

  .favorito-btn.favorito {
    color: #ffc107;
  }

  /* Manejo de archivos */
  .file-upload {
    position: relative;
    margin-bottom: 1rem;
  }
  
  .file-upload input[type="file"] {
    position: absolute;
    opacity: 0;
    width: 100%;
    height: 100%;
    cursor: pointer;
  }
  
  .file-upload-label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem;
    border: 2px dashed #ced4da;
    border-radius: 8px;
    background: #f8f9fa;
    cursor: pointer;
    transition: all 0.3s ease;
    text-align: center;
    justify-content: center;
  }
  
  .file-upload-label:hover {
    border-color: #007bff;
    background: #e3f2fd;
  }
  
  .upload-icon {
    font-size: 1.5rem;
  }
  
  .files-list {
    margin-top: 1rem;
  }
  
  .files-list h4 {
    margin: 0 0 0.75rem 0;
    color: #495057;
    font-size: 0.9rem;
  }
  
  .file-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem;
    background: #f8f9fa;
    border: 1px solid #dee2e6;
    border-radius: 6px;
    margin-bottom: 0.5rem;
  }
  
  .file-icon {
    font-size: 1.25rem;
    min-width: 1.5rem;
  }
  
  .file-info {
    flex: 1;
    min-width: 0;
  }
  
  .file-name {
    font-weight: 500;
    color: #495057;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    font-size: 0.9rem;
  }
  
  .file-type {
    font-size: 0.8rem;
    color: #6c757d;
  }
  
  .remove-file {
    background: #dc3545;
    color: white;
    border: none;
    border-radius: 50%;
    width: 24px;
    height: 24px;
    cursor: pointer;
    font-size: 1rem;
    line-height: 1;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .remove-file:hover {
    background: #c82333;
  }

  /* Botón de envío */
  .form-actions {
    grid-column: 1 / -1;
    display: flex;
    justify-content: center;
    margin-top: 1rem;
  }

  .form-actions button {
    padding: 1rem 2rem;
    background-color: #007bff;
    color: white;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-size: 1.1rem;
    font-weight: 600;
    transition: all 0.3s ease;
    min-width: 200px;
  }

  .form-actions button:hover {
    background-color: #0056b3;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 123, 255, 0.3);
  }

  /* Responsive */
  @media (max-width: 768px) {
    .create-task-form {
      grid-template-columns: 1fr;
      gap: 1rem;
    }
    
    .create-task-container {
      padding: 0.5rem;
    }
  }
</style>