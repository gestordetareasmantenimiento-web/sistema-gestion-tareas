<script lang="ts">
  import { user } from '$lib/stores/auth';
  import { onMount } from 'svelte';

  let costoMinimo = 0;
  let cuadrillaModelo = 0;
  let loading = false;
  let message = '';
  let messageType = '';

  onMount(async () => {
    await cargarConfiguracion();
  });

  async function cargarConfiguracion() {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return;

      // Cargar costo mínimo diario
      const costoResponse = await fetch('http://localhost:3000/api/costo-minimo/valor', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (costoResponse.ok) {
        const costoData = await costoResponse.json();
        costoMinimo = costoData.data?.valor || 0;
      }

      // Cargar cuadrilla modelo
      const cuadrillaResponse = await fetch('http://localhost:3000/api/cuadrilla-modelo/porcentaje', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (cuadrillaResponse.ok) {
        const cuadrillaData = await cuadrillaResponse.json();
        cuadrillaModelo = cuadrillaData.data?.porcentaje || 0;
      }
    } catch (error) {
      console.error('Error cargando configuración:', error);
      mostrarMensaje('Error al cargar la configuración', 'error');
    }
  }

  async function actualizarCostoMinimo() {
    if (costoMinimo <= 0) {
      mostrarMensaje('El costo mínimo debe ser mayor a 0', 'error');
      return;
    }

    loading = true;
    try {
      const token = localStorage.getItem('authToken');
      console.log('Token:', token ? 'Presente' : 'Ausente');
      console.log('Valor a enviar:', costoMinimo);
      
      const response = await fetch('http://localhost:3000/api/costo-minimo/valor', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ valor: costoMinimo })
      });

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      if (response.ok) {
        const result = await response.json();
        console.log('Resultado:', result);
        mostrarMensaje('Costo mínimo actualizado correctamente', 'success');
      } else {
        const error = await response.json();
        console.error('Error response:', error);
        mostrarMensaje(error.error || 'Error al actualizar costo mínimo', 'error');
      }
    } catch (error) {
      console.error('Error en actualizarCostoMinimo:', error);
      mostrarMensaje('Error al actualizar costo mínimo: ' + (error as Error).message, 'error');
    } finally {
      loading = false;
    }
  }

  async function actualizarCuadrillaModelo() {
    if (cuadrillaModelo < 0 || cuadrillaModelo > 100) {
      mostrarMensaje('El porcentaje debe estar entre 0 y 100', 'error');
      return;
    }

    loading = true;
    try {
      const token = localStorage.getItem('authToken');
      console.log('Token:', token ? 'Presente' : 'Ausente');
      console.log('Porcentaje a enviar:', cuadrillaModelo);
      
      const response = await fetch('http://localhost:3000/api/cuadrilla-modelo/porcentaje', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ porcentaje: cuadrillaModelo })
      });

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      if (response.ok) {
        const result = await response.json();
        console.log('Resultado:', result);
        mostrarMensaje('Cuadrilla modelo actualizada correctamente', 'success');
      } else {
        const error = await response.json();
        console.error('Error response:', error);
        mostrarMensaje(error.error || 'Error al actualizar cuadrilla modelo', 'error');
      }
    } catch (error) {
      console.error('Error en actualizarCuadrillaModelo:', error);
      mostrarMensaje('Error al actualizar cuadrilla modelo: ' + (error as Error).message, 'error');
    } finally {
      loading = false;
    }
  }

  function mostrarMensaje(texto: string, tipo: string) {
    message = texto;
    messageType = tipo;
    setTimeout(() => {
      message = '';
      messageType = '';
    }, 5000);
  }

  function navegarACMO() {
    window.location.href = '/superadmin/cmo';
  }

  function navegarAMaterials() {
    window.location.href = '/superadmin/materials';
  }
</script>

<svelte:head>
  <title>Configuración del Sistema - Superadmin</title>
</svelte:head>

<div class="settings-container">
  <div class="header">
    <h1>⚙️ Configuración del Sistema</h1>
    <p>Gestiona los parámetros globales del sistema</p>
  </div>

  {#if message}
    <div class="message {messageType}">
      {message}
    </div>
  {/if}

  <div class="settings-grid">
    <!-- Configuración de Costos -->
    <div class="settings-card">
      <div class="card-header">
        <h2>💰 Costo Mínimo Diario</h2>
        <p>Establece el costo mínimo diario para cálculos automáticos</p>
      </div>
      <div class="card-content">
        <div class="input-group">
          <label for="costoMinimo">Costo Mínimo (pesos):</label>
          <input 
            type="number" 
            id="costoMinimo"
            bind:value={costoMinimo} 
            placeholder="735000"
            min="0"
            step="1000"
          />
        </div>
        <button 
          class="save-btn" 
          on:click={actualizarCostoMinimo}
          disabled={loading}
        >
          {loading ? 'Guardando...' : 'Guardar Cambios'}
        </button>
      </div>
    </div>

    <!-- Configuración de Cuadrilla -->
    <div class="settings-card">
      <div class="card-header">
        <h2>👷 Cuadrilla Modelo</h2>
        <p>Establece el porcentaje de cuadrilla modelo para cálculos</p>
      </div>
      <div class="card-content">
        <div class="input-group">
          <label for="cuadrillaModelo">Porcentaje (%):</label>
          <input 
            type="number" 
            id="cuadrillaModelo"
            bind:value={cuadrillaModelo} 
            placeholder="40"
            min="0"
            max="100"
            step="1"
          />
        </div>
        <button 
          class="save-btn" 
          on:click={actualizarCuadrillaModelo}
          disabled={loading}
        >
          {loading ? 'Guardando...' : 'Guardar Cambios'}
        </button>
      </div>
    </div>

    <!-- Accesos Rápidos -->
    <div class="settings-card">
      <div class="card-header">
        <h2>🔧 Herramientas de Configuración</h2>
        <p>Accede a las herramientas avanzadas de configuración</p>
      </div>
      <div class="card-content">
        <div class="quick-tools">
          <button class="tool-btn" on:click={navegarACMO}>
            <div class="tool-icon">👷</div>
            <span>Editar CMO</span>
            <p>Gestionar mano de obra</p>
          </button>
          <button class="tool-btn" on:click={navegarAMaterials}>
            <div class="tool-icon">🔧</div>
            <span>Editar Materiales</span>
            <p>Gestionar materiales</p>
          </button>
        </div>
      </div>
    </div>
  </div>

  <div class="back-section">
    <button class="back-btn" on:click={() => window.location.href = '/superadmin/dashboard'}>
      ← Volver al Dashboard
    </button>
  </div>
</div>

<style>
  .settings-container {
    max-width: 1200px;
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

  .message {
    padding: 1rem;
    border-radius: 8px;
    margin-bottom: 1rem;
    font-weight: 500;
  }

  .message.success {
    background-color: #d4edda;
    color: #155724;
    border: 1px solid #c3e6cb;
  }

  .message.error {
    background-color: #f8d7da;
    color: #721c24;
    border: 1px solid #f5c6cb;
  }

  .settings-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
    gap: 2rem;
    margin-bottom: 2rem;
  }

  .settings-card {
    background: white;
    border-radius: 12px;
    padding: 2rem;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    border: 1px solid #e9ecef;
  }

  .card-header h2 {
    margin: 0 0 0.5rem 0;
    color: #333;
    font-size: 1.5rem;
    font-weight: 600;
  }

  .card-header p {
    margin: 0 0 1.5rem 0;
    color: #666;
    font-size: 0.95rem;
  }

  .input-group {
    margin-bottom: 1.5rem;
  }

  .input-group label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 500;
    color: #333;
  }

  .input-group input {
    width: 100%;
    padding: 0.75rem;
    border: 2px solid #e9ecef;
    border-radius: 8px;
    font-size: 1rem;
    transition: border-color 0.3s ease;
  }

  .input-group input:focus {
    outline: none;
    border-color: #667eea;
  }

  .save-btn {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    padding: 0.75rem 1.5rem;
    border-radius: 8px;
    font-size: 1rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s ease;
  }

  .save-btn:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
  }

  .save-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .quick-tools {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
  }

  .tool-btn {
    background: white;
    border: 2px solid #e9ecef;
    border-radius: 12px;
    padding: 1.5rem;
    cursor: pointer;
    transition: all 0.3s ease;
    text-align: center;
  }

  .tool-btn:hover {
    border-color: #667eea;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  .tool-icon {
    font-size: 2rem;
    margin-bottom: 0.5rem;
  }

  .tool-btn span {
    display: block;
    font-weight: 600;
    color: #333;
    margin-bottom: 0.25rem;
  }

  .tool-btn p {
    margin: 0;
    font-size: 0.85rem;
    color: #666;
  }

  .back-section {
    text-align: center;
    margin-top: 2rem;
  }

  .back-btn {
    background: #6c757d;
    color: white;
    border: none;
    padding: 0.75rem 1.5rem;
    border-radius: 8px;
    font-size: 1rem;
    cursor: pointer;
    transition: all 0.3s ease;
  }

  .back-btn:hover {
    background: #5a6268;
    transform: translateY(-2px);
  }

  @media (max-width: 768px) {
    .settings-grid {
      grid-template-columns: 1fr;
    }
    
    .quick-tools {
      grid-template-columns: 1fr;
    }
  }
</style>
