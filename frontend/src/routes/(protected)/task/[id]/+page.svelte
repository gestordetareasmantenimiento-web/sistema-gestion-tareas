<script lang="ts">
  import { goto, invalidateAll } from '$app/navigation';
  import { user } from '$lib/stores/auth';
  export let data;
  

  let archivoParaSubir: FileList;
  let isUploading = false;

  // --- Lógica para Subir Archivos ---
  async function handleUpload() {
    if (!archivoParaSubir || archivoParaSubir.length === 0) {
      alert('Por favor, selecciona al menos un archivo.');
      return;
    }
    isUploading = true;

    const formData = new FormData();
    // --- ¡NUEVA LÓGICA! ---
    // Recorremos todos los archivos seleccionados y los añadimos al formData
    for (let i = 0; i < archivoParaSubir.length; i++) {
      formData.append('archivo', archivoParaSubir[i]);
    }

    const token = localStorage.getItem('authToken');
    const response = await fetch(`http://localhost:3000/api/tareas/${data.tarea.id}/adjuntos`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData
    });

    isUploading = false;
    if (response.ok) {
      alert('Archivos subidos!');
      invalidateAll();
    } else {
      alert('Error al subir los archivos.');
    }
  }
  
  // --- Lógica para Eliminar Tarea ---
  async function handleDelete() {
    const confirmed = confirm(
      `¿Estás seguro de que quieres eliminar la tarea "${data.tarea.id_tarea_texto}"?`
    );

    if (confirmed) {
      try {
        const token = localStorage.getItem('authToken');
        const response = await fetch(`http://localhost:3000/api/tareas/${data.tarea.id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) throw new Error('Falló la eliminación.');
        
        alert('Tarea eliminada exitosamente.');
        goto('/dashboard');

      } catch (err) {
        if (err instanceof Error) alert(err.message);
      }
    }
  }
</script>

<div class="detalle-container">
  <a href="/dashboard" class="back-link">← Volver al listado</a>
  
  {#if data.tarea}
    <div class="header">
      <h1>Detalle: {data.tarea.id_tarea_texto}</h1>
      <div class="actions">
        <a href="/task/{data.tarea.id}/edit" class="edit-button">Editar</a>
        <button class="delete-button" on:click={handleDelete}>Eliminar</button>

        {#if $user?.rol === 'proveedor' && data.tarea.estado === 'Asignada'}
          <a href="/task/{data.tarea.id}/close" class="close-task-button">Cerrar Tarea</a>
        {/if}
      </div>
    </div>
    
    <div class="info-grid">
      <div class="info-item">
        <strong>Estado:</strong>
        <span>{data.tarea.estado}</span>
      </div>
      <div class="info-item">
        <strong>Número de ICD:</strong>
        <span>{data.tarea.numero_icd || 'No asignado'}</span>
      </div>
      <div class="info-item full-width">
        <strong>Descripción:</strong>
        <p>{data.tarea.descripcion}</p>
      </div>
      <div class="info-item full-width">
        <strong>Dirección:</strong>
        <p>{data.tarea.direccion}</p>
      </div>
    </div>

    <div class="adjuntos-section">
      <h3>Archivos Adjuntos</h3>
      {#if data.adjuntos && data.adjuntos.length > 0}
        <ul>
          {#each data.adjuntos as adjunto}
            <li>
              <a href="http://localhost:3000{adjunto.url_archivo}" target="_blank">{adjunto.nombre_archivo}</a>
            </li>
          {/each}
        </ul>
      {:else}
        <p>No hay archivos adjuntos para esta tarea.</p>
      {/if}

      <form on:submit|preventDefault={handleUpload}>
        <h4>Subir nuevo adjunto</h4>
        <input type="file" bind:files={archivoParaSubir} multiple />
        <button type="submit" disabled={isUploading}>
          {isUploading ? 'Subiendo...' : 'Subir Archivo'}
        </button>
      </form>
    </div>

  {:else if data.error}
    <p class="error">Error: {data.error}</p>
  {:else}
    <p>Cargando detalles de la tarea...</p>
  {/if}
</div>

<style>
  /* Todos los estilos necesarios */
  .detalle-container { font-family: sans-serif; max-width: 800px; margin: 2rem auto; }
  .back-link { text-decoration: none; color: #007bff; margin-bottom: 2rem; display: inline-block; }
  .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
  .actions { display: flex; gap: 0.5rem; }
  .edit-button, .delete-button { display: inline-block; padding: 0.5rem 1rem; color: white; text-decoration: none; border: none; border-radius: 4px; cursor: pointer; font-size: 1rem; }
  .edit-button { background-color: #28a745; }
  .edit-button:hover { background-color: #218838; }
  .delete-button { background-color: #dc3545; }
  .delete-button:hover { background-color: #c82333; }
  .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; background-color: #f9f9f9; padding: 2rem; border-radius: 8px; border: 1px solid #ddd; }
  .info-item { display: flex; flex-direction: column; }
  .info-item.full-width { grid-column: 1 / -1; }
  .info-item strong { margin-bottom: 0.5rem; color: #555; }
  .info-item span, .info-item p { margin: 0; font-size: 1.1rem; }
  .error { color: red; }
  .adjuntos-section { margin-top: 2rem; background-color: #f9f9f9; padding: 2rem; border-radius: 8px; border: 1px solid #ddd; }
  .adjuntos-section h3, .adjuntos-section h4 { margin-top: 0; }
  .adjuntos-section ul { list-style: none; padding: 0; }
  .adjuntos-section li a { text-decoration: none; color: #007bff; }
  .close-task-button {
  background-color: #007bff; /* Mismo color que el botón de crear */
  /* Copia los otros estilos de .edit-button para que se vea igual */
  display: inline-block; padding: 0.5rem 1rem; color: white; text-decoration: none; border: none; border-radius: 4px; cursor: pointer; font-size: 1rem;
  }
  .close-task-button:hover {
      background-color: #0056b3;
  }
</style>