import { useMutation } from '@apollo/client';
import {
  useRef,
  useCallback,
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
/**
 * Custom hook to handle image upload and management for a store's banner and logo.
 * @typedef {Object} ImageStoreHookResult
 * @property {React.RefObject} fileInputRefLogo - Reference to the logo file input element.
 * @property {string} src - Source URL of the store's banner image.
 * @property {string} alt - Alternate text for the store's banner image.
 * @property {Object} initialState - Initial state for the store's banner image.
 * @property {string} srcLogo - Source URL of the store's logo image.
 * @property {string} altLogo - Alternate text for the store's logo image.
 * @property {React.RefObject} fileInputRef - Reference to the banner file input element.
 * @property {function} handleDeleteLogo - Callback function to handle logo deletion.
 * @property {function} onTargetClick - Callback function to trigger banner file input click.
 * @property {function} onTargetClickLogo - Callback function to trigger logo file input click.
 * @property {function} HandleDeleteBanner - Callback function to handle banner deletion.
 * @property {function} handleInputChangeLogo - Callback function to handle logo file input change.
 * @property {function} handleUpdateBanner - Callback function to handle banner file input change.
 * @param {Object} options - Options for the hook.
 * @param {string} options.idStore - ID of the store.
 * @param {Function} options.sendNotification - Function to send a notification (optional).
 * @returns {ImageStoreHookResult} Object containing image handling functions and state.
 */
export const useImageStore = ({ idStore, sendNotification = () => {} } = {}) => {
  // STATES
  const fileInputRef = useRef(null);
  const [{ altLogo, srcLogo }, setPreviewImgLogo] = useState({});
  const initialState = { alt: '/images/DEFAULTBANNER.png', src: '/images/DEFAULTBANNER.png' };
  const [{ alt, src }, setPreviewImg] = useState(initialState);
  const fileInputRefLogo = useRef(null);
  // HOOKS
  const [registerBanner] = useMutation(CREATE_BANNER_STORE, {
    onCompleted: (data) => console.log({ message: data?.registerBanner?.message }),
    context: { clientName: 'admin-server' },
  });
  const [setALogoStore] = useMutation(CREATE_LOGO, {
    onCompleted: (data) => console.log({ message: data?.setALogoStore?.message }),
    context: { clientName: 'admin-server' },
  });
  const [DeleteOneBanner] = useMutation(DELETE_ONE_BANNER_STORE, {
    onCompleted: (data) => console.log({ message: data?.DeleteOneBanner?.message }),
    context: { clientName: 'admin-server' },
  });
  const [deleteALogoStore] = useMutation(DELETE_ONE_LOGO_STORE, {
    onCompleted: (data) => {
      console.log({ message: data.deleteALogoStore.message });
      setPreviewImgLogo(initialState);
    },
    context: { clientName: 'admin-server' },
    update(cache) {
      cache.modify({
        fields: {
          getStore(dataOld = []) {
            return cache.writeQuery({ query: GET_ONE_STORE, data: dataOld });
          },
        },
      });
    },
  });

  // HANDLESS
  const handleDeleteLogo = useCallback(() => {
    return deleteALogoStore({
      variables: {
        Image: ImageName || null,
      },
    });
  }, [deleteALogoStore]);

  const handleUpdateBanner = useCallback(
    (event) => {
      try {
        const { files } = event.target;
        setPreviewImg(
          files.length
            ? {
                src: URL.createObjectURL(files[0]),
                alt: files[0].name,
              }
            : initialState
        );
        registerBanner({
          variables: {
            input: {
              bnImage: files[0],
              idStore: idStore,
            },
          },
          update(cache) {
            cache.modify({
              fields: {
                getOneBanners(dataOld = []) {
                  return cache.writeQuery({ query: GET_ONE_BANNER_STORE, data: dataOld });
                },
              },
            });
          },
        }).catch(() => {
          sendNotification({
            title: 'No pudimos cargar la imagen',
            description: 'Error',
            backgroundColor: 'error',
          });
          setPreviewImg(initialState);
        });
      } catch {
        setPreviewImg(initialState);
        sendNotification({
          title: 'No pudimos cargar la imagen',
          description: 'Error',
          backgroundColor: 'error',
        });
      }
    },
    [setPreviewImg, initialState, sendNotification, idStore, registerBanner]
  );

  const handleInputChangeLogo = useCallback(
    (event) => {
      const { files } = event.target;
      setPreviewImgLogo(
        files.length
          ? {
              srcLogo: URL.createObjectURL(files[0]),
              altLogo: files[0].name,
            }
          : initialState
      );
      setALogoStore({
        variables: {
          logo: files[0],
          idStore: idStore,
        },
        update(cache) {
          cache.modify({
            fields: {
              getStore(dataOld = []) {
                return cache.writeQuery({ query: GET_ONE_STORE, data: dataOld });
              },
            },
          });
        },
      }).catch(() => {
        sendNotification({
          title: 'No pudimos cargar la imagen',
          description: 'Error',
          backgroundColor: 'error',
        });
        setPreviewImgLogo(initialState);
      });
    },
    [setPreviewImgLogo, initialState, idStore, setALogoStore]
  );

  const HandleDeleteBanner = useCallback(async () => {
    setPreviewImg(initialState);
    DeleteOneBanner({
      variables: {
        bnState: bnState, // You should provide bnState and bnImageFileName
        bnImageFileName: bnImageFileName,
        idStore,
        bnId,
      },
      update(cache) {
        cache.modify({
          fields: {
            getOneBanners(dataOld = []) {
              return cache.writeQuery({ query: GET_ONE_BANNER_STORE, data: dataOld });
            },
          },
        });
      },
    }).then(() => {
      setPreviewImg(initialState);
    });
  }, [setPreviewImg, initialState, DeleteOneBanner]);

  const onTargetClickLogo = useCallback((e) => {
    e.preventDefault();
    fileInputRefLogo.current.click();
  }, []);

  const onTargetClick = useCallback((e) => {
    e.preventDefault();
    fileInputRef.current.click();
  }, []);

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
    handleUpdateBanner,
  };
};
