<script lang="ts">
  export let message: string = 'Cargando...';
  export let size: 'small' | 'medium' | 'large' = 'medium';
  export let showMessage: boolean = true;
</script>

<div class="loading-container {size}">
  <div class="spinner"></div>
  {#if showMessage}
    <p class="loading-message">{message}</p>
  {/if}
</div>

<style>
  .loading-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 2rem;
    gap: 1rem;
  }
  
  .loading-container.small {
    padding: 1rem;
    gap: 0.5rem;
  }
  
  .loading-container.large {
    padding: 3rem;
    gap: 1.5rem;
  }
  
  .spinner {
    border: 3px solid #f3f3f3;
    border-top: 3px solid #007bff;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
  
  .loading-container.small .spinner {
    width: 20px;
    height: 20px;
    border-width: 2px;
  }
  
  .loading-container.medium .spinner {
    width: 40px;
    height: 40px;
  }
  
  .loading-container.large .spinner {
    width: 60px;
    height: 60px;
    border-width: 4px;
  }
  
  .loading-message {
    margin: 0;
    color: #6c757d;
    font-size: 0.9rem;
    text-align: center;
  }
  
  .loading-container.small .loading-message {
    font-size: 0.8rem;
  }
  
  .loading-container.large .loading-message {
    font-size: 1.1rem;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
</style>
