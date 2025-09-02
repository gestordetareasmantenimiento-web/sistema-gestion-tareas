<script lang="ts">
  // --- SECCIÓN DE IMPORTS COMBINADA ---
  import TaskCard from '$lib/components/TaskCard.svelte';
  import Modal from '$lib/components/Modal.svelte';
  import CreateTaskForm from '$lib/components/CreateTaskForm.svelte';
  import { user } from '$lib/stores/auth';
  export let data;

  // --- NUEVA LÓGICA PARA EL MODAL ---
  let showCreateModal = false;
</script>

<div class="header">
  <h1>Panel Principal</h1>
  <button class="create-button" on:click={() => showCreateModal = true}>+ Crear Tarea</button>
</div>

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
    <h2 class="column-title pendiente">Pendientes</h2>
    <div class="column-content">
      {#each data.columnas.pendientes as tarea (tarea.id)}
        <TaskCard {tarea} userRole={$user?.rol} />
      {/each}
    </div>
  </div>

  <div class="kanban-column">
    <h2 class="column-title en-aprobacion">Cerrados En Aprobación</h2>
    <div class="column-content">
      {#each data.columnas.enAprobacion as tarea (tarea.id)}
        <TaskCard {tarea} userRole={$user?.rol} />
      {/each}
    </div>
  </div>

  <div class="kanban-column">
    <h2 class="column-title observado">Observados</h2>
    <div class="column-content">
      {#each data.columnas.observados as tarea (tarea.id)}
        <TaskCard {tarea} userRole={$user?.rol} />
      {/each}
    </div>
  </div>

  <div class="kanban-column">
    <h2 class="column-title pasado-a-pago">Pasados a Pago</h2>
    <div class="column-content">
      {#each data.columnas.pasadasAPago as tarea (tarea.id)}
        <TaskCard {tarea} userRole={$user?.rol} />
      {/each}
    </div>
  </div>
</div>

<style>
  /* --- NUEVOS ESTILOS PARA EL HEADER Y EL BOTÓN --- */
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

  /* --- TUS ESTILOS DEL KANBAN (SE MANTIENEN) --- */
  .kanban-board { display: flex; gap: 1rem; overflow-x: auto; padding: 1rem; min-height: 70vh; }
  .kanban-column { flex: 1; min-width: 300px; background-color: #e9ecef; border-radius: 8px; padding: 0.5rem; }
  .column-title { padding: 0.5rem; text-align: center; color: white; border-radius: 4px; font-size: 1rem; }
  .column-content { padding: 0.5rem; min-height: 100px; }
  .pendiente { background-color: #ffc107; color: black; }
  .en-aprobacion { background-color: #6f42c1; }
  .observado { background-color: #fd7e14; }
  .pasado-a-pago { background-color: #28a745; }
</style>