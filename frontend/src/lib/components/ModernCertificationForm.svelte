<script lang="ts">
  import { onMount, createEventDispatcher } from 'svelte';
  import { startLoading, stopLoading } from '$lib/utils/loadingUtils';
  import { showSuccess, showError } from '$lib/services/modalService';
  
  const dispatch = createEventDispatcher();
  
  export let tarea: any;
  export let manoDeObra: any[] = [];
  export let materiales: any[] = [];
  
  // Estados del formulario
  let currentStep = 1;
  let isSubmitting = false;
  let showSuccessScreen = false;
  
  // Datos del certificado
  let fechaInicio = '';
  let fechaFin = '';
  let observaciones = '';
  
  // Items seleccionados
  let manoDeObraSeleccionada: any[] = [];
  let materialesUtilizados: any[] = [];
  let materialesRecuperados: any[] = [];
  
  // Favoritos
  let manoDeObraFavoritos: any[] = [];
  let materialesFavoritos: any[] = [];
  
  // Estados de UI
  let showManoDeObraList = false;
  let showMaterialesUtilizadosList = false;
  let showMaterialesRecuperadosList = false;
  
  // Estados para costo mínimo diario
  let costoMinimoDiario = 735000;
  let validacionCostoMinimo: any = null;
  let isLoadingValidacion = false;
  
  // Archivos - IMPLEMENTACIÓN QUE FUNCIONA (copiada de CreateTaskForm)
  let archivos: FileList | null = null;
  let archivosPreview: { name: string; type: string; size: number; previewUrl?: string }[] = [];
  
  // Validaciones
  const today = new Date().toISOString().split('T')[0];
  const minDate = new Date(tarea.fecha_creacion).toISOString().split('T')[0];
  
  // Función para validar fechas
  function validateDates() {
    const errors = [];
    
    if (fechaInicio && fechaFin) {
      const inicio = new Date(fechaInicio);
      const fin = new Date(fechaFin);
      const hoy = new Date();
      hoy.setHours(23, 59, 59, 999); // Fin del día actual
      
      // Validar que la fecha de inicio no sea futura (puede ser hasta hoy)
      if (inicio > hoy) {
        errors.push('La fecha de inicio no puede ser futura');
      }
      
      // Validar que la fecha de fin no sea futura (puede ser hasta hoy)
      if (fin > hoy) {
        errors.push('La fecha de fin no puede ser futura');
      }
      
      // Validar que la fecha de fin no sea anterior a la de inicio
      if (fin < inicio) {
        errors.push('La fecha de fin no puede ser anterior a la fecha de inicio');
      }
    }
    
    return errors;
  }
  
  // Estado de errores de validación
  let validationErrors: string[] = [];
  
  // Validar fechas cuando cambien
  $: if (fechaInicio || fechaFin) {
    validationErrors = validateDates();
  }
  
  // Configuración de pasos
  const steps = [
    { id: 1, title: 'Fechas de Trabajo', icon: '📅', description: 'Define las fechas de inicio y fin del trabajo' },
    { id: 2, title: 'Mano de Obra', icon: '👷', description: 'Selecciona el personal utilizado' },
    { id: 3, title: 'Materiales Utilizados', icon: '🔧', description: 'Indica los materiales consumidos' },
    { id: 4, title: 'Materiales Recuperados', icon: '♻️', description: 'Lista los materiales recuperados' },
    { id: 5, title: 'Documentación', icon: '📎', description: 'Adjunta fotos y documentos' },
    { id: 6, title: 'Resumen', icon: '✅', description: 'Revisa y confirma la información' }
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
        if (manoDeObraSeleccionada.length === 0) {
          alert('Debes seleccionar al menos un tipo de mano de obra.');
          return false;
        }
        return true;
      case 3:
        // Los materiales utilizados son opcionales
        return true;
      case 4:
        // Los materiales recuperados son opcionales
        return true;
      case 5:
        // Los archivos son opcionales
        return true;
      case 6:
        return true;
      default:
        return true;
    }
  }
  
  // Funciones para manejar favoritos
  function toggleFavoritoManoDeObra(item: any) {
    const index = manoDeObraFavoritos.findIndex(i => i.id === item.id);
    if (index > -1) {
      manoDeObraFavoritos = manoDeObraFavoritos.filter(i => i.id !== item.id);
    } else {
      manoDeObraFavoritos = [...manoDeObraFavoritos, item];
    }
    // Guardar en localStorage
    localStorage.setItem('manoDeObraFavoritos', JSON.stringify(manoDeObraFavoritos));
  }
  
  function toggleFavoritoMaterial(item: any) {
    const index = materialesFavoritos.findIndex(i => i.id === item.id);
    if (index > -1) {
      materialesFavoritos = materialesFavoritos.filter(i => i.id !== item.id);
    } else {
      materialesFavoritos = [...materialesFavoritos, item];
    }
    // Guardar en localStorage
    localStorage.setItem('materialesFavoritos', JSON.stringify(materialesFavoritos));
  }
  
  function isFavoritoManoDeObra(item: any): boolean {
    return manoDeObraFavoritos.some(i => i.id === item.id);
  }
  
  function isFavoritoMaterial(item: any): boolean {
    return materialesFavoritos.some(i => i.id === item.id);
  }
  
  // Funciones para manejar selecciones
  function addManoDeObra(item: any) {
    const index = manoDeObraSeleccionada.findIndex(i => i.id === item.id);
    if (index === -1) {
      // Para el código 5020982, siempre cantidad 1 (se calcula automáticamente)
      const cantidadInicial = item.codigo === '5020982' ? 1 : 1;
      manoDeObraSeleccionada = [...manoDeObraSeleccionada, { ...item, cantidad: cantidadInicial }];
      validarCostoMinimoDiario(manoDeObraSeleccionada);
    }
  }
  
  function removeManoDeObra(itemId: number) {
    manoDeObraSeleccionada = manoDeObraSeleccionada.filter(i => i.id !== itemId);
    validarCostoMinimoDiario(manoDeObraSeleccionada);
  }
  
  function addMaterialUtilizado(item: any) {
    const index = materialesUtilizados.findIndex(i => i.id === item.id);
    if (index === -1) {
      materialesUtilizados = [...materialesUtilizados, { ...item, cantidad: 1 }];
    }
  }
  
  function removeMaterialUtilizado(itemId: number) {
    materialesUtilizados = materialesUtilizados.filter(i => i.id !== itemId);
  }
  
  function addMaterialRecuperado(item: any) {
    const index = materialesRecuperados.findIndex(i => i.id === item.id);
    if (index === -1) {
      materialesRecuperados = [...materialesRecuperados, { ...item, cantidad: 1 }];
    }
  }
  
  function removeMaterialRecuperado(itemId: number) {
    materialesRecuperados = materialesRecuperados.filter(i => i.id !== itemId);
  }
  
  function updateCantidad(lista: any[], itemId: number, cantidad: number) {
    const nuevaLista = lista.map(item => {
      // No permitir cambios en el código 5020982 (costo mínimo diario)
      if (item.codigo === '5020982') {
        return { ...item, cantidad: 1 }; // Siempre cantidad 1 para el cálculo automático
      }
      return item.id === itemId ? { ...item, cantidad: Math.max(1, cantidad) } : item;
    });
    
    // Si es mano de obra, validar costo mínimo diario
    if (lista === manoDeObraSeleccionada) {
      validarCostoMinimoDiario(nuevaLista);
    }
    
    return nuevaLista;
  }
  
  // Función para validar costo mínimo diario
  async function validarCostoMinimoDiario(manoDeObra: any[]) {
    if (manoDeObra.length === 0) {
      validacionCostoMinimo = null;
      return;
    }
    
    isLoadingValidacion = true;
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('http://localhost:3000/api/costo-minimo/validar', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ manoDeObraSeleccionada: manoDeObra })
      });
      
      if (response.ok) {
        const result = await response.json();
        validacionCostoMinimo = result.data;
      } else {
        console.error('Error validando costo mínimo diario');
        validacionCostoMinimo = null;
      }
    } catch (error) {
      console.error('Error validando costo mínimo diario:', error);
      validacionCostoMinimo = null;
    } finally {
      isLoadingValidacion = false;
    }
  }
  
  // Función para obtener el valor del costo mínimo diario
  async function cargarCostoMinimoDiario() {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('http://localhost:3000/api/costo-minimo/valor', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const result = await response.json();
        costoMinimoDiario = result.data.valor;
      }
    } catch (error) {
      console.error('Error cargando costo mínimo diario:', error);
    }
  }
  
  // Manejo de archivos - VERSIÓN FORZADA CON ALERT
  function handleFileChange(event: Event) {
    const target = event.target as HTMLInputElement;
    if (target.files) {
      
      // Acumular archivos en lugar de reemplazar
      const newFiles = Array.from(target.files);
      const existingFiles = archivos ? Array.from(archivos) : [];
      const allFiles = [...existingFiles, ...newFiles];
      
      
      // Crear nuevo FileList
      const dt = new DataTransfer();
      allFiles.forEach(file => dt.items.add(file));
      archivos = dt.files;
      
      // Actualizar preview
      archivosPreview = Array.from(archivos).map(file => ({
        name: file.name,
        type: getFileType(file.name),
        size: file.size,
        previewUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined
      }));
      
    }
  }
  
  function getFileType(fileName: string): string {
    if (/\.(jpe?g|png|gif|webp|svg)$/i.test(fileName)) return 'image';
    if (/\.pdf$/i.test(fileName)) return 'pdf';
    if (/\.(xlsx?|csv)$/i.test(fileName)) return 'excel';
    if (/\.docx?$/i.test(fileName)) return 'word';
    return 'other';
  }
  
  function removeFile(index: number) {
    
    if (archivos) {
      const dt = new DataTransfer();
      Array.from(archivos).forEach((file, i) => {
        if (i !== index) dt.items.add(file);
      });
      archivos = dt.files;
      archivosPreview = archivosPreview.filter((_, i) => i !== index);
    }
    
  }
  
  // Envío del certificado
  async function submitCertificado() {
    if (!validateCurrentStep()) return;
    
    isSubmitting = true;
    startLoading('Enviando certificado...');
    
    try {
      const token = localStorage.getItem('authToken');
      if (!token) throw new Error('Token no encontrado');
      
      const formData = new FormData();
      const datosCertificado = {
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin,
        observaciones: observaciones,
        mano_de_obra: manoDeObraSeleccionada,
        materiales_utilizados: materialesUtilizados,
        materiales_recuperados: materialesRecuperados
      };
      
      formData.append('formData', JSON.stringify(datosCertificado));
      
      if (archivos) {
        for (let i = 0; i < archivos.length; i++) {
          formData.append('archivos', archivos[i]);
        }
      }
      
      const response = await fetch(`http://localhost:3000/api/tareas/${tarea.id}/emitir-certificado`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Error al emitir el certificado');
      }
      
      showSuccessScreen = true;
      dispatch('certificadoEmitido', { tarea: tarea, certificado: result });
      
      // Mostrar mensaje de éxito usando el sistema de modales
      await showSuccess('Certificado emitido exitosamente', 'El certificado ha sido enviado para revisión del inspector. La tarea ahora está en estado "Pendiente Certificación Inspector/Supervisor".');
      
      // Redirigir al dashboard del proveedor y refrescar
      setTimeout(() => {
        window.location.href = '/proveedor/dashboard';
        window.location.reload();
      }, 100);
      
    } catch (error) {
      console.error('Error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      await showError('Error', `Error al emitir el certificado: ${errorMessage}`);
    } finally {
      isSubmitting = false;
      stopLoading();
    }
  }
  
  // Cargar favoritos desde localStorage
  onMount(() => {
    // Cargar favoritos de mano de obra
    const savedManoDeObraFavoritos = localStorage.getItem('manoDeObraFavoritos');
    if (savedManoDeObraFavoritos) {
      manoDeObraFavoritos = JSON.parse(savedManoDeObraFavoritos);
    }
    
    // Cargar favoritos de materiales
    const savedMaterialesFavoritos = localStorage.getItem('materialesFavoritos');
    if (savedMaterialesFavoritos) {
      materialesFavoritos = JSON.parse(savedMaterialesFavoritos);
    }
    
    // Cargar costo mínimo diario
    cargarCostoMinimoDiario();
    
    return () => {
      archivosPreview.forEach(file => {
        if (file.previewUrl) {
          URL.revokeObjectURL(file.previewUrl);
        }
      });
    };
  });
</script>

<div class="certification-form">
  {#if showSuccessScreen}
    <div class="success-screen">
      <div class="success-icon">🎉</div>
      <h2>¡Certificado Emitido Exitosamente!</h2>
      <p>Tu certificado ha sido enviado y está siendo revisado por el inspector.</p>
      <p>Puedes seguir el progreso desde tu dashboard.</p>
      <button class="success-btn" on:click={() => dispatch('close')}>
        Volver al Dashboard
      </button>
    </div>
  {:else}
    <!-- Header con progreso -->
    <div class="form-header">
      <div class="header-top">
        <button on:click={() => dispatch('close')} class="back-to-task-btn">
          ← Volver a la tarea
        </button>
        <div class="header-title">
          <h2>📋 Certificado de Trabajo</h2>
          <p>Tarea: {tarea.id_tarea_texto} - {tarea.descripcion}</p>
        </div>
      </div>
      
      <!-- Indicador de pasos -->
      <div class="steps-indicator">
        {#each steps as step}
          <div 
            class="step" 
            class:active={currentStep === step.id}
            class:completed={currentStep > step.id}
            on:click={() => goToStep(step.id)}
          >
            <div class="step-icon">{step.icon}</div>
            <div class="step-info">
              <div class="step-title">{step.title}</div>
              <div class="step-description">{step.description}</div>
            </div>
          </div>
        {/each}
      </div>
    </div>
    
    <!-- Contenido del formulario -->
    <div class="form-content">
      {#if currentStep === 1}
        <!-- Paso 1: Fechas -->
        <div class="step-content">
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
          
          <!-- Mostrar errores de validación -->
          {#if validationErrors.length > 0}
            <div class="validation-errors">
              <h4>⚠️ Errores de validación:</h4>
              <ul>
                {#each validationErrors as error}
                  <li>{error}</li>
                {/each}
              </ul>
            </div>
          {/if}
          
          <div class="input-group">
            <label for="observaciones">Observaciones (Opcional)</label>
            <textarea 
              id="observaciones"
              bind:value={observaciones}
              placeholder="Agrega cualquier observación relevante sobre el trabajo realizado..."
              rows="3"
            ></textarea>
          </div>
          
          <!-- Navegación integrada -->
          <div class="step-navigation">
            <button class="nav-btn next" on:click={nextStep}>
              Siguiente →
            </button>
          </div>
        </div>
        
      {:else if currentStep === 2}
        <!-- Paso 2: Mano de Obra -->
        <div class="step-content">
          <h3>👷 Mano de Obra Utilizada</h3>
          <p>Selecciona los tipos de personal que participaron en el trabajo.</p>
          
          <div class="selection-layout">
            <!-- Lista de mano de obra disponible -->
            <div class="available-items">
              <div class="section-header">
                <h4>📋 Mano de Obra Disponible</h4>
                <button 
                  class="toggle-btn" 
                  on:click={() => showManoDeObraList = !showManoDeObraList}
                >
                  {showManoDeObraList ? 'Ocultar' : 'Mostrar'} Lista Completa
                </button>
              </div>
              
              <div class="items-list">
                <!-- Favoritos siempre visibles -->
                {#if manoDeObraFavoritos.length > 0}
                  <div class="favorites-section">
                    <h5>⭐ Favoritos</h5>
                    {#each manoDeObraFavoritos as item}
                      <div class="list-item">
                        <div class="item-info">
                          <span class="item-name">{item.descripcion}</span>
                          <span class="item-unit">({item.unidad})</span>
                        </div>
                        <div class="item-actions">
                          <button 
                            class="favorite-btn active" 
                            on:click={() => toggleFavoritoManoDeObra(item)}
                            title="Quitar de favoritos"
                          >
                            ⭐
                          </button>
                          <button 
                            class="add-btn" 
                            on:click={() => addManoDeObra(item)}
                            disabled={manoDeObraSeleccionada.some(i => i.id === item.id)}
                          >
                            {manoDeObraSeleccionada.some(i => i.id === item.id) ? '✓' : '+'}
                          </button>
                        </div>
                      </div>
                    {/each}
                  </div>
                {/if}
                
                <!-- Resto de items (solo cuando se muestra la lista completa) -->
                {#if showManoDeObraList}
                  <div class="all-items-section">
                    <h5>📝 Todos los Items</h5>
                    {#each manoDeObra.filter(item => !manoDeObraFavoritos.some(fav => fav.id === item.id)) as item}
                      <div class="list-item">
                        <div class="item-info">
                          <span class="item-name">{item.descripcion}</span>
                          <span class="item-unit">({item.unidad})</span>
                        </div>
                        <div class="item-actions">
                          <button 
                            class="favorite-btn" 
                            on:click={() => toggleFavoritoManoDeObra(item)}
                            title="Agregar a favoritos"
                          >
                            ⭐
                          </button>
                          <button 
                            class="add-btn" 
                            on:click={() => addManoDeObra(item)}
                            disabled={manoDeObraSeleccionada.some(i => i.id === item.id)}
                          >
                            {manoDeObraSeleccionada.some(i => i.id === item.id) ? '✓' : '+'}
                          </button>
                        </div>
                      </div>
                    {/each}
                  </div>
                {/if}
              </div>
            </div>
            
            <!-- Lista de items seleccionados -->
            <div class="selected-items">
              <h4>✅ Mano de Obra Seleccionada</h4>
              {#if manoDeObraSeleccionada.length === 0}
                <div class="empty-state">
                  <p>No hay mano de obra seleccionada</p>
                  <p>Usa la lista de la izquierda para agregar items</p>
                </div>
              {:else}
                <div class="selected-list">
                  {#each manoDeObraSeleccionada as item}
                    <div class="selected-item">
                      <div class="item-info">
                        <span class="item-name">{item.descripcion}</span>
                        <span class="item-unit">({item.unidad})</span>
                        {#if item.codigo === '5020982'}
                          <span class="auto-calculated-label">🔄 Se calcula automáticamente</span>
                        {/if}
                      </div>
                      <div class="quantity-controls">
                        {#if item.codigo === '5020982'}
                          <label>Cantidad:</label>
                          <input 
                            type="number" 
                            value="1"
                            disabled
                            class="disabled-input"
                            title="Este valor se calcula automáticamente"
                          />
                        {:else}
                          <label>Cantidad:</label>
                          <input 
                            type="number" 
                            min="1" 
                            value={item.cantidad}
                            on:change={(e) => {
                              const target = e.target as HTMLInputElement;
                              manoDeObraSeleccionada = updateCantidad(manoDeObraSeleccionada, item.id, parseInt(target.value));
                            }}
                          />
                        {/if}
                        <button 
                          class="remove-btn" 
                          on:click={() => removeManoDeObra(item.id)}
                          title="Quitar"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  {/each}
                </div>
                
                <!-- Validación del Costo Mínimo Diario -->
                {#if validacionCostoMinimo}
                  <div class="costo-minimo-validation">
                    <h5>💰 Validación Costo Mínimo Diario</h5>
                    {#if validacionCostoMinimo.valido}
                      <div class="validation-success">
                        <div class="validation-info">
                          <p><strong>Costo mínimo diario:</strong> ${costoMinimoDiario.toLocaleString()}</p>
                          <p><strong>Subtotal otros items:</strong> ${validacionCostoMinimo.calculo.subtotalOtrosItems.toLocaleString()}</p>
                          {#if validacionCostoMinimo.calculo.necesitaCostoMinimo}
                            <p class="costo-minimo-aplicado">
                              <strong>✅ Costo mínimo diario aplicado:</strong> ${validacionCostoMinimo.calculo.diferencia.toLocaleString()}
                            </p>
                          {:else}
                            <p class="no-costo-minimo">
                              <strong>✅ No se requiere costo mínimo diario</strong>
                            </p>
                          {/if}
                        </div>
                      </div>
                    {:else}
                      <div class="validation-error">
                        <div class="error-icon">⚠️</div>
                        <div class="error-message">
                          <p><strong>Error:</strong> {validacionCostoMinimo.error}</p>
                          <p>Por favor, revise las cantidades o elimine el costo mínimo diario de la selección.</p>
                        </div>
                      </div>
                    {/if}
                  </div>
                {/if}
                
                {#if isLoadingValidacion}
                  <div class="loading-validation">
                    <p>⏳ Validando costo mínimo diario...</p>
                  </div>
                {/if}
              {/if}
            </div>
          </div>
          
          <!-- Navegación integrada -->
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
        <!-- Paso 3: Materiales Utilizados -->
        <div class="step-content">
          <h3>🔧 Materiales Utilizados</h3>
          <p>Selecciona los materiales que fueron consumidos durante el trabajo.</p>
          
          <div class="selection-layout">
            <!-- Lista de materiales disponibles -->
            <div class="available-items">
              <div class="section-header">
                <h4>📋 Materiales Disponibles</h4>
                <button 
                  class="toggle-btn" 
                  on:click={() => showMaterialesUtilizadosList = !showMaterialesUtilizadosList}
                >
                  {showMaterialesUtilizadosList ? 'Ocultar' : 'Mostrar'} Lista Completa
                </button>
              </div>
              
              <div class="items-list">
                <!-- Favoritos siempre visibles -->
                {#if materialesFavoritos.length > 0}
                  <div class="favorites-section">
                    <h5>⭐ Favoritos</h5>
                    {#each materialesFavoritos as item}
                      <div class="list-item">
                        <div class="item-info">
                          <span class="item-name">{item.descripcion}</span>
                          <span class="item-unit">({item.unidad})</span>
                        </div>
                        <div class="item-actions">
                          <button 
                            class="favorite-btn active" 
                            on:click={() => toggleFavoritoMaterial(item)}
                            title="Quitar de favoritos"
                          >
                            ⭐
                          </button>
                          <button 
                            class="add-btn" 
                            on:click={() => addMaterialUtilizado(item)}
                            disabled={materialesUtilizados.some(i => i.id === item.id)}
                          >
                            {materialesUtilizados.some(i => i.id === item.id) ? '✓' : '+'}
                          </button>
                        </div>
                      </div>
                    {/each}
                  </div>
                {/if}
                
                <!-- Resto de items (solo cuando se muestra la lista completa) -->
                {#if showMaterialesUtilizadosList}
                  <div class="all-items-section">
                    <h5>📝 Todos los Items</h5>
                    {#each materiales.filter(item => !materialesFavoritos.some(fav => fav.id === item.id)) as item}
                      <div class="list-item">
                        <div class="item-info">
                          <span class="item-name">{item.descripcion}</span>
                          <span class="item-unit">({item.unidad})</span>
                        </div>
                        <div class="item-actions">
                          <button 
                            class="favorite-btn" 
                            on:click={() => toggleFavoritoMaterial(item)}
                            title="Agregar a favoritos"
                          >
                            ⭐
                          </button>
                          <button 
                            class="add-btn" 
                            on:click={() => addMaterialUtilizado(item)}
                            disabled={materialesUtilizados.some(i => i.id === item.id)}
                          >
                            {materialesUtilizados.some(i => i.id === item.id) ? '✓' : '+'}
                          </button>
                        </div>
                      </div>
                    {/each}
                  </div>
                {/if}
              </div>
            </div>
            
            <!-- Lista de materiales seleccionados -->
            <div class="selected-items">
              <h4>✅ Materiales Utilizados Seleccionados</h4>
              {#if materialesUtilizados.length === 0}
                <div class="empty-state">
                  <p>No hay materiales seleccionados</p>
                  <p>Usa la lista de la izquierda para agregar items</p>
                </div>
              {:else}
                <div class="selected-list">
                  {#each materialesUtilizados as item}
                    <div class="selected-item">
                      <div class="item-info">
                        <span class="item-name">{item.descripcion}</span>
                        <span class="item-unit">({item.unidad})</span>
                      </div>
                      <div class="quantity-controls">
                        <label>Cantidad:</label>
                        <input 
                          type="number" 
                          min="1" 
                          value={item.cantidad}
                          on:change={(e) => {
                            const target = e.target as HTMLInputElement;
                            materialesUtilizados = updateCantidad(materialesUtilizados, item.id, parseInt(target.value));
                          }}
                        />
                        <button 
                          class="remove-btn" 
                          on:click={() => removeMaterialUtilizado(item.id)}
                          title="Quitar"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  {/each}
                </div>
              {/if}
            </div>
          </div>
          
          <!-- Navegación integrada -->
          <div class="step-navigation">
            <button class="nav-btn prev" on:click={prevStep}>
              ← Anterior
            </button>
            <button class="nav-btn next" on:click={nextStep}>
              Siguiente →
            </button>
          </div>
        </div>
        
      {:else if currentStep === 4}
        <!-- Paso 4: Materiales Recuperados -->
        <div class="step-content">
          <h3>♻️ Materiales Recuperados</h3>
          <p>Selecciona los materiales que pudieron ser recuperados para reutilización.</p>
          
          <div class="selection-layout">
            <!-- Lista de materiales disponibles -->
            <div class="available-items">
              <div class="section-header">
                <h4>📋 Materiales Disponibles</h4>
                <button 
                  class="toggle-btn" 
                  on:click={() => showMaterialesRecuperadosList = !showMaterialesRecuperadosList}
                >
                  {showMaterialesRecuperadosList ? 'Ocultar' : 'Mostrar'} Lista Completa
                </button>
              </div>
              
              <div class="items-list">
                <!-- Favoritos siempre visibles -->
                {#if materialesFavoritos.length > 0}
                  <div class="favorites-section">
                    <h5>⭐ Favoritos</h5>
                    {#each materialesFavoritos as item}
                      <div class="list-item">
                        <div class="item-info">
                          <span class="item-name">{item.descripcion}</span>
                          <span class="item-unit">({item.unidad})</span>
                        </div>
                        <div class="item-actions">
                          <button 
                            class="favorite-btn active" 
                            on:click={() => toggleFavoritoMaterial(item)}
                            title="Quitar de favoritos"
                          >
                            ⭐
                          </button>
                          <button 
                            class="add-btn" 
                            on:click={() => addMaterialRecuperado(item)}
                            disabled={materialesRecuperados.some(i => i.id === item.id)}
                          >
                            {materialesRecuperados.some(i => i.id === item.id) ? '✓' : '+'}
                          </button>
                        </div>
                      </div>
                    {/each}
                  </div>
                {/if}
                
                <!-- Resto de items (solo cuando se muestra la lista completa) -->
                {#if showMaterialesRecuperadosList}
                  <div class="all-items-section">
                    <h5>📝 Todos los Items</h5>
                    {#each materiales.filter(item => !materialesFavoritos.some(fav => fav.id === item.id)) as item}
                      <div class="list-item">
                        <div class="item-info">
                          <span class="item-name">{item.descripcion}</span>
                          <span class="item-unit">({item.unidad})</span>
                        </div>
                        <div class="item-actions">
                          <button 
                            class="favorite-btn" 
                            on:click={() => toggleFavoritoMaterial(item)}
                            title="Agregar a favoritos"
                          >
                            ⭐
                          </button>
                          <button 
                            class="add-btn" 
                            on:click={() => addMaterialRecuperado(item)}
                            disabled={materialesRecuperados.some(i => i.id === item.id)}
                          >
                            {materialesRecuperados.some(i => i.id === item.id) ? '✓' : '+'}
                          </button>
                        </div>
                      </div>
                    {/each}
                  </div>
                {/if}
              </div>
            </div>
            
            <!-- Lista de materiales seleccionados -->
            <div class="selected-items">
              <h4>✅ Materiales Recuperados Seleccionados</h4>
              {#if materialesRecuperados.length === 0}
                <div class="empty-state">
                  <p>No hay materiales seleccionados</p>
                  <p>Usa la lista de la izquierda para agregar items</p>
                </div>
              {:else}
                <div class="selected-list">
                  {#each materialesRecuperados as item}
                    <div class="selected-item">
                      <div class="item-info">
                        <span class="item-name">{item.descripcion}</span>
                        <span class="item-unit">({item.unidad})</span>
                      </div>
                      <div class="quantity-controls">
                        <label>Cantidad:</label>
                        <input 
                          type="number" 
                          min="1" 
                          value={item.cantidad}
                          on:change={(e) => {
                            const target = e.target as HTMLInputElement;
                            materialesRecuperados = updateCantidad(materialesRecuperados, item.id, parseInt(target.value));
                          }}
                        />
                        <button 
                          class="remove-btn" 
                          on:click={() => removeMaterialRecuperado(item.id)}
                          title="Quitar"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  {/each}
                </div>
              {/if}
            </div>
          </div>
          
          <!-- Navegación integrada -->
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
        <!-- Paso 5: Documentación -->
        <div class="step-content">
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
          
          <!-- Navegación integrada -->
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
        <!-- Paso 6: Resumen -->
        <div class="step-content">
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
                <p>{item.descripcion}: {item.cantidad} {item.unidad}</p>
              {/each}
            </div>
            
            <div class="summary-section">
              <h4>🔧 Materiales Utilizados</h4>
              {#each materialesUtilizados as item}
                <p>{item.descripcion}: {item.cantidad} {item.unidad}</p>
              {/each}
            </div>
            
            <div class="summary-section">
              <h4>♻️ Materiales Recuperados</h4>
              {#each materialesRecuperados as item}
                <p>{item.descripcion}: {item.cantidad} {item.unidad}</p>
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
          
          <!-- Navegación integrada -->
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
  {/if}
</div>

<style>
  .certification-form {
    width: 100%;
    max-width: 1200px;
    margin: 0 auto;
    background: white;
    border-radius: 8px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    overflow: hidden;
    display: flex;
    flex-direction: column;
    min-height: auto;
    max-height: 100vh;
  }
  
  .form-header {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 1rem 1.5rem;
    width: 100%;
    box-sizing: border-box;
    flex-shrink: 0;
  }
  
  .header-top {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 1rem;
  }
  
  .back-to-task-btn {
    background: rgba(255,255,255,0.2);
    color: white;
    border: 1px solid rgba(255,255,255,0.3);
    padding: 0.5rem 1rem;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.9rem;
    transition: all 0.2s;
    white-space: nowrap;
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
    font-size: 1.3rem;
    font-weight: 600;
  }
  
  .header-title p {
    margin: 0;
    opacity: 0.9;
    font-size: 0.85rem;
  }
  
  .steps-indicator {
    display: flex;
    justify-content: space-between;
    gap: 0.3rem;
    width: 100%;
  }
  
  .step {
    display: flex;
    align-items: center;
    gap: 0.2rem;
    padding: 0.3rem 0.4rem;
    background: rgba(255,255,255,0.1);
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.3s ease;
    flex: 1;
    font-size: 0.7rem;
    min-width: 0;
  }
  
  .step:hover {
    background: rgba(255,255,255,0.2);
  }
  
  .step.active {
    background: rgba(255,255,255,0.3);
    transform: scale(1.05);
  }
  
  .step.completed {
    background: rgba(40, 167, 69, 0.3);
  }
  
  .step-icon {
    font-size: 1.2rem;
  }
  
  .step-info {
    text-align: left;
  }
  
  .step-title {
    font-weight: 600;
    font-size: 0.7rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  
  .step-description {
    font-size: 0.6rem;
    opacity: 0.8;
    display: none; /* Ocultar descripción para ahorrar espacio */
  }
  
  .form-content {
    padding: 1rem 1.5rem;
    width: 100%;
    box-sizing: border-box;
    background: white;
    flex: 1;
    overflow-y: auto;
    max-height: calc(100vh - 200px);
  }
  
  .step-content h3 {
    color: #495057;
    margin-bottom: 0.5rem;
    font-size: 1.5rem;
  }
  
  .step-content p {
    color: #6c757d;
    margin-bottom: 2rem;
    font-size: 1.1rem;
  }
  
  .date-inputs {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 3rem;
    margin-bottom: 3rem;
  }
  
  .input-group {
    margin-bottom: 2rem;
  }
  
  .input-group label {
    display: block;
    margin-bottom: 0.75rem;
    font-weight: 600;
    color: #495057;
    font-size: 1.1rem;
  }
  
  .input-group input,
  .input-group textarea {
    width: 100%;
    padding: 1.25rem;
    border: 2px solid #e9ecef;
    border-radius: 10px;
    font-size: 1.2rem;
    transition: border-color 0.3s ease;
  }
  
  .input-group input:focus,
  .input-group textarea:focus {
    outline: none;
    border-color: #667eea;
  }
  
  .error-message {
    color: #dc3545;
    font-size: 0.9rem;
    margin-top: 0.5rem;
    padding: 0.5rem;
    background: #f8d7da;
    border: 1px solid #f5c6cb;
    border-radius: 4px;
  }
  
  .validation-errors {
    background: #f8d7da;
    border: 1px solid #f5c6cb;
    border-radius: 8px;
    padding: 1rem;
    margin: 1rem 0;
  }
  
  .validation-errors h4 {
    color: #721c24;
    margin: 0 0 0.5rem 0;
    font-size: 1rem;
  }
  
  .validation-errors ul {
    margin: 0;
    padding-left: 1.5rem;
  }
  
  .validation-errors li {
    color: #721c24;
    margin-bottom: 0.25rem;
  }
  
  .selection-layout {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 2rem;
    margin-top: 1rem;
    min-height: 50vh;
    max-height: 60vh;
  }
  
  .available-items, .selected-items {
    background: #f8f9fa;
    border-radius: 12px;
    padding: 1.5rem;
    min-height: 50vh;
    max-height: 60vh;
    overflow-y: auto;
  }
  
  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }
  
  .section-header h4 {
    margin: 0;
    color: #495057;
  }
  
  .toggle-btn {
    background: #007bff;
    color: white;
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.9rem;
  }
  
  .toggle-btn:hover {
    background: #0056b3;
  }
  
  .items-list {
    max-height: 60vh;
    overflow-y: auto;
  }
  
  .favorites-section, .all-items-section {
    margin-bottom: 1.5rem;
  }
  
  .favorites-section h5, .all-items-section h5 {
    margin: 0 0 1rem 0;
    color: #495057;
    font-size: 1rem;
    border-bottom: 1px solid #dee2e6;
    padding-bottom: 0.5rem;
  }
  
  .list-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem;
    background: white;
    border: 1px solid #dee2e6;
    border-radius: 6px;
    margin-bottom: 0.5rem;
  }
  
  .list-item .item-info {
    flex: 1;
  }
  
  .item-name {
    font-weight: 500;
    color: #495057;
    display: block;
  }
  
  .item-unit {
    font-size: 0.9rem;
    color: #6c757d;
  }
  
  .item-actions {
    display: flex;
    gap: 0.5rem;
  }
  
  .favorite-btn {
    background: none;
    border: 1px solid #dee2e6;
    border-radius: 4px;
    padding: 0.25rem 0.5rem;
    cursor: pointer;
    font-size: 1rem;
  }
  
  .favorite-btn:hover {
    background: #f8f9fa;
  }
  
  .favorite-btn.active {
    background: #fff3cd;
    border-color: #ffeaa7;
  }
  
  .add-btn {
    background: #28a745;
    color: white;
    border: none;
    border-radius: 4px;
    padding: 0.25rem 0.75rem;
    cursor: pointer;
    font-size: 0.9rem;
  }
  
  .add-btn:hover:not(:disabled) {
    background: #218838;
  }
  
  .add-btn:disabled {
    background: #6c757d;
    cursor: not-allowed;
  }
  
  .empty-state {
    text-align: center;
    padding: 2rem;
    color: #6c757d;
  }
  
  .empty-state p {
    margin: 0.5rem 0;
  }
  
  .selected-list {
    max-height: 60vh;
    overflow-y: auto;
  }
  
  .selected-item {
    background: white;
    border: 1px solid #dee2e6;
    border-radius: 6px;
    padding: 1rem;
    margin-bottom: 0.75rem;
  }
  
  .selected-item .item-info {
    margin-bottom: 0.75rem;
  }
  
  .quantity-controls {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  
  .quantity-controls label {
    font-size: 0.9rem;
    color: #495057;
    margin: 0;
  }
  
  .quantity-controls input {
    width: 80px;
    padding: 0.5rem;
    border: 1px solid #ced4da;
    border-radius: 4px;
    font-size: 0.9rem;
  }
  
  .remove-btn {
    background: #dc3545;
    color: white;
    border: none;
    border-radius: 50%;
    width: 24px;
    height: 24px;
    cursor: pointer;
    font-size: 1rem;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .remove-btn:hover {
    background: #c82333;
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
    margin-top: 2rem;
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
    padding: 3rem 2rem;
  }
  
  .success-icon {
    font-size: 4rem;
    margin-bottom: 1rem;
  }
  
  .success-screen h2 {
    color: #28a745;
    margin-bottom: 1rem;
  }
  
  .success-screen p {
    color: #6c757d;
    margin-bottom: 1rem;
  }
  
  .success-btn {
    background: #28a745;
    color: white;
    border: none;
    padding: 1rem 2rem;
    border-radius: 6px;
    font-size: 1rem;
    cursor: pointer;
    margin-top: 1rem;
  }
  
  /* Estilos para validación del costo mínimo diario */
  .costo-minimo-validation {
    margin-top: 1.5rem;
    padding: 1rem;
    border-radius: 8px;
    border: 1px solid #dee2e6;
    background: #f8f9fa;
  }
  
  .costo-minimo-validation h5 {
    margin: 0 0 1rem 0;
    color: #495057;
    font-size: 1rem;
  }
  
  .validation-success {
    background: #d4edda;
    border: 1px solid #c3e6cb;
    border-radius: 6px;
    padding: 1rem;
  }
  
  .validation-info p {
    margin: 0.5rem 0;
    font-size: 0.9rem;
  }
  
  .costo-minimo-aplicado {
    color: #155724;
    font-weight: 600;
    background: #c3e6cb;
    padding: 0.5rem;
    border-radius: 4px;
    margin-top: 0.5rem;
  }
  
  .no-costo-minimo {
    color: #155724;
    font-weight: 600;
  }
  
  .validation-error {
    background: #f8d7da;
    border: 1px solid #f5c6cb;
    border-radius: 6px;
    padding: 1rem;
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
  }
  
  .error-icon {
    font-size: 1.5rem;
    color: #721c24;
  }
  
  .error-message p {
    margin: 0.25rem 0;
    font-size: 0.9rem;
    color: #721c24;
  }
  
  .error-message p:first-child {
    font-weight: 600;
  }
  
  .loading-validation {
    text-align: center;
    padding: 1rem;
    color: #6c757d;
    font-style: italic;
  }
  
  /* Estilos para campo deshabilitado y leyenda automática */
  .auto-calculated-label {
    display: inline-block;
    background: #e3f2fd;
    color: #1976d2;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    font-size: 0.75rem;
    font-weight: 600;
    margin-left: 0.5rem;
    border: 1px solid #bbdefb;
  }
  
  .disabled-input {
    background-color: #f8f9fa !important;
    color: #6c757d !important;
    cursor: not-allowed !important;
    border: 1px solid #dee2e6 !important;
    opacity: 0.7;
  }
  
  .disabled-input:focus {
    outline: none !important;
    box-shadow: none !important;
  }
  
</style>
