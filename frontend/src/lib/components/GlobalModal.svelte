<script lang="ts">
  import { modalStore, closeModal } from '../services/modalService';
  import CustomModal from './CustomModal.svelte';
  
  
  function handleConfirm() {
    closeModal(true);
  }
  
  function handleCancel() {
    closeModal(false);
  }
  
  function handleBackClick() {
    if ($modalStore.onBackClick) {
      $modalStore.onBackClick();
    }
    closeModal(true);
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
  showBackButton={$modalStore.showBackButton}
  backButtonText={$modalStore.backButtonText}
  on:confirm={handleConfirm}
  on:cancel={handleCancel}
  on:back={handleBackClick}
/>
