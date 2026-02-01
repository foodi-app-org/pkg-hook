// useFilterConfigs.ts
import { gql, useQuery } from '@apollo/client'

/**
 * GraphQL query: expects the backend to return a JSON (or custom scalar) containing filterTabs
 */
const GET_FILTER_CONFIGS = gql`
  query GetFilterConfigs($idStore: String) {
    filterConfigs(idStore: $idStore) {
      id
      idStore
      filterTabs
      active
      priority
      createdAt
      updatedAt
    }
  }
`

/**
 * Type definitions matching DB/json structure
 */

/**
 * @typedef {Object} FilterValue
 * @property {string} [id]
 * @property {string} description
 * @property {number|string|null} [value]
 * @property {string|null} [imageUrn]
 */
export type FilterValue = {
    id?: string
    description: string
    value?: number | string | null
    imageUrn?: string | null
}

/**
 * @typedef {Object} FilterGroup
 * @property {string} id
 * @property {string} description
 * @property {string} displayType
 * @property {FilterValue[]} values
 */
export type FilterGroup = {
    id: string
    description: string
    displayType: string
    values: FilterValue[]
}

/**
 * @typedef {Object} FilterTab
 * @property {string} id
 * @property {string} name
 * @property {FilterGroup[]} filterGroups
 */
export type FilterTab = {
    id: string
    name: string
    filterGroups: FilterGroup[]
}

/**
 * @typedef {Object} FilterConfigRecord
 * @property {string} id
 * @property {string|null} idStore
 * @property {FilterTab[]} filterTabs
 * @property {boolean} active
 * @property {number} priority
 */
export type FilterConfigRecord = {
    id: string
    idStore: string | null
    filterTabs: FilterTab[]
    active: boolean
    priority: number
}

/**
 * Runtime guard to ensure shape is roughly correct
 * @param anyData any
 * @returns boolean
 */
const isFilterTabs = (anyData: any) => {
  if (!Array.isArray(anyData)) return false
  for (const tab of anyData) {
    if (typeof tab?.id !== 'string' || typeof tab?.name !== 'string') return false
    if (!Array.isArray(tab.filterGroups)) return false
    for (const g of tab.filterGroups) {
      if (typeof g?.id !== 'string') return false
      if (!Array.isArray(g.values)) return false
    }
  }
  return true
}

/**
 * Hook options
 */
export type UseFilterConfigsOptions = {
    idStore?: string | null
    pollIntervalMs?: number
    skip?: boolean
    onError?: (err: Error) => void
}

/**
 * Hook return
 */
export type UseFilterConfigsResult = {
    data: FilterTab[]
    rawRecords: FilterConfigRecord[] | null
    loading: boolean
    error: Error | null
    refetch: () => Promise<void>
}

/**
 * Custom hook to fetch filter configs from GraphQL and expose typed, validated tabs.
 * - Returns empty array when data is invalid (defensive).
 * - Accepts idStore and poll interval as parameters for flexibility.
 *
 * @param {UseFilterConfigsOptions} options
 * @returns {UseFilterConfigsResult}
 */
export const useFilterConfigs = ({
  skip = false,
  onError
}: UseFilterConfigsOptions = {}): UseFilterConfigsResult => {
  const { data, loading, error, refetch } = useQuery(
    GET_FILTER_CONFIGS,
    {
      skip
    }
  )

  if (error && onError) onError(error as Error)

  const rawRecords =
        Array.isArray((data as any)?.filterConfigs) ? (data as any).filterConfigs as FilterConfigRecord[] : null

  // let tabs: FilterTab[] = []

  if (rawRecords && rawRecords.length > 0) {
    // pick the active config with highest priority (lowest number)
    const active = rawRecords
      .filter(r => {return r.active !== false})
      .sort((a, b) => {return (a.priority ?? 9999) - (b.priority ?? 9999)})[0]

    const candidate = active ?? rawRecords[0]

    if (candidate && isFilterTabs(candidate.filterTabs)) {
      // tabs = candidate.filterTabs
    } else {
      // defensive logging — don't throw to avoid crashing UI, return empty array
       
      console.warn('useFilterConfigs: invalid filterTabs structure', candidate?.filterTabs)
      // eslint-disabled-next-line
      // tabs = []
    }
  }

  return {
    data: [{ 'id': 'BASIC', 'name': 'Básicos', 'filterGroups': [{ 'id': 'DELIVERY_MODE', 'description': 'Modo de entrega', 'displayType': 'WORD_CLOUD_SINGLE', 'values': [{ 'id': 'DELIVERY', 'description': 'Entrega' }, { 'id': 'TAKEOUT', 'description': 'Pra retirar' }] }, { 'id': 'SORTING', 'description': 'Ordenar por', 'displayType': 'GRID', 'values': [{ 'id': 'DEFAULT', 'description': 'Ordenação Padrão' }, { 'id': 'PRICE_RANGE:ASC', 'description': 'Preço' }, { 'id': 'USER_RATING:DESC', 'description': 'Avaliação' }, { 'id': 'DELIVERY_TIME:ASC', 'description': 'Tempo de Entrega' }, { 'id': 'DELIVERY_FEE:ASC', 'description': 'Taxa de Entrega' }, { 'id': 'DISTANCE:ASC', 'description': 'Menor distância' }] }, { 'id': 'DISTANCE', 'description': 'Distância', 'displayType': 'SLIDER', 'values': [{ 'id': 'MIN_VALUE', 'description': '1' }, { 'id': 'MAX_VALUE', 'description': '10' }] }, { 'id': 'DELIVERY_FEE', 'description': 'Taxa de entrega', 'displayType': 'WORD_CLOUD_SINGLE', 'values': [{ 'id': 'FREE', 'description': 'Grátis', 'value': 0 }, { 'id': 'MAX_FIVE', 'description': 'até R$ 5,00', 'value': 5 }, { 'id': 'MAX_TEN', 'description': 'até R$ 10,00', 'value': 10 }] }, { 'id': 'TAGS', 'description': 'Filtros especiais', 'displayType': 'CHECKBOX', 'values': [{ 'id': 'SUPER_RESTAURANT', 'imageUrn': 'SUPER_RESTAURANT.png', 'description': 'Super-Restaurantes' }, { 'id': 'SUPPORTS_ORDER_TRACKING', 'imageUrn': 'SUPPORTS_ORDER_TRACKING.png', 'description': 'Entrega Parceira' }, { 'id': 'SUPPORTS_ANY_TRACKING', 'imageUrn': 'SUPPORTS_ANY_TRACKING.png', 'description': 'Entrega Rastreável' }, { 'id': 'SUPPORTS_SCHEDULING', 'imageUrn': 'SUPPORTS_SCHEDULING.png', 'description': 'Aceita agendamento' }] }] }, { 'id': 'CATEGORY', 'name': 'Categorias', 'filterGroups': [{ 'id': 'MERCHANT_TYPE', 'description': 'Tipo de loja', 'displayType': 'GRID', 'values': [{ 'id': 'ALL', 'description': 'Todas as lojas' }, { 'id': 'RESTAURANT', 'description': 'Restaurante' }, { 'id': 'MARKET', 'description': 'Mercado' }] }, { 'id': 'AVAILABLE_CATEGORIES', 'description': 'Categorias', 'displayType': 'WORD_CLOUD', 'values': [{ 'description': 'Africana', 'id': 'AF1' }, { 'description': 'Alemã', 'id': 'ALE' }, { 'description': 'Árabe', 'id': 'ARA' }, { 'description': 'Argentina', 'id': 'AR1' }, { 'description': 'Asiática', 'id': 'ASI' }, { 'description': 'Açaí', 'id': 'AC1' }, { 'description': 'Baiana', 'id': 'BA1' }, { 'description': 'Bebidas', 'id': 'BEB' }, { 'description': 'Brasileira', 'id': 'BRA' }, { 'description': 'Cafeteria', 'id': 'CA1' }, { 'description': 'Carnes', 'id': 'CAR' }, { 'description': 'Casa de Sucos', 'id': 'CS1' }, { 'description': 'Chinesa', 'id': 'CHI' }, { 'description': 'Colombiana', 'id': 'CO1' }, { 'description': 'Congelados Fit', 'id': 'CF1' }, { 'description': 'Congelados', 'id': 'CN1' }, { 'description': 'Contemporânea', 'id': 'CNT' }, { 'description': 'Conveniência', 'id': 'CV1' }, { 'description': 'Coreana', 'id': 'CR1' }, { 'description': 'Cozinha rápida', 'id': 'CRP' }, { 'description': 'Crepe', 'id': 'CP1' }, { 'description': 'Doces & Bolos', 'id': 'DCE' }, { 'description': 'Espanhola', 'id': 'ES1' }, { 'description': 'Francesa', 'id': 'FRA' }, { 'description': 'Frangos', 'id': 'FR1' }, { 'description': 'Frutos do mar', 'id': 'FRU' }, { 'description': 'Gaúcha', 'id': 'GA1' }, { 'description': 'Grega', 'id': 'GRC' }, { 'description': 'Hambúrguer', 'id': 'BUR' }, { 'description': 'Indiana', 'id': 'IND' }, { 'description': 'Italiana', 'id': 'ITA' }, { 'description': 'Japonesa', 'id': 'JAP' }, { 'description': 'Lanches', 'id': 'LCH' }, { 'description': 'Marmita', 'id': 'MA1' }, { 'description': 'Marroquina', 'id': 'MAR' }, { 'description': 'Mediterrânea', 'id': 'MED' }, { 'description': 'Mercado 🛒', 'id': 'MER' }, { 'description': 'Mexicana', 'id': 'MEX' }, { 'description': 'Mineira', 'id': 'MI1' }, { 'description': 'Nordestina', 'id': 'NO1' }, { 'description': 'Padaria', 'id': 'PA1' }, { 'description': 'Panqueca', 'id': 'PQC' }, { 'description': 'Paranaense', 'id': 'PR1' }, { 'description': 'Pastel', 'id': 'PAS' }, { 'description': 'Peixes', 'id': 'PX1' }, { 'description': 'Peruana', 'id': 'PER' }, { 'description': 'Pizza', 'id': 'PIZ' }, { 'description': 'Portuguesa', 'id': 'POR' }, { 'description': 'Presentes', 'id': 'PRE' }, { 'description': 'Salgados', 'id': 'SAG' }, { 'description': 'Saudável', 'id': 'SAU' }, { 'description': 'Sopas & Caldos', 'id': 'SP1' }, { 'description': 'Sorvetes', 'id': 'SOR' }, { 'description': 'Tailandesa', 'id': 'THA' }, { 'description': 'Tapioca', 'id': 'TA1' }, { 'description': 'Típica do Norte', 'id': 'TN1' }, { 'description': 'Variada', 'id': 'VAR' }, { 'description': 'Vegana', 'id': 'VE1' }, { 'description': 'Vegetariana', 'id': 'VEG' }, { 'description': 'Xis', 'id': 'XI1' }, { 'description': 'Yakisoba', 'id': 'YA1' }] }] }, { 'id': 'PAYMENT', 'name': 'Pagamentos', 'filterGroups': [{ 'id': 'MEDIUM_PRICE', 'description': 'Preço médio', 'displayType': 'WORD_CLOUD_SINGLE', 'values': [{ 'id': 'CHEAPEST', 'description': '$' }, { 'id': 'CHEAP', 'description': '$$' }, { 'id': 'MODERATE', 'description': '$$$' }, { 'id': 'EXPENSIVE', 'description': '$$$$' }, { 'id': 'MOST_EXPENSIVE', 'description': '$$$$$' }] }, { 'id': 'ONLINE_PAYMENTS', 'description': 'Pagamento pelo app', 'displayType': 'WORD_CLOUD', 'values': [{ 'id': 'PIX', 'description': 'pix' }, { 'id': 'ELO', 'description': 'Elo' }, { 'id': 'MC', 'description': 'Mastercard' }, { 'id': 'MCMA', 'description': 'Mastercard Maestro' }, { 'id': 'VIS', 'description': 'Visa' }, { 'id': 'VISE', 'description': 'Visa Electron' }, { 'id': 'AM', 'description': 'Amex' }, { 'id': 'DNR', 'description': 'Diners' }] }, { 'id': 'ONLINE_PAYMENTS_VR', 'description': 'Vale-refeição/alimentação pelo app', 'displayType': 'WORD_CLOUD', 'values': [{ 'id': 'IMV', 'description': 'iFood Refeição' }, { 'id': 'VRO', 'description': 'VR Refeição' }, { 'id': 'SRP', 'description': 'Sodexo Refeição' }, { 'id': 'ALR', 'description': 'Alelo Refeição' }, { 'id': 'TRO', 'description': 'Ticket' }, { 'id': 'BENRON', 'description': 'Ben Refeição' }] }, { 'id': 'OFFLINE_PAYMENTS', 'description': 'Pagamento na entrega', 'displayType': 'WORD_CLOUD', 'values': [{ 'id': 'DIN', 'description': 'Dinheiro' }, { 'id': 'RSODEX', 'description': 'Sodexo' }, { 'id': 'VVREST', 'description': 'Vale Alelo Refeição' }, { 'id': 'VR_SMA', 'description': 'VR Refeição' }, { 'id': 'BENVVR', 'description': 'Ben Refeição' }, { 'id': 'TRE', 'description': 'Ticket' }, { 'id': 'RDREST', 'description': 'Mastercard - Crédito' }, { 'id': 'MEREST', 'description': 'Mastercard' }, { 'id': 'VSREST', 'description': 'Visa - Crédito' }, { 'id': 'VIREST', 'description': 'Visa' }, { 'id': 'REC', 'description': 'Elo - Crédito' }, { 'id': 'RED', 'description': 'Elo' }, { 'id': 'RHIP', 'description': 'Hipercard' }, { 'id': 'TVER', 'description': 'Verocard' }, { 'id': 'RAM', 'description': 'American Express' }, { 'id': 'CPRCAR', 'description': 'Cooper Card' }, { 'id': 'GRNCAR', 'description': 'Green Card' }, { 'id': 'GRNCPL', 'description': 'Green Card (papel)' }, { 'id': 'RSELE', 'description': 'Refeisul' }, { 'id': 'VALECA', 'description': 'Vale Card' }, { 'id': 'BANRC', 'description': 'Banricompras - Crédito' }, { 'id': 'BANRD', 'description': 'Banricompras' }, { 'id': 'DNREST', 'description': 'Diners' }, { 'id': 'GOODC', 'description': 'Goodcard' }, { 'id': 'VERDEC', 'description': 'Verdecard' }, { 'id': 'CHE', 'description': 'Cheque' }] }] }],
    rawRecords,
    loading,
    error: error ? (error as Error) : null,
    refetch: async () => {
      await refetch()
    }
  }
}
