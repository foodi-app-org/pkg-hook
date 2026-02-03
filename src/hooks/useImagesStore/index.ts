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

import type { SendNotificationFn } from 'typesdefs'
export * from './queries'

type UseImageStoreProps = {
  idStore?: string
  sendNotification?: SendNotificationFn
}

export const useImageStore = ({
  idStore,
  sendNotification = () => {}
}: UseImageStoreProps = {}) => {
  // STATES
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const initialState = { alt: '/images/DEFAULTBANNER.png', src: '/images/DEFAULTBANNER.png' }
  const initialStateLogo = { altLogo: '/images/DEFAULTLOGO.png', srcLogo: '/images/DEFAULTLOGO.png' }
  const [{ altLogo, srcLogo }, setPreviewImgLogo] = useState(initialStateLogo)
  const [{ alt, src }, setPreviewImg] = useState(initialState)
  const fileInputRefLogo = useRef<HTMLInputElement | null>(null)

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
        title: success ? 'Logo creado con éxito' : color.error,
        description: message,
        backgroundColor: success ? color.success : color.error
      })
    }
  })
  const [deleteOneBanner] = useMutation(DELETE_ONE_BANNER_STORE, {
    onCompleted: (data) => {
      const { deleteOneBanner } = data || {}
      const { message = '', success = false } = deleteOneBanner || {}
      sendNotification({
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

  const handleUpdateBanner = (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const { files } = event.target
      setPreviewImg(
        files && files.length
          ? {
            src: URL.createObjectURL(files[0]),
            alt: files[0].name
          }
          : initialState
      )
      if (files && files.length) {
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
      }
    } catch {
      setPreviewImg(initialState)
    }
  }
  /**
   * Handle store logo upload and update cache Image field
   * @param event
   */
  const handleInputChangeLogo = async (event: React.ChangeEvent<HTMLInputElement>) => {
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
    setPreviewImg(initialState)
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
  const onTargetClickLogo = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    if (fileInputRefLogo.current) {
      fileInputRefLogo.current.click()
    }
  }
  const onTargetClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
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
