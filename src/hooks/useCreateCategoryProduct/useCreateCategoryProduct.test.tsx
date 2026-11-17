import React from 'react'
import { MockedProvider } from '@apollo/client/testing'
import { renderHook, act } from '@testing-library/react'
import { useCreateCategoryProduct } from './index'
import { CREATE_CATEGORY_PRODUCT } from './queries'

const variables = { input: { pName: 'Bebidas', ProDescription: '' } }

describe('useCreateCategoryProduct', () => {
  it('creates a category and resolves success', async () => {
    const mocks = [{
      request: { query: CREATE_CATEGORY_PRODUCT, variables },
      result: { data: { updatedProducts: { success: true, message: 'Creada' } } }
    }]
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <MockedProvider mocks={mocks} addTypename={false}>{children}</MockedProvider>
    )
    const { result } = renderHook(() => useCreateCategoryProduct({ refetchQueryNames: [] }), { wrapper })
    let output: unknown
    await act(async () => { output = await result.current.createCategory({ pName: ' Bebidas ' }) })
    expect(output).toEqual({ success: true, message: 'Creada' })
  })

  it('rejects an invalid name before sending a mutation', async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <MockedProvider mocks={[]}>{children}</MockedProvider>
    )
    const { result } = renderHook(() => useCreateCategoryProduct(), { wrapper })
    await expect(result.current.createCategory({ pName: ' ' })).rejects.toThrow('El nombre')
  })

  it('rejects a nullable backend response', async () => {
    const mocks = [{
      request: { query: CREATE_CATEGORY_PRODUCT, variables },
      result: { data: { updatedProducts: null } }
    }]
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <MockedProvider mocks={mocks} addTypename={false}>{children}</MockedProvider>
    )
    const { result } = renderHook(() => useCreateCategoryProduct({ refetchQueryNames: [] }), { wrapper })
    await expect(result.current.createCategory({ pName: 'Bebidas' })).rejects.toThrow('El servidor')
  })
})
