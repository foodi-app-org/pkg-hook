export function convertToIntegerOrFloat(numberString) {
    if (!numberString) return 0;
    
    // Convierte a número (entero o flotante)
    const numericValue = parseFloat(numberString);
    
    return isNaN(numericValue) ? 0 : numericValue; // Maneja valores no numéricos como 0
  }
  