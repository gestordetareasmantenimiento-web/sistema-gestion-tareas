<script lang="ts">
  import { onMount, createEventDispatcher } from 'svelte';
  import { invalidateAll } from '$app/navigation';
  import { user } from '$lib/stores/auth';

  const dispatch = createEventDispatcher();

  let proveedores: any[] = [];
  let inspectoresSubordinados: any[] = [];
  
  // Variables para los campos del formulario
  let direccion = '';
  let region = '';
  let descripcion = '';
  let id_proveedor = '';
  let id_inspector_asignado = '';
  let archivos: FileList;

  onMount(async () => {
    const token = localStorage.getItem('authToken');
    if (!token) return;
    const headers = { 'Authorization': `Bearer ${token}` };

    const provRes = await fetch('http://localhost:3000/api/listas/proveedores', { headers });
    if (provRes.ok) proveedores = (await provRes.json()).data;
    
    if ($user?.rol.toLowerCase() === 'supervisor') {
      const inspRes = await fetch('http://localhost:3000/api/listas/inspectores-subordinados', { headers });
      if (inspRes.ok) inspectoresSubordinados = (await inspRes.json()).data;
    }
  });

  async function handleSubmit() {
    const token = localStorage.getItem('authToken');
    const formData = new FormData();

    // Añadimos los campos de texto al FormData
    formData.append('direccion', direccion);
    formData.append('region', region);
    formData.append('descripcion', descripcion);
    formData.append('id_proveedor', id_proveedor);
    
    const inspectorFinalId = $user?.rol.toLowerCase() === 'supervisor' ? id_inspector_asignado : String($user?.id);
    formData.append('id_inspector', inspectorFinalId);

    // Añadimos los archivos
    if (archivos) {
      for (let i = 0; i < archivos.length; i++) {
        formData.append('archivos', archivos[i]); // El nombre debe ser 'archivos' para coincidir con upload.array()
      }
    }
    
    const response = await fetch('http://localhost:3000/api/tareas', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }, // NO se pone Content-Type, el navegador lo hace solo
        body: formData
    });

    if (response.ok) {
      alert('¡Tarea creada exitosamente!');
      invalidateAll(); // Recarga los datos del dashboard
      dispatch('taskCreated'); // Emite el evento para cerrar el modal
    } else {
      alert('Error al crear la tarea.');
    }
  }
</script>

<h2>Crear Nueva Tarea</h2>
<form on:submit|preventDefault={handleSubmit} class="create-task-form">
  <div class="form-group">
    <label for="direccion">Dirección</label>
    <input type="text" id="direccion" bind:value={direccion} required>
  </div>

  <div class="form-group">
    <label for="region">Región</label>
    <select id="region" bind:value={region} required>
        <option value="" disabled>Seleccione una región</option>
        <option value="Norte">Norte</option>
        <option value="Sur">Sur</option>
        <option value="Oeste">Oeste</option>
    </select>
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
        <option value={p.id}>{p.razon_social}</option>
      {/each}
    </select>
  </div>

  {#if $user?.rol.toLowerCase() === 'supervisor'}
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
    <input type="file" id="archivos" bind:files={archivos} multiple>
  </div>

  <button type="submit">Crear Tarea</button>
</form>

<style>
  .create-task-form {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
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
</style>