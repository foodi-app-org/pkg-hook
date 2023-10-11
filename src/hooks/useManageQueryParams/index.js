import { useRouter } from 'next/router'
// Hola mundo
export const useManageQueryParams = () => {
  const router = useRouter()

  const handleQuery = (name, value = '') => {
    router.push(
      {
        query: {
          ...router.query,
          [name]: value
        }
      },
      undefined,
      { shallow: true }
    )
  }

  const handleCleanQuery = (name, value = '') => {
    const updatedQuery = {
      ...router.query,
      [name]: value || ''
    }
    router.push(
      {
        query: updatedQuery
      },
      undefined,
      { shallow: true }
    )
  }

  return {
    handleQuery,
    handleCleanQuery
  }
}
