export const completeSchedules = (dataSchedules: { schDay: number; schHoSta: string; schHoEnd: string }[]) => {
  // Días de la semana
  const daysSemana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']

  // Mapear los horarios existentes para crear un mapa por día
  const horariosPorDia = dataSchedules.reduce((mapa, horario) => {
    const day = daysSemana[horario.schDay]
    if (!mapa[day]) {
      mapa[day] = []
    }
    mapa[day].push({ horaInicio: horario.schHoSta, horaFin: horario.schHoEnd })
    return mapa
  }, {} as Record<string, { horaInicio: string; horaFin: string }[]>)

  // Completar los días que faltan y formatear el objeto
  const horariosFormateados = daysSemana.map((day) => {return {
    day,
    horarios: horariosPorDia[day] || [{ horaInicio: '', horaFin: '' }]
  }})

  return horariosFormateados
}
