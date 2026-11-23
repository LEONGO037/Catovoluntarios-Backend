/** Utilidades puras del módulo M06 (sin dependencias de base de datos, fáciles de probar). */

export type NivelVoluntario = 'JUNIOR' | 'PRO' | 'SUPER_PRO';

/** Minutos desde medianoche para una hora 'HH:MM' o 'HH:MM:SS'. */
export function minutosDelDia(hora: string): number {
  const [h, m] = hora.split(':').map((p) => parseInt(p, 10));
  return h * 60 + m;
}

/** Horas entre ingreso y salida, redondeadas a 2 decimales. Devuelve null si el rango no es válido. */
export function calcularHoras(horaIngreso: string, horaSalida: string): number | null {
  const diff = minutosDelDia(horaSalida) - minutosDelDia(horaIngreso);
  if (diff <= 0) return null;
  return Math.round((diff / 60) * 100) / 100;
}

/** RF-21: Junior 0–39 h, Pro 40–59 h, Super Pro 60+ h. */
export function calcularNivel(horas: number): NivelVoluntario {
  if (horas >= 60) return 'SUPER_PRO';
  if (horas >= 40) return 'PRO';
  return 'JUNIOR';
}

/** Horas que faltan para el siguiente nivel (0 si ya es Super Pro). */
export function horasParaSiguienteNivel(horas: number): number {
  if (horas >= 60) return 0;
  const meta = horas >= 40 ? 60 : 40;
  return Math.round((meta - horas) * 100) / 100;
}

/** Fecha local AAAA-MM-DD (evita desfases de zona horaria de toISOString). */
export function fechaLocalISO(fecha: Date = new Date()): string {
  const y = fecha.getFullYear();
  const m = String(fecha.getMonth() + 1).padStart(2, '0');
  const d = String(fecha.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Primer y último día (AAAA-MM-DD) de un mes. */
export function rangoMes(mes: number, anio: number): { desde: string; hasta: string } {
  const ultimo = new Date(anio, mes, 0).getDate();
  const mm = String(mes).padStart(2, '0');
  return { desde: `${anio}-${mm}-01`, hasta: `${anio}-${mm}-${String(ultimo).padStart(2, '0')}` };
}

export const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

const UNIDADES = [
  '', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve', 'diez',
  'once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete', 'dieciocho',
  'diecinueve', 'veinte', 'veintiuno', 'veintidós', 'veintitrés', 'veinticuatro',
  'veinticinco', 'veintiséis', 'veintisiete', 'veintiocho', 'veintinueve',
];
const DECENAS = ['', '', '', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa'];
const CENTENAS = [
  '', 'ciento', 'doscientos', 'trescientos', 'cuatrocientos', 'quinientos',
  'seiscientos', 'setecientos', 'ochocientos', 'novecientos',
];

function menorAMil(n: number): string {
  if (n === 0) return '';
  if (n === 100) return 'cien';
  const c = Math.floor(n / 100);
  const resto = n % 100;
  let texto = CENTENAS[c];
  if (resto > 0) {
    let parte: string;
    if (resto < 30) parte = UNIDADES[resto];
    else {
      const d = Math.floor(resto / 10);
      const u = resto % 10;
      parte = DECENAS[d] + (u ? ` y ${UNIDADES[u]}` : '');
    }
    texto = texto ? `${texto} ${parte}` : parte;
  }
  return texto;
}

function enteroALetras(n: number): string {
  if (n === 0) return 'cero';
  const millones = Math.floor(n / 1_000_000);
  const miles = Math.floor((n % 1_000_000) / 1000);
  const resto = n % 1000;
  const partes: string[] = [];
  if (millones) partes.push(millones === 1 ? 'un millón' : `${enteroALetras(millones)} millones`);
  if (miles) partes.push(miles === 1 ? 'mil' : `${menorAMil(miles)} mil`);
  if (resto) partes.push(menorAMil(resto));
  return partes.join(' ').replace(/veintiuno mil/g, 'veintiún mil').replace(/uno mil/g, 'un mil');
}

/** Monto en letras para la planilla 'Recibí Conforme'. Ej.: 54 → "Cincuenta y cuatro 00/100 Bolivianos". */
export function montoEnLetras(monto: number): string {
  const entero = Math.floor(monto);
  const centavos = Math.round((monto - entero) * 100);
  const texto = enteroALetras(entero);
  return `${texto.charAt(0).toUpperCase()}${texto.slice(1)} ${String(centavos).padStart(2, '0')}/100 Bolivianos`;
}

/** Mensaje de gamificación del portal (P-18) según el avance hacia la meta semestral. */
export function mensajeMotivacional(nombre: string, horasSemestre: number, metaSemestre: number): string {
  const pct = metaSemestre > 0 ? Math.round((horasSemestre / metaSemestre) * 100) : 0;
  if (horasSemestre === 0) return `¡Bienvenido(a), ${nombre}! Tu primera jornada te espera 🙌`;
  if (pct >= 100) return `¡Eres un crack, ${nombre}! Ya cumpliste tu meta del semestre 🏆`;
  if (pct >= 75) return `¡Casi lo logras, ${nombre}! Llevas el ${pct}% de tus horas del semestre ❤️`;
  if (pct >= 40) return `¡Vas muy bien, ${nombre}! Ya completaste el ${pct}% de tu meta 💪`;
  return `¡Cada jornada cuenta, ${nombre}! Llevas ${horasSemestre} h este semestre ✨`;
}
