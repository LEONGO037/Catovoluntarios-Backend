import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, EntityManager } from 'typeorm';
import {
  PostulacionEntity,
  EstadoPostulacion,
} from './entities/postulacion.entity';
import { UserEntity, RolUsuario } from '../users/entities/user.entity';
import { CreatePostulacionDto } from './dtos/create-postulacion.dto';
import { FilterPostulacionesDto } from './dtos/filter-postulaciones.dto';
import { UpdateEstadoPostulacionDto } from './dtos/update-estado-postulacion.dto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class PostulacionesService {
  constructor(
    @InjectRepository(PostulacionEntity)
    private readonly postulacionRepo: Repository<PostulacionEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Genera el siguiente código único de postulación en formato POST-YYYY-XXXX
   */
  async generarCodigoPostulacion(manager?: EntityManager): Promise<string> {
    const anioActual = new Date().getFullYear();
    const prefijo = `POST-${anioActual}-`;

    const repo = manager
      ? manager.getRepository(PostulacionEntity)
      : this.postulacionRepo;

    const totalAnio = await repo
      .createQueryBuilder('p')
      .where('p.codigoPostulacion LIKE :prefijo', { prefijo: `${prefijo}%` })
      .getCount();

    const correlativo = String(totalAnio + 1).padStart(4, '0');
    return `${prefijo}${correlativo}`;
  }

  /**
   * Registra una postulación con validaciones institucionales y aprovisionamiento de usuario
   */
  async create(createDto: CreatePostulacionDto): Promise<PostulacionEntity> {
    // Validación de carga académica
    if (createDto.numeroMaterias > 6) {
      throw new BadRequestException(
        'Por política institucional de Pastoral UCB, el límite máximo permitido es de 6 materias inscritas para evitar la sobrecarga académica.',
      );
    }

    // Validación de consentimiento parental
    const esMenorDeEdad = createDto.edad < 18;
    if (esMenorDeEdad && !createDto.autorizacionPadresConfirmada) {
      throw new BadRequestException(
        'Para postulantes menores de 18 años es obligatoria la confirmación de autorización de padres o tutores legales.',
      );
    }

    return await this.dataSource.transaction(async (manager: EntityManager) => {
      const postulacionManagerRepo = manager.getRepository(PostulacionEntity);
      const userManagerRepo = manager.getRepository(UserEntity);

      const anioActual = new Date().getFullYear();
      const semestreFinal = createDto.semestre?.trim() || '2/2026';
      const tipoDocumentoFinal =
        createDto.tipoDocumento === 'PASAPORTE' ? 'PASAPORTE' : 'CI';
      const expedidoFinal =
        tipoDocumentoFinal === 'PASAPORTE'
          ? 'N/A'
          : createDto.expedido?.trim() || 'LP';
      const habilidadesOtrasFinal =
        createDto.habilidadesOtras?.trim() || undefined;

      // Validar si ya existe postulación para este documento en la gestión actual
      const existente = await postulacionManagerRepo
        .createQueryBuilder('p')
        .where('p.ci = :ci AND (p.semestre = :semestre OR p.codigoPostulacion LIKE :prefijo)', {
          ci: createDto.ci,
          semestre: semestreFinal,
          prefijo: `POST-${anioActual}-%`,
        })
        .getOne();

      if (existente) {
        throw new ConflictException(
          `Ya existe una postulación registrada para el documento ${createDto.ci} en el ciclo actual (${existente.codigoPostulacion})`,
        );
      }

      const emailNormalizado = createDto.correoElectronico?.toLowerCase().trim();
      const ciLimpio = createDto.ci?.trim();

      const carreraFinal =
        createDto.carrera && createDto.carrera.trim() !== ''
          ? createDto.carrera.trim()
          : 'N/A';

      // Buscar si el usuario ya existe por email o CI
      let usuario = await userManagerRepo.findOne({
        where: [{ email: emailNormalizado }, { ci: ciLimpio }],
      });

      if (!usuario) {
        const rawPassword = `Postulante_${ciLimpio}_${anioActual}!`;
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(rawPassword, salt);

        usuario = userManagerRepo.create({
          email: emailNormalizado,
          passwordHash: passwordHash,
          password: rawPassword,
          rol: RolUsuario.POSTULANTE,
          nombres: createDto.nombres?.trim(),
          primerApellido: createDto.primerApellido?.trim(),
          segundoApellido: createDto.segundoApellido?.trim() || undefined,
          tipoDocumento: tipoDocumentoFinal,
          ci: ciLimpio,
          telefono: createDto.celular?.trim() || undefined,
          carrera: carreraFinal,
          semestreIngreso: semestreFinal,
          activo: true,
        });
        usuario.passwordHash = passwordHash;
        usuario = await userManagerRepo.save(usuario);
      } else if (!usuario.passwordHash) {
        const rawPassword = `Postulante_${ciLimpio}_${anioActual}!`;
        const salt = await bcrypt.genSalt(10);
        usuario.passwordHash = await bcrypt.hash(rawPassword, salt);
        usuario = await userManagerRepo.save(usuario);
      }

      const codigo = await this.generarCodigoPostulacion(manager);

      const postulacion = postulacionManagerRepo.create({
        ...createDto,
        tipoDocumento: tipoDocumentoFinal,
        expedido: expedidoFinal,
        habilidadesOtras: habilidadesOtrasFinal,
        semestre: semestreFinal,
        edadCalculada: createDto.edad,
        carrera: carreraFinal,
        codigoPostulacion: codigo,
        requiereAutorizacionPadres: esMenorDeEdad,
        autorizacionPadresConfirmada: esMenorDeEdad
          ? Boolean(createDto.autorizacionPadresConfirmada)
          : false,
        estado: EstadoPostulacion.PENDIENTE,
        userId: usuario.id,
      });
      postulacion.edadCalculada = createDto.edad;

      return await postulacionManagerRepo.save(postulacion);
    });
  }

  /**
   * Consulta filtrable y paginada de postulantes
   */
  async findAll(filterDto: FilterPostulacionesDto): Promise<{
    items: PostulacionEntity[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const page = Number(filterDto.page) || 1;
    const limit = Number(filterDto.limit) || 10;
    const skip = (page - 1) * limit;

    const qb = this.postulacionRepo.createQueryBuilder('p');

    if (filterDto.search) {
      qb.andWhere(
        '(LOWER(p.nombres) LIKE LOWER(:search) OR LOWER(p.primerApellido) LIKE LOWER(:search) OR p.ci LIKE :search OR p.codigoPostulacion LIKE :search)',
        { search: `%${filterDto.search}%` },
      );
    }

    if (filterDto.carrera) {
      qb.andWhere('p.carrera = :carrera', { carrera: filterDto.carrera });
    }

    if (filterDto.zonaResidencia) {
      qb.andWhere('p.zonaResidencia LIKE :zona', { zona: `%${filterDto.zonaResidencia}%` });
    }

    if (filterDto.estado) {
      qb.andWhere('p.estado = :estado', { estado: filterDto.estado });
    }

    if (filterDto.semestre) {
      qb.andWhere('p.semestre = :semestre', { semestre: filterDto.semestre });
    }

    qb.orderBy('p.createdAt', 'DESC');
    qb.skip(skip).take(limit);

    const [items, total] = await qb.getManyAndCount();

    return {
      items: items.map((item) => this.formatPostulacion(item)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  private formatPostulacion(p: PostulacionEntity): PostulacionEntity {
    const parseSafe = (val: any): string[] => {
      if (!val) return [];
      if (Array.isArray(val)) return val;
      if (typeof val === 'string') {
        try {
          const parsed = JSON.parse(val);
          if (Array.isArray(parsed)) return parsed;
        } catch {
          return val.split(',').map((s: string) => s.trim()).filter(Boolean);
        }
      }
      return [];
    };

    p.poblacionesInteres = parseSafe(p.poblacionesInteres);
    p.habilidadesDestacadas = parseSafe(p.habilidadesDestacadas);
    p.tresPalabrasPersonalidad = parseSafe(p.tresPalabrasPersonalidad);
    (p as any).edad = p.edadCalculada ?? p.edad;
    return p;
  }

  /**
   * Métricas para la cabecera ejecutiva
   */
  async getKpis(semestre?: string): Promise<{
    total: number;
    aptos: number;
    observadosSobrecarga: number;
    descartados: number;
    pendientes: number;
  }> {
    const baseWhere = semestre ? { semestre } : {};
    const [total, aptos, observadosSobrecarga, descartados, pendientes] =
      await Promise.all([
        this.postulacionRepo.count({ where: baseWhere }),
        this.postulacionRepo.count({
          where: { ...baseWhere, estado: EstadoPostulacion.APTO_ENTREVISTA },
        }),
        this.postulacionRepo.count({
          where: { ...baseWhere, estado: EstadoPostulacion.OBSERVADO_SOBRECARGA },
        }),
        this.postulacionRepo.count({
          where: { ...baseWhere, estado: EstadoPostulacion.DESCARTADO },
        }),
        this.postulacionRepo.count({
          where: { ...baseWhere, estado: EstadoPostulacion.PENDIENTE },
        }),
      ]);

    return {
      total,
      aptos,
      observadosSobrecarga,
      descartados,
      pendientes,
    };
  }

  async findOne(id: number): Promise<PostulacionEntity> {
    const postulacion = await this.postulacionRepo.findOne({ where: { id } });
    if (!postulacion) {
      throw new NotFoundException(`Postulación con identificador ${id} no encontrada`);
    }
    return this.formatPostulacion(postulacion);
  }

  async findByCodigo(codigo: string): Promise<PostulacionEntity> {
    const postulacion = await this.postulacionRepo.findOne({
      where: { codigoPostulacion: codigo },
    });
    if (!postulacion) {
      throw new NotFoundException(
        `Postulación con código ${codigo} no encontrada`,
      );
    }
    return this.formatPostulacion(postulacion);
  }

  /**
   * Actualización de resolución y estado
   */
  async updateEstado(
    id: number,
    updateDto: UpdateEstadoPostulacionDto,
  ): Promise<PostulacionEntity> {
    const postulacion = await this.findOne(id);
    postulacion.estado = updateDto.estado;
    if (updateDto.observaciones !== undefined) {
      postulacion.observacionesPostulacion = updateDto.observaciones;
    }
    return await this.postulacionRepo.save(postulacion);
  }
}
