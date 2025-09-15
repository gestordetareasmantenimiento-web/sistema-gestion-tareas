<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { user } from '$lib/stores/auth';

  let materiales: any[] = [];
  let materialesFiltrados: any[] = [];
  let loading = true;
  let error = '';
  let editingItem: any = null;
  let showEditModal = false;
  let searchTerm = '';

  // Función para filtrar la lista
  function filtrarMateriales() {
    if (!searchTerm.trim()) {
      materialesFiltrados = materiales;
    } else {
      const termino = searchTerm.toLowerCase();
      materialesFiltrados = materiales.filter(item => 
        item.codigo.toString().toLowerCase().includes(termino) ||
        item.descripcion.toLowerCase().includes(termino)
      );
    }
  }

  // Reactividad para filtrar cuando cambia el término de búsqueda
  $: if (searchTerm !== undefined) {
    filtrarMateriales();
  }

  // Datos del formulario de edición
  let editForm = {
    codigo: '',
    descripcion: '',
    unidad_medida: ''
  };

  onMount(async () => {
    console.log('Materials onMount - User inicial:', $user);
    
    // Esperar un poco para que el store se sincronice
    await new Promise(resolve => setTimeout(resolve, 100));
    
    console.log('Materials - User después de esperar:', $user);
    console.log('Materials - User rol:', $user?.rol);
    
    // Verificar que el usuario sea superadministrador
    if (!$user || $user.rol !== 'superadministrador') {
      console.log('Materials - Usuario no autorizado, redirigiendo a /');
      goto('/');
      return;
    }
    console.log('Materials - Usuario autorizado, cargando datos');
    await loadMateriales();
  });

  async function loadMateriales() {
    try {
      loading = true;
      const token = localStorage.getItem('authToken');
      console.log('Materials - Token:', token ? 'Presente' : 'Ausente');
      
      const response = await fetch('http://localhost:3000/api/admin/materiales', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('Materials - Response status:', response.status);
      console.log('Materials - Response ok:', response.ok);

      if (response.ok) {
        const result = await response.json();
        console.log('Materials - Result:', result);
        materiales = result.data || [];
        materialesFiltrados = materiales; // Inicializar lista filtrada
      } else {
        const errorData = await response.json();
        console.error('Materials - Error response:', errorData);
        error = 'Error al cargar la lista de materiales: ' + (errorData.error || 'Error desconocido');
      }
    } catch (err) {
      console.error('Materials - Error:', err);
      error = 'Error de conexión: ' + (err as Error).message;
    } finally {
      loading = false;
    }
  }

  function openEditModal(item: any) {
    editingItem = item;
    editForm = {
      codigo: item.codigo.toString(),
      descripcion: item.descripcion,
      unidad_medida: item.unidad_medida
    };
    showEditModal = true;
  }

  function closeEditModal() {
    showEditModal = false;
    editingItem = null;
    editForm = {
      codigo: '',
      descripcion: '',
      unidad_medida: ''
    };
  }

  async function saveChanges() {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`http://localhost:3000/api/admin/materiales/${editForm.codigo}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(editForm)
      });

      if (response.ok) {
        await loadMateriales(); // Recargar la lista
        closeEditModal();
        alert('Material actualizado exitosamente');
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.error}`);
      }
    } catch (err) {
      console.error('Error:', err);
      alert('Error al actualizar el material');
    }
  }
</script>

<svelte:head>
  <title>Editar Materiales - Superadministrador</title>
</svelte:head>

<div class="admin-container">
  <div class="header">
    <button class="back-btn" on:click={() => goto('/superadmin/settings')}>
      ← Volver a Configuración
    </button>
    <h1>🔧 Editar Materiales</h1>
    <p>Administra la base de datos de materiales</p>
  </div>

  {#if loading}
    <div class="loading">
      <div class="spinner"></div>
      <p>Cargando lista de materiales...</p>
    </div>
  {:else if error}
    <div class="error">
      <p>❌ {error}</p>
      <button on:click={loadMateriales}>Reintentar</button>
    </div>
  {:else}
    <div class="table-container">
      <div class="table-header">
        <h3>Lista de Materiales ({materialesFiltrados.length} de {materiales.length} registros)</h3>
        <button class="refresh-btn" on:click={loadMateriales}>🔄 Actualizar</button>
      </div>
      
      <div class="search-container">
        <div class="search-box">
          <input 
            type="text" 
            placeholder="Buscar por código o descripción..." 
            bind:value={searchTerm}
            class="search-input"
          />
          <span class="search-icon">🔍</span>
        </div>
      </div>
      
      <div class="table-wrapper">
        <table class="admin-table">
          <thead>
            <tr>
              <th>Código</th>
              <th>Descripción</th>
              <th>Unidad de Medida</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {#each materialesFiltrados as item}
              <tr>
                <td class="codigo-cell">{item.codigo}</td>
                <td class="descripcion-cell">{item.descripcion}</td>
                <td class="unidad-cell">{item.unidad_medida}</td>
                <td class="actions-cell">
                  <button class="edit-btn" on:click={() => openEditModal(item)}>
                    ✏️ Editar
                  </button>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </div>
  {/if}
</div>

<!-- Modal de Edición -->
{#if showEditModal}
  <div class="modal-overlay" on:click={closeEditModal}>
    <div class="modal-content" on:click|stopPropagation>
      <div class="modal-header">
        <h3>✏️ Editar Material</h3>
        <button class="close-btn" on:click={closeEditModal}>×</button>
      </div>
      
      <div class="modal-body">
        <form on:submit|preventDefault={saveChanges}>
          <div class="form-group">
            <label for="codigo">Código:</label>
            <input 
              type="text" 
              id="codigo" 
              bind:value={editForm.codigo} 
              readonly
              class="form-input readonly"
            />
            <small class="form-help">El código no se puede modificar</small>
          </div>
          
          <div class="form-group">
            <label for="descripcion">Descripción:</label>
            <textarea 
              id="descripcion" 
              bind:value={editForm.descripcion} 
              required 
              class="form-textarea"
              rows="3"
            ></textarea>
          </div>
          
          <div class="form-group">
            <label for="unidad_medida">Unidad de Medida:</label>
            <input 
              type="text" 
              id="unidad_medida" 
              bind:value={editForm.unidad_medida} 
              required 
              class="form-input"
            />
          </div>
          
          <div class="modal-actions">
            <button type="button" class="cancel-btn" on:click={closeEditModal}>
              Cancelar
            </button>
            <button type="submit" class="save-btn">
              💾 Guardar Cambios
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
{/if}

<style>
  .admin-container {
    max-width: 1400px;
    margin: 0 auto;
    padding: 20px;
    background: #f8f9fa;
    min-height: 100vh;
  }

  .header {
    background: white;
    padding: 20px;
    border-radius: 8px;
    margin-bottom: 20px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  }

  .back-btn {
    background: #6c757d;
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 4px;
    cursor: pointer;
    margin-bottom: 10px;
  }

  .back-btn:hover {
    background: #5a6268;
  }

  h1 {
    color: #2c3e50;
    margin: 0 0 5px 0;
  }

  .header p {
    color: #6c757d;
    margin: 0;
  }

  .loading, .error {
    text-align: center;
    padding: 40px;
    background: white;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  }

  .spinner {
    width: 40px;
    height: 40px;
    border: 4px solid #f3f3f3;
    border-top: 4px solid #3498db;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin: 0 auto 20px;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  .table-container {
    background: white;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    overflow: hidden;
  }

  .table-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px;
    background: #f8f9fa;
    border-bottom: 1px solid #dee2e6;
  }

  .table-header h3 {
    margin: 0;
    color: #2c3e50;
  }

  .refresh-btn {
    background: #28a745;
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 4px;
    cursor: pointer;
  }

  .refresh-btn:hover {
    background: #218838;
  }

  .table-wrapper {
    overflow-x: auto;
  }

  .admin-table {
    width: 100%;
    border-collapse: collapse;
  }

  .admin-table th {
    background: #2c3e50;
    color: white;
    padding: 12px 8px;
    text-align: left;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    font-size: 12px;
  }

  .admin-table td {
    padding: 12px 8px;
    border-bottom: 1px solid #dee2e6;
    vertical-align: top;
  }

  .admin-table tr:hover {
    background: #f8f9fa;
  }

  .codigo-cell {
    font-family: monospace;
    font-weight: 600;
    color: #2c3e50;
    min-width: 120px;
  }

  .descripcion-cell {
    max-width: 400px;
    word-wrap: break-word;
    line-height: 1.4;
  }

  .unidad-cell {
    text-align: center;
    font-weight: 600;
    color: #6c757d;
    min-width: 100px;
  }

  .actions-cell {
    text-align: center;
    min-width: 100px;
  }

  .edit-btn {
    background: #007bff;
    color: white;
    border: none;
    padding: 6px 12px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 12px;
  }

  .edit-btn:hover {
    background: #0056b3;
  }

  /* Modal Styles */
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0,0,0,0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
  }

  .modal-content {
    background: white;
    border-radius: 8px;
    width: 90%;
    max-width: 500px;
    max-height: 90vh;
    overflow-y: auto;
    box-shadow: 0 4px 20px rgba(0,0,0,0.3);
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px;
    border-bottom: 1px solid #dee2e6;
  }

  .modal-header h3 {
    margin: 0;
    color: #2c3e50;
  }

  .close-btn {
    background: none;
    border: none;
    font-size: 24px;
    cursor: pointer;
    color: #6c757d;
  }

  .close-btn:hover {
    color: #2c3e50;
  }

  .modal-body {
    padding: 20px;
  }

  .form-group {
    margin-bottom: 20px;
  }

  .form-group label {
    display: block;
    margin-bottom: 5px;
    font-weight: 600;
    color: #2c3e50;
  }

  .form-input, .form-textarea {
    width: 100%;
    padding: 10px;
    border: 1px solid #ced4da;
    border-radius: 4px;
    font-size: 14px;
  }

  .form-input.readonly {
    background: #f8f9fa;
    color: #6c757d;
    cursor: not-allowed;
  }

  .form-input:focus, .form-textarea:focus {
    outline: none;
    border-color: #007bff;
    box-shadow: 0 0 0 2px rgba(0,123,255,0.25);
  }

  .form-help {
    display: block;
    margin-top: 5px;
    font-size: 12px;
    color: #6c757d;
  }

  .modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    margin-top: 30px;
    padding-top: 20px;
    border-top: 1px solid #dee2e6;
  }

  .cancel-btn {
    background: #6c757d;
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 4px;
    cursor: pointer;
  }

  .cancel-btn:hover {
    background: #5a6268;
  }

  .save-btn {
    background: #28a745;
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 4px;
    cursor: pointer;
  }

  .save-btn:hover {
    background: #218838;
  }

  /* Estilos del buscador */
  .search-container {
    margin: 20px 0;
    display: flex;
    justify-content: center;
  }

  .search-box {
    position: relative;
    width: 100%;
    max-width: 500px;
  }

  .search-input {
    width: 100%;
    padding: 12px 40px 12px 16px;
    border: 2px solid #e9ecef;
    border-radius: 8px;
    font-size: 16px;
    transition: border-color 0.3s ease;
  }

  .search-input:focus {
    outline: none;
    border-color: #007bff;
    box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
  }

  .search-icon {
    position: absolute;
    right: 12px;
    top: 50%;
    transform: translateY(-50%);
    color: #6c757d;
    font-size: 18px;
    pointer-events: none;
  }

  @media (max-width: 768px) {
    .admin-table {
      font-size: 12px;
    }
    
    .admin-table th,
    .admin-table td {
      padding: 8px 4px;
    }
  }
</style>
