<script lang="ts">
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import { syncAuth, logout as logoutUser, user } from '$lib/stores/auth';

  onMount(() => {
    syncAuth();
  });

  function handleLogout() {
    logoutUser();
    goto('/');
  }
</script>

<header>
  <nav>
    <div>
      <span>Mi Aplicación de Tareas</span>
      {#if $user}
        {#if $user.rol.toLowerCase() === 'supervisor'}
          <a href="/supervisor/dashboard">Dashboard Supervisor</a>
        {:else if $user.rol.toLowerCase() === 'administrativo'}
          <a href="/admin/dashboard">Dashboard Admin</a>
        {:else if $user.rol.toLowerCase() === 'gerente'}
          <a href="/gerente/dashboard">Dashboard Gerente</a>
        {:else if $user.rol.toLowerCase() === 'cerco'}
          <a href="/cerco/dashboard">Dashboard CERCO</a>
        {:else}
          <a href="/dashboard">Dashboard</a>
        {/if}
      {/if}
    </div>
    <button on:click={handleLogout}>Cerrar Sesión</button>
  </nav>
</header>

<main>
  <slot />
</main>

<style>
  nav { display: flex; justify-content: space-between; align-items: center; padding: 1rem; background-color: #f0f0f0; border-bottom: 1px solid #ccc; }
  nav a { margin-left: 1rem; text-decoration: none; color: #007bff; }
  main { padding: 1rem; }
</style>