<script lang="ts">
  import { goto } from '$app/navigation';
  export let data;

  // Creamos variables locales para los campos del formulario,
  // inicializadas con los datos que cargamos.
  let estado = data.tarea?.estado || '';
  let numero_icd = data.tarea?.numero_icd || '';
  let errorMessage = '';

  async function handleUpdate() {
    errorMessage = '';
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`http://localhost:3000/api/tareas/${data.tarea.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ estado, numero_icd })
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Falló la actualización.');
      }

      // Si todo va bien, volvemos a la página de detalles para ver el cambio
      goto(`/task/${data.tarea.id}`);

    } catch (err) {
      if (err instanceof Error) errorMessage = err.message;
    }
  }
</script>

<div class="edit-container">
  <a href="/task/{data.tarea.id}" class="back-link">← Cancelar y Volver</a>
  <h1>Editando: {data.tarea?.id_tarea_texto}</h1>

  <form on:submit|preventDefault={handleUpdate}>
    <div class="form-group">
      <label for="estado">Estado</label>
      <input type="text" id="estado" bind:value={estado} />
    </div>
    <div class="form-group">
      <label for="icd">Número de ICD</label>
      <input type="text" id="icd" bind:value={numero_icd} />
    </div>
    {#if errorMessage}
      <p class="error">{errorMessage}</p>
    {/if}
    <button type="submit">Guardar Cambios</button>
  </form>
</div>

<style>
  /* Puedes copiar y pegar los estilos del formulario de login, son muy similares */
  .edit-container { max-width: 800px; margin: 2rem auto; font-family: sans-serif; }
  .back-link { text-decoration: none; color: #007bff; margin-bottom: 2rem; display: inline-block; }
  .form-group { margin-bottom: 1rem; }
  label { display: block; margin-bottom: 0.5rem; }
  input { width: 100%; padding: 0.5rem; font-size: 1rem; box-sizing: border-box; }
  button { width: 100%; padding: 0.75rem; font-size: 1rem; background-color: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer; }
  .error { color: red; }
</style>