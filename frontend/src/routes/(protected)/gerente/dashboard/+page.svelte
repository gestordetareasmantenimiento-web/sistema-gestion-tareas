<script lang="ts">
  import TaskTable from '$lib/components/TaskTable.svelte';
  import { user } from '$lib/stores/auth';
  export let data;

  // Usar la columna "porDefecto" si existe (pendientes de autorización), sino usar "todas"
  $: todasLasTareas = data.columnas?.porDefecto || data.columnas?.todas || [];
</script>

<h1>Dashboard de Gerencia</h1>
<p>Tareas de su región. Por defecto se muestran las pendientes de autorización.</p>

<!-- Tabla con todas las tareas -->
<TaskTable 
  tareas={todasLasTareas} 
  userRole={$user?.rol || ''} 
  loading={false}
/>
