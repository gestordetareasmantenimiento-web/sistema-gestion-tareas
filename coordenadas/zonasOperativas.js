// Zonas Operativas de la Ciudad de Buenos Aires
// Cada zona contiene un polígono con coordenadas [longitud, latitud] y un centroide
// Ajustado para cubrir las coordenadas reales obtenidas de la API
const zonasOperativas = [
  {
    nombre: "PAV155",
    centro: { lon: -58.480, lat: -34.550 },
    coordenadas: [
      [-58.520, -34.570], [-58.440, -34.570], [-58.440, -34.530], [-58.520, -34.530]
    ]
  },
  {
    nombre: "PAV001",
    centro: { lon: -58.375, lat: -34.610 },
    coordenadas: [
      [-58.400, -34.620], [-58.350, -34.620], [-58.350, -34.600], [-58.400, -34.600]
    ]
  },
  {
    nombre: "PAV200",
    centro: { lon: -58.400, lat: -34.640 },
    coordenadas: [
      [-58.420, -34.660], [-58.380, -34.660], [-58.380, -34.620], [-58.420, -34.620]
    ]
  },
  {
    nombre: "PAV300",
    centro: { lon: -58.500, lat: -34.600 },
    coordenadas: [
      [-58.520, -34.620], [-58.480, -34.620], [-58.480, -34.580], [-58.520, -34.580]
    ]
  },
  {
    nombre: "PAV400",
    centro: { lon: -58.360, lat: -34.600 },
    coordenadas: [
      [-58.380, -34.620], [-58.340, -34.620], [-58.340, -34.580], [-58.380, -34.580]
    ]
  }
];

module.exports = zonasOperativas;
