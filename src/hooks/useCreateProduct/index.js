/* eslint-disable no-unused-vars */
import { useMutation } from '@apollo/client'
import { useRef, useState } from 'react'
import { convertBase64, RandomCode } from '../../utils'
import { useLocalStorage } from '../useLocalSorage'
import {
  GET_ALL_FOOD_PRODUCTS,
  UPDATE_IMAGE_PRODUCT_FOOD,
  UPDATE_PRODUCT_FOOD
} from '../useProductsFood/queriesStore'
import { useStore } from '../useStore'
import { useTagsProducts } from './../useProductsFood/usetagsProducts'
import { useEditImageProduct } from './helpers/useEditImageProduct'
import { getCatProductsWithProduct } from './helpers/manageCacheDataCatProduct'
import { assignWith } from 'lodash'
export * from './helpers'

export const useCreateProduct = ({
  router,
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
  const [names, setName] = useLocalStorage('namefood', '')
  const [showMore, setShowMore] = useState(50)
  const [search, setSearch] = useState('')
  const [imageBase64, setImageBase64] = useState(null)
  const [active, setActive] = useState(0)
  const [pId, setPid] = useState(null)

  const [searchFilter, setSearchFilter] = useState({ gender: [], desc: [], speciality: [] })
  const [filter, setFilter] = useState({ gender: [], desc: [], speciality: [] })
  const initialState = { alt: '/ images/DEFAULTBANNER.png', src: '/images/DEFAULTBANNER.png' }
  const [image, setImage] = useState(null)
  const [{ alt, src }, setPreviewImg] = useState(initialState)
  const fileInputRef = useRef(null)
  const [arrTags, setTags] = useState([])
  const [stock, setStock] = useState(1)
  // Manage stock optional value boolean
  const [checkStock, setCheckStock] = useState(false)

  const handleIncreaseStock = () => {
    setStock(prevStock => prevStock + 1)
  }

  const handleDecreaseStock = () => {
    setStock(prevStock => (prevStock > 1 ? prevStock - 1 : 1))
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
    handleRegister: handleRegisterTags,
    handleAddTag
  } = useTagsProducts()

  // HANDLESS
  const [check, setCheck] = useState({
    availability: true,
    noAvailability: false,
    desc: false,
    freeShipping: false
  })

  const handleCheck = (e) => {
    const { name, checked } = e.target
    return setCheck((prev) => ({ ...prev, [name]: checked }))
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
    setValues({ ...values, [e.target.name]: e.target.value })
    setErrors({ ...errors, [e.target.name]: error })
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
  const handleCheckFreeShipping = e => {
    handleCheck(e)
    setValues({
      ...values,
      ValueDelivery: 0
    })
  }

  const [updateProductFoods, { loading }] = useMutation(UPDATE_PRODUCT_FOOD, {
  })
  const [setImageProducts] = useMutation(UPDATE_IMAGE_PRODUCT_FOOD, {
    context: { clientName: 'admin-server' }
  })

  const onFileInputChange = async event => {
    const { files } = event.target

    const file = event.target.files[0]
    setImage(file)
    const base64 = await convertBase64(file)
    // const [size, { unit }] = await getFileSizeByUnit(file, "B");
    setImageBase64(base64)
    setPreviewImg(
      files.length
        ? {
            src: URL.createObjectURL(files[0]),
            alt: files[0].name
          }
        : initialState
    )
  }
  const onTargetClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }
  // eslint-disable-next-line no-unused-vars
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
    const formatPrice = ProPrice ?? 0
    if (!carProId && !names) return setErrors({ ...errors, carProId: true })
    const ProImage = `https:${process.env.URL_ADMIN_SERVER}/static/platos/${image?.name}`
    const pCode = RandomCode(9)
    try {
      const res = await updateProductFoods({
        variables: {
          input: {
            idStore: dataStore?.getStore?.idStore || '',
            ProPrice: check?.desc ? 0 : formatPrice,
            ProDescuento: check?.desc ? 0 : ProDescuento,
            ValueDelivery: check?.desc ? 0 : ValueDelivery,
            ProDescription,
            pName: names,
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
        },
        update (cache) {
          cache.modify({
            fields: {
              productFoodsAll (dataOld = []) {
                return cache.writeQuery({ query: GET_ALL_FOOD_PRODUCTS, data: dataOld })
              },
              getCatProductsWithProduct () {
                const updatedData = getCatProductsWithProduct(data, carProId)
                return updatedData
              }
            }
          })
        }
      }).finally(() => {
        setValues({
          ProPrice: 0,
          ProDescuento: 0,
          ProDescription: '',
          ProWeight: '',
          ProHeight: '',
          ValueDelivery: 0,
          carProId: ''
        })
      })
      const { errors } = res ?? {
        errors: []
      }
      if (errors?.length > 0) {
        errors.forEach(error => {
          sendNotification({
            backgroundColor: 'error',
            title: 'Error',
            description: error.message
          })
        })
        return
      }
      if (image !== null) {
        try {
          await setImageProducts({
            variables: {
              input: {
                file: image,
                pCode
              }
            }
          })
        } catch {
          sendNotification({
            backgroundColor: 'error',
            title: `Ocurrió un error en la imagen en el producto ${names}`,
            description: 'error'
          })
        }
      }
      setPid(res?.data?.updateProductFoods?.data?.pId ?? null)
      return res
    } catch (error) {
      console.log('🚀 ~ handleRegister ~ error:', error)
      setAlertBox({ message: 'Ha ocurrido un error', duration: 7000 })
    }
  }

  // Manage tags
  const changeHandler = (name, value) => {
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
    onFileInputChange,
    handleRegisterTags,
    setShowMore,
    handleCheckStock,
    onTargetClick,
    handleAddTag,
    handleCheck,
    handleCheckFreeShipping,
    check
  }
}
