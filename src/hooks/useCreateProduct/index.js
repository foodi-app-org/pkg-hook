import { useMutation } from '@apollo/client'
import { useRef, useState } from 'react'
import { convertBase64, RandomCode } from '../../utils'
import useLocalStorage from '../useLocalSorage'
import {
  GET_ALL_FOOD_PRODUCTS,
  UPDATE_IMAGE_PRODUCT_FOOD,
  UPDATE_PRODUCT_FOOD
} from '../useProductsFood/queriesStore'
import { useStore } from '../useStore'
import { useTagsProducts } from './../useProductsFood/usetagsProducts'
import { useEditImageProduct } from './helpers/useEditImageProduct'

export const useCreateProduct = ({
  setAlertBox = () => { },
  router,
  sendNotification = () => { }
}) => {
  const [errors, setErrors] = useState({
    names: ''
  })
  const [values, setValues] = useState({})
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
  })

  const handleCheck = (e) => {
    const { name, checked } = e.target
    return setCheck((prev) =>({ ...prev, [name]: checked }))
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
    setSearchFilter({})
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
    // setCheck(e.target.checked)
    handleCheck(e)
    setValues({
      ...values,
      ValueDelivery: '',
    })
  }

  const [updateProductFoods] = useMutation(UPDATE_PRODUCT_FOOD, {
  })
  const [setImageProducts] = useMutation(UPDATE_IMAGE_PRODUCT_FOOD, {
    context: { clientName: 'admin-server' }
  })

  const onFileInputChange = async event => {
    const { files } = event.target

    const file = event.target.files[0]
    setImage(file)
    const base64 = await convertBase64(file)
    // eslint-disable-next-line
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
    fileInputRef.current.click()
  }
  const { img } = useEditImageProduct({ sendNotification, initialState })
  console.log(values)
  const handleRegister = async () => {
    const {
      ProPrice,
      ProDescuento,
      ProDescription,
      ProWeight,
      ProHeight,
      ValueDelivery,
      carProId
    } = values
    if (!carProId && !names) return setErrors({ ...errors, carProId: true })

    if (!ProPrice?.length > 0) {
      return setErrors({ ...errors, ProPrice: true })
    }
    const ProImage = `${process.env.URL_ADMIN_SERVER}static/platos/${image?.name}`
    const pCode = RandomCode(9)
    const formatPrice = ProPrice ? parseFloat(ProPrice.replace(/\./g, '')) : 0
    try {
      updateProductFoods({
        variables: {
          input: {
            idStore: dataStore?.getStore?.idStore || '',
            ProPrice: check?.desc ? 0 : formatPrice,
            ProDescuento: check?.desc ? 0 : parseInt(ProDescuento),
            ValueDelivery: check?.desc ? 0 : parseFloat(ValueDelivery),
            ProDescription,
            pName: names,
            pCode,
            carProId,
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
              }
            }
          })
        }
      }).then((res) => {
        const { updateProductFoods } = res?.data || {}
        const { pId } = updateProductFoods || {}
        setPid(pId ?? null)
        router.push(
          {
            query: {
              ...router.query,
              food: pId
            }
          },
          undefined,
          { shallow: true }
        )
        sendNotification({
          backgroundColor: 'success',
          title: 'Success',
          description: `El producto ${names} subido con éxito`
        })
        const objTag = {
          aName: tags.tag,
          nameTag: tags.tag,
          pId
        }
        handleRegisterTags(objTag)
        // setValues({})
      }).catch(err => { return sendNotification({
        backgroundColor: 'error',
        title: `${err}`,
        description: 'Error inesperado'
      }) })
      if (image !== null) {
        setImageProducts({
          variables: {
            input: {
              file: image,
              pCode
            }
          }
        }).then((response) => {
        }).catch((error) => {
          sendNotification({
            backgroundColor: 'error',
            title: `Ocurrió un error en la imagen en el producto ${names}`, 
            description: 'error'
          })
        })
      }
    } catch (error) {
      setAlertBox({ message: `${error.message}`, duration: 7000 })
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
    pId,
    dataTags: data,
    tags,
    tags,
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
    changeHandler,
    setErrors,
    handleRegister,
    setActive,
    onFileInputChange,
    handleRegisterTags,
    setShowMore,
    onTargetClick,
    handleAddTag,
    handleCheck,
    handleCheckFreeShipping,
    check
  }
}
