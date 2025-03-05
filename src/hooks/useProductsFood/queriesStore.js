import { gql } from '@apollo/client'

export const CREATE_SCHEDULE_STORE = gql`
  mutation setStoreSchedule($input: IsStoreSchedule!) {
    setStoreSchedule(input: $input) {
      success
      message
    }
  }
`
export const GET_SCHEDULE_STORE = gql`
  query getStoreSchedules($schDay: Int, $idStore: ID) {
    getStoreSchedules(schDay: $schDay, idStore: $idStore) {
      schId
      idStore
      schDay
      schHoSta
      schHoEnd
      schState
    }
  }
`
export const GET_ONE_SCHEDULE_STORE = gql`
  query getOneStoreSchedules($schDay: Int, $idStore: ID) {
    getOneStoreSchedules(schDay: $schDay, idStore: $idStore) {
      schId
      schDay
      schHoSta
      schHoEnd
      schState
    }
  }
`
export const GET_CAT_OF_PRODUCTS = gql`
  query getAllCatOfProducts($idStore: ID) {
    getAllCatOfProducts(idStore: $idStore) {
      id
      cpId
      catName
      catDescription
      schState
    }
  }
`
export const REGISTER_CAT_OF_PRODUCTS = gql`
  mutation updatedProducts($input: InputCatProducts) {
    updatedProducts(input: $input) {
      success
      message
    }
  }
`
export const REGISTER_CONTRACT_STORE = gql`
  mutation createOneContract($input: InputContractType) {
    createOneContract(input: $input) {
      success
      message
    }
  }
`
export const GET_ALL_EMPLOYEE_STORE = gql`
  query employees($umId: ID, $cId: ID, $aId: ID) {
    employees(umId: $umId, cId: $cId, aId: $aId) {
      eId
      idStore
      id
      idEmployee
      eSalary
      typeContract
      uEmail
      termContract
      eDatAdm
      eState
    }
  }
`

export const GET_ALL_PRODUCT_STORE = gql`
  query productFoodsAll(
    $search: String
    $min: Int
    $max: Int
    $gender: [String]
    $pState: Int
    $desc: [String]
    $categories: [ID]
    $fromDate: DateTime
    $toDate: DateTime
  ) {
    productFoodsAll(
      search: $search
      min: $min
      max: $max
      gender: $gender
      desc: $desc
      pState: $pState
      categories: $categories
      toDate: $toDate
      fromDate: $fromDate
    ) {
      pId
      sizeId #Talla
      colorId #Color
      stock
      manageStock
      carProId #Categoria a la cual pertenece el producto
      caId
      cId #Country
      dId #Department
      ctId #Cuidad
      fId #Características
      pName
      getOneTags {
        tPsId
        idUser
        idStore
        pId
        nameTag
      }
      ProPrice
      ProDescuento
      free
      ProUniDisponibles
      ProDescription
      ProProtegido
      ProAssurance
      ValueDelivery
      ProStar
      sTateLogistic
      ProImage
      ProWidth
      ProHeight
      ProLength
      ProWeight
      ProQuantity
      ProOutstanding
      pDatCre
      pDatMod
      ProDelivery
      ProVoltaje
      pState
      feat {
        fId
        thpId
        hpqrQuestion
      }
      area {
        aId
        aName
      }
    }
  }
`
export const GET_ALL_RATING_START_STORE = gql`
  query getAllRatingStar($idStore: ID) {
    getAllRatingStar(idStore: $idStore) {
      rSId
      rScore
      idStore
      createAt
    }
  }
`
export const GET_ALL_VISITOR_STORE = gql`
  query getAllVisitorStore(
    $idStore: ID
    $search: String
    $min: Int
    $max: Int
    $fromDate: DateTime
    $toDate: DateTime
  ) {
    getAllVisitorStore(
      idStore: $idStore
      search: $search
      min: $min
      max: $max
      fromDate: $fromDate
      toDate: $toDate
    ) {
      visitStoreId
      id
      idStore
      createAt
      updateAt
    }
  }
`
export const GET_MIN_PEDIDO = gql`
  query getMinPrice($idStore: ID) {
    getMinPrice(idStore: $idStore)
  }
`

// eslint-disable-next-line camelcase
export const GET_All_RATING_STORE = gql`
  query getAllRating($idStore: ID) {
    getAllRating(idStore: $idStore) {
      idStore
      rId
      id
      rAppearance
      rTasty
      rGoodTemperature
      rGoodCondition
      rState
      createAt
      updateAt
    }
  }
`
export const CREATE_LOGO = gql`
  mutation setALogoStore($logo: Upload, $idStore: ID) {
    setALogoStore(logo: $logo, idStore: $idStore) {
      success
      message
    }
  }
`
export const CREATE_BANNER_STORE = gql`
  mutation registerBanner($input: IBanner) {
    registerBanner(input: $input) {
      success
      message
    }
  }
`
export const DELETE_ONE_LOGO_STORE = gql`
  mutation deleteALogoStore($idStore: ID, $Image: String) {
    deleteALogoStore(idStore: $idStore, Image: $Image) {
      message
      success
    }
  }
`
export const GET_ONE_BANNER_STORE = gql`
  query getOneBanners($idStore: ID, $id: ID) {
    getOneBanners(idStore: $idStore, id: $id) {
      bnId
      id
      path
      bnImageFileName
      idStore
      bnState
      createAt
      updateAt
    }
  }
`
export const DELETE_ONE_BANNER_STORE = gql`
  mutation DeleteOneBanner(
    $bnState: Int
    $idStore: ID
    $bnId: ID
    $bnImage: String
    $bnImageFileName: String
  ) {
    DeleteOneBanner(
      bnState: $bnState
      idStore: $idStore
      bnId: $bnId
      bnImage: $bnImage
      bnImageFileName: $bnImageFileName
    ) {
      success
      message
    }
  }
`

export const GET_ALL_PQR = gql`
  query getOnePqr($hpqrId: ID, $thpId: ID) {
    getOnePqr(hpqrId: $hpqrId, thpId: $thpId) {
      hpqrId
      thpId
      hpqrQuestion
    }
  }
`
export const GET_ONE_COLOR = gql`
  query getAllColor {
    getAllColor {
      colorId
      colorName
      colorState
    }
  }
`
export const UPDATE = gql`
  mutation updateProducts($input: InputProduct) {
    updateProducts(input: $input) {
      pId
      sizeId #Talla
      colorId #Color
      cId #Country
      dId #Department
      ctId #Cuidad
      fId #Características
      pName
      ProPrice
      ProDescuento
      ProUniDisponibles
      ProDescription
      ProProtegido
      ProAssurance
      ProStar
      pState
      ProImage
      ProWidth
      ProHeight
      ProLength
      ProWeight
      ProQuantity
      ProOutstanding
      ProDelivery
      ProVoltaje
    }
  }
`

export const UPDATE_PRODUCT_FOOD = gql`
   mutation updateProductFoods($input: InputProductFood) {
    updateProductFoods(input: $input) {
   	success
    message
    errors {
      path
      message
      type
      context {
        limit
        value
        label
        key
      }
    }
    data {
      pId
      sizeId #Talla
      colorId #Color
      cId #Country
      dId #Department
      ctId #Cuidad
      fId #Características
      pName
      pCode
      ProPrice
      carProId
      ProDescuento
      ProUniDisponibles
      ValueDelivery
      ProDescription
      ProProtegido
      ProAssurance
      ProStar
      pState
      ProImage
      ProWidth
      ProHeight
      ProLength
      ProWeight
      ProQuantity
      ProOutstanding
      ProDelivery
      ProVoltaje
    }
    }
  }
`
// UPDATE EXTRAS
export const UPDATE_EXTRAS_PRODUCT_FOOD = gql`
  mutation updateExtProductFoods($input: InputExtProductFood) {
    updateExtProductFoods(input: $input) {
      pId
      exPid
      exState
      extraName
      extraPrice
      state
      pDatCre
      pDatMod
    }
  }
`
// EXTRA PRODUCTS
export const UPDATE_EXTRAS_PRODUCT_FOOD_OPTIONAL = gql`
  mutation updateExtProductFoodsOptional($input: InputExtProductFoodOptional) {
    updateExtProductFoodsOptional(input: $input) {
      success,
      message
    }
  }
`
export const GET_EXTRAS_PRODUCT_FOOD_OPTIONAL = gql`
  query ExtProductFoodsOptionalAll(
    $search: String
    $min: Int
    $max: Int
    $pId: ID
  ) {
    ExtProductFoodsOptionalAll(
      search: $search
      min: $min
      max: $max
      pId: $pId
    ) {
      pId
      opExPid
      OptionalProName
      state
      code
      numbersOptionalOnly
      pDatCre
      required
      pDatMod
      ExtProductFoodsSubOptionalAll {
        pId
        opExPid
        idStore
        opSubExPid
        OptionalSubProName
        exCodeOptionExtra
        exCode
        state
        pDatCre
        pDatMod
      }
    }
  }
`
export const GET_EXTRAS_PRODUCT_FOOD_SUB_OPTIONAL = gql`
  mutation updateExtProductFoodsSubOptional(
    $input: InputExtProductFoodSubOptional
  ) {
    updateExtProductFoodsSubOptional(input: $input) {
      pId
      opExPid
      idStore
      opSubExPid
      OptionalSubProName
      exCodeOptionExtra
      exCode
      state
      pDatCre
      pDatMod
    }
  }
`

export const DELETE_ONE_PRODUCT = gql`
  mutation deleteProducts($input: IDeleteProduct) {
    deleteProducts(input: $input) {
      pId
    }
  }
`
export const GET_ALL_PRODUCTS = gql`
  query productsAll(
    $search: String
    $min: Int
    $max: Int
    $gender: [String]
    $desc: [String]
    $categories: [ID]
  ) {
    productsAll(
      search: $search
      min: $min
      max: $max
      gender: $gender
      desc: $desc
      categories: $categories
    ) {
      pId
      sizeId #Talla
      colorId #Color
      cId #Country
      dId #Department
      ctId #Cuidad
      fId #Características
      pName
      ProPrice
      ProDescuento
      ProUniDisponibles
      ProDescription
      ProProtegido
      ProAssurance
      ProStar
      sTateLogistic
      ProImage
      ProWidth
      ProHeight
      ProLength
      ProWeight
      ProQuantity
      ProOutstanding
      ProDelivery
      ProVoltaje
      pState
      feat {
        fId
        thpId
        hpqrQuestion
      }
      area {
        aId
        aName
      }
    }
  }
`
export const GET_ALL_FOOD_PRODUCTS = gql`
  query getFoodAllProduct(
    $search: String
    $min: Int
    $max: Int
    $gender: [String]
    $desc: [String]
    $categories: [ID]
  ) {
    getFoodAllProduct(
      search: $search
      min: $min
      max: $max
      gender: $gender
      desc: $desc
      categories: $categories
    ) {
      id
      pfId
      idStore
      ProPrice
      ProDescuento
      ProDescription
      pName
      pState
      sTateLogistic
      ProStar
      ProImage
      ProHeight
      ProWeight
      ProOutstanding
      ProDelivery
      pDatCre
      pDatMod
    }
  }
`

export const EDIT_PRODUCT = gql`
  mutation editProductFoods($input: InputProductFood) {
    editProductFoods(input: $input) {
      success
      message
    }
  }
`
export const SET_EDIT_STORE_NAME = gql`
  mutation setEditNameStore($StoreName: String) {
    setEditNameStore(StoreName: $StoreName) {
      success
      message
    }
  }
`
export const GET_ONE_PRODUCTS_FOOD = gql`
   query productFoodsOne($pId: ID) {
    productFoodsOne(pId: $pId) {
      pId
      carProId
      pCode
      sizeId
      colorId
      idStore
      cId
      caId
      stock
      manageStock
      dId
      ctId
      tpId
      fId
      pName
      ProPrice
      ProBarCode
      ProDescuento
      ValueDelivery
      ProUniDisponibles
      ProDescription
      ProProtegido
      ProAssurance
      ProImage
      ProStar
      ProWidth
      ProHeight
      ProLength
      ProWeight
      ProQuantity
      ProOutstanding
      ProDelivery
      ProVoltaje
      pState
      sTateLogistic
      pDatCre
      pDatMod
      getOneTags {
        tPsId
        idUser
        idStore
        pId
        nameTag
        aName
      }
      getAllAvailableProduct {
        availableProductId
        idStore
        pId
        dayAvailable
        pDatCre
        pDatMod
      }
      ExtProductFoodsAll {
        pId
        exPid
        exState
        extraName
        extraPrice
        state
        pDatCre
        pDatMod
      }
      getStore {
        idStore
        cId
        id
        dId
        ctId
        catStore
        neighborhoodStore
        Viaprincipal
        storeOwner
        storeName
        emailStore
        storePhone
        socialRaz
        Image
        banner
        documentIdentifier
        uPhoNum
        ULocation
        upLat
        upLon
        uState
        siteWeb
        description
        NitStore
        typeRegiments
        typeContribute
        secVia
        addressStore
        createdAt
        department {
          dId
          cId
          dName
          dDatCre
          dDatMod
          dState
        }
        pais {
          cId
          cName
          cCalCod
          cState
        }
        city {
          ctId
          dId
          cName
          cState
          cDatCre
          cDatMod
        }
      }
    }
  }
`

export const CREATE_FOOD_PRODUCT = gql`
  mutation newRegisterFoodProduct($input: FoodProductInput) {
    newRegisterFoodProduct(input: $input) {
      success
      message
    }
  }
`
export const GET_BANNER_PROMO_DASHBOARD = gql`
  query getPromoStoreAdmin($min: Int, $max: Int) {
    getPromoStoreAdmin(min: $min, max: $max) {
      pSoId
      comments
      mainName
      metaTags
      urlImage
      bPromoState
      createAt
      updateAt
    }
  }
`

export const CREATE_STORE_CALENDAR = gql`
  mutation setStoreSchedule($input: ITstoreSchedule!) {
    setStoreSchedule(input: $input) {
      message
      success
    }
  }
`
export const DELETE_ONE_CAT_PRODUCTS = gql`
  mutation deleteCatOfProducts($idPc: ID!, $pState: Int) {
    deleteCatOfProducts(idPc: $idPc, pState: $pState) {
      success
      message
    }
  }
`
export const DELETE_ONE_CAT_PRODUCTS_FINAL = gql`
  mutation deleteCatFinalOfProducts($idPc: ID, $withProduct: Boolean) {
    deleteCatFinalOfProducts(idPc: $idPc, withProduct: $withProduct) {
      success
      message
    }
  }
`
export const DELETE_EXTRA_PRODUCTS = gql`
  mutation deleteextraproductfoods($id: ID, $state: Int) {
    deleteextraproductfoods(id: $id, state: $state) {
      success
      message
    }
  }
`
export const EDIT_EXTRA_PRODUCTS = gql`
  mutation editExtProductFoods($input: InputExtProductFood!) {
    editExtProductFoods(input: $input) {
      success
      message
    }
  }
`
export const DELETE_CAT_EXTRA_PRODUCTS = gql`
  mutation DeleteExtProductFoodsOptional($opExPid: ID, $state: Int) {
    DeleteExtProductFoodsOptional(opExPid: $opExPid, state: $state) {
      success
      message
    }
  }
`
export const DELETE_CAT_EXTRA_SUB_OPTIONAL_PRODUCTS = gql`
  mutation DeleteExtFoodSubsOptional($opSubExPid: ID, $state: Int) {
    DeleteExtFoodSubsOptional(opSubExPid: $opSubExPid, state: $state) {
      success
      message
    }
  }
`
export const UPDATE_CAT_IN_PRODUCT = gql`
  mutation updatedCatWithProducts($input: LineItemsIdPro) {
    updatedCatWithProducts(input: $input) {
      success
      message
    }
  }
`
export const GET_ULTIMATE_CATEGORY_PRODUCTS = gql`
  query catProductsAll(
    $search: String
    $min: Int
    $max: Int
    $gender: [String]
    $desc: [String]
    $categories: [ID]
  ) {
    catProductsAll(
      search: $search
      min: $min
      max: $max
      gender: $gender
      desc: $desc
      categories: $categories
    ) {
      carProId
      idStore
      pName
      ProDescription
      ProImage
      pState
      pDatCre
      pDatMod
    }
  }
`
export const GET_ALL_EXTRA_PRODUCT = gql`
  query ExtProductFoodsAll($search: String, $min: Int, $max: Int, $pId: ID) {
    ExtProductFoodsAll(search: $search, min: $min, max: $max, pId: $pId) {
      pId
      exPid
      exState
      extraName
      extraPrice
      state
      pDatCre
      pDatMod
    }
  }
`
export const GET_ALL_CATEGORIES_WITH_PRODUCT = gql`
  query getCatProductsWithProduct(
    $search: String
    $min: Int
    $max: Int
    $gender: [String]
    $desc: [String]
    $categories: [ID]
  ) {
    getCatProductsWithProduct(
      search: $search
      min: $min
      max: $max
      gender: $gender
      desc: $desc
      categories: $categories
    ) {
      carProId
      pState
      pState
      ProImage
      idStore
      pName
      ProDescription
      ProImage
      pState
      pDatCre
      pDatMod
      productFoodsAll {
        pId
        sizeId
        colorId
        stock
        carProId
        manageStock
        cId
        dId
        ctId
        idStore
        caId
        fId
        pName
        ProPrice
        ProDescuento
        ProUniDisponibles
        ProDescription
        ProProtegido
        ProAssurance
        ProImage
        ProStar
        ProWidth
        ProHeight
        ProLength
        ProWeight
        ProQuantity
        ProOutstanding
        ProDelivery
        ProVoltaje
        pState
        sTateLogistic
        pDatCre
        pDatMod
      }
    }
  }
`

export const REGISTER_TAGS_PRODUCT = gql`
  mutation registerTag($input: ITag) {
    registerTag(input: $input) {
      tPsId
      idUser
      idStore
      pId
      nameTag
      aName
    }
  }
`
