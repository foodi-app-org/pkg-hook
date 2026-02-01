import { MockData as RawMockData } from '../../../mock'

// Helper to convert MockData.required from number to boolean
/**
 *
 * @param data
 * @returns {DessertTransformedData}
 */
function fixMockDataRequired(data: any): DessertTransformedData {
  const fixedLists: Record<string, ListType> = {};
  for (const key in data.lists) {
    const list = data.lists[key];
    fixedLists[key] = {
      ...list,
      required: Boolean(list.required),
      cards: Array.isArray(list.cards)
        ? list.cards.map((card: any) => ({
            ...card,
            required: Boolean(card.required)
          }))
        : []
    };
  }
  return {
    lists: fixedLists,
    listIds: data.listIds
  };
}

interface SubOptionalType {
  exCode: string;
  OptionalSubProName: string;
  state: boolean;
}

interface DessertItemType {
  code: string;
  OptionalProName: string;
  numbersOptionalOnly: number;
  required: boolean;
  ExtProductFoodsSubOptionalAll?: SubOptionalType[];
}

interface ListType {
  id: string;
  title: string;
  numberLimit: number;
  required: boolean;
  value: string;
  cards: Array<{
    id: string;
    title: string;
    required: boolean;
    value: string;
  }>;
}

interface DessertTransformedData {
  lists: Record<string, ListType>;
  listIds: string[];
}

export const transformDataToDessert = (dataArray: DessertItemType[]): DessertTransformedData => {
  if (!dataArray) {
    return fixMockDataRequired(RawMockData);
  }
  if (!Array.isArray(dataArray)) {
    return fixMockDataRequired(RawMockData);
  }

  const transformedData: DessertTransformedData = {
    lists: {},
    listIds: []
  };

  dataArray.forEach((item: DessertItemType) => {
    const listId = item.code;
    transformedData.listIds.push(listId);
    transformedData.lists[listId] = {
      id: listId,
      title: item?.OptionalProName,
      numberLimit: item?.numbersOptionalOnly,
      required: Boolean(item?.required), // Ensure boolean
      value: '',
      cards: item?.ExtProductFoodsSubOptionalAll && item.ExtProductFoodsSubOptionalAll.length > 0
        ? item.ExtProductFoodsSubOptionalAll.map((subOptional: SubOptionalType) => {
          return {
            id: subOptional?.exCode,
            title: subOptional?.OptionalSubProName,
            required: Boolean(subOptional?.state), // Ensure boolean
            value: ''
          };
        })
        : []
    };
  });

  return transformedData;
};
