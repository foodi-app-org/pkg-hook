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
import { color } from './utils'
export * from './queries'

export const useImageStore = ({ idStore, sendNotification = () => { } } = {}) => {
  // STATES
  const fileInputRef = useRef(null)
  const initialState = { alt: '/images/DEFAULTBANNER.png', src: '/images/DEFAULTBANNER.png' }
  const initialStateLogo = { altLogo: '/images/DEFAULTLOGO.png', srcLogo: '/images/DEFAULTLOGO.png' }
  const [{ altLogo, srcLogo }, setPreviewImgLogo] = useState(initialStateLogo)
  const [{ alt, src }, setPreviewImg] = useState(initialState)
  const fileInputRefLogo = useRef(null)

  // HOOKS
  const [registerBanner] = useMutation(CREATE_BANNER_STORE, {
    onCompleted: (data) => {
      const { registerBanner } = data || {}
      const { message = '', success = false } = registerBanner || {}
      if (!success) {
        setPreviewImg(initialState)
        return
      }
      sendNotification({
        title: success ? 'Banner subido' : 'Error al subir banner',
        description: message,
        backgroundColor: success ? color.success : color.error
      })
    }

  })
  const [registerLogo] = useMutation(CREATE_LOGO, {
    onCompleted: (data) => {
      const { registerLogo } = data || {}
      const { message = '', success = false } = registerLogo ?? {
        message: 'Error al subir logo',
        success: false,
        data: null
      }
      if (!success) {
        setPreviewImgLogo(initialStateLogo)
        return
      }

      sendNotification({
        title: success ? 'Logo creado con exito' : color.error,
        description: message,
        backgroundColor: success ? color.success : color.error
      })
    }
  })
  const [deleteOneBanner] = useMutation(DELETE_ONE_BANNER_STORE, {
    onCompleted: (data) => {
      const { deleteOneBanner } = data || {}
      const { message = '', success = false } = deleteOneBanner || {}
      return sendNotification({
        title: success ? 'Logo subido' : color.error,
        description: message,
        backgroundColor: success ? color.success : color.error
      })
    }
  })
  const [deleteALogoStore] = useMutation(DELETE_ONE_LOGO_STORE, {
    onCompleted: (data) => {
      const { deleteALogoStore } = data || {}
      const { message = '', success = false } = deleteALogoStore || {}
      sendNotification({
        title: success ? 'Logo Eliminado' : 'Error al eliminar el logo',
        description: message,
        backgroundColor: success ? color.success : color.error
      })
      setPreviewImgLogo(initialStateLogo)
    },
    update (cache) {
      cache.modify({
        fields: {
          getStore (dataOld = {}) {
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
              getStore (dataOld = {}) {
                return cache.writeQuery({ query: GET_ONE_STORE, data: dataOld })
              }
            }
          })
        }
      })
    } catch {
      setPreviewImg(initialState)
    }
  }
  /**
   * Handle store logo upload and update cache Image field
   * @param {React.ChangeEvent<HTMLInputElement>} event - File input change event
   * @returns {void}
   */
  const handleInputChangeLogo = async (event) => {
    const { files } = event.target

    if (!files || files.length === 0) {
      sendNotification({
        title: 'Debes seleccionar un archivo',
        description: color.error,
        backgroundColor: color.error
      })
      return
    }

    const file = files[0]

    const result = await registerLogo({
      variables: { logo: file, idStore }
    })
    const {
      data: {
        registerLogo: {
          success = false,
          data: url = ''
        } = {}
      } = {}
    } = result ?? {
      data: '',
      success: false,
      message: ''
    }
    if (!success) {
      setPreviewImgLogo(initialStateLogo)
      return
    }
    setPreviewImgLogo({
      srcLogo: URL.createObjectURL(file),
      altLogo: url
    })
  }

  const HandleDeleteBanner = async () => {
    setPreviewImg(initialStateLogo)
    deleteOneBanner({
      variables: {
        idStore
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
    setPreviewImgLogo,
    setPreviewImg,
    onTargetClick,
    onTargetClickLogo,
    HandleDeleteBanner,
    handleInputChangeLogo,
    handleUpdateBanner
  }
}
