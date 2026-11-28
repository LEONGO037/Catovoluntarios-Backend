import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { InstitucionEntity } from './entities/institucion.entity';
import { ProyectoReceptorEntity } from './entities/proyecto-receptor.entity';
import {
  AsignacionUbicacionEntity,
  EstadoAsignacion,
} from '../ubicacion/entities/asignacion-ubicacion.entity';
import { CreateInstitucionDto } from './dto/create-institucion.dto';
import { UpdateInstitucionDto } from './dto/update-institucion.dto';
import { FilterInstitucionDto } from './dto/filter-institucion.dto';

@Injectable()
export class InstitucionesService {
  constructor(
    @InjectRepository(InstitucionEntity)
    private readonly institucionRepository: Repository<InstitucionEntity>,
    @InjectRepository(ProyectoReceptorEntity)
    private readonly proyectoRepository: Repository<ProyectoReceptorEntity>,
    @InjectRepository(AsignacionUbicacionEntity)
    private readonly asignacionRepository: Repository<AsignacionUbicacionEntity>,
    private readonly dataSource: DataSource,
  ) {}

  async create(dto: CreateInstitucionDto): Promise<InstitucionEntity> {
    const existente = await this.institucionRepository
      .createQueryBuilder('i')
      .where('LOWER(i.nombre) = LOWER(:nombre)', { nombre: dto.nombre.trim() })
      .getOne();

    if (existente) {
      throw new ConflictException(
        `Ya existe una institución registrada con el nombre "${dto.nombre}"`,
      );
    }

    const institucion = this.institucionRepository.create({
      nombre: dto.nombre.trim(),
      direccion_exacta: dto.direccion_exacta.trim(),
      macrodistrito_zona: dto.macrodistrito_zona.trim(),
      nombre_supervisor_centro: dto.nombre_supervisor_centro.trim(),
      telefono_contacto: dto.telefono_contacto.trim(),
      correo: dto.correo ?? 'centro@pastoral.ucb.edu.bo',
      fecha_inicio_convenio: dto.fecha_inicio_convenio ?? null,
      fecha_fin_convenio: dto.fecha_fin_convenio ?? null,
      activo: true,
    });

    return await this.institucionRepository.save(institucion);
  }

  async findAll(filter: FilterInstitucionDto): Promise<{
    data: InstitucionEntity[];
    total: number;
    page: number;
    limit: number;
  }> {
    const page = filter.page || 1;
    const limit = filter.limit || 20;
    const skip = (page - 1) * limit;
    const semestreFiltro = filter.semestre?.trim() || filter.gestion?.trim();

    const qb = this.institucionRepository
      .createQueryBuilder('institucion')
      .leftJoinAndSelect('institucion.proyectos', 'proyecto')
      .where('1=1');

    if (filter.solo_activas !== undefined && filter.solo_activas !== null) {
      qb.andWhere('institucion.activo = :activo', {
        activo: filter.solo_activas,
      });
    }

    if (filter.macrodistrito_zona) {
      qb.andWhere('LOWER(institucion.macrodistrito_zona) LIKE LOWER(:zona)', {
        zona: `%${filter.macrodistrito_zona.trim()}%`,
      });
    }

    if (filter.buscar) {
      qb.andWhere(
        '(LOWER(institucion.nombre) LIKE LOWER(:buscar) OR LOWER(institucion.nombre_supervisor_centro) LIKE LOWER(:buscar))',
        { buscar: `%${filter.buscar.trim()}%` },
      );
    }

    qb.orderBy('institucion.nombre', 'ASC');

    const [instituciones, total] = await qb
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    const data = instituciones.map((inst) => {
      if (semestreFiltro && Array.isArray(inst.proyectos)) {
        inst.proyectos = inst.proyectos.filter(
          (p) => p.semestre === semestreFiltro,
        );
      }
      return inst;
    });

    return {
      data,
      total,
      page,
      limit,
    };
  }

  async findOne(id: number): Promise<InstitucionEntity> {
    const institucion = await this.institucionRepository.findOne({
      where: { id },
      relations: { proyectos: true },
    });

    if (!institucion) {
      throw new NotFoundException(`Institución con id ${id} no encontrada`);
    }

    return institucion;
  }

  async update(
    id: number,
    dto: UpdateInstitucionDto,
  ): Promise<InstitucionEntity> {
    return await this.dataSource.transaction(async (manager) => {
      const institucion = await manager.findOne(InstitucionEntity, {
        where: { id },
      });
      if (!institucion) {
        throw new NotFoundException(`Institución con id ${id} no encontrada`);
      }

      if (
        dto.nombre &&
        dto.nombre.trim().toLowerCase() !== institucion.nombre.toLowerCase()
      ) {
        const duplicado = await manager
          .createQueryBuilder(InstitucionEntity, 'i')
          .where('LOWER(i.nombre) = LOWER(:nombre) AND i.id != :id', {
            nombre: dto.nombre.trim(),
            id,
          })
          .getOne();

        if (duplicado) {
          throw new ConflictException(
            `Ya existe otra institución registrada con el nombre "${dto.nombre}"`,
          );
        }
      }

      Object.assign(institucion, dto);
      if (dto.nombre) {
        institucion.nombre = dto.nombre.trim();
      }

      const actualizada = await manager.save(institucion);

      const cambiosProyecto: Partial<ProyectoReceptorEntity> = {};
      if (dto.direccion_exacta !== undefined) {
        cambiosProyecto.direccion_exacta = dto.direccion_exacta;
      }
      if (dto.macrodistrito_zona !== undefined) {
        cambiosProyecto.macrodistrito_zona = dto.macrodistrito_zona;
      }
      if (dto.nombre_supervisor_centro !== undefined) {
        cambiosProyecto.supervisor_nombre = dto.nombre_supervisor_centro;
      }
      if (dto.telefono_contacto !== undefined) {
        cambiosProyecto.supervisor_telefono = dto.telefono_contacto;
      }
      if (dto.correo !== undefined) {
        cambiosProyecto.correo = dto.correo ?? undefined;
      }
      if (dto.fecha_inicio_convenio !== undefined) {
        cambiosProyecto.fecha_inicio_convenio =
          dto.fecha_inicio_convenio ?? undefined;
      }
      if (dto.fecha_fin_convenio !== undefined) {
        cambiosProyecto.fecha_fin_convenio =
          dto.fecha_fin_convenio ?? undefined;
      }

      if (Object.keys(cambiosProyecto).length > 0) {
        await manager.update(
          ProyectoReceptorEntity,
          { id_institucion: id },
          cambiosProyecto,
        );
      }

      return await manager.findOneOrFail(InstitucionEntity, {
        where: { id: actualizada.id },
        relations: { proyectos: true },
      });
    });
  }

  async remove(id: number): Promise<{ message: string }> {
    const institucion = await this.institucionRepository.findOne({
      where: { id },
      relations: { proyectos: true },
    });

    if (!institucion) {
      throw new NotFoundException(`Institución con id ${id} no encontrada`);
    }

    const idsProyectos = (institucion.proyectos || []).map((p) => p.id);
    if (idsProyectos.length > 0) {
      const activos = await this.asignacionRepository
        .createQueryBuilder('a')
        .where('a.idProyecto IN (:...ids)', { ids: idsProyectos })
        .andWhere('a.estado = :estado', { estado: EstadoAsignacion.ACTIVO })
        .andWhere('a.activo = true')
        .getCount();

      if (activos > 0) {
        throw new BadRequestException(
          `No se puede desactivar la institución porque tiene ${activos} voluntarios activos en sus Proyectos Receptores`,
        );
      }
    }

    institucion.activo = false;
    await this.institucionRepository.save(institucion);

    return {
      message: `Institución "${institucion.nombre}" desactivada exitosamente`,
    };
  }
}
