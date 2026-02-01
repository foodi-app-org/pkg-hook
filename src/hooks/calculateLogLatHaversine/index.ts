/**
 *
 * @param deg
 * @returns {number}  Grados a radianes.
 */
function deg2rad(deg: number): number {
  return deg * (Math.PI / 180)
}

// Función para calcular la distancia entre un punto fijo y un punto dado utilizando la fórmula de Haversine
/**
 *
 * @param lat1
 * @param lon1
 * @param lat2
 * @param lon2
 * @returns {number}  Distancia en kilómetros.
 */
export function calculateLogLatHaversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const radioTierra = 6371 // Radio de la Tierra en kilómetros
  const dLat = deg2rad(lat2 - lat1)
  const dLon = deg2rad(lon2 - lon1)
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  const distancia = radioTierra * c
  return distancia
}
// 768px
// Coordenadas del punto fijo
// const puntoFijo = { lat: 4.7984084, lon: -75.7338831 }

// // Array de coordenadas de ejemplo
// const coordenadas = [
//   { lat: 4.7954221, lon: -75.730596 }
// ]

// Calcular distancias entre cada punto y el punto fijo
// coordenadas.forEach((coordenada, index) => {
//   const distancia = calculateLogLatHaversine(puntoFijo.lat, puntoFijo.lon, coordenada.lat, coordenada.lon)
//   console.log(`La distancia entre el punto fijo y coordenada ${index + 1} es ${distancia.toFixed(2)} kilómetros`)
// })
