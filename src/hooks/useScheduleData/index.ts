/**
 *
 * Datos del horario.
 */
type ScheduleData = { schDay: number; schHoSta: string; schHoEnd: string };
type CombinedDay = { schDay?: number; day?: number; schHoSta: string; schHoEnd: string };

function calculateDurationInHours(startTime: string, endTime: string): number {
  const startHour = new Date(`2000-01-01T${startTime}:00`);
  const endHour = new Date(`2000-01-01T${endTime}:00`);
  const duration = (endHour.getTime() - startHour.getTime()) / (1000 * 60 * 60); // Convertir la diferencia en horas
  return Number(duration.toFixed(2)); // Redondear a 2 decimales
}

export function useScheduleData(data: ScheduleData[]) {
  const days = {
    1: 'Lunes',
    2: 'Martes',
    3: 'Miércoles',
    4: 'Jueves',
    5: 'Viernes',
    6: 'Sábado',
    0: 'Domingo'
  }

  const daysArray = [
    { day: 0, schHoSta: '', schHoEnd: '' },
    { day: 1, schHoSta: '', schHoEnd: '' },
    { day: 2, schHoSta: '', schHoEnd: '' },
    { day: 3, schHoSta: '', schHoEnd: '' },
    { day: 4, schHoSta: '', schHoEnd: '' },
    { day: 5, schHoSta: '', schHoEnd: '' },
    { day: 6, schHoSta: '', schHoEnd: '' }
  ]

  const combinedArray: CombinedDay[] = daysArray.map((dayObj) => {
    const originalObj = data?.find((item) => item.schDay === dayObj.day);
    if (originalObj) {
      return { ...originalObj };
    }
    return { ...dayObj };
  });

  // Encontrar la hora de inicio más temprana en combinedArray
  const earliestStartTime = Math.min(
    ...combinedArray.map((item) => {
      const time = new Date(`2023-08-01 ${item.schHoSta}`);
      return time.getTime();
    })
  );

  /**
   * Calcula la posición Y basada en la hora de inicio.
   * @param {string} start - Hora de inicio en formato 'HH:mm'.
   * @returns {number} Posición Y calculada.
   */
  const calculateYPosition = (start: string): number => {
    const time = new Date(`2023-08-01 ${start}`);
    const differenceInMinutes = (time.getTime() - earliestStartTime) / (1000 * 60);
    return differenceInMinutes / 40; // Ajusta el valor para adaptarse a la posición deseada en el eje Y
  };

  // Variables para controlar la posición en el eje X
  const columnIndex = 0;
  const lastDay = -1;
  const uniqueHoursSet = new Set([
    ...combinedArray.map((item) => item.schHoSta),
    ...combinedArray.map((item) => item.schHoEnd)
  ]);

  const uniqueHours: string[] = [];
  for (const hour of uniqueHoursSet) {
    const time = new Date(`2023-08-01 ${hour}`);
    const formattedHour = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    uniqueHours.push(formattedHour);
  }

  uniqueHours.sort((a, b) => {
    const timeA = new Date(`2023-08-01 ${a}`).getTime();
    const timeB = new Date(`2023-08-01 ${b}`).getTime();
    return timeA - timeB;
  });

  // Agregar las horas que faltan al final del día
  if (uniqueHours.length > 0) {
    const lastHourStr = uniqueHours.at(-1) ?? uniqueHours.at(-1);
    const lastHour = new Date(`2023-08-01 ${lastHourStr}`);
    const endTime = new Date(`2023-08-01 ${combinedArray[0].schHoEnd}`);
    const hoursDifference = (endTime.getTime() - lastHour.getTime()) / (1000 * 60 * 60);

    for (let i = 1; i <= hoursDifference; i++) {
      const newHour = new Date(lastHour.getTime() + i * 60 * 60 * 1000);
      const formattedNewHour = newHour.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
      uniqueHours.push(formattedNewHour);
    }
  }

  const dayWidth = 120;
  const daysWithHours = Array.from(
    new Set(
      combinedArray
        .map((item) => {
          let dayValue: number | undefined;
          if (typeof item.schDay === 'number') {
            dayValue = item.schDay;
          } else if (typeof item.day === 'number') {
            dayValue = item.day;
          } else {
            dayValue = undefined;
          }
          return dayValue;
        })
        .filter((v): v is number => v !== undefined)
    )
  );
  const totalDays = daysWithHours.length;
  const totalWidth = totalDays * dayWidth;

  const sortedUniqueHours = Array.from(uniqueHoursSet)
    .sort((a, b) => {
      const timeA = new Date(`2023-08-01 ${a}`).getTime();
      const timeB = new Date(`2023-08-01 ${b}`).getTime();
      return timeA - timeB;
    });

  const formattedHours = sortedUniqueHours;

  /**
   * @description Calcula la altura total de las líneas de tiempo basándose en las horas únicas.
   * @returns {number}  Altura total de las líneas de tiempo.
   */
  function calculateTimeLinesHeight(): number {
    const totalHours = uniqueHours.length;
    return totalHours * 60; // Cada hora ocupa 60 píxeles de altura
  }
  return {
    columnIndex,
    combinedArray,
    days,
    daysArray,
    daysWithHours,
    dayWidth,
    lastDay,
    totalWidth,
    sortedUniqueHours,
    uniqueHours: formattedHours,
    calculateDurationInHours,
    calculateTimeLinesHeight,
    calculateYPosition
  };
}
