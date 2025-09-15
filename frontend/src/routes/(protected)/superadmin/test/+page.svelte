<script lang="ts">
  import { goto } from '$app/navigation';
</script>

<svelte:head>
  <title>Test - Superadministrador</title>
</svelte:head>

<div class="test-container">
  <h1>🧪 Página de Prueba</h1>
  <p>Si puedes ver esta página, el enrutamiento funciona correctamente.</p>
  <button on:click={() => goto('/superadmin/dashboard')}>
    ← Volver al Dashboard
  </button>
</div>

<style>
  .test-container {
    max-width: 800px;
    margin: 0 auto;
    padding: 40px 20px;
    text-align: center;
  }
  
  h1 {
    color: #2c3e50;
    margin-bottom: 20px;
  }
  
  button {
    background: #007bff;
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 4px;
    cursor: pointer;
    margin-top: 20px;
  }
  
  button:hover {
    background: #0056b3;
  }
</style>
