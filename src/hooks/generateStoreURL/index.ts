/**
 * Generate the store URL based on given parameters.
 * @returns The generated URL or '/' if any field is missing.
 */
type City = { cName: string };
type Department = { dName: string };

interface GenerateStoreURLParams {
  city: City;
  department: Department;
  storeName: string;
  idStore: string;
  rootMainPath?: string;
}

export const generateStoreURL = ({
  city,
  department,
  storeName,
  idStore,
  rootMainPath = 'delivery'
}: GenerateStoreURLParams): string => {
  // Validate all necessary fields
  if (
    !process.env.MAIN_URL_BASE ||
      !city?.cName ||
      !department?.dName ||
      !storeName ||
      !idStore
  ) {
    return '/' // Return '/' or any default case you'd prefer
  }

  const cityName = city.cName.toLocaleLowerCase()
  const departmentName = department.dName.toLocaleLowerCase()

  // Replace spaces in storeName with hyphens
  const formattedStoreName = storeName.replace(/ /g, '-')

  return `${process.env.MAIN_URL_BASE}/${rootMainPath}/${cityName}-${departmentName}/${formattedStoreName}/${idStore}`
}
