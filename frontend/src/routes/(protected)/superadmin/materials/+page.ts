import { redirect } from '@sveltejs/kit';
import type { PageLoad } from './$types';

export const load: PageLoad = async () => {
  // La verificación de autenticación se hace en el layout padre
  // Solo verificamos que estamos en la ruta correcta
  return {};
};