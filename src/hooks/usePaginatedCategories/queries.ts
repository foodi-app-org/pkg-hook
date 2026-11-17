import { gql } from '@apollo/client'

export const GET_PAGINATED_CATEGORY_PRODUCTS = gql`
  query CatProductsPaginated(
    $page: Int
    $max: Int
    $search: String
    $pState: Int
    $mode: String
    $cursor: String
  ) {
    catProductsPaginated(
      page: $page
      max: $max
      search: $search
      pState: $pState
      mode: $mode
      cursor: $cursor
    ) {
      success
      message
      data {
        carProId
        idStore
        pName
        ProDescription
        ProImage
        pState
        createdAt
        updatedAt
      }
      pagination {
        totalRecords
        totalPages
        currentPage
        pageSize
        mode
      }
      nextCursor
    }
  }
`
