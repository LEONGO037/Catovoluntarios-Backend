import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
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
import { AsignarUbicacionDto } from './dto/asignar-ubicacion.dto';
import { ReasignarUbicacionDto } from './dto/reasignar-ubicacion.dto';
import { FilterPostulantesAdmitidosDto } from './dto/filter-postulantes-admitidos.dto';
import { NotificacionQueryDto } from './dto/notificacion-query.dto';

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

  async getPostulantesAdmitidosSinUbicar(
    filter: FilterPostulantesAdmitidosDto,
  ): Promise<EstudianteDemografico[]> {
    const asignacionesActivas = await this.asignacionRepository.find({
      where: { estado: EstadoAsignacion.ACTIVO },
      select: { id_usuario: true },
    });

    const usuariosUbicados = new Set(
      asignacionesActivas.map((a) => a.id_usuario),
    );

    return this.catalogoEstudiantes.filter((estudiante) => {
      if (usuariosUbicados.has(estudiante.id_usuario)) {
        return false;
      }

      if (
        filter.carrera &&
        !estudiante.carrera
          .toLowerCase()
          .includes(filter.carrera.toLowerCase())
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
  ): Promise<VoluntarioAsignadoDetalle[]> {
    const proyecto = await this.proyectoRepository.findOne({
      where: { id_proyecto: idProyecto },
    });
    if (!proyecto) {
      throw new NotFoundException(
        `Proyecto Receptor con id ${idProyecto} no encontrado`,
      );
    }

    const asignaciones = await this.asignacionRepository.find({
      where: {
        id_proyecto: idProyecto,
        estado: EstadoAsignacion.ACTIVO,
      },
      order: { id_asignacion: 'ASC' },
    });

    return asignaciones.map((a) => {
      const estudiante = this.getDatosEstudiante(a.id_usuario);
      return {
        id_asignacion: a.id_asignacion,
        id_usuario: a.id_usuario,
        nombre: estudiante.nombre_completo,
        celular: estudiante.celular,
        carrera: estudiante.carrera,
        condicion: a.condicion,
        edad: estudiante.edad,
        horario_comprometido: a.horario_comprometido,
        poliza_validada: a.poliza_validada,
        induccion_completada: a.induccion_completada,
        habilitado_campo: a.habilitado_campo,
        estado: a.estado,
      };
    });
  }

  async getBalanceDemografico(idProyecto: number): Promise<BalanceDemografico> {
    const proyecto = await this.proyectoRepository.findOne({
      where: { id_proyecto: idProyecto },
    });
    if (!proyecto) {
      throw new NotFoundException(
        `Proyecto Receptor con id ${idProyecto} no encontrado`,
      );
    }

    const voluntarios = await this.getVoluntariosPorProyecto(idProyecto);
    const totalActivos = voluntarios.length;
    const cuposDisponibles = Math.max(
      0,
      proyecto.cupo_maximo_voluntarios - totalActivos,
    );
    const porcentajeOcupacion =
      proyecto.cupo_maximo_voluntarios > 0
        ? Number(
            (
              (totalActivos / proyecto.cupo_maximo_voluntarios) *
              100
            ).toFixed(2),
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
      totalActivos > 0
        ? Number(((nuevos / totalActivos) * 100).toFixed(2))
        : 0;
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
        where: { id_proyecto: dto.id_proyecto },
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

      const asignadosActivos = await manager.count(AsignacionUbicacionEntity, {
        where: {
          id_proyecto: dto.id_proyecto,
          estado: EstadoAsignacion.ACTIVO,
        },
      });

      if (asignadosActivos >= proyecto.cupo_maximo_voluntarios) {
        throw new BadRequestException(
          `El Proyecto Receptor "${proyecto.nombre_proyecto}" no tiene cupos disponibles (${asignadosActivos}/${proyecto.cupo_maximo_voluntarios})`,
        );
      }

      const yaAsignado = await manager.findOne(AsignacionUbicacionEntity, {
        where: {
          id_usuario: dto.id_usuario,
          semestre: dto.semestre,
          estado: EstadoAsignacion.ACTIVO,
        },
      });

      if (yaAsignado) {
        throw new ConflictException(
          `El voluntario con id ${dto.id_usuario} ya se encuentra asignado a un proyecto activo en el semestre ${dto.semestre}`,
        );
      }

      const polizaValidada = Boolean(dto.poliza_validada);
      const induccionCompletada = Boolean(dto.induccion_completada);
      const habilitadoCampo = polizaValidada && induccionCompletada;

      const nuevaAsignacion = manager.create(AsignacionUbicacionEntity, {
        id_usuario: dto.id_usuario,
        id_proyecto: dto.id_proyecto,
        semestre: dto.semestre,
        condicion: dto.condicion,
        horario_comprometido: dto.horario_comprometido,
        poliza_validada: polizaValidada,
        induccion_completada: induccionCompletada,
        habilitado_campo: habilitadoCampo,
        estado: EstadoAsignacion.ACTIVO,
      });

      const guardada = await manager.save(nuevaAsignacion);

      const estudiante = this.getDatosEstudiante(dto.id_usuario);

      if (proyecto.catolider_titular_id) {
        const notifCatolider = manager.create(NotificacionMovimientoEntity, {
          id_usuario_destinatario: proyecto.catolider_titular_id,
          rol_destinatario: 'CATOLIDER_DESTINO',
          tipo_notificacion: TipoNotificacionMovimiento.ALTA_CATOLIDER,
          id_asignacion: guardada.id_asignacion,
          id_proyecto: proyecto.id_proyecto,
          titulo: 'Nuevo Catovoluntario asignado a su Proyecto Receptor',
          mensaje: `Se ha asignado a ${estudiante.nombre_completo} (${estudiante.carrera}) al proyecto "${proyecto.nombre_proyecto}". Horario: ${dto.horario_comprometido}. Condición: ${dto.condicion}. Habilitado para campo: ${habilitadoCampo ? 'SI' : 'NO'}.`,
        });
        await manager.save(notifCatolider);
      }

      const notifVoluntario = manager.create(NotificacionMovimientoEntity, {
        id_usuario_destinatario: dto.id_usuario,
        rol_destinatario: 'VOLUNTARIO',
        tipo_notificacion: TipoNotificacionMovimiento.ALTA_UBICACION,
        id_asignacion: guardada.id_asignacion,
        id_proyecto: proyecto.id_proyecto,
        titulo: 'Asignación a Proyecto Receptor Confirmada',
        mensaje: `Has sido asignado a "${proyecto.nombre_proyecto}" (${proyecto.macrodistrito_zona}). Horario comprometido: ${dto.horario_comprometido}. Tarifa fija de pasaje: Bs ${Number(proyecto.monto_pasaje_fijo)}. Recuerda que para ingresar a campo debes contar con tu póliza validada e inducción completada.`,
      });
      await manager.save(notifVoluntario);

      return guardada;
    });
  }

  async bajaUbicacion(idAsignacion: number): Promise<{ message: string }> {
    return await this.dataSource.transaction(async (manager) => {
      const asignacion = await manager.findOne(AsignacionUbicacionEntity, {
        where: { id_asignacion: idAsignacion },
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
      asignacion.habilitado_campo = false;
      await manager.save(asignacion);

      const estudiante = this.getDatosEstudiante(asignacion.id_usuario);
      const nombreProyecto =
        asignacion.proyecto?.nombre_proyecto || 'Proyecto Receptor';

      if (asignacion.proyecto?.catolider_titular_id) {
        const notifCatolider = manager.create(NotificacionMovimientoEntity, {
          id_usuario_destinatario: asignacion.proyecto.catolider_titular_id,
          rol_destinatario: 'CATOLIDER_ORIGEN',
          tipo_notificacion: TipoNotificacionMovimiento.BAJA_CATOLIDER,
          id_asignacion: asignacion.id_asignacion,
          id_proyecto: asignacion.id_proyecto,
          titulo: 'Baja de Catovoluntario en Proyecto Receptor',
          mensaje: `Se ha registrado la baja de ${estudiante.nombre_completo} del proyecto "${nombreProyecto}".`,
        });
        await manager.save(notifCatolider);
      }

      const notifVoluntario = manager.create(NotificacionMovimientoEntity, {
        id_usuario_destinatario: asignacion.id_usuario,
        rol_destinatario: 'VOLUNTARIO',
        tipo_notificacion: TipoNotificacionMovimiento.BAJA_UBICACION,
        id_asignacion: asignacion.id_asignacion,
        id_proyecto: asignacion.id_proyecto,
        titulo: 'Baja de Proyecto Receptor',
        mensaje: `Se ha registrado tu baja del proyecto "${nombreProyecto}".`,
      });
      await manager.save(notifVoluntario);

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
          where: { id_asignacion: dto.id_asignacion_origen },
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

      const fechaReferencia = asignacionOrigen.createdAt || new Date();
      const fechaEfectiva = new Date(dto.fecha_efectiva);
      const diffMs = Math.abs(fechaEfectiva.getTime() - fechaReferencia.getTime());
      const diffDias = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffDias > 28) {
        throw new BadRequestException(
          `Las reasignaciones solo se permiten durante las primeras 4 semanas del semestre (han transcurrido ${diffDias} días según RF-13)`,
        );
      }

      const proyectoDestino = await manager.findOne(ProyectoReceptorEntity, {
        where: { id_proyecto: dto.id_proyecto_destino },
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

      const asignadosDestino = await manager.count(AsignacionUbicacionEntity, {
        where: {
          id_proyecto: dto.id_proyecto_destino,
          estado: EstadoAsignacion.ACTIVO,
        },
      });

      if (asignadosDestino >= proyectoDestino.cupo_maximo_voluntarios) {
        throw new BadRequestException(
          `El proyecto destino "${proyectoDestino.nombre_proyecto}" no cuenta con cupos disponibles (${asignadosDestino}/${proyectoDestino.cupo_maximo_voluntarios})`,
        );
      }

      asignacionOrigen.estado = EstadoAsignacion.REASIGNADO;
      await manager.save(asignacionOrigen);

      const nuevaAsignacion = manager.create(AsignacionUbicacionEntity, {
        id_usuario: asignacionOrigen.id_usuario,
        id_proyecto: dto.id_proyecto_destino,
        semestre: asignacionOrigen.semestre,
        condicion: asignacionOrigen.condicion,
        horario_comprometido:
          dto.nuevo_horario_comprometido ||
          asignacionOrigen.horario_comprometido,
        poliza_validada: asignacionOrigen.poliza_validada,
        induccion_completada: asignacionOrigen.induccion_completada,
        habilitado_campo:
          asignacionOrigen.poliza_validada &&
          asignacionOrigen.induccion_completada,
        estado: EstadoAsignacion.ACTIVO,
      });
      const nuevaAsignacionGuardada = await manager.save(nuevaAsignacion);

      const historial = manager.create(HistorialReasignacionEntity, {
        id_asignacion: asignacionOrigen.id_asignacion,
        id_usuario: asignacionOrigen.id_usuario,
        id_proyecto_origen: asignacionOrigen.id_proyecto,
        id_proyecto_destino: dto.id_proyecto_destino,
        motivo_traslado: dto.motivo_traslado,
        fecha_efectiva: fechaEfectiva,
        observaciones: dto.observaciones || null,
        registrado_por_id: registradoPorId || null,
      });
      const historialGuardado = await manager.save(historial);

      const estudiante = this.getDatosEstudiante(asignacionOrigen.id_usuario);
      const nombreOrigen = asignacionOrigen.proyecto?.nombre_proyecto || 'Origen';
      const nombreDestino = proyectoDestino.nombre_proyecto;

      if (asignacionOrigen.proyecto?.catolider_titular_id) {
        const notifOrigen = manager.create(NotificacionMovimientoEntity, {
          id_usuario_destinatario:
            asignacionOrigen.proyecto.catolider_titular_id,
          rol_destinatario: 'CATOLIDER_ORIGEN',
          tipo_notificacion: TipoNotificacionMovimiento.BAJA_CATOLIDER,
          id_asignacion: asignacionOrigen.id_asignacion,
          id_proyecto: asignacionOrigen.id_proyecto,
          titulo: 'Baja por Reasignación de Catovoluntario',
          mensaje: `El voluntario ${estudiante.nombre_completo} fue reasignado a "${nombreDestino}". Motivo: ${dto.motivo_traslado}. Fecha efectiva: ${dto.fecha_efectiva}.`,
        });
        await manager.save(notifOrigen);
      }

      if (proyectoDestino.catolider_titular_id) {
        const notifDestino = manager.create(NotificacionMovimientoEntity, {
          id_usuario_destinatario: proyectoDestino.catolider_titular_id,
          rol_destinatario: 'CATOLIDER_DESTINO',
          tipo_notificacion: TipoNotificacionMovimiento.ALTA_CATOLIDER,
          id_asignacion: nuevaAsignacionGuardada.id_asignacion,
          id_proyecto: proyectoDestino.id_proyecto,
          titulo: 'Alta por Reasignación de Catovoluntario',
          mensaje: `Se ha incorporado ${estudiante.nombre_completo} procedente de "${nombreOrigen}". Motivo: ${dto.motivo_traslado}. Horario: ${nuevaAsignacion.horario_comprometido}. Fecha efectiva: ${dto.fecha_efectiva}.`,
        });
        await manager.save(notifDestino);
      }

      const notifVoluntario = manager.create(NotificacionMovimientoEntity, {
        id_usuario_destinatario: asignacionOrigen.id_usuario,
        rol_destinatario: 'VOLUNTARIO',
        tipo_notificacion:
          TipoNotificacionMovimiento.REASIGNACION_VOLUNTARIO,
        id_asignacion: nuevaAsignacionGuardada.id_asignacion,
        id_proyecto: proyectoDestino.id_proyecto,
        titulo: 'Reasignación de Proyecto Receptor Aprobada',
        mensaje: `Tu traslado de "${nombreOrigen}" a "${nombreDestino}" fue aprobado. Motivo: ${dto.motivo_traslado}. Fecha efectiva: ${dto.fecha_efectiva}. Tarifa fija de pasaje en el nuevo proyecto: Bs ${Number(proyectoDestino.monto_pasaje_fijo)}.`,
      });
      await manager.save(notifVoluntario);

      return {
        mensaje: `Reasignación de ${estudiante.nombre_completo} a "${nombreDestino}" ejecutada exitosamente`,
        historial: historialGuardado,
        nueva_asignacion: nuevaAsignacionGuardada,
      };
    });
  }

  async getHistorialReasignaciones(
    idProyecto?: number,
    idUsuario?: number,
  ): Promise<HistorialReasignacionEntity[]> {
    const query = this.historialRepository
      .createQueryBuilder('historial')
      .orderBy('historial.createdAt', 'DESC');

    if (idProyecto) {
      query.andWhere(
        '(historial.id_proyecto_origen = :idProyecto OR historial.id_proyecto_destino = :idProyecto)',
        { idProyecto },
      );
    }

    if (idUsuario) {
      query.andWhere('historial.id_usuario = :idUsuario', { idUsuario });
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
      where: { id_asignacion: idAsignacion },
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
