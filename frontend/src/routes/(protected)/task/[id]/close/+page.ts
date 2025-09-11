import type { PageLoad } from './$types';

export const load: PageLoad = async ({ params }) => {
  console.log('Page load - params:', params);
  return {
    taskId: params.id
  };
};