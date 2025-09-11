<script context="module" lang="ts">
  // Declaramos XLSX para que TypeScript lo reconozca, ya que se carga desde el CDN en app.html
  declare const XLSX: any;
</script>

<script lang="ts">
  import { invalidateAll, goto } from '$app/navigation';
  import { user } from '$lib/stores/auth';
  import CertificationProgress from '$lib/components/CertificationProgress.svelte';
  import TaskLifecycleTimeline from '$lib/components/TaskLifecycleTimeline.svelte';
  import AccionTareaPanel from '$lib/components/AccionTareaPanel.svelte';
  import { onDestroy } from 'svelte';
  import { showSuccess, showError, showConfirm } from '$lib/services/modalService';
  export let data;

  // --- Estado del Componente ---
  $: certificado = data.certificado;
  
  $: if (certificado?.tarea?.id) {
    loadInfoObservacion();
  }
  let isProcessingAction = false;
  let observacion = '';
  let archivoParaSubir: FileList | null = null;
  let archivosPreview: { name: string; type: string; size: number; previewUrl?: string }[] = [];
  let isUploading = false;
  let showLifecycle = false;
  
  // Variables para reasignación de proveedor
  let proveedores: any[] = [];
  
  // Variables para el sistema de observaciones
  let infoObservacion: any = null;
  let isLoadingObservacion = false;
  
  // --- Definiciones de Roles ---
  const supervisorRoles = [
    'supervisor de mantenimiento', 'supervisor de disponibilidad',
    'supervisor de soporte', 'supervisor de provision'
  ];
  $: userRol = $user?.rol.toLowerCase();

  // --- LÓGICA DE NAVEGACIÓN ---
  function handleGoBack() {
    // Verificar si hay una página de retorno específica (desde superadmin)
    const returnTo = localStorage.getItem('returnTo');
    if (returnTo) {
      localStorage.removeItem('returnTo'); // Limpiar después de usar
      goto(returnTo);
      return;
    }
    
    // Navegación normal por rol
    const rol = $user?.rol.toLowerCase();
    switch (rol) {
      case 'administrativo':
        goto('/admin/dashboard');
        break;
      case 'gerente':
        goto('/gerente/dashboard');
        break;
      case 'cerco':
        goto('/cerco/dashboard');
        break;
      case 'proveedor':
        goto('/proveedor/dashboard');
        break;
      case 'supervisor de mantenimiento':
      case 'supervisor de disponibilidad':
      case 'supervisor de soporte':
      case 'supervisor de provision':
        goto('/supervisor/dashboard');
        break;
      // El resto (inspectores) van al dashboard principal
      default:
        goto('/dashboard');
        break;
    }
  }

  // --- LÓGICA DE REASIGNACIÓN DE PROVEEDOR ---
  async function loadProveedores() {
    const token = localStorage.getItem('authToken');
    if (!token) return;
    
    try {
      const response = await fetch('http://localhost:3000/api/listas/proveedores', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        proveedores = (await response.json()).data || [];
      }
    } catch (error) {
      console.error('Error cargando proveedores:', error);
    }
  }
  
  async function handleReassignProvider(event: CustomEvent) {
    const { tareaId, nuevoProveedor: nuevoProveedorId } = event.detail;
    
    isProcessingAction = true;
    const token = localStorage.getItem('authToken');
    
    try {
      const response = await fetch(`http://localhost:3000/api/tareas/${tareaId}`, {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id_proveedor: nuevoProveedorId })
      });
      
      const result = await response.json();
      
      if (!response.ok) throw new Error(result.error || 'Error al reasignar proveedor');
      
      await showSuccess('Éxito', 'Proveedor reasignado exitosamente. Para ver los cambios, refresca la página.');
      
      // Invalidar para recargar datos
      await invalidateAll();
      
    } catch (error) {
      console.error('Error:', error);
      await showError('Error', error instanceof Error ? error.message : 'Error al reasignar proveedor');
    } finally {
      isProcessingAction = false;
    }
  }

  // --- LÓGICA GENERAL DE ACCIONES (APROBAR/OBSERVAR) ---
  async function handleAction(actionUrl: string, body: object | null = null, successMessage: string) {
    const confirmed = await showConfirm('Confirmar Acción', '¿Estás seguro de que quieres continuar con esta acción?');
    if (!confirmed) return;
    
    if ((actionUrl.includes('observar') || actionUrl.includes('rechazar')) && !observacion.trim()) {
        await showError('Error', 'Debes escribir un motivo en el campo de observación.');
        return;
    }

    isProcessingAction = true;
    const token = localStorage.getItem('authToken');
    try {
      const response = await fetch(`http://localhost:3000/api/tareas/${certificado?.tarea?.id}/${actionUrl}`, {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: body ? JSON.stringify(body) : null
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'La acción falló.');
      await showSuccess('Éxito', successMessage);
      await invalidateAll();
      handleGoBack(); // Vuelve al dashboard correspondiente después de la acción
    } catch (err) {
      if (err instanceof Error) await showError('Error', err.message);
    } finally {
      isProcessingAction = false;
    }
  }

  // --- LÓGICA PARA EL PANEL DEL ADMINISTRADOR (WO) ---
  let numeroWoEditable = '';
  $: mostrarPanelAdminWo = userRol === 'administrativo' && certificado?.tarea && 
                           certificado.tarea.estado === 'Asignada';
  
  // Determinar si el AccionTareaPanel debe mostrarse
  $: mostrarAccionTareaPanel = certificado?.tarea && userRol && (
    // Para inspectores, supervisores, etc. (no administrativos en estado Asignada)
    (userRol !== 'administrativo' || certificado.tarea.estado !== 'Asignada') &&
    // Solo si hay acciones disponibles
    (['inspector', 'supervisor de mantenimiento', 'supervisor de disponibilidad', 
      'supervisor de soporte', 'supervisor de provision', 'gerente', 'cerco'].includes(userRol.toLowerCase()) ||
     (userRol === 'administrativo' && certificado.tarea.estado !== 'Asignada'))
  );
                           
  $: if (certificado?.tarea?.numero_wo) {
    numeroWoEditable = certificado.tarea.numero_wo;
  } else {
    numeroWoEditable = '';
  }

  async function handleGuardarWo() {
    const woRegex = /^SA-\d{6}$/;
    if (!woRegex.test(numeroWoEditable)) {
        await showError('Error', 'Formato de WO inválido. Debe ser "SA-" seguido de 6 números (ej: SA-704059).');
        return;
    }
    const confirmed = await showConfirm('Confirmar WO', '¿Estás seguro de que quieres guardar este Número de WO?');
    if (!confirmed) return;
    
    isProcessingAction = true;
    const token = localStorage.getItem('authToken');
    try {
      const response = await fetch(`http://localhost:3000/api/tareas/${certificado?.tarea?.id}`, {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ numero_wo: numeroWoEditable })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Falló la actualización del WO.');

      await showSuccess('Éxito', 'Número de WO guardado exitosamente. Para ver los cambios, refresca la página.');
      invalidateAll();
    } catch (err) {
      if (err instanceof Error) await showError('Error', err.message);
    } finally {
      isProcessingAction = false;
    }
  }

  // --- FUNCIÓN DE DESCARGA DE ARCHIVOS ---
  async function handleDownload(event) {
    event.preventDefault(); // Prevenir el comportamiento por defecto del enlace
    
    const url = event.currentTarget.href;
    const fileName = event.currentTarget.download;
    
    try {
      console.log('Descargando archivo:', fileName);
      
      // Crear un enlace temporal para forzar la descarga
      const response = await fetch(url);
      const blob = await response.blob();
      
      // Crear un enlace temporal y hacer clic para descargar
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Limpiar la URL del objeto
      window.URL.revokeObjectURL(downloadUrl);
      
      console.log('Archivo descargado exitosamente');
    } catch (error) {
      console.error('Error al descargar archivo:', error);
      // Si falla la descarga programática, abrir en nueva pestaña como fallback
      window.open(url, '_blank');
    }
  }

  // --- FUNCIONES DEL SISTEMA DE OBSERVACIONES ---
  
  // Cargar información de observación
  async function loadInfoObservacion() {
    if (!certificado?.tarea?.id) return;
    
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`http://localhost:3000/api/tareas/${certificado?.tarea?.id}/info-observacion`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const result = await response.json();
        infoObservacion = result.data;
      }
    } catch (error) {
      console.error('Error al cargar info de observación:', error);
    }
  }
  
  // Manejar observación
  async function handleObservar(event: CustomEvent) {
    const { observacion, tareaId } = event.detail;
    
    isLoadingObservacion = true;
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`http://localhost:3000/api/tareas/${tareaId}/observar-${userRol}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ observacion })
      });
      
      if (response.ok) {
        await showSuccess('Éxito', 'Observación creada exitosamente');
        await invalidateAll();
        await loadInfoObservacion();
      } else {
        const error = await response.json();
        await showError('Error', `Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error al crear observación:', error);
      await showError('Error', 'Error al crear la observación');
    } finally {
      isLoadingObservacion = false;
    }
  }
  
  // Manejar pasar observación
  async function handlePasarObservacion(event: CustomEvent) {
    const { observacion_adicional, tareaId } = event.detail;
    
    isLoadingObservacion = true;
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`http://localhost:3000/api/tareas/${tareaId}/pasar-observacion`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ observacion_adicional })
      });
      
      if (response.ok) {
        await showSuccess('Éxito', 'Observación pasada exitosamente');
        await invalidateAll();
        await loadInfoObservacion();
      } else {
        const error = await response.json();
        await showError('Error', `Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error al pasar observación:', error);
      await showError('Error', 'Error al pasar la observación');
    } finally {
      isLoadingObservacion = false;
    }
  }
  
  // Manejar finalizar observación
  async function handleFinalizarObservacion(event: CustomEvent) {
    const { correccion, tareaId } = event.detail;
    
    isLoadingObservacion = true;
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`http://localhost:3000/api/tareas/${tareaId}/finalizar-observacion`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ correccion })
      });
      
      if (response.ok) {
        await showSuccess('Éxito', 'Observación finalizada exitosamente');
        await invalidateAll();
        await loadInfoObservacion();
      } else {
        const error = await response.json();
        await showError('Error', `Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error al finalizar observación:', error);
      await showError('Error', 'Error al finalizar la observación');
    } finally {
      isLoadingObservacion = false;
    }
  }
  
  // Manejar aprobación
  async function handleAprobar(event: CustomEvent) {
    const { tareaId, siguienteEstado, mensaje } = event.detail;
    
    isLoadingObservacion = true;
    try {
      const token = localStorage.getItem('authToken');
      const actionUrl = `aprobar-${userRol}`;
      const response = await fetch(`http://localhost:3000/api/tareas/${tareaId}/${actionUrl}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        await showSuccess('Éxito', mensaje);
        await invalidateAll();
        await loadInfoObservacion();
      } else {
        const error = await response.json();
        await showError('Error', `Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error al aprobar tarea:', error);
      await showError('Error', 'Error al aprobar la tarea');
    } finally {
      isLoadingObservacion = false;
    }
  }
  
  // --- LÓGICA DE EXPORTACIÓN A XLSX ---
  async function handleExportarMateriales() {
    const confirmed = await showConfirm('Confirmar Exportación', 'Esto registrará la exportación en el historial. ¿Deseas continuar?');
    if (!confirmed) return;

    isProcessingAction = true;
    const token = localStorage.getItem('authToken');
    try {
      const response = await fetch(`http://localhost:3000/api/tareas/${certificado?.tarea?.id}/exportar-materiales`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'No se pudo generar el reporte.');
      
      const { utilizados = [], recuperados = [] } = result.data || {};

      if (utilizados.length === 0 && recuperados.length === 0) {
        await showError('Error', 'No hay materiales para exportar en esta tarea.');
        isProcessingAction = false;
        return;
      }

      // Creamos un libro de trabajo y añadimos las hojas
      const workbook = XLSX.utils.book_new();

      if (utilizados.length > 0) {
        const wsUtilizados = XLSX.utils.json_to_sheet(utilizados);
        wsUtilizados['!cols'] = [{ wch: 15 }, { wch: 50 }, { wch: 10 }, { wch: 15 }, { wch: 15 }];
        XLSX.utils.book_append_sheet(workbook, wsUtilizados, "Materiales Utilizados");
      }

      if (recuperados.length > 0) {
        const wsRecuperados = XLSX.utils.json_to_sheet(recuperados);
        wsRecuperados['!cols'] = [{ wch: 15 }, { wch: 50 }, { wch: 10 }, { wch: 15 }, { wch: 15 }];
        XLSX.utils.book_append_sheet(workbook, wsRecuperados, "Materiales Recuperados");
      }
      
      XLSX.writeFile(workbook, `materiales_tarea_${certificado?.tarea?.id_tarea_texto}.xlsx`);
      
      await showSuccess('Éxito', 'Reporte de materiales generado.');
      invalidateAll();
    } catch (err) {
      if (err instanceof Error) await showError('Error', err.message);
    } finally {
      isProcessingAction = false;
    }
  }

  // --- LÓGICA DE MANEJO DE ARCHIVOS ---
  function handleFileChange(event: Event) {
    const target = event.target as HTMLInputElement;
    if (target.files) {
      // Acumular archivos en lugar de reemplazar
      const newFiles = Array.from(target.files);
      const existingFiles = archivoParaSubir ? Array.from(archivoParaSubir) : [];
      const allFiles = [...existingFiles, ...newFiles];
      
      // Crear nuevo FileList
      const dt = new DataTransfer();
      allFiles.forEach(file => dt.items.add(file));
      archivoParaSubir = dt.files;
      
      // Actualizar preview
      archivosPreview = Array.from(archivoParaSubir).map(file => ({
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
    if (archivoParaSubir) {
      const dt = new DataTransfer();
      Array.from(archivoParaSubir).forEach((file, i) => {
        if (i !== index) dt.items.add(file);
      });
      archivoParaSubir = dt.files;
      archivosPreview = archivosPreview.filter((_, i) => i !== index);
    }
  }

  // --- LÓGICA DE SUBIDA Y ELIMINACIÓN ---
  async function handleUpload() {
    if (!archivoParaSubir || archivoParaSubir.length === 0) {
      await showError('Error', 'Por favor, selecciona al menos un archivo.');
      return;
    }
    isUploading = true;
    const formData = new FormData();
    for (let i = 0; i < archivoParaSubir.length; i++) {
      formData.append('archivos', archivoParaSubir[i]);
    }
    const token = localStorage.getItem('authToken');
    try {
      const response = await fetch(`http://localhost:3000/api/tareas/${certificado?.tarea?.id}/add-adjunto`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      
      if (response.ok) {
        await showSuccess('Éxito', 'Archivos subidos exitosamente!');
        // Limpiar archivos seleccionados
        archivoParaSubir = null;
        archivosPreview = [];
        invalidateAll();
      } else {
        const errorData = await response.json();
        await showError('Error', `Error al subir los archivos: ${errorData.error || 'Error desconocido'}`);
      }
    } catch (error) {
      console.error('Error:', error);
      await showError('Error', 'Error de conexión al subir los archivos.');
    } finally {
      isUploading = false;
    }
  }
  async function handleDelete() {
    const confirmed = await showConfirm('Confirmar Eliminación', `¿Estás seguro de que quieres eliminar la tarea "${certificado?.tarea?.id_tarea_texto}"?`);
    if (confirmed) {
      isProcessingAction = true;
      try {
        const token = localStorage.getItem('authToken');
        const response = await fetch(`http://localhost:3000/api/tareas/${certificado?.tarea?.id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Falló la eliminación.');
        await showSuccess('Éxito', 'Tarea eliminada exitosamente.');
        handleGoBack();
      } catch (err) {
        if (err instanceof Error) await showError('Error', err.message);
      } finally {
        isProcessingAction = false;
      }
    }
  }

  // Limpiar URLs de objeto al destruir el componente
  onDestroy(() => {
    archivosPreview.forEach(file => {
      if (file.previewUrl) {
        URL.revokeObjectURL(file.previewUrl);
      }
    });
  });
</script>

<!-- Componente de Timeline del Ciclo de Vida -->
{#if certificado && certificado.tarea}
  <TaskLifecycleTimeline 
    tareaId={certificado?.tarea?.id} 
    bind:isVisible={showLifecycle} 
  />
{/if}

<div class="detalle-container">
  <button on:click={handleGoBack} class="back-link">← Volver al dashboard</button>
  
  {#if certificado && certificado.tarea}
    


    <!-- Botón Mostrar Ciclo de Vida (solo para tareas finalizadas) -->
    {#if certificado.tarea.estado === 'Finalizada - Aprobada'}
      <div class="action-panel lifecycle-panel">
        <h3>📊 Información del Ciclo de Vida</h3>
        <p>Esta tarea ha sido completada. Puedes ver el historial completo de todos los eventos que ocurrieron durante su procesamiento.</p>
        <div class="panel-actions">
          <button class="lifecycle-button" on:click={() => showLifecycle = true}>
            🕒 Mostrar Ciclo de Vida
          </button>
        </div>
      </div>
    {/if}

    
    <!-- ================================================================= -->
    <!-- VISUALIZACIÓN DE DETALLES DE LA TAREA -->
    <!-- ================================================================= -->
    <div class="header">
      <h1>Detalle: {certificado.tarea.id_tarea_texto}</h1>
      <div class="actions">
        {#if (userRol === 'inspector' || userRol === 'supervisor de mantenimiento') && certificado.tarea.estado.toLowerCase().includes('pendiente')}
            <a href="/task/{certificado.tarea.id}/edit" class="edit-button">Editar Certificado</a>
        {/if}
        {#if userRol === 'inspector' && certificado.tarea.estado.toLowerCase() === 'asignada'}
            <button class="delete-button" on:click={handleDelete}>Cancelar Tarea</button>
        {/if}
        {#if userRol === 'proveedor' && certificado.tarea.estado === 'Asignada' && certificado.tarea.numero_wo}
          <a href="/task/{certificado.tarea.id}/close" class="close-task-button">📋 Certificar</a>
        {/if}
      </div>
    </div>
    
    <div class="info-grid">
      <div class="info-item">
        <strong>Estado:</strong>
        <span>{certificado.tarea.estado}</span>
      </div>
      <div class="info-item">
        <strong>Número de WO:</strong>
        <span>{certificado.tarea.numero_wo || 'No asignado'}</span>
      </div>
      <div class="info-item">
        <strong>Proveedor:</strong>
        <span>{certificado.tarea.proveedor_nombre || 'No asignado'}</span>
      </div>
       <div class="info-item">
        <strong>Centro / Almacén:</strong>
        <span>{certificado.tarea.proveedor_centro || 'N/A'} / {certificado.tarea.proveedor_almacen || 'N/A'}</span>
      </div>
      <div class="info-item">
        <strong>Inspector:</strong>
        <span>{certificado.tarea.inspector_nombre || 'No asignado'}</span>
      </div>
       <div class="info-item">
        <strong>Supervisor:</strong>
        <span>{certificado.tarea.supervisor_nombre || 'No asignado'}</span>
      </div>
      <div class="info-item full-width">
        <strong>Descripción:</strong>
        <p>{certificado.tarea.descripcion}</p>
      </div>
      <div class="info-item full-width">
        <strong>Dirección:</strong>
        <p>{certificado.tarea.direccion}</p>
      </div>
      
      <!-- Archivos Adjuntos integrados en la información -->
      <div class="info-item full-width">
        <strong>📎 Archivos Adjuntos:</strong>
        {#if certificado.adjuntos && certificado.adjuntos.length > 0}
          <div class="files-grid">
            {#each certificado.adjuntos as adjunto}
              <div class="file-item existing">
                <div class="file-icon">
                  {#if adjunto.nombre_archivo.match(/\.(jpe?g|png|gif|webp|svg)$/i)}
                    🖼️
                  {:else if adjunto.nombre_archivo.match(/\.pdf$/i)}
                    📄
                  {:else if adjunto.nombre_archivo.match(/\.(xlsx?|csv)$/i)}
                    📊
                  {:else if adjunto.nombre_archivo.match(/\.docx?$/i)}
                    📝
                  {:else}
                    📎
                  {/if}
                </div>
                <div class="file-info">
                  <div class="file-name">{adjunto.nombre_archivo}</div>
                </div>
                <a href="http://localhost:3000{adjunto.url_archivo}" download="{adjunto.nombre_archivo}" class="download-btn" title="Descargar archivo" on:click={handleDownload}>
                  ⬇️
                </a>
              </div>
            {/each}
          </div>
        {:else}
          <p class="no-files">No hay archivos adjuntos para esta tarea.</p>
        {/if}
        
        <!-- Sección de subida de nuevos archivos (solo para proveedores en certificación) -->
        {#if userRol === 'proveedor' && certificado.tarea.estado === 'Pendiente Certificación Inspector'}
          <div class="upload-section">
            <h4>📤 Subir nuevos archivos</h4>
          
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
          
          <!-- Preview de archivos seleccionados -->
          {#if archivosPreview.length > 0}
            <div class="files-preview">
              <h5>Archivos seleccionados para subir:</h5>
              <div class="files-grid">
                {#each archivosPreview as file, index}
                  <div class="file-item preview">
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
                    <button class="remove-file" on:click={() => removeFile(index)} title="Quitar archivo">×</button>
                  </div>
                {/each}
              </div>
              
              <button 
                type="button" 
                class="upload-button" 
                on:click={handleUpload} 
                disabled={isUploading}
              >
                {isUploading ? '⏳ Subiendo...' : '📤 Subir Archivos'}
              </button>
            </div>
          {/if}
          </div>
        {/if}
      </div>
    </div>

      <!-- ================================================================= -->
      <!-- PANEL DE ACCIÓN UNIFICADO - AL FINAL PARA REVISIÓN COMPLETA -->
      <!-- ================================================================= -->
      {#if mostrarAccionTareaPanel}
        <AccionTareaPanel 
          tarea={certificado.tarea}
          userRole={userRol || ''}
          {infoObservacion}
          isLoading={isLoadingObservacion}
          {proveedores}
          onLoadProveedores={loadProveedores}
          on:aprobar={handleAprobar}
          on:observar={handleObservar}
          on:pasarObservacion={handlePasarObservacion}
          on:finalizarObservacion={handleFinalizarObservacion}
          on:reasignar={handleReassignProvider}
        />
      {/if}
      <!-- Panel del Administrativo (Gestión de WO) -->
      {#if mostrarPanelAdminWo}
        <div class="action-panel admin-panel wo-panel">
          <h3>Gestión de WO</h3>
          <p>Ingresa o modifica el Número de WO para esta tarea.</p>
          <div class="form-group">
              <label for="numeroWo">Número de WO</label>
              <input type="text" id="numeroWo" placeholder="Ej: SA-704059" bind:value={numeroWoEditable}>
          </div>
          <div class="panel-actions">
            <button class="approve-button" on:click={handleGuardarWo} disabled={isProcessingAction}>Guardar WO</button>
          </div>
        </div>
      {/if}
  {:else if data.error}
    <div class="error-container">
      <h2>Error al cargar la tarea</h2>
      <p class="error">Error: {data.error}</p>
      <button on:click={handleGoBack} class="back-link">← Volver al dashboard</button>
    </div>
  {:else}
    <div class="loading-container">
      <p>Cargando detalles de la tarea...</p>
    </div>
  {/if}
</div>

<style>
  /* --- Estilos de Paneles de Acción --- */
  .action-panel { border-radius: 8px; padding: 1.5rem; margin-bottom: 2rem; }
  .action-panel h3 { margin-top: 0; }
  .action-panel p { margin-bottom: 1rem; color: #555; }
  .action-panel .form-group { margin-bottom: 1rem; }
  .action-panel label { display: block; margin-bottom: 0.5rem; }
  .action-panel textarea, .action-panel input { width: 100%; padding: 0.5rem; font-family: inherit; font-size: 1rem; border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box; }
  .action-panel textarea { margin-bottom: 1rem; }
  .panel-actions { display: flex; gap: 1rem; margin-top: 1rem; justify-content: flex-end; }
  .panel-actions button { border: none; padding: 0.75rem 1.5rem; border-radius: 4px; cursor: pointer; font-size: 1rem; color: white; transition: background-color 0.2s; }
  .panel-actions button:disabled { background-color: #ccc; cursor: not-allowed; }
  .approve-button { background-color: #28a745; }
  .approve-button:hover:not(:disabled) { background-color: #218838; }
  .reject-button { background-color: #fd7e14; }
  .reject-button:hover:not(:disabled) { background-color: #e66a00; }

  /* --- Colores por Rol --- */
  .inspector-panel { background-color: #fffbe6; border: 1px solid #ffe58f; }
  .inspector-panel h3 { color: #856404; }
  .admin-panel { background-color: #e6f7ff; border: 1px solid #91d5ff; }
  .admin-panel h3 { color: #0050b3; }
  .supervisor-panel { background-color: #f0e6ff; border: 1px solid #d3b5ff; }
  .supervisor-panel h3 { color: #5600b3; }
  .gerente-panel { background-color: #e6fffb; border: 1px solid #87e8de; }
  .gerente-panel h3 { color: #007065; }
  .cerco-panel { background-color: #fff0f6; border: 1px solid #ffadd2; }
  .cerco-panel h3 { color: #c41d7f; }

  /* --- Estilos Generales --- */
  .detalle-container { 
    font-family: sans-serif; 
    max-width: 900px; 
    margin: 2rem auto; 
    padding: 0 1rem;
    min-height: 100vh;
    overflow-x: hidden;
  }
  .back-link { text-decoration: none; color: #007bff; margin-bottom: 2rem; display: inline-block; background: none; border: none; padding: 0; font-size: inherit; font-family: inherit; cursor: pointer; }
  .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
  .actions { display: flex; gap: 0.5rem; }
  .edit-button, .delete-button, .close-task-button { display: inline-block; padding: 0.5rem 1rem; color: white; text-decoration: none; border: none; border-radius: 4px; cursor: pointer; font-size: 1rem; }
  .edit-button { background-color: #17a2b8; }
  .delete-button { background-color: #dc3545; }
  .close-task-button { background-color: #6f42c1; }
  .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; background-color: #f9f9f9; padding: 2rem; border-radius: 8px; border: 1px solid #ddd; }
  .info-item { display: flex; flex-direction: column; }
  .info-item.full-width { grid-column: 1 / -1; }
  .info-item strong { margin-bottom: 0.5rem; color: #555; }
  .info-item span, .info-item p { margin: 0; font-size: 1.1rem; }
  .error { color: red; text-align: center; padding: 1rem; background-color: #fff0f0; border: 1px solid red; border-radius: 8px; }
  
  /* --- Estilos de Certificado y Adjuntos --- */
  .certificado.tarea-details, .adjuntos-section { margin-top: 2rem; background-color: #f9f9f9; padding: 2rem; border-radius: 8px; border: 1px solid #ddd; }
  .certificado.tarea-section { margin-bottom: 2rem; }
  h2, h3 { margin-top: 0; border-bottom: 1px solid #ccc; padding-bottom: 0.5rem; }
  table { width: 100%; border-collapse: collapse; }
  th, td { text-align: left; padding: 0.75rem; border-bottom: 1px solid #eee; }
  th { font-weight: bold; background-color: #f2f2f2; }
  .info-item-fechas { display: flex; gap: 2rem; margin-bottom: 1rem; font-style: italic; color: #555; }
  ul { list-style: none; padding: 0; }
  li a { text-decoration: none; color: #007bff; }

  /* --- Estilos Mejorados para Adjuntos --- */
  .adjuntos-section h3 {
    color: #333;
    margin-bottom: 1.5rem;
  }

  .existing-files {
    margin-bottom: 2rem;
  }

  .existing-files h4 {
    color: #555;
    margin-bottom: 1rem;
    font-size: 1.1rem;
  }

  .upload-section h4 {
    color: #555;
    margin-bottom: 1rem;
    font-size: 1.1rem;
  }

  .files-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 1rem;
    margin-bottom: 1rem;
  }

  .file-item {
    display: flex;
    align-items: center;
    padding: 1rem;
    background: white;
    border: 1px solid #ddd;
    border-radius: 8px;
    transition: all 0.2s ease;
  }

  .file-item:hover {
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    transform: translateY(-1px);
  }

  .file-item.existing {
    border-left: 4px solid #28a745;
  }

  .file-item.preview {
    border-left: 4px solid #007bff;
  }

  .file-icon {
    font-size: 1.5rem;
    margin-right: 1rem;
    min-width: 2rem;
    text-align: center;
  }

  .file-info {
    flex: 1;
    min-width: 0;
  }

  .file-name {
    font-weight: 500;
    color: #333;
    word-break: break-word;
    margin-bottom: 0.25rem;
  }

  .file-size {
    font-size: 0.85rem;
    color: #666;
  }

  .download-btn {
    color: #007bff;
    text-decoration: none;
    font-size: 1.2rem;
    padding: 0.5rem;
    border-radius: 4px;
    transition: background-color 0.2s;
  }

  .download-btn:hover {
    background-color: #f8f9fa;
  }

  .remove-file {
    background: #dc3545;
    color: white;
    border: none;
    border-radius: 50%;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    font-size: 1rem;
    font-weight: bold;
    transition: background-color 0.2s;
  }

  .remove-file:hover {
    background: #c82333;
  }

  .file-upload {
    margin-bottom: 1rem;
  }

  .file-upload input[type="file"] {
    display: none;
  }

  .file-upload-label {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1.5rem;
    background: #007bff;
    color: white;
    border-radius: 6px;
    cursor: pointer;
    transition: background-color 0.2s;
    font-size: 1rem;
  }

  .file-upload-label:hover {
    background: #0056b3;
  }

  .upload-icon {
    font-size: 1.2rem;
  }

  .files-preview h5 {
    color: #555;
    margin-bottom: 1rem;
    font-size: 1rem;
  }

  .upload-button {
    background: #28a745;
    color: white;
    border: none;
    padding: 0.75rem 1.5rem;
    border-radius: 6px;
    font-size: 1rem;
    cursor: pointer;
    transition: background-color 0.2s;
    margin-top: 1rem;
  }

  .upload-button:hover:not(:disabled) {
    background: #218838;
  }

  .upload-button:disabled {
    background: #6c757d;
    cursor: not-allowed;
  }

  .no-files {
    color: #666;
    font-style: italic;
    text-align: center;
    padding: 2rem;
    background: #f8f9fa;
    border-radius: 6px;
    border: 1px dashed #dee2e6;
  }

  /* --- Nuevos Estilos para Exportación --- */
  .export-section {
    margin-top: 2rem;
    background-color: #fffbe6;
    padding: 1.5rem 2rem;
    border-radius: 8px;
    border: 1px solid #ffe58f;
  }
  .export-section h3 {
    margin-top: 0;
    color: #856404;
    border-bottom: 1px solid #ffe58f;
    padding-bottom: 0.5rem;
  }
  .last-export {
    font-style: italic;
    color: #555;
  }
  .export-button {
    background-color: #007bff;
    color: white;
    border: none;
    padding: 0.75rem 1.5rem;
    border-radius: 5px;
    font-size: 1rem;
    cursor: pointer;
    transition: background-color 0.2s;
  }
  .export-button:hover {
    background-color: #0056b3;
  }
  .export-button:disabled {
    background-color: #ccc;
    cursor: not-allowed;
  }
  
  .lifecycle-panel {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
  }
  
  .lifecycle-panel h3 {
    color: white;
  }
  
  .lifecycle-panel p {
    color: rgba(255, 255, 255, 0.9);
  }
  
  .lifecycle-button {
    background: rgba(255, 255, 255, 0.2);
    color: white;
    border: 2px solid rgba(255, 255, 255, 0.3);
    padding: 0.75rem 1.5rem;
    border-radius: 8px;
    cursor: pointer;
    font-size: 1rem;
    font-weight: 500;
    transition: all 0.3s ease;
    backdrop-filter: blur(10px);
  }
  
  .lifecycle-button:hover {
    background: rgba(255, 255, 255, 0.3);
    border-color: rgba(255, 255, 255, 0.5);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  }
  
  .error-container {
    text-align: center;
    padding: 2rem;
    background: #f8f9fa;
    border: 1px solid #dee2e6;
    border-radius: 8px;
    margin: 2rem 0;
  }
  
  .error-container h2 {
    color: #dc3545;
    margin-bottom: 1rem;
  }
  
  .error-container .error {
    color: #dc3545;
    font-weight: 500;
    margin-bottom: 1.5rem;
  }
  
  .loading-container {
    text-align: center;
    padding: 2rem;
    background: #f8f9fa;
    border: 1px solid #dee2e6;
    border-radius: 8px;
    margin: 2rem 0;
  }
  
  .loading-container p {
    color: #6c757d;
    font-size: 1.1rem;
  }
  
  /* Estilos para panel de reasignación */
  .reassign-panel {
    background: linear-gradient(135deg, #ffc107 0%, #ff9800 100%);
    color: #212529;
  }
  
  .reassign-button {
    background: #ffc107;
    color: #212529;
    border: 2px solid #ff9800;
    font-weight: 600;
  }
  
  .reassign-button:hover {
    background: #ff9800;
    border-color: #f57c00;
  }
  
  .reassign-form {
    margin-top: 1rem;
  }
  
  .reassign-form .form-group {
    margin-bottom: 1rem;
  }
  
  .reassign-form label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 600;
    color: #212529;
  }
  
  .reassign-form select {
    width: 100%;
    padding: 0.75rem;
    border: 2px solid #ff9800;
    border-radius: 6px;
    background: white;
    font-size: 1rem;
  }
  
  .reassign-form select:focus {
    outline: none;
    border-color: #f57c00;
    box-shadow: 0 0 0 3px rgba(255, 152, 0, 0.2);
  }
  
  /* Separación para el panel de WO */
  .wo-panel {
    margin-top: 2rem;
  }
  
  /* Mejoras para scroll y responsive */
  @media (max-width: 768px) {
    .detalle-container {
      margin: 1rem auto;
      padding: 0 0.5rem;
    }
    
    .info-grid {
      grid-template-columns: 1fr;
      gap: 1rem;
      padding: 1rem;
    }
    
    .header {
      flex-direction: column;
      align-items: flex-start;
      gap: 1rem;
    }
    
    .actions {
      width: 100%;
      justify-content: flex-start;
    }
  }
  
  /* Asegurar que el body pueda hacer scroll */
  :global(body) {
    overflow-x: hidden;
  }
</style>