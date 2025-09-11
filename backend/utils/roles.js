// backend/utils/roles.js

const ROLES = {
  INSPECTOR: 'inspector',
  SUPERVISOR_MANTENIMIENTO: 'supervisor de mantenimiento',
  SUPERVISOR_DISPONIBILIDAD: 'supervisor de disponibilidad',
  SUPERVISOR_SOPORTE: 'supervisor de soporte',
  SUPERVISOR_PROVISION: 'supervisor de provision',
  PROVEEDOR: 'proveedor',
  ADMINISTRATIVO: 'administrativo',
  GERENTE: 'gerente',
  CERCO: 'cerco',
  SUPERADMIN: 'superadministrador'
};

// Grupo que incluye todos los roles de supervisor para permisos compartidos
const SUPERVISOR_ROLES = [
  ROLES.SUPERVISOR_MANTENIMIENTO,
  ROLES.SUPERVISOR_DISPONIBILIDAD,
  ROLES.SUPERVISOR_SOPORTE,
  ROLES.SUPERVISOR_PROVISION
];

module.exports = {
  ROLES,
  SUPERVISOR_ROLES
};