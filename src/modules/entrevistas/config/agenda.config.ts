/**
 * Franjas de entrevista configurables por variables de entorno.
 * Por defecto: lunes a viernes, 12:00 a 17:00, bloques de 20 minutos,
 * hora de La Paz (UTC-4, sin horario de verano).
 */
export interface AgendaConfig {
  /** Días ISO: 1 = lunes … 7 = domingo */
  dias: number[];
  horaInicio: string; // HH:mm
  horaFin: string; // HH:mm
  duracionMinutos: number;
  /** Desplazamiento fijo respecto de UTC, formato ±HH:mm */
  zonaHoraria: string;
}

export function obtenerAgendaConfig(): AgendaConfig {
  const dias = (process.env.AGENDA_DIAS ?? '1,2,3,4,5')
    .split(',')
    .map((d) => parseInt(d.trim(), 10))
    .filter((d) => d >= 1 && d <= 7);

  return {
    dias: dias.length > 0 ? dias : [1, 2, 3, 4, 5],
    horaInicio: process.env.AGENDA_HORA_INICIO ?? '12:00',
    horaFin: process.env.AGENDA_HORA_FIN ?? '17:00',
    duracionMinutos: parseInt(process.env.AGENDA_DURACION_MINUTOS ?? '20', 10) || 20,
    zonaHoraria: process.env.AGENDA_ZONA_HORARIA ?? '-04:00',
  };
}
