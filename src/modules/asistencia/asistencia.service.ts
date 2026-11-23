import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, DataSource, In, Repository } from 'typeorm';
import { RequestUser } from '../../common/decorators/get-user.decorator';
import { Role } from '../../common/enums/role.enum';
import { StorageService } from '../storage/storage.service';
import { ProyectoReceptorEntity } from '../proyectos/entities/proyecto-receptor.entity';
import {
  AsignacionUbicacionEntity,
  EstadoAsignacion,
} from '../ubicacion/entities/asignacion-ubicacion.entity';
import { UserEntity } from '../users/entities/user.entity';
import {
  EstadoAsistencia,
  RegistroAsistenciaEntity,
  TipoActividadAsistencia,
} from './entities/registro-asistencia.entity';
import { ActividadEmergenteEntity } from './entities/actividad-emergente.entity';
import { ConciliacionMensualEntity } from './entities/conciliacion-mensual.entity';
import { LiquidacionPasajeEntity } from './entities/liquidacion-pasaje.entity';
import {
  ActualizarActividadEmergenteDto,
  AprobarAsistenciaDto,
  ConciliarMesDto,
  CrearActividadEmergenteDto,
  MarcarAsistenciaDto,
} from './dtos/asistencia.dto';
import { calcularHoras, fechaLocalISO, rangoMes } from './utils/calculos.util';

/** Estados que cuentan como horas válidas (todo menos lo observado por el Catolíder). */
export const ESTADOS_QUE_SUMAN = [
  EstadoAsistencia.REGISTRADO,
  EstadoAsistencia.APROBADO_CATOLIDER,
  EstadoAsistencia.CONCILIADO_PASTORAL,
];
/** Estados validados que habilitan reposición de pasajes (RF-17). */
export const ESTADOS_VALIDADOS = [
  EstadoAsistencia.APROBADO_CATOLIDER,
  EstadoAsistencia.CONCILIADO_PASTORAL,
];

const MAX_HORAS_JORNADA = 12;

export function nombreCompleto(u?: Pick<UserEntity, 'nombres' | 'primerApellido' | 'segundoApellido'> | null): string {
  if (!u) return '';
  return [u.nombres, u.primerApellido, u.segundoApellido].filter(Boolean).join(' ');
}

@Injectable()
export class AsistenciaService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly storage: StorageService,
    @InjectRepository(RegistroAsistenciaEntity)
    private readonly registros: Repository<RegistroAsistenciaEntity>,
    @InjectRepository(AsignacionUbicacionEntity)
    private readonly asignaciones: Repository<AsignacionUbicacionEntity>,
    @InjectRepository(ProyectoReceptorEntity)
    private readonly proyectos: Repository<ProyectoReceptorEntity>,
    @InjectRepository(UserEntity)
    private readonly usuarios: Repository<UserEntity>,
    @InjectRepository(ActividadEmergenteEntity)
    private readonly emergentes: Repository<ActividadEmergenteEntity>,
    @InjectRepository(ConciliacionMensualEntity)
    private readonly conciliaciones: Repository<ConciliacionMensualEntity>,
  ) {}

  // ---------------------------------------------------------------------------
  // Consultas compartidas
  // ---------------------------------------------------------------------------

  async asignacionActiva(userId: number): Promise<AsignacionUbicacionEntity | null> {
    return this.asignaciones.findOne({
      where: { idUsuario: userId, estado: EstadoAsignacion.ACTIVO, activo: true },
      relations: { proyecto: true },
      order: { createdAt: 'DESC' },
    });
  }

  async mesConciliado(proyectoId: number, mes: number, anio: number): Promise<ConciliacionMensualEntity | null> {
    return this.conciliaciones.findOne({ where: { proyectoId, mes, anio } });
  }

  /** Admin ve todos los proyectos; un Catolíder solo los que lidera (titular o aprendiz). */
  async assertAccesoProyecto(user: RequestUser, proyectoId: number): Promise<ProyectoReceptorEntity> {
    const proyecto = await this.proyectos.findOne({ where: { id: proyectoId } });
    if (!proyecto) throw new NotFoundException('Proyecto receptor no encontrado');
    if (user.rol === Role.ADMIN_PASTORAL) return proyecto;
    const lidera =
      proyecto.catolider_titular_id === user.id || proyecto.catolider_aprendiz_id === user.id;
    if (!lidera) {
      throw new ForbiddenException('Solo puedes revisar las asistencias de los proyectos que lideras');
    }
    return proyecto;
  }

  async proyectosVisibles(user: RequestUser) {
    const qb = this.proyectos.createQueryBuilder('p').orderBy('p.nombre_proyecto', 'ASC');
    if (user.rol !== Role.ADMIN_PASTORAL) {
      qb.where('p.catolider_titular_id = :id OR p.catolider_aprendiz_id = :id', { id: user.id });
    }
    const lista = await qb.getMany();
    if (lista.length === 0) return [];

    const pendientes: { id_proyecto: number; total: string }[] = await this.registros
      .createQueryBuilder('r')
      .innerJoin('r.asignacion', 'a')
      .select('a.idProyecto', 'id_proyecto')
      .addSelect('COUNT(*)', 'total')
      .where('a.idProyecto IN (:...ids)', { ids: lista.map((p) => p.id) })
      .andWhere('r.estadoAprobacion = :e', { e: EstadoAsistencia.REGISTRADO })
      .groupBy('a.idProyecto')
      .getRawMany();
    const porProyecto = new Map(pendientes.map((p) => [Number(p.id_proyecto), Number(p.total)]));

    return lista.map((p) => ({
      id: p.id,
      nombre: p.nombre_proyecto,
      zona: p.macrodistrito_zona,
      tarifaPasaje: Number(p.monto_pasaje_por_dia),
      pendientesAprobacion: porProyecto.get(p.id) ?? 0,
    }));
  }

  // ---------------------------------------------------------------------------
  // P-18 / P-16: el voluntario registra su jornada
  // ---------------------------------------------------------------------------

  async marcar(user: RequestUser, dto: MarcarAsistenciaDto) {
    const asignacion = await this.asignacionActiva(user.id);
    if (!asignacion) {
      throw new NotFoundException('Aún no tienes un proyecto receptor asignado. Consulta con Pastoral UCB.');
    }
    // RF-07: sin póliza validada e inducción completada no se registran horas en campo.
    if (!asignacion.habilitadoCampo) {
      throw new ForbiddenException(
        'Tus horas en campo están bloqueadas hasta que Pastoral valide tu póliza de seguro y completes la inducción.',
      );
    }

    if (dto.fecha > fechaLocalISO()) {
      throw new BadRequestException('No puedes registrar una jornada con fecha futura.');
    }
    const horas = calcularHoras(dto.horaIngreso, dto.horaSalida);
    if (horas === null) {
      throw new BadRequestException('La hora de salida debe ser posterior a la hora de ingreso.');
    }
    if (horas > MAX_HORAS_JORNADA) {
      throw new BadRequestException(`Una jornada no puede superar las ${MAX_HORAS_JORNADA} horas.`);
    }

    const [anio, mes] = dto.fecha.split('-').map((n) => parseInt(n, 10));
    if (await this.mesConciliado(asignacion.idProyecto, mes, anio)) {
      throw new ForbiddenException('Ese mes ya fue conciliado por Pastoral y no admite nuevos registros (RNF-06).');
    }

    const tipo =
      dto.tipoActividad === 'NO_PRESENCIAL'
        ? TipoActividadAsistencia.NO_PRESENCIAL
        : TipoActividadAsistencia.PRESENCIAL;

    if (tipo === TipoActividadAsistencia.PRESENCIAL) {
      const duplicado = await this.registros.findOne({
        where: {
          idAsignacion: asignacion.id,
          fecha: dto.fecha,
          tipoActividad: TipoActividadAsistencia.PRESENCIAL,
        },
      });
      if (duplicado) {
        throw new ConflictException('Ya registraste una jornada presencial en esa fecha.');
      }
    }

    const registro = this.registros.create({
      idAsignacion: asignacion.id,
      fecha: dto.fecha,
      horaIngreso: dto.horaIngreso,
      horaSalida: dto.horaSalida,
      horasCalculadas: horas,
      tareasRealizadas: dto.tareasRealizadas.trim(),
      tipoActividad: tipo,
      // RF-17: solo las jornadas presenciales generan reposición de pasajes.
      generaPasaje: tipo === TipoActividadAsistencia.PRESENCIAL,
      estadoAprobacion: EstadoAsistencia.REGISTRADO,
      registradoPorId: user.id,
    });
    const guardado = await this.registros.save(registro);
    return { message: 'Jornada registrada. Tu Catolíder la revisará esta semana.', registro: this.vista(guardado) };
  }

  async misRegistros(userId: number, mes?: number, anio?: number) {
    const qb = this.registros
      .createQueryBuilder('r')
      .innerJoinAndSelect('r.asignacion', 'a')
      .leftJoinAndSelect('a.proyecto', 'p')
      .leftJoinAndSelect('r.actividadEmergente', 'e')
      .where('a.idUsuario = :userId', { userId })
      .orderBy('r.fecha', 'DESC')
      .addOrderBy('r.horaIngreso', 'DESC');
    if (mes && anio) {
      const { desde, hasta } = rangoMes(mes, anio);
      qb.andWhere('r.fecha BETWEEN :desde AND :hasta', { desde, hasta });
    }
    const lista = await qb.getMany();
    return lista.map((r) => this.vista(r));
  }

  // ---------------------------------------------------------------------------
  // P-16: revisión del Catolíder
  // ---------------------------------------------------------------------------

  async registrosProyecto(user: RequestUser, proyectoId: number, mes: number, anio: number) {
    const proyecto = await this.assertAccesoProyecto(user, proyectoId);
    const { desde, hasta } = rangoMes(mes, anio);

    const registros = await this.registros
      .createQueryBuilder('r')
      .innerJoinAndSelect('r.asignacion', 'a')
      .leftJoinAndSelect('a.usuario', 'u')
      .leftJoinAndSelect('r.actividadEmergente', 'e')
      .where('a.idProyecto = :proyectoId', { proyectoId })
      .andWhere('r.fecha BETWEEN :desde AND :hasta', { desde, hasta })
      .orderBy('r.fecha', 'DESC')
      .addOrderBy('r.horaIngreso', 'DESC')
      .getMany();

    const asignaciones = await this.asignaciones.find({
      where: { idProyecto: proyectoId, estado: EstadoAsignacion.ACTIVO },
      relations: { usuario: true },
    });

    // Horas del semestre por asignación (para la barra de avance hacia la meta)
    const ids = asignaciones.map((a) => a.id);
    const horasSemestre = new Map<number, number>();
    if (ids.length) {
      const filas: { id: number; horas: string }[] = await this.registros
        .createQueryBuilder('r')
        .select('r.idAsignacion', 'id')
        .addSelect('COALESCE(SUM(r.horasCalculadas), 0)', 'horas')
        .where('r.idAsignacion IN (:...ids)', { ids })
        .andWhere('r.estadoAprobacion IN (:...estados)', { estados: ESTADOS_QUE_SUMAN })
        .groupBy('r.idAsignacion')
        .getRawMany();
      filas.forEach((f) => horasSemestre.set(Number(f.id), Number(f.horas)));
    }

    const voluntarios = asignaciones.map((a) => {
      const propios = registros.filter(
        (r) => r.idAsignacion === a.id && ESTADOS_QUE_SUMAN.includes(r.estadoAprobacion),
      );
      return {
        asignacionId: a.id,
        usuarioId: a.idUsuario,
        nombre: nombreCompleto(a.usuario),
        ci: a.usuario?.ci ?? '',
        celular: a.usuario?.telefono ?? '',
        carrera: a.usuario?.carrera ?? '',
        habilitadoCampo: a.habilitadoCampo,
        horasMes: this.redondear(propios.reduce((s, r) => s + Number(r.horasCalculadas), 0)),
        diasPresencialesMes: new Set(
          propios.filter((r) => r.tipoActividad === TipoActividadAsistencia.PRESENCIAL).map((r) => r.fecha),
        ).size,
        horasSemestre: this.redondear(horasSemestre.get(a.id) ?? 0),
        pendientes: registros.filter(
          (r) => r.idAsignacion === a.id && r.estadoAprobacion === EstadoAsistencia.REGISTRADO,
        ).length,
      };
    });

    const conciliacion = await this.mesConciliado(proyectoId, mes, anio);
    const sumar = (filtro: (r: RegistroAsistenciaEntity) => boolean) =>
      this.redondear(
        registros
          .filter((r) => ESTADOS_QUE_SUMAN.includes(r.estadoAprobacion) && filtro(r))
          .reduce((s, r) => s + Number(r.horasCalculadas), 0),
      );

    return {
      proyecto: {
        id: proyecto.id,
        nombre: proyecto.nombre_proyecto,
        tarifaPasaje: Number(proyecto.monto_pasaje_por_dia),
        supervisor: proyecto.supervisor_nombre,
      },
      mes,
      anio,
      conciliado: Boolean(conciliacion),
      conciliacion: conciliacion
        ? {
            fecha: conciliacion.fechaConciliacion,
            reporteUrl: conciliacion.reporteFirmasSupervisorUrl ?? null,
            totalDias: conciliacion.totalDiasAsistidos,
            montoTotal: Number(conciliacion.montoTotalPasajes),
          }
        : null,
      kpis: {
        totalRegistros: registros.length,
        pendientes: registros.filter((r) => r.estadoAprobacion === EstadoAsistencia.REGISTRADO).length,
        aprobados: registros.filter((r) => ESTADOS_VALIDADOS.includes(r.estadoAprobacion)).length,
        observados: registros.filter((r) => r.estadoAprobacion === EstadoAsistencia.OBSERVADO_CATOLIDER).length,
        horasPresenciales: sumar((r) => r.tipoActividad === TipoActividadAsistencia.PRESENCIAL),
        horasNoPresenciales: sumar((r) => r.tipoActividad !== TipoActividadAsistencia.PRESENCIAL),
      },
      voluntarios,
      registros: registros.map((r) => ({
        ...this.vista(r),
        voluntario: {
          id: r.asignacion?.idUsuario,
          nombre: nombreCompleto(r.asignacion?.usuario),
          ci: r.asignacion?.usuario?.ci ?? '',
        },
      })),
    };
  }

  async aprobar(user: RequestUser, id: number, dto: AprobarAsistenciaDto) {
    const registro = await this.registros.findOne({ where: { id }, relations: { asignacion: true } });
    if (!registro) throw new NotFoundException('Registro de asistencia no encontrado');
    await this.assertAccesoProyecto(user, registro.asignacion.idProyecto);

    if (registro.asignacion.idUsuario === user.id && user.rol !== Role.ADMIN_PASTORAL) {
      throw new ForbiddenException('No puedes aprobar tus propias jornadas.');
    }
    if (registro.estadoAprobacion === EstadoAsistencia.CONCILIADO_PASTORAL) {
      throw new ForbiddenException('Este registro ya fue conciliado por Pastoral y es inmutable (RNF-06).');
    }

    registro.estadoAprobacion = dto.aprobado
      ? EstadoAsistencia.APROBADO_CATOLIDER
      : EstadoAsistencia.OBSERVADO_CATOLIDER;
    registro.observacionesAprobacion = dto.aprobado ? (dto.observaciones?.trim() || null) : dto.observaciones!.trim();
    registro.aprobadoPorCatoliderId = user.id;
    registro.fechaAprobacion = new Date();
    const guardado = await this.registros.save(registro);
    return { message: dto.aprobado ? 'Registro aprobado' : 'Registro observado', registro: this.vista(guardado) };
  }

  // ---------------------------------------------------------------------------
  // P-16: conciliación mensual (Pastoral) — genera las liquidaciones de P-17
  // ---------------------------------------------------------------------------

  async conciliar(admin: RequestUser, dto: ConciliarMesDto, archivo?: Express.Multer.File) {
    const proyecto = await this.proyectos.findOne({ where: { id: dto.proyectoId } });
    if (!proyecto) throw new NotFoundException('Proyecto receptor no encontrado');
    if (await this.mesConciliado(dto.proyectoId, dto.mes, dto.anio)) {
      throw new ConflictException('Ese mes ya fue conciliado para este proyecto.');
    }

    const { desde, hasta } = rangoMes(dto.mes, dto.anio);
    const asignacionesProyecto = await this.asignaciones.find({ where: { idProyecto: dto.proyectoId } });
    const ids = asignacionesProyecto.map((a) => a.id);
    const registros = ids.length
      ? await this.registros.find({ where: { idAsignacion: In(ids), fecha: Between(desde, hasta) } })
      : [];

    const sinRevisar = registros.filter((r) => r.estadoAprobacion === EstadoAsistencia.REGISTRADO).length;
    if (sinRevisar > 0) {
      throw new BadRequestException(
        `Hay ${sinRevisar} registro(s) sin revisar por el Catolíder. Deben aprobarse u observarse antes de conciliar.`,
      );
    }

    const tarifa = Number(proyecto.monto_pasaje_por_dia);
    const aprobados = registros.filter((r) => r.estadoAprobacion === EstadoAsistencia.APROBADO_CATOLIDER);

    let reporteUrl: string | null = null;
    if (archivo) {
      const subido = await this.storage.uploadFile(archivo, 'conciliaciones');
      reporteUrl = subido.url;
    }

    return this.dataSource.transaction(async (manager) => {
      const conciliacion = await manager.save(
        manager.create(ConciliacionMensualEntity, {
          proyectoId: dto.proyectoId,
          semestre: asignacionesProyecto[0]?.semestre ?? '2/2026',
          mes: dto.mes,
          anio: dto.anio,
          reporteFirmasSupervisorUrl: reporteUrl,
          observaciones: dto.observaciones?.trim() || null,
          conciliadoPor: admin.id,
          fechaConciliacion: new Date(),
        }),
      );

      let totalDias = 0;
      let totalMonto = 0;
      let voluntarios = 0;
      for (const asignacionId of ids) {
        const propios = aprobados.filter((r) => r.idAsignacion === asignacionId);
        if (propios.length === 0) continue;
        const dias = new Set(propios.filter((r) => r.generaPasaje).map((r) => r.fecha)).size;
        const horasPres = propios
          .filter((r) => r.tipoActividad === TipoActividadAsistencia.PRESENCIAL)
          .reduce((s, r) => s + Number(r.horasCalculadas), 0);
        const monto = dias * tarifa; // RF-17: días validados × tarifa fija del proyecto
        await manager.save(
          manager.create(LiquidacionPasajeEntity, {
            idAsignacion: asignacionId,
            idConciliacion: conciliacion.id,
            mes: dto.mes,
            anio: dto.anio,
            diasPresencialesAsistidos: dias,
            horasPresenciales: this.redondear(horasPres),
            tarifaDiariaAplicada: tarifa,
            montoTotalReponer: monto,
          }),
        );
        totalDias += dias;
        totalMonto += monto;
        voluntarios += 1;
      }

      if (aprobados.length) {
        await manager.update(
          RegistroAsistenciaEntity,
          { id: In(aprobados.map((r) => r.id)) },
          { estadoAprobacion: EstadoAsistencia.CONCILIADO_PASTORAL, conciliadoEnPlanilla: true },
        );
      }

      conciliacion.totalVoluntariosReportados = voluntarios;
      conciliacion.totalDiasAsistidos = totalDias;
      conciliacion.montoTotalPasajes = totalMonto;
      await manager.save(conciliacion);

      return {
        message: `Mes conciliado: ${aprobados.length} registro(s), ${totalDias} día(s), Bs ${totalMonto.toFixed(2)}.`,
        conciliacionId: conciliacion.id,
        voluntarios,
        totalDias,
        montoTotal: totalMonto,
      };
    });
  }

  // ---------------------------------------------------------------------------
  // P-18: actividades emergentes
  // ---------------------------------------------------------------------------

  async crearEmergente(admin: RequestUser, dto: CrearActividadEmergenteDto) {
    const horasRango = calcularHoras(dto.horaInicio, dto.horaFin);
    if (horasRango === null) {
      throw new BadRequestException('La hora de fin debe ser posterior a la hora de inicio.');
    }
    const actividad = this.emergentes.create({
      nombre: dto.nombre.trim(),
      descripcion: dto.descripcion?.trim() || null,
      lugar: dto.lugar?.trim() || null,
      fecha: dto.fecha,
      horaInicio: dto.horaInicio,
      horaFin: dto.horaFin,
      horasOtorgadas: dto.horasOtorgadas ?? horasRango,
      generaPasaje: dto.generaPasaje ?? false,
      cupoMaximo: dto.cupoMaximo ?? null,
      semestre: await this.semestreVigente(),
      activa: true,
      creadoPor: admin.id,
    });
    return this.emergentes.save(actividad);
  }

  async actualizarEmergente(id: number, dto: ActualizarActividadEmergenteDto) {
    const actividad = await this.emergentes.findOne({ where: { id } });
    if (!actividad) throw new NotFoundException('Actividad emergente no encontrada');
    if (dto.activa !== undefined) actividad.activa = dto.activa;
    if (dto.generaPasaje !== undefined) actividad.generaPasaje = dto.generaPasaje;
    return this.emergentes.save(actividad);
  }

  async listarEmergentes(userId?: number, soloActivas = false) {
    const actividades = await this.emergentes.find({
      where: soloActivas ? { activa: true } : {},
      order: { fecha: 'DESC' },
    });
    if (actividades.length === 0) return [];

    const conteos: { id: number; total: string }[] = await this.registros
      .createQueryBuilder('r')
      .select('r.idActividadEmergente', 'id')
      .addSelect('COUNT(*)', 'total')
      .where('r.idActividadEmergente IN (:...ids)', { ids: actividades.map((a) => a.id) })
      .groupBy('r.idActividadEmergente')
      .getRawMany();
    const participantes = new Map(conteos.map((c) => [Number(c.id), Number(c.total)]));

    let propias = new Map<number, EstadoAsistencia>();
    if (userId) {
      const mias = await this.registros
        .createQueryBuilder('r')
        .innerJoin('r.asignacion', 'a')
        .where('a.idUsuario = :userId', { userId })
        .andWhere('r.idActividadEmergente IS NOT NULL')
        .getMany();
      propias = new Map(mias.map((r) => [Number(r.idActividadEmergente), r.estadoAprobacion]));
    }

    return actividades.map((a) => ({
      id: a.id,
      nombre: a.nombre,
      descripcion: a.descripcion,
      lugar: a.lugar,
      fecha: a.fecha,
      horaInicio: a.horaInicio.slice(0, 5),
      horaFin: a.horaFin.slice(0, 5),
      horasOtorgadas: Number(a.horasOtorgadas),
      generaPasaje: a.generaPasaje,
      cupoMaximo: a.cupoMaximo ?? null,
      activa: a.activa,
      semestre: a.semestre,
      participantes: participantes.get(a.id) ?? 0,
      miParticipacion: propias.get(a.id) ?? null,
    }));
  }

  async participarEmergente(user: RequestUser, actividadId: number) {
    const actividad = await this.emergentes.findOne({ where: { id: actividadId } });
    if (!actividad || !actividad.activa) {
      throw new NotFoundException('La actividad no existe o ya no está habilitada por Pastoral.');
    }
    const asignacion = await this.asignacionActiva(user.id);
    if (!asignacion) {
      throw new NotFoundException('Necesitas un proyecto receptor asignado para sumar horas.');
    }
    if (!asignacion.habilitadoCampo) {
      throw new ForbiddenException('Tus horas están bloqueadas hasta que Pastoral valide tu póliza y completes la inducción.');
    }
    if (actividad.fecha > fechaLocalISO()) {
      throw new BadRequestException('Podrás registrar tu participación el día de la actividad o después.');
    }
    const [anio, mes] = actividad.fecha.split('-').map((n) => parseInt(n, 10));
    if (await this.mesConciliado(asignacion.idProyecto, mes, anio)) {
      throw new ForbiddenException('El mes de esta actividad ya fue conciliado (RNF-06).');
    }
    const ya = await this.registros.findOne({
      where: { idAsignacion: asignacion.id, idActividadEmergente: actividad.id },
    });
    if (ya) throw new ConflictException('Ya registraste tu participación en esta actividad.');
    if (actividad.cupoMaximo) {
      const inscritos = await this.registros.count({ where: { idActividadEmergente: actividad.id } });
      if (inscritos >= actividad.cupoMaximo) {
        throw new ConflictException('La actividad ya completó su cupo de participantes.');
      }
    }

    const registro = await this.registros.save(
      this.registros.create({
        idAsignacion: asignacion.id,
        fecha: actividad.fecha,
        horaIngreso: actividad.horaInicio,
        horaSalida: actividad.horaFin,
        horasCalculadas: Number(actividad.horasOtorgadas),
        tareasRealizadas: `Actividad emergente: ${actividad.nombre}`,
        tipoActividad: TipoActividadAsistencia.EMERGENTE,
        // Sin pasaje salvo que Pastoral active la excepción en la actividad.
        generaPasaje: actividad.generaPasaje,
        idActividadEmergente: actividad.id,
        estadoAprobacion: EstadoAsistencia.REGISTRADO,
        registradoPorId: user.id,
      }),
    );
    return { message: `¡Gracias por sumarte! Se registraron ${Number(actividad.horasOtorgadas)} h.`, registro: this.vista(registro) };
  }

  // ---------------------------------------------------------------------------

  private async semestreVigente(): Promise<string> {
    const ultima = await this.asignaciones.findOne({ where: {}, order: { createdAt: 'DESC' } });
    return ultima?.semestre ?? '2/2026';
  }

  redondear(n: number): number {
    return Math.round(n * 100) / 100;
  }

  vista(r: RegistroAsistenciaEntity) {
    return {
      id: r.id,
      asignacionId: r.idAsignacion,
      proyecto: r.asignacion?.proyecto?.nombre_proyecto ?? null,
      fecha: r.fecha,
      horaIngreso: r.horaIngreso?.slice(0, 5),
      horaSalida: r.horaSalida?.slice(0, 5),
      horas: Number(r.horasCalculadas),
      tareas: r.tareasRealizadas ?? '',
      tipoActividad: r.tipoActividad,
      generaPasaje: r.generaPasaje,
      actividadEmergente: r.actividadEmergente ? { id: r.actividadEmergente.id, nombre: r.actividadEmergente.nombre } : null,
      estado: r.estadoAprobacion,
      observaciones: r.observacionesAprobacion ?? null,
      fechaAprobacion: r.fechaAprobacion ?? null,
    };
  }
}
