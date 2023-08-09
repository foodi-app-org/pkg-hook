export const getDayFromOpeningKey = (key) => {
    const days = {
        openingSun: 0,
        openingMon: 1,
        openingTue: 2,
        openingWed: 3,
        openingThu: 4,
        openingFri: 5,
        openingSat: 6
    };
    return days[key];
}

// Función para convertir el objeto de tiempo en una cadena de tiempo
export function getTimeString(timeStr) {
    if (!timeStr) return '00:00';
    return timeStr;
}


export function getCurrentDayAndTime() {
    try {
        const date = new Date();
        const currentTime = date.getHours() * 60 + date.getMinutes();
        const currentDayOfWeek = date.getDay();
        return { currentTime, currentDayOfWeek };
    } catch (error) {
        return {

        }
    }
}

export function getTimeObject(timeStr) {
    try {
        if (!timeStr) return '00:00'
        const [hours, minutes] = timeStr.split(':').map(str => parseInt(str));
        return { hours, minutes };
    } catch (e) {
        return {};
    }
}

export function sortOpeningsByDay(openings) {
    const days = [
        'openingSun',
        'openingMon',
        'openingTue',
        'openingWed',
        'openingThu',
        'openingFri',
        'openingSat'
    ]
    const sortedOpenings = {};

    days.forEach((day) => {
        sortedOpenings[day] = openings[day] || '00:00 - 00:00'; // Agregar horario vacío para los días faltantes
    });

    return sortedOpenings;
}

// Función para obtener la clave de openings a partir del día de la semana
export function getOpeningKeyFromDay(day) {
    const days = {
        0: 'openingSun',
        1: 'openingMon',
        2: 'openingTue',
        3: 'openingWed',
        4: 'openingThu',
        5: 'openingFri',
        6: 'openingSat'
    };
    return days[day];
}
export const weekDays = [
    'Domingo',
    'Lunes',
    'Martes',
    'Miércoles',
    'Jueves',
    'Viernes',
    'Sábado'
]

export function timeToInt(text) {
    let hour = parseInt(text.substring(0, 2));
    let minute = parseInt(text.substring(3));
    return hour * 60 + minute;
}

export const days = {
    Monday: 'Lunes',
    Tuesday: 'Martes',
    Wednesday: 'Miércoles',
    Thursday: 'Jueves',
    Friday: 'Viernes',
    Saturday: 'Sábado',
    Sunday: 'Domingo'
  };