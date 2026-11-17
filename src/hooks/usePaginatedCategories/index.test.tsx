import React from 'react'
import { MockedProvider } from '@apollo/client/testing'
import { act, renderHook, waitFor } from '@testing-library/react'
import { usePaginatedCategories } from './index'
import { GET_PAGINATED_CATEGORY_PRODUCTS } from './queries'

describe('usePaginatedCategories', () => {
  const mock = {
    request: {
      query: GET_PAGINATED_CATEGORY_PRODUCTS,
      variables: { page: 1, max: 20, search: undefined, pState: 0, mode: 'offset' }
    },
    result: {
      data: {
        catProductsPaginated: {
          __typename: 'CategoryProductsPaginatedResult',
          success: true,
          message: 'OK',
          data: [{ __typename: 'catProducts', carProId: 'one', pName: 'Bebidas', pState: 0 }],
          pagination: { __typename: 'CategoryPaginationMeta', totalRecords: 1, totalPages: 1, currentPage: 1, pageSize: 20, mode: 'offset' },
          nextCursor: null
        }
      }
    }
  }
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <MockedProvider mocks={[mock]} addTypename>{children}</MockedProvider>
  )

  it('loads inactive categories when pState=0', async () => {
    const { result } = renderHook(() => usePaginatedCategories({ pState: 0 }), { wrapper })
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.categories[0]?.pName).toBe('Bebidas')
    expect(result.current.pagination.totalRecords).toBe(1)
  })

  it('clamps the page size and exposes actions', () => {
    const { result } = renderHook(() => usePaginatedCategories({ enabled: false, pageSize: 1000 }), { wrapper })
    expect(result.current.pageSize).toBe(100)
    act(() => result.current.goToPage(2))
    expect(result.current.page).toBe(2)
    act(() => result.current.previousPage())
    expect(result.current.page).toBe(1)
  })
})
