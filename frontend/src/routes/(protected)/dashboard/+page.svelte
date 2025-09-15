<script lang="ts">
  import TaskTable from '$lib/components/TaskTable.svelte';
  import Modal from '$lib/components/Modal.svelte';
  import CreateTaskForm from '$lib/components/CreateTaskForm.svelte';
  import { user } from '$lib/stores/auth';
  export let data;

  let showCreateModal = false;

  const supervisorRoles = [
    'supervisor de mantenimiento',
    'supervisor de disponibilidad',
    'supervisor de soporte',
    'supervisor de provision'
  ];

  $: userRol = $user?.rol.toLowerCase();
  
  // Usar la columna "todas" si existe, sino combinar todas las columnas
  $: todasLasTareas = data.columnas?.todas || [
    ...(data.columnas?.pendientes || []),
    ...(data.columnas?.pendientesDeCertificacion || []),
    ...(data.columnas?.aprobados || []),
    ...(data.columnas?.observados || []),
    ...(data.columnas?.finalizadas || []),
    ...(data.columnas?.canceladas || []),
    ...(data.columnas?.pendientesDeProveedor || []),
    ...(data.columnas?.pendientesDeAprobacion || []),
    ...(data.columnas?.enCircuito || []),
    ...(data.columnas?.pendientesDeWo || []),
    ...(data.columnas?.tareasGeneradas || []),
    ...(data.columnas?.aprobadasPorAdmin || []),
    ...(data.columnas?.pendientesDeAutorizacion || []),
    ...(data.columnas?.pendientesDeRevisionFinal || []),
    ...(data.columnas?.pasadasAPago || [])
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
      case 'certify':
        // Implementar lógica de certificación
        console.log('Certificando tarea:', tarea.id);
        break;
    }
  }
</script>

<svelte:window on:taskAction={handleTaskAction} />

<div class="header">
  <h1>Panel Principal</h1>
  <div class="header-actions">
    {#if userRol === 'inspector'}
      <button class="create-button" on:click={() => showCreateModal = true}>+ Crear Tarea</button>
    {/if}
  </div>
</div>

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
  userRole={userRol} 
  loading={false}
/>

<style>
  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
    padding: 0 1rem;
  }
  
  .header-actions {
    display: flex;
    gap: 1rem;
    align-items: center;
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
  
  
  .header h1 {
    margin: 0;
    color: #333;
    font-size: 1.8rem;
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