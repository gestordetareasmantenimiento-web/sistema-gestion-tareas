<script lang="ts">
  import { goto } from '$app/navigation';
</script>

<svelte:head>
  <title>Simple Test - Superadmin</title>
</svelte:head>

<div class="simple-container">
  <h1>✅ Página Simple Funcionando</h1>
  <p>Si puedes ver esta página, el enrutamiento básico funciona.</p>
  <button on:click={() => goto('/superadmin/dashboard')}>
    ← Volver al Dashboard
  </button>
</div>

<style>
  .simple-container {
    max-width: 800px;
    margin: 0 auto;
    padding: 40px 20px;
    text-align: center;
  }
  
  h1 {
    color: #28a745;
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
