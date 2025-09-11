// frontend/src/lib/services/modalService.ts
import { writable } from 'svelte/store';

export interface ModalConfig {
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success' | 'confirm';
  confirmText?: string;
  cancelText?: string;
  showCancel?: boolean;
}

export interface ModalState extends ModalConfig {
  isVisible: boolean;
  resolve?: (value: boolean) => void;
}

// Store para el estado del modal
export const modalStore = writable<ModalState>({
  isVisible: false,
  title: '',
  message: '',
  type: 'info'
});

// Función para mostrar un modal de información
export function showInfo(title: string, message: string): Promise<boolean> {
  return new Promise((resolve) => {
    modalStore.set({
      isVisible: true,
      title,
      message,
      type: 'info',
      resolve
    });
  });
}

// Función para mostrar un modal de éxito
export function showSuccess(title: string, message: string): Promise<boolean> {
  return new Promise((resolve) => {
    modalStore.set({
      isVisible: true,
      title,
      message,
      type: 'success',
      resolve
    });
  });
}

// Función para mostrar un modal de error
export function showError(title: string, message: string): Promise<boolean> {
  return new Promise((resolve) => {
    modalStore.set({
      isVisible: true,
      title,
      message,
      type: 'error',
      resolve
    });
  });
}

// Función para mostrar un modal de advertencia
export function showWarning(title: string, message: string): Promise<boolean> {
  return new Promise((resolve) => {
    modalStore.set({
      isVisible: true,
      title,
      message,
      type: 'warning',
      resolve
    });
  });
}

// Función para mostrar un modal de confirmación
export function showConfirm(
  title: string, 
  message: string, 
  confirmText: string = 'Confirmar', 
  cancelText: string = 'Cancelar'
): Promise<boolean> {
  return new Promise((resolve) => {
    modalStore.set({
      isVisible: true,
      title,
      message,
      type: 'confirm',
      confirmText,
      cancelText,
      showCancel: true,
      resolve
    });
  });
}

// Función para cerrar el modal
export function closeModal(result: boolean = false) {
  modalStore.update(state => {
    if (state.resolve) {
      state.resolve(result);
    }
    return {
      ...state,
      isVisible: false
    };
  });
}
