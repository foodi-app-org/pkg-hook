/**
 * Sub optional extra product
 */
export interface ExtProductFoodSubOptional {
  pId: string
  opExPid: string
  idStore: string
  opSubExPid: string
  OptionalSubProName: string
  exCodeOptionExtra: string
  exCode: string
  state: boolean
  createdAt: string
  updatedAt: string
}

/**
 * Optional extra product
 */
export interface ExtProductFoodOptional {
  pId: string
  opExPid: string
  OptionalProName: string
  state: boolean
  code: string
  numbersOptionalOnly: number
  required: boolean
  createdAt: string
  updatedAt: string
  ExtProductFoodsSubOptionalAll: ExtProductFoodSubOptional[]
}

/**
 * Query response
 */
export interface GetExtrasProductFoodOptionalResponse {
  ExtProductFoodsOptionalAll: ExtProductFoodOptional[]
}

/**
 * Query variables
 */
export interface GetExtrasProductFoodOptionalVars {
  search?: string
  min?: number
  max?: number
  pId?: string
}
