export interface ICatWithProduct {
  max?: number
  min?: number
  search?: string | null
  productName?: string | null
  searchFilter?: {
    gender?: string[]
    desc?: string | null
    speciality?: string[]
  }
  callback?: Function  
}


// =====================
// Query Variables
// =====================

export interface GetCatProductsWithProductVariables {
  search?: string
  productName?: string
  min?: number
  max?: number
  gender?: string[]
  desc?: string[]
  categories?: string[]
}

// =====================
// Response Types
// =====================

export interface GetCatProductsWithProductResponse {
  getCatProductsWithProduct: {
    totalCount: number
    catProductsWithProduct: CatProductWithProduct[]
  }
}

// =====================
// Main Entities
// =====================

export interface CatProductWithProduct {
  carProId: string
  pState: number
  ProImage: string | null
  idStore: string
  pName: string
  totalCount: number
  checked?: boolean
  ProDescription?: string | null
  createdAt: string
  updatedAt: string
  productFoodsAll: ProductFood[]
}

export interface ProductFood {
  pId: string
  stock: number
  manageStock: boolean
  sizeId?: string | null
  colorId?: string | null
  carProId: string
  cId?: string | null
  dId?: string | null
  ctId?: string | null
  idStore: string
  caId?: string | null
  fId?: string | null
  pName: string
  ProPrice: number
  ProDescuento?: number | null
  ProUniDisponibles?: number | null
  ProDescription?: string | null
  ProProtegido?: boolean | null
  ProAssurance?: boolean | null
  ProImage?: string | null
  ProStar?: number | null
  ProWidth?: number | null
  ProHeight?: number | null
  ProLength?: number | null
  ProWeight?: number | null
  ProQuantity?: number | null
  ProOutstanding?: boolean | null
  ProDelivery?: boolean | null
  ProVoltaje?: string | null
  pState: number
  sTateLogistic?: number | null
  createdAt: string
  updatedAt: string
  product_availables: ProductAvailable[]
}

export interface ProductAvailable {
  availableProductId: string
  pId: string
  idStore: string
  dayAvailable: string
  startDate: string
  endDate: string
  createdAt: string
  updatedAt: string
}
