import { useQuery } from '@apollo/client'
import { useState } from 'react'

import { SPANISH_MONTHS } from '../../utils/index'
import { GET_ALL_SALES } from '../useReport/queries'
export * from './useChartDataAllOrders'

type Sale = {
  pDatCre: string | Date
  totalProductsPrice: number
}

type ResultItem = {
  Mes: number
  Year: number | string
  totalProductsPrice: number
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const useChartData = (_: { year?: number }) => {
  const { data, loading } = useQuery(GET_ALL_SALES)
  const [chartType, setChartType] = useState<string>('line')
  const [chartTypeYear, setChartTypeYear] = useState<number>(new Date().getFullYear())
  const [asFilter, setFilter] = useState<boolean>(false)
  const [newResult, setNewResult] = useState<ResultItem[]>([])
  const result: ResultItem[] = []
  const sumByMonth: { [key: string]: ResultItem } = {}

  data?.getAllSalesStore?.forEach(function (value: Sale) {
    const month = new Date(value.pDatCre).getMonth()
    const year = new Date(value.pDatCre).getFullYear()
    const key = `${month}-${year}`

    if (!sumByMonth[key]) {
      sumByMonth[key] = {
        Mes: month,
        Year: year,
        totalProductsPrice: 0
      }

      result.push(sumByMonth[key])
    }

    sumByMonth[key].totalProductsPrice += value.totalProductsPrice
  })

  const allMonths = Array.from({ length: 12 }, (_, i) => i)
  const missingMonths = allMonths.filter(month => !result.some(data => data.Mes === month))

  for (const element of missingMonths) {
    result.push({
      Mes: element,
      totalProductsPrice: 0,
      Year: ''
    })
  }

  result.sort((a, b) => a.Mes - b.Mes)

  const labelTitle = `Ventas por meses del año ${asFilter ? chartTypeYear : ''}`
  // Resultado:
  const dataChart = {
    labels: asFilter
      ? newResult.map((data) => SPANISH_MONTHS[data.Mes])
      : result.map((data) => SPANISH_MONTHS[data.Mes]),
    datasets: [
      {
        label: labelTitle,
        data: asFilter
          ? newResult.map((data) => data?.totalProductsPrice)
          : result.map((data) => data?.totalProductsPrice),
        backgroundColor: [
          'rgba(255, 99, 132, 0.2)',
          'rgba(54, 162, 235, 0.2)',
          'rgba(255, 206, 86, 0.2)',
          'rgba(75, 192, 192, 0.2)',
          'rgba(153, 102, 255, 0.2)',
          'rgba(255, 159, 64, 0.2)'
        ],
        borderColor:
          chartType === 'bar'
            ? [
                'rgba(255, 99, 132, 1)',
                'rgba(54, 162, 235, 1)',
                'rgba(255, 206, 86, 1)',
                'rgba(75, 192, 192, 1)',
                'rgba(153, 102, 255, 1)',
                'rgba(255, 159, 64, 1)'
              ]
            : 'rgb(255 0 0)',
        tension: 0.6,
        fill: false,
        borderWidth: 1,
        barPercentage: 1,
        barThickness: 50,
        minBarLength: 3
      }
    ]
  }
  const options = {
    interaction: {
      mode: 'index',
      intersect: false
    },
    scales: {
      x: {
        stacked: true
      },
      y: {
        stacked: true
      }
    },
    plugins: {
      title: {
        display: true,
        text: labelTitle
      }
    }
  }
  const groupedData: { [year: number]: Sale[] } = {}

  if (data?.getAllSalesStore?.length) {
    data.getAllSalesStore.forEach((item: Sale) => {
      const year = new Date(item.pDatCre).getFullYear()
      if (!groupedData[year]) {
        groupedData[year] = []
      }
      groupedData[year].push(item)
    })
  }
  const years: number[] = []

  if (data?.getAllSalesStore?.length) {
    data.getAllSalesStore.forEach((item: Sale) => {
      const y = new Date(item.pDatCre).getFullYear()
      if (!years.includes(y)) {
        years.push(y)
      }
    })
  }
  const handleChangeYear = (value: string | number) => {
    setFilter(true)
    const currentYear = Number.parseInt(value as string)
    setChartTypeYear(currentYear || new Date().getFullYear())
    if (result?.length > 0) {
      const filterToYear = result.filter((elem) => {
        return elem?.Year === currentYear
      })
      const missingNewMonths = allMonths.filter(
        (month) => !filterToYear.some((data) => data.Mes === month)
      )
      for (const element of missingNewMonths) {
        filterToYear.push({
          Mes: element,
          totalProductsPrice: 0,
          Year: ''
        })
      }
      filterToYear.sort((a, b) => a.Mes - b.Mes)
      setNewResult(filterToYear)
      return filterToYear
    }
    return []
  }
  const cleanFilter = () => {
    setFilter(false)
    setChartTypeYear(new Date().getFullYear())
  }
  const sortYear = () => {
    return years.sort((a, b) => b - a)
  }

  const organiceYears = sortYear()
  return {
    handleChangeYear,
    setFilter,
    cleanFilter,
    setChartType,
    years: organiceYears,
    asFilter,
    chartTypeYear,
    options,
    chartType,
    labelTitle,
    result,
    dataChart,
    loading
  }
}
