import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProyectoReceptorEntity } from './entities/proyecto-receptor.entity';
import { CreateProyectoReceptorDto } from './dto/create-proyecto-receptor.dto';
import { UpdateProyectoReceptorDto } from './dto/update-proyecto-receptor.dto';
import { FilterProyectoDto } from './dto/filter-proyecto.dto';
import {
  AsignacionUbicacionEntity,
  EstadoAsignacion,
} from '../ubicacion/entities/asignacion-ubicacion.entity';

export interface ProyectoConOcupacion {
  id_proyecto: number;
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
    @InjectRepository(AsignacionUbicacionEntity)
    private readonly asignacionRepository: Repository<AsignacionUbicacionEntity>,
  ) {}

  async create(
    createDto: CreateProyectoReceptorDto,
  ): Promise<ProyectoReceptorEntity> {
    const existe = await this.proyectoRepository.findOne({
      where: { nombre_proyecto: createDto.nombre_proyecto },
    });
    if (existe) {
      throw new ConflictException(
        `Ya existe un Proyecto Receptor con el nombre "${createDto.nombre_proyecto}"`,
      );
    }

    const nuevoProyecto = this.proyectoRepository.create({
      ...createDto,
      monto_pasaje_fijo: Number(createDto.monto_pasaje_fijo),
    });

    return await this.proyectoRepository.save(nuevoProyecto);
  }

  async findAll(filter: FilterProyectoDto): Promise<{
    data: ProyectoConOcupacion[];
    total: number;
    page: number;
    limit: number;
  }> {
    const page = filter.page || 1;
    const limit = filter.limit || 10;
    const skip = (page - 1) * limit;

    const queryBuilder = this.proyectoRepository
      .createQueryBuilder('proyecto')
      .where('1=1');

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
        '(LOWER(proyecto.nombre_proyecto) LIKE LOWER(:buscar) OR LOWER(proyecto.nombre_supervisor_centro) LIKE LOWER(:buscar))',
        { buscar: `%${filter.buscar}%` },
      );
    }

    queryBuilder.orderBy('proyecto.id_proyecto', 'ASC');

    const [proyectos, total] = await queryBuilder
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    const data: ProyectoConOcupacion[] = await Promise.all(
      proyectos.map(async (p) => {
        const activos = await this.asignacionRepository.count({
          where: {
            id_proyecto: p.id_proyecto,
            estado: EstadoAsignacion.ACTIVO,
          },
        });

        const cuposDisponibles = Math.max(
          0,
          p.cupo_maximo_voluntarios - activos,
        );
        const porcentaje =
          p.cupo_maximo_voluntarios > 0
            ? Number(((activos / p.cupo_maximo_voluntarios) * 100).toFixed(2))
            : 0;

        return {
          id_proyecto: p.id_proyecto,
          nombre_proyecto: p.nombre_proyecto,
          direccion_exacta: p.direccion_exacta,
          macrodistrito_zona: p.macrodistrito_zona,
          nombre_supervisor_centro: p.nombre_supervisor_centro,
          telefono_contacto: p.telefono_contacto,
          correo: p.correo,
          fecha_inicio_convenio: p.fecha_inicio_convenio,
          fecha_fin_convenio: p.fecha_fin_convenio,
          poblacion_objetivo: p.poblacion_objetivo,
          actividades_semestre_actual: p.actividades_semestre_actual,
          monto_pasaje_fijo: Number(p.monto_pasaje_fijo),
          cupo_maximo_voluntarios: p.cupo_maximo_voluntarios,
          catolider_titular_id: p.catolider_titular_id,
          catolider_aprendiz_id: p.catolider_aprendiz_id,
          activo: p.activo,
          total_asignados_activos: activos,
          cupos_disponibles: cuposDisponibles,
          porcentaje_ocupacion: porcentaje,
          createdAt: p.createdAt,
          updatedAt: p.updatedAt,
        };
      }),
    );

    return {
      data,
      total,
      page,
      limit,
    };
  }

  async findOne(id: number): Promise<ProyectoConOcupacion> {
    const p = await this.proyectoRepository.findOne({
      where: { id_proyecto: id },
    });
    if (!p) {
      throw new NotFoundException(
        `Proyecto Receptor con id ${id} no encontrado`,
      );
    }

    const activos = await this.asignacionRepository.count({
      where: {
        id_proyecto: p.id_proyecto,
        estado: EstadoAsignacion.ACTIVO,
      },
    });

    const cuposDisponibles = Math.max(0, p.cupo_maximo_voluntarios - activos);
    const porcentaje =
      p.cupo_maximo_voluntarios > 0
        ? Number(((activos / p.cupo_maximo_voluntarios) * 100).toFixed(2))
        : 0;

    return {
      id_proyecto: p.id_proyecto,
      nombre_proyecto: p.nombre_proyecto,
      direccion_exacta: p.direccion_exacta,
      macrodistrito_zona: p.macrodistrito_zona,
      nombre_supervisor_centro: p.nombre_supervisor_centro,
      telefono_contacto: p.telefono_contacto,
      correo: p.correo,
      fecha_inicio_convenio: p.fecha_inicio_convenio,
      fecha_fin_convenio: p.fecha_fin_convenio,
      poblacion_objetivo: p.poblacion_objetivo,
      actividades_semestre_actual: p.actividades_semestre_actual,
      monto_pasaje_fijo: Number(p.monto_pasaje_fijo),
      cupo_maximo_voluntarios: p.cupo_maximo_voluntarios,
      catolider_titular_id: p.catolider_titular_id,
      catolider_aprendiz_id: p.catolider_aprendiz_id,
      activo: p.activo,
      total_asignados_activos: activos,
      cupos_disponibles: cuposDisponibles,
      porcentaje_ocupacion: porcentaje,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    };
  }

  async update(
    id: number,
    updateDto: UpdateProyectoReceptorDto,
  ): Promise<ProyectoReceptorEntity> {
    const proyecto = await this.proyectoRepository.findOne({
      where: { id_proyecto: id },
    });
    if (!proyecto) {
      throw new NotFoundException(
        `Proyecto Receptor con id ${id} no encontrado`,
      );
    }

    if (
      updateDto.nombre_proyecto &&
      updateDto.nombre_proyecto !== proyecto.nombre_proyecto
    ) {
      const repetido = await this.proyectoRepository.findOne({
        where: { nombre_proyecto: updateDto.nombre_proyecto },
      });
      if (repetido) {
        throw new ConflictException(
          `Ya existe un Proyecto Receptor con el nombre "${updateDto.nombre_proyecto}"`,
        );
      }
    }

    if (updateDto.cupo_maximo_voluntarios !== undefined) {
      const asignadosActivos = await this.asignacionRepository.count({
        where: {
          id_proyecto: id,
          estado: EstadoAsignacion.ACTIVO,
        },
      });

      if (updateDto.cupo_maximo_voluntarios < asignadosActivos) {
        throw new BadRequestException(
          `No se puede reducir el cupo a ${updateDto.cupo_maximo_voluntarios} porque actualmente existen ${asignadosActivos} voluntarios activos ubicados`,
        );
      }
    }

    Object.assign(proyecto, updateDto);
    if (updateDto.monto_pasaje_fijo !== undefined) {
      proyecto.monto_pasaje_fijo = Number(updateDto.monto_pasaje_fijo);
    }

    return await this.proyectoRepository.save(proyecto);
  }

  async remove(id: number): Promise<{ message: string }> {
    const proyecto = await this.proyectoRepository.findOne({
      where: { id_proyecto: id },
    });
    if (!proyecto) {
      throw new NotFoundException(
        `Proyecto Receptor con id ${id} no encontrado`,
      );
    }

    const asignadosActivos = await this.asignacionRepository.count({
      where: {
        id_proyecto: id,
        estado: EstadoAsignacion.ACTIVO,
      },
    });

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
