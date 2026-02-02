/**
 * Single schedule item
 */
export interface Schedule {
  schId: string
  idStore?: string
  schDay: number
  schHoSta: string
  schHoEnd: string
  schState: boolean
}

/**
 * Queries responses
 */
export interface GetOneScheduleResponse {
  getOneStoreSchedules: Schedule | null
}

export interface GetSchedulesResponse {
  getStoreSchedules: Schedule[]
}

/**
 * Mutations responses
 */
export interface BasicMutationResponse {
  success: boolean
  message?: string
}

/**
 * Hook params
 */
export interface UseScheduleParams {
  day?: number | null
  idStore: string
}

export interface UseSchedulesParams {
  schDay?: number
  idStore: string
  onCompleted?: (data: GetSchedulesResponse) => void
}
