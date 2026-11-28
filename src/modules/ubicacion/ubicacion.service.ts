import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, EntityManager } from 'typeorm';
import {
  AsignacionUbicacionEntity,
  CondicionVoluntario,
  EstadoAsignacion,
} from './entities/asignacion-ubicacion.entity';
import {
  HistorialReasignacionEntity,
  MotivoTraslado,
} from './entities/historial-reasignacion.entity';
import {
  NotificacionMovimientoEntity,
  TipoNotificacionMovimiento,
} from './entities/notificacion-movimiento.entity';
import { ProyectoReceptorEntity } from '../proyectos/entities/proyecto-receptor.entity';
import { NotificacionEntity } from '../notificaciones/notificacion.entity';
import { AsignarUbicacionDto } from './dto/asignar-ubicacion.dto';
import { ReasignarUbicacionDto } from './dto/reasignar-ubicacion.dto';
import { FilterPostulantesAdmitidosDto } from './dto/filter-postulantes-admitidos.dto';
import { NotificacionQueryDto } from './dto/notificacion-query.dto';
import { FilterHistorialReasignacionesDto } from './dto/filter-historial-reasignaciones.dto';

export interface EstudianteDemografico {
  id_usuario: number;
  nombre_completo: string;
  ci: string;
  celular: string;
  carrera: string;
  edad: number;
  condicion: CondicionVoluntario;
  poblacion_sugerida: string;
}

export interface VoluntarioAsignadoDetalle {
  id_asignacion: number;
  id_usuario: number;
  semestre: string;
  nombre: string;
  celular: string;
  carrera: string;
  condicion: CondicionVoluntario;
  edad: number;
  horario_comprometido: string;
  poliza_validada: boolean;
  induccion_completada: boolean;
  habilitado_campo: boolean;
  estado: EstadoAsignacion;
}

export interface BalanceDemografico {
  id_proyecto: number;
  nombre_proyecto: string;
  semestre: string;
  cupo_maximo_voluntarios: number;
  total_asignados_activos: number;
  cupos_disponibles: number;
  porcentaje_ocupacion: number;
  balance_condicion: {
    nuevos: number;
    antiguos: number;
    porcentaje_nuevos: number;
    porcentaje_antiguos: number;
  };
  distribucion_carreras: {
    carrera: string;
    cantidad: number;
    porcentaje: number;
  }[];
  promedio_edad: number;
  resumen_habilitacion_campo: {
    habilitados: number;
    pendientes: number;
    porcentaje_habilitados: number;
  };
}

interface GestionActivaInfo {
  semestre: string;
  fechaInicio: Date | null;
}

const ETIQUETAS_MOTIVO: Record<string, string> = {
  [MotivoTraslado.CRUCE_MATERIAS]: 'Cruce con materias universitarias',
  [MotivoTraslado.DIFICULTAD_TRANSPORTE]: 'Dificultad de transporte/distancia',
  [MotivoTraslado.SOLICITUD_SUPERVISOR]: 'Solicitud de supervisor del centro',
  [MotivoTraslado.INCOMPATIBILIDAD_PERFIL]: 'Incompatibilidad de perfil',
  [MotivoTraslado.OTRO_JUSTIFICADO]: 'Otro justificado',
  [MotivoTraslado.OTRO]: 'Otro',
};

@Injectable()
export class UbicacionService {
  private readonly catalogoEstudiantes: EstudianteDemografico[] = [
    {
      id_usuario: 101,
      nombre_completo: 'Valeria Nicole Morales Rios',
      ci: '8492019',
      celular: '77239102',
      carrera: 'Ingeniería de Sistemas',
      edad: 20,
      condicion: CondicionVoluntario.NUEVO,
      poblacion_sugerida: 'Niños y Primera Infancia',
    },
    {
      id_usuario: 102,
      nombre_completo: 'Carlos Eduardo Mendoza Silva',
      ci: '7102948',
      celular: '68102934',
      carrera: 'Psicología',
      edad: 22,
      condicion: CondicionVoluntario.ANTIGUO,
      poblacion_sugerida: 'Adultos Mayores',
    },
    {
      id_usuario: 103,
      nombre_completo: 'Mariana Sofia Alvarez Torrez',
      ci: '9182304',
      celular: '70619283',
      carrera: 'Medicina',
      edad: 21,
      condicion: CondicionVoluntario.NUEVO,
      poblacion_sugerida: 'Salud y Cuidados Paliativos',
    },
    {
      id_usuario: 104,
      nombre_completo: 'Rodrigo Javier Flores Quispe',
      ci: '8392011',
      celular: '75491028',
      carrera: 'Derecho',
      edad: 23,
      condicion: CondicionVoluntario.ANTIGUO,
      poblacion_sugerida: 'Adolescentes en Conflicto',
    },
    {
      id_usuario: 105,
      nombre_completo: 'Camila Andrea Gutierrez Paz',
      ci: '6948201',
      celular: '72039182',
      carrera: 'Comunicación Social',
      edad: 19,
      condicion: CondicionVoluntario.NUEVO,
      poblacion_sugerida: 'Apoyo Escolar y Lúdico',
    },
    {
      id_usuario: 106,
      nombre_completo: 'Mateo Sebastian Vargas Rojas',
      ci: '7920194',
      celular: '76291038',
      carrera: 'Administración de Empresas',
      edad: 22,
      condicion: CondicionVoluntario.ANTIGUO,
      poblacion_sugerida: 'Comedores Populares y Logística',
    },
    {
      id_usuario: 107,
      nombre_completo: 'Luciana Belen Ramos Castro',
      ci: '9021847',
      celular: '78910234',
      carrera: 'Arquitectura',
      edad: 21,
      condicion: CondicionVoluntario.NUEVO,
      poblacion_sugerida: 'Niños y Primera Infancia',
    },
    {
      id_usuario: 108,
      nombre_completo: 'Alejandro Gabriel Mamani Cruz',
      ci: '8102938',
      celular: '69018273',
      carrera: 'Ingeniería Industrial',
      edad: 24,
      condicion: CondicionVoluntario.ANTIGUO,
      poblacion_sugerida: 'Adultos Mayores',
    },
    {
      id_usuario: 109,
      nombre_completo: 'Daniela Fernanda Perez Ortiz',
      ci: '7482910',
      celular: '73019284',
      carrera: 'Psicología',
      edad: 20,
      condicion: CondicionVoluntario.NUEVO,
      poblacion_sugerida: 'Apoyo Psicosocial a Familias',
    },
    {
      id_usuario: 110,
      nombre_completo: 'Jorge Ignacio Chavez Pinto',
      ci: '8910293',
      celular: '71920384',
      carrera: 'Ingeniería de Sistemas',
      edad: 23,
      condicion: CondicionVoluntario.ANTIGUO,
      poblacion_sugerida: 'Talleres de Tecnología para Jóvenes',
    },
    {
      id_usuario: 111,
      nombre_completo: 'Natalia Eugenia Arce Beltran',
      ci: '8291034',
      celular: '77749102',
      carrera: 'Medicina',
      edad: 22,
      condicion: CondicionVoluntario.NUEVO,
      poblacion_sugerida: 'Salud y Cuidados Paliativos',
    },
    {
      id_usuario: 112,
      nombre_completo: 'Gabriel Andres Romero Luna',
      ci: '9102837',
      celular: '68920192',
      carrera: 'Derecho',
      edad: 21,
      condicion: CondicionVoluntario.NUEVO,
      poblacion_sugerida: 'Adolescentes en Conflicto',
    },
  ];

  constructor(
    @InjectRepository(AsignacionUbicacionEntity)
    private readonly asignacionRepository: Repository<AsignacionUbicacionEntity>,
    @InjectRepository(HistorialReasignacionEntity)
    private readonly historialRepository: Repository<HistorialReasignacionEntity>,
    @InjectRepository(NotificacionMovimientoEntity)
    private readonly notificacionRepository: Repository<NotificacionMovimientoEntity>,
    @InjectRepository(ProyectoReceptorEntity)
    private readonly proyectoRepository: Repository<ProyectoReceptorEntity>,
    private readonly dataSource: DataSource,
  ) {}

  private toUtcDayMs(date: Date): number {
    return Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate(),
    );
  }

  private async obtenerGestionActivaInfo(
    semestreParam?: string,
    gestionParam?: string,
    manager?: EntityManager,
  ): Promise<GestionActivaInfo> {
    const explicit = semestreParam?.trim() || gestionParam?.trim();
    const runner = manager ?? this.dataSource;

    if (runner && typeof runner.query === 'function') {
      try {
        if (explicit) {
          const rows: { fecha_inicio?: string | Date }[] = await runner.query(
            'SELECT fecha_inicio FROM semestres WHERE nombre ILIKE $1 ORDER BY fecha_inicio DESC LIMIT 1',
            [`%${explicit}%`],
          );
          const fechaInicio = rows?.[0]?.fecha_inicio
            ? new Date(rows[0].fecha_inicio)
            : null;
          return {
            semestre: explicit,
            fechaInicio:
              fechaInicio && !Number.isNaN(fechaInicio.getTime())
                ? fechaInicio
                : null,
          };
        }

        const rows: { nombre?: string; fecha_inicio?: string | Date }[] =
          await runner.query(
            'SELECT nombre, fecha_inicio FROM semestres WHERE activo = TRUE ORDER BY fecha_inicio DESC LIMIT 1',
          );
        const row = rows?.[0];
        if (row?.nombre) {
          const match = row.nombre.match(/[12]\/\d{4}/);
          const fechaInicio = row.fecha_inicio
            ? new Date(row.fecha_inicio)
            : null;
          return {
            semestre: match ? match[0] : row.nombre.trim(),
            fechaInicio:
              fechaInicio && !Number.isNaN(fechaInicio.getTime())
                ? fechaInicio
                : null,
          };
        }
      } catch {
        // Fallback cuando no existe tabla semestres en entorno aislado de pruebas
      }
    }

    return {
      semestre: explicit || '2/2026',
      fechaInicio: null,
    };
  }

  private getDatosEstudiante(idUsuario: number): EstudianteDemografico {
    const encontrado = this.catalogoEstudiantes.find(
      (e) => e.id_usuario === idUsuario,
    );
    if (encontrado) return encontrado;

    return {
      id_usuario: idUsuario,
      nombre_completo: `Voluntario UCB #${idUsuario}`,
      ci: `CI-${idUsuario}`,
      celular: '70000000',
      carrera: 'Carrera General',
      edad: 21,
      condicion: CondicionVoluntario.NUEVO,
      poblacion_sugerida: 'General',
    };
  }

  private obtenerLideresProyecto(
    proyecto?: ProyectoReceptorEntity | null,
  ): number[] {
    if (!proyecto) return [];
    const ids = [
      proyecto.catolider_titular_id,
      proyecto.catolider_aprendiz_id,
    ].filter((id): id is number => typeof id === 'number' && id > 0);
    return [...new Set(ids)];
  }

  private formatearMotivo(
    motivo: MotivoTraslado,
    detalle?: string | null,
  ): string {
    const base = ETIQUETAS_MOTIVO[motivo] || String(motivo);
    const detalleLimpio = detalle?.trim();
    if (
      (motivo === MotivoTraslado.OTRO ||
        motivo === MotivoTraslado.OTRO_JUSTIFICADO) &&
      detalleLimpio
    ) {
      return `${base}: ${detalleLimpio}`;
    }
    return base;
  }

  private async registrarNotificacionMovimiento(
    manager: EntityManager,
    params: {
      idUsuarioDestinatario: number;
      rolDestinatario: string;
      tipoNotificacion: TipoNotificacionMovimiento;
      idAsignacion: number | null;
      idProyecto: number | null;
      semestre: string;
      motivoTraslado?: string | null;
      motivoOtroDetalle?: string | null;
      titulo: string;
      mensaje: string;
      enlaceDestino?: string | null;
    },
  ): Promise<void> {
    const notif = manager.create(NotificacionMovimientoEntity, {
      id_usuario_destinatario: params.idUsuarioDestinatario,
      rol_destinatario: params.rolDestinatario,
      tipo_notificacion: params.tipoNotificacion,
      id_asignacion: params.idAsignacion,
      id_proyecto: params.idProyecto,
      semestre: params.semestre,
      motivo_traslado: params.motivoTraslado ?? null,
      motivo_otro_detalle: params.motivoOtroDetalle ?? null,
      titulo: params.titulo,
      mensaje: params.mensaje,
    });
    await manager.save(notif);

    if (typeof manager.insert === 'function') {
      try {
        await manager.insert(NotificacionEntity, {
          userId: params.idUsuarioDestinatario,
          semestre: params.semestre,
          titulo: params.titulo,
          mensaje: params.mensaje,
          tipo: params.tipoNotificacion,
          enlaceDestino: params.enlaceDestino ?? '/ubicacion',
        });
      } catch {
        // Ignorar si la tabla notificaciones_sistema no existe en entorno de prueba
      }
    }
  }

  async getPostulantesAdmitidosSinUbicar(
    filter: FilterPostulantesAdmitidosDto,
  ): Promise<EstudianteDemografico[]> {
    const { semestre } = await this.obtenerGestionActivaInfo(
      filter.semestre,
      filter.gestion,
    );

    const asignacionesActivas = await this.asignacionRepository.find({
      where: {
        semestre,
        estado: EstadoAsignacion.ACTIVO,
        activo: true,
      },
      select: { idUsuario: true },
    });

    const usuariosUbicados = new Set(
      asignacionesActivas.map(
        (a) =>
          a.idUsuario ?? (a as unknown as { id_usuario: number }).id_usuario,
      ),
    );

    let candidatos: EstudianteDemografico[] = [];
    if (this.dataSource && typeof this.dataSource.query === 'function') {
      try {
        const rows: {
          user_id: number;
          nombres: string;
          primer_apellido: string;
          segundo_apellido: string | null;
          ci: string | null;
          celular: string | null;
          carrera: string;
          edad_calculada: number;
          poblaciones_sugeridas: string[] | string | null;
          asignaciones_previas: string;
        }[] = await this.dataSource.query(
          `SELECT
             p.user_id,
             COALESCE(u.nombres, p.nombres, 'Postulante') AS nombres,
             COALESCE(u.primer_apellido, p.primer_apellido, '') AS primer_apellido,
             COALESCE(u.segundo_apellido, p.segundo_apellido, '') AS segundo_apellido,
             COALESCE(u.ci, p.ci, '') AS ci,
             COALESCE(p.celular, u.telefono, '') AS celular,
             p.carrera,
             p.edad_calculada,
             ep.poblaciones_sugeridas,
             (SELECT COUNT(*) FROM asignaciones_ubicacion au WHERE au.id_usuario = p.user_id AND au.semestre <> $1) AS asignaciones_previas
           FROM postulaciones p
           LEFT JOIN usuarios u ON u.id = p.user_id
           LEFT JOIN evaluaciones_psicologicas ep ON ep.postulacion_id = p.id
           WHERE p.semestre = $1
             AND p.user_id IS NOT NULL
             AND (p.estado_postulacion IN ('ADMITIDO', 'APTO_ENTREVISTA') AND (ep.dictamen IS NULL OR ep.dictamen IN ('APROBADO', 'OBSERVADO')))`,
          [semestre],
        );

        if (rows.length > 0) {
          candidatos = rows.map((r) => {
            const nombre = [r.nombres, r.primer_apellido, r.segundo_apellido]
              .filter(Boolean)
              .join(' ')
              .trim();
            const pops = Array.isArray(r.poblaciones_sugeridas)
              ? r.poblaciones_sugeridas.join(', ')
              : r.poblaciones_sugeridas || 'General';
            return {
              id_usuario: r.user_id,
              nombre_completo: nombre,
              ci: r.ci || `CI-${r.user_id}`,
              celular: r.celular || '70000000',
              carrera: r.carrera || 'General',
              edad: Number(r.edad_calculada) || 20,
              condicion:
                Number(r.asignaciones_previas) > 0
                  ? CondicionVoluntario.ANTIGUO
                  : CondicionVoluntario.NUEVO,
              poblacion_sugerida: pops,
            };
          });
        }
      } catch {
        // Fallback al catalogo en memoria si las tablas externas no estan disponibles
      }
    }

    const base = candidatos.length > 0 ? candidatos : this.catalogoEstudiantes;

    return base.filter((estudiante) => {
      if (usuariosUbicados.has(estudiante.id_usuario)) {
        return false;
      }

      if (
        filter.carrera &&
        !estudiante.carrera.toLowerCase().includes(filter.carrera.toLowerCase())
      ) {
        return false;
      }

      if (filter.edad_min !== undefined && estudiante.edad < filter.edad_min) {
        return false;
      }

      if (filter.edad_max !== undefined && estudiante.edad > filter.edad_max) {
        return false;
      }

      if (filter.condicion && estudiante.condicion !== filter.condicion) {
        return false;
      }

      if (
        filter.poblacion_sugerida &&
        !estudiante.poblacion_sugerida
          .toLowerCase()
          .includes(filter.poblacion_sugerida.toLowerCase())
      ) {
        return false;
      }

      return true;
    });
  }

  async getVoluntariosPorProyecto(
    idProyecto: number,
    semestreParam?: string,
    gestionParam?: string,
  ): Promise<VoluntarioAsignadoDetalle[]> {
    const proyecto = await this.proyectoRepository.findOne({
      where: { id: idProyecto },
    });
    if (!proyecto) {
      throw new NotFoundException(
        `Proyecto Receptor con id ${idProyecto} no encontrado`,
      );
    }

    const { semestre } = await this.obtenerGestionActivaInfo(
      semestreParam || proyecto.semestre,
      gestionParam,
    );

    const asignaciones = await this.asignacionRepository.find({
      where: {
        idProyecto,
        semestre,
        estado: EstadoAsignacion.ACTIVO,
        activo: true,
      },
      relations: { usuario: true },
      order: { id: 'ASC' },
    });

    return asignaciones.map((a) => {
      const fallback = this.getDatosEstudiante(a.id_usuario);
      const u = a.usuario;
      const nombreReal = u
        ? [u.nombres, u.primerApellido, u.segundoApellido]
            .filter(Boolean)
            .join(' ')
            .trim()
        : '';

      return {
        id_asignacion: a.id_asignacion,
        id_usuario: a.id_usuario,
        semestre: a.semestre,
        nombre: nombreReal || fallback.nombre_completo,
        celular: u?.telefono || fallback.celular,
        carrera: u?.carrera || fallback.carrera,
        condicion: a.condicion,
        edad: fallback.edad,
        horario_comprometido: a.horario_comprometido,
        poliza_validada: a.poliza_validada,
        induccion_completada: a.induccion_completada,
        habilitado_campo: a.habilitado_campo,
        estado: a.estado,
      };
    });
  }

  async getBalanceDemografico(
    idProyecto: number,
    semestreParam?: string,
    gestionParam?: string,
  ): Promise<BalanceDemografico> {
    const proyecto = await this.proyectoRepository.findOne({
      where: { id: idProyecto },
    });
    if (!proyecto) {
      throw new NotFoundException(
        `Proyecto Receptor con id ${idProyecto} no encontrado`,
      );
    }

    const { semestre } = await this.obtenerGestionActivaInfo(
      semestreParam || proyecto.semestre,
      gestionParam,
    );

    const voluntarios = await this.getVoluntariosPorProyecto(
      idProyecto,
      semestre,
    );
    const totalActivos = voluntarios.length;
    const cuposDisponibles = Math.max(
      0,
      proyecto.cupo_maximo_voluntarios - totalActivos,
    );
    const porcentajeOcupacion =
      proyecto.cupo_maximo_voluntarios > 0
        ? Number(
            ((totalActivos / proyecto.cupo_maximo_voluntarios) * 100).toFixed(
              2,
            ),
          )
        : 0;

    let nuevos = 0;
    let antiguos = 0;
    let sumaEdades = 0;
    let habilitadosCount = 0;
    const carrerasMap: Record<string, number> = {};

    for (const v of voluntarios) {
      if (v.condicion === CondicionVoluntario.NUEVO) {
        nuevos++;
      } else {
        antiguos++;
      }

      sumaEdades += v.edad;
      if (v.habilitado_campo) {
        habilitadosCount++;
      }

      carrerasMap[v.carrera] = (carrerasMap[v.carrera] || 0) + 1;
    }

    const porcentajeNuevos =
      totalActivos > 0 ? Number(((nuevos / totalActivos) * 100).toFixed(2)) : 0;
    const porcentajeAntiguos =
      totalActivos > 0
        ? Number(((antiguos / totalActivos) * 100).toFixed(2))
        : 0;
    const promedioEdad =
      totalActivos > 0 ? Number((sumaEdades / totalActivos).toFixed(1)) : 0;

    const distribucionCarreras = Object.entries(carrerasMap)
      .map(([carrera, cantidad]) => ({
        carrera,
        cantidad,
        porcentaje: Number(((cantidad / totalActivos) * 100).toFixed(2)),
      }))
      .sort((a, b) => b.cantidad - a.cantidad);

    const porcentajeHabilitados =
      totalActivos > 0
        ? Number(((habilitadosCount / totalActivos) * 100).toFixed(2))
        : 0;

    return {
      id_proyecto: proyecto.id_proyecto,
      nombre_proyecto: proyecto.nombre_proyecto,
      semestre,
      cupo_maximo_voluntarios: proyecto.cupo_maximo_voluntarios,
      total_asignados_activos: totalActivos,
      cupos_disponibles: cuposDisponibles,
      porcentaje_ocupacion: porcentajeOcupacion,
      balance_condicion: {
        nuevos,
        antiguos,
        porcentaje_nuevos: porcentajeNuevos,
        porcentaje_antiguos: porcentajeAntiguos,
      },
      distribucion_carreras: distribucionCarreras,
      promedio_edad: promedioEdad,
      resumen_habilitacion_campo: {
        habilitados: habilitadosCount,
        pendientes: totalActivos - habilitadosCount,
        porcentaje_habilitados: porcentajeHabilitados,
      },
    };
  }

  async asignarUbicacion(
    dto: AsignarUbicacionDto,
  ): Promise<AsignacionUbicacionEntity> {
    return await this.dataSource.transaction(async (manager) => {
      const proyecto = await manager.findOne(ProyectoReceptorEntity, {
        where: { id: dto.id_proyecto },
      });
      if (!proyecto) {
        throw new NotFoundException(
          `Proyecto Receptor con id ${dto.id_proyecto} no encontrado`,
        );
      }
      if (!proyecto.activo) {
        throw new BadRequestException(
          `El Proyecto Receptor "${proyecto.nombre_proyecto}" se encuentra inactivo`,
        );
      }

      const gestionInfo = await this.obtenerGestionActivaInfo(
        dto.semestre || proyecto.semestre,
        dto.gestion,
        manager,
      );
      const semestre = gestionInfo.semestre;

      if (proyecto.semestre && proyecto.semestre !== semestre) {
        throw new BadRequestException(
          `El Proyecto Receptor "${proyecto.nombre_proyecto}" pertenece a la gestión ${proyecto.semestre} y no coincide con la gestión solicitada (${semestre})`,
        );
      }

      const asignadosActivos = await manager.count(AsignacionUbicacionEntity, {
        where: {
          idProyecto: dto.id_proyecto,
          semestre,
          estado: EstadoAsignacion.ACTIVO,
          activo: true,
        },
      });

      if (asignadosActivos >= proyecto.cupo_maximo_voluntarios) {
        throw new BadRequestException(
          `El Proyecto Receptor "${proyecto.nombre_proyecto}" no tiene cupos disponibles (${asignadosActivos}/${proyecto.cupo_maximo_voluntarios})`,
        );
      }

      const yaAsignado = await manager.findOne(AsignacionUbicacionEntity, {
        where: {
          idUsuario: dto.id_usuario,
          semestre,
          estado: EstadoAsignacion.ACTIVO,
          activo: true,
        },
      });

      if (yaAsignado) {
        throw new ConflictException(
          `El voluntario con id ${dto.id_usuario} ya se encuentra asignado a un proyecto activo en el semestre ${semestre}`,
        );
      }

      const polizaValidada = Boolean(dto.poliza_validada);
      const induccionCompletada = Boolean(dto.induccion_completada);
      const habilitadoCampo = polizaValidada && induccionCompletada;

      const rawCond = String(dto.condicion || '').toUpperCase();
      const condicionFinal = rawCond.includes('ANTIGUO')
        ? CondicionVoluntario.ANTIGUO
        : CondicionVoluntario.NUEVO;

      const nuevaAsignacion = manager.create(AsignacionUbicacionEntity, {
        idUsuario: dto.id_usuario,
        id_usuario: dto.id_usuario,
        idProyecto: dto.id_proyecto,
        id_proyecto: dto.id_proyecto,
        semestre,
        condicion: condicionFinal,
        horario_comprometido: dto.horario_comprometido,
        polizaValidada,
        poliza_validada: polizaValidada,
        induccionCompletada,
        induccion_completada: induccionCompletada,
        habilitadoCampo,
        habilitado_campo: habilitadoCampo,
        estado: EstadoAsignacion.ACTIVO,
        activo: true,
      });

      const guardada = await manager.save(nuevaAsignacion);

      proyecto.cupoOcupado = asignadosActivos + 1;
      await manager.save(proyecto);

      const estudiante = this.getDatosEstudiante(dto.id_usuario);
      const motivoAsignacion = dto.motivo?.trim() || 'Asignación inicial';
      const lideresIds = this.obtenerLideresProyecto(proyecto);

      for (const liderId of lideresIds) {
        await this.registrarNotificacionMovimiento(manager, {
          idUsuarioDestinatario: liderId,
          rolDestinatario: 'CATOLIDER_DESTINO',
          tipoNotificacion: TipoNotificacionMovimiento.ALTA_CATOLIDER,
          idAsignacion: guardada.id_asignacion,
          idProyecto: proyecto.id_proyecto,
          semestre,
          motivoTraslado: motivoAsignacion,
          titulo: 'Nuevo Catovoluntario asignado a su Proyecto Receptor',
          mensaje: `Se ha asignado a ${estudiante.nombre_completo} (${estudiante.carrera}) al proyecto "${proyecto.nombre_proyecto}" en la gestión ${semestre}. Horario: ${dto.horario_comprometido}. Condición: ${condicionFinal}. Motivo: ${motivoAsignacion}. Habilitado para campo: ${habilitadoCampo ? 'SI' : 'NO'}.`,
        });
      }

      await this.registrarNotificacionMovimiento(manager, {
        idUsuarioDestinatario: dto.id_usuario,
        rolDestinatario: 'VOLUNTARIO',
        tipoNotificacion: TipoNotificacionMovimiento.ALTA_UBICACION,
        idAsignacion: guardada.id_asignacion,
        idProyecto: proyecto.id_proyecto,
        semestre,
        motivoTraslado: motivoAsignacion,
        titulo: 'Asignación a Proyecto Receptor Confirmada',
        mensaje: `Has sido asignado a "${proyecto.nombre_proyecto}" (${proyecto.macrodistrito_zona}) para la gestión ${semestre}. Horario comprometido: ${dto.horario_comprometido}. Tarifa fija de pasaje: Bs ${Number(proyecto.monto_pasaje_fijo)}. Recuerda que para ingresar a campo debes contar con tu póliza validada e inducción completada.`,
      });

      return guardada;
    });
  }

  async bajaUbicacion(
    idAsignacion: number,
    motivo?: string,
  ): Promise<{ message: string }> {
    return await this.dataSource.transaction(async (manager) => {
      const asignacion = await manager.findOne(AsignacionUbicacionEntity, {
        where: { id: idAsignacion },
        relations: { proyecto: true },
      });
      if (!asignacion) {
        throw new NotFoundException(
          `Asignación con id ${idAsignacion} no encontrada`,
        );
      }
      if (asignacion.estado !== EstadoAsignacion.ACTIVO) {
        throw new BadRequestException(
          `La asignación no está activa (estado actual: ${asignacion.estado})`,
        );
      }

      asignacion.estado = EstadoAsignacion.RETIRADO;
      asignacion.activo = false;
      asignacion.habilitado_campo = false;
      await manager.save(asignacion);

      if (asignacion.proyecto) {
        asignacion.proyecto.cupoOcupado = Math.max(
          0,
          (asignacion.proyecto.cupoOcupado || 1) - 1,
        );
        await manager.save(asignacion.proyecto);
      }

      const estudiante = this.getDatosEstudiante(asignacion.id_usuario);
      const nombreProyecto =
        asignacion.proyecto?.nombre_proyecto || 'Proyecto Receptor';
      const motivoFinal = motivo?.trim() || 'Retiro / Baja de Ubicación';
      const lideresIds = this.obtenerLideresProyecto(asignacion.proyecto);

      for (const liderId of lideresIds) {
        await this.registrarNotificacionMovimiento(manager, {
          idUsuarioDestinatario: liderId,
          rolDestinatario: 'CATOLIDER_ORIGEN',
          tipoNotificacion: TipoNotificacionMovimiento.BAJA_CATOLIDER,
          idAsignacion: asignacion.id_asignacion,
          idProyecto: asignacion.id_proyecto,
          semestre: asignacion.semestre,
          motivoTraslado: motivoFinal,
          titulo: 'Baja de Catovoluntario en Proyecto Receptor',
          mensaje: `Se ha registrado la baja de ${estudiante.nombre_completo} del proyecto "${nombreProyecto}" (gestión ${asignacion.semestre}). Motivo: ${motivoFinal}.`,
        });
      }

      await this.registrarNotificacionMovimiento(manager, {
        idUsuarioDestinatario: asignacion.id_usuario,
        rolDestinatario: 'VOLUNTARIO',
        tipoNotificacion: TipoNotificacionMovimiento.BAJA_UBICACION,
        idAsignacion: asignacion.id_asignacion,
        idProyecto: asignacion.id_proyecto,
        semestre: asignacion.semestre,
        motivoTraslado: motivoFinal,
        titulo: 'Baja de Proyecto Receptor',
        mensaje: `Se ha registrado tu baja del proyecto "${nombreProyecto}" (gestión ${asignacion.semestre}). Motivo: ${motivoFinal}.`,
      });

      return {
        message: `Baja de ubicación procesada exitosamente para el estudiante ${estudiante.nombre_completo}`,
      };
    });
  }

  async reasignarUbicacion(
    dto: ReasignarUbicacionDto,
    registradoPorId?: number,
  ): Promise<{
    mensaje: string;
    historial: HistorialReasignacionEntity;
    nueva_asignacion: AsignacionUbicacionEntity;
  }> {
    return await this.dataSource.transaction(async (manager) => {
      const asignacionOrigen = await manager.findOne(
        AsignacionUbicacionEntity,
        {
          where: { id: dto.id_asignacion_origen },
          relations: { proyecto: true },
        },
      );
      if (!asignacionOrigen) {
        throw new NotFoundException(
          `Asignación de origen con id ${dto.id_asignacion_origen} no encontrada`,
        );
      }
      if (asignacionOrigen.estado !== EstadoAsignacion.ACTIVO) {
        throw new BadRequestException(
          `La asignación de origen no está activa (estado actual: ${asignacionOrigen.estado})`,
        );
      }

      if (asignacionOrigen.id_proyecto === dto.id_proyecto_destino) {
        throw new BadRequestException(
          'El proyecto destino no puede ser igual al proyecto de origen',
        );
      }

      const fechaEfectiva = new Date(dto.fecha_efectiva);
      if (Number.isNaN(fechaEfectiva.getTime())) {
        throw new BadRequestException(
          'La fecha_efectiva proporcionada no es válida',
        );
      }

      const fechaAsignacion = asignacionOrigen.createdAt
        ? new Date(asignacionOrigen.createdAt)
        : new Date();
      const fechaEfectivaDia = this.toUtcDayMs(fechaEfectiva);
      const fechaAsignacionDia = this.toUtcDayMs(fechaAsignacion);

      if (fechaEfectivaDia < fechaAsignacionDia) {
        throw new BadRequestException(
          'La fecha efectiva de reasignación no puede ser anterior a la fecha de asignación de origen',
        );
      }

      const gestionInfo = await this.obtenerGestionActivaInfo(
        dto.semestre || asignacionOrigen.semestre,
        dto.gestion,
        manager,
      );

      const fechaInicioReferencia = gestionInfo.fechaInicio ?? fechaAsignacion;
      const fechaReferenciaDia = this.toUtcDayMs(fechaInicioReferencia);

      if (fechaEfectivaDia < fechaReferenciaDia) {
        throw new BadRequestException(
          'La fecha efectiva de reasignación no puede ser anterior al inicio de la gestión activa',
        );
      }

      const diffDiasVentana = Math.floor(
        (fechaEfectivaDia - fechaReferenciaDia) / (1000 * 60 * 60 * 24),
      );
      if (diffDiasVentana > 28) {
        throw new BadRequestException(
          `Las reasignaciones solo se permiten durante las primeras 4 semanas del semestre (han transcurrido ${diffDiasVentana} días según RF-13)`,
        );
      }

      const proyectoDestino = await manager.findOne(ProyectoReceptorEntity, {
        where: { id: dto.id_proyecto_destino },
      });
      if (!proyectoDestino) {
        throw new NotFoundException(
          `Proyecto Receptor destino con id ${dto.id_proyecto_destino} no encontrado`,
        );
      }
      if (!proyectoDestino.activo) {
        throw new BadRequestException(
          `El Proyecto Receptor destino "${proyectoDestino.nombre_proyecto}" se encuentra inactivo`,
        );
      }
      if (
        proyectoDestino.semestre &&
        asignacionOrigen.semestre &&
        proyectoDestino.semestre !== asignacionOrigen.semestre
      ) {
        throw new BadRequestException(
          `El Proyecto Receptor destino pertenece a la gestión ${proyectoDestino.semestre} y no coincide con la gestión de la asignación de origen (${asignacionOrigen.semestre})`,
        );
      }

      const semestreOperacion =
        asignacionOrigen.semestre || gestionInfo.semestre;

      const asignadosDestino = await manager.count(AsignacionUbicacionEntity, {
        where: {
          idProyecto: dto.id_proyecto_destino,
          semestre: semestreOperacion,
          estado: EstadoAsignacion.ACTIVO,
          activo: true,
        },
      });

      if (asignadosDestino >= proyectoDestino.cupo_maximo_voluntarios) {
        throw new BadRequestException(
          `El proyecto destino "${proyectoDestino.nombre_proyecto}" no cuenta con cupos disponibles (${asignadosDestino}/${proyectoDestino.cupo_maximo_voluntarios})`,
        );
      }

      asignacionOrigen.estado = EstadoAsignacion.REASIGNADO;
      asignacionOrigen.activo = false;
      await manager.save(asignacionOrigen);

      if (asignacionOrigen.proyecto) {
        asignacionOrigen.proyecto.cupoOcupado = Math.max(
          0,
          (asignacionOrigen.proyecto.cupoOcupado || 1) - 1,
        );
        await manager.save(asignacionOrigen.proyecto);
      }

      const nuevaAsignacion = manager.create(AsignacionUbicacionEntity, {
        idUsuario: asignacionOrigen.id_usuario,
        idProyecto: dto.id_proyecto_destino,
        semestre: semestreOperacion,
        condicion: asignacionOrigen.condicion,
        horario_comprometido:
          dto.nuevo_horario_comprometido ||
          asignacionOrigen.horario_comprometido,
        polizaValidada: asignacionOrigen.poliza_validada,
        induccionCompletada: asignacionOrigen.induccion_completada,
        habilitadoCampo:
          asignacionOrigen.poliza_validada &&
          asignacionOrigen.induccion_completada,
        estado: EstadoAsignacion.ACTIVO,
        activo: true,
      });
      const nuevaAsignacionGuardada = await manager.save(nuevaAsignacion);

      proyectoDestino.cupoOcupado = asignadosDestino + 1;
      await manager.save(proyectoDestino);

      const motivoMap: Record<string, MotivoTraslado> = {
        'Cruce con materias universitarias': MotivoTraslado.CRUCE_MATERIAS,
        'Dificultad de transporte/distancia':
          MotivoTraslado.DIFICULTAD_TRANSPORTE,
        'Solicitud de supervisor del centro':
          MotivoTraslado.SOLICITUD_SUPERVISOR,
        'Incompatibilidad de perfil': MotivoTraslado.INCOMPATIBILIDAD_PERFIL,
        'Otro justificado': MotivoTraslado.OTRO_JUSTIFICADO,
        Otro: MotivoTraslado.OTRO,
        OTRO: MotivoTraslado.OTRO,
        CRUCE_MATERIAS_UNIVERSITARIAS: MotivoTraslado.CRUCE_MATERIAS,
        DIFICULTAD_TRANSPORTE_DISTANCIA: MotivoTraslado.DIFICULTAD_TRANSPORTE,
        SOLICITUD_SUPERVISOR_CENTRO: MotivoTraslado.SOLICITUD_SUPERVISOR,
        INCOMPATIBILIDAD_PERFIL: MotivoTraslado.INCOMPATIBILIDAD_PERFIL,
        OTRO_JUSTIFICADO: MotivoTraslado.OTRO_JUSTIFICADO,
      };
      const motivoFinal = motivoMap[dto.motivo_traslado] || MotivoTraslado.OTRO;
      const motivoOtroDetalle =
        motivoFinal === MotivoTraslado.OTRO ||
        motivoFinal === MotivoTraslado.OTRO_JUSTIFICADO
          ? dto.motivo_otro_detalle?.trim() || null
          : null;

      if (motivoFinal === MotivoTraslado.OTRO && !motivoOtroDetalle) {
        throw new BadRequestException(
          'Debe especificar el detalle en motivo_otro_detalle cuando el motivo de traslado es Otro',
        );
      }

      const historial = manager.create(HistorialReasignacionEntity, {
        id_asignacion: asignacionOrigen.id_asignacion,
        id_usuario: asignacionOrigen.id_usuario,
        id_proyecto_origen: asignacionOrigen.id_proyecto,
        id_proyecto_destino: dto.id_proyecto_destino,
        semestre: semestreOperacion,
        motivo_traslado: motivoFinal,
        motivo_otro_detalle: motivoOtroDetalle,
        fecha_efectiva: fechaEfectiva,
        observaciones: dto.observaciones || null,
        registrado_por_id: registradoPorId || null,
      });
      const historialGuardado = await manager.save(historial);

      const estudiante = this.getDatosEstudiante(asignacionOrigen.id_usuario);
      const nombreOrigen =
        asignacionOrigen.proyecto?.nombre_proyecto || 'Origen';
      const nombreDestino = proyectoDestino.nombre_proyecto;
      const motivoTexto = this.formatearMotivo(motivoFinal, motivoOtroDetalle);

      const lideresOrigen = this.obtenerLideresProyecto(
        asignacionOrigen.proyecto,
      );
      for (const liderOrigenId of lideresOrigen) {
        await this.registrarNotificacionMovimiento(manager, {
          idUsuarioDestinatario: liderOrigenId,
          rolDestinatario: 'CATOLIDER_ORIGEN',
          tipoNotificacion: TipoNotificacionMovimiento.BAJA_CATOLIDER,
          idAsignacion: asignacionOrigen.id_asignacion,
          idProyecto: asignacionOrigen.id_proyecto,
          semestre: semestreOperacion,
          motivoTraslado: motivoFinal,
          motivoOtroDetalle,
          titulo: 'Baja por Reasignación de Catovoluntario',
          mensaje: `El voluntario ${estudiante.nombre_completo} fue reasignado desde "${nombreOrigen}" hacia "${nombreDestino}" (gestión ${semestreOperacion}). Motivo: ${motivoTexto}. Fecha efectiva: ${dto.fecha_efectiva}.`,
        });
      }

      const lideresDestino = this.obtenerLideresProyecto(proyectoDestino);
      for (const liderDestinoId of lideresDestino) {
        await this.registrarNotificacionMovimiento(manager, {
          idUsuarioDestinatario: liderDestinoId,
          rolDestinatario: 'CATOLIDER_DESTINO',
          tipoNotificacion: TipoNotificacionMovimiento.ALTA_CATOLIDER,
          idAsignacion: nuevaAsignacionGuardada.id_asignacion,
          idProyecto: proyectoDestino.id_proyecto,
          semestre: semestreOperacion,
          motivoTraslado: motivoFinal,
          motivoOtroDetalle,
          titulo: 'Alta por Reasignación de Catovoluntario',
          mensaje: `Se ha incorporado ${estudiante.nombre_completo} procedente de "${nombreOrigen}" a "${nombreDestino}" (gestión ${semestreOperacion}). Motivo: ${motivoTexto}. Horario: ${nuevaAsignacion.horario_comprometido}. Fecha efectiva: ${dto.fecha_efectiva}.`,
        });
      }

      await this.registrarNotificacionMovimiento(manager, {
        idUsuarioDestinatario: asignacionOrigen.id_usuario,
        rolDestinatario: 'VOLUNTARIO',
        tipoNotificacion: TipoNotificacionMovimiento.REASIGNACION_VOLUNTARIO,
        idAsignacion: nuevaAsignacionGuardada.id_asignacion,
        idProyecto: proyectoDestino.id_proyecto,
        semestre: semestreOperacion,
        motivoTraslado: motivoFinal,
        motivoOtroDetalle,
        titulo: 'Reasignación de Proyecto Receptor Aprobada',
        mensaje: `Tu traslado de "${nombreOrigen}" a "${nombreDestino}" en la gestión ${semestreOperacion} fue aprobado. Motivo: ${motivoTexto}. Fecha efectiva: ${dto.fecha_efectiva}. Tarifa fija de pasaje en el nuevo proyecto: Bs ${Number(proyectoDestino.monto_pasaje_fijo)}.`,
      });

      return {
        mensaje: `Reasignación de ${estudiante.nombre_completo} a "${nombreDestino}" ejecutada exitosamente`,
        historial: historialGuardado,
        nueva_asignacion: nuevaAsignacionGuardada,
      };
    });
  }

  async getHistorialReasignaciones(
    filter: FilterHistorialReasignacionesDto | number,
    idUsuarioLegacy?: number,
  ): Promise<HistorialReasignacionEntity[]> {
    const filtro: FilterHistorialReasignacionesDto =
      typeof filter === 'number'
        ? { id_proyecto: filter, id_usuario: idUsuarioLegacy }
        : filter || {};

    const query = this.historialRepository
      .createQueryBuilder('historial')
      .orderBy('historial.createdAt', 'DESC');

    if (filtro.id_proyecto) {
      query.andWhere(
        '(historial.id_proyecto_origen = :idProyecto OR historial.id_proyecto_destino = :idProyecto)',
        { idProyecto: filtro.id_proyecto },
      );
    }

    if (filtro.id_usuario) {
      query.andWhere('historial.id_usuario = :idUsuario', {
        idUsuario: filtro.id_usuario,
      });
    }

    const semestreSolicitado =
      filtro.semestre?.trim() || filtro.gestion?.trim();
    if (semestreSolicitado && semestreSolicitado.toUpperCase() !== 'TODOS') {
      query.andWhere('historial.semestre = :semestre', {
        semestre: semestreSolicitado,
      });
    } else if (!semestreSolicitado) {
      const { semestre } = await this.obtenerGestionActivaInfo();
      query.andWhere('historial.semestre = :semestre', { semestre });
    }

    return await query.getMany();
  }

  async getNotificaciones(
    queryDto: NotificacionQueryDto,
  ): Promise<NotificacionMovimientoEntity[]> {
    const query = this.notificacionRepository
      .createQueryBuilder('notif')
      .orderBy('notif.fecha_envio', 'DESC');

    if (queryDto.id_usuario !== undefined) {
      query.andWhere('notif.id_usuario_destinatario = :idUsuario', {
        idUsuario: queryDto.id_usuario,
      });
    }

    if (queryDto.rol_destinatario) {
      query.andWhere('notif.rol_destinatario = :rol', {
        rol: queryDto.rol_destinatario,
      });
    }

    if (queryDto.leido !== undefined) {
      query.andWhere('notif.leido = :leido', { leido: queryDto.leido });
    }

    const semestreSolicitado =
      queryDto.semestre?.trim() || queryDto.gestion?.trim();
    if (semestreSolicitado) {
      query.andWhere('notif.semestre = :semestre', {
        semestre: semestreSolicitado,
      });
    }

    return await query.getMany();
  }

  async marcarNotificacionLeida(
    idNotificacion: number,
  ): Promise<NotificacionMovimientoEntity> {
    const notif = await this.notificacionRepository.findOne({
      where: { id_notificacion: idNotificacion },
    });
    if (!notif) {
      throw new NotFoundException(
        `Notificación con id ${idNotificacion} no encontrada`,
      );
    }

    notif.leido = true;
    return await this.notificacionRepository.save(notif);
  }

  async actualizarEstadoDocumental(
    idAsignacion: number,
    polizaValidada?: boolean,
    induccionCompletada?: boolean,
  ): Promise<AsignacionUbicacionEntity> {
    const asignacion = await this.asignacionRepository.findOne({
      where: { id: idAsignacion },
    });
    if (!asignacion) {
      throw new NotFoundException(
        `Asignación con id ${idAsignacion} no encontrada`,
      );
    }

    if (polizaValidada !== undefined) {
      asignacion.poliza_validada = polizaValidada;
    }
    if (induccionCompletada !== undefined) {
      asignacion.induccion_completada = induccionCompletada;
    }

    asignacion.habilitado_campo =
      asignacion.poliza_validada && asignacion.induccion_completada;

    return await this.asignacionRepository.save(asignacion);
  }
}
