<script lang="ts">
  import { modalStore, closeModal } from '../services/modalService';
  import CustomModal from './CustomModal.svelte';
  
  
  function handleConfirm() {
    closeModal(true);
  }
  
  function handleCancel() {
    closeModal(false);
  }
</script>

<CustomModal
  bind:isVisible={$modalStore.isVisible}
  title={$modalStore.title}
  message={$modalStore.message}
  type={$modalStore.type}
  confirmText={$modalStore.confirmText}
  cancelText={$modalStore.cancelText}
  showCancel={$modalStore.showCancel}
  on:confirm={handleConfirm}
  on:cancel={handleCancel}
/>
