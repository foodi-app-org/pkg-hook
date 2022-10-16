import { useMutation } from '@apollo/client';
import {
    useRef,
    useState
} from 'react';
import {
    CREATE_BANNER_STORE,
    CREATE_LOGO,
    DELETE_ONE_BANNER_STORE,
    DELETE_ONE_LOGO_STORE,
    GET_ONE_BANNER_STORE
} from '../useProductsFood/queriesStore';
import { GET_ONE_STORE } from '../useStore/queries';

export const useImageStore = (idStore) => {
    // STATES
    const fileInputRef = useRef(null)
    const [{ altLogo, srcLogo }, setPreviewImgLogo] = useState({})
    const initialState = { alt: '/images/DEFAULTBANNER.png', src: '/images/DEFAULTBANNER.png' }
    const [{ alt, src }, setPreviewImg] = useState(initialState)
    const fileInputRefLogo = useRef(null)
    // HOOKS
    const [registerBanner] = useMutation(CREATE_BANNER_STORE, {
        onCompleted: (data) => { return console.log({ message: data?.registerBanner?.message }) },
        context: { clientName: 'admin-server' }
    })
    const [setALogoStore] = useMutation(CREATE_LOGO, {
    onCompleted: (data) => { return console.log({ message: data?.setALogoStore?.message }) },
    context: { clientName: 'admin-server' }
    })
    const [DeleteOneBanner] = useMutation(DELETE_ONE_BANNER_STORE, {
        onCompleted: (data) => { return console.log({ message: data?.DeleteOneBanner?.message }) },
        context: { clientName: 'admin-server' }
    })
    const [deleteALogoStore] = useMutation(DELETE_ONE_LOGO_STORE, {
        onCompleted: (data) => {
        console.log({
            message: data.deleteALogoStore.message
        })
        setPreviewImgLogo(initialState)
        },
        context: { clientName: 'admin-server' },
        update(cache) {
        cache.modify({
            fields: {
            getStore(dataOld = []) {
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
            Image: ImageName || null
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
                idStore: idStore
              }
            }, update(cache) {
              cache.modify({
                fields: {
                  getOneBanners(dataOld = []) {
                    return cache.writeQuery({ query: GET_ONE_BANNER_STORE, data: dataOld })
                  }
                }
              })
            }
          }).catch(() => {
            console.log({ message: 'No pudimos cargar la imagen', duration: 7000 })
            setPreviewImg(initialState)
          })
    
        } catch {
          setPreviewImg(initialState)
          console.log({ message: 'No pudimos cargar la imagen', duration: 7000 })
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
            idStore: idStore
          }, update(cache) {
            cache.modify({
              fields: {
                getStore(dataOld = []) {
                  return cache.writeQuery({ query: GET_ONE_STORE, data: dataOld })
                }
              }
            })
          }
        }).catch(() => {
          console.log({ message: 'No pudimos cargar el banner', duration: 7000 })
          setPreviewImgLogo(initialState)
        })
      }
      const HandleDeleteBanner = async () => {
        setPreviewImg(initialState)
        DeleteOneBanner({
          variables: {
            bnState: bnState,
            bnImageFileName: bnImageFileName,
            idStore,
            bnId
          }, update(cache) {
            cache.modify({
              fields: {
                getOneBanners(dataOld = []) {
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
    onTargetClick,
    onTargetClickLogo,
    HandleDeleteBanner,
    handleInputChangeLogo,
    handleUpdateBanner
  }
}

