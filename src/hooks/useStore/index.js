import { useState } from 'react';
import { useRouter } from 'next/router';
import { useApolloClient, useQuery } from '@apollo/client';
import { GET_ONE_STORE } from './queries'; // Reemplaza con la importación correcta de tu consulta
import { errorHandler } from '../../config/client'
import { useLogout } from '../useLogout'

export const useStore = () => {
  const [store, setStore] = useState({});
  const client = useApolloClient();
  const [onClickLogout, { loading: load, error: err }] = useLogout()
  // Intentar leer los datos de la caché
  const cachedData = client.readQuery({ query: GET_ONE_STORE });

  if (cachedData) {
    // Comprobar si los datos de la caché ya están establecidos en el estado
    if (!store || Object.keys(store).length === 0) {
      setStore(cachedData.getStore);
    }
  }

  const { loading, error } = useQuery(GET_ONE_STORE, {
    fetchPolicy: 'cache-first',
    onCompleted: (data) => {
      const { getStore } = data || {};
      setStore(getStore);
    },
    onError: (err) => {
      if (err.networkError && err.networkError.result) {
        const response = errorHandler(err.networkError.result);
        if (response) {
          onClickLogout()
        }
      }
    },
  });

  // Actualizar manualmente la caché después de cada petición exitosa
  if (!loading && !error && !cachedData) {
    client.writeQuery({
      query: GET_ONE_STORE,
      data: { getStore: store },
    });
  }

  return [store, { loading, error }];
};
