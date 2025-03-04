export const validateProductDataExcel = (product, productIndex) => {
  const expectedHeaders = [
    {
      name: 'NOMBRE',
      required: true,
      types: ['string']
    },
    {
      name: 'PRECIO_AL_PUBLICO',
      required: false,
      types: ['number', 'string']
    },
    {
      name: 'VALOR_DE_COMPRA',
      required: false,
      types: ['number', 'string']
    },
    {
      name: 'CANTIDAD',
      required: true,
      types: ['number']
    },
    {
      name: 'DESCRIPCION',
      required: true,
      types: ['string']
    },
    {
      name: 'DESCUENTO',
      required: false,
      types: ['number', 'string']
    },
    {
      name: 'CATEGORIA',
      required: false,
      types: ['string']
    },
    {
      name: 'CODIGO_DE_BARRAS',
      required: false,
      types: ['string', 'number']
    },
    {
      name: 'IMPUESTO (%)',
      required: false,
      types: ['number', 'string']
    }
  ]

  const errors = []

  // Validar encabezados requeridos y tipos
  expectedHeaders.forEach(({ name, required, types }) => {
    const value = product[name]

    if (required && (value === undefined || value === null)) {
      errors.push(`Producto ${productIndex + 1}: Falta la columna requerida: ${name}.`)
    } else if (value !== undefined && value !== null) {
      const isValidType = types.some(type => {
        if (type === 'number') {
          return typeof value === 'number' && !isNaN(value)
        }
        return typeof value === type
      })

      if (!isValidType) {
        errors.push(`Producto ${productIndex + 1}: El campo ${name} debe ser de tipo ${types.join(' o ')}.`)
      }
    }
  })

  return errors // Retorna todos los errores encontrados
}
