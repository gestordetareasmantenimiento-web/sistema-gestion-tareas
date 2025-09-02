<script lang="ts">
  import TaskCard from '$lib/components/TaskCard.svelte';
  import { user } from '$lib/stores/auth';
  export let data;
</script>

<h1>Dashboard de Administración</h1>
<p>Tareas correspondientes a tu región.</p>

<div class="kanban-board">
  <div class="kanban-column">
    <h2 class="column-title icd">Pendientes de ICD</h2>
    <div class="column-content">
      {#each data.columnas?.pendientesDeIcd || [] as tarea (tarea.id)}
        <TaskCard {tarea} userRole={$user?.rol} />
      {/each}
    </div>
  </div>
  <div class="kanban-column">
    <h2 class="column-title revision">Pendientes de Revisión</h2>
    <div class="column-content">
      {#each data.columnas?.pendientesDeRevision || [] as tarea (tarea.id)}
        <TaskCard {tarea} />
      {/each}
    </div>
  </div>
  <div class="kanban-column">
    <h2 class="column-title observado">Observados</h2>
    <div class="column-content">
      {#each data.columnas?.observados || [] as tarea (tarea.id)}
        <TaskCard {tarea} />
      {/each}
    </div>
  </div>
  <div class="kanban-column">
    <h2 class="column-title pasado-a-pago">Pasados a Pago</h2>
    <div class="column-content">
      {#each data.columnas?.pasadasAPago || [] as tarea (tarea.id)}
        <TaskCard {tarea} />
      {/each}
    </div>
  </div>
</div>

<style>
  /* Estilos del Kanban */
  .kanban-board { display: flex; gap: 1rem; overflow-x: auto; padding: 1rem; min-height: 70vh; }
  .kanban-column { flex: 1; min-width: 300px; max-width: 400px; background-color: #e9ecef; border-radius: 8px; padding: 0.5rem; }
  .column-title { padding: 0.5rem; text-align: center; color: white; border-radius: 4px; font-size: 1rem; }
  .column-content { padding: 0.5rem; min-height: 100px; }
  .icd { background-color: #17a2b8; }
  .revision { background-color: #007bff; }
  .observado { background-color: #fd7e14; }
  .pasado-a-pago { background-color: #28a745; }
</style>