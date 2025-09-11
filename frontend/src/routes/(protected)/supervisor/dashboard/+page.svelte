<script lang="ts">
  import TaskTable from '$lib/components/TaskTable.svelte';
  import Modal from '$lib/components/Modal.svelte';
  import CreateTaskForm from '$lib/components/CreateTaskForm.svelte';
  import { user } from '$lib/stores/auth';
  export let data;

  // Variable para controlar la visibilidad del modal
  let showCreateModal = false;
  
  // Combinar todas las tareas de todas las columnas
  $: todasLasTareas = [
    ...(data.columnas?.pendientesDeProveedor || []),
    ...(data.columnas?.pendientesDeCertificacion || []),
    ...(data.columnas?.pendientesDeAprobacion || []),
    ...(data.columnas?.enCircuito || [])
  ];
  
  // Manejar acciones de la tabla
  function handleTaskAction(event: CustomEvent) {
    const { tarea, accion } = event.detail;
    console.log('Acción:', accion, 'Tarea:', tarea.id);
    
    // Aquí puedes implementar la lógica para cada acción
    switch (accion) {
      case 'view':
        window.location.href = `/task/${tarea.id}`;
        break;
      case 'approve':
        // Implementar lógica de aprobación
        console.log('Aprobando tarea:', tarea.id);
        break;
      case 'reject':
        // Implementar lógica de rechazo
        console.log('Rechazando tarea:', tarea.id);
        break;
    }
  }
</script>

<svelte:window on:taskAction={handleTaskAction} />

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

<!-- Nueva tabla con filtros -->
<TaskTable 
  tareas={todasLasTareas} 
  userRole={$user?.rol || ''} 
  loading={false}
/>

<style>
  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
    padding: 0 1rem;
  }

  .header h1 {
    margin: 0;
    color: #333;
    font-size: 1.8rem;
  }

  .create-button {
    background-color: #007bff;
    color: white;
    border: none;
    border-radius: 5px;
    padding: 0.5rem 1rem;
    font-size: 1rem;
    cursor: pointer;
    transition: background-color 0.2s;
  }
  
  .create-button:hover {
    background-color: #0056b3;
  }

  .error { 
    color: #dc3545;
    background: #f8d7da;
    border: 1px solid #f5c6cb;
    padding: 0.75rem;
    border-radius: 4px;
    margin: 0 1rem 1rem 1rem;
  }
</style>