export const completeSchedules = (dataSchedules) => {
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
  }, {})

  // Completar los días que faltan y formatear el objeto
  const horariosFormateados = daysSemana.map((day, index) => ({
    day,
    horarios: horariosPorDia[day] || [{ horaInicio: '', horaFin: '' }]
  }))

  return horariosFormateados
}
