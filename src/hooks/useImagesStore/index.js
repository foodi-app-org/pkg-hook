import { useMutation } from '@apollo/client'
import {
  useRef,
  useState
} from 'react'
import {
  CREATE_BANNER_STORE,
  CREATE_LOGO,
  DELETE_ONE_BANNER_STORE,
  DELETE_ONE_LOGO_STORE,
  GET_ONE_BANNER_STORE
} from '../useProductsFood/queriesStore'
import { GET_ONE_STORE } from '../useStore/queries'
import { useLogout } from '../useLogout/index'
import { t } from '../../config/content'
export { GET_MIN_PEDIDO } from './queries'
export * from './queries'

export const useImageStore = ({ idStore, sendNotification = () => { } } = {}) => {
  // STATES
  const fileInputRef = useRef(null)
  const [{ altLogo, srcLogo }, setPreviewImgLogo] = useState({})
  const initialState = { alt: '/images/DEFAULTBANNER.png', src: '/images/DEFAULTBANNER.png' }
  const [{ alt, src }, setPreviewImg] = useState(initialState)
  const fileInputRefLogo = useRef(null)
  const [onClickLogout] = useLogout({})

  // HOOKS
  const [registerBanner] = useMutation(CREATE_BANNER_STORE, {
    onCompleted: (data) => {
      const { message } = data?.registerBanner || {
        message: ''
      }
      if (message === t('SESSION_EXPIRED')) {
        console.log(message)
        onClickLogout()
      }
      sendNotification({ message })
    }
  })
  const [setALogoStore] = useMutation(CREATE_LOGO, {
    onCompleted: (data) => { return sendNotification({ description: data?.setALogoStore?.message }) },
    context: { clientName: 'admin-server' }
  })
  const [deleteOneBanner] = useMutation(DELETE_ONE_BANNER_STORE, {
    onCompleted: (data) => {
      console.log('🚀 ~ useImageStore ~ data:', data)
      return sendNotification({ description: data?.deleteOneBanner?.message })
    }
  })
  const [deleteALogoStore] = useMutation(DELETE_ONE_LOGO_STORE, {
    onCompleted: (data) => {
      sendNotification({
        message: data.deleteALogoStore.message
      })
      setPreviewImgLogo(initialState)
    },
    context: { clientName: 'admin-server' },
    update (cache) {
      cache.modify({
        fields: {
          getStore (dataOld = []) {
            return cache.writeQuery({ query: GET_ONE_STORE, data: dataOld })
          }
        }
      })
    }
  })
  //   HANDLESS
  const handleDeleteLogo = () => {
    return deleteALogoStore({
      variables: {
        Image: ''
      }
    })
  }

  const handleUpdateBanner = event => {
    try {
      const { files } = event.target
      setPreviewImg(
        files.length
          ? {
              src: URL.createObjectURL(files[0]),
              alt: files[0].name
            }
          : initialState
      )
      registerBanner({
        variables: {
          input: {
            bnImage: files[0],
            idStore
          }
        },
        update (cache) {
          cache.modify({
            fields: {
              getOneBanners (dataOld = []) {
                return cache.writeQuery({ query: GET_ONE_BANNER_STORE, data: dataOld })
              }
            }
          })
        }
      }).catch(() => {
        sendNotification({
          title: 'No pudimos cargar la imagen',
          description: 'Error',
          backgroundColor: 'error'
        })
        setPreviewImg(initialState)
      })
    } catch {
      setPreviewImg(initialState)
      sendNotification({
        title: 'No pudimos cargar la imagen',
        description: 'Error',
        backgroundColor: 'error'
      })
    }
  }
  const handleInputChangeLogo = event => {
    const { files } = event.target
    setPreviewImgLogo(
      files.length
        ? {
            srcLogo: URL.createObjectURL(files[0]),
            altLogo: files[0].name
          }
        : initialState
    )
    setALogoStore({
      variables: {
        logo: files[0],
        idStore
      },
      update (cache) {
        cache.modify({
          fields: {
            getStore (dataOld = []) {
              return cache.writeQuery({ query: GET_ONE_STORE, data: dataOld })
            }
          }
        })
      }
    }).catch(() => {
      sendNotification({
        title: 'No pudimos cargar la imagen',
        description: 'Error',
        backgroundColor: 'error'
      })
      setPreviewImgLogo(initialState)
    })
  }
  const HandleDeleteBanner = async () => {
    console.log('delete')
    setPreviewImg(initialState)
    deleteOneBanner({
      variables: {
        idStore
      },
      update (cache) {
        cache.modify({
          fields: {
            getStore (_, { readField }) {
              const store = readField('getStore')
              const updatedCart = {
                ...store,
                bnImage: initialState.src,
                banner: initialState.src
              }
              return updatedCart
            }
          }
        })
      }
    }).then(() => {
      setPreviewImg(initialState)
    })
  }
  const onTargetClickLogo = e => {
    e.preventDefault()
    fileInputRefLogo.current.click()
  }
  const onTargetClick = e => {
    e.preventDefault()
    fileInputRef.current.click()
  }
  return {
    fileInputRefLogo,
    src,
    alt,
    initialState,
    srcLogo,
    altLogo,
    fileInputRef,
    handleDeleteLogo,
    onTargetClick,
    onTargetClickLogo,
    HandleDeleteBanner,
    handleInputChangeLogo,
    handleUpdateBanner
  }
}
