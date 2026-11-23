// Copias exactas de los ENUM de src/database/init.sql (+ migración M03).

/** estado_cita_entrevista_enum */
export enum EstadoCitaEntrevista {
  PROGRAMADA = 'PROGRAMADA',
  ASISTIO = 'ASISTIO',
  FALTO = 'FALTO',
  REPROGRAMADA = 'REPROGRAMADA',
  CANCELADA = 'CANCELADA',
}

/** Estados que el Catolíder/Admin puede marcar desde la lista diaria (P-07). */
export const ESTADOS_MARCADO_RAPIDO = [
  EstadoCitaEntrevista.ASISTIO,
  EstadoCitaEntrevista.FALTO,
  EstadoCitaEntrevista.REPROGRAMADA,
] as const;

/** Estados que ocupan una franja del calendario. */
export const ESTADOS_QUE_OCUPAN_FRANJA = [
  EstadoCitaEntrevista.PROGRAMADA,
  EstadoCitaEntrevista.ASISTIO,
  EstadoCitaEntrevista.FALTO,
];

/** dictamen_entrevista_enum */
export enum DictamenEntrevista {
  RECOMENDADO = 'RECOMENDADO',
  RECOMENDADO_CON_OBSERVACION = 'RECOMENDADO_CON_OBSERVACION',
  NO_RECOMENDADO = 'NO_RECOMENDADO',
}

/** dictamen_psicologico_enum */
export enum DictamenPsicologico {
  APROBADO = 'APROBADO',
  OBSERVADO = 'OBSERVADO',
  NO_HABILITADO = 'NO_HABILITADO',
}

/** poblacion_sugerida_enum (migración M03) */
export enum PoblacionSugerida {
  NINEZ_PRIMERA_INFANCIA = 'NINEZ_PRIMERA_INFANCIA',
  ADULTOS_MAYORES = 'ADULTOS_MAYORES',
  SITUACION_CALLE_ADICCIONES = 'SITUACION_CALLE_ADICCIONES',
  DISCAPACIDAD = 'DISCAPACIDAD',
  SALUD_HOSPITALES = 'SALUD_HOSPITALES',
  CUIDADO_ANIMAL_MEDIO_AMBIENTE = 'CUIDADO_ANIMAL_MEDIO_AMBIENTE',
}

export enum DiaSemana {
  LUNES = 'LUNES',
  MARTES = 'MARTES',
  MIERCOLES = 'MIERCOLES',
  JUEVES = 'JUEVES',
  VIERNES = 'VIERNES',
  SABADO = 'SABADO',
  DOMINGO = 'DOMINGO',
}
