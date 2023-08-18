import { useGetAllSales } from "../../useSales/useGetAllSales"

export const useChartDataAllOrders = () => {
  const { data, loading } = useGetAllSales({})

  // Objeto para mapear los códigos de estado a sus nombres
  const statusMap = {
    1: 'ACEPTA',
    2: 'PROCESSING',
    3: 'READY',
    4: 'CONCLUDES',
    5: 'RECHAZADOS'
  };

  // Objeto para almacenar los totales por estado
  const totalsByStatus = {};

  // Inicializar totales en 0 para todos los estados
  for (const status in statusMap) {
    totalsByStatus[status] = 0;
  }

  // Procesar los datos y acumular los totales por estado
  data.forEach(item => {
    const status = item.pSState;
    const totalPrice = item.totalProductsPrice;
    totalsByStatus[status] += totalPrice;
  });

  // Preparar los datos en el formato requerido por Chart.js
  const chartLabels = [];
  const chartData = [];

  // Iterar a través del statusMap para llenar los datos
  for (const status in statusMap) {
    const statusLabel = statusMap[status];
    chartLabels.push(statusLabel);
    chartData.push(totalsByStatus[status] || 0);
  }

  const chartJsData = {
    labels: chartLabels,
    datasets: [{
      tension: 2,
      fill: false,
      borderWidth: 1,
      barPercentage: 1,
      barThickness: 50,
      minBarLength: 3,
      label: '',
      data: chartData,
      backgroundColor: [
        '#FF5733', // Reddish color
        '#FFC300', // Yellowish color
        '#FF8C42', // Orange color
        '#138D75', // Gold color
        '#ff0000', // Tomato color
      ],
    }],
  };

  const defaultOptions = {
    animation: {
      animateRotate: true,
      animateScale: true,
    },
    responsive: true,
    maintainAspectRatio: false,
    legend: {
      position: 'bottom',
    },
    tooltips: {
      callbacks: {
        label: (tooltipItem, data) => {
          const dataset = data.datasets[tooltipItem.datasetIndex];
          const total = dataset.data.reduce((previousValue, currentValue) => previousValue + currentValue);
          const currentValue = dataset.data[tooltipItem.index];
          const percentage = ((currentValue / total) * 100).toFixed(2);
          return `${data.labels[tooltipItem.index]}: ${currentValue} (${percentage}%)`;
        },
      },
    },
  };

  return {
    data: loading ? [] : chartJsData,
    option: loading ? [] : defaultOptions
  };
}
