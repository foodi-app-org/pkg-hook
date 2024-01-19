// Hola mundo
export const useManageQueryParams = ({
  router
} = {}) => {

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
