// frontend/src/lib/utils/loadingUtils.ts
import { writable } from 'svelte/store';

// Store global para el estado de carga
export const isLoading = writable(false);
export const loadingMessage = writable('Cargando...');

// Función para iniciar carga
export function startLoading(message: string = 'Cargando...') {
  isLoading.set(true);
  loadingMessage.set(message);
}

// Función para detener carga
export function stopLoading() {
  isLoading.set(false);
  loadingMessage.set('Cargando...');
}

// Función para hacer fetch con manejo de carga automático
export async function fetchWithLoading<T>(
  url: string, 
  options: RequestInit = {}, 
  loadingMsg: string = 'Cargando datos...'
): Promise<T> {
  startLoading(loadingMsg);
  
  try {
    const response = await fetch(url, options);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } finally {
    stopLoading();
  }
}

// Función para verificar si el token está disponible
export function isTokenAvailable(): boolean {
  if (typeof window === 'undefined') return false;
  
  const token = localStorage.getItem('authToken');
  return token !== null && token.trim() !== '';
}

// Función para obtener headers de autenticación
export function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('authToken');
  
  if (!token) {
    throw new Error('Token no disponible');
  }
  
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
}
