import { AgendaConfig } from '../config/agenda.config';

/**
 * Utilidades de fecha para la agenda de entrevistas.
 * Se trabaja con un desplazamiento fijo respecto de UTC (La Paz = -04:00),
 * así el resultado no depende de la zona horaria del servidor.
 */

const MS_DIA = 24 * 60 * 60 * 1000;

function desplazamientoMinutos(zonaHoraria: string): number {
  const coincidencia = /^([+-])(\d{2}):(\d{2})$/.exec(zonaHoraria);
  if (!coincidencia) return 0;
  const signo = coincidencia[1] === '-' ? -1 : 1;
  return signo * (parseInt(coincidencia[2], 10) * 60 + parseInt(coincidencia[3], 10));
}

function aMinutos(hora: string): number {
  const [h, m] = hora.split(':').map((v) => parseInt(v, 10));
  return h * 60 + m;
}

function dosDigitos(n: number): string {
  return n.toString().padStart(2, '0');
}

/** Instante (Date) que corresponde a una fecha y hora locales de la agenda. */
export function instanteLocal(fecha: string, hora: string, zonaHoraria: string): Date {
  return new Date(`${fecha}T${hora}:00${zonaHoraria}`);
}

/** Fecha local 'YYYY-MM-DD' de un instante. */
export function fechaLocal(instante: Date, zonaHoraria: string): string {
  const local = new Date(instante.getTime() + desplazamientoMinutos(zonaHoraria) * 60000);
  return `${local.getUTCFullYear()}-${dosDigitos(local.getUTCMonth() + 1)}-${dosDigitos(local.getUTCDate())}`;
}

/** Hora local 'HH:mm' de un instante. */
export function horaLocal(instante: Date, zonaHoraria: string): string {
  const local = new Date(instante.getTime() + desplazamientoMinutos(zonaHoraria) * 60000);
  return `${dosDigitos(local.getUTCHours())}:${dosDigitos(local.getUTCMinutes())}`;
}

/** Día ISO (1 = lunes … 7 = domingo) de una fecha 'YYYY-MM-DD'. */
export function diaIso(fecha: string): number {
  const dia = new Date(`${fecha}T00:00:00Z`).getUTCDay();
  return dia === 0 ? 7 : dia;
}

export function sumarDias(fecha: string, dias: number): string {
  const base = new Date(`${fecha}T00:00:00Z`).getTime() + dias * MS_DIA;
  const d = new Date(base);
  return `${d.getUTCFullYear()}-${dosDigitos(d.getUTCMonth() + 1)}-${dosDigitos(d.getUTCDate())}`;
}

/** Lunes de la semana a la que pertenece la fecha. */
export function lunesDeSemana(fecha: string): string {
  return sumarDias(fecha, 1 - diaIso(fecha));
}

/** Rango [desde, hasta) de un día local. */
export function rangoDelDia(fecha: string, zonaHoraria: string): { desde: Date; hasta: Date } {
  const desde = instanteLocal(fecha, '00:00', zonaHoraria);
  return { desde, hasta: new Date(desde.getTime() + MS_DIA) };
}

/** Horas de inicio de cada franja del día, p. ej. ['12:00', '12:20', …]. */
export function horasDeFranja(config: AgendaConfig): string[] {
  const horas: string[] = [];
  const fin = aMinutos(config.horaFin);
  for (let m = aMinutos(config.horaInicio); m + config.duracionMinutos <= fin; m += config.duracionMinutos) {
    horas.push(`${dosDigitos(Math.floor(m / 60))}:${dosDigitos(m % 60)}`);
  }
  return horas;
}

/** true si el instante coincide exactamente con el inicio de una franja configurada. */
export function esInicioDeFranja(instante: Date, config: AgendaConfig): boolean {
  if (instante.getUTCSeconds() !== 0 || instante.getUTCMilliseconds() !== 0) return false;
  const fecha = fechaLocal(instante, config.zonaHoraria);
  if (!config.dias.includes(diaIso(fecha))) return false;
  return horasDeFranja(config).includes(horaLocal(instante, config.zonaHoraria));
}

export function esFechaValida(fecha: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return false;
  const d = new Date(`${fecha}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().startsWith(fecha);
}
