import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Optional,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { ProyectoReceptorEntity } from './entities/proyecto-receptor.entity';
import { InstitucionEntity } from './entities/institucion.entity';
import { CreateProyectoReceptorDto } from './dto/create-proyecto-receptor.dto';
import { UpdateProyectoReceptorDto } from './dto/update-proyecto-receptor.dto';
import { FilterProyectoDto } from './dto/filter-proyecto.dto';
import { ReactivarProyectoDto } from './dto/reactivar-proyecto.dto';
import {
  AsignacionUbicacionEntity,
  EstadoAsignacion,
} from '../ubicacion/entities/asignacion-ubicacion.entity';

export interface ProyectoConOcupacion {
  id: number;
  id_proyecto: number;
  id_institucion: number | null;
  institucion: InstitucionEntity | null;
  semestre: string;
  gestion: string;
  nombre_proyecto: string;
  direccion_exacta: string;
  macrodistrito_zona: string;
  nombre_supervisor_centro: string;
  telefono_contacto: string;
  correo: string;
  fecha_inicio_convenio: string;
  fecha_fin_convenio: string;
  poblacion_objetivo: string;
  actividades_semestre_actual: string;
  monto_pasaje_fijo: number;
  cupo_maximo_voluntarios: number;
  catolider_titular_id: number | null;
  catolider_aprendiz_id: number | null;
  activo: boolean;
  total_asignados_activos: number;
  cupos_disponibles: number;
  porcentaje_ocupacion: number;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class ProyectosService {
  constructor(
    @InjectRepository(ProyectoReceptorEntity)
    private readonly proyectoRepository: Repository<ProyectoReceptorEntity>,
    @InjectRepository(InstitucionEntity)
    private readonly institucionRepository: Repository<InstitucionEntity>,
    @InjectRepository(AsignacionUbicacionEntity)
    private readonly asignacionRepository: Repository<AsignacionUbicacionEntity>,
    @Optional()
    private readonly dataSource?: DataSource,
  ) {}

  async obtenerGestionActiva(
    semestreParam?: string,
    gestionParam?: string,
  ): Promise<string> {
    const explicit = semestreParam?.trim() || gestionParam?.trim();
    if (explicit) {
      return explicit;
    }

    if (this.dataSource && typeof this.dataSource.query === 'function') {
      try {
        const rows: { nombre?: string }[] = await this.dataSource.query(
          'SELECT nombre FROM semestres WHERE activo = TRUE ORDER BY fecha_inicio DESC LIMIT 1',
        );
        const nombre = rows?.[0]?.nombre;
        if (nombre) {
          const match = nombre.match(/[12]\/\d{4}/);
          return match ? match[0] : nombre.trim();
        }
      } catch {
        // Fallback a gestion por defecto si la tabla semestres no esta disponible
      }
    }

    return '2/2026';
  }

  private mapProyectoConOcupacion(
    p: ProyectoReceptorEntity,
    activos: number,
  ): ProyectoConOcupacion {
    const cuposDisponibles = Math.max(0, p.cupo_maximo_voluntarios - activos);
    const porcentaje =
      p.cupo_maximo_voluntarios > 0
        ? Number(((activos / p.cupo_maximo_voluntarios) * 100).toFixed(2))
        : 0;

    return {
      id: p.id,
      id_proyecto: p.id_proyecto,
      id_institucion: p.id_institucion ?? null,
      institucion: p.institucion ?? null,
      semestre: p.semestre || '2/2026',
      gestion: p.semestre || '2/2026',
      nombre_proyecto: p.nombre_proyecto,
      direccion_exacta: p.direccion_exacta,
      macrodistrito_zona: p.macrodistrito_zona,
      nombre_supervisor_centro: p.nombre_supervisor_centro,
      telefono_contacto: p.telefono_contacto,
      correo: p.correo || '',
      fecha_inicio_convenio: p.fecha_inicio_convenio || '',
      fecha_fin_convenio: p.fecha_fin_convenio || '',
      poblacion_objetivo: p.poblacion_objetivo,
      actividades_semestre_actual: p.actividades_semestre_actual,
      monto_pasaje_fijo: Number(p.monto_pasaje_fijo),
      cupo_maximo_voluntarios: p.cupo_maximo_voluntarios,
      catolider_titular_id: p.catolider_titular_id ?? null,
      catolider_aprendiz_id: p.catolider_aprendiz_id ?? null,
      activo: p.activo,
      total_asignados_activos: activos,
      cupos_disponibles: cuposDisponibles,
      porcentaje_ocupacion: porcentaje,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    };
  }

  private async contarActivosProyecto(
    idProyecto: number,
    semestre: string,
  ): Promise<number> {
    return await this.asignacionRepository.count({
      where: {
        idProyecto,
        semestre,
        estado: EstadoAsignacion.ACTIVO,
        activo: true,
      },
    });
  }

  async create(
    createDto: CreateProyectoReceptorDto,
  ): Promise<ProyectoReceptorEntity> {
    const semestre = await this.obtenerGestionActiva(
      createDto.semestre,
      createDto.gestion,
    );

    let institucion: InstitucionEntity | null = null;
    if (createDto.id_institucion) {
      institucion = await this.institucionRepository.findOne({
        where: { id: createDto.id_institucion },
      });
      if (!institucion) {
        throw new NotFoundException(
          `Institución con id ${createDto.id_institucion} no encontrada`,
        );
      }
      if (!institucion.activo) {
        throw new BadRequestException(
          `La institución "${institucion.nombre}" se encuentra inactiva`,
        );
      }
    } else {
      const encontrada = await this.institucionRepository.findOne({
        where: { nombre: createDto.nombre_proyecto.trim() },
      });
      if (encontrada) {
        institucion = encontrada;
      } else {
        const nuevaInst = this.institucionRepository.create({
          nombre: createDto.nombre_proyecto.trim(),
          direccion_exacta: createDto.direccion_exacta || '',
          macrodistrito_zona: createDto.macrodistrito_zona || 'Centro',
          nombre_supervisor_centro:
            createDto.nombre_supervisor_centro || 'Supervisor Asignado',
          telefono_contacto: createDto.telefono_contacto || '70000000',
          correo: createDto.correo || 'centro@pastoral.ucb.edu.bo',
          fecha_inicio_convenio: createDto.fecha_inicio_convenio || null,
          fecha_fin_convenio: createDto.fecha_fin_convenio || null,
          activo: true,
        });
        institucion = await this.institucionRepository.save(nuevaInst);
      }
    }

    const existeEnSemestre = await this.proyectoRepository.findOne({
      where: {
        id_institucion: institucion.id,
        nombre_proyecto: createDto.nombre_proyecto.trim(),
        semestre,
      },
    });
    if (existeEnSemestre) {
      throw new ConflictException(
        `Ya existe el Proyecto Receptor "${createDto.nombre_proyecto}" para la institución en la gestión ${semestre}`,
      );
    }

    const direccion =
      createDto.direccion_exacta ?? institucion.direccion_exacta;
    const zona = createDto.macrodistrito_zona ?? institucion.macrodistrito_zona;
    const supervisor =
      createDto.nombre_supervisor_centro ??
      institucion.nombre_supervisor_centro;
    const telefono =
      createDto.telefono_contacto ?? institucion.telefono_contacto;
    const correo =
      createDto.correo ?? institucion.correo ?? 'centro@pastoral.ucb.edu.bo';
    const fechaInicio =
      createDto.fecha_inicio_convenio ??
      institucion.fecha_inicio_convenio ??
      undefined;
    const fechaFin =
      createDto.fecha_fin_convenio ??
      institucion.fecha_fin_convenio ??
      undefined;

    const nuevoProyecto = this.proyectoRepository.create({
      id_institucion: institucion.id,
      institucion,
      semestre,
      nombre_proyecto: createDto.nombre_proyecto.trim(),
      direccion_exacta: direccion,
      macrodistrito_zona: zona,
      supervisor_nombre: supervisor,
      supervisor_telefono: telefono,
      correo,
      fecha_inicio_convenio: fechaInicio,
      fecha_fin_convenio: fechaFin,
      poblacion_objetivo: createDto.poblacion_objetivo,
      actividades_semestre_actual: createDto.actividades_semestre_actual,
      monto_pasaje_por_dia: Number(createDto.monto_pasaje_fijo),
      cupo_maximo: createDto.cupo_maximo_voluntarios,
      cupoOcupado: 0,
      catolider_titular_id: createDto.catolider_titular_id ?? null,
      catolider_aprendiz_id: createDto.catolider_aprendiz_id ?? null,
      activo: true,
    });

    return await this.proyectoRepository.save(nuevoProyecto);
  }

  async findAll(filter: FilterProyectoDto): Promise<{
    data: ProyectoConOcupacion[];
    total: number;
    page: number;
    limit: number;
    semestre_activo: string;
  }> {
    const page = filter.page || 1;
    const limit = filter.limit || 10;
    const skip = (page - 1) * limit;
    const semestreFiltro = filter.todos_semestres
      ? undefined
      : await this.obtenerGestionActiva(filter.semestre, filter.gestion);

    const queryBuilder = this.proyectoRepository
      .createQueryBuilder('proyecto')
      .leftJoinAndSelect('proyecto.institucion', 'institucion')
      .where('1=1');

    if (semestreFiltro) {
      queryBuilder.andWhere('proyecto.semestre = :semestre', {
        semestre: semestreFiltro,
      });
    }

    if (filter.id_institucion) {
      queryBuilder.andWhere('proyecto.id_institucion = :idInstitucion', {
        idInstitucion: filter.id_institucion,
      });
    }

    if (filter.solo_activos !== undefined && filter.solo_activos !== null) {
      queryBuilder.andWhere('proyecto.activo = :activo', {
        activo: filter.solo_activos,
      });
    }

    if (filter.macrodistrito_zona) {
      queryBuilder.andWhere(
        'LOWER(proyecto.macrodistrito_zona) LIKE LOWER(:macrodistrito)',
        {
          macrodistrito: `%${filter.macrodistrito_zona}%`,
        },
      );
    }

    if (filter.buscar) {
      queryBuilder.andWhere(
        "(LOWER(proyecto.nombre_proyecto) LIKE LOWER(:buscar) OR LOWER(proyecto.supervisor_nombre) LIKE LOWER(:buscar) OR LOWER(COALESCE(institucion.nombre, '')) LIKE LOWER(:buscar))",
        { buscar: `%${filter.buscar}%` },
      );
    }

    queryBuilder.orderBy('proyecto.id', 'ASC');

    const [proyectos, total] = await queryBuilder
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    const data: ProyectoConOcupacion[] = await Promise.all(
      proyectos.map(async (p) => {
        const activos = await this.contarActivosProyecto(
          p.id,
          p.semestre || '2/2026',
        );
        return this.mapProyectoConOcupacion(p, activos);
      }),
    );

    return {
      data,
      total,
      page,
      limit,
      semestre_activo: semestreFiltro || (await this.obtenerGestionActiva()),
    };
  }

  async findReutilizables(
    semestreDestino?: string,
    gestionDestino?: string,
  ): Promise<{
    semestre_destino: string;
    proyectos: ProyectoReceptorEntity[];
  }> {
    const semestreObjetivo = await this.obtenerGestionActiva(
      semestreDestino,
      gestionDestino,
    );

    const todos = await this.proyectoRepository
      .createQueryBuilder('proyecto')
      .leftJoinAndSelect('proyecto.institucion', 'institucion')
      .orderBy('proyecto.semestre', 'DESC')
      .addOrderBy('proyecto.nombre_proyecto', 'ASC')
      .getMany();

    const clavesActivasEnDestino = new Set(
      todos
        .filter((p) => p.semestre === semestreObjetivo && p.activo)
        .map(
          (p) =>
            `${p.id_institucion ?? 'none'}::${p.nombre_proyecto.toLowerCase()}`,
        ),
    );

    const reutilizables = todos.filter((p) => {
      const clave = `${p.id_institucion ?? 'none'}::${p.nombre_proyecto.toLowerCase()}`;
      if (p.semestre === semestreObjetivo) {
        return !p.activo;
      }
      return !clavesActivasEnDestino.has(clave);
    });

    return {
      semestre_destino: semestreObjetivo,
      proyectos: reutilizables,
    };
  }

  async findOne(id: number): Promise<ProyectoConOcupacion> {
    const p = await this.proyectoRepository.findOne({
      where: { id },
      relations: { institucion: true },
    });
    if (!p) {
      throw new NotFoundException(
        `Proyecto Receptor con id ${id} no encontrado`,
      );
    }

    const activos = await this.contarActivosProyecto(
      p.id,
      p.semestre || '2/2026',
    );
    return this.mapProyectoConOcupacion(p, activos);
  }

  async update(
    id: number,
    updateDto: UpdateProyectoReceptorDto,
  ): Promise<ProyectoReceptorEntity> {
    const proyecto = await this.proyectoRepository.findOne({
      where: { id },
      relations: { institucion: true },
    });
    if (!proyecto) {
      throw new NotFoundException(
        `Proyecto Receptor con id ${id} no encontrado`,
      );
    }

    const semestreObjetivo =
      updateDto.semestre?.trim() ||
      updateDto.gestion?.trim() ||
      proyecto.semestre ||
      '2/2026';

    let idInstitucionObjetivo = proyecto.id_institucion;
    if (updateDto.id_institucion !== undefined) {
      const inst = await this.institucionRepository.findOne({
        where: { id: updateDto.id_institucion },
      });
      if (!inst) {
        throw new NotFoundException(
          `Institución con id ${updateDto.id_institucion} no encontrada`,
        );
      }
      idInstitucionObjetivo = inst.id;
      proyecto.institucion = inst;
    }

    const nombreObjetivo =
      updateDto.nombre_proyecto?.trim() || proyecto.nombre_proyecto;

    if (
      nombreObjetivo !== proyecto.nombre_proyecto ||
      semestreObjetivo !== proyecto.semestre ||
      idInstitucionObjetivo !== proyecto.id_institucion
    ) {
      const repetido = await this.proyectoRepository.findOne({
        where: {
          id_institucion: idInstitucionObjetivo ?? undefined,
          nombre_proyecto: nombreObjetivo,
          semestre: semestreObjetivo,
        },
      });
      if (repetido && repetido.id !== id) {
        throw new ConflictException(
          `Ya existe el Proyecto Receptor "${nombreObjetivo}" en la gestión ${semestreObjetivo}`,
        );
      }
    }

    if (updateDto.cupo_maximo_voluntarios !== undefined) {
      const asignadosActivos = await this.contarActivosProyecto(
        id,
        proyecto.semestre || '2/2026',
      );

      if (updateDto.cupo_maximo_voluntarios < asignadosActivos) {
        throw new BadRequestException(
          `No se puede reducir el cupo a ${updateDto.cupo_maximo_voluntarios} porque actualmente existen ${asignadosActivos} voluntarios activos ubicados`,
        );
      }
    }

    Object.assign(proyecto, updateDto);
    proyecto.semestre = semestreObjetivo;
    proyecto.id_institucion = idInstitucionObjetivo;
    if (updateDto.nombre_proyecto) {
      proyecto.nombre_proyecto = nombreObjetivo;
    }
    if (updateDto.nombre_supervisor_centro) {
      proyecto.supervisor_nombre = updateDto.nombre_supervisor_centro;
    }
    if (updateDto.telefono_contacto) {
      proyecto.supervisor_telefono = updateDto.telefono_contacto;
    }
    if (updateDto.cupo_maximo_voluntarios !== undefined) {
      proyecto.cupo_maximo = updateDto.cupo_maximo_voluntarios;
    }
    if (updateDto.monto_pasaje_fijo !== undefined) {
      proyecto.monto_pasaje_por_dia = Number(updateDto.monto_pasaje_fijo);
    }

    return await this.proyectoRepository.save(proyecto);
  }

  async reactivar(
    id: number,
    dto: ReactivarProyectoDto,
  ): Promise<ProyectoReceptorEntity> {
    const origen = await this.proyectoRepository.findOne({
      where: { id },
      relations: { institucion: true },
    });
    if (!origen) {
      throw new NotFoundException(
        `Proyecto Receptor con id ${id} no encontrado`,
      );
    }

    const semestreDestino = await this.obtenerGestionActiva(
      dto.semestre,
      dto.gestion,
    );

    if (origen.semestre === semestreDestino) {
      if (origen.institucion && !origen.institucion.activo) {
        origen.institucion.activo = true;
        await this.institucionRepository.save(origen.institucion);
      }

      origen.activo = true;
      if (dto.nombre_proyecto) {
        origen.nombre_proyecto = dto.nombre_proyecto.trim();
      }
      if (dto.poblacion_objetivo) {
        origen.poblacion_objetivo = dto.poblacion_objetivo;
      }
      if (dto.actividades_semestre_actual) {
        origen.actividades_semestre_actual = dto.actividades_semestre_actual;
      }
      if (dto.monto_pasaje_fijo !== undefined) {
        origen.monto_pasaje_por_dia = Number(dto.monto_pasaje_fijo);
      }
      if (dto.cupo_maximo_voluntarios !== undefined) {
        origen.cupo_maximo = dto.cupo_maximo_voluntarios;
      }
      if (dto.catolider_titular_id !== undefined) {
        origen.catolider_titular_id = dto.catolider_titular_id;
      }
      if (dto.catolider_aprendiz_id !== undefined) {
        origen.catolider_aprendiz_id = dto.catolider_aprendiz_id;
      }

      return await this.proyectoRepository.save(origen);
    }

    const nombreDestino = dto.nombre_proyecto?.trim() || origen.nombre_proyecto;
    const existenteDestino = await this.proyectoRepository.findOne({
      where: {
        id_institucion: origen.id_institucion ?? undefined,
        nombre_proyecto: nombreDestino,
        semestre: semestreDestino,
      },
    });
    if (existenteDestino) {
      if (!existenteDestino.activo) {
        existenteDestino.activo = true;
        if (dto.actividades_semestre_actual) {
          existenteDestino.actividades_semestre_actual =
            dto.actividades_semestre_actual;
        }
        if (dto.cupo_maximo_voluntarios !== undefined) {
          existenteDestino.cupo_maximo = dto.cupo_maximo_voluntarios;
        }
        if (dto.monto_pasaje_fijo !== undefined) {
          existenteDestino.monto_pasaje_por_dia = Number(dto.monto_pasaje_fijo);
        }
        return await this.proyectoRepository.save(existenteDestino);
      }
      throw new ConflictException(
        `El Proyecto Receptor "${nombreDestino}" ya se encuentra activo en la gestión ${semestreDestino}`,
      );
    }

    const inst = origen.institucion;
    if (inst && !inst.activo) {
      inst.activo = true;
      await this.institucionRepository.save(inst);
    }

    const clon = this.proyectoRepository.create({
      id_institucion: origen.id_institucion,
      institucion: inst ?? null,
      semestre: semestreDestino,
      nombre_proyecto: nombreDestino,
      direccion_exacta: inst?.direccion_exacta ?? origen.direccion_exacta,
      macrodistrito_zona: inst?.macrodistrito_zona ?? origen.macrodistrito_zona,
      supervisor_nombre:
        inst?.nombre_supervisor_centro ?? origen.supervisor_nombre,
      supervisor_telefono:
        inst?.telefono_contacto ?? origen.supervisor_telefono,
      correo: inst?.correo ?? origen.correo,
      fecha_inicio_convenio:
        inst?.fecha_inicio_convenio ?? origen.fecha_inicio_convenio,
      fecha_fin_convenio: inst?.fecha_fin_convenio ?? origen.fecha_fin_convenio,
      poblacion_objetivo: dto.poblacion_objetivo ?? origen.poblacion_objetivo,
      actividades_semestre_actual:
        dto.actividades_semestre_actual ?? origen.actividades_semestre_actual,
      monto_pasaje_por_dia:
        dto.monto_pasaje_fijo !== undefined
          ? Number(dto.monto_pasaje_fijo)
          : Number(origen.monto_pasaje_fijo),
      cupo_maximo:
        dto.cupo_maximo_voluntarios ?? origen.cupo_maximo_voluntarios,
      cupoOcupado: 0,
      catolider_titular_id:
        dto.catolider_titular_id !== undefined
          ? dto.catolider_titular_id
          : null,
      catolider_aprendiz_id:
        dto.catolider_aprendiz_id !== undefined
          ? dto.catolider_aprendiz_id
          : null,
      activo: true,
    });

    return await this.proyectoRepository.save(clon);
  }

  async remove(id: number): Promise<{ message: string }> {
    const proyecto = await this.proyectoRepository.findOne({
      where: { id },
    });
    if (!proyecto) {
      throw new NotFoundException(
        `Proyecto Receptor con id ${id} no encontrado`,
      );
    }

    const asignadosActivos = await this.contarActivosProyecto(
      id,
      proyecto.semestre || '2/2026',
    );

    if (asignadosActivos > 0) {
      throw new BadRequestException(
        `No se puede eliminar el Proyecto Receptor porque cuenta con ${asignadosActivos} voluntarios activos asignados. Realice las reasignaciones o bajas antes de proceder`,
      );
    }

    proyecto.activo = false;
    await this.proyectoRepository.save(proyecto);

    return {
      message: `Proyecto Receptor "${proyecto.nombre_proyecto}" desactivado exitosamente`,
    };
  }
}
