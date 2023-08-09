import { MockData } from '../../../mock'

/**
 * Transforms an array of objects into a specific data format suitable for desserts.
 *
 * @param {Array<Object>} dataArray - The array of objects to transform.
 * @return {Object} The transformed data containing lists and listIds.
 * @throws {Error} If dataArray is not an array or if the objects lack required properties.
 */
export const transformDataToDessert = (dataArray) => {
    try {
        if (!dataArray) {
            return MockData
        }
        if (!Array.isArray(dataArray)) {
            throw new Error('dataArray must be an array.');
          }
        
          const transformedData = {
            lists: {},
            listIds: []
          };
        
          dataArray.forEach((item) => {
            const listId = item.code;
            transformedData.listIds.push(listId);
            transformedData.lists[listId] = {
              id: listId,
              title: item?.OptionalProName,
              numberLimit: item?.numbersOptionalOnly,
              required: item?.required,
              value: '',
              cards: item?.ExtProductFoodsSubOptionalAll?.length > 0 ? item?.ExtProductFoodsSubOptionalAll?.map(subOptional => {
                  return {
                      id: subOptional?.exCode,
                      title: subOptional?.OptionalSubProName,
                      required: subOptional?.state,
                      value: ''
                  }
              }) : []
            };
          })
        
          return transformedData;
    } catch (error) {
        console.error(error.message)
        return MockData
    }
  
  };
  