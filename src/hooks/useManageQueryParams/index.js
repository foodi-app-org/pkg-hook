// Hola mundo
export const useManageQueryParams = ({
  location = {
    query: {},
    push: (props, state, { shallow }) => {
      return { ...props, state, shallow }
    }
  }
} = {}) => {
  const handleQuery = (name, value = '') => {
    location.push(
      {
        query: {
          ...location.query,
          [name]: value
        }
      },
      undefined,
      { shallow: true }
    )
  }

  const handleCleanQuery = (name, value = '') => {
    const updatedQuery = {
      ...location.query,
      [name]: value || ''
    }
    location.push(
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
