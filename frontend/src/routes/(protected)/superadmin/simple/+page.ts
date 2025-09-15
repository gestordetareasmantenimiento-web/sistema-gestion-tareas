import { redirect } from '@sveltejs/kit';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ parent }) => {
  const { user } = await parent();
  
  // Verificar que el usuario sea superadministrador
  if (!user || user.rol !== 'superadmin') {
    throw redirect(302, '/login');
  }
  
  return {
    user
  };
};
