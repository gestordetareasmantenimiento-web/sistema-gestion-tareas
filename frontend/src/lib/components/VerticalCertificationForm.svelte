<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  
  const dispatch = createEventDispatcher();
  
  export let tarea: any;
  export let taskId: string | null = null;
  export let manoDeObra: any[] = [];
  export let materiales: any[] = [];
  
  // Estados del formulario
  let currentStep = 1;
  let isSubmitting = false;
  let showSuccess = false;
  
  // Datos del certificado
  let fechaInicio = '';
  let fechaFin = '';
  let observaciones = '';
  
  // Items seleccionados
  let codigosManoDeObraSeleccionados: any[] = [];
  let cantidadesManoDeObra: { [key: string]: number } = {};
  let materialesUtilizados: any[] = [];
  let materialesRecuperados: any[] = [];
  
  // Archivos
  let archivos: FileList | null = null;
  let archivosPreview: { name: string; type: string; size: number; previewUrl?: string }[] = [];
  
  // Validaciones reactivas
  $: today = new Date().toISOString().split('T')[0];
  $: minDate = (() => {
    if (!tarea?.fecha_creacion) return today;
    const date = new Date(tarea.fecha_creacion);
    return isNaN(date.getTime()) ? today : date.toISOString().split('T')[0];
  })();
  
  // Configuración de pasos
  const steps = [
    { id: 1, title: 'Fechas de Trabajo', icon: '📅', description: 'Define las fechas de inicio y fin del trabajo' },
    { id: 2, title: 'Seleccionar Mano de Obra', icon: '👷', description: 'Selecciona los códigos de trabajo ejecutados' },
    { id: 3, title: 'Cantidades Mano de Obra', icon: '📊', description: 'Ingresa las cantidades para cada código' },
    { id: 4, title: 'Materiales Utilizados', icon: '🔧', description: 'Indica los materiales consumidos' },
    { id: 5, title: 'Materiales Recuperados', icon: '♻️', description: 'Lista los materiales recuperados' },
    { id: 6, title: 'Documentación', icon: '📎', description: 'Adjunta fotos y documentos' },
    { id: 7, title: 'Resumen', icon: '✅', description: 'Revisa y confirma la información' }
  ];
  
  // Funciones de navegación
  function nextStep() {
    if (validateCurrentStep()) {
      currentStep++;
    }
  }
  
  function prevStep() {
    currentStep--;
  }
  
  function goToStep(step: number) {
    if (step <= currentStep || validateCurrentStep()) {
      currentStep = step;
    }
  }
  
  // Validaciones por paso
  function validateCurrentStep(): boolean {
    switch (currentStep) {
      case 1:
        if (!fechaInicio || !fechaFin) {
          alert('Por favor, completa las fechas de inicio y fin.');
          return false;
        }
        if (new Date(fechaInicio) > new Date(fechaFin)) {
          alert('La fecha de inicio no puede ser posterior a la fecha de fin.');
          return false;
        }
        return true;
      case 2:
        if (codigosManoDeObraSeleccionados.length === 0) {
          alert('Debes seleccionar al menos un código de mano de obra.');
          return false;
        }
        return true;
      case 3:
        // Validar que todas las cantidades sean mayores a 0
        for (const codigo of codigosManoDeObraSeleccionados) {
          const cantidad = cantidadesManoDeObra[codigo.id];
          if (!cantidad || cantidad <= 0) {
            alert(`Debes ingresar una cantidad válida para ${codigo.descripcion}.`);
            return false;
          }
        }
        return true;
      default:
        return true;
    }
  }
  
  // Funciones para manejar archivos
  function handleFileChange(event: Event) {
    const target = event.target as HTMLInputElement;
    if (target.files) {
      archivos = target.files;
      archivosPreview = Array.from(target.files).map(file => ({
        name: file.name,
        type: file.type.startsWith('image/') ? 'image' : 
              file.type === 'application/pdf' ? 'pdf' :
              file.type.includes('excel') || file.type.includes('spreadsheet') ? 'excel' :
              file.type.includes('word') ? 'word' : 'other',
        size: file.size,
        previewUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined
      }));
    }
  }
  
  function removeFile(index: number) {
    archivosPreview = archivosPreview.filter((_, i) => i !== index);
    if (archivosPreview.length === 0) {
      archivos = null;
    }
  }

  // Funciones para manejo de códigos de mano de obra
  function toggleCodigoManoDeObra(codigo: any) {
    const index = codigosManoDeObraSeleccionados.findIndex(c => c.id === codigo.id);
    if (index > -1) {
      codigosManoDeObraSeleccionados = codigosManoDeObraSeleccionados.filter(c => c.id !== codigo.id);
      // Remover cantidad si existe
      delete cantidadesManoDeObra[codigo.id];
    } else {
      codigosManoDeObraSeleccionados = [...codigosManoDeObraSeleccionados, codigo];
      // Inicializar cantidad en 0
      cantidadesManoDeObra[codigo.id] = 0;
    }
  }

  function updateCantidadManoDeObra(codigoId: string, cantidad: number) {
    cantidadesManoDeObra[codigoId] = cantidad;
  }

  function isCodigoSeleccionado(codigo: any) {
    return codigosManoDeObraSeleccionados.some(c => c.id === codigo.id);
  }
  
  // Función para volver a la tarea
  function handleBackToTask() {
    console.log('handleBackToTask called - taskId:', taskId, 'tarea:', tarea);
    if (taskId) {
      console.log('Navigating to task:', taskId);
      window.location.href = `/task/${taskId}`;
    } else if (tarea && tarea.id_tarea) {
      console.log('Navigating to task using tarea.id_tarea:', tarea.id_tarea);
      window.location.href = `/task/${tarea.id_tarea}`;
    } else {
      console.error('No valid task ID available for navigation');
      dispatch('close');
    }
  }

  // Función para enviar certificado
  async function submitCertificado() {
    isSubmitting = true;
    
    try {
      const formData = new FormData();
      formData.append('fecha_inicio', fechaInicio);
      formData.append('fecha_fin', fechaFin);
      formData.append('observaciones', observaciones);
      formData.append('mano_de_obra', JSON.stringify(manoDeObraSeleccionada));
      formData.append('materiales_utilizados', JSON.stringify(materialesUtilizados));
      formData.append('materiales_recuperados', JSON.stringify(materialesRecuperados));
      
      if (archivos) {
        Array.from(archivos).forEach(file => {
          formData.append('archivos', file);
        });
      }
      
      const token = localStorage.getItem('authToken');
      const response = await fetch(`http://localhost:3000/api/tareas/${tarea.id}/certificar`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      
      if (response.ok) {
        showSuccess = true;
        dispatch('certificadoEmitido', { tarea: tarea.id });
      } else {
        throw new Error('Error al enviar certificado');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al enviar el certificado. Inténtalo de nuevo.');
    } finally {
      isSubmitting = false;
    }
  }
</script>

{#if !tarea}
  <div class="loading-container">
    <div class="loading-spinner"></div>
    <p>Cargando datos de la tarea...</p>
  </div>
{:else}
<div class="vertical-certification-form">
  {#if showSuccess}
    <div class="success-screen">
      <div class="success-icon">🎉</div>
      <h2>¡Certificado Emitido Exitosamente!</h2>
      <p>Tu certificado ha sido enviado y está siendo revisado por el inspector.</p>
      <button class="success-btn" on:click={() => dispatch('close')}>
        Volver al Dashboard
      </button>
    </div>
  {:else}
    <!-- Header compacto -->
    <div class="form-header">
      <div class="header-top">
        <button on:click={handleBackToTask} class="back-to-task-btn">
          ← Volver a la tarea
        </button>
        <div class="header-title">
          <h2>📋 Certificado de Trabajo</h2>
          <p>Tarea: {tarea.id_tarea_texto} - {tarea.descripcion}</p>
        </div>
      </div>
    </div>
    
    <!-- Contenido principal -->
    <div class="form-content">
      <!-- Indicador de progreso vertical -->
      <div class="progress-sidebar">
        {#each steps as step}
          <div 
            class="progress-step" 
            class:active={currentStep === step.id}
            class:completed={currentStep > step.id}
            on:click={() => goToStep(step.id)}
          >
            <div class="step-icon">{step.icon}</div>
            <div class="step-info">
              <div class="step-title">{step.title}</div>
              <div class="step-description">{step.description}</div>
            </div>
            {#if currentStep > step.id}
              <div class="step-check">✓</div>
            {/if}
          </div>
        {/each}
      </div>
      
      <!-- Contenido del paso actual -->
      <div class="step-content">
        {#if currentStep === 1}
          <!-- Paso 1: Fechas de Trabajo -->
          <div class="step-panel">
            <h3>📅 Fechas de Trabajo</h3>
            <p>Indica las fechas reales de inicio y finalización del trabajo. No puedes seleccionar fechas futuras.</p>
            
            <div class="date-inputs">
              <div class="input-group">
                <label for="fecha-inicio">Fecha de Inicio</label>
                <input 
                  type="date" 
                  id="fecha-inicio"
                  bind:value={fechaInicio}
                  max={today}
                  required
                />
              </div>
              
              <div class="input-group">
                <label for="fecha-fin">Fecha de Fin</label>
                <input 
                  type="date" 
                  id="fecha-fin"
                  bind:value={fechaFin}
                  max={today}
                  min={fechaInicio || minDate}
                  required
                />
              </div>
            </div>
            
            <div class="input-group">
              <label for="observaciones">Observaciones (Opcional)</label>
              <textarea 
                id="observaciones"
                bind:value={observaciones}
                placeholder="Agrega cualquier observación relevante sobre el trabajo realizado..."
                rows="3"
              ></textarea>
            </div>
            
            <!-- Navegación -->
            <div class="step-navigation">
              <button class="nav-btn next" on:click={nextStep}>
                Siguiente →
              </button>
            </div>
          </div>
          
        {:else if currentStep === 2}
          <!-- Paso 2: Seleccionar Códigos de Mano de Obra -->
          <div class="step-panel">
            <h3>👷 Seleccionar Códigos de Mano de Obra</h3>
            <p>Selecciona todos los códigos de trabajo que se ejecutaron en esta tarea.</p>
            
            <div class="items-grid">
              {#each manoDeObra as item}
                <div class="item-card" class:selected={isCodigoSeleccionado(item)}>
                  <div class="item-info">
                    <h4>{item.codigo} - {item.descripcion}</h4>
                    <p class="item-details">
                      <span class="unidad">Unidad: {item.unidad_medida}</span>
                      <span class="precio">Precio: ${item.precio}</span>
                    </p>
                    {#if item.requiere_aprobacion_supervisor}
                      <p class="warning">⚠️ Requiere aprobación de supervisor</p>
                    {/if}
                    {#if item.requiere_aprobacion_gerente}
                      <p class="warning">⚠️ Requiere aprobación de gerente</p>
                    {/if}
                  </div>
                  <button 
                    class="toggle-btn" 
                    on:click={() => toggleCodigoManoDeObra(item)}
                  >
                    {isCodigoSeleccionado(item) ? '✓' : '+'}
                  </button>
                </div>
              {/each}
            </div>
            
            <!-- Navegación -->
            <div class="step-navigation">
              <button class="nav-btn prev" on:click={prevStep}>
                ← Anterior
              </button>
              <button class="nav-btn next" on:click={nextStep}>
                Siguiente →
              </button>
            </div>
          </div>
          
        {:else if currentStep === 3}
          <!-- Paso 3: Cantidades de Mano de Obra -->
          <div class="step-panel">
            <h3>📊 Cantidades de Mano de Obra</h3>
            <p>Ingresa las cantidades para cada código de mano de obra seleccionado.</p>
            
            <div class="quantities-grid">
              {#each codigosManoDeObraSeleccionados as codigo}
                <div class="quantity-item">
                  <div class="quantity-info">
                    <h4>{codigo.codigo} - {codigo.descripcion}</h4>
                    <p>Unidad: {codigo.unidad_medida} | Precio: ${codigo.precio}</p>
                  </div>
                  <div class="quantity-input">
                    <label for="cantidad-{codigo.id}">Cantidad:</label>
                    <input 
                      type="number" 
                      id="cantidad-{codigo.id}"
                      min="0" 
                      step="0.1"
                      value={cantidadesManoDeObra[codigo.id] || 0}
                      on:input={(e) => updateCantidadManoDeObra(codigo.id, parseFloat(e.target.value) || 0)}
                    />
                    <span class="unit">{codigo.unidad_medida}</span>
                  </div>
                </div>
              {/each}
            </div>
            
            <!-- Navegación -->
            <div class="step-navigation">
              <button class="nav-btn prev" on:click={prevStep}>
                ← Anterior
              </button>
              <button class="nav-btn next" on:click={nextStep}>
                Confirmar Mano de Obra →
              </button>
            </div>
          </div>
          
        {:else if currentStep === 4}
          <!-- Paso 4: Materiales Utilizados -->
          <div class="step-panel">
            <h3>🔧 Materiales Utilizados</h3>
            <p>Selecciona los materiales que fueron consumidos durante el trabajo.</p>
            
            <div class="items-grid">
              {#each materiales as item}
                <div class="item-card" class:selected={materialesUtilizados.some(i => i.id === item.id)}>
                  <div class="item-info">
                    <h4>{item.descripcion}</h4>
                    <p>Unidad: {item.unidad}</p>
                  </div>
                  <button 
                    class="toggle-btn" 
                    on:click={() => {
                      if (materialesUtilizados.some(i => i.id === item.id)) {
                        materialesUtilizados = materialesUtilizados.filter(i => i.id !== item.id);
                      } else {
                        materialesUtilizados = [...materialesUtilizados, { ...item, cantidad: 1 }];
                      }
                    }}
                  >
                    {materialesUtilizados.some(i => i.id === item.id) ? '✓' : '+'}
                  </button>
                </div>
              {/each}
            </div>
            
            <!-- Navegación -->
            <div class="step-navigation">
              <button class="nav-btn prev" on:click={prevStep}>
                ← Anterior
              </button>
              <button class="nav-btn next" on:click={nextStep}>
                Siguiente →
              </button>
            </div>
          </div>
          
        {:else if currentStep === 5}
          <!-- Paso 5: Materiales Recuperados -->
          <div class="step-panel">
            <h3>♻️ Materiales Recuperados</h3>
            <p>Selecciona los materiales que pudieron ser recuperados para reutilización.</p>
            
            <div class="items-grid">
              {#each materiales as item}
                <div class="item-card" class:selected={materialesRecuperados.some(i => i.id === item.id)}>
                  <div class="item-info">
                    <h4>{item.descripcion}</h4>
                    <p>Unidad: {item.unidad}</p>
                  </div>
                  <button 
                    class="toggle-btn" 
                    on:click={() => {
                      if (materialesRecuperados.some(i => i.id === item.id)) {
                        materialesRecuperados = materialesRecuperados.filter(i => i.id !== item.id);
                      } else {
                        materialesRecuperados = [...materialesRecuperados, { ...item, cantidad: 1 }];
                      }
                    }}
                  >
                    {materialesRecuperados.some(i => i.id === item.id) ? '✓' : '+'}
                  </button>
                </div>
              {/each}
            </div>
            
            <!-- Navegación -->
            <div class="step-navigation">
              <button class="nav-btn prev" on:click={prevStep}>
                ← Anterior
              </button>
              <button class="nav-btn next" on:click={nextStep}>
                Siguiente →
              </button>
            </div>
          </div>
          
        {:else if currentStep === 6}
          <!-- Paso 6: Documentación -->
          <div class="step-panel">
            <h3>📎 Documentación</h3>
            <p>Adjunta fotos del trabajo realizado y cualquier documento relevante.</p>
            
            <div class="file-upload">
              <input 
                type="file" 
                id="archivos"
                multiple
                accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
                on:change={handleFileChange}
              />
              <label for="archivos" class="file-upload-label">
                <span class="upload-icon">📁</span>
                <span>Seleccionar archivos</span>
              </label>
            </div>
            
            {#if archivosPreview.length > 0}
              <div class="files-preview">
                <h4>Archivos seleccionados:</h4>
                {#each archivosPreview as file, index}
                  <div class="file-item">
                    <div class="file-icon">
                      {#if file.type === 'image'}
                        🖼️
                      {:else if file.type === 'pdf'}
                        📄
                      {:else if file.type === 'excel'}
                        📊
                      {:else if file.type === 'word'}
                        📝
                      {:else}
                        📎
                      {/if}
                    </div>
                    <div class="file-info">
                      <div class="file-name">{file.name}</div>
                      <div class="file-size">{(file.size / 1024 / 1024).toFixed(2)} MB</div>
                    </div>
                    <button class="remove-file" on:click={() => removeFile(index)}>×</button>
                  </div>
                {/each}
              </div>
            {/if}
            
            <!-- Navegación -->
            <div class="step-navigation">
              <button class="nav-btn prev" on:click={prevStep}>
                ← Anterior
              </button>
              <button class="nav-btn next" on:click={nextStep}>
                Siguiente →
              </button>
            </div>
          </div>
          
        {:else if currentStep === 7}
          <!-- Paso 7: Resumen -->
          <div class="step-panel">
            <h3>✅ Resumen del Certificado</h3>
            <p>Revisa toda la información antes de enviar el certificado.</p>
            
            <div class="summary-grid">
              <div class="summary-section">
                <h4>📅 Fechas</h4>
                <p><strong>Inicio:</strong> {fechaInicio}</p>
                <p><strong>Fin:</strong> {fechaFin}</p>
              </div>
              
              <div class="summary-section">
                <h4>👷 Mano de Obra</h4>
                {#each manoDeObraSeleccionada as item}
                  <p>• {item.descripcion} ({item.cantidad} {item.unidad})</p>
                {/each}
              </div>
              
              <div class="summary-section">
                <h4>🔧 Materiales Utilizados</h4>
                {#each materialesUtilizados as item}
                  <p>• {item.descripcion} ({item.cantidad} {item.unidad})</p>
                {/each}
              </div>
              
              <div class="summary-section">
                <h4>♻️ Materiales Recuperados</h4>
                {#each materialesRecuperados as item}
                  <p>• {item.descripcion} ({item.cantidad} {item.unidad})</p>
                {/each}
              </div>
              
              <div class="summary-section">
                <h4>📎 Archivos</h4>
                <p>{archivosPreview.length} archivo(s) adjunto(s)</p>
              </div>
            </div>
            
            {#if observaciones}
              <div class="summary-section">
                <h4>📝 Observaciones</h4>
                <p>{observaciones}</p>
              </div>
            {/if}
            
            <!-- Navegación -->
            <div class="step-navigation">
              <button class="nav-btn prev" on:click={prevStep}>
                ← Anterior
              </button>
              <button 
                class="submit-btn" 
                on:click={submitCertificado} 
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Enviando...' : '🚀 Emitir Certificado'}
              </button>
            </div>
          </div>
        {/if}
      </div>
    </div>
  {/if}
</div>
{/if}

<style>
  .vertical-certification-form {
    width: 100%;
    max-width: 1400px;
    margin: 0 auto;
    background: white;
    border-radius: 8px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    overflow: hidden;
    display: flex;
    flex-direction: column;
    min-height: 80vh;
    max-height: 95vh;
  }
  
  .form-header {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 2rem 2rem;
    width: 100%;
    box-sizing: border-box;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  }
  
  .header-top {
    display: flex;
    align-items: center;
    gap: 1rem;
  }
  
  .back-to-task-btn {
    background: rgba(255,255,255,0.2);
    color: white;
    border: 1px solid rgba(255,255,255,0.3);
    padding: 0.75rem 1.5rem;
    border-radius: 6px;
    cursor: pointer;
    font-size: 1rem;
    font-weight: 500;
    transition: all 0.2s;
    white-space: nowrap;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  }
  
  .back-to-task-btn:hover {
    background: rgba(255,255,255,0.3);
    border-color: rgba(255,255,255,0.5);
  }
  
  .header-title {
    flex: 1;
    text-align: center;
  }
  
  .header-title h2 {
    margin: 0 0 0.25rem 0;
    font-size: 1.5rem;
    font-weight: 600;
  }
  
  .header-title p {
    margin: 0;
    opacity: 0.9;
    font-size: 0.85rem;
  }
  
  .form-content {
    display: flex;
    flex: 1;
    min-height: 0;
  }
  
  .progress-sidebar {
    width: 280px;
    background: #f8f9fa;
    border-right: 1px solid #dee2e6;
    padding: 1.5rem 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    overflow-y: auto;
  }
  
  .progress-step {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.3s ease;
    background: white;
    border: 2px solid transparent;
  }
  
  .progress-step:hover {
    background: #e9ecef;
  }
  
  .progress-step.active {
    background: #e3f2fd;
    border-color: #2196f3;
  }
  
  .progress-step.completed {
    background: #e8f5e8;
    border-color: #4caf50;
  }
  
  .step-icon {
    font-size: 1.5rem;
    width: 40px;
    text-align: center;
  }
  
  .step-info {
    flex: 1;
  }
  
  .step-title {
    font-weight: 600;
    font-size: 0.9rem;
    margin-bottom: 0.25rem;
  }
  
  .step-description {
    font-size: 0.75rem;
    color: #6c757d;
    line-height: 1.3;
  }
  
  .step-check {
    color: #4caf50;
    font-weight: bold;
    font-size: 1.2rem;
  }
  
  .step-content {
    flex: 1;
    padding: 1.5rem;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
  }
  
  .step-panel {
    max-width: 100%;
    margin: 0;
    flex: 1;
    display: flex;
    flex-direction: column;
  }
  
  .step-panel h3 {
    color: #495057;
    margin-bottom: 0.5rem;
    font-size: 1.5rem;
  }
  
  .step-panel p {
    color: #6c757d;
    margin-bottom: 2rem;
    line-height: 1.5;
  }
  
  .date-inputs {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
    margin-bottom: 2rem;
  }
  
  .input-group {
    margin-bottom: 1.5rem;
  }
  
  .input-group label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 500;
    color: #495057;
  }
  
  .input-group input,
  .input-group textarea {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid #ced4da;
    border-radius: 4px;
    font-size: 1rem;
    box-sizing: border-box;
  }
  
  .input-group textarea {
    resize: vertical;
    min-height: 100px;
  }
  
  .items-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 1rem;
    margin-bottom: 2rem;
  }
  
  .item-card {
    background: white;
    border: 2px solid #dee2e6;
    border-radius: 8px;
    padding: 1rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    cursor: pointer;
    transition: all 0.3s ease;
  }
  
  .item-card:hover {
    border-color: #007bff;
  }
  
  .item-card.selected {
    border-color: #28a745;
    background: #f8fff8;
  }
  
  .item-info h4 {
    margin: 0 0 0.25rem 0;
    font-size: 0.9rem;
    color: #495057;
  }
  
  .item-info p {
    margin: 0;
    font-size: 0.8rem;
    color: #6c757d;
  }
  
  .toggle-btn {
    background: #007bff;
    color: white;
    border: none;
    border-radius: 50%;
    width: 30px;
    height: 30px;
    cursor: pointer;
    font-size: 1rem;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .item-card.selected .toggle-btn {
    background: #28a745;
  }
  
  .file-upload {
    margin-bottom: 2rem;
  }
  
  .file-upload input[type="file"] {
    display: none;
  }
  
  .file-upload-label {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 2rem;
    border: 2px dashed #ced4da;
    border-radius: 10px;
    cursor: pointer;
    transition: all 0.3s ease;
    text-align: center;
    justify-content: center;
    font-size: 1.1rem;
  }
  
  .file-upload-label:hover {
    border-color: #667eea;
    background: #f8f9ff;
  }
  
  .upload-icon {
    font-size: 2rem;
  }
  
  .files-preview {
    margin-top: 2rem;
  }
  
  .files-preview h4 {
    margin-bottom: 1.5rem;
    color: #495057;
    font-size: 1.2rem;
  }
  
  .file-item {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem;
    background: #f8f9fa;
    border-radius: 8px;
    margin-bottom: 0.75rem;
  }
  
  .file-icon {
    font-size: 2rem;
  }
  
  .file-info {
    flex: 1;
  }
  
  .file-name {
    font-weight: 500;
    color: #495057;
    font-size: 1rem;
  }
  
  .file-size {
    font-size: 0.9rem;
    color: #6c757d;
  }
  
  .remove-file {
    background: #dc3545;
    color: white;
    border: none;
    border-radius: 50%;
    width: 30px;
    height: 30px;
    cursor: pointer;
    font-size: 1.2rem;
  }
  
  .summary-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 2rem;
    margin-bottom: 2rem;
  }
  
  .summary-section {
    background: #f8f9fa;
    padding: 1.5rem;
    border-radius: 8px;
  }
  
  .summary-section h4 {
    margin: 0 0 1rem 0;
    color: #495057;
    font-size: 1.2rem;
  }
  
  .summary-section p {
    margin: 0.5rem 0;
    color: #6c757d;
    font-size: 1rem;
  }
  
  .step-navigation {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: auto;
    padding-top: 1.5rem;
    border-top: 1px solid #dee2e6;
  }
  
  .nav-btn, .submit-btn {
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: 6px;
    font-size: 1rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s ease;
  }
  
  .nav-btn.prev {
    background: #6c757d;
    color: white;
  }
  
  .nav-btn.next {
    background: #007bff;
    color: white;
  }
  
  .submit-btn {
    background: #28a745;
    color: white;
  }
  
  .nav-btn:hover, .submit-btn:hover {
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(0,0,0,0.15);
  }
  
  .submit-btn:disabled {
    background: #6c757d;
    cursor: not-allowed;
    transform: none;
  }
  
  .success-screen {
    text-align: center;
    padding: 4rem 2rem;
  }
  
  .success-icon {
    font-size: 4rem;
    margin-bottom: 1rem;
  }
  
  .success-screen h2 {
    color: #28a745;
    margin-bottom: 1rem;
  }
  
  .success-btn {
    background: #007bff;
    color: white;
    border: none;
    padding: 1rem 2rem;
    border-radius: 6px;
    font-size: 1.1rem;
    cursor: pointer;
    margin-top: 2rem;
  }
  
  .loading-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 50vh;
    text-align: center;
  }
  
  .loading-spinner {
    width: 40px;
    height: 40px;
    border: 4px solid #f3f3f3;
    border-top: 4px solid #667eea;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 1rem;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  .item-details {
    display: flex;
    gap: 1rem;
    margin: 0.5rem 0;
    font-size: 0.9rem;
    color: #666;
  }
  
  .warning {
    color: #e74c3c;
    font-size: 0.8rem;
    margin: 0.25rem 0;
    font-weight: 500;
  }
  
  .quantities-grid {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    margin: 1.5rem 0;
  }
  
  .quantity-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    border: 1px solid #dee2e6;
    border-radius: 8px;
    background: white;
  }
  
  .quantity-info h4 {
    margin: 0 0 0.25rem 0;
    color: #495057;
  }
  
  .quantity-info p {
    margin: 0;
    color: #6c757d;
    font-size: 0.9rem;
  }
  
  .quantity-input {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  
  .quantity-input label {
    font-weight: 500;
    color: #495057;
  }
  
  .quantity-input input {
    width: 100px;
    padding: 0.5rem;
    border: 1px solid #ced4da;
    border-radius: 4px;
    text-align: center;
  }
  
  .quantity-input .unit {
    color: #6c757d;
    font-size: 0.9rem;
    min-width: 40px;
  }
</style>
