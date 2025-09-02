// frontend/src/lib/stores/auth.ts
import { writable } from 'svelte/store';
import { browser } from '$app/environment';

// Definimos la estructura de los datos del usuario que guardaremos
interface User {
  id: number;
  rol: string;
  id_proveedor: number | null;
}

// Creamos un "store" escribible, que empieza como null si no hay sesión
export const user = writable<User | null>(null);

// Función para sincronizar el store con lo que haya en localStorage al cargar la app
export function syncAuth() {
  if (browser) {
    const token = localStorage.getItem('authToken');
    if (token) {
      try {
        // Decodificamos la parte del payload del JWT (no verificamos firma aquí)
        const payload = JSON.parse(atob(token.split('.')[1]));
        user.set({
          id: payload.id,
          rol: payload.rol,
          id_proveedor: payload.id_proveedor
        });
      } catch (e) {
        // Si el token es inválido, lo borramos
        localStorage.removeItem('authToken');
        user.set(null);
      }
    }
  }
}

// Función para llamar después de un login exitoso
export function login(token: string) {
  if (browser) {
    localStorage.setItem('authToken', token);
    syncAuth(); // Sincronizamos el store con el nuevo token
  }
}

// Función para el logout
export function logout() {
  if (browser) {
    localStorage.removeItem('authToken');
    user.set(null);
  }
}