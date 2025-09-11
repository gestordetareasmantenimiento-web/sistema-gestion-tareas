<script lang="ts">
  export let tarea: any;
  export let userRole: string = '';

  const rol = userRole ? userRole.toLowerCase() : '';

  // Array que agrupa a los roles que necesitan una vista completa (de auditoría)
  const highLevelRoles = [
    'administrativo', 
    'gerente', 
    'cerco',
    'supervisor de disponibilidad',
    'supervisor de soporte',
    'supervisor de provision'
  ];

  // Lógica para determinar el color del borde de la tarjeta según el estado
  $: cardClass = (() => {
    if (!tarea || !tarea.estado) return '';
    const estado = tarea.estado.toLowerCase();
    
    if (estado.includes('pago')) return 'pasado-a-pago';
    if (estado.includes('observada')) return 'observado';
    if (estado.includes('pendiente certificación')) return 'en-aprobacion';
    if (estado.includes('asignada')) return 'pendiente';
    if (estado.includes('aprobación')) return 'aprobados'; 

    return '';
  })();
</script>

<a href="/task/{tarea.id}" class="task-card-link">
  <article class="task-card {cardClass}">
    <header class="card-header">
      {tarea.id_tarea_texto}
    </header>

    <section class="card-body">
      <div class="info-item">
        <strong>Dirección:</strong>
        <span>{tarea.direccion}</span>
      </div>
      <div class="info-item">
        <strong>WO:</strong>
        <span>{tarea.numero_wo || 'N/A'}</span>
      </div>
      <div class="info-item">
        <strong>Región:</strong>
        <span>{tarea.region}</span>
      </div>

      <!-- Vistas de información condicionales -->
      {#if rol === 'proveedor'}
        <div class="info-item">
          <strong>Inspector:</strong>
          <span>{tarea.inspector_nombre}</span>
        </div>
      {:else if rol === 'inspector'}
        <div class="info-item">
          <strong>Proveedor:</strong>
          <span>{tarea.proveedor_nombre}</span>
        </div>
      {:else if rol === 'supervisor de mantenimiento'}
        <div class="info-item">
          <strong>Proveedor:</strong>
          <span>{tarea.proveedor_nombre}</span>
        </div>
        <div class="info-item">
          <strong>Inspector:</strong>
          <span>{tarea.inspector_nombre}</span>
        </div>
      {:else if highLevelRoles.includes(rol)}
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
      {/if}
    </section>

    <footer class="card-footer">
      <strong>Estado:</strong>
      <span>{tarea.estado}</span>
    </footer>
  </article>
</a>

<style>
  .task-card-link {
    text-decoration: none;
    color: inherit;
    display: block;
  }

  .task-card {
    background-color: white;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    border-left: 5px solid #ccc;
    padding: 0.75rem;
    height: 100%;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    transition: box-shadow 0.2s ease-in-out;
  }
  
  .task-card:hover {
    box-shadow: 0 4px 8px rgba(0,0,0,0.15);
  }

  .card-header {
    font-weight: bold;
    font-size: 0.9rem;
    margin-bottom: 0.75rem;
    padding-bottom: 0.5rem;
    border-bottom: 1px solid #f0f0f0;
  }

  .card-body {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.5rem;
    font-size: 0.85rem;
    flex-grow: 1;
  }

  .info-item {
    word-break: break-word;
  }

  .info-item strong {
    display: block;
    font-size: 0.75rem;
    color: #555;
    margin-bottom: 0.15rem;
  }
  
  .info-item span {
    font-size: 0.85rem;
  }

  .card-footer {
    font-size: 0.75rem;
    border-top: 1px solid #f0f0f0;
    padding-top: 0.5rem;
    margin-top: 0.75rem;
    color: #333;
  }
  
  .card-footer strong {
    margin-right: 0.5rem;
  }

  /* --- Colores de Borde por Estado --- */
  .pendiente { border-left-color: #ffc107; }
  .en-aprobacion { border-left-color: #6f42c1; }
  .observado { border-left-color: #fd7e14; }
  .pasado-a-pago { border-left-color: #28a745; }
  .aprobados { border-left-color: #17a2b8; }
</style>

