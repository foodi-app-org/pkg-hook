import { useApolloClient, useMutation } from '@apollo/client'
import { useRef, useState } from 'react'

import { RandomCode } from '../../utils'
import { GET_ALL_CATEGORIES_WITH_PRODUCT } from '../useCatWithProduct/queries'
import { useLocalStorage } from '../useLocalSorage'
import {
  GET_ALL_PRODUCT_STORE,
  UPDATE_PRODUCT_FOOD
} from '../useProductsFood/queriesStore'
import { useTagsProducts } from '../useProductsFood/usetagsProducts'
import { useSetImageProducts } from '../useSetImageProducts'
import { useStore } from '../useStore'
import { useRegisterTagToProduct } from '../useTagProducts'

// import { getCatProductsWithProduct } from './helpers/manageCacheDataCatProduct'
import { useEditImageProduct } from './helpers/useEditImageProduct'

import type { SendNotificationFn } from 'typesdefs'

type UseCreateProductProps = {
  router?: any
  image?: string | null
  setAlertBox?: (args: { message: string; duration?: number }) => void
  sendNotification?: SendNotificationFn
}

export const useCreateProduct = ({
  image,
  setAlertBox = () => {},
  sendNotification = () => {}
}: UseCreateProductProps) => {
  const [errors, setErrors] = useState<{
    names: boolean
    ProPrice: boolean
    ProDescuento: boolean
    ProDescription: boolean
    ProWeight: boolean
    ProHeight: boolean
    ValueDelivery: boolean
    carProId?: boolean
    tags?: boolean
  }>({
    names: false,
    ProPrice: false,
    ProDescuento: false,
    ProDescription: false,
    ProWeight: false,
    ProHeight: false,
    ValueDelivery: false
  })

  const [values, setValues] = useState({
    ProPrice: 0,
    ProDescuento: 0,
    ProDescription: '',
    ProWeight: '',
    ProHeight: '',
    ValueDelivery: 0,
    carProId: ''
  })

  const STEPS = Object.freeze({
    PRODUCT: 0,
    DESSERTS: 1,
    COMPLEMENTS: 2,
    AVAILABILITY: 3
  })

  const [updateImageProducts] = useSetImageProducts()

  const [names, setName] = useLocalStorage('productName', '')
  const [showMore, setShowMore] = useState(50)
  const [search, setSearch] = useState('')
  const [active, setActive] = useState(STEPS.PRODUCT)
  const [pId, setPid] = useState<string | null>(null)

  // Filtros
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [filter, setFilter] = useState<{
    gender: string[]
    desc: string[]
    specialty: string[]
  }>({
    gender: [],
    desc: [],
    specialty: []
  })

  const initialState = {
    alt: '/images/default-banner.png',
    src: '/images/default-banner.png'
  }

  const [{ alt, src }, setPreviewImg] = useState(initialState)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const [arrTags, setTags] = useState<string[]>([])

  // Stock
  const [stock, setStock] = useState(1)

  // El manejo de stock está habilitado por defecto
  const [checkStock, setCheckStock] = useState(true)

  const handleIncreaseStock = () => {
    setStock(prevStock => prevStock + 1)
  }

  const handleDecreaseStock = () => {
    setStock(prevStock => (
      prevStock > 1 ? prevStock - 1 : 1
    ))
  }

  // Activar o desactivar el manejo de stock
  const handleCheckStock = () => {
    setCheckStock(prev => !prev)
  }

  const [dataStore] = useStore()

  const {
    data,
    tags,
    setNewTags,
    newTags,
    handleRemoveTag,
    handleRegister: handleRegisterTags,
    handleAddTag,
    handleClearSelectedTag,
    handleAddDraftTag,
    handleRemoveDraftTag,
    registerTags: handleRegisterDraftTags,
    loadingTags: loadingRegisterTags
  } = useTagsProducts({ sendNotification })

  // Asocia el tag seleccionado al producto recién creado (FK tgId en producto).
  const [handleRegisterTagToProduct] = useRegisterTagToProduct()

  // Estados de disponibilidad
  const [check, setCheck] = useState({
    availability: true,
    noAvailability: false,
    desc: false,
    freeShipping: false
  })

  const handleCheck = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target

    return setCheck(prev => ({
      ...prev,
      [name]: checked
    }))
  }

  const handleUpdateBanner = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { files } = event.target

    if (files && files.length) {
      setPreviewImg({
        src: URL.createObjectURL(files[0]),
        alt: files[0].name
      })
    } else {
      setPreviewImg(initialState)
    }
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    error: boolean
  ) => {
    const { name, value } = e.target

    setValues(prev => ({
      ...prev,
      [name]: value
    }))

    setErrors(prev => ({
      ...prev,
      [name]: error
    }))
  }

  const handleChangeFilter = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setSearch(e.target.value)
  }

  const onClickSearch = () => {
    // Implementar lógica de búsqueda si es necesario
  }

  const onClickClear = () => {
    setFilter({
      gender: [],
      desc: [],
      specialty: []
    })
  }

  const handleChangeClick = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const {
      name,
      value,
      checked
    } = e.target

    if (checked) {
      setFilter(prev => ({
        ...prev,
        [name]: [
          ...prev[name as keyof typeof prev],
          value
        ]
      }))
    } else {
      setFilter(prev => ({
        ...prev,
        [name]: prev[name as keyof typeof prev].filter(
          (f: string) => f !== value
        )
      }))
    }
  }

  const handleCheckFreeShipping = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    handleCheck(e)

    setValues({
      ...values,
      ValueDelivery: 0
    })
  }

  const client = useApolloClient()

  const [updateProductFoods, { loading }] = useMutation(
    UPDATE_PRODUCT_FOOD,
    {}
  )

  const onTargetClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  // Manejo de imagen del producto
  useEditImageProduct({
    sendNotification: (args) => {
      const {
        backgroundColor = '',
        title,
        description
      } = args

      sendNotification({
        backgroundColor,
        title,
        description
      })
    },
    initialState
  })

  /**
   * Inyecta un producto recién creado en la caché de Apollo.
   *
   * `ProductFood` no se normaliza (no tiene id/keyFields), así que los objetos
   * viven embebidos en cada query. Por eso insertamos el objeto completo dentro
   * de los arrays cacheados en vez de usar writeFragment + referencias.
   *
   * Estrategia (en orden):
   *  1. Antepone el objeto a cada `productFoodsAll` ya cacheada (listado plano)
   *     e incrementa totalRecords de su paginación.
   *  2. Antepone el objeto al `productFoodsAll` anidado de su categoría dentro
   *     de getCatProductsWithProduct.
   *  3. Si no se pudo insertar en ningún listado cacheado (o algo falló), hace
   *     un refetch a la base de datos como último recurso.
   *
   * @param root0 - Parámetros.
   * @param root0.productData - Datos del producto devueltos por la mutación.
   * @param root0.formValues  - Valores del formulario para completar campos
   *                            que la mutación no retorna (stock, imagen, etc.).
   */
  const injectNewProductIntoCache = ({
    productData,
    formValues
  }: {
    productData: any
    formValues: Record<string, any>
  }) => {
    const pId = productData?.pId
    if (!pId) return

    const nowIso = new Date().toISOString()
    const idStore = dataStore?.idStore || ''
    const carProId = productData?.carProId ?? formValues?.carProId ?? null

    // Objeto que se inserta embebido en los listados. Incluye los campos que
    // leen tanto productFoodsAll (lista plana) como el productFoodsAll anidado
    // dentro de getCatProductsWithProduct, con __typename para consistencia.
    const newProduct = {
      __typename: 'ProductFood',
      pId,
      sizeId: productData?.sizeId ?? null,
      colorId: productData?.colorId ?? null,
      stock: formValues?.stock ?? productData?.stock ?? 0,
      manageStock: formValues?.manageStock ?? productData?.manageStock ?? true,
      carProId,
      caId: productData?.caId ?? null,
      cId: productData?.cId ?? null,
      dId: productData?.dId ?? null,
      ctId: productData?.ctId ?? null,
      fId: productData?.fId ?? null,
      idStore,
      pName: productData?.pName ?? formValues?.pName ?? '',
      getOneTags: null,
      ProPrice: productData?.ProPrice ?? formValues?.ProPrice ?? 0,
      ProDescuento: productData?.ProDescuento ?? formValues?.ProDescuento ?? 0,
      free: productData?.free ?? 0,
      ProUniDisponibles: productData?.ProUniDisponibles ?? null,
      ProDescription: productData?.ProDescription ?? formValues?.ProDescription ?? '',
      ProProtegido: productData?.ProProtegido ?? null,
      ProAssurance: productData?.ProAssurance ?? null,
      ValueDelivery: productData?.ValueDelivery ?? formValues?.ValueDelivery ?? null,
      ProStar: productData?.ProStar ?? 0,
      sTateLogistic: productData?.sTateLogistic ?? 1,
      ProImage: productData?.ProImage ?? formValues?.ProImage ?? '/images/placeholder-image.webp',
      ProWidth: productData?.ProWidth ?? null,
      ProHeight: productData?.ProHeight ?? formValues?.ProHeight ?? null,
      ProLength: productData?.ProLength ?? null,
      ProWeight: productData?.ProWeight ?? formValues?.ProWeight ?? '',
      ProQuantity: productData?.ProQuantity ?? null,
      ProOutstanding: productData?.ProOutstanding ?? formValues?.ProOutstanding ?? 0,
      createdAt: productData?.createdAt ?? nowIso,
      updatedAt: productData?.updatedAt ?? nowIso,
      ProDelivery: productData?.ProDelivery ?? formValues?.ProDelivery ?? 0,
      ProVoltaje: productData?.ProVoltaje ?? null,
      pState: productData?.pState ?? 1,
      feat: productData?.feat ?? null,
      area: productData?.area ?? null,
      product_availables: []
    }

    try {
      // IMPORTANTE: `ProductFood` no tiene `id`/`_id` ni `keyFields` definidos
      // en la caché, así que Apollo NO normaliza estos objetos: viven embebidos
      // dentro de cada query. Por eso NO usamos writeFragment + refs (eso fallaba
      // con "Missing field while writing result" porque cache.identify devolvía
      // undefined al no haber keyField). En su lugar insertamos el objeto
      // completo directamente dentro de los arrays cacheados.

      let insertedSomewhere = false

      // 1. Antepone el producto a cada campo productFoodsAll cacheado
      //    (el listado plano de GET_ALL_PRODUCT_STORE).
      client.cache.modify({
        fields: {
          productFoodsAll (existing: any) {
            // Caso lista plana: { success, message, pagination, data: [...] }
            if (existing && Array.isArray(existing?.data)) {
              const alreadyExists = existing.data.some(
                (item: any) => item?.pId === pId
              )
              if (alreadyExists) return existing

              const prevPagination = existing?.pagination ?? {}
              const prevTotal = Number(prevPagination?.totalRecords ?? existing.data.length) || 0

              insertedSomewhere = true
              return {
                ...existing,
                data: [newProduct, ...existing.data],
                pagination: {
                  ...prevPagination,
                  totalRecords: prevTotal + 1
                }
              }
            }
            return existing
          }
        }
      })

      // 2. Antepone el producto al productFoodsAll anidado de la categoría
      //    correspondiente dentro de getCatProductsWithProduct.
      client.cache.modify({
        fields: {
          getCatProductsWithProduct (existing: any) {
            const list = existing?.catProductsWithProduct
            if (!Array.isArray(list) || list.length === 0) return existing
            if (!carProId) return existing

            let changed = false
            const updatedList = list.map((cat: any) => {
              if (cat?.carProId !== carProId) return cat

              const nestedArr = Array.isArray(cat?.productFoodsAll)
                ? cat.productFoodsAll
                : []

              const alreadyExists = nestedArr.some(
                (item: any) => item?.pId === pId
              )
              if (alreadyExists) return cat

              changed = true
              insertedSomewhere = true
              return {
                ...cat,
                productFoodsAll: [newProduct, ...nestedArr]
              }
            })

            return changed
              ? { ...existing, catProductsWithProduct: updatedList }
              : existing
          }
        }
      })

      if (insertedSomewhere) {
        // El producto quedó inyectado en al menos un listado cacheado; no es
        // necesario tocar la DB.
        return
      }
    } catch (err) {
      // Si algo falla al manipular la caché, caemos al refetch de la DB.
      console.error('useCreateProduct: fallo inyectando producto en caché', err)
    }

    // Último recurso: re-consultar a la base de datos si la caché no se pudo
    // actualizar o la validación no confirmó el producto.
    client
      .refetchQueries({
        include: [GET_ALL_PRODUCT_STORE, GET_ALL_CATEGORIES_WITH_PRODUCT]
      })
      .catch((err: unknown) => {
        console.error('useCreateProduct: fallo al refetch de productos', err)
      })
  }

  // Registro del producto
  const handleRegister = async () => {
    const {
      ProPrice,
      ProDescuento,
      ProDescription,
      ProWeight,
      ProHeight,
      ValueDelivery,
      carProId
    } = values ?? {
      ProPrice: 0,
      ProDescuento: 0,
      ProDescription: '',
      ProWeight: '',
      ProHeight: 0,
      ValueDelivery: 0,
      carProId: ''
    }

    if (!carProId && !names) {
      setErrors({
        ...errors,
        carProId: true
      })

      return
    }

    const ProImage = '/images/placeholder-image.webp'
    const pCode = RandomCode(10)

    try {
      // Construcción del input
      const input = {
        idStore: dataStore?.idStore || '',
        ProPrice: check?.desc ? 0 : ProPrice,
        ProDescuento: check?.desc ? 0 : ProDescuento,
        ValueDelivery: check?.desc ? 0 : ValueDelivery,
        ProDescription,
        pName: names,
        manageStock: checkStock,
        pCode,
        carProId,

        // Solo enviar stock cuando manageStock sea true
        ...(checkStock ? { stock } : {}),

        pState: 1,
        sTateLogistic: 1,
        ProStar: 0,
        ProImage,
        ProHeight: Number.parseFloat(ProHeight),
        ProWeight,
        ProOutstanding: check?.desc ? 1 : 0,
        ProDelivery: check?.desc ? 1 : 0
      }

      const response = await updateProductFoods({
        variables: {
          input
        }

        // update (cache) {
        //   cache.modify({
        //     fields: {
        //       productFoodsAll (dataOld = []) {
        //         return cache.writeQuery({
        //           query: GET_ALL_FOOD_PRODUCTS,
        //           data: dataOld
        //         })
        //       }
        //     }
        //   })
        // }
      })

      const { data } = response

      const {
        updateProductFoods: dataResponse
      } = data

      const {
        success,
        data: productData
      } = dataResponse

      const { pId } = productData

      if (success) {
        // Asociamos el tag seleccionado al producto recién creado. El tag ya
        // existe (lo trae la lista de tags guardados), así que solo enlazamos su
        // tgId al producto; el backend actualiza la FK tgId del producto y el
        // campo getOneTags del producto pasa a devolver ese tag.
        const selectedTagId = tags?.id
        if (selectedTagId && pId) {
          await handleRegisterTagToProduct({
            pId,
            tgId: selectedTagId
          })
        }

        // Inyecta el producto recién creado en la caché de Apollo para que
        // los listados (productFoodsAll y getCatProductsWithProduct) lo
        // muestren de inmediato sin tener que volver a consultar el servidor.
        injectNewProductIntoCache({
          productData,
          formValues: {
            ProPrice: check?.desc ? 0 : ProPrice,
            ProDescuento: check?.desc ? 0 : ProDescuento,
            ValueDelivery: check?.desc ? 0 : ValueDelivery,
            ProDescription,
            ProWeight,
            ProHeight: Number.parseFloat(ProHeight) || 0,
            stock: checkStock ? stock : 0,
            manageStock: checkStock,
            carProId,
            pName: names,
            ProImage,
            ProOutstanding: check?.desc ? 1 : 0,
            ProDelivery: check?.desc ? 1 : 0
          }
        })
      }

      const { errors } = response?.data?.updateProductFoods ?? {
        errors: []
      }

      if (errors?.length > 0) {
        errors.forEach((error: { message: string }) => {
          sendNotification?.({
            backgroundColor: 'error',
            title: 'Error',
            description: error.message
          })
        })
      }

      // Actualizar imagen
      if (image !== null) {
        try {
          if (typeof updateImageProducts === 'function') {
            await updateImageProducts({
              pId: response?.data?.updateProductFoods?.data?.pId,
              image: image as string
            })
          }
        } catch {
          sendNotification?.({
            backgroundColor: 'error',
            title: `Ocurrió un error en la imagen en el producto ${names}`,
            description: 'error'
          })
        }
      }

      setPid(
        response?.data?.updateProductFoods?.data?.pId ?? null
      )

      // eslint-disable-next-line
      return response

    } catch (error) {
      if (error instanceof Error) {
        sendNotification?.({
          backgroundColor: 'error',
          title: 'Error',
          description: error.message
        })
      }

      setAlertBox({
        message: 'Ha ocurrido un error',
        duration: 7000
      })
    }
  }

  // Manejo de etiquetas
  const changeHandler = (name: string, value: any) => {
    if (name === 'tags') {
      setTags(value)

      if (value.length > 0 && errors.tags) {
        setErrors(prev => ({
          ...prev,
          tags: false
        }))
      }
    }
  }

  return {
    errors,
    src,
    names,
    setName,
    alt,
    showMore,
    success: true,
    fileInputRef,
    values,
    search,
    stock,
    pId,
    dataTags: data,
    tags,
    checkStock,
    loading,
    active,
    idStore: dataStore?.getStore?.idStore || '',
    arrTags,
    newTags,
    setNewTags,
    setPid,
    handleChange,
    onClickClear,
    handleChangeClick,
    handleChangeFilter,
    handleUpdateBanner,
    onClickSearch,
    handleDecreaseStock,
    handleIncreaseStock,
    changeHandler,
    setErrors,
    setCheck,
    handleRegister,
    setActive,
    STEPS,
    handleRegisterTags,
    setShowMore,
    handleCheckStock,
    onTargetClick,
    handleAddTag,
    handleClearSelectedTag,
    handleAddDraftTag,
    handleRemoveDraftTag,
    handleRegisterDraftTags,
    loadingRegisterTags,
    handleRemoveTag,
    handleCheck,
    handleCheckFreeShipping,
    check
  }
}