import { gql, useApolloClient, useMutation } from '@apollo/client'
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

/**
 * Fragment used to write a newly created ProductFood into Apollo's normalized
 * cache. Includes every field that either `productFoodsAll` (flat list) or the
 * nested `productFoodsAll` inside `getCatProductsWithProduct` might request,
 * so both queries can read the cached entity without cache misses.
 */
const NEW_PRODUCT_FRAGMENT = gql`
  fragment NewProductFood on ProductFood {
    pId
    sizeId
    colorId
    stock
    manageStock
    carProId
    caId
    cId
    dId
    ctId
    fId
    idStore
    pName
    getOneTags {
      tgId
      idUser
      idStore
      pId
      nameTag
    }
    ProPrice
    ProDescuento
    free
    ProUniDisponibles
    ProDescription
    ProProtegido
    ProAssurance
    ValueDelivery
    ProStar
    sTateLogistic
    ProImage
    ProWidth
    ProHeight
    ProLength
    ProWeight
    ProQuantity
    ProOutstanding
    createdAt
    updatedAt
    ProDelivery
    ProVoltaje
    pState
    feat {
      fId
      thpId
      hpqrQuestion
    }
    area {
      aId
      aName
    }
    product_availables {
      availableProductId
      pId
      idStore
      dayAvailable
      startDate
      endDate
      createdAt
      updatedAt
    }
  }
`

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
    handleAddTag
  } = useTagsProducts({ sendNotification })

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
   * Inyecta un producto recién creado en la caché normalizada de Apollo.
   *
   * Estrategia (en orden):
   *  1. Escribe la entidad ProductFood con writeFragment (normalización).
   *  2. Mediante cache.modify agrega la referencia al inicio de cada
   *     `productFoodsAll` ya cacheada (listado plano) y, si corresponde, al
   *     `productFoodsAll` anidado de su categoría en getCatProductsWithProduct.
   *  3. Valida que el producto quede visible leyendo la caché. Si no quedó
   *     (por ejemplo porque las queries aún no estaban cacheadas), hace un
   *     refetch a la base de datos como último recurso.
   *
   * @param params.productData - Datos del producto devueltos por la mutación.
   * @param root0
   * @param root0.productData
   * @param params.formValues  - Valores del formulario para completar campos
   *                             que la mutación no retorna (stock, imagen, etc.).
   * @param root0.formValues
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

    // Entidad completa que satisface tanto productFoodsAll (lista plana) como
    // el productFoodsAll anidado dentro de getCatProductsWithProduct.
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
      // 1. Escribe/normaliza la entidad en la caché.
      const productId = client.cache.identify(newProduct)

      client.writeFragment({
        id: productId,
        fragment: NEW_PRODUCT_FRAGMENT,
        data: newProduct
      })

      const newRef = { __ref: productId }

      // 2a. Agrega la referencia a cada campo productFoodsAll cacheado
      //     (el listado plano de GET_ALL_PRODUCT_STORE).
      client.cache.modify({
        fields: {
          productFoodsAll (existing: any, { readField }: any) {
            // Caso lista plana: { success, message, pagination, data: [...] }
            if (existing && Array.isArray(existing?.data)) {
              const alreadyExists = existing.data.some(
                (ref: any) => readField('pId', ref) === pId
              )
              if (alreadyExists) return existing

              const prevPagination = existing?.pagination ?? {}
              const prevTotal = Number(prevPagination?.totalRecords ?? existing.data.length) || 0

              return {
                ...existing,
                data: [newRef, ...existing.data],
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

      // 2b. Agrega la referencia al productFoodsAll anidado de la categoría
      //     correspondiente dentro de getCatProductsWithProduct.
      client.cache.modify({
        fields: {
          getCatProductsWithProduct (existing: any, { readField }: any) {
            const list = existing?.catProductsWithProduct
            if (!Array.isArray(list) || list.length === 0) return existing

            const updatedList = list.map((catRef: any) => {
              if (!carProId) return catRef
              if (readField('carProId', catRef) !== carProId) return catRef

              const nested = readField('productFoodsAll', catRef)
              const nestedArr = Array.isArray(nested) ? nested : []

              const alreadyExists = nestedArr.some(
                (ref: any) => readField('pId', ref) === pId
              )
              if (alreadyExists) return catRef

              client.cache.modify({
                id: client.cache.identify(catRef as any),
                fields: {
                  productFoodsAll (nestedExisting: any = []) {
                    const arr = Array.isArray(nestedExisting) ? nestedExisting : []
                    return [newRef, ...arr]
                  }
                }
              })

              return catRef
            })

            return {
              ...existing,
              catProductsWithProduct: updatedList
            }
          }
        }
      })

      // 3. Validación: confirmar que el producto quedó en la caché.
      const cachedEntity = client.readFragment({
        id: productId,
        fragment: NEW_PRODUCT_FRAGMENT
      })

      if (cachedEntity) {
        // El producto quedó inyectado correctamente; no es necesario tocar la DB.
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
        handleRegisterTags({
          pId,
          idUser: dataStore?.idUser || '',
          idStore: dataStore?.idStore || '',
          nameTag: tags?.tag ?? ''
        })

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
    handleRemoveTag,
    handleCheck,
    handleCheckFreeShipping,
    check
  }
}