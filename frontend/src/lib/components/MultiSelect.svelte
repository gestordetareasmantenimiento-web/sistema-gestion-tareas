<script lang="ts">
  import { createEventDispatcher, onMount, onDestroy } from 'svelte';
  
  const dispatch = createEventDispatcher();
  
  export let options: { value: string; label: string }[] = [];
  export let selectedValues: string[] = [];
  export let placeholder: string = 'Seleccionar...';
  export let label: string = '';
  export let id: string = '';
  
  let isOpen = false;
  let searchTerm = '';
  let dropdownElement: HTMLElement;
  
  // Filtrar opciones basado en la búsqueda
  $: filteredOptions = options.filter(option => 
    option && option.label && typeof option.label === 'string' && 
    option.label.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Función para toggle de selección
  function toggleOption(value: string) {
    if (selectedValues.includes(value)) {
      selectedValues = selectedValues.filter(v => v !== value);
    } else {
      selectedValues = [...selectedValues, value];
    }
    dispatch('change', selectedValues);
  }
  
  // Función para limpiar todas las selecciones
  function clearAll() {
    selectedValues = [];
    dispatch('change', selectedValues);
  }
  
  // Función para cerrar el dropdown
  function closeDropdown() {
    isOpen = false;
    searchTerm = '';
  }
  
  // Función para abrir/cerrar el dropdown
  function toggleDropdown() {
    isOpen = !isOpen;
    if (!isOpen) {
      searchTerm = '';
    }
  }
  
  // Función para manejar clics fuera del componente
  function handleClickOutside(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (dropdownElement && !dropdownElement.contains(target)) {
      closeDropdown();
    }
  }
  
  // Configurar event listeners
  onMount(() => {
    document.addEventListener('click', handleClickOutside);
  });
  
  onDestroy(() => {
    document.removeEventListener('click', handleClickOutside);
  });
  
  // Obtener texto del botón
  $: buttonText = selectedValues.length === 0 
    ? placeholder 
    : selectedValues.length === 1 
      ? options.find(opt => opt.value === selectedValues[0])?.label || placeholder
      : `${selectedValues.length} seleccionados`;
</script>

<div class="multi-select-container" bind:this={dropdownElement}>
  {#if label}
    <label for={id} class="multi-select-label">{label}</label>
  {/if}
  
  <div class="multi-select-wrapper">
    <button 
      type="button"
      class="multi-select-button {isOpen ? 'open' : ''}"
      on:click={toggleDropdown}
      on:keydown={(e) => e.key === 'Escape' && closeDropdown()}
    >
      <span class="button-text">{buttonText}</span>
      <span class="dropdown-arrow">▼</span>
    </button>
    
    {#if isOpen}
      <div class="multi-select-dropdown">
        <!-- Barra de búsqueda -->
        <div class="search-container">
          <input 
            type="text"
            placeholder="Buscar..."
            bind:value={searchTerm}
            class="search-input"
            on:click|stopPropagation
          />
        </div>
        
        <!-- Opciones -->
        <div class="options-container">
          {#each filteredOptions as option}
            <label class="option-item">
              <input 
                type="checkbox"
                checked={selectedValues.includes(option.value)}
                on:change={() => toggleOption(option.value)}
                class="option-checkbox"
              />
              <span class="option-label">{option.label}</span>
            </label>
          {/each}
          
          {#if filteredOptions.length === 0}
            <div class="no-options">No se encontraron opciones</div>
          {/if}
        </div>
        
        <!-- Acciones -->
        {#if selectedValues.length > 0}
          <div class="dropdown-actions">
            <button 
              type="button"
              class="clear-button"
              on:click={clearAll}
            >
              Limpiar selección
            </button>
          </div>
        {/if}
      </div>
    {/if}
  </div>
</div>

<style>
  .multi-select-container {
    position: relative;
    display: flex;
    flex-direction: column;
  }
  
  .multi-select-label {
    font-size: 0.8rem;
    font-weight: 600;
    color: #495057;
    margin-bottom: 0.25rem;
  }
  
  .multi-select-wrapper {
    position: relative;
  }
  
  .multi-select-button {
    width: 100%;
    padding: 0.5rem;
    border: 1px solid #ced4da;
    border-radius: 4px;
    background: white;
    cursor: pointer;
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.9rem;
    transition: all 0.2s ease;
  }
  
  .multi-select-button:hover {
    border-color: #adb5bd;
  }
  
  .multi-select-button.open {
    border-color: #007bff;
    box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
  }
  
  .button-text {
    flex: 1;
    text-align: left;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  
  .dropdown-arrow {
    transition: transform 0.2s ease;
    font-size: 0.8rem;
    color: #6c757d;
  }
  
  .multi-select-button.open .dropdown-arrow {
    transform: rotate(180deg);
  }
  
  .multi-select-dropdown {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background: white;
    border: 1px solid #ced4da;
    border-radius: 4px;
    box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15);
    z-index: 1000;
    max-height: 300px;
    display: flex;
    flex-direction: column;
  }
  
  .search-container {
    padding: 0.5rem;
    border-bottom: 1px solid #dee2e6;
  }
  
  .search-input {
    width: 100%;
    padding: 0.25rem 0.5rem;
    border: 1px solid #ced4da;
    border-radius: 4px;
    font-size: 0.9rem;
  }
  
  .search-input:focus {
    outline: none;
    border-color: #007bff;
    box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
  }
  
  .options-container {
    flex: 1;
    overflow-y: auto;
    max-height: 200px;
  }
  
  .option-item {
    display: flex;
    align-items: center;
    padding: 0.5rem;
    cursor: pointer;
    transition: background-color 0.2s ease;
  }
  
  .option-item:hover {
    background-color: #f8f9fa;
  }
  
  .option-checkbox {
    margin-right: 0.5rem;
  }
  
  .option-label {
    flex: 1;
    font-size: 0.9rem;
  }
  
  .no-options {
    padding: 1rem;
    text-align: center;
    color: #6c757d;
    font-size: 0.9rem;
  }
  
  .dropdown-actions {
    padding: 0.5rem;
    border-top: 1px solid #dee2e6;
    background-color: #f8f9fa;
  }
  
  .clear-button {
    width: 100%;
    padding: 0.25rem 0.5rem;
    background: #dc3545;
    color: white;
    border: none;
    border-radius: 4px;
    font-size: 0.8rem;
    cursor: pointer;
    transition: background-color 0.2s ease;
  }
  
  .clear-button:hover {
    background: #c82333;
  }
</style>
