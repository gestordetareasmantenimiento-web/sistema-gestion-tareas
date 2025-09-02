<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  const dispatch = createEventDispatcher();
</script>

<div class="modal-backdrop" on:click={() => dispatch('close')}>
  <div class="modal-content" on:click|stopPropagation>
    <button class="close-button" on:click={() => dispatch('close')}>&times;</button>
    <slot />
  </div>
</div>

<style>
  .modal-backdrop {
    position: fixed; /* Clave: se posiciona sobre toda la ventana */
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5); /* Fondo oscuro semitransparente */
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 100; /* Asegura que esté por encima de todo */
  }

  .modal-content {
    background-color: white;
    padding: 2rem;
    border-radius: 8px;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
    position: relative;
    width: 90%;
    max-width: 600px; /* Ancho máximo del modal */
  }

  .close-button {
    position: absolute;
    top: 10px;
    right: 15px;
    background: none;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    color: #888;
  }
</style>