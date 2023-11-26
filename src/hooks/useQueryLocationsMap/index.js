import { useLazyQuery } from '@apollo/client'
import { GET_ONE_COUNTRY, GET_ONE_DEPARTMENT, GET_ONE_CITY } from './queries'

const useGetOneCountry = () => {
  const [getOneCountry, { data: dataCountry }] = useLazyQuery(GET_ONE_COUNTRY)
  return { getOneCountry, dataCountry }
}

const useGetOneDepartment = () => {
  const [getOneDepartment, { data: dataDepartment }] = useLazyQuery(GET_ONE_DEPARTMENT)
  return { getOneDepartment, dataDepartment }
}

const useGetOneCity = () => {
  const [getOneCities, { data: dataGetOneCity }] = useLazyQuery(GET_ONE_CITY)
  return { getOneCities, dataGetOneCity }
}

export { useGetOneCountry, useGetOneDepartment, useGetOneCity }
