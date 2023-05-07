import { useMutation, useQuery } from '@apollo/client';
import { useState } from 'react';
import { DELETE_ONE_CAT_PRODUCTS, GET_ULTIMATE_CATEGORY_PRODUCTS } from '../useProductsFood/queriesStore';
import { UPDATE_CAT_IN_PRODUCT } from './../useProductsFood/queriesStore';
import { GET_ONE_STORE_IN_CATEGORY } from './queries';

export const useCategoryInStore = ({ catStoreId }) => {
  // STATES
  const [categories, setOneCategoryInStore] = useState([])
  const [deleteCatOfProducts] = useMutation(DELETE_ONE_CAT_PRODUCTS, {
    onError: (e) => {
      setAlertBox({
        message: e.graphQLErrors[0].message,
        color: WColor
      })
    },
    update(cache) {
      cache.modify({
        fields: {
          catProductsAll(dataOld = []) {
            return cache.writeQuery({ query: GET_ULTIMATE_CATEGORY_PRODUCTS, data: dataOld })
          }
        }
      })
    }
  })
  const [updatedCatWithProducts] = useMutation(UPDATE_CAT_IN_PRODUCT, {
    onError: (e) => {
      console.log({
        message: e.graphQLErrors[0].message,
        color: WColor
      })
    },
    update(cache) {
      cache.modify({
        fields: {
          catProductsAll(dataOld = []) {
            return cache.writeQuery({ query: GET_ULTIMATE_CATEGORY_PRODUCTS, data: dataOld })
          }
        }
      })
    }
  })
  // QUERIES
  const { data } = useQuery(GET_ULTIMATE_CATEGORY_PRODUCTS)
  const {
    loading,
    error
  } = useQuery(GET_ONE_STORE_IN_CATEGORY, {
    variables: {
      catStore: catStoreId
    },
    onError: () => {
      console.log({ message: '', duration: 5000 })
    },
    onCompleted: () => {
      setOneCategoryInStore(data.getOneCatStore)
    }
  })
    // HANDLESS
    const handlerDeleteCategoryInStore = (category) => {
      const { pState, idPc } = category || {}
      if (!idPc || !pState) return
      return deleteCatOfProducts({
        variables: { idPc, pState }, update(cache) {
          cache.modify({
            fields: {
              catProductsAll(dataOld = []) {
                return cache.writeQuery({ query: GET_ULTIMATE_CATEGORY_PRODUCTS, data: dataOld })
              }
            }
          })
        }
      })
    }
    const handleUpdateCatInProduct = async ({ data }) => {
      await updatedCatWithProducts({
        variables: {
          input: {
            setData: data?.map(x => { return { idProduct: x.pId } }),
            idCat: idCat
          }
        }
      })
    }
  return {
    categories,
    data: data?.catProductsAll || [],
    loading,
    error,
    handlerDeleteCategoryInStore,
    handleUpdateCatInProduct
  }
}

