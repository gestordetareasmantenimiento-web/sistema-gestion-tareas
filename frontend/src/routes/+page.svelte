<script lang="ts">
  import { goto } from '$app/navigation';
  import { login } from '$lib/stores/auth';
  import { onMount } from 'svelte';

  let email = '';
  let password = '';
  let error = '';
  let isLoading = false;
  let showPassword = false;

  // Animación de entrada
  onMount(() => {
    const form = document.querySelector('.login-form');
    if (form) {
      form.classList.add('animate-in');
    }
  });

  async function handleLogin() {
    error = '';
    isLoading = true;
    
    try {
      const response = await fetch('http://localhost:3000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error);

      // Usamos nuestra función centralizada de login
      login(result.token);

      // Decodificamos el rol para decidir a dónde ir
      const payload = JSON.parse(atob(result.token.split('.')[1]));

      // Lógica de redirección
      const userRol = payload.rol.toLowerCase();
      const supervisorRoles = [
        'supervisor de mantenimiento',
        'supervisor de disponibilidad', 
        'supervisor de soporte',
        'supervisor de provision'
      ];
      
      if (userRol === 'superadministrador') {
        goto('/superadmin/dashboard');
      } else if (supervisorRoles.includes(userRol)) {
        goto('/supervisor/dashboard');
      } else if (userRol === 'administrativo') {
        goto('/admin/dashboard');
      } else if (userRol === 'gerente') {
        goto('/gerente/dashboard');
      } else if (userRol === 'cerco') {
        goto('/cerco/dashboard');
      } else if (userRol === 'proveedor') {
        goto('/proveedor/dashboard');
      } else {
        goto('/dashboard');
      }

    } catch (err) {
      if (err instanceof Error) error = err.message;
      else error = "Ocurrió un error inesperado.";
    } finally {
      isLoading = false;
    }
  }

  function togglePasswordVisibility() {
    showPassword = !showPassword;
  }
</script>

<div class="login-container">
  <!-- Fondo decorativo -->
  <div class="background-decoration">
    <div class="decoration-circle circle-1"></div>
    <div class="decoration-circle circle-2"></div>
    <div class="decoration-circle circle-3"></div>
  </div>

  <!-- Contenido principal -->
  <div class="login-content">
    <!-- Panel izquierdo con información -->
    <div class="login-info">
      <div class="info-content">
        <div class="logo-section">
          <div class="logo-icon">🏢</div>
          <h1>Sistema de Gestión</h1>
          <p class="subtitle">Plataforma integral para la gestión de tareas de mantenimiento</p>
        </div>
        
        <div class="features">
          <div class="feature-item">
            <div class="feature-icon">📋</div>
            <div class="feature-text">
              <h3>Gestión de Tareas</h3>
              <p>Control completo del flujo de trabajo</p>
            </div>
          </div>
          
          <div class="feature-item">
            <div class="feature-icon">👥</div>
            <div class="feature-text">
              <h3>Colaboración</h3>
              <p>Trabajo en equipo eficiente</p>
            </div>
          </div>
          
          <div class="feature-item">
            <div class="feature-icon">📊</div>
            <div class="feature-text">
              <h3>Reportes</h3>
              <p>Análisis y seguimiento detallado</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Panel derecho con formulario -->
    <div class="login-form-container">
      <div class="login-form">
        <div class="form-header">
          <h2>Bienvenido</h2>
          <p>Inicia sesión para acceder a tu cuenta</p>
        </div>

        <form on:submit|preventDefault={handleLogin}>
          <div class="form-group">
            <label for="email">
              <span class="label-icon">📧</span>
              Correo Electrónico
            </label>
            <input 
              type="email" 
              id="email" 
              bind:value={email} 
              placeholder="tu@empresa.com"
              required 
              disabled={isLoading}
            />
          </div>

          <div class="form-group">
            <label for="password">
              <span class="label-icon">🔒</span>
              Contraseña
            </label>
            <div class="password-input-container">
              <input 
                type={showPassword ? 'text' : 'password'} 
                id="password" 
                bind:value={password} 
                placeholder="••••••••"
                required 
                disabled={isLoading}
              />
              <button 
                type="button" 
                class="password-toggle"
                on:click={togglePasswordVisibility}
                disabled={isLoading}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          {#if error}
            <div class="error-message">
              <span class="error-icon">⚠️</span>
              {error}
            </div>
          {/if}

          <button type="submit" class="login-button" disabled={isLoading}>
            {#if isLoading}
              <span class="loading-spinner"></span>
              Iniciando sesión...
            {:else}
              <span class="button-icon">🚀</span>
              Iniciar Sesión
            {/if}
          </button>
        </form>

        <div class="form-footer">
          <p>¿Necesitas ayuda? Contacta al administrador del sistema</p>
        </div>
      </div>
    </div>
  </div>
</div>

<style>
  /* Reset y configuración base */
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  .login-container {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    position: relative;
    overflow: hidden;
  }

  /* Decoraciones de fondo */
  .background-decoration {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 1;
  }

  .decoration-circle {
    position: absolute;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.1);
    animation: float 6s ease-in-out infinite;
  }

  .circle-1 {
    width: 200px;
    height: 200px;
    top: 10%;
    left: 10%;
    animation-delay: 0s;
  }

  .circle-2 {
    width: 150px;
    height: 150px;
    top: 60%;
    right: 15%;
    animation-delay: 2s;
  }

  .circle-3 {
    width: 100px;
    height: 100px;
    bottom: 20%;
    left: 20%;
    animation-delay: 4s;
  }

  @keyframes float {
    0%, 100% { transform: translateY(0px) rotate(0deg); }
    50% { transform: translateY(-20px) rotate(180deg); }
  }

  /* Contenido principal */
  .login-content {
    display: flex;
    width: 100%;
    max-width: 1200px;
    background: rgba(255, 255, 255, 0.95);
    border-radius: 20px;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
    backdrop-filter: blur(10px);
    overflow: hidden;
    position: relative;
    z-index: 2;
  }

  /* Panel izquierdo */
  .login-info {
    flex: 1;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 3rem;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .info-content {
    text-align: center;
    max-width: 400px;
  }

  .logo-section {
    margin-bottom: 3rem;
  }

  .logo-icon {
    font-size: 4rem;
    margin-bottom: 1rem;
    animation: pulse 2s infinite;
  }

  @keyframes pulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.05); }
  }

  .logo-section h1 {
    font-size: 2.5rem;
    font-weight: 700;
    margin-bottom: 1rem;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  }

  .subtitle {
    font-size: 1.1rem;
    opacity: 0.9;
    line-height: 1.6;
  }

  .features {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .feature-item {
    display: flex;
    align-items: center;
    gap: 1rem;
    text-align: left;
  }

  .feature-icon {
    font-size: 2rem;
    min-width: 60px;
  }

  .feature-text h3 {
    font-size: 1.2rem;
    font-weight: 600;
    margin-bottom: 0.5rem;
  }

  .feature-text p {
    opacity: 0.8;
    font-size: 0.9rem;
  }

  /* Panel derecho */
  .login-form-container {
    flex: 1;
    padding: 3rem;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .login-form {
    width: 100%;
    max-width: 400px;
    opacity: 1;
    transform: translateX(0);
    transition: all 0.6s ease;
  }

  .login-form.animate-in {
    opacity: 1;
    transform: translateX(0);
  }

  .form-header {
    text-align: center;
    margin-bottom: 2rem;
  }

  .form-header h2 {
    font-size: 2rem;
    font-weight: 700;
    color: #333;
    margin-bottom: 0.5rem;
  }

  .form-header p {
    color: #666;
    font-size: 1rem;
  }

  /* Formulario */
  .form-group {
    margin-bottom: 1.5rem;
  }

  .form-group label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-weight: 600;
    color: #333;
    margin-bottom: 0.5rem;
    font-size: 0.9rem;
  }

  .label-icon {
    font-size: 1.1rem;
  }

  .form-group input {
    width: 100%;
    padding: 1rem;
    border: 2px solid #e1e5e9;
    border-radius: 12px;
    font-size: 1rem;
    transition: all 0.3s ease;
    background: #f8f9fa;
  }

  .form-group input:focus {
    outline: none;
    border-color: #667eea;
    background: white;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  }

  .form-group input:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  /* Contenedor de contraseña */
  .password-input-container {
    position: relative;
  }

  .password-toggle {
    position: absolute;
    right: 1rem;
    top: 50%;
    transform: translateY(-50%);
    background: none;
    border: none;
    cursor: pointer;
    font-size: 1.2rem;
    padding: 0.5rem;
    border-radius: 6px;
    transition: background-color 0.2s ease;
  }

  .password-toggle:hover {
    background: rgba(102, 126, 234, 0.1);
  }

  .password-toggle:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  /* Mensaje de error */
  .error-message {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    background: #fee;
    color: #c53030;
    padding: 1rem;
    border-radius: 12px;
    border: 1px solid #feb2b2;
    margin-bottom: 1.5rem;
    font-size: 0.9rem;
  }

  .error-icon {
    font-size: 1.1rem;
  }

  /* Botón de login */
  .login-button {
    width: 100%;
    padding: 1rem 2rem;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    border-radius: 12px;
    font-size: 1.1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    position: relative;
    overflow: hidden;
  }

  .login-button:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3);
  }

  .login-button:active:not(:disabled) {
    transform: translateY(0);
  }

  .login-button:disabled {
    opacity: 0.7;
    cursor: not-allowed;
    transform: none;
  }

  .button-icon {
    font-size: 1.2rem;
  }

  /* Spinner de carga */
  .loading-spinner {
    width: 20px;
    height: 20px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top: 2px solid white;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  /* Footer del formulario */
  .form-footer {
    text-align: center;
    margin-top: 2rem;
    padding-top: 1.5rem;
    border-top: 1px solid #e1e5e9;
  }

  .form-footer p {
    color: #666;
    font-size: 0.9rem;
  }

  /* Responsive */
  @media (max-width: 768px) {
    .login-content {
      flex-direction: column;
      margin: 1rem;
      border-radius: 15px;
    }

    .login-info {
      padding: 2rem;
    }

    .login-form-container {
      padding: 2rem;
    }

    .logo-section h1 {
      font-size: 2rem;
    }

    .features {
      gap: 1rem;
    }

    .feature-item {
      flex-direction: column;
      text-align: center;
      gap: 0.5rem;
    }

    .feature-icon {
      min-width: auto;
    }
  }

  @media (max-width: 480px) {
    .login-info {
      padding: 1.5rem;
    }

    .login-form-container {
      padding: 1.5rem;
    }

    .logo-section h1 {
      font-size: 1.8rem;
    }

    .form-header h2 {
      font-size: 1.5rem;
    }
  }
</style>