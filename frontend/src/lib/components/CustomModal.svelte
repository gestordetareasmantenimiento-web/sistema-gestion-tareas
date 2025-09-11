<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  
  export let isVisible = false;
  export let title = '';
  export let message = '';
  export let type: 'info' | 'warning' | 'error' | 'success' | 'confirm' = 'info';
  export let confirmText = 'Confirmar';
  export let cancelText = 'Cancelar';
  export let showCancel = true;
  
  const dispatch = createEventDispatcher();
  
  
  
  function handleConfirm() {
    dispatch('confirm');
    closeModal();
  }
  
  function handleCancel() {
    dispatch('cancel');
    closeModal();
  }
  
  function closeModal() {
    isVisible = false;
  }
  
  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      closeModal();
    } else if (event.key === 'Enter' && type === 'confirm') {
      handleConfirm();
    }
  }
  
  $: icon = {
    info: 'ℹ️',
    warning: '⚠️',
    error: '❌',
    success: '✅',
    confirm: '❓'
  }[type];
  
  $: bgColor = {
    info: '#e3f2fd',
    warning: '#fff3e0',
    error: '#ffebee',
    success: '#e8f5e8',
    confirm: '#f3e5f5'
  }[type];
  
  $: borderColor = {
    info: '#2196f3',
    warning: '#ff9800',
    error: '#f44336',
    success: '#4caf50',
    confirm: '#9c27b0'
  }[type];
</script>

{#if isVisible}
  <div class="modal-overlay" on:click={closeModal} on:keydown={handleKeydown} role="dialog" aria-modal="true" tabindex="-1">
    <div class="modal-content" on:click|stopPropagation style="background-color: {bgColor}; border-color: {borderColor};">
      <div class="modal-header">
        <div class="modal-icon">{icon}</div>
        <h3 class="modal-title">{title}</h3>
        <button class="modal-close" on:click={closeModal} aria-label="Cerrar">×</button>
      </div>
      
      <div class="modal-body">
        <p class="modal-message">{message}</p>
      </div>
      
      <div class="modal-footer">
        {#if type === 'confirm'}
          <button class="btn btn-cancel" on:click={handleCancel}>
            {cancelText}
          </button>
          <button class="btn btn-confirm" on:click={handleConfirm}>
            {confirmText}
          </button>
        {:else}
          <button class="btn btn-primary" on:click={closeModal}>
            Aceptar
          </button>
        {/if}
      </div>
    </div>
  </div>
{/if}

<style>
  .modal-overlay {
    position: fixed !important;
    top: 0 !important;
    left: 0 !important;
    right: 0 !important;
    bottom: 0 !important;
    background-color: rgba(0, 0, 0, 0.5) !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    z-index: 999999 !important;
    padding: 1rem !important;
    visibility: visible !important;
    opacity: 1 !important;
  }
  
  .modal-content {
    background: white;
    border-radius: 12px;
    border: 2px solid;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
    max-width: 500px;
    width: 100%;
    max-height: 90vh;
    overflow-y: auto;
  }
  
  .modal-header {
    display: flex;
    align-items: center;
    padding: 1.5rem 1.5rem 1rem 1.5rem;
    border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  }
  
  .modal-icon {
    font-size: 1.5rem;
    margin-right: 0.75rem;
  }
  
  .modal-title {
    flex: 1;
    margin: 0;
    font-size: 1.25rem;
    font-weight: 600;
    color: #333;
  }
  
  .modal-close {
    background: none;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    color: #666;
    padding: 0;
    width: 2rem;
    height: 2rem;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    transition: background-color 0.2s;
  }
  
  .modal-close:hover {
    background-color: rgba(0, 0, 0, 0.1);
  }
  
  .modal-body {
    padding: 1rem 1.5rem;
  }
  
  .modal-message {
    margin: 0;
    font-size: 1rem;
    line-height: 1.5;
    color: #555;
  }
  
  .modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: 0.75rem;
    padding: 1rem 1.5rem 1.5rem 1.5rem;
  }
  
  .btn {
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: 6px;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    min-width: 100px;
  }
  
  .btn-primary {
    background-color: #007bff;
    color: white;
  }
  
  .btn-primary:hover {
    background-color: #0056b3;
  }
  
  .btn-confirm {
    background-color: #28a745;
    color: white;
  }
  
  .btn-confirm:hover {
    background-color: #218838;
  }
  
  .btn-cancel {
    background-color: #6c757d;
    color: white;
  }
  
  .btn-cancel:hover {
    background-color: #5a6268;
  }
  
  /* Responsive */
  @media (max-width: 768px) {
    .modal-content {
      margin: 1rem;
      max-width: none;
    }
    
    .modal-footer {
      flex-direction: column;
    }
    
    .btn {
      width: 100%;
    }
  }
</style>
