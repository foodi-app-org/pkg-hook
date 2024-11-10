export const validateProductDataExcel = (product, productIndex) => {
  const expectedHeaders = [
    {
      name: 'NOMBRE',
      required: true,
      type: 'string'
    },
    {
      name: 'PRECIO_AL_PUBLICO',
      required: false,
      type: 'number'
    },
    {
      name: 'VALOR_DE_COMPRA',
      required: false,
      type: 'number'
    },
    {
      name: 'CANTIDAD',
      required: true,
      type: 'number'
    },
    {
      name: 'DESCRIPCION',
      required: true,
      type: 'string'
    },
    {
      name: 'DESCUENTO',
      required: false,
      type: 'number'
    },
    {
      name: 'CATEGORIA',
      required: false,
      type: 'string'
    },
    {
      name: 'CODIGO_DE_BARRAS',
      required: false,
      type: 'string'
    },
    {
      name: 'IMPUESTO (%)',
      required: false,
      type: 'number'
    }
  ]

  const errors = []

  // Validar encabezados requeridos
  expectedHeaders.forEach(({ name, required, type }) => {
    if (required && !(name in product)) {
      errors.push(`Producto ${productIndex + 1}: Faltan la columna requerida: ${name}.`)
    } else if (product[name] !== undefined) {
      const isValidType = typeof product[name] === type || (type === 'number' && typeof product[name] === 'number' && !isNaN(product[name]))
      if (!isValidType) {
        errors.push(`Producto ${productIndex + 1}: El campo ${name} debe ser de tipo ${type}.`)
      }
    }
  })

  return errors // Retorna todos los errores encontrados
}
