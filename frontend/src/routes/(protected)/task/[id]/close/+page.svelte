<script lang="ts">
  import { onMount } from 'svelte';
  import { goto, invalidateAll } from '$app/navigation';
  export let data;
  let currentStep = 1;

  // Catálogos y selecciones
  let catalogoManoDeObra: any[] = [];
  let searchTermMO = '';
  let seleccionManoDeObra: any[] = [];
  
  let catalogoMateriales: any[] = [];
  let searchTermMatUsados = '';
  let seleccionMatUsados: any[] = [];
  
  let seleccionMatRecuperados: any[] = [];
  let searchTermMatRecuperados = '';

  // Objeto principal del formulario
  let formData = {
    fecha_inicio: '',
    fecha_fin: '',
    mano_de_obra: [],
    materiales_utilizados: [],
    materiales_recuperados: [],
    archivos: [] as File[] // Usamos un array de Archivos
  };
  
  // Lógica de Validación
  let fechaError = '', manoDeObraError = '', materialesError = '';
  const today = new Date().toISOString().split('T')[0];

  function goToNextStep() {
    fechaError = ''; manoDeObraError = ''; materialesError = '';

    if (currentStep === 1) {
      if (!formData.fecha_inicio || !formData.fecha_fin) { return fechaError = 'Ambas fechas son obligatorias.'; }
      if (formData.fecha_inicio > today || formData.fecha_fin > today) { return fechaError = 'Las fechas no pueden ser futuras.'; }
      if (formData.fecha_fin < formData.fecha_inicio) { return fechaError = 'La fecha de fin no puede ser anterior a la fecha de inicio.';}
    }

    if (currentStep === 2) {
      if (formData.mano_de_obra.length === 0) { return manoDeObraError = 'Debe seleccionar al menos un ítem de mano de obra.'; }
      const itemSinCantidad = formData.mano_de_obra.some(item => !item.cantidad || item.cantidad <= 0);
      if (itemSinCantidad) { return manoDeObraError = 'Todos los ítems de mano de obra seleccionados deben tener una cantidad válida.'; }
    }

    if (currentStep === 3 || currentStep === 4) {
      const listaActual = currentStep === 3 ? formData.materiales_utilizados : formData.materiales_recuperados;
      const itemSinCantidad = listaActual.some(item => !item.cantidad || item.cantidad <= 0);
      if (itemSinCantidad) { return materialesError = 'Todos los materiales seleccionados deben tener una cantidad válida.'; }
    }
    
    currentStep++;
  }

  // --- ¡NUEVA FUNCIÓN PARA CANCELAR! ---
  function handleCancel() {
    if (confirm('¿Estás seguro de que quieres cancelar? Se perderán todos los datos cargados.')) {
      goto(`/task/${data.tarea?.id}`);
    }
  }

  // --- LÓGICA DE SELECCIÓN CORREGIDA PARA MATERIALES ---
  function toggleMaterial(item: any, listName: 'usados' | 'recuperados') {
    let selectionArray = listName === 'usados' ? seleccionMatUsados : seleccionMatRecuperados;
    const index = selectionArray.findIndex(i => i.id === item.id);
    
    if (index > -1) {
      selectionArray.splice(index, 1);
    } else {
      // Creamos una COPIA del item para que cada lista tenga su propia versión
      selectionArray.push({ ...item, cantidad: 1 });
    }
    
    if (listName === 'usados') {
      seleccionMatUsados = selectionArray;
    } else {
      seleccionMatRecuperados = selectionArray;
    }
  }
  
  // Funciones para limpiar listas (corregidas)
  function limpiarManoDeObra() {
    if (confirm('¿Borrar toda la mano de obra seleccionada?')) {
      seleccionManoDeObra.forEach(item => {
        const originalItem = catalogoManoDeObra.find(catItem => catItem.id === item.id);
        if (originalItem) originalItem.cantidad = undefined;
      });
      seleccionManoDeObra = [];
    }
  }
  function limpiarMaterialesUsados() {
    if (confirm('¿Borrar todos los materiales utilizados?')) {
      seleccionMatUsados = [];
    }
  }
  function limpiarMaterialesRecuperados() {
    if (confirm('¿Borrar todos los materiales recuperados?')) {
      seleccionMatRecuperados = [];
    }
  }

  // Función para selección aditiva de archivos
  function handleFileSelection(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      const nuevosArchivos = Array.from(input.files);
      const archivosCombinados = [...formData.archivos, ...nuevosArchivos];
      const archivosUnicos = Array.from(new Map(archivosCombinados.map(file => [file.name, file])).values());
      formData.archivos = archivosUnicos;
    }
  }
  
  // Función final para enviar el certificado
  async function handleEmitirCertificado() {
    if (!formData.fecha_inicio || !formData.fecha_fin || formData.mano_de_obra.length === 0) {
      alert('Las Fechas y la Mano de Obra son obligatorias. Por favor, revise las etapas 1 y 2.');
      return;
    }
    
    const token = localStorage.getItem('authToken');
    const dataToSend = new FormData();
    
    if (formData.archivos && formData.archivos.length > 0) {
      for (let i = 0; i < formData.archivos.length; i++) {
        dataToSend.append('archivos', formData.archivos[i]);
      }
    }

    const jsonData = {
        fecha_inicio: formData.fecha_inicio,
        fecha_fin: formData.fecha_fin,
        mano_de_obra: formData.mano_de_obra.map(item => ({ id: item.id, cantidad: item.cantidad })),
        materiales_utilizados: formData.materiales_utilizados.map(item => ({ id: item.id, cantidad: item.cantidad })),
        materiales_recuperados: formData.materiales_recuperados.map(item => ({ id: item.id, cantidad: item.cantidad }))
    };
    dataToSend.append('formData', JSON.stringify(jsonData));

    try {
      const response = await fetch(`http://localhost:3000/api/tareas/${data.tarea.id}/emitir-certificado`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: dataToSend
      });

      const result = await response.json();
      if (!response.ok) {
        // Usamos el mensaje de error que nos da el backend
        throw new Error(result.error || 'Ocurrió un error desconocido.');
      }

      alert('¡Certificado emitido exitosamente!');
      // Redirigimos al dashboard principal tras el éxito
      goto('/dashboard');

    } catch (err) {
      if (err instanceof Error) {
        alert(`Error al emitir el certificado: ${err.message}`);
      } else {
        alert('Ocurrió un error inesperado.');
      }
    }
  }
  
  // Carga de datos de la API
  onMount(async () => {
    const token = localStorage.getItem('authToken');
    const headers = { 'Authorization': `Bearer ${token}` };
    const [moRes, matRes] = await Promise.all([
      fetch('http://localhost:3000/api/listas/mano-de-obra', { headers }),
      fetch('http://localhost:3000/api/listas/materiales', { headers })
    ]);
    if (moRes.ok) catalogoManoDeObra = (await moRes.json()).data;
    if (matRes.ok) catalogoMateriales = (await matRes.json()).data;
  });

  // Filtros y sincronización
  $: filteredManoDeObra = catalogoManoDeObra.filter(item => item.descripcion.toLowerCase().includes(searchTermMO.toLowerCase()) || item.codigo.toLowerCase().includes(searchTermMO.toLowerCase()));
  $: filteredMatUsados = catalogoMateriales.filter(item => item.descripcion.toLowerCase().includes(searchTermMatUsados.toLowerCase()) || item.codigo.toLowerCase().includes(searchTermMatUsados.toLowerCase()));
  $: filteredMatRecuperados = catalogoMateriales.filter(item => item.descripcion.toLowerCase().includes(searchTermMatRecuperados.toLowerCase()) || item.codigo.toLowerCase().includes(searchTermMatRecuperados.toLowerCase()));
  $: formData.mano_de_obra = seleccionManoDeObra;
  $: formData.materiales_utilizados = seleccionMatUsados;
  $: formData.materiales_recuperados = seleccionMatRecuperados;
</script>

<div class="wizard-container">
  <h1>Cierre de Tarea: {data.tarea?.id_tarea_texto}</h1>
  
  <button class="cancel-link" on:click={handleCancel}>← Cancelar y Volver al Detalle</button>

  <div class="stepper">
    <div class="step" class:active={currentStep >= 1}><span>1</span> Fechas</div>
    <div class="step" class:active={currentStep >= 2}><span>2</span> Mano de Obra</div>
    <div class="step" class:active={currentStep >= 3}><span>3</span> Materiales Usados</div>
    <div class="step" class:active={currentStep >= 4}><span>4</span> Materiales Recuperados</div>
    <div class="step" class:active={currentStep >= 5}><span>5</span> Adjuntos</div>
    <div class="step" class:active={currentStep >= 6}><span>6</span> Resumen</div>
  </div>

  <div class="step-content">
    
    {#if currentStep === 1}
      <h2>Etapa 1: Fechas de Ejecución (Obligatorio)</h2>
      <div class="form-grid">
        <div class="form-group">
          <label for="fecha_inicio">Fecha de Inicio</label>
          <input type="date" id="fecha_inicio" bind:value={formData.fecha_inicio} required max={today}>
        </div>
        <div class="form-group">
          <label for="fecha_fin">Fecha de Fin</label>
          <input type="date" id="fecha_fin" bind:value={formData.fecha_fin} required max={today}>
        </div>
      </div>
      {#if fechaError}<p class="error">{fechaError}</p>{/if}
    
    {:else if currentStep === 2}
      <h2>Etapa 2: Mano de Obra (Obligatorio)</h2>
      <div class="selection-grid">
        <div class="catalogue">
          <input type="search" placeholder="Buscar por código o descripción..." bind:value={searchTermMO}>
          <div class="items-list">
            {#each filteredManoDeObra as item (item.id)}
              <label class="item-label">
                <input type="checkbox" bind:group={seleccionManoDeObra} value={item}>
                <div><strong>{item.codigo}</strong> - {item.descripcion}<small>({item.unidad_medida} - ${item.precio})</small></div>
              </label>
            {/each}
          </div>
        </div>
        <div class="selection">
          <div class="selection-header">
            <h4>Mano de Obra Seleccionada</h4>
            <button class="link-button" on:click={limpiarManoDeObra} disabled={seleccionManoDeObra.length === 0}>Limpiar lista</button>
          </div>
          <div class="selected-items-list">
            {#each seleccionManoDeObra as selectedItem (selectedItem.id)}
              <div class="selected-item">
                <span>{selectedItem.codigo} - {selectedItem.descripcion}</span>
                <input type="number" min="1" placeholder="Cant." bind:value={selectedItem.cantidad} required>
              </div>
            {:else}<p class="empty-state">Selecciona ítems de la lista de la izquierda.</p>{/each}
          </div>
        </div>
      </div>
      {#if manoDeObraError}<p class="error">{manoDeObraError}</p>{/if}

    {:else if currentStep === 3}
      <h2>Etapa 3: Materiales Utilizados (Opcional)</h2>
      <div class="selection-grid">
        <div class="catalogue">
          <input type="search" placeholder="Buscar por código o descripción..." bind:value={searchTermMatUsados}>
          <div class="items-list">
            {#each filteredMatUsados as item (item.id)}
              <label class="item-label">
                <input 
                  type="checkbox" 
                  checked={seleccionMatUsados.some(i => i.id === item.id)}
                  on:change={() => toggleMaterial(item, 'usados')}
                >
                <div><strong>{item.codigo}</strong> - {item.descripcion}</div>
              </label>
            {/each}
          </div>
        </div>
        <div class="selection">
          <div class="selection-header">
            <h4>Materiales Seleccionados</h4>
            <button class="link-button" on:click={limpiarMaterialesUsados} disabled={seleccionMatUsados.length === 0}>Limpiar lista</button>
          </div>
          <div class="selected-items-list">
            {#each seleccionMatUsados as selectedItem (selectedItem.id)}
              <div class="selected-item">
                <span>{selectedItem.codigo} - {selectedItem.descripcion}</span>
                <input type="number" min="1" placeholder="Cant." bind:value={selectedItem.cantidad} required>
              </div>
            {:else}<p class="empty-state">Selecciona ítems de la lista de la izquierda.</p>{/each}
          </div>
        </div>
      </div>
      {#if materialesError}<p class="error">{materialesError}</p>{/if}

    {:else if currentStep === 4}
      <h2>Etapa 4: Materiales Recuperados (Opcional)</h2>
      <div class="selection-grid">
        <div class="catalogue">
          <input type="search" placeholder="Buscar por código o descripción..." bind:value={searchTermMatRecuperados}>
          <div class="items-list">
            {#each filteredMatRecuperados as item (item.id)}
              <label class="item-label">
                <input 
                  type="checkbox" 
                  checked={seleccionMatRecuperados.some(i => i.id === item.id)}
                  on:change={() => toggleMaterial(item, 'recuperados')}
                >
                <div><strong>{item.codigo}</strong> - {item.descripcion}</div>
              </label>
            {/each}
          </div>
        </div>
        <div class="selection">
          <div class="selection-header">
            <h4>Materiales Recuperados</h4>
            <button class="link-button" on:click={limpiarMaterialesRecuperados} disabled={seleccionMatRecuperados.length === 0}>Limpiar lista</button>
          </div>
          <div class="selected-items-list">
            {#each seleccionMatRecuperados as selectedItem (selectedItem.id)}
              <div class="selected-item">
                <span>{selectedItem.codigo} - {selectedItem.descripcion}</span>
                <input type="number" min="1" placeholder="Cant." bind:value={selectedItem.cantidad} required>
              </div>
            {:else}<p class="empty-state">Selecciona ítems de la lista de la izquierda.</p>{/each}
          </div>
        </div>
      </div>
      {#if materialesError}<p class="error">{materialesError}</p>{/if}

    {:else if currentStep === 5}
      <h2>Etapa 5: Adjuntar Documentación (Opcional)</h2>
      <div class="upload-area">
        <label for="archivos">Seleccionar archivos de respaldo (fotos, remitos, etc.)</label>
        <input type="file" id="archivos" on:change={handleFileSelection} multiple>
        {#if formData.archivos && formData.archivos.length > 0}
          <div class="preview-list">
            <h4>Archivos seleccionados para subir:</h4>
            <ul>
              {#each formData.archivos as file (file.name)}
                <li>{file.name} ({Math.round(file.size / 1024)} KB)</li>
              {/each}
            </ul>
          </div>
        {/if}
      </div>

    {:else if currentStep === 6}
      <h2>Etapa 6: Resumen y Emisión</h2>
      <p>Por favor, revisa toda la información cargada antes de emitir el certificado.</p>
      <div class="summary-grid">
        <div class="summary-section">
          <h4>Fechas</h4>
          <p><strong>Inicio:</strong> {formData.fecha_inicio || 'No definido'}</p>
          <p><strong>Fin:</strong> {formData.fecha_fin || 'No definido'}</p>
        </div>
        <div class="summary-section">
          <h4>Mano de Obra ({formData.mano_de_obra.length})</h4>
          <ul>
            {#each formData.mano_de_obra as item}<li>{item.cantidad} x {item.codigo}</li>{:else}<li>No se cargó mano de obra.</li>{/each}
          </ul>
        </div>
        <div class="summary-section">
          <h4>Materiales Usados ({formData.materiales_utilizados.length})</h4>
          <ul>
            {#each formData.materiales_utilizados as item}<li>{item.cantidad} x {item.codigo}</li>{:else}<li>No se cargaron materiales.</li>{/each}
          </ul>
        </div>
        <div class="summary-section">
          <h4>Materiales Recuperados ({formData.materiales_recuperados.length})</h4>
          <ul>
            {#each formData.materiales_recuperados as item}<li>{item.cantidad} x {item.codigo}</li>{:else}<li>No se recuperaron materiales.</li>{/each}
          </ul>
        </div>
        <div class="summary-section full-width">
          <h4>Archivos Adjuntos ({formData.archivos?.length || 0})</h4>
          <ul>
            {#if formData.archivos && formData.archivos.length > 0}
              {#each formData.archivos as file (file.name)}
                <li>{file.name}</li>
              {/each}
            {:else}
              <li>No se adjuntaron archivos.</li>
            {/if}
          </ul>
        </div>
      </div>
    {/if}
  </div>

  <div class="wizard-nav">
    {#if currentStep > 1}
      <button class="secondary" on:click={() => currentStep--}>← Anterior</button>
    {/if}
    {#if currentStep < 6}
      <button class="primary" on:click={goToNextStep}>Siguiente →</button>
    {:else}
      <button class="primary success" on:click={handleEmitirCertificado}>Emitir Certificado</button>
    {/if}
  </div>
</div>

<style>
  /* Estilos completos */
  .wizard-container { max-width: 900px; margin: 2rem auto; font-family: sans-serif; background: white; padding: 2rem; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
  /* Estilo para que el botón se vea como un link */
  .cancel-link { 
    display: inline-block; 
    margin-bottom: 1.5rem; 
    color: #6c757d; 
    text-decoration: none;
    background: none;
    border: none;
    padding: 0;
    font-size: inherit;
    cursor: pointer;
  }
  .cancel-link:hover { text-decoration: underline; }
  .stepper { display: flex; justify-content: space-between; margin-bottom: 2rem; border-bottom: 1px solid #eee; padding-bottom: 1rem; }
  .step { color: #ccc; }
  .step.active { color: #007bff; font-weight: bold; }
  .step span { background: #ccc; color: white; border-radius: 50%; padding: 0.2rem 0.6rem; margin-right: 0.5rem; }
  .step.active span { background: #007bff; }
  .step-content { min-height: 400px; padding: 1rem 0; }
  .wizard-nav { display: flex; justify-content: space-between; margin-top: 2rem; border-top: 1px solid #eee; padding-top: 1rem; }
  button { border: none; padding: 0.75rem 1.5rem; border-radius: 4px; cursor: pointer; font-size: 1rem; }
  button.primary { background-color: #007bff; color: white; }
  button.secondary { background-color: #6c757d; color: white; }
  button.success { background-color: #28a745; color: white; }
  .error { color: red; text-align: center; margin-top: 1rem; }
  .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
  .form-group { display: flex; flex-direction: column; }
  .form-group label { margin-bottom: 0.5rem; }
  .form-group input { padding: 0.5rem; }
  .selection-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; }
  .catalogue input[type="search"] { width: 100%; padding: 0.5rem; margin-bottom: 1rem; box-sizing: border-box; }
  .items-list { max-height: 350px; overflow-y: auto; border: 1px solid #ddd; padding: 0.5rem; border-radius: 4px; }
  .item-label { display: flex; align-items: center; padding: 0.5rem; cursor: pointer; border-bottom: 1px solid #eee; }
  .item-label:hover { background-color: #f0f0f0; }
  .item-label input { margin-right: 1rem; }
  .item-label small { color: #555; display: block; }
  .selection { border: 1px solid #007bff; border-radius: 4px; padding: 1rem; }
  .selection-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem; }
  .selection-header h4 { margin: 0; }
  .link-button { background: none; border: none; color: #007bff; text-decoration: underline; cursor: pointer; font-size: 0.8rem; }
  .selected-items-list { max-height: 350px; overflow-y: auto; }
  .selected-item { display: flex; justify-content: space-between; align-items: center; padding: 0.5rem; border-bottom: 1px solid #eee; }
  .selected-item input { width: 60px; text-align: right; padding: 0.25rem; }
  .empty-state { color: #888; }
  .upload-area { border: 2px dashed #ccc; border-radius: 8px; padding: 2rem; text-align: center; }
  .upload-area input { margin-top: 1rem; }
  .preview-list { text-align: left; margin-top: 1.5rem; }
  .preview-list h4 { margin-top: 0; }
  .preview-list ul { list-style-type: none; padding: 0; }
  .summary-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }
  .summary-section { background-color: #f9f9f9; padding: 1rem; border-radius: 4px; border-left: 4px solid #007bff; }
  .summary-section.full-width { grid-column: 1 / -1; }
  .summary-section h4 { margin-top: 0; border-bottom: 1px solid #eee; padding-bottom: 0.5rem; }
  .summary-section ul { list-style: none; padding: 0; }
</style>