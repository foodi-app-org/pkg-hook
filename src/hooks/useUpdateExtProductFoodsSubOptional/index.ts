import { useMutation } from '@apollo/client'
import { SendNotificationFn } from 'typesdefs';

import { updateCacheMod } from '../../utils'
import { GET_EXTRAS_PRODUCT_FOOD_OPTIONAL, GET_EXTRAS_PRODUCT_FOOD_SUB_OPTIONAL } from '../useProductsFood/queriesStore'


type HandleMutateArgs = {
  pId: string;
  title: string;
  listId: string;
  id: string;
  state?: number;
};

export const useUpdateExtProductFoodsSubOptional = ({
  sendNotification = (args: SendNotificationFn) => { return args }
}: { sendNotification?: (args: SendNotificationFn) => void } = {}) => {
  const [updateExtProductSubOptional] = useMutation(GET_EXTRAS_PRODUCT_FOOD_SUB_OPTIONAL, {
    onCompleted: (data) => {
      // console.log('🚀 ~ useUpdateExtProductFoodsSubOptional ~ data:', data)
      const { updateExtProductSubOptional } = data ?? {
        updateExtProductSubOptional: null
      };
      const { success, message, errors } = updateExtProductSubOptional ?? {
        success: false, 
        message: 'No response from server',
        errors: []
      };
      sendNotification({
        title: success ? 'Sub item creado' : 'Error',
        backgroundColor: success ? 'success' : 'error',
        description: message // Assuming 'description' is a valid property in SendNotificationFn
      });
      for (const err of errors || []) {
        const { message: msg } = err || {};
        sendNotification({
          title: 'Error',
          backgroundColor: 'error',
          description: msg // Assuming 'description' is a valid property in SendNotificationFn
        });
      }
      return data;
    }
  });

  const handleMutateExtProductFoodsSubOptional = ({
    pId,
    title,
    listId,
    id,
    state = 1
  }: HandleMutateArgs) => {
    updateExtProductSubOptional({
      variables: {
        input: {
          pId,
          OptionalSubProName: title,
          exCodeOptionExtra: listId,
          exCode: id,
          state
        }
      },
      update: (cache, { data }: { data: { ExtProductFoodsOptionalAll } }) => {
        updateCacheMod({
          cache,
          query: GET_EXTRAS_PRODUCT_FOOD_OPTIONAL,
          nameFun: 'ExtProductFoodsOptionalAll',
          dataNew: data.ExtProductFoodsOptionalAll,
          type: 1
        });
      }
    });
  };
  return {
    handleMutateExtProductFoodsSubOptional
  };
}
