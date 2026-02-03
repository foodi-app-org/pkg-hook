import { useQuery } from '@apollo/client'
import { useState } from 'react'

import { SPANISH_MONTHS } from '../../../utils/index'
import { GET_ALL_SALES } from '../../useReport/queries'

// Función para calcular el total de ventas por mes
const calculateSalesByMonth = (salesData: { pDatCre: string; totalProductsPrice: number }[]) => {
  try {
    const result = Array.from({ length: 12 }, (_, mes) => {
      return {
        Mes: mes,
        Year: new Date().getFullYear(),
        totalProductsPrice: 0
      }
    })

    salesData?.forEach((value: { pDatCre: string; totalProductsPrice: number }) => {
      const mes = new Date(value.pDatCre).getMonth()
      result[mes].totalProductsPrice += value.totalProductsPrice
    })

    return result
  } catch (error) {
    if (error instanceof Error) {
      return []
    }
    return []
  }
}

// Función para llenar los meses faltantes
const fillMissingMonths = (data: { Mes: number; totalProductsPrice: number; Year: string | number }[]) => {
  try {
    const allMonths = Array.from({ length: 12 }, (_, i) => { return i })
    const missingMonths = allMonths.filter(month => { return !data.some(data => { return data.Mes === month }) })
    return data.concat(
      missingMonths.map(element => {
        return {
          Mes: element,
          totalProductsPrice: 0,
          Year: ''
        }
      })
    ).sort((a, b) => { return a.Mes - b.Mes })
  } catch (error) {
    // Optionally log error or handle as needed
    if (error instanceof Error) {
      return []
    }
    return []
  }
}
// eslint-disable-next-line prefer-const
let chartTypeYear = ''
// Función para obtener los datos del gráfico
type SalesMonthData = { Mes: number; totalProductsPrice: number; Year: string | number };
const getChartData = (
  asFilter: boolean,
  newResult: SalesMonthData[],
  result: SalesMonthData[],
  chartType: string
) => {
  return {
    labels: asFilter
      ? newResult.map((data: SalesMonthData) => SPANISH_MONTHS[data.Mes])
      : result.map((data: SalesMonthData) => SPANISH_MONTHS[data.Mes]),
    datasets: [
      {
        label: `Ventas por meses del año ${asFilter ? chartTypeYear : ''}`,
        data: asFilter
          ? newResult.map((data: SalesMonthData) => data.totalProductsPrice)
          : result.map((data: SalesMonthData) => data.totalProductsPrice),
        backgroundColor: [
          'rgba(255, 99, 132, 0.2)',
          'rgba(54, 162, 235, 0.2)',
          'rgba(255, 206, 86, 0.2)',
          'rgba(75, 192, 192, 0.2)',
          'rgba(153, 102, 255, 0.2)',
          'rgba(255, 159, 64, 0.2)'
        ],
        borderColor: chartType === 'bar'
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
}

// Función para agrupar los datos por año
type SaleData = { pDatCre: string; totalProductsPrice: number };
type GroupedSales = { [year: number]: SaleData[] };
export const groupSalesByYear = (salesData: SaleData[] = []): GroupedSales => {
  const groupedData: GroupedSales = {};
  salesData?.forEach((item: SaleData) => {
    const year = new Date(item.pDatCre).getFullYear();
    if (!groupedData[year]) {
      groupedData[year] = [];
    }
    groupedData[year].push(item);
  });
  return groupedData;
}

// Función para obtener años únicos
const getUniqueYears = (salesData: SaleData[] = []): number[] => {
  const years: number[] = [];
  salesData?.forEach((item: SaleData) => {
    const y = new Date(item.pDatCre).getFullYear();
    if (!years.includes(y)) {
      years.push(y);
    }
  });
  return years.sort((a, b) => b - a);
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const useChartData = (_: { year?: number }) => {
  const { data, loading } = useQuery(GET_ALL_SALES);
  const [chartType, setChartType] = useState<string>('Line');
  const [chartTypeYear, setChartTypeYear] = useState<number>(new Date().getFullYear());
  const [asFilter, setFilter] = useState<boolean>(false);
  const [newResult, setNewResult] = useState<SalesMonthData[]>([]);

  const result = calculateSalesByMonth(data?.getAllSalesStore ?? []);
  const filledResult = fillMissingMonths(result);

  const dataChart = getChartData(asFilter, newResult, filledResult, chartType);

  const years = getUniqueYears(data?.getAllSalesStore ?? []);

  const allMonths = Array.from({ length: 12 }, (_, i) => i)

   
  const handleChangeYear = (value: string | number) => {
    setFilter(true);
    const currentYear = Number.parseInt(value as string, 10);
    setChartTypeYear(currentYear);

    if (filledResult?.length > 0) {
      const filterToYear = filledResult.filter((elem: SalesMonthData) => elem?.Year === currentYear);

      const missingNewMonths = allMonths.filter((month: number) =>
        !filterToYear.some((data: SalesMonthData) => data.Mes === month)
      );

      const newFilteredResult = filterToYear.concat(
        missingNewMonths.map((element: number) => ({
          Mes: element,
          totalProductsPrice: 0,
          Year: currentYear
        }))
      ).sort((a, b) => a.Mes - b.Mes);

      setNewResult(newFilteredResult);
      return newFilteredResult;
    }
    return [];
  };

  const cleanFilter = () => {
    setFilter(false);
    setChartTypeYear(new Date().getFullYear());
  };

  const sortYear = () => years.sort((a, b) => b - a);
  const labelTitle = `Ventas por meses del año ${asFilter ? chartTypeYear : ''}`;
  const organiceYears = sortYear();
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
  };
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
    result: filledResult,
    dataChart,
    loading
  };
}
