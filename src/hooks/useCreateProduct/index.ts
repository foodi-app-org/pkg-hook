 
import { useMutation } from '@apollo/client'
import { useRef, useState } from 'react'

import { RandomCode } from '../../utils'
import { useLocalStorage } from '../useLocalSorage'
import {
  UPDATE_PRODUCT_FOOD
} from '../useProductsFood/queriesStore'
import { useTagsProducts } from '../useProductsFood/usetagsProducts'
import { useSetImageProducts } from '../useSetImageProducts'
import { useStore } from '../useStore'

// import { getCatProductsWithProduct } from './helpers/manageCacheDataCatProduct'
import { useEditImageProduct } from './helpers/useEditImageProduct'


export const useCreateProduct = ({
  router,
  image,
  setAlertBox = (args) => { return args },
  sendNotification = (args) => { return args }
}) => {
  const [errors, setErrors] = useState({
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
    DISPONIBILITY: 3
  })

  const [updateImageProducts] = useSetImageProducts()
  const [names, setName] = useLocalStorage('namefood', '')
  const [showMore, setShowMore] = useState(50)
  const [search, setSearch] = useState('')
  const [active, setActive] = useState(STEPS.PRODUCT)
  const [pId, setPid] = useState<string | null>(null)

  const [searchFilter, setSearchFilter] = useState({ gender: [], desc: [], speciality: [] })
  const [filter, setFilter] = useState({ gender: [], desc: [], speciality: [] })
  const initialState = { alt: '/ images/DEFAULTBANNER.png', src: '/images/DEFAULTBANNER.png' }
  const [{ alt, src }, setPreviewImg] = useState(initialState)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [arrTags, setTags] = useState<string[]>([])
  const [stock, setStock] = useState(1)
  // Manage stock optional value boolean
  const [checkStock, setCheckStock] = useState(false)

  const handleIncreaseStock = () => {
    setStock(prevStock => {return prevStock + 1})
  }

  const handleDecreaseStock = () => {
    setStock(prevStock => {return (prevStock > 1 ? prevStock - 1 : 1)})
  }

  const handleCheckStock = () => {
    setCheckStock(prev => {
      const newCheckStock = !prev
      setStock(newCheckStock ? 1 : stock)
      return newCheckStock
    })
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

  // HANDLESS
  const [check, setCheck] = useState({
    availability: true,
    noAvailability: false,
    desc: false,
    freeShipping: false
  })

  const handleCheck = (e) => {
    const { name, checked } = e.target
    return setCheck((prev) => {return { ...prev, [name]: checked }})
  }

  const handleUpdateBanner = event => {
    const { files } = event.target
    setPreviewImg(
      files.length
        ? {
          src: URL.createObjectURL(files[0]),
          alt: files[0].name
        }
        : initialState
    )
  }
  const handleChange = (e, error) => {
    const { name, value } = e.target
    setValues((prev) => {return {
      ...prev,
      [name]: value
    }})

    setErrors((prev) => {return {
      ...prev,
      [name]: error
    }})
  }
  const handleChangeFilter = e => {
    setSearch(e.target.value)
  }
  const onClickSearch = () => {
    setSearchFilter({ ...filter })
  }
  const onClickClear = () => {
    setSearchFilter({
      gender: [],
      desc: [],
      speciality: []
    })
  }
  const handleChangeClick = e => {
    const {
      name,
      value,
      checked
    } = e.target
    !checked
      ? setFilter(s => { return { ...s, [name]: s[name].filter(f => { return f !== value }) } })
      : setFilter({ ...filter, [name]: [...filter[name], value] })
    setSearchFilter({ ...filter })
  }
  const handleCheckFreeShipping = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleCheck(e)
    setValues({
      ...values,
      ValueDelivery: 0
    })
  }

  const [updateProductFoods, { loading }] = useMutation(UPDATE_PRODUCT_FOOD, {
  })

  const onTargetClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }
   
  const { img } = useEditImageProduct({ sendNotification, initialState })

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
    if (!carProId && !names) return setErrors({ ...errors, carProId: true })
    const ProImage = '/images/placeholder-image.webp'
    const pCode = RandomCode(10)
    try {
      const response = await updateProductFoods({
        variables: {
          input: {
            idStore: dataStore?.getStore?.idStore || '',
            ProPrice: check?.desc ? 0 : ProPrice,
            ProDescuento: check?.desc ? 0 : ProDescuento,
            ValueDelivery: check?.desc ? 0 : ValueDelivery,
            ProDescription,
            pName: names,
            manageStock: checkStock,
            pCode,
            carProId,
            stock,
            pState: 1,
            sTateLogistic: 1,
            ProStar: 0,
            ProImage,
            ProHeight: parseFloat(ProHeight),
            ProWeight,
            ProOutstanding: check?.desc ? 1 : 0,
            ProDelivery: check?.desc ? 1 : 0
          }
        }
        // update (cache) {
        //   cache.modify({
        //     fields: {
        //       productFoodsAll (dataOld = []) {
        //         return cache.writeQuery({ query: GET_ALL_FOOD_PRODUCTS, data: dataOld })
        //       }
        //       // getCatProductsWithProduct () {
        //       //   const updatedData = getCatProductsWithProduct(data, carProId)
        //       //   return updatedData
        //       // }
        //     }
        //   })
        // }
      })
      const { data } = response
      const { updateProductFoods: dataResponse } = data
      const { success, data: productData } = dataResponse
      const { pId } = productData
      if (success) {
        handleRegisterTags({
          pId,
          nameTag: tags?.tag ?? null
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
      if (image !== null) {
        try {
          await updateImageProducts({
            pId: response?.data?.updateProductFoods?.data?.pId,
            image
          })
        } catch {
          sendNotification?.({
            backgroundColor: 'error',
            title: `Ocurrió un error en la imagen en el producto ${names}`,
            description: 'error'
          })
        }
      }
      setPid(response?.data?.updateProductFoods?.data?.pId ?? null)
      return response
    } catch (error) {
      if (error instanceof Error) {
        sendNotification?.({
          backgroundColor: 'error',
          title: 'Error',
          description: error.message
        })
      }
      setAlertBox({ message: 'Ha ocurrido un error', duration: 7000 })
    }
  }

  // Manage tags
  const changeHandler = (name: string, value: any) => {
    if (name === 'tags') {
      setTags(value)
      if (value.length > 0 && errors.tags) {
        setErrors(prev => {
          const prevErrors = { ...prev }
          delete prevErrors.tags
          return prevErrors
        })
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
