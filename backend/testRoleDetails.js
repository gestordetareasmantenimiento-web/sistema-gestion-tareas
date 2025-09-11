const superadminController = require('./controllers/superadminController');

// Simular request y response para el rol "inspector"
const mockReq = {
  params: { role: 'inspector' },
  user: { id: 72, rol: 'superadministrador' }
};

const mockRes = {
  json: (data) => {
    console.log('=== RESPUESTA DE getRoleDetails ===');
    console.log('Success:', data.success);
    if (data.data) {
      console.log('Regiones encontradas:', data.data.regiones?.length || 0);
      console.log('Resumen:', data.data.resumen);
      if (data.data.regiones) {
        console.log('Primeras 3 regiones:', data.data.regiones.slice(0, 3));
      }
    }
  },
  status: (code) => ({
    json: (data) => {
      console.log(`=== ERROR ${code} ===`);
      console.log(JSON.stringify(data, null, 2));
    }
  })
};

console.log('=== PROBANDO getRoleDetails para inspector ===');
superadminController.getRoleDetails(mockReq, mockRes);
