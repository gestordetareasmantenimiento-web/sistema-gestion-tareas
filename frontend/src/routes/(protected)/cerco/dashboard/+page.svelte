<script lang="ts">
  import TaskCard from '$lib/components/TaskCard.svelte';
  import { user } from '$lib/stores/auth';
  export let data;
</script>

<h1>Dashboard de CERCO</h1>
<p>Visualización de todas las tareas en etapa de certificación final.</p>

<div class="kanban-board">
  <div class="kanban-column">
    <h2 class="column-title revision-final">Pendientes de Revisión Final</h2>
    <div class="column-content">
      {#each data.columnas?.pendientesDeRevisionFinal || [] as tarea (tarea.id)}
        <TaskCard {tarea} userRole={$user?.rol} />
      {/each}
    </div>
  </div>
  <div class="kanban-column">
    <h2 class="column-title observado">Observados</h2>
    <div class="column-content">
      {#each data.columnas?.observados || [] as tarea (tarea.id)}
        <TaskCard {tarea} userRole={$user?.rol} />
      {/each}
    </div>
  </div>
  <div class="kanban-column">
    <h2 class="column-title pasado-a-pago">Pasados a Pago</h2>
    <div class="column-content">
      {#each data.columnas?.pasadasAPago || [] as tarea (tarea.id)}
        <TaskCard {tarea} userRole={$user?.rol} />
      {/each}
    </div>
  </div>
</div>

<style>
  h1, p { font-family: sans-serif; }
  .kanban-board { display: flex; gap: 1rem; overflow-x: auto; padding: 1rem; min-height: 70vh; }
  .kanban-column { flex: 1; min-width: 300px; max-width: 400px; background-color: #e9ecef; border-radius: 8px; padding: 0.5rem; }
  .column-title { padding: 0.5rem; text-align: center; color: white; border-radius: 4px; font-size: 1rem; }
  .column-content { padding: 0.5rem; min-height: 100px; }
  .revision-final { background-color: #343a40; }
  .observado { background-color: #fd7e14; }
  .pasado-a-pago { background-color: #28a745; }
</style>