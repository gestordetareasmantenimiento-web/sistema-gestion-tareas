<script lang="ts">
  import { goto } from '$app/navigation';
  import { login } from '$lib/stores/auth'; // Importamos nuestra nueva función de login

  let email = '';
  let password = '';
  let error = '';

  async function handleLogin() {
    error = '';
    try {
      const response = await fetch('http://localhost:3000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error);

      // --- ¡LÓGICA DE REDIRECCIÓN ACTUALIZADA! ---

      // 1. Usamos nuestra función centralizada de login
      login(result.token);

      // 2. Decodificamos el rol para decidir a dónde ir
      const payload = JSON.parse(atob(result.token.split('.')[1]));

      // src/routes/+page.svelte (en la función handleLogin)
      const userRol = payload.rol.toLowerCase();
      if (userRol === 'supervisor') {
        goto('/supervisor/dashboard');
      } else if (userRol === 'administrativo') {
        goto('/admin/dashboard');
      } else if (userRol === 'gerente') {
        goto('/gerente/dashboard');
      } else if (userRol === 'cerco') {
        goto('/cerco/dashboard');
      } else {
        goto('/dashboard');
      }

    } catch (err) {
      if (err instanceof Error) error = err.message;
      else error = "Ocurrió un error inesperado.";
    }
  }
</script>

<main>
  <h1>Iniciar Sesión</h1>
  <form on:submit|preventDefault={handleLogin}>
    <div class="form-group">
      <label for="email">Correo Electrónico</label>
      <input type="email" id="email" bind:value={email} required />
    </div>

    <div class="form-group">
      <label for="password">Contraseña</label>
      <input type="password" id="password" bind:value={password} required />
    </div>

    {#if error}
      <p class="error">{error}</p>
    {/if}

    <button type="submit">Ingresar</button>
  </form>
</main>

<style>
  /* ... tus estilos existentes ... */
  main { max-width: 400px; margin: 50px auto; padding: 2rem; border: 1px solid #ccc; border-radius: 8px; font-family: sans-serif; }
  .form-group { margin-bottom: 1rem; }
  label { display: block; margin-bottom: 0.5rem; }
  input { width: 100%; padding: 0.5rem; font-size: 1rem; box-sizing: border-box; }
  button { width: 100%; padding: 0.75rem; font-size: 1rem; background-color: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; }
  button:hover { background-color: #0056b3; }
  .error {
    color: red;
    margin-bottom: 1rem;
    text-align: center;
  }
</style>