<script lang="ts">
  import TaskCard from '$lib/components/TaskCard.svelte';
  import Modal from '$lib/components/Modal.svelte';
  import CreateTaskForm from '$lib/components/CreateTaskForm.svelte';
  import { user } from '$lib/stores/auth';
  export let data;

  let showCreateModal = false;

  const ROLES_CON_PERMISO_DE_CREAR = [
    'inspector', 'supervisor', 'supervisor de disponibilidad',
    'supervisor de soporte', 'supervisor de provision'
  ];

  const ROLES_TIPO_INSPECTOR = [
    'inspector', 'supervisor de disponibilidad',
    'supervisor de soporte', 'supervisor de provision'
  ];

  // Variables reactivas para determinar la vista a mostrar
  $: userRol = $user?.rol.toLowerCase();
  $: esVistaInspector = userRol && ROLES_TIPO_INSPECTOR.includes(userRol);
  $: esVistaAdmin = userRol === 'administrativo';

</script>

<div class="header">
  <h1>Panel Principal</h1>
  {#if $user && ROLES_CON_PERMISO_DE_CREAR.includes(userRol)}
    <button class="create-button" on:click={() => showCreateModal = true}>+ Crear Tarea</button>
  {/if}
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

  {#if esVistaInspector}
    <div class="kanban-column">
      <h2 class="column-title pendiente">Pendientes</h2>
      <div class="column-content">
        {#each data.columnas.pendientes || [] as tarea (tarea.id)}
          <TaskCard {tarea} userRole={userRol} />
        {/each}
      </div>
    </div>
    <div class="kanban-column">
      <h2 class="column-title en-aprobacion">Pendientes de Certificación</h2>
      <div class="column-content">
        {#each data.columnas.pendientesDeCertificacion || [] as tarea (tarea.id)}
          <TaskCard {tarea} userRole={userRol} />
        {/each}
      </div>
    </div>
    <div class="kanban-column">
      <h2 class="column-title aprobados">Aprobados (En Circuito)</h2>
      <div class="column-content">
        {#each data.columnas.aprobados || [] as tarea (tarea.id)}
          <TaskCard {tarea} userRole={userRol} />
        {/each}
      </div>
    </div>
    <div class="kanban-column">
      <h2 class="column-title observado">Observados</h2>
      <div class="column-content">
        {#each data.columnas.observados || [] as tarea (tarea.id)}
          <TaskCard {tarea} userRole={userRol} />
        {/each}
      </div>
    </div>
    <div class="kanban-column">
      <h2 class="column-title pasado-a-pago">Pasados a Pago</h2>
      <div class="column-content">
        {#each data.columnas.pasadasAPago || [] as tarea (tarea.id)}
          <TaskCard {tarea} userRole={userRol} />
        {/each}
      </div>
    </div>

  {:else if esVistaAdmin}
    <div class="kanban-column">
      <h2 class="column-title pendiente">Pendientes de Asignación de ICD</h2>
      <div class="column-content">
        {#each data.columnas.pendientesDeIcd || [] as tarea (tarea.id)}
          <TaskCard {tarea} userRole={userRol} />
        {/each}
      </div>
    </div>
    <div class="kanban-column">
      <h2 class="column-title en-aprobacion">Pendientes de Revisión</h2>
      <div class="column-content">
        {#each data.columnas.pendientesDeRevision || [] as tarea (tarea.id)}
          <TaskCard {tarea} userRole={userRol} />
        {/each}
      </div>
    </div>
    <div class="kanban-column">
      <h2 class="column-title observado">Observados</h2>
      <div class="column-content">
        {#each data.columnas.observados || [] as tarea (tarea.id)}
          <TaskCard {tarea} userRole={userRol} />
        {/each}
      </div>
    </div>
    <div class="kanban-column">
      <h2 class="column-title pasado-a-pago">Pasados a Pago</h2>
      <div class="column-content">
        {#each data.columnas.pasadasAPago || [] as tarea (tarea.id)}
          <TaskCard {tarea} userRole={userRol} />
        {/each}
      </div>
    </div>

  {:else if userRol === 'supervisor'}
    <div class="kanban-column">
      <h2 class="column-title en-aprobacion">Pendientes de Aprobación</h2>
      <div class="column-content">
        {#each data.columnas.pendientesDeAprobacion || [] as tarea (tarea.id)}
          <TaskCard {tarea} userRole={userRol} />
        {/each}
      </div>
    </div>
    <div class="kanban-column">
      <h2 class="column-title pendiente">Pendientes de Certificación (Inspectores)</h2>
      <div class="column-content">
        {#each data.columnas.pendientesDeCertificacion || [] as tarea (tarea.id)}
          <TaskCard {tarea} userRole={userRol} />
        {/each}
      </div>
    </div>
    <div class="kanban-column">
      <h2 class="column-title aprobados">Tareas en Circuito</h2>
      <div class="column-content">
        {#each data.columnas.enCircuito || [] as tarea (tarea.id)}
          <TaskCard {tarea} userRole={userRol} />
        {/each}
      </div>
    </div>
    <div class="kanban-column">
      <h2 class="column-title observado">Tareas Observadas (Inspectores)</h2>
      <div class="column-content">
        {#each data.columnas.observados || [] as tarea (tarea.id)}
          <TaskCard {tarea} userRole={userRol} />
        {/each}
      </div>
    </div>

  {:else}
    <div class="kanban-column">
      <h2 class="column-title pendiente">Pendientes</h2>
      <div class="column-content">
        {#each data.columnas.pendientes || [] as tarea (tarea.id)}
          <TaskCard {tarea} userRole={userRol} />
        {/each}
      </div>
    </div>
    <div class="kanban-column">
      <h2 class="column-title en-aprobacion">Cerrados En Aprobación</h2>
      <div class="column-content">
        {#each data.columnas.enAprobacion || [] as tarea (tarea.id)}
          <TaskCard {tarea} userRole={userRol} />
        {/each}
      </div>
    </div>
    <div class="kanban-column">
      <h2 class="column-title observado">Observados</h2>
      <div class="column-content">
        {#each data.columnas.observados || [] as tarea (tarea.id)}
          <TaskCard {tarea} userRole={userRol} />
        {/each}
      </div>
    </div>
    <div class="kanban-column">
      <h2 class="column-title pasado-a-pago">Pasados a Pago</h2>
      <div class="column-content">
        {#each data.columnas.pasadasAPago || [] as tarea (tarea.id)}
          <TaskCard {tarea} userRole={userRol} />
        {/each}
      </div>
    </div>
  {/if}

</div>

<style>
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
  .kanban-column { flex: 1; min-width: 300px; background-color: #e9ecef; border-radius: 8px; padding: 0.5rem; }
  .column-title { padding: 0.5rem; text-align: center; color: white; border-radius: 4px; font-size: 1rem; }
  .column-content { padding: 0.5rem; min-height: 100px; }
  .pendiente { background-color: #ffc107; color: black; }
  .en-aprobacion { background-color: #6f42c1; }
  .observado { background-color: #fd7e14; }
  .pasado-a-pago { background-color: #28a745; }
  .aprobados { background-color: #17a2b8; }
</style>