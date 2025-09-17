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
  import VerticalCertificationForm from '$lib/components/VerticalCertificationForm.svelte';
  import { onDestroy } from 'svelte';
  import { showSuccess, showError, showConfirm } from '$lib/services/modalService';
  export let data;

  // --- Estado del Componente ---
  $: certificado = data.certificado;
  
  $: if (certificado?.tarea?.id) {
    loadInfoObservacion();
    
    // Calcular métricas si la tarea está finalizada
    if (certificado.tarea.estado === 'Finalizada - Aprobada') {
      calcularMetricasCicloVida();
    }
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
  
  // Variables para edición de certificados
  let showEditCertificateModal = false;
  
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
    // Para inspectores, supervisores, proveedores, etc. (no administrativos en estado Asignada)
    (userRol !== 'administrativo' || certificado.tarea.estado !== 'Asignada') &&
    // Solo si hay acciones disponibles
    (['inspector', 'supervisor de mantenimiento', 'supervisor de disponibilidad', 
      'supervisor de soporte', 'supervisor de provision', 'gerente', 'cerco', 'proveedor'].includes(userRol.toLowerCase()) ||
     // Para administrativos: solo mostrar panel en "Pendiente Aprobación Administración"
     (userRol === 'administrativo' && certificado.tarea.estado === 'Pendiente Aprobación Administración'))
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
  async function handleDownload(event: Event) {
    event.preventDefault(); // Prevenir el comportamiento por defecto del enlace
    
    const target = event.currentTarget as HTMLAnchorElement;
    if (!target) return;
    
    const url = target.href;
    const fileName = target.download;
    
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
      
      // Mapear roles del frontend a nombres de endpoint del backend
      const roleMapping: { [key: string]: string } = {
        'administrativo': 'admin',
        'gerente': 'gerente',
        'cerco': 'cerco',
        'inspector': 'inspector',
        'supervisor de mantenimiento': 'supervisor',
        'supervisor de disponibilidad': 'supervisor',
        'supervisor de soporte': 'supervisor',
        'supervisor de provision': 'supervisor'
      };
      
      const currentUserRole = userRol || '';
      const endpointRole = roleMapping[currentUserRole] || currentUserRole;
      const actionUrl = `aprobar-${endpointRole}`;
      const response = await fetch(`http://localhost:3000/api/tareas/${tareaId}/${actionUrl}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const result = await response.json();
        // Usar el mensaje del backend si está disponible, sino usar el mensaje del componente
        const mensajeFinal = result.message || mensaje;
        await showSuccess('Éxito', mensajeFinal);
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
  
  // Manejar edición de certificado
  function handleEditarCertificado(event: CustomEvent) {
    const { tareaId } = event.detail;
    showEditCertificateModal = true;
  }
  
  // --- LÓGICA DE MÉTRICAS DEL CICLO DE VIDA ---
  let metricasCicloVida = {
    diasCreacionAFinalizacion: 0,
    diasCreacionACertificado: 0,
    diasCertificadoAFinalizacion: 0,
    montoConIva: 0,
    montoSinIva: 0
  };

  async function calcularMetricasCicloVida() {
    if (!certificado?.tarea?.id) return;

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`http://localhost:3000/api/tareas/${certificado.tarea.id}/historial`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const result = await response.json();
        const historial = result.data || [];
        
        // Encontrar fechas clave
        const creacion = historial.find((h: any) => h.accion === 'Creación');
        const certificadoEmitido = historial.find((h: any) => h.accion === 'Certificado Emitido');
        const finalizacion = historial.find((h: any) => h.accion === 'Aprobado por CERCO');

        if (creacion && finalizacion) {
          const fechaCreacion = new Date(creacion.fecha_evento);
          const fechaFinalizacion = new Date(finalizacion.fecha_evento);
          metricasCicloVida.diasCreacionAFinalizacion = Math.ceil((fechaFinalizacion.getTime() - fechaCreacion.getTime()) / (1000 * 60 * 60 * 24));
        }

        if (creacion && certificadoEmitido) {
          const fechaCreacion = new Date(creacion.fecha_evento);
          const fechaCertificado = new Date(certificadoEmitido.fecha_evento);
          metricasCicloVida.diasCreacionACertificado = Math.ceil((fechaCertificado.getTime() - fechaCreacion.getTime()) / (1000 * 60 * 60 * 24));
        }

        if (certificadoEmitido && finalizacion) {
          const fechaCertificado = new Date(certificadoEmitido.fecha_evento);
          const fechaFinalizacion = new Date(finalizacion.fecha_evento);
          metricasCicloVida.diasCertificadoAFinalizacion = Math.ceil((fechaFinalizacion.getTime() - fechaCertificado.getTime()) / (1000 * 60 * 60 * 24));
        }
      }

      // Calcular montos desde la tabla tarea_mano_de_obra
      if (certificado?.tarea?.id) {
        try {
          const response = await fetch(`http://localhost:3000/api/tareas/${certificado.tarea.id}/mano-de-obra`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          
          if (response.ok) {
            const result = await response.json();
            const manoDeObra = result.data || [];
            
            let totalSinIva = 0;
            
            // Sumar mano de obra desde la tabla
            manoDeObra.forEach((item: any) => {
              totalSinIva += (item.precio_calculado || 0);
            });
            
            metricasCicloVida.montoSinIva = totalSinIva;
            metricasCicloVida.montoConIva = totalSinIva * 1.21; // IVA 21%
          }
        } catch (error) {
          console.error('Error obteniendo mano de obra:', error);
        }
      }
    } catch (error) {
      console.error('Error calculando métricas:', error);
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
        // Recargar la página para refrescar los datos
        window.location.reload();
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
    


    <!-- Resumen del Ciclo de Vida (solo para tareas finalizadas) -->
    {#if certificado.tarea.estado === 'Finalizada - Aprobada'}
      <div class="lifecycle-summary">
        <div class="lifecycle-header">
          <div class="lifecycle-title">
            <h3>📊 Resumen del Ciclo de Vida</h3>
            <p>Tarea completada exitosamente</p>
          </div>
          <button class="lifecycle-button" on:click={() => showLifecycle = true}>
            🕒 Ver Timeline Completo
          </button>
        </div>
        
        <div class="lifecycle-metrics">
          <div class="metrics-grid">
            <!-- Métricas de Tiempo -->
            <div class="metric-card time-metrics">
              <h4>⏱️ Tiempos de Procesamiento</h4>
              <div class="metric-items">
                <div class="metric-item">
                  <span class="metric-label">Creación → Finalización</span>
                  <span class="metric-value">{metricasCicloVida.diasCreacionAFinalizacion} días</span>
                </div>
                <div class="metric-item">
                  <span class="metric-label">Creación → Certificado</span>
                  <span class="metric-value">{metricasCicloVida.diasCreacionACertificado} días</span>
                </div>
                <div class="metric-item">
                  <span class="metric-label">Certificado → Finalización</span>
                  <span class="metric-value">{metricasCicloVida.diasCertificadoAFinalizacion} días</span>
                </div>
              </div>
            </div>
            
            <!-- Métricas de Costo -->
            <div class="metric-card cost-metrics">
              <h4>💰 Resumen de Costos</h4>
              <div class="metric-items">
                <div class="metric-item">
                  <span class="metric-label">Subtotal (sin IVA)</span>
                  <span class="metric-value">${metricasCicloVida.montoSinIva.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
                </div>
                <div class="metric-item">
                  <span class="metric-label">IVA (21%)</span>
                  <span class="metric-value">${(metricasCicloVida.montoConIva - metricasCicloVida.montoSinIva).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
                </div>
                <div class="metric-item total">
                  <span class="metric-label">Total (con IVA)</span>
                  <span class="metric-value">${metricasCicloVida.montoConIva.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    {/if}

    
    <!-- ================================================================= -->
    <!-- VISUALIZACIÓN DE DETALLES DE LA TAREA -->
    <!-- ================================================================= -->
    <div class="header">
      <h1>Detalle: {certificado.tarea.id_tarea_texto}</h1>
      <div class="actions">
        {#if userRol === 'inspector' && certificado.tarea.estado.toLowerCase() === 'asignada'}
            <button class="delete-button" on:click={handleDelete}>Cancelar Tarea</button>
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
      
      <!-- Archivos Adjuntos integrados en la información - Solo si hay certificado emitido -->
      {#if certificado.mano_de_obra?.length > 0 || 
           certificado.materialesUtilizados?.length > 0 || 
           certificado.materialesRecuperados?.length > 0}
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
        {#if userRol === 'proveedor' && (certificado.tarea.estado === 'Pendiente Certificación Inspector' || certificado.tarea.estado === 'Pendiente Certificación Inspector/Supervisor')}
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
      {/if}
    </div>

    <!-- ================================================================= -->
    <!-- ADJUNTOS DEL INSPECTOR - SOLO SI NO HAY CERTIFICADO EMITIDO -->
    <!-- ================================================================= -->
    {#if certificado && certificado.tarea && 
         !(certificado.mano_de_obra?.length > 0 || 
           certificado.materialesUtilizados?.length > 0 || 
           certificado.materialesRecuperados?.length > 0) &&
         certificado.adjuntos?.length > 0}
      
      <div class="inspector-adjuntos-section">
        <h2>📎 Archivos Adjuntos del Inspector</h2>
        <p class="adjuntos-description">
          Archivos adjuntos por el inspector durante la creación de la tarea:
        </p>
        
        <div class="adjuntos-grid">
          {#each certificado.adjuntos as adjunto}
            <div class="adjunto-item">
              <div class="adjunto-preview">
                {#if adjunto.nombre_archivo.match(/\.(jpe?g|png|gif|webp|svg)$/i)}
                  <div class="image-preview">
                    <img 
                      src="http://localhost:3000{adjunto.url_archivo}" 
                      alt="{adjunto.nombre_archivo}"
                      class="preview-image"
                      loading="lazy"
                    />
                    <div class="image-overlay">
                      <span class="file-type">🖼️ Imagen</span>
                    </div>
                  </div>
                {:else if adjunto.nombre_archivo.match(/\.pdf$/i)}
                  <div class="file-preview pdf-preview">
                    <div class="file-icon-large">📄</div>
                    <span class="file-type">PDF</span>
                  </div>
                {:else if adjunto.nombre_archivo.match(/\.(xlsx?|csv)$/i)}
                  <div class="file-preview excel-preview">
                    <div class="file-icon-large">📊</div>
                    <span class="file-type">Excel</span>
                  </div>
                {:else if adjunto.nombre_archivo.match(/\.docx?$/i)}
                  <div class="file-preview word-preview">
                    <div class="file-icon-large">📝</div>
                    <span class="file-type">Word</span>
                  </div>
                {:else}
                  <div class="file-preview generic-preview">
                    <div class="file-icon-large">📎</div>
                    <span class="file-type">Archivo</span>
                  </div>
                {/if}
              </div>
              <div class="adjunto-info">
                <div class="adjunto-name">{adjunto.nombre_archivo}</div>
                <a href="http://localhost:3000{adjunto.url_archivo}" download="{adjunto.nombre_archivo}" class="download-btn" title="Descargar archivo">
                  <span>Descargar</span>
                  <span class="download-icon">⬇️</span>
                </a>
              </div>
            </div>
          {/each}
        </div>
      </div>
    {/if}

    <!-- ================================================================= -->
    <!-- DETALLES DEL CERTIFICADO - SIEMPRE QUE EXISTA UN CERTIFICADO -->
    <!-- ================================================================= -->
    {#if certificado && certificado.tarea && 
         (certificado.mano_de_obra?.length > 0 || 
          certificado.materialesUtilizados?.length > 0 || 
          certificado.materialesRecuperados?.length > 0)}
      
      <div class="certificado-details-section">
        <h2>📋 Detalles del Certificado Emitido</h2>
        <p class="certificado-description">
          Certificado emitido por el proveedor con los siguientes detalles:
        </p>
        
        <!-- Información de fechas del certificado -->
        {#if certificado.tarea.fecha_inicio || certificado.tarea.fecha_fin}
          <div class="certificado-fechas">
            <h3>📅 Fechas del Trabajo</h3>
            <div class="fechas-info">
              {#if certificado.tarea.fecha_inicio}
                <div class="fecha-item">
                  <strong>Fecha de Inicio:</strong> {new Date(certificado.tarea.fecha_inicio).toLocaleDateString()}
                </div>
              {/if}
              {#if certificado.tarea.fecha_fin}
                <div class="fecha-item">
                  <strong>Fecha de Fin:</strong> {new Date(certificado.tarea.fecha_fin).toLocaleDateString()}
                </div>
              {/if}
            </div>
          </div>
        {/if}

        <!-- Mano de Obra Certificada -->
        <div class="certificado-section">
          <h3>👷 Mano de Obra Certificada</h3>
          {#if certificado.mano_de_obra && certificado.mano_de_obra.length > 0}
            <div class="table-container">
              <table class="certificado-table">
                <thead>
                  <tr>
                    <th>Código</th>
                    <th>Descripción</th>
                    <th>Cantidad</th>
                    <th>Unidad de Medida</th>
                    <th>Precio Unitario</th>
                    <th>Precio Total</th>
                  </tr>
                </thead>
                <tbody>
                  {#each certificado.mano_de_obra as item}
                    <tr>
                      <td class="codigo-cell">{item.codigo}</td>
                      <td class="descripcion-cell">{item.descripcion}</td>
                      <td class="cantidad-cell">{item.cantidad}</td>
                      <td class="unidad-cell">{item.unidad_medida}</td>
                      <td class="precio-cell">${item.precio?.toLocaleString() || 'N/A'}</td>
                      <td class="total-cell">${((item.cantidad || 0) * (item.precio || 0)).toLocaleString()}</td>
                    </tr>
                  {/each}
                </tbody>
              </table>
            </div>
          {:else}
            <div class="no-data-message">
              <p>📝 No se registró mano de obra en este certificado.</p>
            </div>
          {/if}
        </div>

        <!-- Materiales Utilizados -->
        <div class="certificado-section">
          <h3>🔧 Materiales Utilizados</h3>
          {#if certificado.materialesUtilizados && certificado.materialesUtilizados.length > 0}
            <div class="table-container">
              <table class="certificado-table">
                <thead>
                  <tr>
                    <th>Código</th>
                    <th>Descripción</th>
                    <th>Cantidad</th>
                    <th>Unidad de Medida</th>
                  </tr>
                </thead>
                <tbody>
                  {#each certificado.materialesUtilizados as item}
                    <tr>
                      <td class="codigo-cell">{item.codigo}</td>
                      <td class="descripcion-cell">{item.descripcion}</td>
                      <td class="cantidad-cell">{item.cantidad}</td>
                      <td class="unidad-cell">{item.unidad_medida}</td>
                    </tr>
                  {/each}
                </tbody>
              </table>
            </div>
          {:else}
            <div class="no-data-message">
              <p>📝 No se registraron materiales utilizados en este certificado.</p>
            </div>
          {/if}
        </div>

        <!-- Materiales Recuperados -->
        <div class="certificado-section">
          <h3>♻️ Materiales Recuperados</h3>
          {#if certificado.materialesRecuperados && certificado.materialesRecuperados.length > 0}
            <div class="table-container">
              <table class="certificado-table">
                <thead>
                  <tr>
                    <th>Código</th>
                    <th>Descripción</th>
                    <th>Cantidad</th>
                    <th>Unidad de Medida</th>
                  </tr>
                </thead>
                <tbody>
                  {#each certificado.materialesRecuperados as item}
                    <tr>
                      <td class="codigo-cell">{item.codigo}</td>
                      <td class="descripcion-cell">{item.descripcion}</td>
                      <td class="cantidad-cell">{item.cantidad}</td>
                      <td class="unidad-cell">{item.unidad_medida}</td>
                    </tr>
                  {/each}
                </tbody>
              </table>
            </div>
          {:else}
            <div class="no-data-message">
              <p>📝 No se registraron materiales recuperados en este certificado.</p>
            </div>
          {/if}
        </div>

        <!-- Adjuntos del Certificado con Preview -->
        <div class="certificado-section">
          <h3>📎 Adjuntos del Certificado</h3>
          {#if certificado.adjuntos && certificado.adjuntos.length > 0}
            <div class="adjuntos-grid">
              {#each certificado.adjuntos as adjunto}
                <div class="adjunto-item">
                  <div class="adjunto-preview">
                    {#if adjunto.nombre_archivo.match(/\.(jpe?g|png|gif|webp|svg)$/i)}
                      <div class="image-preview">
                        <img 
                          src="http://localhost:3000{adjunto.url_archivo}" 
                          alt="{adjunto.nombre_archivo}"
                          class="preview-image"
                          loading="lazy"
                        />
                        <div class="image-overlay">
                          <span class="file-type">🖼️ Imagen</span>
                        </div>
                      </div>
                    {:else if adjunto.nombre_archivo.match(/\.pdf$/i)}
                      <div class="file-preview pdf-preview">
                        <div class="file-icon-large">📄</div>
                        <span class="file-type">PDF</span>
                      </div>
                    {:else if adjunto.nombre_archivo.match(/\.(xlsx?|csv)$/i)}
                      <div class="file-preview excel-preview">
                        <div class="file-icon-large">📊</div>
                        <span class="file-type">Excel</span>
                      </div>
                    {:else if adjunto.nombre_archivo.match(/\.docx?$/i)}
                      <div class="file-preview word-preview">
                        <div class="file-icon-large">📝</div>
                        <span class="file-type">Word</span>
                      </div>
                    {:else}
                      <div class="file-preview other-preview">
                        <div class="file-icon-large">📎</div>
                        <span class="file-type">Archivo</span>
                      </div>
                    {/if}
                  </div>
                  <div class="adjunto-info">
                    <div class="adjunto-name" title="{adjunto.nombre_archivo}">
                      {adjunto.nombre_archivo}
                    </div>
                    <div class="adjunto-actions">
                      <a 
                        href="http://localhost:3000{adjunto.url_archivo}" 
                        download="{adjunto.nombre_archivo}" 
                        class="download-link"
                        on:click={handleDownload}
                        title="Descargar archivo"
                      >
                        ⬇️ Descargar
                      </a>
                    </div>
                  </div>
                </div>
              {/each}
            </div>
          {:else}
            <div class="no-data-message">
              <p>📝 No se adjuntaron archivos en este certificado.</p>
            </div>
          {/if}
        </div>
      </div>
    {/if}

    <!-- SECCIÓN DE OBSERVACIÓN DEL INSPECTOR -->
    <!-- ================================================================= -->
    {#if userRol === 'proveedor' && certificado.tarea.estado.toLowerCase().includes('observada')}
      <div class="observacion-inspector-panel">
        <div class="observacion-header">
          <h3>⚠️ Observación del Inspector</h3>
          <span class="estado-badge observada">{certificado.tarea.estado}</span>
        </div>
        
        <div class="observacion-details">
          {#if infoObservacion}
            <div class="observacion-item">
              <strong>Observador:</strong> {infoObservacion.observador_original}
            </div>
            <div class="observacion-item">
              <strong>Fecha:</strong> {new Date(infoObservacion.fecha_observacion).toLocaleDateString()}
            </div>
            <div class="observacion-item">
              <strong>Observación:</strong> {infoObservacion.observacion}
            </div>
          {:else}
            <div class="observacion-item">
              <p>No se pudo cargar la información de la observación.</p>
            </div>
          {/if}
        </div>
      </div>
    {/if}

    <!-- SECCIÓN DE EDICIÓN DE CERTIFICADO -->
    <!-- ================================================================= -->
    {#if userRol === 'proveedor' && certificado.tarea.estado.toLowerCase().includes('observada')}
      <div class="editar-certificado-panel">
        <div class="editar-header">
          <h3>✏️ Editar Certificado</h3>
          <p>Revisa la observación del inspector y edita el certificado con las correcciones necesarias.</p>
        </div>
        
        <div class="editar-actions">
          <button 
            class="btn btn-warning btn-large" 
            on:click={() => showEditCertificateModal = true}
            disabled={isProcessingAction}
          >
            📝 Editar Certificado
          </button>
        </div>
      </div>
    {/if}

      <!-- ================================================================= -->
      <!-- PANEL DE ACCIÓN UNIFICADO - AL FINAL PARA REVISIÓN COMPLETA -->
      <!-- ================================================================= -->
      {#if mostrarAccionTareaPanel}
        <AccionTareaPanel 
          tarea={certificado.tarea}
          certificado={certificado}
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
          on:editarCertificado={handleEditarCertificado}
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

  <!-- Modal de Edición de Certificado -->
  {#if showEditCertificateModal}
    <div class="modal-overlay edit-modal-overlay">
      <div class="modal-content edit-modal">
        <VerticalCertificationForm 
          tarea={certificado.tarea}
          taskId={certificado.tarea.id}
          manoDeObra={[]}
          materiales={[]}
          isEditMode={true}
          certificadoData={certificado}
          on:certificadoEmitido={async () => {
            showEditCertificateModal = false;
            // Invalidar cache y recargar datos
            await invalidateAll();
            // Forzar recarga de la página para asegurar que se muestren los cambios
            setTimeout(() => {
              window.location.reload();
            }, 500);
          }}
        />
      </div>
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
    max-width: 1400px; 
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
  
  .lifecycle-summary {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 16px;
    padding: 2rem;
    margin-bottom: 2rem;
    color: white;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  }
  
  .lifecycle-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 2rem;
    gap: 2rem;
  }
  
  .lifecycle-title h3 {
    color: white;
    margin: 0 0 0.5rem 0;
    font-size: 1.5rem;
    font-weight: 600;
  }
  
  .lifecycle-title p {
    color: rgba(255, 255, 255, 0.9);
    margin: 0;
    font-size: 1rem;
  }
  
  .lifecycle-button {
    background: rgba(255, 255, 255, 0.15);
    color: white;
    border: 2px solid rgba(255, 255, 255, 0.3);
    padding: 0.75rem 1.5rem;
    border-radius: 12px;
    cursor: pointer;
    font-size: 1rem;
    font-weight: 500;
    transition: all 0.3s ease;
    backdrop-filter: blur(10px);
    white-space: nowrap;
  }
  
  .lifecycle-button:hover {
    background: rgba(255, 255, 255, 0.25);
    border-color: rgba(255, 255, 255, 0.5);
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
  }
  
  .lifecycle-metrics {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    padding: 1.5rem;
    backdrop-filter: blur(10px);
  }
  
  .metrics-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 2rem;
  }
  
  .metric-card {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    padding: 1.5rem;
    border: 1px solid rgba(255, 255, 255, 0.2);
  }
  
  .metric-card h4 {
    color: white;
    margin: 0 0 1rem 0;
    font-size: 1.1rem;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  
  .metric-items {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }
  
  .metric-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.5rem 0;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }
  
  .metric-item:last-child {
    border-bottom: none;
  }
  
  .metric-item.total {
    background: rgba(255, 255, 255, 0.1);
    padding: 0.75rem;
    border-radius: 8px;
    border: 1px solid rgba(255, 255, 255, 0.2);
    font-weight: 600;
  }
  
  .metric-label {
    color: rgba(255, 255, 255, 0.9);
    font-size: 0.9rem;
  }
  
  .metric-value {
    color: white;
    font-weight: 600;
    font-size: 1rem;
  }
  
  .metric-item.total .metric-value {
    font-size: 1.1rem;
    color: #4ade80;
  }
  
  @media (max-width: 768px) {
    .lifecycle-header {
      flex-direction: column;
      align-items: stretch;
      gap: 1rem;
    }
    
    .metrics-grid {
      grid-template-columns: 1fr;
      gap: 1rem;
    }
    
    .lifecycle-summary {
      padding: 1.5rem;
    }
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

  /* ================================================================= */
  /* ESTILOS PARA DETALLES DEL CERTIFICADO */
  /* ================================================================= */
  
  .certificado-details-section {
    margin-top: 2rem;
    background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
    border: 2px solid #dee2e6;
    border-radius: 12px;
    padding: 2rem;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  .certificado-details-section h2 {
    color: #495057;
    margin-top: 0;
    margin-bottom: 1rem;
    font-size: 1.5rem;
    border-bottom: 2px solid #007bff;
    padding-bottom: 0.5rem;
  }

  .certificado-description {
    color: #6c757d;
    font-style: italic;
    margin-bottom: 2rem;
    padding: 1rem;
    background: rgba(0, 123, 255, 0.1);
    border-left: 4px solid #007bff;
    border-radius: 4px;
  }

  .certificado-section {
    margin-bottom: 2.5rem;
    background: white;
    border-radius: 8px;
    padding: 1.5rem;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  .certificado-fechas {
    background: #f8f9fa;
    border: 1px solid #dee2e6;
    border-radius: 8px;
    padding: 1rem;
    margin-bottom: 1.5rem;
  }

  .certificado-fechas h3 {
    margin: 0 0 0.75rem 0;
    color: #495057;
    font-size: 1rem;
  }

  .fechas-info {
    display: flex;
    gap: 2rem;
    flex-wrap: wrap;
  }

  .fecha-item {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .fecha-item strong {
    color: #495057;
    font-size: 0.9rem;
  }

  .fecha-item span {
    color: #6c757d;
    font-size: 0.95rem;
  }

  .certificado-section h3 {
    color: #343a40;
    margin-top: 0;
    margin-bottom: 1.5rem;
    font-size: 1.25rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .table-container {
    overflow-x: auto;
    border-radius: 8px;
    border: 1px solid #dee2e6;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    background: white;
    margin-top: 1rem;
  }

  .certificado-table {
    width: 100%;
    border-collapse: collapse;
    background: white;
    font-size: 0.9rem;
  }

  .certificado-table thead {
    background: #2c3e50 !important;
    color: white !important;
    position: sticky;
    top: 0;
    z-index: 10;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  }

  .certificado-table th {
    padding: 1rem 0.75rem;
    text-align: left;
    font-weight: 700;
    border: none;
    white-space: nowrap;
    font-size: 0.9rem;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: white !important;
    background: #2c3e50 !important;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
    border-right: 1px solid rgba(255, 255, 255, 0.2);
  }

  .certificado-table th:last-child {
    border-right: none;
  }

  /* Estilos adicionales para asegurar contraste en encabezados */
  .certificado-table thead tr {
    background: #2c3e50 !important;
  }

  .certificado-table thead tr th {
    background: #2c3e50 !important;
    color: white !important;
    font-weight: 700 !important;
  }

  /* Forzar estilos en caso de conflictos */
  .table-container .certificado-table thead th {
    background: #2c3e50 !important;
    color: white !important;
    font-weight: 700 !important;
  }

  /* Estilos globales para encabezados de certificado */
  :global(.certificado-table thead) {
    background: #2c3e50 !important;
  }

  :global(.certificado-table thead th) {
    background: #2c3e50 !important;
    color: white !important;
    font-weight: 700 !important;
  }

  .certificado-table td {
    padding: 0.75rem;
    border-bottom: 1px solid #e9ecef;
    vertical-align: top;
    background-color: white;
  }

  .certificado-table tbody tr:nth-child(even) td {
    background-color: #f8f9fa;
  }

  .certificado-table tbody tr:hover td {
    background-color: #e3f2fd;
    transition: background-color 0.2s ease;
  }

  .certificado-table tbody tr:last-child td {
    border-bottom: none;
  }

  /* Estilos específicos para celdas */
  .codigo-cell {
    font-family: 'Courier New', monospace;
    font-weight: 600;
    color: #0056b3;
    background: rgba(0, 86, 179, 0.08);
    border-radius: 4px;
    padding: 0.5rem;
    text-align: center;
    min-width: 100px;
    border: 1px solid rgba(0, 86, 179, 0.2);
  }

  .descripcion-cell {
    max-width: 500px;
    min-width: 300px;
    word-wrap: break-word;
    line-height: 1.4;
    white-space: normal;
    color: #343a40;
    font-weight: 500;
  }

  .cantidad-cell {
    text-align: center;
    font-weight: 700;
    color: #155724;
    background: rgba(21, 87, 36, 0.08);
    border-radius: 4px;
    min-width: 80px;
    border: 1px solid rgba(21, 87, 36, 0.2);
  }

  .unidad-cell {
    text-align: center;
    color: #495057;
    font-style: italic;
    font-weight: 500;
    min-width: 80px;
    background: rgba(73, 80, 87, 0.05);
    border-radius: 4px;
  }

  .precio-cell, .total-cell {
    text-align: right;
    font-family: 'Courier New', monospace;
    font-weight: 700;
    color: #155724;
    background: rgba(21, 87, 36, 0.08);
    border-radius: 4px;
    min-width: 100px;
    border: 1px solid rgba(21, 87, 36, 0.2);
  }

  /* Estilos para adjuntos con preview */
  .adjuntos-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 1.5rem;
    margin-top: 1rem;
  }

  .adjunto-item {
    background: white;
    border: 2px solid #e9ecef;
    border-radius: 8px;
    overflow: hidden;
    transition: all 0.3s ease;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  .adjunto-item:hover {
    border-color: #007bff;
    box-shadow: 0 4px 12px rgba(0, 123, 255, 0.2);
    transform: translateY(-2px);
  }

  .adjunto-preview {
    height: 150px;
    position: relative;
    overflow: hidden;
    background: #f8f9fa;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .image-preview {
    width: 100%;
    height: 100%;
    position: relative;
  }

  .preview-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.3s ease;
  }

  .image-preview:hover .preview-image {
    transform: scale(1.05);
  }

  .image-overlay {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    background: linear-gradient(transparent, rgba(0, 0, 0, 0.7));
    color: white;
    padding: 0.5rem;
    text-align: center;
  }

  .file-preview {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    gap: 0.5rem;
  }

  .file-icon-large {
    font-size: 3rem;
    opacity: 0.7;
  }

  .file-type {
    font-size: 0.8rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .pdf-preview {
    background: linear-gradient(135deg, #dc3545 0%, #c82333 100%);
    color: white;
  }

  .excel-preview {
    background: linear-gradient(135deg, #28a745 0%, #1e7e34 100%);
    color: white;
  }

  .word-preview {
    background: linear-gradient(135deg, #007bff 0%, #0056b3 100%);
    color: white;
  }

  .other-preview {
    background: linear-gradient(135deg, #6c757d 0%, #495057 100%);
    color: white;
  }

  .adjunto-info {
    padding: 1rem;
  }

  .adjunto-name {
    font-weight: 500;
    color: #343a40;
    margin-bottom: 0.5rem;
    word-break: break-word;
    line-height: 1.3;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .adjunto-actions {
    display: flex;
    justify-content: center;
  }

  .download-link {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    background: #007bff;
    color: white;
    text-decoration: none;
    border-radius: 6px;
    font-size: 0.9rem;
    font-weight: 500;
    transition: all 0.2s ease;
  }

  .download-link:hover {
    background: #0056b3;
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(0, 123, 255, 0.3);
  }

  /* Estilos para mensajes de "no hay datos" */
  .no-data-message {
    text-align: center;
    padding: 2rem;
    background: #f8f9fa;
    border: 2px dashed #dee2e6;
    border-radius: 8px;
    margin: 1rem 0;
  }

  .no-data-message p {
    color: #6c757d;
    font-style: italic;
    margin: 0;
    font-size: 1rem;
  }

  /* Responsive para móviles */
  @media (max-width: 768px) {
    .certificado-details-section {
      padding: 1rem;
      margin-top: 1rem;
    }

    .certificado-section {
      padding: 1rem;
    }

    .certificado-table {
      font-size: 0.8rem;
    }

    .certificado-table th,
    .certificado-table td {
      padding: 0.5rem 0.25rem;
    }

    .adjuntos-grid {
      grid-template-columns: 1fr;
      gap: 1rem;
    }

    .adjunto-preview {
      height: 120px;
    }

    .file-icon-large {
      font-size: 2rem;
    }
  }

  /* ================================================================= */
  /* ESTILOS PARA PANELES DE OBSERVACIÓN Y EDICIÓN SEPARADOS */
  /* ================================================================= */
  
  .observacion-inspector-panel {
    background: #fff3cd;
    border: 2px solid #ffeaa7;
    border-radius: 12px;
    padding: 2rem;
    margin: 2rem 0;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }
  
  .observacion-inspector-panel .observacion-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
    padding-bottom: 1rem;
    border-bottom: 2px solid #ffeaa7;
  }
  
  .observacion-inspector-panel .observacion-header h3 {
    margin: 0;
    color: #856404;
    font-size: 1.4rem;
    font-weight: 600;
  }
  
  .observacion-inspector-panel .estado-badge {
    padding: 0.5rem 1rem;
    border-radius: 20px;
    font-size: 0.9rem;
    font-weight: 600;
  }
  
  .observacion-inspector-panel .estado-badge.observada {
    background: #f8d7da;
    color: #721c24;
    border: 1px solid #f5c6cb;
  }
  
  .observacion-inspector-panel .observacion-details {
    background: white;
    border-radius: 8px;
    padding: 1.5rem;
    border: 1px solid #e9ecef;
  }
  
  .observacion-inspector-panel .observacion-item {
    margin-bottom: 1rem;
    font-size: 1rem;
    line-height: 1.5;
  }
  
  .observacion-inspector-panel .observacion-item strong {
    color: #495057;
    font-weight: 600;
  }
  
  .editar-certificado-panel {
    background: #e7f3ff;
    border: 2px solid #b3d9ff;
    border-radius: 12px;
    padding: 2rem;
    margin: 2rem 0;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    text-align: center;
  }
  
  .editar-certificado-panel .editar-header h3 {
    margin: 0 0 0.5rem 0;
    color: #0056b3;
    font-size: 1.4rem;
    font-weight: 600;
  }
  
  .editar-certificado-panel .editar-header p {
    margin: 0 0 2rem 0;
    color: #6c757d;
    font-size: 1rem;
    line-height: 1.5;
  }
  
  .editar-certificado-panel .editar-actions {
    display: flex;
    justify-content: center;
  }
  
  .editar-certificado-panel .btn {
    padding: 1rem 2rem;
    border: none;
    border-radius: 8px;
    font-size: 1.1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    text-decoration: none;
  }
  
  .editar-certificado-panel .btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  
  .editar-certificado-panel .btn-warning {
    background: #ffc107;
    color: #212529;
  }
  
  .editar-certificado-panel .btn-warning:hover:not(:disabled) {
    background: #e0a800;
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(255, 193, 7, 0.3);
  }
  
  .editar-certificado-panel .btn-large {
    padding: 1.2rem 2.5rem;
    font-size: 1.2rem;
  }
  
  /* Estilos para la sección de adjuntos del inspector */
  .inspector-adjuntos-section {
    background: white;
    border-radius: 12px;
    padding: 2rem;
    margin: 2rem 0;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    border-left: 4px solid #17a2b8;
  }
  
  .inspector-adjuntos-section h2 {
    color: #333;
    margin-bottom: 1rem;
    font-size: 1.5rem;
    font-weight: 600;
  }
  
  .adjuntos-description {
    color: #666;
    margin-bottom: 1.5rem;
    font-style: italic;
  }
  
  /* Responsive */
  @media (max-width: 768px) {
    .observacion-inspector-panel,
    .editar-certificado-panel {
      padding: 1.5rem;
      margin: 1.5rem 0;
    }
    
    .observacion-inspector-panel .observacion-header {
      flex-direction: column;
      align-items: flex-start;
      gap: 0.5rem;
    }
    
    .observacion-inspector-panel .observacion-header h3 {
      font-size: 1.2rem;
    }
    
    .editar-certificado-panel .editar-header h3 {
      font-size: 1.2rem;
    }
    
    .editar-certificado-panel .btn-large {
      padding: 1rem 1.5rem;
      font-size: 1.1rem;
    }
  }

  /* ================================================================= */
  /* ESTILOS PARA MODAL DE EDICIÓN DE CERTIFICADO */
  /* ================================================================= */
  
  .edit-modal-overlay {
    position: fixed !important;
    top: 0 !important;
    left: 0 !important;
    width: 100vw !important;
    height: 100vh !important;
    background: white !important;
    z-index: 1000 !important;
    margin: 0 !important;
    padding: 0 !important;
    border: none !important;
    border-radius: 0 !important;
    box-shadow: none !important;
    display: block !important;
    justify-content: unset !important;
    align-items: unset !important;
    backdrop-filter: none !important;
  }
  
  .edit-modal-overlay .edit-modal {
    position: fixed !important;
    top: 0 !important;
    left: 0 !important;
    width: 100vw !important;
    height: 100vh !important;
    max-width: 100vw !important;
    max-height: 100vh !important;
    background: white !important;
    border-radius: 0 !important;
    box-shadow: none !important;
    overflow: auto !important;
    margin: 0 !important;
    padding: 0 !important;
    border: none !important;
  }
  
  /* Ocultar cualquier botón de cerrar en el modal de edición */
  .edit-modal-overlay .close-button,
  .edit-modal-overlay button[class*="close"],
  .edit-modal-overlay .modal-close,
  .edit-modal-overlay .btn-close {
    display: none !important;
  }
</style>