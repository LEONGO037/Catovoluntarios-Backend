import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { AlmacenamientoLocalService } from '../../simulados-m03/almacenamiento-local.service';
import { LecturasExternasService } from '../../simulados-m03/lecturas-externas.service';
import {
  ActualizarEvaluacionPsicologicaDto,
  CrearEvaluacionPsicologicaDto,
  FiltroEvaluacionesDto,
} from './dtos/evaluacion-psicologica.dto';
import { EntrevistaEntity } from './entities/entrevista.entity';
import {
  EvaluacionPsicologicaEntity,
  SubdimensionesEsre,
} from './entities/evaluacion-psicologica.entity';
import { EstadoCitaEntrevista } from './enums/entrevistas.enums';
import { aPostulanteCita } from './entrevistas.service';
import {
  EvaluacionListado,
  EvaluacionVista,
  FichaPsicologica,
  PostulanteEvaluable,
} from './types/respuestas.types';
import { UsuarioAutenticado } from './types/usuario-autenticado';

/** Archivo recibido por multer (solo los campos que se usan). */
export interface ArchivoSubido {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

export function nombreInformeEsperado(ci: string): string {
  return `Informe_Psicologico_${ci}.pdf`;
}

/** P-09 — Evaluación psicológica E-SRE. Uso exclusivo de Administración Pastoral. */
@Injectable()
export class PsicologiaService {
  constructor(
    @InjectRepository(EvaluacionPsicologicaEntity)
    private readonly evaluaciones: Repository<EvaluacionPsicologicaEntity>,
    @InjectRepository(EntrevistaEntity)
    private readonly entrevistas: Repository<EntrevistaEntity>,
    private readonly lecturas: LecturasExternasService,
    private readonly almacenamiento: AlmacenamientoLocalService,
  ) {}

  /** Postulantes que ya asistieron a su entrevista. */
  async listarPostulantes(): Promise<PostulanteEvaluable[]> {
    const asistidas = await this.entrevistas.find({
      where: { estado: EstadoCitaEntrevista.ASISTIO },
      order: { fechaHoraProgramada: 'DESC' },
    });
    const ids = asistidas.map((e) => e.postulacionId);
    const [postulantes, evaluaciones] = await Promise.all([
      this.lecturas.obtenerPostulantes(ids),
      ids.length > 0
        ? this.evaluaciones.find({ where: { postulacionId: In(ids) } })
        : Promise.resolve([]),
    ]);
    const porPostulacion = new Map(evaluaciones.map((e) => [e.postulacionId, e]));

    return asistidas.flatMap((e) => {
      const postulante = postulantes.get(e.postulacionId);
      if (!postulante) return [];
      const evaluacion = porPostulacion.get(e.postulacionId);
      return [
        {
          ...aPostulanteCita(postulante),
          fechaEntrevista: e.fechaHoraProgramada.toISOString(),
          dictamenEntrevista: e.dictamen,
          evaluacion: evaluacion ? { id: evaluacion.id, dictamen: evaluacion.dictamen } : null,
        },
      ];
    });
  }

  async obtenerFicha(postulacionId: number): Promise<FichaPsicologica> {
    const postulante = await this.lecturas.obtenerPostulante(postulacionId);
    const [entrevista, evaluacion] = await Promise.all([
      this.entrevistas.findOne({ where: { postulacionId } }),
      this.evaluaciones.findOne({ where: { postulacionId } }),
    ]);
    return {
      postulante: aPostulanteCita(postulante),
      fechaEntrevista:
        entrevista?.estado === EstadoCitaEntrevista.ASISTIO
          ? entrevista.fechaHoraProgramada.toISOString()
          : null,
      dictamenEntrevista: entrevista?.dictamen ?? null,
      nombreInformeEsperado: nombreInformeEsperado(postulante.ci),
      evaluacion: evaluacion ? await this.aVista(evaluacion) : null,
    };
  }

  async crear(
    usuario: UsuarioAutenticado,
    dto: CrearEvaluacionPsicologicaDto,
    archivo: ArchivoSubido | undefined,
  ): Promise<EvaluacionVista> {
    const postulante = await this.lecturas.obtenerPostulante(dto.postulacionId);
    const entrevista = await this.entrevistas.findOne({
      where: { postulacionId: dto.postulacionId },
    });
    if (entrevista?.estado !== EstadoCitaEntrevista.ASISTIO) {
      throw new BadRequestException('El postulante todavía no asistió a su entrevista');
    }
    if (await this.evaluaciones.exists({ where: { postulacionId: dto.postulacionId } })) {
      throw new ConflictException('Este postulante ya tiene una evaluación; edítala en lugar de crear otra');
    }
    const nombre = this.validarPdf(archivo, postulante.ci);
    const referencia = await this.almacenamiento.guardar(
      `psicologia/${dto.postulacionId}`,
      nombre,
      (archivo as ArchivoSubido).buffer,
    );

    const evaluacion = this.evaluaciones.create({
      postulacionId: dto.postulacionId,
      registradoPorId: usuario.id,
      puntajeGlobalEsre: dto.puntajeGlobalEsre,
      subdimensionesEsre: this.subdimensiones(dto, null),
      dictamen: dto.dictamen,
      poblacionesSugeridas: dto.poblacionesSugeridas,
      observacionesConfidenciales: dto.observacionesConfidenciales ?? null,
      informePdfUrl: referencia,
    });
    return this.aVista(await this.evaluaciones.save(evaluacion));
  }

  async actualizar(
    id: number,
    dto: ActualizarEvaluacionPsicologicaDto,
    archivo: ArchivoSubido | undefined,
  ): Promise<EvaluacionVista> {
    const evaluacion = await this.buscar(id);
    if (archivo) {
      const postulante = await this.lecturas.obtenerPostulante(evaluacion.postulacionId);
      const nombre = this.validarPdf(archivo, postulante.ci);
      evaluacion.informePdfUrl = await this.almacenamiento.guardar(
        `psicologia/${evaluacion.postulacionId}`,
        nombre,
        archivo.buffer,
      );
    }
    if (dto.puntajeGlobalEsre !== undefined) evaluacion.puntajeGlobalEsre = dto.puntajeGlobalEsre;
    if (dto.dictamen !== undefined) evaluacion.dictamen = dto.dictamen;
    if (dto.poblacionesSugeridas !== undefined) {
      evaluacion.poblacionesSugeridas = dto.poblacionesSugeridas;
    }
    if (dto.observacionesConfidenciales !== undefined) {
      evaluacion.observacionesConfidenciales = dto.observacionesConfidenciales;
    }
    evaluacion.subdimensionesEsre = this.subdimensiones(dto, evaluacion.subdimensionesEsre);
    return this.aVista(await this.evaluaciones.save(evaluacion));
  }

  async leerInforme(id: number): Promise<{ contenido: Buffer; nombre: string }> {
    const evaluacion = await this.buscar(id);
    return {
      contenido: await this.almacenamiento.leer(evaluacion.informePdfUrl),
      nombre: this.nombreDeReferencia(evaluacion.informePdfUrl),
    };
  }

  /** Consulta por población sugerida y/o dictamen (insumo para Ubicación de Voluntarios). */
  async listarEvaluaciones(filtro: FiltroEvaluacionesDto): Promise<EvaluacionListado[]> {
    const consulta = this.evaluaciones.createQueryBuilder('ev').orderBy('ev.id', 'ASC');
    if (filtro.poblacion) {
      consulta.andWhere('CAST(:poblacion AS poblacion_sugerida_enum) = ANY(ev.poblaciones_sugeridas)', {
        poblacion: filtro.poblacion,
      });
    }
    if (filtro.dictamen) {
      consulta.andWhere('ev.dictamen = :dictamen', { dictamen: filtro.dictamen });
    }
    const filas = await consulta.getMany();
    const postulantes = await this.lecturas.obtenerPostulantes(filas.map((f) => f.postulacionId));
    return filas.flatMap((f) => {
      const postulante = postulantes.get(f.postulacionId);
      if (!postulante) return [];
      return [
        {
          id: f.id,
          postulante: aPostulanteCita(postulante),
          puntajeGlobalEsre: f.puntajeGlobalEsre,
          dictamen: f.dictamen,
          poblacionesSugeridas: f.poblacionesSugeridas,
        },
      ];
    });
  }

  // ---------- Auxiliares ----------

  private async buscar(id: number): Promise<EvaluacionPsicologicaEntity> {
    const evaluacion = await this.evaluaciones.findOne({ where: { id } });
    if (!evaluacion) {
      throw new NotFoundException(`Evaluación ${id} no encontrada`);
    }
    return evaluacion;
  }

  private validarPdf(archivo: ArchivoSubido | undefined, ci: string): string {
    if (!archivo) {
      throw new BadRequestException('El informe psicológico en PDF es obligatorio');
    }
    const esperado = nombreInformeEsperado(ci);
    if (archivo.originalname !== esperado) {
      throw new BadRequestException(`El archivo debe llamarse exactamente ${esperado}`);
    }
    const firmaPdf = archivo.buffer.subarray(0, 5).toString('latin1') === '%PDF-';
    if (archivo.mimetype !== 'application/pdf' || !firmaPdf) {
      throw new BadRequestException('El archivo debe ser un PDF válido');
    }
    return esperado;
  }

  private subdimensiones(
    dto: Partial<SubdimensionesEsre>,
    actuales: SubdimensionesEsre | null,
  ): SubdimensionesEsre | null {
    const resultado = {
      socializacion: dto.socializacion ?? actuales?.socializacion,
      eficacia: dto.eficacia ?? actuales?.eficacia,
      proactividad: dto.proactividad ?? actuales?.proactividad,
      gestionPersonal: dto.gestionPersonal ?? actuales?.gestionPersonal,
    };
    const valores = Object.values(resultado);
    if (valores.every((v) => v === undefined)) return null;
    return resultado as SubdimensionesEsre;
  }

  private nombreDeReferencia(referencia: string): string {
    const partes = referencia.split('/');
    return partes[partes.length - 1];
  }

  private async aVista(e: EvaluacionPsicologicaEntity): Promise<EvaluacionVista> {
    const nombres = await this.lecturas.obtenerNombresUsuarios(
      e.registradoPorId !== null ? [e.registradoPorId] : [],
    );
    return {
      id: e.id,
      postulacionId: e.postulacionId,
      puntajeGlobalEsre: e.puntajeGlobalEsre,
      subdimensionesEsre: e.subdimensionesEsre,
      dictamen: e.dictamen,
      poblacionesSugeridas: e.poblacionesSugeridas,
      observacionesConfidenciales: e.observacionesConfidenciales,
      registradoPorId: e.registradoPorId,
      registradoPorNombre:
        e.registradoPorId !== null ? (nombres.get(e.registradoPorId) ?? null) : null,
      nombreInforme: this.nombreDeReferencia(e.informePdfUrl),
    };
  }
}
