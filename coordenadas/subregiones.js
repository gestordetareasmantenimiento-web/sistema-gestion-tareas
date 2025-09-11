// Subregiones de la Ciudad de Buenos Aires
// Cada subregión contiene un polígono con coordenadas [longitud, latitud]
// Ajustado para cubrir las coordenadas reales obtenidas de la API
const subregiones = [
  {
    nombre: "Saavedra", 
    coordenadas: [
      [-58.520, -34.560], [-58.480, -34.560], [-58.480, -34.540], [-58.520, -34.540]
    ]
  },
  {
    nombre: "Recoleta",
    coordenadas: [
      [-58.400, -34.610], [-58.380, -34.610], [-58.380, -34.590], [-58.400, -34.590]
    ]
  },
  {
    nombre: "San Telmo",
    coordenadas: [
      [-58.380, -34.640], [-58.360, -34.640], [-58.360, -34.620], [-58.380, -34.620]
    ]
  },
  {
    nombre: "Devoto",
    coordenadas: [
      [-58.520, -34.600], [-58.500, -34.600], [-58.500, -34.580], [-58.520, -34.580]
    ]
  },
  {
    nombre: "Colegiales",
    coordenadas: [
      [-58.460, -34.580], [-58.440, -34.580], [-58.440, -34.560], [-58.460, -34.560]
    ]
  },
  {
    nombre: "Palermo",
    coordenadas: [
      [-58.420, -34.580], [-58.380, -34.580], [-58.380, -34.560], [-58.420, -34.560]
    ]
  },
  {
    nombre: "Almagro",
    coordenadas: [
      [-58.420, -34.620], [-58.400, -34.620], [-58.400, -34.600], [-58.420, -34.600]
    ]
  },
  {
    nombre: "Boedo",
    coordenadas: [
      [-58.420, -34.640], [-58.400, -34.640], [-58.400, -34.620], [-58.420, -34.620]
    ]
  },
  {
    nombre: "Paternal",
    coordenadas: [
      [-58.500, -34.620], [-58.480, -34.620], [-58.480, -34.600], [-58.500, -34.600]
    ]
  }
];

module.exports = subregiones;
