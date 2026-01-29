/**
 * Generate the store URL based on given parameters
 * @param {Object} city - The city object with name
 * @param {Object} department - The department object with name
 * @param {string} storeName - The name of the store
 * @param {string} idStore - The ID of the store
 * @returns {string} - The generated URL or null if any field is missing
 */
export const generateStoreURL = ({
  city,
  department,
  storeName,
  idStore,
  rootMainPath = 'delivery'
}) => {
  try {
    // Validate all necessary fields
    if (
      !process.env.MAIN_URL_BASE ||
        !city?.cName ||
        !department?.dName ||
        !storeName ||
        !idStore
    ) {
      return '/' // Return null or any default case you'd prefer
    }

    const cityName = city.cName.toLocaleLowerCase()
    const departmentName = department.dName.toLocaleLowerCase()

    // Replace spaces in storeName with hyphens
    const formattedStoreName = storeName.replace(/\s+/g, '-')

    return `${process.env.MAIN_URL_BASE}/${rootMainPath}/${cityName}-${departmentName}/${formattedStoreName}/${idStore}`
  } catch (_) {
    return '/'
  }
}
