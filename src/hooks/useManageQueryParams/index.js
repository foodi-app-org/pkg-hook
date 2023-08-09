import { useRouter } from 'next/router'

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
        router.push(
          {
            query: {
              ...router.query,
              [name]: value || ''
            }
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