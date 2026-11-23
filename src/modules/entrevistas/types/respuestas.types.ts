import {
  DictamenEntrevista,
  DictamenPsicologico,
  EstadoCitaEntrevista,
  PoblacionSugerida,
} from '../enums/entrevistas.enums';
import { HorarioDisponible } from '../entities/entrevista.entity';
import { SubdimensionesEsre } from '../entities/evaluacion-psicologica.entity';
import { CatoliderActivo } from '../../../simulados-m03/lecturas-externas.service';

// ---------- P-07 ----------
export interface FranjaDisponible {
  inicio: string; // ISO 8601
  hora: string; // HH:mm local
  capacidad: number;
  ocupadas: number;
  disponible: boolean;
}

export interface DiaAgenda {
  fecha: string; // YYYY-MM-DD
  diaIso: number;
  franjas: FranjaDisponible[];
}

export interface DisponibilidadSemanal {
  semanaInicio: string;
  horaInicio: string;
  horaFin: string;
  duracionMinutos: number;
  zonaHoraria: string;
  dias: DiaAgenda[];
}

export interface PostulanteCita {
  postulacionId: number;
  codigoPostulacion: string;
  nombreCompleto: string;
  ci: string;
  carrera: string;
  edad: number;
}

export interface CitaVista {
  id: number;
  fechaHora: string; // ISO 8601
  fecha: string; // YYYY-MM-DD local
  hora: string; // HH:mm local
  estado: EstadoCitaEntrevista;
  catoliderId: number | null;
  catoliderNombre: string | null;
  postulante: PostulanteCita;
  fichaRegistrada: boolean;
  puedeGestionar: boolean;
}

export interface CitasDelDia {
  fecha: string;
  catolideres: CatoliderActivo[];
  citas: CitaVista[];
}

export interface MiEntrevista {
  postulacion: {
    codigoPostulacion: string;
    estadoPostulacion: string;
    nombreCompleto: string;
  } | null;
  entrevista: CitaVista | null;
}

// ---------- P-08 ----------
export interface FichaEntrevista {
  observacionesMotivacion: string | null;
  manejoTransporte: string | null;
  tiempoSemanal: string | null;
  horariosDisponibles: HorarioDisponible[];
  observacionesCompromiso: string | null;
  observacionesTrabajoEquipo: string | null;
  aperturaReligiosaEscala: number | null;
  observacionesRecomendaciones: string | null;
  proyectoReceptorSugeridoId: number | null;
  proyectoReceptorSugeridoNombre: string | null;
  dictamen: DictamenEntrevista | null;
}

export interface DetalleEntrevista {
  cita: CitaVista;
  ficha: FichaEntrevista;
}

// ---------- P-09 ----------
export interface PostulanteEvaluable extends PostulanteCita {
  fechaEntrevista: string;
  dictamenEntrevista: DictamenEntrevista | null;
  evaluacion: { id: number; dictamen: DictamenPsicologico } | null;
}

export interface EvaluacionVista {
  id: number;
  postulacionId: number;
  puntajeGlobalEsre: number | null;
  subdimensionesEsre: SubdimensionesEsre | null;
  dictamen: DictamenPsicologico;
  poblacionesSugeridas: PoblacionSugerida[];
  observacionesConfidenciales: string | null;
  registradoPorId: number | null;
  registradoPorNombre: string | null;
  nombreInforme: string;
}

export interface FichaPsicologica {
  postulante: PostulanteCita;
  fechaEntrevista: string | null;
  dictamenEntrevista: DictamenEntrevista | null;
  nombreInformeEsperado: string;
  evaluacion: EvaluacionVista | null;
}

export interface EvaluacionListado {
  id: number;
  postulante: PostulanteCita;
  puntajeGlobalEsre: number | null;
  dictamen: DictamenPsicologico;
  poblacionesSugeridas: PoblacionSugerida[];
}
