// backend/utils/roles.js

// Definimos un grupo de roles que tienen los mismos permisos que un Inspector.
const ROLES_TIPO_INSPECTOR = [
  'inspector',
  'supervisor', // <-- ¡AÑADIMOS EL SUPERVISOR ORIGINAL A LA LISTA!
  'supervisor de disponibilidad',
  'supervisor de soporte',
  'supervisor de provision'
];

module.exports = {
  ROLES_TIPO_INSPECTOR
};