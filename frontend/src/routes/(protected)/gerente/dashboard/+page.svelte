<script lang="ts">
  import TaskCard from '$lib/components/TaskCard.svelte';
  import { user } from '$lib/stores/auth';
  export let data;
</script>

<h1>Dashboard de Gerencia</h1>
<p>Tareas que requieren su autorización final en su región.</p>

<div class="kanban-board">
  <div class="kanban-column">
    <h2 class="column-title autorizacion">Pendientes de Autorización</h2>
    <div class="column-content">
      {#each data.columnas?.pendientesDeAutorizacion || [] as tarea (tarea.id)}
        <TaskCard {tarea} userRole={$user?.rol} />
      {/each}
    </div>
  </div>
</div>

<style>
  .kanban-board { display: flex; gap: 1rem; padding: 1rem; }
  .kanban-column { flex: 1; min-width: 300px; max-width: 450px; background-color: #e9ecef; border-radius: 8px; padding: 0.5rem; }
  .column-title { padding: 0.5rem; text-align: center; color: white; border-radius: 4px; font-size: 1rem; }
  .column-content { padding: 0.5rem; min-height: 100px; }
  .autorizacion { background-color: #dc3545; }
</style>