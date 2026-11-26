import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReporteSemaforoEntity } from './entities/reporte-semaforo.entity';
import { PremioHistoricoEntity } from './entities/premio-historico.entity';
import { EvaluacionProyectoEntity } from './entities/evaluacion-proyecto.entity';
import { CertificadoFundacionEntity } from './entities/certificado-fundacion.entity';
import { UserEntity } from '../users/entities/user.entity';
import { AsignacionUbicacionEntity } from '../ubicacion/entities/asignacion-ubicacion.entity';
import { ProyectoReceptorEntity } from '../proyectos/entities/proyecto-receptor.entity';
import { StorageService } from '../storage/storage.service';
import { NotificacionesService } from '../notificaciones/notificaciones.service';
import { CreateReporteSemaforoDto } from './dtos/create-reporte-semaforo.dto';
import { CreatePremioHistoricoDto } from './dtos/create-premio-historico.dto';
import { CreateFeedbackProyectoDto } from './dtos/create-feedback-proyecto.dto';
import { FilterBaseMadreDto } from './dtos/filter-base-madre.dto';

export interface VoluntarioBaseMadreItem {
  id: number;
  ci: string;
  nombres: string;
  primerApellido: string;
  segundoApellido?: string;
  nombreCompleto: string;
  carrera: string;
  email: string;
  telefono?: string;
  semestresActivos: string;
  proyectoReciente: string;
  horasTotalesHistoricas: number;
  nivelCalculado: 'JUNIOR' | 'PRO' | 'SUPER_PRO';
  estado: string;
  totalPremios: number;
  premios: PremioHistoricoEntity[];
}

export interface VoluntarioRankingItem {
  posicion: number;
  idUsuario: number;
  nombreCompleto: string;
  ci: string;
  carrera: string;
  proyecto: string;
  horasSemestre: number;
  semaforosMorados: number;
  evaluacionInstitucion: number;
  nivel: 'JUNIOR' | 'PRO' | 'SUPER_PRO';
  score: number;
  merito: string;
  aprobadoRetiro: boolean;
}

@Injectable()
export class SemaforosService {
  constructor(
    @InjectRepository(ReporteSemaforoEntity)
    private readonly semaforoRepo: Repository<ReporteSemaforoEntity>,

    @InjectRepository(PremioHistoricoEntity)
    private readonly premioRepo: Repository<PremioHistoricoEntity>,

    @InjectRepository(EvaluacionProyectoEntity)
    private readonly evaluacionRepo: Repository<EvaluacionProyectoEntity>,

    @InjectRepository(CertificadoFundacionEntity)
    private readonly certificadoFundacionRepo: Repository<CertificadoFundacionEntity>,

    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,

    @InjectRepository(AsignacionUbicacionEntity)
    private readonly asignacionRepo: Repository<AsignacionUbicacionEntity>,

    @InjectRepository(ProyectoReceptorEntity)
    private readonly proyectoRepo: Repository<ProyectoReceptorEntity>,

    private readonly storageService: StorageService,
    private readonly notificacionesService: NotificacionesService,
  ) {}

  // =========================================================================
  // 1. P-19: REPORTES MENSUALES Y SEMÁFOROS (RF-18, RF-19)
  // =========================================================================

  async guardarReporteSemaforo(
    dto: CreateReporteSemaforoDto,
    catoliderId?: number,
  ): Promise<ReporteSemaforoEntity> {
    if (!dto.observacionesDesempeno || dto.observacionesDesempeno.trim().length === 0) {
      throw new BadRequestException(
        'La justificación u observaciones de desempeño son obligatorias según requerimiento de Pastoral UCB',
      );
    }

    const asignacion = await this.asignacionRepo.findOne({
      where: { id: dto.idAsignacion },
      relations: { usuario: true, proyecto: true },
    });

    if (!asignacion) {
      throw new NotFoundException(
        `Asignación de voluntario con ID ${dto.idAsignacion} no encontrada`,
      );
    }

    // Normalizar color a formato Capitalized
    const colorNormalizado =
      dto.colorSemaforo.charAt(0).toUpperCase() +
      dto.colorSemaforo.slice(1).toLowerCase();

    const anio = dto.anio || 2026;

    let reporte = await this.semaforoRepo.findOne({
      where: {
        idAsignacion: dto.idAsignacion,
        mes: dto.mes,
        anio,
      },
    });

    if (reporte) {
      reporte.colorSemaforo = colorNormalizado;
      reporte.observacionesDesempeno = dto.observacionesDesempeno.trim();
      reporte.notificarAbandono =
        dto.notificarAbandono || colorNormalizado.toLowerCase() === 'rojo';
      if (catoliderId) {
        reporte.catoliderEvaluadorId = catoliderId;
      }
    } else {
      reporte = this.semaforoRepo.create({
        idAsignacion: dto.idAsignacion,
        mes: dto.mes,
        anio,
        colorSemaforo: colorNormalizado,
        observacionesDesempeno: dto.observacionesDesempeno.trim(),
        notificarAbandono:
          dto.notificarAbandono || colorNormalizado.toLowerCase() === 'rojo',
        catoliderEvaluadorId: catoliderId || dto.catoliderEvaluadorId,
      });
    }

    const guardado = await this.semaforoRepo.save(reporte);

    // Disparar notificación a Admin Pastoral si es rojo o alerta de abandono
    if (guardado.colorSemaforo.toLowerCase() === 'rojo' || guardado.notificarAbandono) {
      const volNombre = asignacion.usuario
        ? `${asignacion.usuario.nombres} ${asignacion.usuario.primerApellido}`
        : 'Voluntario';
      const proyNombre = asignacion.proyecto?.nombreProyecto || 'Proyecto Receptor';
      try {
        await this.notificacionesService.alertaSemaforoRojo({
          voluntarioNombre: volNombre,
          proyectoNombre: proyNombre,
          mes: guardado.mes,
          anio: guardado.anio,
          observaciones: guardado.observacionesDesempeno,
          semestre: asignacion.semestre || '2/2026',
        });
      } catch (err) {
        console.error('Error al emitir notificación de semáforo rojo:', err);
      }
    }

    return guardado;
  }

  async obtenerReportesPorProyecto(
    proyectoId: number,
    mes?: string,
    anio: number = 2026,
  ) {
    const proyecto = await this.proyectoRepo.findOne({
      where: { id: proyectoId },
    });

    if (!proyecto) {
      throw new NotFoundException(`Proyecto receptor con ID ${proyectoId} no encontrado`);
    }

    const asignaciones = await this.asignacionRepo.find({
      where: { idProyecto: proyectoId, activo: true },
      relations: { usuario: true, semaforos: true },
    });

    const mesBusqueda = mes || 'Septiembre';

    const items = asignaciones.map((asig) => {
      const reporteMes = asig.semaforos?.find(
        (s) => s.mes.toLowerCase() === mesBusqueda.toLowerCase() && s.anio === anio,
      );

      return {
        idAsignacion: asig.id,
        idUsuario: asig.idUsuario,
        ci: asig.usuario?.ci || 'N/D',
        nombreCompleto: asig.usuario
          ? `${asig.usuario.nombres} ${asig.usuario.primerApellido} ${asig.usuario.segundoApellido || ''}`.trim()
          : 'Voluntario',
        carrera: asig.usuario?.carrera || 'Sin registrar',
        telefono: asig.usuario?.telefono || '',
        horarioComprometido: asig.horarioComprometido || 'Pendiente',
        horasMesEstimadas: 0,
        colorSemaforo: reporteMes?.colorSemaforo || 'Verde',
        observacionesDesempeno: reporteMes?.observacionesDesempeno || '',
        notificarAbandono: reporteMes?.notificarAbandono || false,
        reportado: !!reporteMes,
      };
    });

    // Contadores de resumen
    const total = items.length;
    const verdes = items.filter((i) => i.colorSemaforo.toLowerCase() === 'verde').length;
    const amarillos = items.filter((i) => i.colorSemaforo.toLowerCase() === 'amarillo').length;
    const rojos = items.filter((i) => i.colorSemaforo.toLowerCase() === 'rojo').length;
    const morados = items.filter((i) => i.colorSemaforo.toLowerCase() === 'morado').length;

    return {
      proyecto: {
        id: proyecto.id,
        nombre: proyecto.nombreProyecto,
        cupoMaximo: proyecto.cupoMaximo,
        cupoOcupado: proyecto.cupoOcupado,
        supervisor: proyecto.supervisorNombre,
      },
      periodo: { mes: mesBusqueda, anio },
      resumen: {
        total,
        verdes,
        amarillos,
        rojos,
        morados,
      },
      voluntarios: items,
    };
  }

  async obtenerResumenGeneralSemaforos(mes: string = 'Septiembre', anio: number = 2026) {
    const reportes = await this.semaforoRepo.find({
      where: { mes, anio },
      relations: {
        asignacion: {
          usuario: true,
          proyecto: true,
        },
      },
    });

    const total = reportes.length;
    const verdes = reportes.filter((r) => r.colorSemaforo.toLowerCase() === 'verde').length;
    const amarillos = reportes.filter((r) => r.colorSemaforo.toLowerCase() === 'amarillo').length;
    const rojos = reportes.filter((r) => r.colorSemaforo.toLowerCase() === 'rojo').length;
    const morados = reportes.filter((r) => r.colorSemaforo.toLowerCase() === 'morado').length;

    const alertasRojas = reportes
      .filter((r) => r.colorSemaforo.toLowerCase() === 'rojo' || r.notificarAbandono)
      .map((r) => ({
        idReporte: r.id,
        idAsignacion: r.idAsignacion,
        voluntario: r.asignacion?.usuario
          ? `${r.asignacion.usuario.nombres} ${r.asignacion.usuario.primerApellido}`
          : 'Voluntario',
        proyecto: r.asignacion?.proyecto?.nombreProyecto || 'Sin Proyecto',
        observaciones: r.observacionesDesempeno,
        notificarAbandono: r.notificarAbandono,
      }));

    return {
      mes,
      anio,
      total,
      verdes,
      amarillos,
      rojos,
      morados,
      alertasRojas,
    };
  }

  // =========================================================================
  // 2. P-20: BASE MADRE HISTÓRICA Y RECONOCIMIENTOS (RF-20, RF-21, RF-22)
  // =========================================================================

  async obtenerBaseMadre(filtros: FilterBaseMadreDto): Promise<{
    kpis: {
      totalHistoricos: number;
      horasSocialesCertificadas: number;
      totalSuperPro: number;
      activosSemestreActual: number;
    };
    totalRegistros: number;
    voluntarios: VoluntarioBaseMadreItem[];
  }> {
    const usuarios = await this.userRepo.find({
      relations: {
        asignaciones: {
          proyecto: true,
        },
      },
      order: { id: 'DESC' },
    });

    const todosPremios = await this.premioRepo.find({
      relations: { proyecto: true },
    });

    // Mapear cada voluntario consolidando sus horas históricas
    let lista: VoluntarioBaseMadreItem[] = usuarios.map((user) => {
      const premiosUsuario = todosPremios.filter((p) => p.idUsuario === user.id);
      const asignacionReciente = user.asignaciones?.[0];
      const proyectoNombre = asignacionReciente?.proyecto?.nombreProyecto || 'Sin asignar';

      // Cálculo de horas históricas según asignaciones reales
      let horas = 0;
      if (user.asignaciones && user.asignaciones.length > 0) {
        horas = user.asignaciones.reduce(
          (acc, a) =>
            acc +
            (a.asistencias
              ? a.asistencias.reduce(
                  (sum, ast) => sum + (Number(ast.horasCalculadas) || 0),
                  0,
                )
              : 0),
          0,
        );
      }

      // Regla de nivel automatizado (RF-21)
      let nivel: 'JUNIOR' | 'PRO' | 'SUPER_PRO' = 'JUNIOR';
      if (horas >= 60) {
        nivel = 'SUPER_PRO';
      } else if (horas >= 40) {
        nivel = 'PRO';
      }

      const nombreCompleto = `${user.nombres} ${user.primerApellido} ${user.segundoApellido || ''}`.trim();

      return {
        id: user.id,
        ci: user.ci,
        nombres: user.nombres,
        primerApellido: user.primerApellido,
        segundoApellido: user.segundoApellido,
        nombreCompleto,
        carrera: user.carrera || 'Ingeniería de Sistemas',
        email: user.email,
        telefono: user.telefono,
        semestresActivos: user.semestreIngreso ? `${user.semestreIngreso} a 2/2026` : '2/2026',
        proyectoReciente: proyectoNombre,
        horasTotalesHistoricas: horas,
        nivelCalculado: nivel,
        estado: user.activo ? 'Activo 2/2026' : 'Inactivo',
        totalPremios: premiosUsuario.length,
        premios: premiosUsuario,
      };
    });

    // Filtros
    if (filtros.busqueda && filtros.busqueda.trim() !== '') {
      const term = filtros.busqueda.toLowerCase();
      lista = lista.filter(
        (v) =>
          v.nombreCompleto.toLowerCase().includes(term) ||
          v.ci.toLowerCase().includes(term) ||
          v.carrera.toLowerCase().includes(term),
      );
    }

    if (filtros.nivel && filtros.nivel.trim() !== '' && filtros.nivel !== 'TODOS') {
      lista = lista.filter(
        (v) => v.nivelCalculado.toUpperCase() === filtros.nivel!.toUpperCase(),
      );
    }

    if (filtros.carrera && filtros.carrera.trim() !== '' && filtros.carrera !== 'TODAS') {
      lista = lista.filter((v) =>
        v.carrera.toLowerCase().includes(filtros.carrera!.toLowerCase()),
      );
    }

    if (filtros.estado && filtros.estado.trim() !== '' && filtros.estado !== 'TODOS') {
      lista = lista.filter((v) =>
        v.estado.toLowerCase().includes(filtros.estado!.toLowerCase()),
      );
    }

    const totalHistoricos = lista.length;
    const horasSocialesCertificadas = lista.reduce((acc, v) => acc + (v.horasTotalesHistoricas || 0), 0);
    const totalSuperPro = lista.filter((v) => v.nivelCalculado === 'SUPER_PRO').length;
    const activosSemestreActual = lista.filter((v) => v.estado.includes('Activo')).length;

    return {
      kpis: {
        totalHistoricos,
        horasSocialesCertificadas,
        totalSuperPro,
        activosSemestreActual,
      },
      totalRegistros: lista.length,
      voluntarios: lista,
    };
  }

  async crearPremio(dto: CreatePremioHistoricoDto): Promise<PremioHistoricoEntity> {
    const usuario = await this.userRepo.findOne({ where: { id: dto.idUsuario } });
    if (!usuario) {
      throw new NotFoundException(`Usuario con ID ${dto.idUsuario} no encontrado`);
    }

    const premio = this.premioRepo.create({
      idUsuario: dto.idUsuario,
      semestre: dto.semestre,
      proyectoId: dto.proyectoId,
      nombrePremio: dto.nombrePremio.trim(),
      categoria: dto.categoria?.trim() || 'Liderazgo y Servicio',
      descripcion: dto.descripcion.trim(),
    });

    const guardado = await this.premioRepo.save(premio);

    try {
      await this.notificacionesService.premioOtorgado({
        voluntarioId: dto.idUsuario,
        nombrePremio: guardado.nombrePremio,
        categoria: guardado.categoria,
        semestre: guardado.semestre,
      });
    } catch (err) {
      console.error('Error al emitir notificación de premio:', err);
    }

    return guardado;
  }

  async obtenerPremiosPorUsuario(usuarioId: number): Promise<PremioHistoricoEntity[]> {
    return await this.premioRepo.find({
      where: { idUsuario: usuarioId },
      relations: { proyecto: true },
      order: { id: 'DESC' },
    });
  }

  async obtenerRankingDestacados(
    semestre: string = '2/2026',
  ): Promise<{
    formula: string;
    podio: VoluntarioRankingItem[];
    rankingCompleto: VoluntarioRankingItem[];
  }> {
    const usuarios = await this.userRepo.find({
      relations: {
        asignaciones: {
          proyecto: true,
          semaforos: true,
        },
      },
    });

    // Algoritmo Oficial RF-22:
    // Score = (Horas_Semestre * 0.4) + (Semaforos_Morados * 15) + (Eval_Institucion * 5) + (Bonus_SuperPro: 10)
    const items: VoluntarioRankingItem[] = usuarios.map((user) => {
      const asig = user.asignaciones?.[0];
      const morados =
        asig?.semaforos?.filter((s) => s.colorSemaforo.toLowerCase() === 'morado').length || 0;

      const horas = asig?.asistencias
        ? asig.asistencias.reduce((sum, ast) => sum + (Number(ast.horasCalculadas) || 0), 0)
        : 0;
      const evalInst = asig ? 5 : 0;
      const nivel: 'JUNIOR' | 'PRO' | 'SUPER_PRO' = horas >= 50 ? 'SUPER_PRO' : (horas >= 40 ? 'PRO' : 'JUNIOR');
      const bonusSuperPro = nivel === 'SUPER_PRO' ? 10 : 0;

      const score = parseFloat(
        (horas * 0.4 + morados * 15 + evalInst * 5 + bonusSuperPro).toFixed(1),
      );

      const nombreCompleto = `${user.nombres} ${user.primerApellido} ${user.segundoApellido || ''}`.trim();

      return {
        posicion: 0,
        idUsuario: user.id,
        nombreCompleto,
        ci: user.ci,
        carrera: user.carrera || 'Carrera no registrada',
        proyecto: asig?.proyecto?.nombreProyecto || 'Sin asignar',
        horasSemestre: horas,
        semaforosMorados: morados,
        evaluacionInstitucion: evalInst,
        nivel,
        score,
        merito:
          score >= 80
            ? 'Destacada participación, calidez y compromiso pastoral en su proyecto receptor.'
            : 'Participación en actividades y jornadas de servicio solidario.',
        aprobadoRetiro: score >= 85,
      };
    });

    // Ordenar descendente por score
    items.sort((a, b) => b.score - a.score);

    // Asignar puestos
    items.forEach((item, idx) => {
      item.posicion = idx + 1;
    });

    const podio = items.slice(0, 3);

    return {
      formula:
        'Score = (Horas_Semestre × 0.4) + (Semáforos_Morados × 15) + (Eval_Institución × 5) + (Bonus_SuperPro: 10)',
      podio,
      rankingCompleto: items,
    };
  }

  // =========================================================================
  // 3. P-21: FEEDBACK SEMESTRAL Y CERTIFICADOS (RF-23)
  // =========================================================================

  async registrarFeedbackProyecto(
    dto: CreateFeedbackProyectoDto,
  ): Promise<EvaluacionProyectoEntity> {
    const proyecto = await this.proyectoRepo.findOne({
      where: { id: dto.proyectoId },
    });

    if (!proyecto) {
      throw new NotFoundException(`Proyecto receptor con ID ${dto.proyectoId} no encontrado`);
    }

    if (
      !dto.bloque4ObservacionesSugerenciasLibres ||
      dto.bloque4ObservacionesSugerenciasLibres.trim().length === 0
    ) {
      throw new BadRequestException(
        'El Bloque 4 de observaciones y sugerencias libres de la institución es obligatorio',
      );
    }

    let feedback = await this.evaluacionRepo.findOne({
      where: { proyectoId: dto.proyectoId, semestre: dto.semestre },
    });

    if (feedback) {
      feedback.voluntariosRecibidos = dto.voluntariosRecibidos;
      feedback.voluntariosCulminados = dto.voluntariosCulminados;
      feedback.calificacionGrupo = dto.calificacionGrupo || 5;
      feedback.calificacionCatolider = dto.calificacionCatolider || 5;
      feedback.solicitaContinuidadConvenio = dto.solicitaContinuidadConvenio;
      feedback.cuposSolicitadosProximoSemestre = dto.cuposSolicitadosProximoSemestre;
      feedback.bloque4ObservacionesSugerenciasLibres =
        dto.bloque4ObservacionesSugerenciasLibres.trim();
      feedback.nombreResponsableLlenado = dto.nombreResponsableLlenado.trim();
      feedback.cargoResponsable = dto.cargoResponsable?.trim();
      feedback.documentoRespaldoUrl = dto.documentoRespaldoUrl;
    } else {
      feedback = this.evaluacionRepo.create({
        proyectoId: dto.proyectoId,
        semestre: dto.semestre,
        voluntariosRecibidos: dto.voluntariosRecibidos,
        voluntariosCulminados: dto.voluntariosCulminados,
        calificacionGrupo: dto.calificacionGrupo || 5,
        calificacionCatolider: dto.calificacionCatolider || 5,
        solicitaContinuidadConvenio: dto.solicitaContinuidadConvenio,
        cuposSolicitadosProximoSemestre: dto.cuposSolicitadosProximoSemestre,
        bloque4ObservacionesSugerenciasLibres:
          dto.bloque4ObservacionesSugerenciasLibres.trim(),
        nombreResponsableLlenado: dto.nombreResponsableLlenado.trim(),
        cargoResponsable: dto.cargoResponsable?.trim(),
        documentoRespaldoUrl: dto.documentoRespaldoUrl,
      });
    }

    return await this.evaluacionRepo.save(feedback);
  }

  async obtenerFeedbackProyecto(proyectoId: number, semestre: string = '2/2026') {
    const feedback = await this.evaluacionRepo.findOne({
      where: { proyectoId, semestre },
      relations: { proyecto: true },
    });

    if (!feedback) {
      // Devolver borrador modelo con datos del centro
      const proyecto = await this.proyectoRepo.findOne({ where: { id: proyectoId } });
      return {
        proyectoId,
        nombreProyecto: proyecto?.nombreProyecto || 'Proyecto Receptor',
        semestre,
        voluntariosRecibidos: 0,
        voluntariosCulminados: 0,
        bajasAbandonos: 0,
        calificacionGrupo: 0,
        calificacionCatolider: 0,
        solicitaContinuidadConvenio: true,
        cuposSolicitadosProximoSemestre: 0,
        bloque4ObservacionesSugerenciasLibres: '',
        nombreResponsableLlenado: proyecto?.supervisorNombre || '',
        cargoResponsable: 'Supervisión de Voluntariado',
        fechaEvaluacion: new Date(),
        esBorrador: true,
      };
    }

    return feedback;
  }

  async generarPlantillaCertificado(usuarioId: number, semestre: string = '2/2026') {
    const usuario = await this.userRepo.findOne({
      where: { id: usuarioId },
      relations: {
        asignaciones: {
          proyecto: true,
        },
      },
    });

    if (!usuario) {
      throw new NotFoundException(`Usuario con ID ${usuarioId} no encontrado`);
    }

    const asig = usuario.asignaciones?.[0];
    const proyectoNombre = asig?.proyecto?.nombreProyecto || 'Sin asignar';
    const nombreCompleto = `${usuario.nombres} ${usuario.primerApellido} ${usuario.segundoApellido || ''}`.trim();
    const ci = usuario.ci;
    const carrera = usuario.carrera || 'Carrera Universitaria';
    const horas = asig?.asistencias
      ? asig.asistencias.reduce((sum, ast) => sum + (Number(ast.horasCalculadas) || 0), 0)
      : 0; // Horas auditadas del semestre
    const fechaEmision = 'Noviembre de 2026';

    const textoPreformateadoCopiar = `CERTIFICADO DE CULMINACIÓN DE VOLUNTARIADO SOCIAL
PASTORAL UNIVERSITARIA — UNIVERSIDAD CATÓLICA BOLIVIANA "SAN PABLO" REGIONAL LA PAZ

Se certifica que:
Estudiante: ${nombreCompleto}
Carnet de Identidad: ${ci}
Carrera: ${carrera}

Ha culminado satisfactoriamente el programa de servicio social universitario "Catovoluntarios" durante el Semestre ${semestre}, habiendo prestado servicio solidario en el Proyecto Receptor:
"${proyectoNombre}"
Cumpliendo un total auditado de ${horas} HORAS CRONOLÓGICAS DE VOLUNTARIADO SOCIAL en campo, demostrando compromiso, madurez humana y vocación solidaria.

La Paz, ${fechaEmision}.`;

    const premios = await this.premioRepo.find({
      where: { idUsuario: usuario.id, semestre },
      order: { id: 'DESC' },
    });
    const distincionPremio =
      premios.length > 0
        ? `${premios[0].nombrePremio}${premios[0].categoria ? ` (${premios[0].categoria})` : ''}`
        : 'Voluntariado Social Concluido';

    const certsFundacion = await this.certificadoFundacionRepo.find({
      where: { idUsuario: usuario.id, semestre },
      relations: { proyecto: true },
      order: { id: 'DESC' },
    });

    return {
      usuarioId: usuario.id,
      nombreCompleto,
      ci,
      carrera,
      proyectoReceptor: proyectoNombre,
      semestre,
      horasCumplidas: horas,
      fechaEmision,
      distincionPremio,
      premios,
      certificadosFundacion: certsFundacion.map((c) => ({
        id: c.id,
        nombreArchivo: c.nombreArchivo,
        urlPdf: c.urlPdf,
        fechaSubida: c.createdAt,
        observaciones: c.observaciones,
      })),
      actividadesRealizadas:
        'Acompañamiento a beneficiarios, dinamización de talleres grupales, soporte en actividades cotidianas del centro.',
      textoPreformateadoCopiar,
    };
  }

  async obtenerPlantillasLote(proyectoId?: number, semestre: string = '2/2026') {
    const where: any = { activo: true };
    if (proyectoId) {
      where.idProyecto = proyectoId;
    }

    const asignaciones = await this.asignacionRepo.find({
      where,
      relations: {
        usuario: true,
        proyecto: true,
      },
    });

    const todosPremios = await this.premioRepo.find({
      where: { semestre },
    });

    const certsFundacion = await this.certificadoFundacionRepo.find({
      where: { semestre },
    });

    return asignaciones.map((asig) => {
      const u = asig.usuario;
      const nombreCompleto = u
        ? `${u.nombres} ${u.primerApellido} ${u.segundoApellido || ''}`.trim()
        : 'Estudiante Voluntario';
      const ci = u?.ci || 'N/D';
      const carrera = u?.carrera || 'Carrera UCB';
      const proyectoNombre = asig.proyecto?.nombreProyecto || 'Centro Aliado';
      const horas = asig.asistencias
        ? asig.asistencias.reduce((sum, ast) => sum + (Number(ast.horasCalculadas) || 0), 0)
        : 0;

      const premio = todosPremios.find((p) => p.idUsuario === u?.id);
      const certFundacion = certsFundacion.find((c) => c.idUsuario === u?.id);

      return {
        idUsuario: u?.id || 0,
        nombreCompleto,
        ci,
        carrera,
        proyectoReceptor: proyectoNombre,
        semestre,
        horasCumplidas: horas,
        distincionPremio: premio?.nombrePremio || 'Voluntariado Concluido',
        certificadoFundacionUrl: certFundacion?.urlPdf || null,
        certificadoFundacionArchivo: certFundacion?.nombreArchivo || null,
        textoCertificado: `Por cuanto ${nombreCompleto} (CI: ${ci}), estudiante de ${carrera}, ha cumplido satisfactoriamente ${horas} horas de voluntariado en "${proyectoNombre}".`,
      };
    });
  }

  // =========================================================================
  // 4. CERTIFICADOS DE FUNDACIÓN (Subidos por Proyecto Receptor)
  // =========================================================================

  async subirCertificadoFundacion(
    file: Express.Multer.File,
    proyectoId: number,
    usuarioId: number,
    semestre: string = '2/2026',
    subidoPor?: number,
    observaciones?: string,
  ): Promise<CertificadoFundacionEntity> {
    if (!file) {
      throw new BadRequestException('Se requiere el archivo PDF o imagen del certificado de la fundación');
    }

    const proyecto = await this.proyectoRepo.findOne({ where: { id: proyectoId } });
    if (!proyecto) {
      throw new NotFoundException(`Proyecto receptor con ID ${proyectoId} no encontrado`);
    }

    const usuario = await this.userRepo.findOne({ where: { id: usuarioId } });
    if (!usuario) {
      throw new NotFoundException(`Voluntario con ID ${usuarioId} no encontrado`);
    }

    // Subir a Storage (Cloudflare R2 o uploads local)
    const uploadResult = await this.storageService.uploadFile(file, 'certificados-fundacion');

    let cert = await this.certificadoFundacionRepo.findOne({
      where: { idProyecto: proyectoId, idUsuario: usuarioId, semestre },
    });

    if (cert) {
      cert.urlPdf = uploadResult.url;
      cert.nombreArchivo = file.originalname;
      if (subidoPor) cert.subidoPor = subidoPor;
      if (observaciones) cert.observaciones = observaciones;
    } else {
      cert = this.certificadoFundacionRepo.create({
        idProyecto: proyectoId,
        idUsuario: usuarioId,
        semestre,
        urlPdf: uploadResult.url,
        nombreArchivo: file.originalname,
        subidoPor,
        observaciones,
      });
    }

    const guardado = await this.certificadoFundacionRepo.save(cert);

    // Disparar notificación a Admin Pastoral
    try {
      await this.notificacionesService.certificadoFundacionSubido({
        proyectoNombre: proyecto.nombreProyecto,
        voluntarioNombre: `${usuario.nombres} ${usuario.primerApellido}`,
        semestre,
      });
    } catch (err) {
      console.error('Error al emitir notificación de certificado de fundación:', err);
    }

    return guardado;
  }

  async obtenerCertificadosFundacionPorProyecto(proyectoId: number, semestre?: string) {
    const where: any = { idProyecto: proyectoId };
    if (semestre) where.semestre = semestre;
    return await this.certificadoFundacionRepo.find({
      where,
      relations: { usuario: true, usuarioSubidor: true },
      order: { id: 'DESC' },
    });
  }

  async obtenerCertificadosFundacionPorUsuario(usuarioId: number, semestre?: string) {
    const where: any = { idUsuario: usuarioId };
    if (semestre) where.semestre = semestre;
    return await this.certificadoFundacionRepo.find({
      where,
      relations: { proyecto: true, usuarioSubidor: true },
      order: { id: 'DESC' },
    });
  }

  async listarTodosCertificadosFundacion(semestre?: string, proyectoId?: number) {
    const where: any = {};
    if (semestre) where.semestre = semestre;
    if (proyectoId) where.idProyecto = proyectoId;
    return await this.certificadoFundacionRepo.find({
      where,
      relations: { usuario: true, proyecto: true, usuarioSubidor: true },
      order: { id: 'DESC' },
    });
  }

  async eliminarCertificadoFundacion(id: number, subidoPor?: number) {
    const cert = await this.certificadoFundacionRepo.findOne({ where: { id } });
    if (!cert) {
      throw new NotFoundException(`Certificado con ID ${id} no encontrado`);
    }
    await this.certificadoFundacionRepo.delete(id);
    return { success: true, message: 'Certificado de fundación eliminado correctamente' };
  }
}
