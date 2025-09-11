<script lang="ts">
  import { onMount, onDestroy, createEventDispatcher } from 'svelte';
  import { invalidateAll } from '$app/navigation';
  import { user } from '$lib/stores/auth';

  const dispatch = createEventDispatcher();

  let proveedores: any[] = [];
  let inspectoresSubordinados: any[] = [];
  let regionesUsuario: any[] = [];
  
  let direccion = '', id_region = '', descripcion = '', id_proveedor = '', id_inspector_asignado = '';
  let archivos: FileList | null = null;
  let archivosPreview: { name: string; type: string; size: number; previewUrl?: string }[] = [];

  onMount(async () => {
    const token = localStorage.getItem('authToken');
    if (!token) return;
    const headers = { 'Authorization': `Bearer ${token}` };

    // Cargar proveedores
    const provRes = await fetch('http://localhost:3000/api/listas/proveedores', { headers });
    if (provRes.ok) proveedores = (await provRes.json()).data;
    
    // Cargar regiones del usuario
    const regionesRes = await fetch('http://localhost:3000/api/user/regions', { headers });
    if (regionesRes.ok) {
      regionesUsuario = (await regionesRes.json()).data;
      
      // Si el usuario tiene solo una región, seleccionarla automáticamente
      if (regionesUsuario.length === 1) {
        id_region = regionesUsuario[0].id;
      }
    }
    
    // Cargar inspectores subordinados si es supervisor
    if ($user?.rol && $user.rol.toLowerCase() === 'supervisor') {
      const inspRes = await fetch('http://localhost:3000/api/listas/inspectores-subordinados', { headers });
      if (inspRes.ok) inspectoresSubordinados = (await inspRes.json()).data;
    }
  });

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
      
      // Actualizar preview
      archivosPreview = Array.from(archivos).map(file => ({
        name: file.name,
        type: getFileType(file.name),
        size: file.size,
        previewUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined
      }));
    }
  }
  
  function getFileType(fileName: string): string {
    if (/\.(jpe?g|png|gif|webp|svg)$/i.test(fileName)) return 'image';
    if (/\.pdf$/i.test(fileName)) return 'pdf';
    if (/\.(xlsx?|csv)$/i.test(fileName)) return 'excel';
    if (/\.docx?$/i.test(fileName)) return 'word';
    return 'other';
  }
  
  function removeFile(index: number) {
    if (archivos) {
      const dt = new DataTransfer();
      Array.from(archivos).forEach((file, i) => {
        if (i !== index) dt.items.add(file);
      });
      archivos = dt.files;
      archivosPreview = archivosPreview.filter((_, i) => i !== index);
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
  
  // Limpiar URLs de objeto al destruir el componente
  onDestroy(() => {
    archivosPreview.forEach(file => {
      if (file.previewUrl) {
        URL.revokeObjectURL(file.previewUrl);
      }
    });
  });
</script>

<h2>Crear Nueva Tarea</h2>
<form on:submit|preventDefault={handleSubmit} class="create-task-form">
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

  <div class="form-group full-width">
    <label for="descripcion">Descripción de la Tarea</label>
    <textarea id="descripcion" rows="4" bind:value={descripcion} required></textarea>
  </div>

  <div class="form-group">
    <label for="proveedor">Proveedor Asignado</label>
    <select id="proveedor" bind:value={id_proveedor} required>
      <option value="" disabled>Seleccione un proveedor</option>
      {#each proveedores as p}
        <option value={p.id}>{p.nombre || p.razon_social}</option>
      {/each}
    </select>
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

  <div class="form-group full-width">
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
    
    {#if archivosPreview.length > 0}
      <div class="files-preview">
        <h4>Archivos seleccionados:</h4>
        {#each archivosPreview as file, index}
          <div class="file-item">
            <div class="file-icon">
              {#if file.type === 'image'}
                🖼️
              {:else if file.type === 'pdf'}
                📄
              {:else if file.type === 'excel'}
                📊
              {:else if file.type === 'word'}
                📝
              {:else}
                📎
              {/if}
            </div>
            <div class="file-info">
              <div class="file-name">{file.name}</div>
              <div class="file-size">{(file.size / 1024 / 1024).toFixed(2)} MB</div>
            </div>
            {#if file.type === 'image' && file.previewUrl}
              <div class="file-preview">
                <img src={file.previewUrl} alt={file.name} class="preview-thumbnail" />
              </div>
            {/if}
            <button class="remove-file" on:click={() => removeFile(index)}>×</button>
          </div>
        {/each}
      </div>
    {/if}
  </div>

  <button type="submit">Crear Tarea</button>
</form>

<style>
  .create-task-form {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1.5rem;
    width: 100%;
    max-width: 900px;
    margin: 0 auto;
  }
  .form-group {
    display: flex;
    flex-direction: column;
  }
  .form-group.full-width {
    grid-column: 1 / -1;
  }
  label { margin-bottom: 0.5rem; }
  input, select, textarea { width: 100%; padding: 0.5rem; font-size: 1rem; box-sizing: border-box; }
  button { grid-column: 1 / -1; padding: 0.75rem; background-color: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 1rem; }
  
  
  .no-regions-warning {
    margin-top: 0.5rem;
    padding: 0.5rem;
    background-color: #fff3cd;
    border: 1px solid #ffeaa7;
    border-radius: 4px;
    color: #856404;
    font-size: 0.85rem;
    margin: 0;
  }
  
  .single-region-display {
    padding: 0.5rem;
    background-color: #e9ecef;
    border: 1px solid #ced4da;
    border-radius: 4px;
    display: flex;
    align-items: center;
  }
  
  .region-name {
    font-weight: 600;
    color: #495057;
    font-size: 1rem;
  }
  
  /* Estilos para manejo de archivos */
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
    padding: 1rem;
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
  
  .files-preview {
    margin-top: 1rem;
  }
  
  .files-preview h4 {
    margin: 0 0 0.5rem 0;
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
  }
  
  .file-size {
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
  
  .file-preview {
    margin-left: 0.5rem;
  }
  
  .preview-thumbnail {
    width: 40px;
    height: 40px;
    object-fit: cover;
    border-radius: 4px;
    border: 1px solid #dee2e6;
  }
</style>