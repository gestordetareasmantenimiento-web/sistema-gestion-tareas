<script lang="ts">
  import { invalidateAll } from '$app/navigation';
  import { onMount } from 'svelte';
  import { user } from '$lib/stores/auth';
  export let data;

  $: certificado = data.certificado;

  let archivoParaSubir: FileList;
  let isUploading = false;
  let observacion = '';
  let isProcessingAction = false;

  // --- LÓGICA PARA EL PANEL DEL ADMINISTRADOR ---
  let numeroIcdEditable = '';

  // Lista de estados en los que el ICD ya NO es editable.
  const estadosBloqueadosParaEdicionIcd = [
    'pendiente aprobación gerente',
    'pendiente aprobación cerco',
    'observada por cerco',
    'finalizada - aprobada',
    'cancelada'
  ];

  // Variable reactiva que nos dice si el panel de admin debe mostrarse.
  $: mostrarPanelAdmin = $user?.rol.toLowerCase() === 'administrativo' && 
                          certificado && 
                          !estadosBloqueadosParaEdicionIcd.includes(certificado.tarea.estado.toLowerCase());

  // Sincronizamos el valor inicial del campo con los datos de la tarea en cuanto carguen
  $: if (certificado?.tarea?.numero_icd) {
    numeroIcdEditable = certificado.tarea.numero_icd;
  } else {
    numeroIcdEditable = '';
  }

  async function handleGuardarIcd() {
    if (!numeroIcdEditable.trim()) {
      alert('El Número de ICD no puede estar vacío.');
      return;
    }
    if (!confirm('¿Estás seguro de que quieres guardar este Número de ICD?')) return;

    isProcessingAction = true;
    const token = localStorage.getItem('authToken');
    try {
      const response = await fetch(`http://localhost:3000/api/tareas/${certificado.tarea.id}`, {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ numero_icd: numeroIcdEditable })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Falló la actualización del ICD.');

      alert('Número de ICD guardado exitosamente.');
      invalidateAll();
    } catch (err) {
      if (err instanceof Error) alert(err.message);
    } finally {
      isProcessingAction = false;
    }
  }

  // --- LÓGICA PARA EL PANEL DEL INSPECTOR ---
  async function handleAprobar() {
    if (!confirm('¿Estás seguro de que quieres APROBAR este certificado?')) return;
    isProcessingAction = true;
    const token = localStorage.getItem('authToken');
    try {
      const response = await fetch(`http://localhost:3000/api/tareas/${certificado.tarea.id}/aprobar-inspector`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Falló la aprobación.');
      alert('Certificado aprobado exitosamente.');
      invalidateAll();
    } catch (err) {
      if (err instanceof Error) alert(err.message);
    } finally {
      isProcessingAction = false;
    }
  }

  async function handleObservar() {
    if (!observacion.trim()) {
      alert('Debes escribir un motivo en el campo de observación.');
      return;
    }
    if (!confirm('¿Estás seguro de que quieres OBSERVAR esta tarea?')) return;
    isProcessingAction = true;
    const token = localStorage.getItem('authToken');
    try {
      const response = await fetch(`http://localhost:3000/api/tareas/${certificado.tarea.id}/observar-inspector`, {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ observacion: observacion })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Falló la observación.');
      alert('La tarea ha sido observada y devuelta al proveedor.');
      invalidateAll();
    } catch (err) {
      if (err instanceof Error) alert(err.message);
    } finally {
      isProcessingAction = false;
    }
  }

  // --- Lógica para Subir y Eliminar ---
  async function handleUpload() {
    if (!archivoParaSubir || archivoParaSubir.length === 0) {
      alert('Por favor, selecciona al menos un archivo.');
      return;
    }
    isUploading = true;
    const formData = new FormData();
    for (let i = 0; i < archivoParaSubir.length; i++) {
      formData.append('archivo', archivoParaSubir[i]);
    }
    const token = localStorage.getItem('authToken');
    const response = await fetch(`http://localhost:3000/api/tareas/${certificado.tarea.id}/adjuntos`, {
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
  
  async function handleDelete() {
    const confirmed = confirm(`¿Estás seguro de que quieres eliminar la tarea "${certificado.tarea.id_tarea_texto}"?`);
    if (confirmed) {
      try {
        const token = localStorage.getItem('authToken');
        const response = await fetch(`http://localhost:3000/api/tareas/${certificado.tarea.id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Falló la eliminación.');
        alert('Tarea eliminada exitosamente.');
        history.back();
      } catch (err) {
        if (err instanceof Error) alert(err.message);
      }
    }
  }
</script>

<div class="detalle-container">
  <button on:click={() => history.back()} class="back-link">← Volver al listado</button>
  
  {#if certificado}
    {#if certificado.tarea.estado === 'Pendiente Certificación Inspector' && $user?.id === certificado.tarea.id_inspector}
      <div class="action-panel inspector-panel">
        <h3>Certificado Pendiente de su Aprobación</h3>
        <p>Revise la información y los adjuntos cargados por el proveedor. Puede aprobar el certificado para que continúe el flujo o puede observarlo para devolverlo al proveedor con comentarios.</p>
        <div class="form-group">
          <label for="observacion">Observación (requerido si rechaza):</label>
          <textarea id="observacion" rows="3" placeholder="Ej: Faltan fotos del medidor, la cantidad de material X es incorrecta..." bind:value={observacion}></textarea>
        </div>
        <div class="panel-actions">
          <button class="approve-button" on:click={handleAprobar} disabled={isProcessingAction}>
            {isProcessingAction ? 'Procesando...' : 'Aprobar Certificado'}
          </button>
          <button class="reject-button" on:click={handleObservar} disabled={isProcessingAction}>
             {isProcessingAction ? 'Procesando...' : 'Observar y Devolver'}
          </button>
        </div>
      </div>
    {/if}

    {#if mostrarPanelAdmin}
      <div class="action-panel admin-panel">
        <h3>Gestión de ICD</h3>
        <p>Ingresa o modifica el Número de ICD para esta tarea.</p>
        <div class="form-group">
          <label for="numeroIcd">Número de ICD</label>
          <input type="text" id="numeroIcd" placeholder="Ej: ICD30334341" bind:value={numeroIcdEditable}>
        </div>
        <div class="panel-actions">
          <button class="approve-button" on:click={handleGuardarIcd} disabled={isProcessingAction}>
            {isProcessingAction ? 'Guardando...' : 'Guardar ICD'}
          </button>
        </div>
      </div>
    {/if}

    <div class="header">
      <h1>Detalle: {certificado.tarea.id_tarea_texto}</h1>
      <div class="actions">
        <a href="/task/{certificado.tarea.id}/edit" class="edit-button">Editar</a>
        <button class="delete-button" on:click={handleDelete}>Eliminar</button>
        {#if $user?.rol.toLowerCase() === 'proveedor' && certificado.tarea.estado === 'Asignada'}
          <a href="/task/{certificado.tarea.id}/close" class="close-task-button">Cerrar Tarea</a>
        {/if}
      </div>
    </div>
    
    <div class="info-grid">
       <div class="info-item">
        <strong>Estado:</strong>
        <span>{certificado.tarea.estado}</span>
      </div>
      <div class="info-item">
        <strong>Número de ICD:</strong>
        <span>{certificado.tarea.numero_icd || 'No asignado'}</span>
      </div>
       <div class="info-item">
        <strong>Proveedor:</strong>
        <span>{certificado.tarea.proveedor_nombre || 'No asignado'}</span>
      </div>
       <div class="info-item">
        <strong>Inspector:</strong>
        <span>{certificado.tarea.inspector_nombre || 'No asignado'}</span>
      </div>
      <div class="info-item full-width">
        <strong>Descripción:</strong>
        <p>{certificado.tarea.descripcion}</p>
      </div>
      <div class="info-item full-width">
        <strong>Dirección:</strong>
        <p>{certificado.tarea.direccion}</p>
      </div>
    </div>

    {#if certificado.tarea.estado !== 'Asignada'}
      <div class="certificado-details">
        <h2>Detalle del Certificado Presentado</h2>
        <div class="info-item-fechas">
          <p><strong>Fecha de Inicio:</strong> {certificado.tarea.fecha_inicio || 'N/A'}</p>
          <p><strong>Fecha de Fin:</strong> {certificado.tarea.fecha_fin || 'N/A'}</p>
        </div>
        <div class="certificado-section">
          <h3>Mano de Obra Cargada</h3>
          {#if certificado.mano_de_obra && certificado.mano_de_obra.length > 0}
            <table>
              <thead> <tr><th>Código</th><th>Descripción</th><th>Cantidad</th></tr> </thead>
              <tbody>
                {#each certificado.mano_de_obra as item}
                  <tr><td>{item.codigo}</td><td>{item.descripcion}</td><td>{item.cantidad} {item.unidad_medida}</td></tr>
                {/each}
              </tbody>
            </table>
          {:else} <p>No se cargó mano de obra para este certificado.</p> {/if}
        </div>
        <div class="certificado-section">
          <h3>Materiales Utilizados</h3>
          {#if certificado.materialesUtilizados && certificado.materialesUtilizados.length > 0}
            <table>
              <thead> <tr><th>Código</th><th>Descripción</th><th>Cantidad</th></tr> </thead>
              <tbody>
                {#each certificado.materialesUtilizados as item}
                  <tr><td>{item.codigo}</td><td>{item.descripcion}</td><td>{item.cantidad}</td></tr>
                {/each}
              </tbody>
            </table>
          {:else} <p>No se cargaron materiales utilizados.</p> {/if}
        </div>
        <div class="certificado-section">
          <h3>Materiales Recuperados</h3>
          {#if certificado.materialesRecuperados && certificado.materialesRecuperados.length > 0}
             <table>
              <thead> <tr><th>Código</th><th>Descripción</th><th>Cantidad</th></tr> </thead>
              <tbody>
                {#each certificado.materialesRecuperados as item}
                  <tr><td>{item.codigo}</td><td>{item.descripcion}</td><td>{item.cantidad}</td></tr>
                {/each}
              </tbody>
            </table>
          {:else} <p>No se recuperaron materiales.</p> {/if}
        </div>
      </div>
    {/if}

    <div class="adjuntos-section">
      <h3>Archivos Adjuntos</h3>
      {#if certificado.adjuntos && certificado.adjuntos.length > 0}
        <ul>
          {#each certificado.adjuntos as adjunto}
            <li><a href="http://localhost:3000{adjunto.url_archivo}" target="_blank">{adjunto.nombre_archivo}</a></li>
          {/each}
        </ul>
      {:else} <p>No hay archivos adjuntos para esta tarea.</p> {/if}
      <form on:submit|preventDefault={handleUpload}>
        <h4>Subir nuevo adjunto</h4>
        <input type="file" bind:files={archivoParaSubir} multiple />
        <button type="submit" disabled={isUploading}>{isUploading ? 'Subiendo...' : 'Subir Archivo'}</button>
      </form>
    </div>

  {:else if data.error}
    <p class="error">Error: {data.error}</p>
  {:else}
    <p>Cargando detalles de la tarea...</p>
  {/if}
</div>

<style>
  .action-panel {
    border-radius: 8px; padding: 1.5rem; margin-bottom: 2rem;
  }
  .action-panel h3 { margin-top: 0; }
  .action-panel .form-group { margin: 1rem 0; }
  .action-panel label { display: block; margin-bottom: 0.5rem; }
  .action-panel textarea, .action-panel input {
    width: 100%; padding: 0.5rem; font-family: inherit; font-size: 1rem;
    border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box;
  }
  .panel-actions { display: flex; gap: 1rem; margin-top: 1rem; }
  .panel-actions button {
    border: none; padding: 0.75rem 1.5rem; border-radius: 4px;
    cursor: pointer; font-size: 1rem; color: white;
  }
  .approve-button { background-color: #28a745; }
  .approve-button:hover { background-color: #218838; }
  .reject-button { background-color: #fd7e14; }
  .reject-button:hover { background-color: #e66a00; }
  .inspector-panel { background-color: #fffbe6; border: 1px solid #ffe58f; }
  .inspector-panel h3 { color: #856404; }
  .admin-panel { background-color: #e6f7ff; border: 1px solid #91d5ff; }
  .admin-panel h3 { color: #0050b3; }
  
  .certificado-details { margin-top: 2rem; }
  .certificado-section {
    margin-bottom: 2rem; background-color: #f9f9f9; padding: 1.5rem;
    border-radius: 8px; border: 1px solid #ddd;
  }
  .certificado-section h3 { margin-top: 0; border-bottom: 1px solid #ccc; padding-bottom: 0.5rem; }
  .certificado-section table { width: 100%; border-collapse: collapse; }
  .certificado-section th, .certificado-section td {
    text-align: left; padding: 0.5rem; border-bottom: 1px solid #eee;
  }
  .certificado-section th { font-weight: bold; }
  .info-item-fechas { display: flex; gap: 2rem; margin-bottom: 1rem; font-style: italic; color: #555; }
  
  .detalle-container { font-family: sans-serif; max-width: 800px; margin: 2rem auto; }
  .back-link { 
    text-decoration: none; color: #007bff; margin-bottom: 2rem; display: inline-block;
    background: none; border: none; padding: 0; font-size: inherit; font-family: inherit; cursor: pointer;
  }
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
    background-color: #007bff; display: inline-block; padding: 0.5rem 1rem; color: white; text-decoration: none; border: none; border-radius: 4px; cursor: pointer; font-size: 1rem;
  }
  .close-task-button:hover {
    background-color: #0056b3;
  }
</style>