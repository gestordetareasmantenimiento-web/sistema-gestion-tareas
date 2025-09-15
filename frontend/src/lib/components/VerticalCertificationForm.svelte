<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import { showError, showSuccess } from '$lib/services/modalService';
  
  const dispatch = createEventDispatcher();
  
  export let tarea: any;
  export let taskId: string | null = null;
  export let manoDeObra: any[] = [];
  export let materiales: any[] = [];
  
  // Props para modo edición
  export let isEditMode = false;
  export let certificadoData: any = null; // Datos del certificado existente
  
  // Estados del formulario
  let currentStep = 1;
  let isSubmitting = false;
  let showSuccessModal = false;
  
  // Datos del certificado
  let fechaInicio = '';
  let fechaFin = '';
  let observaciones = '';
  
  // Items seleccionados
  let codigosManoDeObraSeleccionados: any[] = [];
  let cantidadesManoDeObra: { [key: string]: number } = {};
  let codigosMaterialesUtilizados: any[] = [];
  let cantidadesMaterialesUtilizados: { [key: string]: number } = {};
  let codigosMaterialesRecuperados: any[] = [];
  let cantidadesMaterialesRecuperados: { [key: string]: number } = {};
  
  // Estados para buscador y favoritos
  let searchTerm = '';
  let activeTab = 'favoritos'; // 'general' o 'favoritos' - por defecto favoritos
  let favoritos: any[] = [];
  
  // Estados para buscador de materiales
  let searchTermMateriales = '';
  let activeTabMateriales = 'favoritos'; // 'general' o 'favoritos' - por defecto favoritos
  let favoritosMaterialesUtilizados: any[] = [];
  let favoritosMaterialesRecuperados: any[] = [];
  
  // Estados para cálculos
  let subtotalManoDeObra = 0;
  let ivaManoDeObra = 0;
  let totalManoDeObra = 0;
  
  // Estados para costo mínimo diario
  let costoMinimoDiario = 735000;
  
  // Estados para cuadrilla modelo
  let porcentajeCuadrillaModelo = 40;
  
  // Estado para error de validación de códigos automáticos
  let errorValidacionAutomaticos = '';
  
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
  
  // Filtrado de mano de obra
  $: manoDeObraFiltrada = (() => {
    const lista = activeTab === 'favoritos' ? favoritos : manoDeObra;
    if (!searchTerm.trim()) return lista;
    
    const term = searchTerm.toLowerCase();
    return lista.filter(item => 
      item.codigo?.toLowerCase().includes(term) ||
      item.descripcion?.toLowerCase().includes(term)
    );
  })();
  
  // Filtrado de materiales utilizados
  $: materialesUtilizadosFiltrados = (() => {
    const lista = activeTabMateriales === 'favoritos' ? favoritosMaterialesUtilizados : materiales;
    if (!searchTermMateriales.trim()) return lista;
    
    const term = searchTermMateriales.toLowerCase();
    return lista.filter(item => 
      item.codigo?.toLowerCase().includes(term) || 
      item.descripcion?.toLowerCase().includes(term)
    );
  })();

  // Filtrado de materiales recuperados
  $: materialesRecuperadosFiltrados = (() => {
    const lista = activeTabMateriales === 'favoritos' ? favoritosMaterialesRecuperados : materiales;
    if (!searchTermMateriales.trim()) return lista;
    
    const term = searchTermMateriales.toLowerCase();
    return lista.filter(item => 
      item.codigo?.toLowerCase().includes(term) || 
      item.descripcion?.toLowerCase().includes(term)
    );
  })();
  
  // Cálculos automáticos de totales
  $: {
    subtotalManoDeObra = 0;
    let subtotalOtrosItems = 0;
    let costoMinimoCalculado = 0;
    let cuadrillaModeloCalculada = 0;
    
    // Verificar si ambos códigos automáticos están seleccionados
    const tieneCostoMinimo = codigosManoDeObraSeleccionados.some(c => c.codigo === '5020982');
    const tieneCuadrillaModelo = codigosManoDeObraSeleccionados.some(c => c.codigo === '5033311');
    const ambosAutomaticos = tieneCostoMinimo && tieneCuadrillaModelo;
    
    // PASO 1: Calcular subtotal de otros items (excluyendo ambos códigos automáticos)
    let subtotalOtrosItemsBase = 0;
    codigosManoDeObraSeleccionados.forEach(otroCodigo => {
      if (otroCodigo.codigo !== '5020982' && otroCodigo.codigo !== '5033311') {
        const otraCantidad = cantidadesManoDeObra[otroCodigo.id] || 0;
        const otroPrecio = parseFloat(otroCodigo.precio) || 0;
        subtotalOtrosItemsBase += otraCantidad * otroPrecio;
      }
    });
    
    // PASO 2: Calcular cuadrilla modelo (40% del subtotal base)
    cuadrillaModeloCalculada = subtotalOtrosItemsBase * (porcentajeCuadrillaModelo / 100);
    
    // PASO 3: Calcular costo mínimo diario
    const totalConCuadrilla = subtotalOtrosItemsBase + cuadrillaModeloCalculada;
    if (totalConCuadrilla < costoMinimoDiario) {
      // Si no supera el costo mínimo, aplicar la diferencia
      costoMinimoCalculado = costoMinimoDiario - totalConCuadrilla;
    } else {
      // Si supera el costo mínimo, el costo mínimo va a 0
      costoMinimoCalculado = 0;
    }
    
    // PASO 4: Validación y error
    if (ambosAutomaticos && totalConCuadrilla >= costoMinimoDiario) {
      errorValidacionAutomaticos = `La suma de otros códigos ($${subtotalOtrosItemsBase.toLocaleString('es-AR', { minimumFractionDigits: 2 })}) + cuadrilla modelo ($${cuadrillaModeloCalculada.toLocaleString('es-AR', { minimumFractionDigits: 2 })}) = $${totalConCuadrilla.toLocaleString('es-AR', { minimumFractionDigits: 2 })} supera el costo mínimo diario ($${costoMinimoDiario.toLocaleString('es-AR', { minimumFractionDigits: 2 })}). El costo mínimo diario no aplica. Debe eliminar el código 5020982 - COSTO MÍNIMO DIARIO.`;
    } else {
      errorValidacionAutomaticos = '';
    }
    
    // PASO 5: Calcular totales finales
    codigosManoDeObraSeleccionados.forEach(codigo => {
      const cantidad = cantidadesManoDeObra[codigo.id] || 0;
      let precio = parseFloat(codigo.precio) || 0;
      
      // Para el código 5020982, usar el costo mínimo calculado
      if (codigo.codigo === '5020982') {
        precio = costoMinimoCalculado;
      }
      
      // Para el código 5033311, usar la cuadrilla modelo calculada
      if (codigo.codigo === '5033311') {
        precio = cuadrillaModeloCalculada;
      }
      
      subtotalManoDeObra += cantidad * precio;
    });
    
    ivaManoDeObra = subtotalManoDeObra * 0.21;
    totalManoDeObra = subtotalManoDeObra + ivaManoDeObra;
  }
  
  // Configuración de pasos
  const steps = [
    { id: 1, title: 'Fechas de Trabajo', icon: '📅', description: 'Define las fechas de inicio y fin del trabajo' },
    { id: 2, title: 'Seleccionar Mano de Obra', icon: '👷', description: 'Selecciona los códigos de trabajo ejecutados' },
    { id: 3, title: 'Cantidades Mano de Obra', icon: '📊', description: 'Ingresa las cantidades para cada código' },
    { id: 4, title: 'Seleccionar Materiales Utilizados', icon: '🔧', description: 'Selecciona los materiales consumidos' },
    { id: 5, title: 'Cantidades Materiales Utilizados', icon: '📊', description: 'Ingresa las cantidades de materiales utilizados' },
    { id: 6, title: 'Seleccionar Materiales Recuperados', icon: '♻️', description: 'Selecciona los materiales recuperados' },
    { id: 7, title: 'Cantidades Materiales Recuperados', icon: '📊', description: 'Ingresa las cantidades de materiales recuperados' },
    { id: 8, title: 'Documentación', icon: '📎', description: 'Adjunta fotos y documentos' },
    { id: 9, title: 'Resumen', icon: '✅', description: 'Revisa y confirma la información' }
  ];
  
  // Cargar datos si están vacíos
  onMount(async () => {
    const token = localStorage.getItem('authToken');
    console.log('🔑 Token encontrado:', token ? 'Sí' : 'No');
    
    if (token) {
      try {
        // Cargar favoritos siempre (independientemente de si ya se cargaron mano de obra y materiales)
        console.log('🔄 Cargando favoritos...');
        const [favoritosManoDeObraResponse, favoritosMaterialesUtilizadosResponse, favoritosMaterialesRecuperadosResponse] = await Promise.all([
          fetch('http://localhost:3000/api/listas/favoritos/mano-de-obra', {
            headers: { 'Authorization': `Bearer ${token}` }
          }),
          fetch('http://localhost:3000/api/listas/favoritos/materiales-utilizados', {
            headers: { 'Authorization': `Bearer ${token}` }
          }),
          fetch('http://localhost:3000/api/listas/favoritos/materiales-recuperados', {
            headers: { 'Authorization': `Bearer ${token}` }
          })
        ]);

        console.log('🔍 Favoritos mano de obra response status:', favoritosManoDeObraResponse.status);
        if (favoritosManoDeObraResponse.ok) {
          const favoritosData = await favoritosManoDeObraResponse.json();
          console.log('🔍 Favoritos mano de obra response:', favoritosData);
          favoritos = favoritosData.data || [];
          console.log('⭐ Favoritos cargados:', favoritos);
          console.log('⭐ Cantidad de favoritos:', favoritos.length);
        } else {
          const errorText = await favoritosManoDeObraResponse.text();
          console.error('❌ Error cargando favoritos mano de obra:', favoritosManoDeObraResponse.status, favoritosManoDeObraResponse.statusText, errorText);
        }

        if (favoritosMaterialesUtilizadosResponse.ok) {
          const favoritosMaterialesUtilizadosData = await favoritosMaterialesUtilizadosResponse.json();
          favoritosMaterialesUtilizados = favoritosMaterialesUtilizadosData.data || [];
        }

        if (favoritosMaterialesRecuperadosResponse.ok) {
          const favoritosMaterialesRecuperadosData = await favoritosMaterialesRecuperadosResponse.json();
          favoritosMaterialesRecuperados = favoritosMaterialesRecuperadosData.data || [];
        }

        // Cargar datos del certificado existente si está en modo edición
        if (isEditMode && certificadoData) {
          console.log('🔄 Cargando datos del certificado existente...', certificadoData);
          loadExistingCertificateData();
        }

        // Cargar mano de obra y materiales solo si están vacíos
        if (manoDeObra.length === 0 || materiales.length === 0) {
          console.log('🔄 Cargando mano de obra y materiales...');
          const [manoDeObraResponse, materialesResponse] = await Promise.all([
            fetch('http://localhost:3000/api/listas/mano-de-obra', {
              headers: { 'Authorization': `Bearer ${token}` }
            }),
            fetch('http://localhost:3000/api/listas/materiales', {
              headers: { 'Authorization': `Bearer ${token}` }
            })
          ]);

          if (manoDeObraResponse.ok) {
            const manoDeObraData = await manoDeObraResponse.json();
            manoDeObra = manoDeObraData.data || [];
          }

          if (materialesResponse.ok) {
            const materialesData = await materialesResponse.json();
            materiales = materialesData.data || [];
          }
        }
      } catch (error) {
        console.error('Error cargando listas:', error);
      }
    }
    
    // Cargar costo mínimo diario y porcentaje de cuadrilla modelo
    cargarCostoMinimoDiario();
    cargarPorcentajeCuadrillaModelo();
  });

  // Función para cargar datos del certificado existente en modo edición
  function loadExistingCertificateData() {
    if (!certificadoData) return;
    
    console.log('📋 Cargando datos del certificado existente:', certificadoData);
    
    // Cargar fechas
    if (certificadoData.tarea?.fecha_inicio) {
      fechaInicio = certificadoData.tarea.fecha_inicio;
    }
    if (certificadoData.tarea?.fecha_fin) {
      fechaFin = certificadoData.tarea.fecha_fin;
    }
    if (certificadoData.tarea?.observaciones) {
      observaciones = certificadoData.tarea.observaciones;
    }
    
    // Cargar mano de obra
    if (certificadoData.mano_de_obra && Array.isArray(certificadoData.mano_de_obra)) {
      codigosManoDeObraSeleccionados = certificadoData.mano_de_obra.map((item: any) => ({
        codigo: item.codigo,
        descripcion: item.descripcion,
        unidad_medida: item.unidad_medida,
        precio_unitario: item.precio_unitario
      }));
      
      // Cargar cantidades
      certificadoData.mano_de_obra.forEach((item: any) => {
        cantidadesManoDeObra[item.codigo] = item.cantidad || 0;
      });
    }
    
    // Cargar materiales utilizados
    if (certificadoData.materialesUtilizados && Array.isArray(certificadoData.materialesUtilizados)) {
      codigosMaterialesUtilizados = certificadoData.materialesUtilizados.map((item: any) => ({
        codigo: item.codigo,
        descripcion: item.descripcion,
        unidad_medida: item.unidad_medida,
        precio_unitario: item.precio_unitario
      }));
      
      // Cargar cantidades
      certificadoData.materialesUtilizados.forEach((item: any) => {
        cantidadesMaterialesUtilizados[item.codigo] = item.cantidad || 0;
      });
    }
    
    // Cargar materiales recuperados
    if (certificadoData.materialesRecuperados && Array.isArray(certificadoData.materialesRecuperados)) {
      codigosMaterialesRecuperados = certificadoData.materialesRecuperados.map((item: any) => ({
        codigo: item.codigo,
        descripcion: item.descripcion,
        unidad_medida: item.unidad_medida,
        precio_unitario: item.precio_unitario
      }));
      
      // Cargar cantidades
      certificadoData.materialesRecuperados.forEach((item: any) => {
        cantidadesMaterialesRecuperados[item.codigo] = item.cantidad || 0;
      });
    }
    
    console.log('✅ Datos del certificado cargados:', {
      fechaInicio,
      fechaFin,
      observaciones,
      codigosManoDeObraSeleccionados,
      codigosMaterialesUtilizados,
      codigosMaterialesRecuperados
    });
    
    // Forzar recálculo de totales después de cargar los datos
    // Esto se hace modificando las variables reactivas para que se disparen los cálculos
    setTimeout(() => {
      // Forzar reactividad modificando las cantidades
      const tempCantidades = { ...cantidadesManoDeObra };
      cantidadesManoDeObra = {};
      cantidadesManoDeObra = tempCantidades;
      
      // También forzar reactividad en los códigos seleccionados
      const tempCodigos = [...codigosManoDeObraSeleccionados];
      codigosManoDeObraSeleccionados = [];
      codigosManoDeObraSeleccionados = tempCodigos;
      
      console.log('🔄 Forzando recálculo de totales...');
    }, 200);
  }

  // Funciones de navegación
  async function nextStep() {
    console.log('nextStep called - currentStep:', currentStep);
    if (await validateCurrentStep()) {
      console.log('Validation passed, advancing to step:', currentStep + 1);
      currentStep++;
    } else {
      console.log('Validation failed, staying at step:', currentStep);
    }
  }
  
  function prevStep() {
    currentStep--;
  }
  
  async function goToStep(step: number) {
    if (step <= currentStep || await validateCurrentStep()) {
      currentStep = step;
    }
  }
  
  // Validaciones por paso
  async function validateCurrentStep(): Promise<boolean> {
    switch (currentStep) {
      case 1:
        if (!fechaInicio || !fechaFin) {
          await showError('Fechas Requeridas', 'Por favor, completa las fechas de inicio y fin.');
          return false;
        }
        if (new Date(fechaInicio) > new Date(fechaFin)) {
          await showError('Fechas Inválidas', 'La fecha de inicio no puede ser posterior a la fecha de fin.');
          return false;
        }
        return true;
      case 2:
        if (codigosManoDeObraSeleccionados.length === 0) {
          await showError('Mano de Obra Requerida', 'Debes seleccionar al menos un código de mano de obra.');
          return false;
        }
        return true;
      case 3:
        // Validar que todas las cantidades sean mayores a 0
        for (const codigo of codigosManoDeObraSeleccionados) {
          const identifier = codigo.id || codigo.codigo;
          const cantidad = cantidadesManoDeObra[identifier];
          if (cantidad === undefined || cantidad === null || cantidad <= 0) {
            await showError('No puede haber items en 0', `Debes ingresar una cantidad válida para ${codigo.descripcion}.`);
            return false;
          }
        }
        
        // Validar códigos automáticos si hay error
        if (errorValidacionAutomaticos) {
          await showError('Error en Códigos Automáticos', errorValidacionAutomaticos);
          return false;
        }
        
        return true;
      case 4:
        if (codigosMaterialesUtilizados.length === 0) {
          await showError('Materiales Requeridos', 'Debes seleccionar al menos un material utilizado.');
          return false;
        }
        return true;
      case 5:
        // Validar que todas las cantidades de materiales utilizados sean mayores a 0
        for (const material of codigosMaterialesUtilizados) {
          const cantidad = cantidadesMaterialesUtilizados[material.id];
          if (!cantidad || cantidad <= 0) {
            await showError('Cantidad Inválida', `Debes ingresar una cantidad válida para ${material.descripcion}.`);
            return false;
          }
        }
        return true;
      case 6:
        // Paso 6 es selección de materiales recuperados (opcional)
        return true;
      case 7:
        // Validar cantidades de materiales recuperados (opcional, pero si hay seleccionados deben tener cantidad)
        for (const material of codigosMaterialesRecuperados) {
          const cantidad = cantidadesMaterialesRecuperados[material.id];
          if (!cantidad || cantidad <= 0) {
            await showError('Cantidad Inválida', `Debes ingresar una cantidad válida para ${material.descripcion}.`);
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
    const identifier = codigo.id || codigo.codigo;
    const index = codigosManoDeObraSeleccionados.findIndex(c => (c.id || c.codigo) === identifier);
    if (index > -1) {
      codigosManoDeObraSeleccionados = codigosManoDeObraSeleccionados.filter(c => (c.id || c.codigo) !== identifier);
      // Remover cantidad si existe
      delete cantidadesManoDeObra[identifier];
    } else {
      codigosManoDeObraSeleccionados = [...codigosManoDeObraSeleccionados, codigo];
      // Para los códigos 5020982 y 5033311, inicializar con cantidad 1 (se calculan automáticamente)
      // Para otros códigos, inicializar en 0
      cantidadesManoDeObra[identifier] = (codigo.codigo === '5020982' || codigo.codigo === '5033311') ? 1 : 0;
    }
    
  }

  // Función para eliminar item de mano de obra desde la etapa de cantidades
  function removeManoDeObraItem(codigo: any) {
    const identifier = codigo.id || codigo.codigo;
    codigosManoDeObraSeleccionados = codigosManoDeObraSeleccionados.filter(c => (c.id || c.codigo) !== identifier);
    delete cantidadesManoDeObra[identifier];
  }

  function updateCantidadManoDeObra(codigoId: string, cantidad: number) {
    cantidadesManoDeObra[codigoId] = cantidad;
  }

  function isCodigoSeleccionado(codigo: any) {
    const identifier = codigo.id || codigo.codigo;
    return codigosManoDeObraSeleccionados.some(c => (c.id || c.codigo) === identifier);
  }
  
  // Funciones para manejar favoritos
  async function toggleFavorito(codigo: any) {
    const token = localStorage.getItem('authToken');
    if (!token) return;

    // Usar siempre codigo.codigo para la identificación
    const codigoIdentificador = codigo.codigo;
    const isCurrentlyFavorito = favoritos.some(f => f.codigo === codigoIdentificador);

    console.log('🔍 toggleFavorito:', { codigo, codigoIdentificador, isCurrentlyFavorito });

    try {
      if (isCurrentlyFavorito) {
        // Quitar de favoritos
        console.log('🗑️ Quitando de favoritos...');
        const response = await fetch(`http://localhost:3000/api/listas/favoritos/mano-de-obra/${codigoIdentificador}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        console.log('🗑️ Response status:', response.status);
        if (response.ok) {
          favoritos = favoritos.filter(f => f.codigo !== codigoIdentificador);
          console.log('✅ Favorito quitado exitosamente');
        } else {
          const errorText = await response.text();
          console.error('❌ Error quitando favorito:', errorText);
        }
      } else {
        // Agregar a favoritos
        console.log('⭐ Agregando a favoritos...');
        const response = await fetch('http://localhost:3000/api/listas/favoritos/mano-de-obra', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            codigo: codigo.codigo,
            descripcion: codigo.descripcion,
            unidad_medida: codigo.unidad_medida,
            precio: codigo.precio
          })
        });
        
        console.log('⭐ Response status:', response.status);
        if (response.ok) {
          favoritos = [...favoritos, { ...codigo, codigo: codigoIdentificador }];
          console.log('✅ Favorito agregado exitosamente');
        } else {
          const errorText = await response.text();
          console.error('❌ Error agregando favorito:', errorText);
        }
      }
    } catch (error) {
      console.error('❌ Error gestionando favorito:', error);
    }
  }
  
  function isFavorito(codigo: any) {
    const codigoIdentificador = codigo.codigo;
    return favoritos.some(f => f.codigo === codigoIdentificador);
  }
  
  // Funciones para manejar materiales
  function toggleCodigoMaterialUtilizado(material: any) {
    console.log('🔧 Toggle material utilizado:', material);
    console.log('🔧 Material.id:', material.id);
    console.log('🔧 Material.codigo:', material.codigo);
    
    // Usar codigo como identificador único si no hay id
    const identifier = material.id || material.codigo;
    const index = codigosMaterialesUtilizados.findIndex(m => (m.id || m.codigo) === identifier);
    
    if (index > -1) {
      codigosMaterialesUtilizados = codigosMaterialesUtilizados.filter(m => (m.id || m.codigo) !== identifier);
      delete cantidadesMaterialesUtilizados[identifier];
    } else {
      codigosMaterialesUtilizados = [...codigosMaterialesUtilizados, { ...material, id: identifier }];
      cantidadesMaterialesUtilizados[identifier] = 0;
    }
    
    console.log('🔧 Materiales utilizados seleccionados:', codigosMaterialesUtilizados.length);
  }
  
  function toggleCodigoMaterialRecuperado(material: any) {
    // Usar codigo como identificador único si no hay id
    const identifier = material.id || material.codigo;
    const index = codigosMaterialesRecuperados.findIndex(m => (m.id || m.codigo) === identifier);
    
    if (index > -1) {
      codigosMaterialesRecuperados = codigosMaterialesRecuperados.filter(m => (m.id || m.codigo) !== identifier);
      delete cantidadesMaterialesRecuperados[identifier];
    } else {
      codigosMaterialesRecuperados = [...codigosMaterialesRecuperados, { ...material, id: identifier }];
      cantidadesMaterialesRecuperados[identifier] = 0;
    }
  }
  
  function updateCantidadMaterialUtilizado(materialId: string, cantidad: number) {
    cantidadesMaterialesUtilizados[materialId] = cantidad;
  }
  
  function updateCantidadMaterialRecuperado(materialId: string, cantidad: number) {
    cantidadesMaterialesRecuperados[materialId] = cantidad;
  }

  // Función para eliminar item de material utilizado desde la etapa de cantidades
  function removeMaterialUtilizadoItem(material: any) {
    const identifier = material.id || material.codigo;
    codigosMaterialesUtilizados = codigosMaterialesUtilizados.filter(m => (m.id || m.codigo) !== identifier);
    delete cantidadesMaterialesUtilizados[identifier];
  }

  // Función para eliminar item de material recuperado desde la etapa de cantidades
  function removeMaterialRecuperadoItem(material: any) {
    const identifier = material.id || material.codigo;
    codigosMaterialesRecuperados = codigosMaterialesRecuperados.filter(m => (m.id || m.codigo) !== identifier);
    delete cantidadesMaterialesRecuperados[identifier];
  }
  
  function isMaterialUtilizadoSeleccionado(material: any) {
    const identifier = material.id || material.codigo;
    return codigosMaterialesUtilizados.some(m => (m.id || m.codigo) === identifier);
  }
  
  function isMaterialRecuperadoSeleccionado(material: any) {
    const identifier = material.id || material.codigo;
    return codigosMaterialesRecuperados.some(m => (m.id || m.codigo) === identifier);
  }
  
  // Función para cargar costo mínimo diario
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
  
  // Función para cargar porcentaje de cuadrilla modelo
  async function cargarPorcentajeCuadrillaModelo() {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('http://localhost:3000/api/cuadrilla-modelo/porcentaje', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const result = await response.json();
        porcentajeCuadrillaModelo = result.data.porcentaje;
      }
    } catch (error) {
      console.error('Error cargando porcentaje de cuadrilla modelo:', error);
    }
  }
  
  // Funciones para manejar favoritos de materiales

  // Función específica para favoritos de materiales utilizados
  async function toggleFavoritoMaterialUtilizado(material: any) {
    const token = localStorage.getItem('authToken');
    if (!token) return;

    const codigoIdentificador = material.codigo;
    const isCurrentlyFavorito = favoritosMaterialesUtilizados.some(f => f.codigo === codigoIdentificador);

    try {
      if (isCurrentlyFavorito) {
        const response = await fetch(`http://localhost:3000/api/listas/favoritos/materiales-utilizados/${codigoIdentificador}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
          favoritosMaterialesUtilizados = favoritosMaterialesUtilizados.filter(f => f.codigo !== codigoIdentificador);
        }
      } else {
        const response = await fetch('http://localhost:3000/api/listas/favoritos/materiales-utilizados', {
          method: 'POST',
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            codigo: material.codigo,
            descripcion: material.descripcion,
            unidad_medida: material.unidad_medida
          })
        });
        
        if (response.ok) {
          favoritosMaterialesUtilizados = [...favoritosMaterialesUtilizados, { ...material, codigo: codigoIdentificador }];
        }
      }
    } catch (error) {
      console.error('Error gestionando favorito de material utilizado:', error);
    }
  }

  // Función específica para favoritos de materiales recuperados
  async function toggleFavoritoMaterialRecuperado(material: any) {
    const token = localStorage.getItem('authToken');
    if (!token) return;

    const codigoIdentificador = material.codigo;
    const isCurrentlyFavorito = favoritosMaterialesRecuperados.some(f => f.codigo === codigoIdentificador);

    try {
      if (isCurrentlyFavorito) {
        const response = await fetch(`http://localhost:3000/api/listas/favoritos/materiales-recuperados/${codigoIdentificador}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
          favoritosMaterialesRecuperados = favoritosMaterialesRecuperados.filter(f => f.codigo !== codigoIdentificador);
        }
      } else {
        const response = await fetch('http://localhost:3000/api/listas/favoritos/materiales-recuperados', {
          method: 'POST',
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            codigo: material.codigo,
            descripcion: material.descripcion,
            unidad_medida: material.unidad_medida
          })
        });
        
        if (response.ok) {
          favoritosMaterialesRecuperados = [...favoritosMaterialesRecuperados, { ...material, codigo: codigoIdentificador }];
        }
      }
    } catch (error) {
      console.error('Error gestionando favorito de material recuperado:', error);
    }
  }
  
  function isFavoritoMaterialUtilizado(material: any) {
    const codigoIdentificador = material.codigo;
    return favoritosMaterialesUtilizados.some(f => f.codigo === codigoIdentificador);
  }

  function isFavoritoMaterialRecuperado(material: any) {
    const codigoIdentificador = material.codigo;
    return favoritosMaterialesRecuperados.some(f => f.codigo === codigoIdentificador);
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

  // Función para volver al dashboard según el rol del usuario
  function handleBackToDashboard() {
    try {
      const token = localStorage.getItem('authToken');
      if (token) {
        // Decodificar el token para obtener el rol del usuario
        const payload = JSON.parse(atob(token.split('.')[1]));
        const userRole = payload.rol;
        
        console.log('🔍 Usuario rol:', userRole);
        console.log('🔍 Payload completo:', payload);
        
        // Navegar al dashboard correspondiente según el rol
        let targetRoute = '/dashboard'; // Ruta por defecto
        
        // Normalizar el rol para comparación
        const normalizedRole = userRole.toLowerCase().trim();
        console.log('🔍 Rol normalizado:', normalizedRole);
        
        switch (normalizedRole) {
          case 'proveedor':
            targetRoute = '/proveedor/dashboard';
            break;
          case 'inspector':
            targetRoute = '/dashboard';
            break;
          case 'supervisor de mantenimiento':
            targetRoute = '/supervisor/dashboard';
            break;
          case 'supervisor de disponibilidad':
          case 'supervisor de soporte':
          case 'supervisor de provisión':
            targetRoute = '/supervisor/dashboard';
            break;
          case 'administrativo':
            targetRoute = '/admin/dashboard';
            break;
          case 'gerente':
            targetRoute = '/gerente/dashboard';
            break;
          case 'cerco':
            targetRoute = '/cerco/dashboard';
            break;
          default:
            console.warn('Rol no reconocido:', normalizedRole);
            targetRoute = '/dashboard';
        }
        
        console.log('🚀 Navegando a:', targetRoute);
        // Usar window.location para forzar una navegación completa
        window.location.href = targetRoute;
        
        // Recargar la página después de un breve delay para asegurar que la navegación se complete
        setTimeout(() => {
          console.log('🔄 Recargando página para actualizar datos...');
          window.location.reload();
        }, 500);
      } else {
        console.error('No token found');
        window.location.href = '/';
      }
    } catch (error) {
      console.error('Error al navegar al dashboard:', error);
      window.location.href = '/';
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
      // Preparar datos de mano de obra
      const manoDeObraData = codigosManoDeObraSeleccionados.map(codigo => {
        const identifier = codigo.id || codigo.codigo;
        const cantidad = cantidadesManoDeObra[identifier];
        return {
          id: codigo.id,
          codigo: codigo.codigo,
          descripcion: codigo.descripcion,
          unidad_medida: codigo.unidad_medida,
          precio: codigo.precio,
          cantidad: cantidad
        };
      });
      
      // Preparar datos de materiales utilizados
      const materialesUtilizadosData = codigosMaterialesUtilizados.map(material => {
        const identifier = material.id || material.codigo;
        const cantidad = cantidadesMaterialesUtilizados[identifier];
        return {
          id: material.id,
          codigo: material.codigo,
          descripcion: material.descripcion,
          unidad_medida: material.unidad_medida,
          cantidad: cantidad,
          tipo: 'utilizado'
        };
      });
      
      // Preparar datos de materiales recuperados
      const materialesRecuperadosData = codigosMaterialesRecuperados.map(material => {
        const identifier = material.id || material.codigo;
        const cantidad = cantidadesMaterialesRecuperados[identifier];
        return {
          id: material.id,
          codigo: material.codigo,
          descripcion: material.descripcion,
          unidad_medida: material.unidad_medida,
          cantidad: cantidad,
          tipo: 'recuperado'
        };
      });
      
      formData.append('mano_de_obra', JSON.stringify(manoDeObraData));
      formData.append('materiales_utilizados', JSON.stringify(materialesUtilizadosData));
      formData.append('materiales_recuperados', JSON.stringify(materialesRecuperadosData));
      
      if (archivos) {
        Array.from(archivos).forEach(file => {
          formData.append('archivos', file);
        });
      }
      
      const token = localStorage.getItem('authToken');
      const tareaId = tarea.id || taskId;
      console.log('🔍 ID de tarea para certificar:', tareaId);
      console.log('🚀 Enviando certificado...', { tareaId, token: token ? 'Presente' : 'Ausente' });
      
      // Determinar endpoint y método según el modo
      const endpoint = isEditMode 
        ? `http://localhost:3000/api/tareas/${tareaId}/editar-certificado`
        : `http://localhost:3000/api/tareas/${tareaId}/emitir-certificado`;
      const method = isEditMode ? 'PUT' : 'POST';
      
      const response = await fetch(endpoint, {
        method: method,
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      
      console.log('📡 Respuesta del servidor:', response.status, response.statusText);
      
      if (response.ok) {
        const result = await response.json();
        const successMessage = isEditMode ? '✅ Certificado editado exitosamente:' : '✅ Certificado emitido exitosamente:';
        console.log(successMessage, result);
        showSuccessModal = true;
        // Usar tareaId que ya tenemos disponible
        dispatch('certificadoEmitido', { tarea: tareaId });
      } else {
        const errorText = await response.text();
        console.error('❌ Error del servidor:', response.status, response.statusText, errorText);
        throw new Error(`Error al enviar certificado: ${response.status} - ${errorText}`);
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
  {#if showSuccessModal}
    <div class="success-screen">
      <div class="success-icon">🎉</div>
      <h2>{isEditMode ? '¡Certificado Editado Exitosamente!' : '¡Certificado Emitido Exitosamente!'}</h2>
      <p>Tu certificado ha sido enviado y está siendo revisado por el inspector.</p>
      <button class="success-btn" on:click={handleBackToDashboard}>
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
          <h2>{isEditMode ? '✏️ Editar Certificado de Trabajo' : '📋 Certificado de Trabajo'}</h2>
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
            
            <!-- Buscador -->
            <div class="search-container">
              <input 
                type="text" 
                placeholder="Buscar por código o descripción..." 
                bind:value={searchTerm}
                class="search-input"
              />
              <span class="search-icon">🔍</span>
            </div>
            
            <!-- Solapas General/Favoritos -->
            <div class="tabs-container">
              <button 
                class="tab-btn" 
                class:active={activeTab === 'general'}
                on:click={() => activeTab = 'general'}
              >
                Lista completa ({manoDeObra.length})
              </button>
              <button 
                class="tab-btn" 
                class:active={activeTab === 'favoritos'}
                on:click={() => activeTab = 'favoritos'}
              >
                Favoritos ({favoritos.length})
              </button>
            </div>
            
            <!-- Lista de códigos optimizada -->
            <div class="codes-list">
              {#each manoDeObraFiltrada as item}
                <div class="code-item" class:selected={isCodigoSeleccionado(item)}>
                  <div class="code-info">
                    <button 
                      class="favorite-btn-left" 
                      class:favorited={isFavorito(item)}
                      on:click|stopPropagation={() => toggleFavorito(item)}
                      title={isFavorito(item) ? 'Quitar de favoritos' : 'Agregar a favoritos'}
                    >
                      {isFavorito(item) ? '⭐' : '☆'}
                    </button>
                    <div class="code-main">
                      <span class="code">{item.codigo}</span>
                      <span class="description">{item.descripcion}</span>
                      {#if item.codigo === '5020982'}
                        <span class="auto-calculated-label">🔄 Se calcula automáticamente</span>
                      {/if}
                      {#if item.codigo === '5033311'}
                        <span class="auto-calculated-label">🔄 Se calcula automáticamente</span>
                      {/if}
                    </div>
                    <div class="code-details">
                      <span class="unit">{item.unidad_medida}</span>
                      <span class="price">${item.precio}</span>
                    </div>
                  </div>
                  <div class="code-actions">
                    <button 
                      class="select-btn" 
                      class:selected={isCodigoSeleccionado(item)}
                      on:click={() => toggleCodigoManoDeObra(item)}
                    >
                      {isCodigoSeleccionado(item) ? '✓' : '+'}
                    </button>
                  </div>
                </div>
              {/each}
              
              {#if manoDeObraFiltrada.length === 0}
                <div class="no-results">
                  {#if searchTerm.trim()}
                    No se encontraron resultados para "{searchTerm}"
                  {:else if activeTab === 'favoritos'}
                    No tienes códigos marcados como favoritos
                  {:else}
                    No hay códigos de mano de obra disponibles
                  {/if}
                </div>
              {/if}
            </div>
            
            <!-- Contador de seleccionados -->
            {#if codigosManoDeObraSeleccionados.length > 0}
              <div class="selected-counter">
                {codigosManoDeObraSeleccionados.length} código(s) seleccionado(s)
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
          
        {:else if currentStep === 3}
          <!-- Paso 3: Cantidades de Mano de Obra -->
          <div class="step-panel">
            <h3>📊 Cantidades de Mano de Obra</h3>
            <p>Ingresa las cantidades para cada código de mano de obra seleccionado.</p>
            
            <div class="quantities-grid">
              {#each codigosManoDeObraSeleccionados as codigo}
                <div class="quantity-item-compact">
                  <div class="quantity-code">
                    <span class="code">{codigo.codigo}</span>
                  </div>
                  <div class="quantity-description">
                    <span class="description">{codigo.descripcion}</span>
                    {#if codigo.codigo === '5020982' || codigo.codigo === '5033311'}
                      <span class="auto-calculated-label">🔄 Se calcula automáticamente</span>
                    {/if}
                  </div>
                  <div class="quantity-input-compact">
                    <label for="cantidad-{codigo.id || codigo.codigo}">Cantidad:</label>
                    {#if codigo.codigo === '5020982' || codigo.codigo === '5033311'}
                      <input 
                        type="number" 
                        id="cantidad-{codigo.id || codigo.codigo}"
                        value="1"
                        disabled
                        class="disabled-input"
                        title="Este valor se calcula automáticamente"
                      />
                    {:else}
                      <input 
                        type="number" 
                        id="cantidad-{codigo.id || codigo.codigo}"
                        min="0" 
                        step="0.1"
                        value={cantidadesManoDeObra[codigo.id || codigo.codigo] || 0}
                        on:input={(e) => updateCantidadManoDeObra(codigo.id || codigo.codigo, parseFloat((e.target as HTMLInputElement)?.value) || 0)}
                      />
                    {/if}
                    <span class="unit">{codigo.unidad_medida}</span>
                  </div>
                  <div class="quantity-price">
                    <span class="price">${codigo.precio}</span>
                  </div>
                  <button 
                    class="remove-btn" 
                    on:click={() => removeManoDeObraItem(codigo)}
                    title="Eliminar este item"
                  >
                    🗑️
                  </button>
                </div>
              {/each}
            </div>
            
            <!-- Resumen de cálculos -->
            {#if codigosManoDeObraSeleccionados.length > 0}
              <div class="calculation-summary">
                <h4>💰 Resumen de Costos</h4>
                <div class="calculation-grid">
                  {#each codigosManoDeObraSeleccionados as codigo}
                    {@const cantidad = cantidadesManoDeObra[codigo.id] || 0}
                    {@const precioBase = parseFloat(codigo.precio) || 0}
                    {@const subtotalOtrosItems = (() => {
                      let total = 0;
                      codigosManoDeObraSeleccionados.forEach(otroCodigo => {
                        if (otroCodigo.codigo !== '5020982') {
                          const otraCantidad = cantidadesManoDeObra[otroCodigo.id] || 0;
                          const otroPrecio = parseFloat(otroCodigo.precio) || 0;
                          total += otraCantidad * otroPrecio;
                        }
                      });
                      return total;
                    })()}
                    {@const precio = codigo.codigo === '5020982' ? (() => {
                                      // Calcular subtotal base (excluyendo ambos códigos automáticos)
                                      let subtotalBase = 0;
                                      codigosManoDeObraSeleccionados.forEach(otroCodigo => {
                                        if (otroCodigo.codigo !== '5020982' && otroCodigo.codigo !== '5033311') {
                                          const otraCantidad = cantidadesManoDeObra[otroCodigo.id] || 0;
                                          const otroPrecio = parseFloat(otroCodigo.precio) || 0;
                                          subtotalBase += otraCantidad * otroPrecio;
                                        }
                                      });
                                      
                                      // Calcular cuadrilla modelo
                                      const cuadrillaModelo = subtotalBase * (porcentajeCuadrillaModelo / 100);
                                      
                                      // Calcular costo mínimo diario
                                      const totalConCuadrilla = subtotalBase + cuadrillaModelo;
                                      return totalConCuadrilla < costoMinimoDiario ? costoMinimoDiario - totalConCuadrilla : 0;
                                    })() : 
                                    codigo.codigo === '5033311' ? (() => {
                                      // Calcular subtotal base (excluyendo ambos códigos automáticos)
                                      let subtotalBase = 0;
                                      codigosManoDeObraSeleccionados.forEach(otroCodigo => {
                                        if (otroCodigo.codigo !== '5020982' && otroCodigo.codigo !== '5033311') {
                                          const otraCantidad = cantidadesManoDeObra[otroCodigo.id] || 0;
                                          const otroPrecio = parseFloat(otroCodigo.precio) || 0;
                                          subtotalBase += otraCantidad * otroPrecio;
                                        }
                                      });
                                      
                                      // Calcular cuadrilla modelo (40% del subtotal base)
                                      return subtotalBase * (porcentajeCuadrillaModelo / 100);
                                    })() : precioBase}
                    {@const subtotalItem = cantidad * precio}
                    {#if cantidad > 0 && subtotalItem > 0}
                      <div class="calculation-item" class:auto-calculated={codigo.codigo === '5020982' || codigo.codigo === '5033311'}>
                        <span class="item-code">{codigo.codigo}</span>
                        <span class="item-desc">{codigo.descripcion}</span>
                        <span class="item-quantity">{cantidad} {codigo.unidad_medida}</span>
                        <span class="item-price">${precio.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
                        <span class="item-subtotal">${subtotalItem.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
                      </div>
                    {/if}
                  {/each}
                </div>
                
                <div class="calculation-totals">
                  <div class="total-line">
                    <span class="total-label">Subtotal:</span>
                    <span class="total-value">${subtotalManoDeObra.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div class="total-line">
                    <span class="total-label">IVA (21%):</span>
                    <span class="total-value">${ivaManoDeObra.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div class="total-line total-final">
                    <span class="total-label">Total:</span>
                    <span class="total-value">${totalManoDeObra.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>
            {/if}
            
            <!-- Mostrar error de validación de códigos automáticos -->
            {#if errorValidacionAutomaticos}
              <div class="validation-error">
                <div class="error-header">
                  <span class="error-icon">⚠️</span>
                  <span class="error-title">Error en Códigos Automáticos</span>
                </div>
                <div class="error-message">
                  {errorValidacionAutomaticos}
                </div>
              </div>
            {/if}
            
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
          <!-- Paso 4: Seleccionar Materiales Utilizados -->
          <div class="step-panel">
            <h3>🔧 Seleccionar Materiales Utilizados</h3>
            <p>Selecciona todos los materiales que fueron consumidos durante el trabajo.</p>
            
            <!-- Buscador -->
            <div class="search-container">
              <input 
                type="text" 
                placeholder="Buscar por código o descripción..." 
                bind:value={searchTermMateriales}
                class="search-input"
              />
              <span class="search-icon">🔍</span>
            </div>
            
            <!-- Solapas General/Favoritos -->
            <div class="tabs-container">
              <button 
                class="tab-btn" 
                class:active={activeTabMateriales === 'general'}
                on:click={() => activeTabMateriales = 'general'}
              >
                Lista completa ({materiales.length})
              </button>
              <button 
                class="tab-btn" 
                class:active={activeTabMateriales === 'favoritos'}
                on:click={() => activeTabMateriales = 'favoritos'}
              >
                Favoritos ({favoritosMaterialesUtilizados.length})
              </button>
            </div>
            
            <!-- Lista de materiales optimizada -->
            <div class="codes-list">
              {#each materialesUtilizadosFiltrados as item}
                <div class="code-item" class:selected={isMaterialUtilizadoSeleccionado(item)}>
                  <div class="code-info">
                    <button 
                      class="favorite-btn-left" 
                      class:favorited={isFavoritoMaterialUtilizado(item)}
                      on:click|stopPropagation={() => toggleFavoritoMaterialUtilizado(item)}
                      title={isFavoritoMaterialUtilizado(item) ? 'Quitar de favoritos' : 'Agregar a favoritos'}
                    >
                      {isFavoritoMaterialUtilizado(item) ? '⭐' : '☆'}
                    </button>
                    <div class="code-main">
                      <span class="code">{item.codigo}</span>
                      <span class="description">{item.descripcion}</span>
                    </div>
                    <div class="code-details">
                      <span class="unit">{item.unidad_medida}</span>
                    </div>
                  </div>
                  <div class="code-actions">
                    <button 
                      class="select-btn" 
                      class:selected={isMaterialUtilizadoSeleccionado(item)}
                      on:click={() => toggleCodigoMaterialUtilizado(item)}
                    >
                      {isMaterialUtilizadoSeleccionado(item) ? '✓' : '+'}
                    </button>
                  </div>
                </div>
              {/each}
              
              {#if materialesUtilizadosFiltrados.length === 0}
                <div class="no-results">
                  {#if searchTermMateriales.trim()}
                    No se encontraron resultados para "{searchTermMateriales}"
                  {:else if activeTabMateriales === 'favoritos'}
                    No tienes materiales marcados como favoritos
                  {:else}
                    No hay materiales disponibles
                  {/if}
                </div>
              {/if}
            </div>
            
            <!-- Contador de seleccionados -->
            {#if codigosMaterialesUtilizados.length > 0}
              <div class="selected-counter">
                {codigosMaterialesUtilizados.length} material(es) seleccionado(s)
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
          
        {:else if currentStep === 5}
          <!-- Paso 5: Cantidades Materiales Utilizados -->
          <div class="step-panel">
            <h3>📊 Cantidades Materiales Utilizados</h3>
            <p>Ingresa las cantidades para cada material utilizado seleccionado.</p>
            
            <div class="quantities-grid">
              {#each codigosMaterialesUtilizados as material}
                <div class="quantity-item">
                  <div class="quantity-header">
                    <div class="quantity-info">
                      <h4>{material.codigo} - {material.descripcion}</h4>
                      <p>Unidad: {material.unidad_medida}</p>
                    </div>
                    <button 
                      class="remove-btn" 
                      on:click={() => removeMaterialUtilizadoItem(material)}
                      title="Eliminar este material"
                    >
                      🗑️
                    </button>
                  </div>
                  <div class="quantity-input">
                    <label for="cantidad-material-utilizado-{material.id}">Cantidad:</label>
                    <input 
                      type="number" 
                      id="cantidad-material-utilizado-{material.id}"
                      min="0" 
                      step="0.1"
                      value={cantidadesMaterialesUtilizados[material.id] || 0}
                      on:input={(e) => updateCantidadMaterialUtilizado(material.id, parseFloat((e.target as HTMLInputElement)?.value) || 0)}
                    />
                    <span class="unit">{material.unidad_medida}</span>
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
                Siguiente →
              </button>
            </div>
          </div>
          
        {:else if currentStep === 6}
          <!-- Paso 6: Seleccionar Materiales Recuperados -->
          <div class="step-panel">
            <h3>♻️ Seleccionar Materiales Recuperados</h3>
            <p>Selecciona los materiales que pudieron ser recuperados para reutilización (opcional).</p>
            
            <!-- Buscador -->
            <div class="search-container">
              <input 
                type="text" 
                placeholder="Buscar por código o descripción..." 
                bind:value={searchTermMateriales}
                class="search-input"
              />
              <span class="search-icon">🔍</span>
            </div>
            
            <!-- Solapas General/Favoritos -->
            <div class="tabs-container">
              <button 
                class="tab-btn" 
                class:active={activeTabMateriales === 'general'}
                on:click={() => activeTabMateriales = 'general'}
              >
                Lista completa ({materiales.length})
              </button>
              <button 
                class="tab-btn" 
                class:active={activeTabMateriales === 'favoritos'}
                on:click={() => activeTabMateriales = 'favoritos'}
              >
                Favoritos ({favoritosMaterialesRecuperados.length})
              </button>
            </div>
            
            <!-- Lista de materiales optimizada -->
            <div class="codes-list">
              {#each materialesRecuperadosFiltrados as item}
                <div class="code-item" class:selected={isMaterialRecuperadoSeleccionado(item)}>
                  <div class="code-info">
                    <button 
                      class="favorite-btn-left" 
                      class:favorited={isFavoritoMaterialRecuperado(item)}
                      on:click|stopPropagation={() => toggleFavoritoMaterialRecuperado(item)}
                      title={isFavoritoMaterialRecuperado(item) ? 'Quitar de favoritos' : 'Agregar a favoritos'}
                    >
                      {isFavoritoMaterialRecuperado(item) ? '⭐' : '☆'}
                    </button>
                    <div class="code-main">
                      <span class="code">{item.codigo}</span>
                      <span class="description">{item.descripcion}</span>
                    </div>
                    <div class="code-details">
                      <span class="unit">{item.unidad_medida}</span>
                    </div>
                  </div>
                  <div class="code-actions">
                    <button 
                      class="select-btn" 
                      class:selected={isMaterialRecuperadoSeleccionado(item)}
                      on:click={() => toggleCodigoMaterialRecuperado(item)}
                    >
                      {isMaterialRecuperadoSeleccionado(item) ? '✓' : '+'}
                    </button>
                  </div>
                </div>
              {/each}
              
              {#if materialesRecuperadosFiltrados.length === 0}
                <div class="no-results">
                  {#if searchTermMateriales.trim()}
                    No se encontraron resultados para "{searchTermMateriales}"
                  {:else if activeTabMateriales === 'favoritos'}
                    No tienes materiales marcados como favoritos
                  {:else}
                    No hay materiales disponibles
                  {/if}
                </div>
              {/if}
            </div>
            
            <!-- Contador de seleccionados -->
            {#if codigosMaterialesRecuperados.length > 0}
              <div class="selected-counter">
                {codigosMaterialesRecuperados.length} material(es) seleccionado(s)
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
          <!-- Paso 7: Cantidades Materiales Recuperados -->
          <div class="step-panel">
            <h3>📊 Cantidades Materiales Recuperados</h3>
            <p>Ingresa las cantidades para cada material recuperado seleccionado.</p>
            
            <div class="quantities-grid">
              {#each codigosMaterialesRecuperados as material}
                <div class="quantity-item">
                  <div class="quantity-header">
                    <div class="quantity-info">
                      <h4>{material.codigo} - {material.descripcion}</h4>
                      <p>Unidad: {material.unidad_medida}</p>
                    </div>
                    <button 
                      class="remove-btn" 
                      on:click={() => removeMaterialRecuperadoItem(material)}
                      title="Eliminar este material"
                    >
                      🗑️
                    </button>
                  </div>
                  <div class="quantity-input">
                    <label for="cantidad-material-recuperado-{material.id}">Cantidad:</label>
                    <input 
                      type="number" 
                      id="cantidad-material-recuperado-{material.id}"
                      min="0" 
                      step="0.1"
                      value={cantidadesMaterialesRecuperados[material.id] || 0}
                      on:input={(e) => updateCantidadMaterialRecuperado(material.id, parseFloat((e.target as HTMLInputElement)?.value) || 0)}
                    />
                    <span class="unit">{material.unidad_medida}</span>
                  </div>
                </div>
              {/each}
            </div>
            
            {#if codigosMaterialesRecuperados.length === 0}
              <div class="no-results">
                No hay materiales recuperados seleccionados. Puedes continuar al siguiente paso.
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
          
        {:else if currentStep === 8}
          <!-- Paso 8: Documentación -->
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
          
        {:else if currentStep === 9}
          <!-- Paso 9: Resumen -->
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
                {#each codigosManoDeObraSeleccionados as codigo}
                  {@const cantidad = cantidadesManoDeObra[codigo.id] || 0}
                  {#if cantidad > 0}
                    <p>• {codigo.descripcion} ({cantidad} {codigo.unidad_medida})</p>
                  {/if}
                {/each}
                {#if codigosManoDeObraSeleccionados.length === 0}
                  <p>No se registró mano de obra</p>
                {/if}
              </div>
              
              <div class="summary-section">
                <h4>🔧 Materiales Utilizados</h4>
                {#each codigosMaterialesUtilizados as material}
                  {@const cantidad = cantidadesMaterialesUtilizados[material.id] || 0}
                  {#if cantidad > 0}
                    <p>• {material.descripcion} ({cantidad} {material.unidad_medida})</p>
                  {/if}
                {/each}
                {#if codigosMaterialesUtilizados.length === 0}
                  <p>No se registraron materiales utilizados</p>
                {/if}
              </div>
              
              <div class="summary-section">
                <h4>♻️ Materiales Recuperados</h4>
                {#each codigosMaterialesRecuperados as material}
                  {@const cantidad = cantidadesMaterialesRecuperados[material.id] || 0}
                  {#if cantidad > 0}
                    <p>• {material.descripcion} ({cantidad} {material.unidad_medida})</p>
                  {/if}
                {/each}
                {#if codigosMaterialesRecuperados.length === 0}
                  <p>No se registraron materiales recuperados</p>
                {/if}
              </div>
              
              <div class="summary-section">
                <h4>📎 Archivos</h4>
                <p>{archivosPreview.length} archivo(s) adjunto(s)</p>
              </div>
              
              <!-- Total a Cobrar -->
              <div class="summary-section total-section">
                <h4>💰 Total a Cobrar</h4>
                <div class="total-breakdown">
                  <div class="total-item">
                    <span>Subtotal:</span>
                    <span>${subtotalManoDeObra.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div class="total-item">
                    <span>IVA (21%):</span>
                    <span>${ivaManoDeObra.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div class="total-item total-final">
                    <span><strong>Total:</strong></span>
                    <span><strong>${totalManoDeObra.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</strong></span>
                  </div>
                </div>
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
                {isSubmitting ? 'Enviando...' : (isEditMode ? '✏️ Editar Certificado' : '🚀 Emitir Certificado')}
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
    margin: 0;
    padding: 0;
    background: white;
    border-radius: 0;
    box-shadow: none;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    min-height: 100vh;
    height: 100vh;
  }
  
  .form-header {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 1.5rem 2rem;
    width: 100%;
    margin: 0;
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
  
  /* Buscador */
  .search-container {
    position: relative;
    margin-bottom: 1.5rem;
  }
  
  .search-input {
    width: 100%;
    padding: 0.75rem 2.5rem 0.75rem 1rem;
    border: 2px solid #dee2e6;
    border-radius: 8px;
    font-size: 1rem;
    transition: border-color 0.3s ease;
  }
  
  .search-input:focus {
    outline: none;
    border-color: #007bff;
    box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
  }
  
  .search-icon {
    position: absolute;
    right: 1rem;
    top: 50%;
    transform: translateY(-50%);
    color: #6c757d;
    font-size: 1.2rem;
  }
  
  /* Solapas */
  .tabs-container {
    display: flex;
    margin-bottom: 1.5rem;
    border-bottom: 2px solid #dee2e6;
  }
  
  .tab-btn {
    background: none;
    border: none;
    padding: 0.75rem 1.5rem;
    font-size: 1rem;
    color: #6c757d;
    cursor: pointer;
    border-bottom: 3px solid transparent;
    transition: all 0.3s ease;
  }
  
  .tab-btn:hover {
    color: #007bff;
    background: rgba(0, 123, 255, 0.05);
  }
  
  .tab-btn.active {
    color: #007bff;
    border-bottom-color: #007bff;
    font-weight: 600;
  }
  
  /* Lista de códigos optimizada */
  .codes-list {
    max-height: 400px;
    overflow-y: auto;
    border: 1px solid #dee2e6;
    border-radius: 8px;
    background: white;
  }
  
  .code-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem 1rem;
    border-bottom: 1px solid #f1f3f4;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  .code-item:last-child {
    border-bottom: none;
  }
  
  .code-item:hover {
    background: #f8f9fa;
  }
  
  .code-item.selected {
    background: #e8f5e8;
    border-left: 4px solid #28a745;
  }
  
  .code-info {
    flex: 1;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 0.5rem;
  }
  
  .code-main {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }
  
  .code {
    font-weight: 600;
    color: #007bff;
    min-width: 60px;
  }
  
  .description {
    color: #333;
    font-size: 0.95rem;
  }
  
  .code-details {
    display: flex;
    align-items: center;
    gap: 1rem;
    font-size: 0.85rem;
    color: #6c757d;
    margin-right: 0.5rem;
  }
  
  .unit {
    background: #e9ecef;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    font-weight: 500;
  }
  
  .price {
    font-weight: 600;
    color: #28a745;
  }
  
  .code-actions {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-left: 1rem;
  }
  
  .favorite-btn {
    background: none;
    border: none;
    font-size: 1.2rem;
    cursor: pointer;
    padding: 0.25rem;
    border-radius: 4px;
    transition: all 0.2s ease;
  }
  
  .favorite-btn:hover {
    background: rgba(255, 193, 7, 0.1);
  }
  
  .favorite-btn.favorited {
    color: #ffc107;
  }
  
  .favorite-btn-left {
    background: none;
    border: none;
    font-size: 1.2rem;
    cursor: pointer;
    padding: 0.25rem;
    border-radius: 4px;
    transition: all 0.2s ease;
    margin-right: 0.5rem;
    flex-shrink: 0;
  }
  
  .favorite-btn-left:hover {
    background: rgba(255, 193, 7, 0.1);
  }
  
  .favorite-btn-left.favorited {
    color: #ffc107;
  }
  
  .select-btn {
    background: #007bff;
    color: white;
    border: none;
    border-radius: 50%;
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    font-size: 1rem;
    transition: all 0.2s ease;
  }
  
  .select-btn:hover {
    background: #0056b3;
    transform: scale(1.1);
  }
  
  .select-btn.selected {
    background: #28a745;
  }
  
  .no-results {
    text-align: center;
    padding: 2rem;
    color: #6c757d;
    font-style: italic;
  }
  
  .selected-counter {
    background: #e8f5e8;
    color: #28a745;
    padding: 0.5rem 1rem;
    border-radius: 6px;
    margin: 1rem 0;
    font-weight: 500;
    text-align: center;
  }
  
  /* Resumen de cálculos */
  .calculation-summary {
    background: #f8f9fa;
    border: 1px solid #dee2e6;
    border-radius: 8px;
    padding: 1.5rem;
    margin: 2rem 0;
  }
  
  .calculation-summary h4 {
    margin: 0 0 1rem 0;
    color: #333;
    font-size: 1.1rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  
  .calculation-grid {
    margin-bottom: 1.5rem;
  }
  
  .calculation-item {
    display: grid;
    grid-template-columns: 80px 1fr 100px 80px 100px;
    gap: 1rem;
    padding: 0.75rem;
    border-bottom: 1px solid #e9ecef;
    align-items: center;
    font-size: 0.9rem;
  }
  
  .calculation-item:last-child {
    border-bottom: none;
  }
  
  .calculation-item.auto-calculated {
    background-color: #e3f2fd;
    border-left: 4px solid #1976d2;
    font-weight: 600;
  }
  
  .item-code {
    font-weight: 600;
    color: #007bff;
  }
  
  .item-desc {
    color: #333;
  }
  
  .item-quantity {
    color: #6c757d;
    text-align: center;
  }
  
  .item-price {
    color: #28a745;
    font-weight: 500;
    text-align: right;
  }
  
  .item-subtotal {
    color: #333;
    font-weight: 600;
    text-align: right;
  }
  
  .calculation-totals {
    border-top: 2px solid #dee2e6;
    padding-top: 1rem;
  }
  
  .total-line {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.5rem 0;
    font-size: 1rem;
  }
  
  .total-label {
    font-weight: 500;
    color: #333;
  }
  
  .total-value {
    font-weight: 600;
    color: #333;
  }
  
  .total-final {
    border-top: 1px solid #dee2e6;
    margin-top: 0.5rem;
    padding-top: 0.75rem;
    font-size: 1.2rem;
  }
  
  .total-final .total-label {
    font-weight: 700;
    color: #007bff;
  }
  
  .total-final .total-value {
    font-weight: 700;
    color: #007bff;
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
  
  /* Estilos para la sección de total */
  .total-section {
    background: linear-gradient(135deg, #e8f5e8, #f0f8f0) !important;
    border: 2px solid #28a745 !important;
  }
  
  .total-section h4 {
    color: #155724 !important;
    font-size: 1.3rem !important;
  }
  
  .total-breakdown {
    margin-top: 1rem;
  }
  
  .total-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.5rem 0;
    border-bottom: 1px solid #dee2e6;
  }
  
  .total-item:last-child {
    border-bottom: none;
  }
  
  .total-final {
    font-size: 1.1rem;
    padding-top: 1rem;
    margin-top: 0.5rem;
    border-top: 2px solid #28a745;
    color: #155724;
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
    flex-direction: column;
    gap: 1rem;
    padding: 1rem;
    border: 1px solid #dee2e6;
    border-radius: 8px;
    background: white;
  }

  .quantity-item-compact {
    display: grid;
    grid-template-columns: 80px 1fr 200px 100px 50px;
    gap: 1rem;
    align-items: center;
    padding: 0.75rem 1rem;
    border: 1px solid #dee2e6;
    border-radius: 8px;
    background: white;
  }

  .quantity-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
  }

  .quantity-code {
    display: flex;
    align-items: center;
  }

  .quantity-code .code {
    font-weight: 600;
    color: #1976d2;
    font-size: 0.9rem;
  }

  .quantity-description {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .quantity-description .description {
    font-size: 0.9rem;
    color: #495057;
    line-height: 1.3;
  }

  .quantity-input-compact {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .quantity-input-compact label {
    font-weight: 500;
    color: #495057;
    font-size: 0.85rem;
    white-space: nowrap;
  }

  .quantity-input-compact input {
    width: 60px;
    padding: 0.25rem 0.5rem;
    border: 1px solid #ced4da;
    border-radius: 4px;
    font-size: 0.85rem;
  }

  .quantity-input-compact .unit {
    font-size: 0.8rem;
    color: #6c757d;
    background: #f8f9fa;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    border: 1px solid #dee2e6;
  }

  .quantity-price {
    display: flex;
    align-items: center;
    justify-content: flex-end;
  }

  .quantity-price .price {
    font-weight: 600;
    color: #28a745;
    font-size: 0.9rem;
  }

  .remove-btn {
    background: #dc3545;
    color: white;
    border: none;
    border-radius: 6px;
    padding: 0.25rem;
    cursor: pointer;
    font-size: 0.8rem;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 2rem;
    height: 2rem;
  }

  .remove-btn:hover {
    background: #c82333;
    transform: scale(1.05);
  }

  .remove-btn:active {
    transform: scale(0.95);
  }

  .validation-error {
    background: #f8d7da;
    border: 1px solid #f5c6cb;
    border-radius: 8px;
    padding: 1rem;
    margin: 1rem 0;
  }

  .error-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
  }

  .error-icon {
    font-size: 1.2rem;
  }

  .error-title {
    font-weight: 600;
    color: #721c24;
    font-size: 1rem;
  }

  .error-message {
    color: #721c24;
    font-size: 0.9rem;
    line-height: 1.4;
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
