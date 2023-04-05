import { useLazyQuery, useMutation } from "@apollo/client";
import { useCallback, useEffect, useReducer, useState } from "react";
import { Cookies } from "../../cookies";
import {
  RandomCode,
  getCurrentDomain,
  updateCacheMod
} from "../../utils";
import { useFormatDate } from "../useFormatDate";
import { useProductsFood } from "../useProductsFood";
import {
  GET_ALL_EXTRA_PRODUCT,
  GET_EXTRAS_PRODUCT_FOOD_OPTIONAL,
  GET_ONE_PRODUCTS_FOOD,
} from "../useProductsFood/queriesStore";
import { useStore } from "../useStore";
import {
  CREATE_SHOPPING_CARD_TO_USER_STORE,
  GET_ALL_COUNT_SALES,
  GET_ALL_SALES,
  GET_ALL_SALES_STATISTICS,
} from "./queries";

const initialState = {
  PRODUCT: [],
  totalPrice: 0,
  sortBy: null,
  itemsInCart: 0,
  animateType: "",
  startAnimateUp: "",
  priceRange: 0,
  counter: 0,
  totalAmount: 0,
  payMethodPState: 0,
};

const initializer = (initialValue = initialState) => {
  return (
    JSON.parse(
      Cookies.get(process.env.LOCAL_SALES_STORE) || JSON.stringify(initialState)
    ) || initialValue
  );
};

export const useSales = ({
  disabled,
  sendNotification,
  router,
  setAlertBox,
}) => {
  const domain = getCurrentDomain();
  const [loadingSale, setLoadingSale] = useState(false);
  const [errorSale, setErrorSale] = useState(false);
  const [modalItem, setModalItem] = useState(false);
  const [openCommentModal, setOpenCommentModal] = useState(false);
  const keyToSaveData = process.env.LOCAL_SALES_STORE;
  const saveDataState = JSON.parse(Cookies.get(keyToSaveData) || "[]");
  const [search, setSearch] = useState("");
  const [arr, setArrayCategory] = useState([]);
  const [totalProductPrice, setTotalProductPrice] = useState(0);
  const [showMore, setShowMore] = useState(100);
  const [inputValue, setInputValue] = useState("");
  const [_, setFilteredList] = useState([]);
  const [delivery, setDelivery] = useState(false);
  const [print, setPrint] = useState(false);
  const [values, setValues] = useState({});
  const [dataStore] = useStore();
  const [code, setCode] = useState(null);
  const [openCurrentSale, setOpenCurrentSale] = useState(null);
  const { createdAt } = dataStore || {};
  const { yearMonthDay } = useFormatDate({ date: createdAt });
  const [valuesDates, setValuesDates] = useState(() => {
    return { fromDate: yearMonthDay, toDate: "" };
  });
  const [dataOptional, setDataOptional] = useState([]);
  const [dataExtra, setDataExtra] = useState([]);

  const [registerSalesStore, { loading: loadingRegisterSale }] = useMutation(
    CREATE_SHOPPING_CARD_TO_USER_STORE,
    {
      onCompleted: (data) => {
        const message = `${data?.registerSalesStore?.Response?.message}`;
        const error = data?.registerSalesStore?.Response.success
          ? "Éxito"
          : "Error";
        sendNotification({ title: error, description: message });
        setAlertBox({ message: message, type: "success" });
        setOpenCurrentSale(data?.registerSalesStore?.Response.success);
      },
      onError: (error) => {
        console.log("error", error);
      },
    }
  );
  const [product, setProduct] = useState({
    PRODUCT: {},
  });
  const [productFoodsOne, { data: dataProduct }] = useLazyQuery(
    GET_ONE_PRODUCTS_FOOD
  );
  const [ExtProductFoodsSubOptionalAll] = useLazyQuery(
    GET_EXTRAS_PRODUCT_FOOD_OPTIONAL,
    {
      onError: () => {
        setDataOptional([]);
      },
    }
  );
  const [ExtProductFoodsAll] = useLazyQuery(GET_ALL_EXTRA_PRODUCT, {
    onError: () => {
      setDataExtra([]);
    },
  });
  const [productsFood, { loading, fetchMore }] = useProductsFood({
    search: search?.length >= 4 ? search : "",
    gender: [],
    desc: [],
    categories: arr || [],
    toDate: valuesDates?.toDate,
    fromDate: valuesDates?.fromDate,
    max: showMore,
    min: 0,
  });
  const max = productsFood?.reduce(function (a, b) {
    return Math.max(a, b?.ProPrice || 0);
  }, 0);
  const initialStateSales = {
    PRODUCT: [],
    totalPrice: 0,
    sortBy: null,
    itemsInCart: 0,
    animateType: "",
    startAnimateUp: "",
    priceRange: max || 0,
    counter: 0,
    totalAmount: 0,
    payMethodPState: 0,
  };
  // HANDLESS
  // FILTER PRODUCT DATA_DB
  const handlePrint = ({ callback }) => {
    if (disabled) {
      return sendNotification({
        title: "Error",
        description: "Esta es la descr",
        backgroundColor: "red",
      });
    }
    setPrint(!print);
  };
  const handleChangeFilter = (e) => {
    return setSearch(e.target.value);
  };
  const handleChange = (e) => {
    return setValues({ ...values, [e.target.name]: e.target.value });
  };
  const onChangeInput = (e) => {
    return setValuesDates({ ...valuesDates, [e.target.name]: e.target.value });
  };
  const handleChangeFilterProduct = (e) => {
    let text = searchedInput(e.target.value);
    if (text === undefined || text === "") {
      return;
    }
    let filteredData = handleList(text);
    setFilteredList(filteredData);
  };
  const [oneProductToComment, setOneProductToComment] = useState({});
  const handleComment = (product) => {
    if (product) {
      setOneProductToComment(product);
      setValues({
        ...values,
        comment: product?.comment || "",
      });
    }
    setOpenCommentModal(!openCommentModal);
  };
  const handleChangeNumber = useCallback(
    (state, action) => {
      const event = action.payload;
      const { value, index, id } = event || {};
      const productExist = productsFood?.find((items) => {
        return items.pId === id;
      });
      const OneProduct = state?.PRODUCT.find((items) => {
        return items.pId === id;
      });
      if (value <= 0) {
        dispatch({ type: "REMOVE_PRODUCT_TO_CART", payload: OneProduct });
      }
      const finalQuantity = (state.PRODUCT["ProQuantity"] = value || 0);
      const ARR_PRODUCT = state?.PRODUCT?.map((items, i) => {
        return i === index
          ? {
              ...items,
              ProQuantity: finalQuantity,
              ProPrice: value
                ? value * productExist?.ProPrice
                : productExist?.ProPrice,
            }
          : items;
      });
      return {
        ...state,
        PRODUCT: ARR_PRODUCT,
        counter: state.counter + 1,
      };
    },
    [productsFood]
  );
  const PRODUCT = (state, action) => {
    const productExist = state.PRODUCT.find((items) => {
      return items.pId === action.id;
    });
    const OurProduct = productsFood.find((items) => {
      return items.pId === action.id;
    });
    const isFree = productExist?.free;

    switch (action.type) {
      case "ADD_TO_CART":
        return addToCartFunc(state, action);
      case "ADD_PRODUCT":
        return {
          ...state,
          // eslint-disable-next-line
          PRODUCT: [...state?.PRODUCT, action?.payload],
        };
      case "REMOVE_PRODUCT":
        return removeFunc(state, action);
      case "REMOVE_PRODUCT_TO_CART":
        return {
          ...state,
          PRODUCT: state?.PRODUCT?.filter((t) => {
            return t.pId !== action?.payload.pId;
          }),
          counter: state.counter - action.payload.ProQuantity,
        };
      case "ON_CHANGE": {
        return handleChangeNumber(state, action);
      }
      case "REMOVE_ALL_PRODUCTS":
        setValues({});
        return {
          ...state,
          PRODUCT: [],
          counter: 0,
        };

      case "TOGGLE_FREE_PRODUCT":
        return toggleFreeProducts(state, action);
      case "INCREMENT":
        return {
          ...state,
          counter: state.counter + 1,
          PRODUCT: state?.PRODUCT?.map((items) => {
            return items.pId === action.id
              ? {
                  ...items,
                  ProQuantity: items.ProQuantity + 1,
                  ProPrice: isFree
                    ? 0
                    : (productExist.ProQuantity + 1) * OurProduct?.ProPrice,
                }
              : items;
          }),
        };
      case "PUT_COMMENT":
        return commentProducts(state, action);
      case "PUT_EXTRA_PRODUCTS_AND_OPTIONAL_PRODUCT":
        return handleUpdateAllExtraAndOptional(state, action);
      case "PRICE_RANGE":
        return {
          ...state,
          priceRange: action.payload,
        };
      case "SORT":
        return { ...state, sortBy: action.payload };
      case "DECREMENT":
        return {
          ...state,
          // counter: state.counter - 1,
          // PRODUCT: state?.PRODUCT?.map((items) => {
          //   return items.pId === action.id ? {
          //     ...items,
          //     ProQuantity: items.ProQuantity - 1,
          //     // ProPrice: ((productExist.ProQuantity + 1) * OurProduct?.ProPrice),
          //   } : items
          // })
        };
      case "PAYMENT_METHOD_TRANSACTION":
        return {
          ...state,
          payMethodPState: 1,
        };
      case "PAYMENT_METHOD_MONEY":
        return {
          ...state,
          payMethodPState: 0,
        };
      default:
        return state;
    }
  };
  const [data, dispatch] = useReducer(PRODUCT, initialStateSales, initializer);
  const handleRemoveValue = useCallback(({ name, value, pId }) => {
    setValues({
      ...values,
      [name]: value ?? "",
    });
    return dispatch({
      type: "PUT_COMMENT",
      payload: pId,
      value: "",
    });
  }, []);
  useEffect(() => {
    Cookies.set(keyToSaveData, JSON.stringify(data), { domain, path: "/" });
  }, [data, domain]);

  const handleAddOptional = ({ exOptional, codeCategory, index }) => {
    const item = dataOptional.find((item) => item.code === codeCategory);
    if (!item) return;
    const idx = item.ExtProductFoodsSubOptionalAll.findIndex(
      (el) => el.opSubExPid === exOptional
    );
    if (item && idx !== -1) {
      const updatedItem = {
        ...item,
        ExtProductFoodsSubOptionalAll: [
          ...item.ExtProductFoodsSubOptionalAll.slice(0, idx),
          {
            ...item.ExtProductFoodsSubOptionalAll[idx],
            check: !item.ExtProductFoodsSubOptionalAll[idx].check,
          },
          ...item.ExtProductFoodsSubOptionalAll.slice(idx + 1),
        ],
      };
      const newData = dataOptional.map((el) =>
        el.code === codeCategory ? updatedItem : el
      );
      setDataOptional((prevData) => [...newData]);
    }
  };

  function handleUpdateAllExtraAndOptional(state, action) {
    return {
      ...state,
      PRODUCT: state?.PRODUCT?.map((items) => {
        return items.pId === action.payload
          ? {
              ...items,
              dataOptional: action.dataOptional || [],
              dataExtra: action.dataExtra || [],
            }
          : items;
      }),
    };
  }

  /**
   * Description
   * @returns {any}
   *  */
  const [sumExtraProducts, setSumExtraProducts] = useState(0);
  useEffect(() => {
    const arr =
      dataExtra?.length > 0
        ? dataExtra?.filter((p) => {
            return p.quantity !== 0;
          })
        : [];
    const val = arr.findIndex((item) => item.quantity !== 0);
    if (val === -1) {
      setSumExtraProducts(0);
    }
    function sumNewExtraPrice() {
      let sum = 0;
      arr.forEach((obj) => {
        sum += obj.newExtraPrice ?? 0;
      });
      if (arr.length === 0) {
        setSumExtraProducts(0);
      }
      setSumExtraProducts(sum);
      return sum;
    }
    if (arr.length > 0) {
      sumNewExtraPrice();
    }
  }, [dataExtra]);

  function handleUpdateAllExtra() {
    const { pId } = product?.PRODUCT || {};
    const filteredDataOptional = dataOptional.map((obj) => {
        const filteredSubOptions = obj.ExtProductFoodsSubOptionalAll.filter(
          (subObj) => subObj.check === true
        );
        // Excluya todo el objeto padre si filteredSubOptions está vacío
        if (filteredSubOptions.length === 0) {
          return null;
        }
        return { ...obj, ExtProductFoodsSubOptionalAll: filteredSubOptions };
      }).filter((obj) => obj !== null); // Elimine todos los objetos nulos del arreglo
    const filteredDataExtra = dataExtra.filter((p) => {
      return p.quantity !== 0;
    });
    return dispatch({
      type: "PUT_EXTRA_PRODUCTS_AND_OPTIONAL_PRODUCT",
      payload: pId,
      dataOptional: filteredDataOptional,
      dataExtra: filteredDataExtra,
    });
  }

  function handleIncrementExtra({ Adicionales, index }) {
    const { pId } = product?.PRODUCT || {};
    const exPid = Adicionales.exPid || null;
    if (exPid && pId) {
      const newExtra = dataExtra.map((producto) => {
        if (exPid === producto.exPid) {
          const initialQuantity = producto?.quantity ? producto?.quantity : 0;
          return {
            ...producto,
            quantity: initialQuantity + 1,
            newExtraPrice: producto.extraPrice * (initialQuantity + 1),
          };
        }
        return producto;
      });
      return setDataExtra(newExtra);
    }
  }
  function handleDecrementExtra({ Adicionales, index }) {
    const { pId } = product?.PRODUCT || {};
    const exPid = Adicionales.exPid || null;

    // Comprobar que el objeto Adicionales existe en dataExtra
    const extraIndex = dataExtra.findIndex((extra) => extra.exPid === exPid);
    if (extraIndex === -1) {
      return;
    }

    if (pId && exPid) {
      const newExtra = dataExtra.map((producto, i) => {
        if (exPid === producto.exPid) {
          const initialQuantity = producto?.quantity;
          return {
            ...producto,
            quantity: initialQuantity - 1,
            newExtraPrice: producto.extraPrice * (initialQuantity - 1),
          };
        }
        return producto;
      });
      setDataExtra(newExtra);
    }
  }

  function addToCartFunc(state, action) {
    const productExist = state.PRODUCT.find((items) => {
      return items.pId === action.payload.pId;
    });
    const OurProduct = productsFood.find((items) => {
      return items.pId === action.payload.pId;
    });
    const isFree = productExist?.free;
    return {
      ...state,
      counter: state.counter + 1,
      totalAmount: state.totalAmount + action.payload.ProPrice,
      startAnimateUp: "start-animate-up",
      PRODUCT: !productExist
        ? [
            ...state.PRODUCT,
            {
              pId: action.payload.pId,
              pName: action.payload.pName,
              unitPrice: OurProduct?.ProPrice,
              ProDescription: action.payload.ProDescription,
              ProImage: action.payload.ProImage,
              ProPrice: action.payload.ProPrice,
              ProQuantity: 1,
            },
          ]
        : state.PRODUCT.map((items) => {
            return items.pId === action.payload.pId
              ? {
                  ...items,
                  unitPrice: OurProduct?.ProPrice,
                  ProPrice: isFree
                    ? 0
                    : (productExist.ProQuantity + 1) * OurProduct?.ProPrice,
                  ProQuantity: productExist.ProQuantity + 1,
                  free: isFree ? true : false,
                }
              : items;
          }),
    };
  }
  function removeFunc(state, action) {
    const productExist = state.PRODUCT.find((items) => {
      return items.pId === action.payload.pId;
    });
    const OurProduct = productsFood.find((items) => {
      return items.pId === action.payload.pId;
    });
    return {
      ...state,
      counter: state.counter - 1,
      totalAmount: state.totalAmount - action.payload.ProPrice,
      PRODUCT:
        action.payload.ProQuantity > 1
          ? state.PRODUCT.map((items) => {
              return items.pId === action.payload.pId
                ? {
                    ...items,
                    pId: action.payload.pId,
                    ProQuantity: items.ProQuantity - 1,
                    ProPrice: productExist.ProPrice - OurProduct?.ProPrice,
                  }
                : items;
            })
          : state.PRODUCT.filter((items) => {
              return items.pId !== action.payload.pId;
            }),
    };
  }

  // TOGGLE_FREE_PRODUCT
  function toggleFreeProducts(state, action) {
    const productExist = productsFood.find((items) => {
      return items.pId === action.payload.pId;
    });
    return {
      ...state,
      PRODUCT: state?.PRODUCT?.map((items) => {
        return items.pId === action.payload.pId
          ? {
              ...items,
              free: !items.free,
              ProPrice: items.ProPrice
                ? 0
                : items.ProQuantity * productExist?.ProPrice,
            }
          : items;
      }),
    };
  }

  // COMMENT_FREE_PRODUCT
  function commentProducts(state, action, deleteValue) {
    return {
      ...state,
      PRODUCT: state?.PRODUCT?.map((items) => {
        return items.pId === action.payload
          ? {
              ...items,
              comment: deleteValue ? "" : values.comment,
            }
          : items;
      }),
    };
  }

  const getSortedProduct = (sortData, sortBy) => {
    if (sortBy && sortBy === "PRICE_HIGH_TO_LOW") {
      return (
        sortData.sort((a, b) => {
          return b["ProPrice"] - a["ProPrice"];
        })
      );
    }
    if (sortBy && sortBy === "PRICE_LOW_TO_HIGH") {
      return (
        sortData.sort((a, b) => {
          return a["ProPrice"] - b["ProPrice"];
        })
      );
    }
    return sortData;
  };
  const PriceRangeFunc = (products, price) => {
    return (
      products?.length > 0 &&
      products?.filter((items) => {
        return items?.ProPrice >= price;
      })
    );
  };

  const sortedProduct = getSortedProduct(data.PRODUCT, data.sortBy);
  const finalFilter = PriceRangeFunc(sortedProduct, data.priceRange);

  const handleList = (text) => {
    let inputText = text.toLowerCase();
    let dataList = [];
    dataList = finalFilter.filter((item) => {
      return item.pName.toLowerCase().includes(inputText);
    });
    return dataList;
  };
  const searchedInput = (words) => {
    setInputValue(words);
    let n = words.split(" ");
    if (n.length !== 0) {
      if (n[n.length - 1] === "") {
        n.pop();
      }
      return n[n.length - 1];
    }
    return "";
  };
  const newArrayProducts =
    data?.PRODUCT?.length > 0 ?
    data?.PRODUCT?.map((product) => {
      const filteredDataExtra = product?.dataExtra?.map(({__typename, ...rest}) => rest) ?? [];
      const dataOptional = product?.dataOptional?.map(({  __typename, ...product}) => {
        const {ExtProductFoodsSubOptionalAll, ...rest} = product;
        const adjustedSubOptionalAll = ExtProductFoodsSubOptionalAll?.map(subOption => {
          const {__typename, ...subOptionRest} = subOption;
          return subOptionRest;
        });
        return {...rest, ExtProductFoodsSubOptionalAll: adjustedSubOptionalAll};
      });
      return {
        pId: product?.pId,
        id: values?.cliId,
        cantProducts: parseInt(product?.ProQuantity ? product?.ProQuantity : 0),
        comments: product?.comment ?? "",
        dataOptional: dataOptional ?? [],
        dataExtra: filteredDataExtra || []
      };
    }) : [];
  const handleSubmit = () => {
    if (!values?.cliId)
      return sendNotification({
        title: "Error",
        description: "Elije primero un cliente",
      });
    setLoadingSale(true);
    const code = RandomCode(10);
    setCode(code);
    return registerSalesStore({
      variables: {
        input: newArrayProducts || [],
        id: values?.cliId,
        pCodeRef: code,
        change: values.change,
        valueDelivery: parseInt(values.valueDelivery),
        payMethodPState: data.payMethodPState,
        pickUp: 1,
        totalProductsPrice: totalProductPrice || 0,
      },
      update: (
        cache,
        { data: { getAllSalesStoreStatistic, getTodaySales, getAllSalesStore } }
      ) => {
        updateCacheMod({
          cache,
          query: GET_ALL_SALES,
          nameFun: "getAllSalesStore",
          dataNew: getAllSalesStore,
        });
        updateCacheMod({
          cache,
          query: GET_ALL_COUNT_SALES,
          nameFun: "getTodaySales",
          dataNew: getTodaySales,
        });
        updateCacheMod({
          cache,
          query: GET_ALL_SALES_STATISTICS,
          nameFun: "getAllSalesStoreStatistic",
          dataNew: getAllSalesStoreStatistic
        });
      },
    })
      .then((responseRegisterR) => {
        if (responseRegisterR) {
          const { data } = responseRegisterR || {};
          const { registerSalesStore } = data || {};
          const { Response } = registerSalesStore || {};
          if (Response && Response.success === true) {
            // dispatch({ type: 'REMOVE_ALL_PRODUCTS' })
            router.push(
              {
                query: {
                  ...router.query,
                  saleId: code,
                },
              },
              undefined,
              { shallow: true } 
            );
            // setValues({})
          }
        }
        setLoadingSale(false);
      })
      .catch(() => {
        setLoadingSale(false);
        setErrorSale(true);
      })
      .finally(() => {
        setLoadingSale(false);
      });
  };
  let suma = 0;
  let total = 0;

  useEffect(() => {
    data.PRODUCT.forEach((a) => {
      const { ProPrice } = a || {};
      suma += ProPrice;
      setTotalProductPrice(Math.abs(suma));
    });
    if (data.PRODUCT.length === 0) {
      setTotalProductPrice(0);
    }
  }, [totalProductPrice, suma, total, data]);
  const [loadingExtraProduct, setLoadingExtraProduct] = useState(false);

  const handleProduct = async (PRODUCT) => {
    setLoadingExtraProduct(true)
    const { pId } = PRODUCT || {};
    try {
      const originalArray = data.PRODUCT.find((item) => {
        return item.pId === pId;
      });
      // OPTIONAL
      productFoodsOne({ variables: { pId  } })
      const optionalAll = await ExtProductFoodsSubOptionalAll({ variables: { pId  } })
      const optionalFetch = optionalAll.data.ExtProductFoodsOptionalAll
      setDataOptional(optionalFetch || [])
      const existOptionalCookies = originalArray?.dataOptional
      const filteredDataOptional  =  existOptionalCookies?.length ? existOptionalCookies?.map((obj) => {
        const filteredSubOptions = obj.ExtProductFoodsSubOptionalAll.filter(
          (subObj) => subObj.check === true
        );
        // Excluya todo el objeto padre si filteredSubOptions está vacío
        if (filteredSubOptions.length === 0) {
          return null;
        }
        return { ...obj, ExtProductFoodsSubOptionalAll: filteredSubOptions };
      }).filter((obj) => obj !== null) : [];

        // Actualizar optionalAll.data.ExtProductFoodsSubOptionalAll con los valores actualizados de originalArray2.ExtProductFoodsSubOptionalAll
        if (optionalFetch && filteredDataOptional) {
          const updateOption = optionalFetch.map((obj) => {
            const matchingArray = filteredDataOptional.find((o) => o && o.opExPid === obj.opExPid);
            if (!matchingArray) {
              return obj;
            }
            const extProductFoodsSubOptionalAll = obj.ExtProductFoodsSubOptionalAll || [];
            const updateExtProductFoodsSubOptionalAll = extProductFoodsSubOptionalAll.map((subObj) => {
              const newItem = matchingArray.ExtProductFoodsSubOptionalAll.find(
                (newItem) => newItem && newItem.opSubExPid === subObj.opSubExPid
              );
              if (newItem) {
                return {
                  ...subObj,
                  check: true
                };
              }
              return subObj;
            });
            return {
              ...obj,
              ExtProductFoodsSubOptionalAll: updateExtProductFoodsSubOptionalAll
            };
          }).filter(obj => obj);
          if (existOptionalCookies) {
            setDataOptional(updateOption || [])
          } else {
            setDataOptional(optionalAll.data.ExtProductFoodsOptionalAll || [])
          }
        }
      // NO OPTIONAL
      const extProduct = await ExtProductFoodsAll({ variables: { pId } });
      let finalData;
      if (!originalArray?.dataExtra) {
        finalData = extProduct?.data?.ExtProductFoodsAll;
      } else {
        const filteredData = originalArray.dataExtra.filter((item) =>
          extProduct?.data?.ExtProductFoodsAll.some(
            (newItem) => newItem.exPid === item.exPid
          )
        );
        finalData = originalArray?.dataExtra?.concat(
          extProduct?.data?.ExtProductFoodsAll?.filter(
            (item) =>
              !filteredData?.some(
                (filteredItem) => filteredItem.exPid === item.exPid
              )
          )
        );
      }
      setDataExtra(finalData);
      setProduct(() => {
        return {
          PRODUCT,
        };
      });
      setLoadingExtraProduct(false)
    } catch (error) {
      setLoadingExtraProduct(false)
      console.log({ message: error || "Lo sentimos, ocurrió un error" });
    }
  };
  const handleCleanFilter = () => {
    setArrayCategory([]);
    setValues({});
    setValuesDates({ fromDate: yearMonthDay, toDate: "" });
  };
  const disabledModalItems = dataOptional?.length > 0 || dataExtra?.length > 0
  return {
    // loading: loading || loadingSale,
    loading: false,
    loadingExtraProduct,
    disabledModalItems: !disabledModalItems,
    loadingRegisterSale,
    errorSale,
    openCurrentSale,
    code,
    totalProductPrice,
    saveDataState,
    product,
    data,
    openCommentModal,
    inputValue,
    newArrayProducts,
    delivery,
    valuesDates,
    print,
    finalFilter,
    showMore,
    max,
    search,
    values,
    initialStateSales,
    productsFood,
    modalItem,
    sumExtraProducts,
    oneProductToComment: oneProductToComment ?? null,
    dataProduct: dataProduct?.productFoodsOne || {},
    dataOptional: dataOptional || [],
    dataExtra: dataExtra || [],
    fetchMore,
    handleUpdateAllExtra,
    dispatch,
    setArrayCategory,
    handleComment,
    setModalItem,
    handleChangeFilter,
    handleProduct,
    handleChange,
    setOpenCurrentSale,
    onChangeInput,
    handleRemoveValue,
    setDelivery,
    setValues,
    setShowMore,
    PriceRangeFunc,
    handleCleanFilter,
    handleSubmit,
    handleChangeFilterProduct,
    handleDecrementExtra,
    setTotalProductPrice,
    setInputValue,
    getSortedProduct,
    handleAddOptional,
    handleIncrementExtra,
    setProduct,
    setPrint: handlePrint,
    PRODUCT,
  };
};
