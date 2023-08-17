import { useQuery } from '@apollo/client';
import { useState } from 'react';
import { SPANISH_MONTHS } from "../../utils/index";
import { GET_ALL_SALES } from "../useReport/queries";

// Función para calcular el total de ventas por mes
const calculateSalesByMonth = (salesData) => {
    try {
    const result = Array.from({ length: 12 }, (_, mes) => ({
          Mes: mes,
          Year: new Date().getFullYear(),
          totalProductsPrice: 0,
        }));
      
        salesData?.forEach((value) => {
          const mes = new Date(value.pDatCre).getMonth();
          result[mes].totalProductsPrice += value.totalProductsPrice;
        });
      
        return result;
    } catch (error) {
      return []   
    }
};

// Función para llenar los meses faltantes
const fillMissingMonths = (data) => {
    try {
        const allMonths = Array.from({ length: 12 }, (_, i) => i);
        const missingMonths = allMonths.filter(month => !data.some(data => data.Mes === month));
        return data.concat(
          missingMonths.map(element => ({
            Mes: element,
            totalProductsPrice: 0,
            Year: '',
          }))
        ).sort((a, b) => a.Mes - b.Mes);
    } catch (error) {
        return []
    }
};

// Función para obtener los datos del gráfico
const getChartData = (asFilter, newResult, result, chartType) => ({
  labels: asFilter
    ? newResult.map(data => SPANISH_MONTHS[data.Mes])
    : result.map(data => SPANISH_MONTHS[data.Mes]),
  datasets: [
    {
      label: `Ventas por meses del año ${asFilter ? chartTypeYear : ''}`,
      data: asFilter
        ? newResult.map(data => data.totalProductsPrice)
        : result.map(data => data.totalProductsPrice),
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
});

// Función para agrupar los datos por año
const groupSalesByYear = (salesData = []) => {
    const groupedData = {};
    try {
        salesData?.forEach((item) => {
          const year = new Date(item.pDatCre).getFullYear();
          if (!groupedData[year]) {
            groupedData[year] = [];
          }
          groupedData[year].push(item);
        });
        return groupedData;
    } catch (error) {
        return groupedData
    }
};

// Función para obtener años únicos
const getUniqueYears = (salesData = []) => {
    try {
        const years = [];
        salesData?.forEach((item) => {
          const y = new Date(item.pDatCre).getFullYear();
          if (!years.includes(y)) {
            years.push(y);
          }
        });
        return years.sort((a, b) => b - a);
    } catch (error) {
        return []
    }
};

export const useChartData = ({ year }) => {
  const { data, loading } = useQuery(GET_ALL_SALES);
  const [chartType, setChartType] = useState('Line');
  const [chartTypeYear, setChartTypeYear] = useState(new Date().getFullYear());
  const [asFilter, setFilter] = useState(false);
  const [newResult, setNewResult] = useState([]);

  const result = calculateSalesByMonth(data?.getAllSalesStore);

  const filledResult = fillMissingMonths(result);

  const dataChart = getChartData(asFilter, newResult, filledResult, chartType);

  const groupedData = groupSalesByYear(data?.getAllSalesStore);
  const years = getUniqueYears(data?.getAllSalesStore);

const handleChangeYear = (value) => {
    setFilter(true);
    const currentYear = parseInt(value);
    setChartTypeYear(currentYear || '');
  
    if (filledResult?.length > 0) {
      const filterToYear = filledResult.filter((elem) => elem?.Year === currentYear);
      const missingNewMonths = allMonths.filter(month => !filterToYear.some(data => data.Mes === month));
  
      const newFilteredResult = filterToYear.concat(
        missingNewMonths.map(element => ({
          Mes: element,
          totalProductsPrice: 0,
          Year: '',
        }))
      ).sort((a, b) => a.Mes - b.Mes);
  
      setNewResult(newFilteredResult);
      return newFilteredResult;
    }
  };
  
  const cleanFilter = () => {
    setFilter(false);
    setChartTypeYear(new Date().getFullYear());
  };
  
  const sortYear = () => years.sort((a, b) => b - a);
  const labelTitle = `Ventas por meses del año ${asFilter ? chartTypeYear : ''}`
  const organiceYears = sortYear();
  const options =  {
    interaction: {
      mode: 'index',
      intersect: false,
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
      },
    }
  }
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
    loading,
  };
  };
  