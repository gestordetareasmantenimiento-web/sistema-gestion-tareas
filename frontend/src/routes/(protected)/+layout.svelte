<script lang="ts">
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import { syncAuth, logout as logoutUser, user } from '$lib/stores/auth';
  import GlobalModal from '$lib/components/GlobalModal.svelte';

  // Array con todos los roles que actúan como supervisores
  const supervisorRoles = [
    'supervisor de mantenimiento',
    'supervisor de disponibilidad',
    'supervisor de soporte',
    'supervisor de provision'
  ];

  onMount(() => {
    syncAuth();
  });

  function handleLogout() {
    logoutUser();
    goto('/');
  }
</script>

<header class="main-header">
  <nav>
    <div class="nav-left">
      <span class="app-title">Sistema de Gestión</span>
      {#if $user}
        {#if $user.rol.toLowerCase() === 'superadministrador'}
          <a href="/superadmin/dashboard">Panel Superadmin</a>
        {:else if supervisorRoles.includes($user.rol.toLowerCase())}
          <a href="/dashboard">Dashboard Supervisor</a>
        {:else if $user.rol.toLowerCase() === 'administrativo'}
          <a href="/admin/dashboard">Dashboard Admin</a>
        {:else if $user.rol.toLowerCase() === 'gerente'}
          <a href="/gerente/dashboard">Dashboard Gerente</a>
        {:else if $user.rol.toLowerCase() === 'cerco'}
          <a href="/cerco/dashboard">Dashboard CERCO</a>
        {:else if $user.rol.toLowerCase() === 'proveedor'}
          <a href="/proveedor/dashboard">Dashboard Proveedor</a>
        {:else}
          <a href="/dashboard">Dashboard</a>
        {/if}
      {/if}
    </div>
    {#if $user}
      <div class="nav-right">
        <span class="user-email">{$user.email}</span>
        <button on:click={handleLogout} class="logout-button">Cerrar Sesión</button>
      </div>
    {/if}
  </nav>
</header>

<main>
  <slot />
</main>

<GlobalModal />

<style>
  :global(body) {
    margin: 0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen,
      Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
    background-color: #f8f9fa;
  }
  .main-header {
    background-color: #343a40;
    color: white;
  }
  nav { 
    display: flex; 
    justify-content: space-between; 
    align-items: center; 
    padding: 0 2rem;
    max-width: 1200px;
    margin: 0 auto;
    height: 60px;
  }
  .nav-left, .nav-right {
    display: flex;
    align-items: center;
    gap: 1.5rem;
  }
  .app-title {
    font-weight: bold;
    font-size: 1.2rem;
  }
  nav a { 
    text-decoration: none; 
    color: #adb5bd;
    transition: color 0.2s;
  }
  nav a:hover {
    color: white;
  }
  .user-email {
    font-size: 0.9rem;
    color: #ced4da;
  }
  .logout-button {
    background-color: #007bff;
    color: white;
    border: none;
    border-radius: 5px;
    padding: 0.5rem 1rem;
    cursor: pointer;
  }
  .logout-button:hover {
    background-color: #0056b3;
  }
  main { 
    padding: 1rem 2rem;
    max-width: 1200px;
    margin: 0 auto;
  }
</style>