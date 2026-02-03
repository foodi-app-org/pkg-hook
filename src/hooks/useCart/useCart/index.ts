import { useMutation } from '@apollo/client'
import { useState, useCallback, useEffect } from 'react'

import { RandomCode, updateCacheMod, numberFormat } from '../../../utils'
import { useGetExtProductFoodsSubOptionalAll } from '../../useGetExtProductFoodsSubOptionalAll'
import { useManageQueryParams } from '../../useManageQueryParams'
import { useExtProductFoodsAll, useGetOneProductsFood } from '../../useProductsFood'
import { CREATE_SHOPPING_CARD, GET_ALL_SHOPPING_CARD } from '../queries'
import { useGetCart } from '../useGetCart'

import {
  filterDataOptional,
  filterExtra,
  validateExtraProducts,
  validateRequirements
} from './helpers'


// Define types for product, extra, optional, etc.
type Extra = {
  exPid: string
  quantity?: number
  extraPrice?: number
  newExtraPrice?: number
  [key: string]: any
}
type SubOptional = {
  opSubExPid: string
  check?: boolean
  [key: string]: any
}
type Optional = {
  code: string
  opExPid: string
  ExtProductFoodsSubOptionalAll: SubOptional[]
  [key: string]: any
}
type Product = {
  pId: string
  [key: string]: any
}
type ShoppingCartItem = {
  productFood?: Product
  salesExtProductFoodOptional?: any[]
  ExtProductFoodsAll?: Extra[]
  comments?: string
  cantProducts?: number
  ShoppingCard?: string
  [key: string]: any
}
type LocationType = {
  push: (props: any, state: any, opts: { shallow: any }) => any
  query: { plato: string }
}
type UseCartProps = {
  location?: LocationType
  openModalProduct?: boolean
  handleMenu?: (number: number) => any
  setOpenModalProduct?: (open: boolean) => any
  setAlertBox?: (args: any) => any
}

export const useCart = ({
  location = {
    push: (props: any, state: any, { shallow }: { shallow: any }) => {
      return { ...props, state, shallow }
    },
    query: {
      plato: ''
    }
  },
  openModalProduct = false,
  handleMenu = (number: number) => { return number },
  setOpenModalProduct = (open: boolean) => { return open },
  setAlertBox = (args: any) => { return args }
}: UseCartProps = {}) => {
  // sub products
  const { handleCleanQuery } = useManageQueryParams({
    location
  })
  const [loadingButton, setLoadingButton] = useState<boolean>(false)
  const [dataOptional, setDataOptional] = useState<Optional[]>([])
  const [dataExtra, setDataExtra] = useState<Extra[]>([])
  const [quantity, setQuantity] = useState<number>(1)
  const [comments, setComments] = useState<string>('')
  const queryParamProduct = location.query.plato
  const [registerShoppingCard] = useMutation(CREATE_SHOPPING_CARD, {
    onError: (error: any) => {
      console.error('Error registering shopping card:', error)
    }
  })
  // CUSTOM HOOKS
  const [dataShoppingCard, { loading }]: [ShoppingCartItem[], { loading: boolean }] = useGetCart()
  const [handleExtProductFoodsAll]: [(pId: string) => Promise<any>] = useExtProductFoodsAll()

  const [ExtProductFoodsSubOptionalAll]: [(args: any) => Promise<any>] = useGetExtProductFoodsSubOptionalAll()
  const [dataOneProduct, setDataOneProduct] = useState<Product | Record<string, any>>({})
  const [handleGetOneProduct,
    {
      loading: loadingProduct
    }
  ] = useGetOneProductsFood({ fetchOnlyProduct: true })

  const getOneProduct = async (food: Product) => {
    const { pId } = food || {}

    if (!pId) return {}
    setOpenModalProduct(true)
    const product = await handleGetOneProduct({ variables: { pId } })
    const productFoodsOne = product?.data?.productFoodsOne || {}
    setDataOneProduct(productFoodsOne)

    const matchingItemInShoppingCart = dataShoppingCard?.find((item: ShoppingCartItem) => {
      return item?.productFood && item?.productFood?.pId === pId
    })
    const matchingItemInShoppingCartOptional = matchingItemInShoppingCart?.salesExtProductFoodOptional || []
    if (matchingItemInShoppingCart && queryParamProduct) {
      setDataOneProduct({
        ...productFoodsOne,
        intoCart: true
      })
      const comments = matchingItemInShoppingCart?.comments
      if (comments) {
        setComments(comments)
      }
      const quantityProduct = matchingItemInShoppingCart?.cantProducts
      setQuantity(typeof quantityProduct === 'number' && quantityProduct > 0 ? quantityProduct : 1)
    }
    const optionalAll = await ExtProductFoodsSubOptionalAll({
      variables: { pId }
    })
    const optionalFetch = optionalAll?.data?.ExtProductFoodsOptionalAll
    const shoppingCartOptionalAll = matchingItemInShoppingCart?.ExtProductFoodsAll || []
    if (Array.isArray(optionalFetch)) {
      // Filtra y procesa los objetos de optionalFetch
      const filteredDataOptional = optionalFetch
        .map((obj: Optional) => {
          const filteredSubOptions = (obj.ExtProductFoodsSubOptionalAll || []).filter(
            (subObj: SubOptional) => subObj.check !== false
          )

          if (filteredSubOptions.length === 0) {
            return null
          }

          return {
            ...obj,
            ExtProductFoodsSubOptionalAll: filteredSubOptions
          }
        })
        .filter(Boolean)

      if (matchingItemInShoppingCartOptional?.length === 0) {
        setDataOptional(filteredDataOptional || [])
      }

      if (matchingItemInShoppingCartOptional?.length) {
        // Actualiza los objetos de filteredDataOptional con información de matchingItemInShoppingCartOptional
        const updateOption = filteredDataOptional?.map((obj: Optional) => {
          const matchingArray = matchingItemInShoppingCartOptional?.find(
            (o: any) => o && o.opExPid === obj.opExPid
          )

          if (!matchingArray) {
            return obj
          }

          // Actualiza las propiedades específicas
          const updatedExtProductFoodsSubOptionalAll = (obj.ExtProductFoodsSubOptionalAll || []).map((subObj: SubOptional) => {
            const newItem = matchingArray.saleExtProductFoodsSubOptionalAll?.find((newItem: any) => newItem && newItem.opSubExPid === subObj.opSubExPid)

            if (newItem) {
              return {
                ...subObj,
                check: true
              }
            }

            return subObj
          })

          return {
            ...obj,
            ExtProductFoodsSubOptionalAll: updatedExtProductFoodsSubOptionalAll
          }
        }).filter(Boolean)

        setDataOptional(updateOption || [])
      }
    }
    if (!pId || pId === '') return {}
    const resultExtra = await handleExtProductFoodsAll(pId)
    const originalArray = resultExtra?.data?.ExtProductFoodsAll

    if (Array.isArray(originalArray) && originalArray?.length) {
      const fetchedDataExtra = originalArray?.map((extra: Extra) => {
        const updatedExtra = shoppingCartOptionalAll?.find((updatedItem: Extra) => updatedItem.exPid === extra.exPid)
        if (updatedExtra) {
          return {
            ...extra,
            quantity: updatedExtra?.quantity || 0,
            newExtraPrice: updatedExtra?.newExtraPrice || 0
          }
        }
        return {
          ...extra,
          quantity: 0
        }
      })

      setDataExtra(fetchedDataExtra)
    }
    return {}
  }

  /**
   * The function `handleIncrementExtra` updates the quantity and price of a specific extra product in
   * an array based on the provided index and product ID.
   * @param root0
   * @param root0.extra
   * @param root0.index
   */
  function handleIncrementExtra ({ extra }: { extra: Extra, index?: number }) {
    const { pId } = dataOneProduct as Product

    const { exPid = null } = extra

    if (exPid && pId) {
      const newExtra = dataExtra.map((producto: Extra) => {
        if (exPid === producto.exPid) {
          const { quantity = 0, extraPrice = 0 } = producto
          const newQuantity = quantity + 1
          const newExtraPrice = extraPrice * newQuantity

          return {
            ...producto,
            quantity: newQuantity,
            newExtraPrice
          }
        }
        return producto
      })

      setDataExtra(newExtra)
    }
  }

  /**
   *
   * @param root0
   * @param root0.extra
   * @param root0.index
   */
  function handleDecrementExtra ({ extra }: { extra: Extra, index?: number }) {
    const { pId } = dataOneProduct as Product

    const { exPid = null } = extra

    const extraIndex = dataExtra.findIndex((item: Extra) => item.exPid === exPid)

    if (pId && exPid && extraIndex !== -1) {
      const newExtra = dataExtra.map((producto: Extra) => {
        if (exPid === producto.exPid) {
          const { quantity = 0, extraPrice = 0 } = producto
          const newQuantity = Math.max(quantity - 1, 0)
          const newExtraPrice = newQuantity === 0 ? extraPrice : extraPrice * newQuantity

          return {
            ...producto,
            quantity: newQuantity,
            newExtraPrice
          }
        }
        return producto
      })

      setDataExtra(newExtra)
    }
  }

  const handleIncrease = () => {
    return setQuantity((prev) => { return prev + 1 })
  }

  const handleDecrease = () => {
    return setQuantity((prev) => { return prev - 1 })
  }

  const handleCountProducts = useCallback((ProPrice: string | number, quantity: string | number) => {
    if (!ProPrice || !quantity) {
      return 0
    }

    const price = Number.parseFloat(ProPrice as string)
    const numericQuantity = Number.parseInt(quantity as string, 10)

    if (Number.isNaN(price) || Number.isNaN(numericQuantity)) {
      return 0
    }

    if (numericQuantity <= 0 || price <= 0) {
      return price
    }

    const totalPrice = Math.abs(numericQuantity * price)
    return numberFormat(totalPrice)
  }, [dataOneProduct])

  const handleAddOptional = ({ exOptional = null, codeCategory = null }: { exOptional?: string | null, codeCategory?: string | null }) => {
    if (!exOptional || !codeCategory) return
    const item = dataOptional.find((item: Optional) => item.code === codeCategory)
    if (!item) return
    const idx = item.ExtProductFoodsSubOptionalAll.findIndex(
      (el: SubOptional) => el.opSubExPid === exOptional
    )
    if (item && idx !== -1) {
      const updatedItem = {
        ...item,
        ExtProductFoodsSubOptionalAll: [
          ...item.ExtProductFoodsSubOptionalAll.slice(0, idx),
          {
            ...item.ExtProductFoodsSubOptionalAll[idx],
            check: !item.ExtProductFoodsSubOptionalAll[idx].check
          },
          ...item.ExtProductFoodsSubOptionalAll.slice(idx + 1)
        ]
      }
      const newData = dataOptional.map((el: Optional) =>
        el.code === codeCategory ? updatedItem : el
      )
      setDataOptional([...newData])
    }
  }

  const isValidDataExtra = (!dataExtra.length && !(dataOneProduct as Product)?.pId) ? false : !validateExtraProducts(dataExtra)

  const isValid = (!dataOptional.length && !(dataOneProduct as Product)?.pId) ? false : validateRequirements(dataOptional)

  const disabled = isValid || isValidDataExtra

  /**
   * Handles the addition of products to the cart.
   * @param food
   */
  const handleAddProducts = async (food: Product) => {
    if (!food) return
    const idStore = (food as any)?.getStore?.idStore
    if (!idStore) {
      return
    }
    setLoadingButton(true)
    const isExistItemInShoppingCart = dataShoppingCard?.find((item: ShoppingCartItem) => {
      return item?.productFood && item?.productFood?.pId === food.pId
    }) ?? null
    if (!isExistItemInShoppingCart) handleMenu(1)
    const filteredDataOptional = filterDataOptional(dataOptional)

    const dataExtraFiltered = filterExtra(dataExtra)

    const refCodePid = RandomCode(20)

    const idShoppingCart = isExistItemInShoppingCart?.ShoppingCard
    try {
      const idStore = (food as any)?.getStore?.idStore
      const response = await registerShoppingCard({
        variables: {
          input: {
            ShoppingCard: idShoppingCart ?? null,
            cState: 1,
            pId: food.pId,
            idStore,
            refCodePid: idShoppingCart ? null : refCodePid,
            comments,
            cName: '',
            cantProducts: quantity,
            csDescription: '',
            dataExtra: dataExtraFiltered || [],
            dataOptional: filteredDataOptional || []
          },
          idSubArray: {
            setID: []
          }
        },
        update: (cache: any, { data }: any) => {
          updateCacheMod({
            cache,
            query: GET_ALL_SHOPPING_CARD,
            nameFun: 'getAllShoppingCard',
            dataNew: data.getAllShoppingCard,
            type: 1
          })
        }
      })

      if (response?.data) {
        if (!idShoppingCart) {
          setAlertBox({ message: 'producto agregado al carrito' })
        }
        if (idShoppingCart) {
          setAlertBox({ message: 'producto actualizado' })
        }
      }
    } catch {
      setAlertBox({ message: 'Ocurrió un error al añadir el producto al carrito' })
    }
    setLoadingButton(false)
  }

  const handleShowModalProduct = () => {
    if (openModalProduct) {
      setDataExtra([])
      setDataOneProduct({})
      setQuantity(1)
      setComments('')
      setDataOptional([])
    }
    if (queryParamProduct && openModalProduct) {
      handleCleanQuery('plato')
    }
    return setOpenModalProduct(!openModalProduct)
  }

  useEffect(() => {
    if (queryParamProduct) {
      const product = { pId: queryParamProduct }
      getOneProduct(product)
    }
  }, [queryParamProduct])

  return {
    quantity,
    disabled,
    comments,
    loading: loadingProduct || loading,
    dataOneProduct,
    loadingButton,
    dataExtra,
    dataOptional,
    setQuantity,
    handleShowModalProduct,
    handleDecrease,
    handleIncrease,
    getOneProduct,
    handleIncrementExtra,
    handleDecrementExtra,
    handleAddOptional,
    setComments,
    handleCountProducts,
    handleAddProducts
  }
}
