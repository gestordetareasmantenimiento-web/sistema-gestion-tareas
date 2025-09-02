<script lang="ts">
  import TaskCard from '$lib/components/TaskCard.svelte';
  import Modal from '$lib/components/Modal.svelte';
  import CreateTaskForm from '$lib/components/CreateTaskForm.svelte';
  import { user } from '$lib/stores/auth';
  export let data;

  // Variable para controlar la visibilidad del modal
  let showCreateModal = false;
</script>

<div class="header">
  <h1>Dashboard de Supervisor</h1>
  <button class="create-button" on:click={() => showCreateModal = true}>+ Crear Tarea</button>
</div>
<p>Visualización de todas las tareas de los inspectores a tu cargo.</p>

{#if showCreateModal}
  <Modal on:close={() => showCreateModal = false}>
    <CreateTaskForm on:taskCreated={() => showCreateModal = false}/>
  </Modal>
{/if}

{#if data.error}
  <p class="error">{data.error}</p>
{/if}

<div class="kanban-board">
  <div class="kanban-column">
    <h2 class="column-title pendiente">Pendientes de Proveedor</h2>
    <div class="column-content">
      {#each data.columnas?.pendientesDeProveedor || [] as tarea (tarea.id)}
        <TaskCard {tarea} userRole={$user?.rol} />
      {/each}
    </div>
  </div>

  <div class="kanban-column">
    <h2 class="column-title certificacion">Pendientes de Certificación</h2>
    <div class="column-content">
      {#each data.columnas?.pendientesDeCertificacion || [] as tarea (tarea.id)}
        <TaskCard {tarea} userRole={$user?.rol} />
      {/each}
    </div>
  </div>

  <div class="kanban-column">
    <h2 class="column-title autorizacion">Pendientes de Autorización</h2>
    <div class="column-content">
      {#each data.columnas?.pendientesDeAutorizacion || [] as tarea (tarea.id)}
        <TaskCard {tarea} userRole={$user?.rol} />
      {/each}
    </div>
  </div>

  <div class="kanban-column">
    <h2 class="column-title en-circuito">En Circuito</h2>
    <div class="column-content">
      {#each data.columnas?.enCircuito || [] as tarea (tarea.id)}
        <TaskCard {tarea} userRole={$user?.rol} />
      {/each}
    </div>
  </div>
</div>

<style>
  /* NUEVOS ESTILOS (COMBINADOS CON LOS EXISTENTES) */
  h1, p { font-family: sans-serif; }

  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
    padding: 0 1rem;
  }

  .create-button {
    background-color: #007bff;
    color: white;
    border: none;
    border-radius: 5px;
    padding: 0.5rem 1rem;
    font-size: 1rem;
    cursor: pointer;
  }
  .create-button:hover {
    background-color: #0056b3;
  }

  .kanban-board { display: flex; gap: 1rem; overflow-x: auto; padding: 1rem; min-height: 70vh; }
  .kanban-column { flex: 1; min-width: 300px; max-width: 400px; background-color: #e9ecef; border-radius: 8px; padding: 0.5rem; }
  .column-title { padding: 0.5rem; text-align: center; color: white; border-radius: 4px; font-size: 1rem; }
  .column-content { padding: 0.5rem; min-height: 100px; }
  .pendiente { background-color: #ffc107; color: black; }
  .certificacion { background-color: #007bff; }
  .autorizacion { background-color: #6f42c1; }
  .en-circuito { background-color: #6c757d; }
  .error { color: red; }
</style>