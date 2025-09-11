<script lang="ts">
  import { user } from '$lib/stores/auth';
  import * as XLSX from 'xlsx';
  export let data;

  // Hacer XLSX disponible globalmente
  if (typeof window !== 'undefined') {
    (window as any).XLSX = XLSX;
  }

  let isLoading = false;

  // Función para volver al dashboard principal
  function goBack() {
    window.location.href = '/superadmin/dashboard';
  }

  // Función para generar y exportar reporte
  async function generateAndExportReport(reportType: string) {
    isLoading = true;
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`http://localhost:3000/api/superadmin/reports/${reportType}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();
      
      if (result.success) {
        // Exportar automáticamente después de generar
        exportReportData(reportType, result.data);
      } else {
        alert(`Error al generar reporte: ${result.error}`);
      }
    } catch (error) {
      console.error('Error generando reporte:', error);
      alert('Error al generar el reporte. Verifica que el servidor esté corriendo.');
    } finally {
      isLoading = false;
    }
  }

  // Función para exportar base de datos cruda
  async function exportRawDatabase(dataType: string) {
    isLoading = true;
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`http://localhost:3000/api/superadmin/raw-data/${dataType}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();
      
      console.log('Respuesta del servidor para', dataType, ':', result);
      console.log('Tipo de result:', typeof result);
      console.log('Tipo de result.data:', typeof result.data);
      if (result.data) {
        console.log('Claves de result.data:', Object.keys(result.data));
        if (dataType === 'tareas' && result.data.tareas) {
          console.log('Tipo de result.data.tareas:', typeof result.data.tareas);
          console.log('Es array tareas:', Array.isArray(result.data.tareas));
          console.log('Longitud tareas:', result.data.tareas.length);
        }
        if (dataType === 'historial' && result.data.historial) {
          console.log('Tipo de result.data.historial:', typeof result.data.historial);
          console.log('Es array historial:', Array.isArray(result.data.historial));
          console.log('Longitud historial:', result.data.historial.length);
        }
      }
      
      if (result.success) {
        // Exportar automáticamente después de obtener los datos
        exportRawDataToExcel(dataType, result);
      } else {
        alert(`Error al obtener datos: ${result.error}`);
      }
    } catch (error) {
      console.error('Error obteniendo datos crudos:', error);
      alert('Error al obtener los datos. Verifica que el servidor esté corriendo.');
    } finally {
      isLoading = false;
    }
  }

  // Función para exportar datos crudos a Excel
  function exportRawDataToExcel(dataType: string, rawData: any) {
    // Validar que rawData y rawData.data existan
    if (!rawData || !rawData.data) {
      console.error('Error: rawData o rawData.data es undefined', rawData);
      alert('Error: No se pudieron obtener los datos para exportar');
      return;
    }

    // Función helper para convertir objeto a array si es necesario
    function ensureArray(data: any): any[] {
      if (Array.isArray(data)) {
        console.log('Datos ya son un array, longitud:', data.length);
        return data;
      } else if (data && typeof data === 'object') {
        console.log('Convirtiendo objeto a array:', data);
        console.log('Claves del objeto:', Object.keys(data));
        
        // Si el objeto tiene propiedades numéricas, convertirlo a array
        const keys = Object.keys(data);
        const numericKeys = keys.filter(key => !isNaN(Number(key)));
        
        if (numericKeys.length > 0) {
          console.log('Claves numéricas encontradas:', numericKeys);
          const array = numericKeys.map(key => data[key]);
          console.log('Array convertido, longitud:', array.length);
          return array;
        }
        
        // Si es un objeto con propiedades no numéricas, podría ser un solo elemento
        // Verificar si tiene propiedades típicas de una tarea o historial
        if (data.id || data.id_tarea || data.id_tarea_texto) {
          console.log('Objeto parece ser un elemento único, convirtiendo a array');
          return [data];
        }
        
        // Si no tiene propiedades reconocibles, devolver array vacío
        console.log('Objeto no reconocido, devolviendo array vacío');
        return [];
      }
      
      console.log('Datos no son objeto ni array, devolviendo array vacío');
      return [];
    }

    // Usar XLSX global
    const XLSX = (window as any).XLSX;
    const workbook = XLSX.utils.book_new();
    
    if (dataType === 'tareas') {
      // Convertir a array si es necesario
      const tareasArray = ensureArray(rawData.data.tareas);
      if (tareasArray.length === 0) {
        console.error('Error: No se pudieron obtener datos de tareas válidos', rawData.data.tareas);
        alert('Error: No se encontraron datos de tareas para exportar');
        return;
      }

      // Crear hoja de tareas crudas
      const tareasData = [
        ['ID', 'ID Tarea Texto', 'Descripción', 'WO', 'Estado', 'Región', 'Inspector ID', 'Inspector Nombre', 'Proveedor ID', 'Proveedor Nombre', 'Fecha Creación', 'Fecha Inicio', 'Fecha Cierre Proveedor', 'Fecha Aprobación Final', 'Fecha Fin', 'Fecha Última Exportación', 'Observaciones', 'Archivos Adjuntos']
      ];
      
      tareasArray.forEach((tarea: any) => {
        tareasData.push([
          tarea.id,
          tarea.id_tarea_texto,
          tarea.descripcion,
          tarea.numero_wo || '',
          tarea.estado,
          tarea.region,
          tarea.id_inspector || '',
          tarea.inspector_nombre || '',
          tarea.id_proveedor || '',
          tarea.proveedor_nombre || '',
          tarea.fecha_creacion,
          tarea.fecha_inicio || '',
          tarea.fecha_cierre_proveedor || '',
          tarea.fecha_aprobacion_final || '',
          tarea.fecha_fin || '',
          tarea.fecha_ultima_exportacion || '',
          tarea.observaciones || '',
          tarea.archivos_adjuntos || ''
        ]);
      });
      
      XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(tareasData), 'Tareas Crudas');
      const fileName = `base_datos_tareas_${new Date().toISOString().split('T')[0]}.xlsx`;
      
    } else if (dataType === 'historial') {
      // Convertir a array si es necesario
      const historialArray = ensureArray(rawData.data.historial);
      if (historialArray.length === 0) {
        console.error('Error: No se pudieron obtener datos de historial válidos', rawData.data.historial);
        alert('Error: No se encontraron datos de historial para exportar');
        return;
      }

      // Crear hoja de historial crudo
      const historialData = [
        ['ID', 'ID Tarea', 'ID Usuario', 'Usuario Nombre', 'Acción', 'Fecha Evento', 'Detalle', 'Estado Anterior', 'Estado Nuevo', 'Datos Adicionales']
      ];
      
      historialArray.forEach((historial: any) => {
        historialData.push([
          historial.id || '',
          historial.id_tarea || '',
          historial.id_usuario || '',
          historial.usuario_nombre || '',
          historial.accion || '',
          historial.fecha_evento || '',
          historial.detalle || '',
          historial.estado_anterior || '',
          historial.estado_nuevo || '',
          historial.datos_adicionales || ''
        ]);
      });
      
      XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(historialData), 'Historial Crudo');
      const fileName = `base_datos_historial_${new Date().toISOString().split('T')[0]}.xlsx`;
    }

    // Generar y descargar archivo Excel
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `base_datos_${dataType}_${new Date().toISOString().split('T')[0]}.xlsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
      
      // Mostrar mensaje de éxito
      alert(`Base de datos ${dataType} exportada exitosamente como Excel`);
  }

  // Función para exportar datos del reporte a Excel
  function exportReportData(reportType: string, reportData: any) {
    // Usar XLSX global
    const XLSX = (window as any).XLSX;
      const workbook = XLSX.utils.book_new();
      
      // Crear hoja de resumen
      const resumenData = [
        ['REPORTE', reportData.tipo],
        ['Fecha de generación', new Date(reportData.fecha_generacion).toLocaleString()],
        ['', ''],
        ['RESUMEN', ''],
      ];

      // Agregar datos específicos según el tipo de reporte
      if (reportType === 'tareas') {
        resumenData.push(['Total de tareas', reportData.resumen.total_tareas]);
        resumenData.push(['', '']);
        resumenData.push(['ESTADÍSTICAS POR ESTADO', '']);
        resumenData.push(['Estado', 'Cantidad']);
        reportData.resumen.estadisticas_por_estado.forEach((stat: any) => {
          resumenData.push([stat.estado, stat.cantidad]);
        });

        // Crear hoja de tareas detalladas
        const tareasData = [
          ['ID Tarea', 'Descripción', 'Estado', 'Región', 'Proveedor', 'Inspector', 'Fecha Creación', 'Fecha Inicio', 'Fecha Cierre Proveedor', 'Fecha Aprobación Final', 'Fecha Fin']
        ];
        reportData.tareas.forEach((tarea: any) => {
          tareasData.push([
            tarea.id_tarea_texto,
            tarea.descripcion,
            tarea.estado,
            tarea.region,
            tarea.proveedor_nombre || 'N/A',
            tarea.inspector_nombre || 'N/A',
            tarea.fecha_creacion,
            tarea.fecha_inicio || 'N/A',
            tarea.fecha_cierre_proveedor || 'N/A',
            tarea.fecha_aprobacion_final || 'N/A',
            tarea.fecha_fin || 'N/A'
          ]);
        });
        XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(tareasData), 'Detalle Tareas');

      } else if (reportType === 'usuarios') {
        resumenData.push(['Total de usuarios', reportData.resumen.total_usuarios]);
        resumenData.push(['', '']);
        resumenData.push(['ESTADÍSTICAS POR ROL', '']);
        resumenData.push(['Rol', 'Activos/Total']);
        reportData.resumen.estadisticas_por_rol.forEach((stat: any) => {
          resumenData.push([stat.rol, `${stat.activos}/${stat.cantidad}`]);
        });

        // Crear hoja de usuarios detallada
        const usuariosData = [
          ['Nombre', 'Email', 'Rol', 'Región', 'Tareas Asignadas', 'Fecha Creación']
        ];
        reportData.usuarios.forEach((usuario: any) => {
          usuariosData.push([
            usuario.nombre_completo,
            usuario.email,
            usuario.rol,
            usuario.region_nombre || 'Sin región',
            usuario.tareas_asignadas,
            usuario.fecha_creacion
          ]);
        });
        XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(usuariosData), 'Detalle Usuarios');

      } else if (reportType === 'regiones') {
        resumenData.push(['Total de regiones', reportData.resumen.total_regiones]);
        resumenData.push(['', '']);
        resumenData.push(['DETALLE POR REGIÓN', '']);
        resumenData.push(['Región', 'Usuarios', 'Total Tareas', 'Tareas Finalizadas', 'Tareas Activas']);
        reportData.regiones.forEach((region: any) => {
          resumenData.push([
            region.nombre,
            region.total_usuarios,
            region.total_tareas,
            region.tareas_finalizadas,
            region.tareas_activas
          ]);
        });

      } else if (reportType === 'roles') {
        resumenData.push(['Total de roles', reportData.resumen.total_roles]);
        resumenData.push(['', '']);
        resumenData.push(['DETALLE POR ROL', '']);
        resumenData.push(['Rol', 'Usuarios', 'Tareas Asignadas', 'Tareas Finalizadas', 'Tareas Activas']);
        reportData.roles.forEach((role: any) => {
          resumenData.push([
            role.rol,
            role.total_usuarios,
            role.tareas_asignadas,
            role.tareas_finalizadas,
            role.tareas_activas
          ]);
        });

      } else if (reportType === 'rendimiento') {
        resumenData.push(['Total de estados', reportData.resumen.total_estados]);
        resumenData.push(['', '']);
        resumenData.push(['RENDIMIENTO POR ESTADO', '']);
        resumenData.push(['Estado', 'Cantidad', 'Tiempo Promedio (horas)']);
        reportData.rendimiento_por_estado.forEach((perf: any) => {
          resumenData.push([
            perf.estado,
            perf.cantidad,
            perf.tiempo_promedio_horas ? Math.round(perf.tiempo_promedio_horas) : 'N/A'
          ]);
        });

        // Crear hoja de tendencia mensual
        const tendenciaData = [
          ['Mes', 'Tareas Creadas', 'Tareas Finalizadas']
        ];
        reportData.tendencia_mensual.forEach((month: any) => {
          tendenciaData.push([month.mes, month.tareas_creadas, month.tareas_finalizadas]);
        });
        XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(tendenciaData), 'Tendencia Mensual');

      } else if (reportType === 'temporal') {
        resumenData.push(['Patrones semanales', reportData.resumen.patrones_semanales]);
        resumenData.push(['Patrones horarios', reportData.resumen.patrones_horarios]);
        resumenData.push(['Tendencias mensuales', reportData.resumen.tendencias_mensuales]);

        // Crear hoja de patrones semanales
        const patronesData = [
          ['Día de la Semana', 'Cantidad de Tareas']
        ];
        reportData.patrones_semanales.forEach((pattern: any) => {
          patronesData.push([pattern.dia_semana, pattern.cantidad]);
        });
        XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(patronesData), 'Patrones Semanales');

        // Crear hoja de tendencias mensuales
        const tendenciasData = [
          ['Mes', 'Tareas Creadas', 'Tareas Finalizadas', 'Porcentaje Completado']
        ];
        reportData.tendencias_mensuales.forEach((trend: any) => {
          tendenciasData.push([trend.mes, trend.tareas_creadas, trend.tareas_finalizadas, `${trend.porcentaje_completado}%`]);
        });
        XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(tendenciasData), 'Tendencias Mensuales');
      }

      // Agregar hoja de resumen
      XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(resumenData), 'Resumen');

      // Generar y descargar archivo Excel
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `reporte_${reportType}_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      // Mostrar mensaje de éxito
      alert(`Reporte de ${reportType} generado y descargado exitosamente como Excel`);
  }
</script>

<div class="reports-container">
  <div class="header">
    <button class="back-button" on:click={goBack}>← Volver</button>
    <h1>📊 Reportes del Sistema</h1>
    <p>Generación y exportación de reportes del sistema</p>
  </div>

  {#if data.error}
    <div class="error-message">
      <p>{data.error}</p>
    </div>
  {:else}
    <!-- Resumen de reportes -->
    <div class="reports-summary">
      <h2>📈 Resumen de Reportes</h2>
      <div class="summary-grid">
        <div class="summary-card">
          <div class="summary-icon">📋</div>
          <div class="summary-content">
            <h3>Total Tareas</h3>
            <p class="summary-number">{data.resumen?.total_tareas || 0}</p>
          </div>
        </div>
        <div class="summary-card">
          <div class="summary-icon">👥</div>
          <div class="summary-content">
            <h3>Total Usuarios</h3>
            <p class="summary-number">{data.resumen?.total_usuarios || 0}</p>
          </div>
        </div>
        <div class="summary-card">
          <div class="summary-icon">🏢</div>
          <div class="summary-content">
            <h3>Regiones</h3>
            <p class="summary-number">{data.resumen?.total_regiones || 0}</p>
          </div>
        </div>
        <div class="summary-card">
          <div class="summary-icon">⚡</div>
          <div class="summary-content">
            <h3>Roles Activos</h3>
            <p class="summary-number">{data.resumen?.roles_activos || 0}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Tipos de reportes -->
    <div class="reports-section">
      <h2>📊 Tipos de Reportes</h2>
      <div class="reports-grid">
        <div class="report-card">
          <div class="report-icon">📋</div>
          <div class="report-content">
            <h3>Reporte de Tareas</h3>
            <p>Análisis completo de todas las tareas del sistema</p>
            <div class="report-actions">
              <button class="action-btn primary" on:click={() => generateAndExportReport('tareas')} disabled={isLoading}>
                {isLoading ? 'Generando...' : 'Generar y Exportar'}
              </button>
            </div>
          </div>
        </div>

        <div class="report-card">
          <div class="report-icon">👥</div>
          <div class="report-content">
            <h3>Reporte de Usuarios</h3>
            <p>Estadísticas y actividad de usuarios por rol y región</p>
            <div class="report-actions">
              <button class="action-btn primary" on:click={() => generateAndExportReport('usuarios')} disabled={isLoading}>
                {isLoading ? 'Generando...' : 'Generar y Exportar'}
              </button>
            </div>
          </div>
        </div>

        <div class="report-card">
          <div class="report-icon">🏢</div>
          <div class="report-content">
            <h3>Reporte por Región</h3>
            <p>Análisis de actividad y rendimiento por región</p>
            <div class="report-actions">
              <button class="action-btn primary" on:click={() => generateAndExportReport('regiones')} disabled={isLoading}>
                {isLoading ? 'Generando...' : 'Generar y Exportar'}
              </button>
            </div>
          </div>
        </div>

        <div class="report-card">
          <div class="report-icon">⚡</div>
          <div class="report-content">
            <h3>Reporte por Rol</h3>
            <p>Estadísticas de actividad y rendimiento por rol</p>
            <div class="report-actions">
              <button class="action-btn primary" on:click={() => generateAndExportReport('roles')} disabled={isLoading}>
                {isLoading ? 'Generando...' : 'Generar y Exportar'}
              </button>
            </div>
          </div>
        </div>

        <div class="report-card">
          <div class="report-icon">📈</div>
          <div class="report-content">
            <h3>Reporte de Rendimiento</h3>
            <p>Métricas de eficiencia y tiempos de procesamiento</p>
            <div class="report-actions">
              <button class="action-btn primary" on:click={() => generateAndExportReport('rendimiento')} disabled={isLoading}>
                {isLoading ? 'Generando...' : 'Generar y Exportar'}
              </button>
            </div>
          </div>
        </div>

        <div class="report-card">
          <div class="report-icon">📅</div>
          <div class="report-content">
            <h3>Reporte Temporal</h3>
            <p>Análisis de tendencias y patrones temporales</p>
            <div class="report-actions">
              <button class="action-btn primary" on:click={() => generateAndExportReport('temporal')} disabled={isLoading}>
                {isLoading ? 'Generando...' : 'Generar y Exportar'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Exportación de Base de Datos Cruda -->
    <div class="raw-data-section">
      <h2>🗄️ Exportación de Base de Datos Cruda</h2>
      <p class="section-description">Exporta toda la información cruda de la base de datos para análisis avanzados</p>
      <div class="raw-data-grid">
        <div class="report-card raw-data-card">
          <div class="report-icon">📊</div>
          <div class="report-content">
            <h3>Base de Datos - Tareas</h3>
            <p>Exporta toda la información cruda de la tabla de tareas con todos los campos y fechas del ciclo de vida</p>
            <div class="report-actions">
              <button class="action-btn primary" on:click={() => exportRawDatabase('tareas')} disabled={isLoading}>
                {isLoading ? 'Exportando...' : 'Exportar BD Tareas'}
              </button>
            </div>
          </div>
        </div>

        <div class="report-card raw-data-card">
          <div class="report-icon">📜</div>
          <div class="report-content">
            <h3>Base de Datos - Historial</h3>
            <p>Exporta todo el historial de cambios de tareas con timestamps y detalles de cada modificación</p>
            <div class="report-actions">
              <button class="action-btn primary" on:click={() => exportRawDatabase('historial')} disabled={isLoading}>
                {isLoading ? 'Exportando...' : 'Exportar BD Historial'}
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>

    <!-- Reportes recientes -->
    {#if data.reportes_recientes && data.reportes_recientes.length > 0}
      <div class="recent-reports-section">
        <h2>🕒 Reportes Recientes</h2>
        <div class="recent-reports-list">
          {#each data.reportes_recientes as reporte (reporte.id)}
            <div class="recent-report-item">
              <div class="report-info">
                <h4>{reporte.tipo}</h4>
                <p>Generado el {new Date(reporte.fecha_generacion).toLocaleString()}</p>
              </div>
              <div class="report-actions">
                <button class="action-btn small" on:click={() => window.open(reporte.url, '_blank')}>
                  Ver
                </button>
                <button class="action-btn small secondary" on:click={() => window.open(reporte.url, '_blank')}>
                  Descargar
                </button>
              </div>
            </div>
          {/each}
        </div>
      </div>
    {/if}
  {/if}

</div>

<style>
  .reports-container {
    max-width: 1400px;
    margin: 0 auto;
    padding: 1rem;
  }

  .header {
    text-align: center;
    margin-bottom: 2rem;
    padding: 2rem;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border-radius: 12px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    position: relative;
  }

  .back-button {
    position: absolute;
    left: 2rem;
    top: 50%;
    transform: translateY(-50%);
    background: rgba(255, 255, 255, 0.2);
    border: 1px solid rgba(255, 255, 255, 0.3);
    color: white;
    padding: 0.5rem 1rem;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.3s ease;
  }

  .back-button:hover {
    background: rgba(255, 255, 255, 0.3);
  }

  .header h1 {
    margin: 0 0 0.5rem 0;
    font-size: 2.5rem;
    font-weight: 700;
  }

  .header p {
    margin: 0;
    font-size: 1.1rem;
    opacity: 0.9;
  }

  .reports-summary, .reports-section, .raw-data-section, .recent-reports-section {
    margin-bottom: 2rem;
  }

  .reports-summary h2, .reports-section h2, .raw-data-section h2, .recent-reports-section h2 {
    color: #333;
    margin-bottom: 1rem;
    font-size: 1.5rem;
    font-weight: 600;
  }

  .section-description {
    color: #666;
    font-size: 1rem;
    margin-bottom: 1.5rem;
    text-align: center;
    font-style: italic;
  }

  .raw-data-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
    gap: 1.5rem;
  }

  .raw-data-card {
    border: 2px solid #e3f2fd;
    background: linear-gradient(135deg, #f8f9ff 0%, #ffffff 100%);
  }

  .raw-data-card:hover {
    border-color: #667eea;
    transform: translateY(-4px);
    box-shadow: 0 8px 25px rgba(102, 126, 234, 0.15);
  }

  .summary-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1.5rem;
  }

  .summary-card {
    background: white;
    border-radius: 12px;
    padding: 1.5rem;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .summary-icon {
    font-size: 2.5rem;
    opacity: 0.8;
  }

  .summary-content h3 {
    margin: 0 0 0.5rem 0;
    color: #333;
    font-size: 1rem;
    font-weight: 600;
  }

  .summary-number {
    margin: 0;
    color: #667eea;
    font-size: 2rem;
    font-weight: 700;
  }

  .reports-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
    gap: 1.5rem;
  }

  .report-card {
    background: white;
    border-radius: 12px;
    padding: 1.5rem;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    transition: all 0.3s ease;
  }

  .report-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
  }

  .report-icon {
    font-size: 3rem;
    margin-bottom: 1rem;
    opacity: 0.8;
  }

  .report-content h3 {
    margin: 0 0 0.5rem 0;
    color: #333;
    font-size: 1.3rem;
    font-weight: 600;
  }

  .report-content p {
    margin: 0 0 1.5rem 0;
    color: #666;
    font-size: 1rem;
    line-height: 1.5;
  }

  .report-actions {
    display: flex;
    gap: 1rem;
  }

  .action-btn {
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    text-decoration: none;
    display: inline-block;
    text-align: center;
    flex: 1;
  }

  .action-btn.primary {
    background: #667eea;
    color: white;
  }

  .action-btn.primary:hover {
    background: #5a6fd8;
    transform: translateY(-2px);
  }

  .action-btn.secondary {
    background: #6c757d;
    color: white;
  }

  .action-btn.secondary:hover {
    background: #5a6268;
    transform: translateY(-2px);
  }

  .action-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }

  .action-btn:disabled:hover {
    transform: none;
  }

  .action-btn.small {
    padding: 0.5rem 1rem;
    font-size: 0.9rem;
    flex: none;
  }

  .recent-reports-list {
    background: white;
    border-radius: 12px;
    padding: 1.5rem;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  .recent-report-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 0;
    border-bottom: 1px solid #e1e5e9;
  }

  .recent-report-item:last-child {
    border-bottom: none;
  }

  .report-info h4 {
    margin: 0 0 0.25rem 0;
    color: #333;
    font-size: 1.1rem;
    font-weight: 600;
  }

  .report-info p {
    margin: 0;
    color: #666;
    font-size: 0.9rem;
  }

  .error-message {
    background: #fee;
    border: 1px solid #fcc;
    color: #c33;
    padding: 1rem;
    border-radius: 8px;
    text-align: center;
    margin: 2rem 0;
  }

  @media (max-width: 768px) {
    .reports-container {
      padding: 0.5rem;
    }

    .header {
      padding: 1.5rem;
    }

    .back-button {
      position: static;
      transform: none;
      margin-bottom: 1rem;
    }

    .header h1 {
      font-size: 2rem;
    }

    .summary-grid, .reports-grid, .raw-data-grid {
      grid-template-columns: 1fr;
    }

    .report-actions {
      flex-direction: column;
    }

    .recent-report-item {
      flex-direction: column;
      align-items: flex-start;
      gap: 1rem;
    }
  }

</style>
