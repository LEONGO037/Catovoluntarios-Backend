import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { Between, DataSource, EntityManager, In, Not, QueryFailedError, Repository } from 'typeorm';
import { Role } from '../../common/enums/role.enum';
import {
  LecturasExternasService,
  PostulanteResumen,
} from '../../simulados-m03/lecturas-externas.service';
import { obtenerAgendaConfig } from './config/agenda.config';
import {
  AgendarEntrevistaDto,
  CambiarEstadoCitaDto,
  ReprogramarEntrevistaDto,
} from './dtos/agenda.dto';
import { RegistrarFichaEntrevistaDto } from './dtos/ficha-entrevista.dto';
import { EntrevistaEntity } from './entities/entrevista.entity';
import { ESTADOS_QUE_OCUPAN_FRANJA, EstadoCitaEntrevista } from './enums/entrevistas.enums';
import {
  CitaVista,
  DiaAgenda,
  CitasDelDia,
  DetalleEntrevista,
  DisponibilidadSemanal,
  MiEntrevista,
  PostulanteCita,
} from './types/respuestas.types';
import { UsuarioAutenticado } from './types/usuario-autenticado';
import {
  diaIso,
  esFechaValida,
  esInicioDeFranja,
  fechaLocal,
  horaLocal,
  horasDeFranja,
  instanteLocal,
  lunesDeSemana,
  rangoDelDia,
  sumarDias,
} from './utils/franjas.util';

const ESTADO_POSTULACION_HABILITADA = 'APTO_ENTREVISTA';
const CLAVE_BLOQUEO_FRANJA = 3003;
const MS_SEMANA = 7 * 24 * 60 * 60 * 1000;

export function aPostulanteCita(p: PostulanteResumen): PostulanteCita {
  return {
    postulacionId: p.postulacionId,
    codigoPostulacion: p.codigoPostulacion,
    nombreCompleto: p.nombreCompleto,
    ci: p.ci,
    carrera: p.carrera,
    edad: p.edad,
  };
}

function esViolacionUnica(error: unknown): boolean {
  return (
    error instanceof QueryFailedError &&
    (error.driverError as { code?: string } | undefined)?.code === '23505'
  );
}

@Injectable()
export class EntrevistasService {
  constructor(
    @InjectRepository(EntrevistaEntity)
    private readonly entrevistas: Repository<EntrevistaEntity>,
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly lecturas: LecturasExternasService,
  ) {}

  // ===================== P-07: Agenda =====================

  async disponibilidad(semana?: string): Promise<DisponibilidadSemanal> {
    const config = obtenerAgendaConfig();
    const referencia = semana ?? fechaLocal(new Date(), config.zonaHoraria);
    if (!esFechaValida(referencia)) {
      throw new BadRequestException('semana no es una fecha válida');
    }
    const lunes = lunesDeSemana(referencia);
    const desde = instanteLocal(lunes, '00:00', config.zonaHoraria);
    const hasta = new Date(desde.getTime() + MS_SEMANA - 1);

    const capacidad = (await this.lecturas.listarCatoliderActivos()).length;
    const citas = await this.entrevistas.find({
      where: {
        fechaHoraProgramada: Between(desde, hasta),
        estado: In(ESTADOS_QUE_OCUPAN_FRANJA),
      },
    });
    const ocupacion = new Map<number, number>();
    citas.forEach((c) => {
      const t = c.fechaHoraProgramada.getTime();
      ocupacion.set(t, (ocupacion.get(t) ?? 0) + 1);
    });

    const ahora = Date.now();
    const horas = horasDeFranja(config);
    const dias: DiaAgenda[] = [];
    for (let i = 0; i < 7; i++) {
      const fecha = sumarDias(lunes, i);
      if (!config.dias.includes(diaIso(fecha))) continue;
      dias.push({
        fecha,
        diaIso: diaIso(fecha),
        franjas: horas.map((hora) => {
          const inicio = instanteLocal(fecha, hora, config.zonaHoraria);
          const ocupadas = ocupacion.get(inicio.getTime()) ?? 0;
          return {
            inicio: inicio.toISOString(),
            hora,
            capacidad,
            ocupadas,
            disponible: inicio.getTime() > ahora && ocupadas < capacidad,
          };
        }),
      });
    }

    return {
      semanaInicio: lunes,
      horaInicio: config.horaInicio,
      horaFin: config.horaFin,
      duracionMinutos: config.duracionMinutos,
      zonaHoraria: config.zonaHoraria,
      dias,
    };
  }

  async agendar(usuario: UsuarioAutenticado, dto: AgendarEntrevistaDto): Promise<CitaVista> {
    let postulacionId: number;
    if ((usuario.rol === Role.ADMIN_PASTORAL || usuario.rol === Role.CATOLIDER) && dto.postulacionId) {
      const p = await this.lecturas.obtenerPostulante(dto.postulacionId);
      postulacionId = p.postulacionId;
    } else {
      const postulacion = await this.lecturas.obtenerPostulacionActivaDeUsuario(usuario.id);
      if (!postulacion) {
        throw new NotFoundException('No tienes una postulación registrada en el semestre activo');
      }
      if (postulacion.estadoPostulacion !== ESTADO_POSTULACION_HABILITADA) {
        throw new BadRequestException('Tu postulación todavía no está habilitada para la entrevista');
      }
      postulacionId = postulacion.postulacionId;
    }

    const existente = await this.entrevistas.findOne({
      where: { postulacionId },
    });
    if (existente) {
      throw new ConflictException(
        'Ya existe una entrevista registrada para esta postulación. Si necesitas cambiarla, usa la opción Reprogramar.',
      );
    }
    const fechaHora = this.validarFranja(dto.fechaHora);

    try {
      const guardada = await this.dataSource.transaction(async (manager) => {
        await this.bloquearFranja(manager, fechaHora);
        const catoliderId = dto.catoliderId ?? (await this.elegirCatolider(manager, fechaHora, null, null));
        const nueva = manager.create(EntrevistaEntity, {
          postulacionId,
          catoliderId,
          fechaHoraProgramada: fechaHora,
          estado: EstadoCitaEntrevista.PROGRAMADA,
        });
        return manager.save(nueva);
      });
      return this.aVista(guardada, usuario);
    } catch (error) {
      if (esViolacionUnica(error)) {
        throw new ConflictException('Ya existe una entrevista registrada para esta postulación');
      }
      throw error;
    }
  }

  async miEntrevista(usuario: UsuarioAutenticado): Promise<MiEntrevista> {
    const postulacion = await this.lecturas.obtenerPostulacionActivaDeUsuario(usuario.id);
    if (!postulacion) {
      return { postulacion: null, entrevista: null };
    }
    const entrevista = await this.entrevistas.findOne({
      where: { postulacionId: postulacion.postulacionId },
    });
    return {
      postulacion: {
        codigoPostulacion: postulacion.codigoPostulacion,
        estadoPostulacion: postulacion.estadoPostulacion,
        nombreCompleto: postulacion.nombreCompleto,
      },
      entrevista: entrevista ? await this.aVista(entrevista, usuario) : null,
    };
  }

  async citasDelDia(usuario: UsuarioAutenticado, fecha: string): Promise<CitasDelDia> {
    if (!esFechaValida(fecha)) {
      throw new BadRequestException('fecha no es una fecha válida');
    }
    const { desde, hasta } = rangoDelDia(fecha, obtenerAgendaConfig().zonaHoraria);
    const [catolideres, citas] = await Promise.all([
      this.lecturas.listarCatoliderActivos(),
      this.entrevistas.find({
        where: {
          fechaHoraProgramada: Between(desde, new Date(hasta.getTime() - 1)),
          estado: Not(EstadoCitaEntrevista.CANCELADA),
        },
        order: { fechaHoraProgramada: 'ASC', id: 'ASC' },
      }),
    ]);
    return { fecha, catolideres, citas: await this.aVistas(citas, usuario) };
  }

  async cambiarEstado(
    usuario: UsuarioAutenticado,
    id: number,
    dto: CambiarEstadoCitaDto,
  ): Promise<CitaVista> {
    const entrevista = await this.buscar(id);
    this.verificarGestion(usuario, entrevista);
    if (entrevista.dictamen !== null) {
      throw new ConflictException('La ficha de esta entrevista ya fue registrada; su estado no puede cambiar');
    }
    if (entrevista.estado === EstadoCitaEntrevista.CANCELADA) {
      throw new ConflictException('La cita está cancelada');
    }
    entrevista.estado = dto.estado;
    return this.aVista(await this.entrevistas.save(entrevista), usuario);
  }

  async reprogramar(
    usuario: UsuarioAutenticado,
    id: number,
    dto: ReprogramarEntrevistaDto,
  ): Promise<CitaVista> {
    const entrevista = await this.buscar(id);
    let estadosPermitidos: EstadoCitaEntrevista[];
    if (usuario.rol === Role.POSTULANTE) {
      const postulante = await this.lecturas.obtenerPostulante(entrevista.postulacionId);
      if (postulante.userId !== usuario.id) {
        throw new ForbiddenException('Solo puedes reprogramar tu propia entrevista');
      }
      estadosPermitidos = [EstadoCitaEntrevista.PROGRAMADA, EstadoCitaEntrevista.REPROGRAMADA];
    } else {
      this.verificarGestion(usuario, entrevista);
      estadosPermitidos = [
        EstadoCitaEntrevista.PROGRAMADA,
        EstadoCitaEntrevista.REPROGRAMADA,
        EstadoCitaEntrevista.FALTO,
      ];
    }
    if (entrevista.dictamen !== null || !estadosPermitidos.includes(entrevista.estado)) {
      throw new ConflictException('Esta entrevista ya no puede reprogramarse');
    }
    const fechaHora = this.validarFranja(dto.fechaHora);

    const guardada = await this.dataSource.transaction(async (manager) => {
      await this.bloquearFranja(manager, fechaHora);
      entrevista.catoliderId = await this.elegirCatolider(
        manager,
        fechaHora,
        entrevista.catoliderId,
        entrevista.id,
      );
      entrevista.fechaHoraProgramada = fechaHora;
      entrevista.estado = EstadoCitaEntrevista.PROGRAMADA;
      return manager.save(entrevista);
    });
    return this.aVista(guardada, usuario);
  }

  // ===================== P-08: Ficha =====================

  async listarFichas(usuario: UsuarioAutenticado): Promise<CitaVista[]> {
    const citas = await this.entrevistas.find({
      where: {
        estado: EstadoCitaEntrevista.ASISTIO,
        ...(usuario.rol === Role.CATOLIDER ? { catoliderId: usuario.id } : {}),
      },
      order: { fechaHoraProgramada: 'DESC' },
    });
    return this.aVistas(citas, usuario);
  }

  async detalle(usuario: UsuarioAutenticado, id: number): Promise<DetalleEntrevista> {
    const entrevista = await this.buscar(id);
    this.verificarGestion(usuario, entrevista);
    return this.aDetalle(entrevista, usuario);
  }

  async registrarFicha(
    usuario: UsuarioAutenticado,
    id: number,
    dto: RegistrarFichaEntrevistaDto,
  ): Promise<DetalleEntrevista> {
    const entrevista = await this.buscar(id);
    this.verificarGestion(usuario, entrevista);
    if (entrevista.estado !== EstadoCitaEntrevista.ASISTIO) {
      throw new BadRequestException(
        'La ficha solo puede registrarse cuando la cita está marcada como Asistió',
      );
    }
    const proyecto = await this.lecturas.obtenerProyectoReceptor(dto.proyectoReceptorSugeridoId);
    if (!proyecto) {
      throw new BadRequestException('El Proyecto Receptor sugerido no existe o no está activo');
    }
    const horarios = dto.horariosDisponibles ?? [];
    if (horarios.some((h) => h.horaFin <= h.horaInicio)) {
      throw new BadRequestException('En cada horario, la hora de fin debe ser posterior a la de inicio');
    }

    entrevista.observacionesMotivacion = dto.observacionesMotivacion ?? null;
    entrevista.manejoTransporte = dto.manejoTransporte ?? null;
    entrevista.tiempoSemanal = dto.tiempoSemanal ?? null;
    entrevista.horariosDisponibles = horarios.map((h) => ({
      dia: h.dia,
      horaInicio: h.horaInicio,
      horaFin: h.horaFin,
    }));
    entrevista.observacionesCompromiso = dto.observacionesCompromiso ?? null;
    entrevista.observacionesTrabajoEquipo = dto.observacionesTrabajoEquipo ?? null;
    entrevista.aperturaReligiosaEscala = dto.aperturaReligiosaEscala;
    entrevista.observacionesRecomendaciones = dto.observacionesRecomendaciones ?? null;
    entrevista.proyectoReceptorSugeridoId = proyecto.id;
    entrevista.dictamen = dto.dictamen;

    return this.aDetalle(await this.entrevistas.save(entrevista), usuario);
  }

  // ===================== Auxiliares =====================

  private async buscar(id: number): Promise<EntrevistaEntity> {
    const entrevista = await this.entrevistas.findOne({ where: { id } });
    if (!entrevista) {
      throw new NotFoundException(`Entrevista ${id} no encontrada`);
    }
    return entrevista;
  }

  private puedeGestionar(usuario: UsuarioAutenticado, entrevista: EntrevistaEntity): boolean {
    return (
      usuario.rol === Role.ADMIN_PASTORAL ||
      (usuario.rol === Role.CATOLIDER && entrevista.catoliderId === usuario.id)
    );
  }

  private verificarGestion(usuario: UsuarioAutenticado, entrevista: EntrevistaEntity): void {
    if (!this.puedeGestionar(usuario, entrevista)) {
      throw new ForbiddenException(
        'Solo el Catolíder asignado o Administración Pastoral pueden gestionar esta entrevista',
      );
    }
  }

  private validarFranja(valor: string): Date {
    const fechaHora = new Date(valor);
    if (Number.isNaN(fechaHora.getTime())) {
      throw new BadRequestException('fechaHora no es una fecha válida');
    }
    if (!esInicioDeFranja(fechaHora, obtenerAgendaConfig())) {
      throw new BadRequestException('La fecha y hora elegidas no corresponden a una franja de entrevista');
    }
    if (fechaHora.getTime() <= Date.now()) {
      throw new BadRequestException('La franja elegida ya pasó; elige una fecha futura');
    }
    return fechaHora;
  }

  /** Serializa las reservas de una misma franja para evitar sobrecupos. */
  private async bloquearFranja(manager: EntityManager, fechaHora: Date): Promise<void> {
    await manager.query('SELECT pg_advisory_xact_lock($1, $2)', [
      CLAVE_BLOQUEO_FRANJA,
      Math.floor(fechaHora.getTime() / 60000),
    ]);
  }

  /**
   * Asigna un Catolíder activo del semestre libre en esa franja:
   * conserva el preferido si está libre; si no, el que tenga menos citas ese día.
   */
  private async elegirCatolider(
    manager: EntityManager,
    fechaHora: Date,
    preferidoId: number | null,
    excluirEntrevistaId: number | null,
  ): Promise<number> {
    const catolideres = await this.lecturas.listarCatoliderActivos();
    if (catolideres.length === 0) {
      throw new ConflictException('No hay Catolíderes activos para atender entrevistas este semestre');
    }
    const excluir = excluirEntrevistaId !== null ? { id: Not(excluirEntrevistaId) } : {};
    const enFranja = await manager.find(EntrevistaEntity, {
      where: { fechaHoraProgramada: fechaHora, estado: In(ESTADOS_QUE_OCUPAN_FRANJA), ...excluir },
    });
    const ocupados = new Set(enFranja.map((e) => e.catoliderId));
    const libres = catolideres.filter((c) => !ocupados.has(c.userId));
    if (libres.length === 0) {
      throw new ConflictException('La franja elegida ya no tiene cupo. Elige otra.');
    }
    if (preferidoId !== null && libres.some((c) => c.userId === preferidoId)) {
      return preferidoId;
    }

    const zona = obtenerAgendaConfig().zonaHoraria;
    const { desde, hasta } = rangoDelDia(fechaLocal(fechaHora, zona), zona);
    const delDia = await manager.find(EntrevistaEntity, {
      where: {
        fechaHoraProgramada: Between(desde, new Date(hasta.getTime() - 1)),
        estado: In(ESTADOS_QUE_OCUPAN_FRANJA),
        ...excluir,
      },
    });
    const carga = new Map<number, number>();
    delDia.forEach((e) => {
      if (e.catoliderId !== null) carga.set(e.catoliderId, (carga.get(e.catoliderId) ?? 0) + 1);
    });
    libres.sort((a, b) => (carga.get(a.userId) ?? 0) - (carga.get(b.userId) ?? 0) || a.userId - b.userId);
    return libres[0].userId;
  }

  private async aVistas(citas: EntrevistaEntity[], usuario: UsuarioAutenticado): Promise<CitaVista[]> {
    const [postulantes, nombres] = await Promise.all([
      this.lecturas.obtenerPostulantes(citas.map((c) => c.postulacionId)),
      this.lecturas.obtenerNombresUsuarios(
        citas.map((c) => c.catoliderId).filter((v): v is number => v !== null),
      ),
    ]);
    const zona = obtenerAgendaConfig().zonaHoraria;
    return citas.flatMap((c) => {
      const postulante = postulantes.get(c.postulacionId);
      if (!postulante) return [];
      return [
        {
          id: c.id,
          fechaHora: c.fechaHoraProgramada.toISOString(),
          fecha: fechaLocal(c.fechaHoraProgramada, zona),
          hora: horaLocal(c.fechaHoraProgramada, zona),
          estado: c.estado,
          catoliderId: c.catoliderId,
          catoliderNombre: c.catoliderId !== null ? (nombres.get(c.catoliderId) ?? null) : null,
          postulante: aPostulanteCita(postulante),
          fichaRegistrada: c.dictamen !== null,
          puedeGestionar: this.puedeGestionar(usuario, c),
        },
      ];
    });
  }

  private async aVista(cita: EntrevistaEntity, usuario: UsuarioAutenticado): Promise<CitaVista> {
    const [vista] = await this.aVistas([cita], usuario);
    if (!vista) {
      throw new NotFoundException('No se encontró la postulación asociada a la entrevista');
    }
    return vista;
  }

  private async aDetalle(e: EntrevistaEntity, usuario: UsuarioAutenticado): Promise<DetalleEntrevista> {
    const proyecto =
      e.proyectoReceptorSugeridoId !== null
        ? await this.lecturas.obtenerProyectoReceptor(e.proyectoReceptorSugeridoId)
        : null;
    return {
      cita: await this.aVista(e, usuario),
      ficha: {
        observacionesMotivacion: e.observacionesMotivacion,
        manejoTransporte: e.manejoTransporte,
        tiempoSemanal: e.tiempoSemanal,
        horariosDisponibles: e.horariosDisponibles ?? [],
        observacionesCompromiso: e.observacionesCompromiso,
        observacionesTrabajoEquipo: e.observacionesTrabajoEquipo,
        aperturaReligiosaEscala: e.aperturaReligiosaEscala,
        observacionesRecomendaciones: e.observacionesRecomendaciones,
        proyectoReceptorSugeridoId: e.proyectoReceptorSugeridoId,
        proyectoReceptorSugeridoNombre: proyecto?.nombreProyecto ?? null,
        dictamen: e.dictamen,
      },
    };
  }
}
