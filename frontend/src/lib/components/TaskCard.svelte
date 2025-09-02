<script lang="ts">
  export let tarea: any;
  export let userRole: string = ''; // Recibimos el rol del usuario logueado

  const rol = userRole ? userRole.toLowerCase() : '';

  // Lógica para determinar el color del borde de la tarjeta según el estado
  $: cardClass = (() => {
    if (!tarea || !tarea.estado) return '';
    const estado = tarea.estado.toLowerCase();
    if (estado.includes('asignada')) return 'pendiente';
    if (estado.includes('pendiente')) return 'en-aprobacion';
    if (estado.includes('observada')) return 'observado';
    if (estado.includes('pago')) return 'pasado-a-pago';
    return '';
  })();
</script>

<a href="/task/{tarea.id}" class="tarea-card-link">
  <div class="tarea-card {cardClass}">
    <div class="card-header">{tarea.id_tarea_texto}</div>
    <div class="card-body">
      <div class="info-item">
        <strong>Dirección:</strong>
        <span>{tarea.direccion}</span>
      </div>
      <div class="info-item">
        <strong>ICD:</strong>
        <span>{tarea.numero_icd || 'N/A'}</span>
      </div>

      {#if rol === 'proveedor'}
        <div class="info-item">
          <strong>Inspector:</strong>
          <span>{tarea.inspector_nombre}</span>
        </div>
        <div class="info-item">
          <strong>Supervisor:</strong>
          <span>{tarea.supervisor_nombre || 'N/A'}</span>
        </div>
        <div class="info-item">
          <strong>Región:</strong>
          <span>{tarea.region}</span>
        </div>
      {:else if rol === 'inspector'}
        <div class="info-item">
          <strong>Proveedor:</strong>
          <span>{tarea.proveedor_nombre}</span>
        </div>
        <div class="info-item">
          <strong>Región:</strong>
          <span>{tarea.region}</span>
        </div>
      {:else if rol === 'supervisor'}
        <div class="info-item">
          <strong>Proveedor:</strong>
          <span>{tarea.proveedor_nombre}</span>
        </div>
        <div class="info-item">
          <strong>Inspector:</strong>
          <span>{tarea.inspector_nombre}</span>
        </div>
        <div class="info-item">
          <strong>Región:</strong>
          <span>{tarea.region}</span>
        </div>
      {:else if ['administrativo', 'gerente', 'cerco'].includes(rol)}
        <div class="info-item">
          <strong>Proveedor:</strong>
          <span>{tarea.proveedor_nombre}</span>
        </div>
        <div class="info-item">
          <strong>Inspector:</strong>
          <span>{tarea.inspector_nombre}</span>
        </div>
        <div class="info-item">
          <strong>Supervisor:</strong>
          <span>{tarea.supervisor_nombre || 'N/A'}</span>
        </div>
        {#if rol === 'cerco'}
          <div class="info-item">
            <strong>Región:</strong>
            <span>{tarea.region}</span>
          </div>
        {/if}
      {/if}
    </div>
    <div class="card-footer">
      <strong>Estado:</strong> {tarea.estado}
    </div>
  </div>
</a>

<style>
  .tarea-card-link {
    text-decoration: none;
    color: inherit;
    display: block;
    height: 100%;
  }
  .tarea-card {
    background-color: white;
    border-radius: 8px;
    padding: 1rem;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    border-left: 5px solid #ccc;
    height: 100%;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
  }
  .card-header {
    font-weight: bold;
    margin-bottom: 1rem;
  }
  .card-body {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.75rem;
    font-size: 0.9rem;
    margin-bottom: 1rem;
    flex-grow: 1;
  }
  .info-item {
    display: flex;
    flex-direction: column;
    word-break: break-word;
  }
  .info-item strong {
    font-size: 0.8rem;
    color: #555;
    margin-bottom: 0.2rem;
  }
  .card-footer {
    font-size: 0.8rem;
    font-style: italic;
    border-top: 1px solid #eee;
    padding-top: 0.75rem;
    margin-top: auto;
  }

  /* Colores de Borde */
  .pendiente { border-left-color: #ffc107; }
  .en-aprobacion { border-left-color: #6f42c1; }
  .observado { border-left-color: #fd7e14; }
  .pasado-a-pago { border-left-color: #28a745; }
</style>