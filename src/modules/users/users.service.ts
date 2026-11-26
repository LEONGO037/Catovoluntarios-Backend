import { Injectable, NotFoundException, ConflictException, OnModuleInit, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from './entities/user.entity';
import { Role } from '../../common/enums/role.enum';
import { AssignCatoliderDto, ResetCatolideresDto } from './dtos/assign-catolider.dto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsersService implements OnModuleInit {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(UserEntity)
    private readonly usersRepository: Repository<UserEntity>,
  ) {}

  async onModuleInit() {
    await this.seedDatosIniciales();
  }

  async seedDatosIniciales() {
    try {
      const totalCatolideres = await this.usersRepository.count({
        where: { rol: Role.CATOLIDER },
      });
      if (totalCatolideres > 0) return;

      this.logger.log('🌱 Inicializando datos semilla de Catolíderes y Voluntarios...');

      const defaultHash = await bcrypt.hash('Catos2026!', 10);
      const semillas = [
        {
          email: 'valeria.rios@ucb.edu.bo',
          passwordHash: defaultHash,
          rol: Role.CATOLIDER,
          nombres: 'Valeria',
          primerApellido: 'Ríos',
          segundoApellido: 'Campero',
          ci: '8345129',
          activo: true,
          esCatoliderVigente: true,
          semestreLiderazgo: '2/2026',
          modalidadLiderazgo: 'Catolíder y Voluntario de Campo',
          proyectoReceptorAsignadoId: 1,
        },
        {
          email: 'mateo.vargas@ucb.edu.bo',
          passwordHash: defaultHash,
          rol: Role.CATOLIDER,
          nombres: 'Mateo',
          primerApellido: 'Vargas',
          segundoApellido: 'Mamani',
          ci: '9124578',
          activo: true,
          esCatoliderVigente: true,
          semestreLiderazgo: '2/2026',
          modalidadLiderazgo: 'Solo Catolíder de Gestión',
          proyectoReceptorAsignadoId: 2,
        },
        {
          email: 'luciana.paredes@ucb.edu.bo',
          passwordHash: defaultHash,
          rol: Role.CATOLIDER,
          nombres: 'Luciana',
          primerApellido: 'Paredes',
          segundoApellido: 'Mercado',
          ci: '7234910',
          activo: true,
          esCatoliderVigente: true,
          semestreLiderazgo: '2/2026',
          modalidadLiderazgo: 'Catolíder y Voluntario de Campo',
          proyectoReceptorAsignadoId: 3,
        },
        {
          email: 'rodrigo.mendoza@ucb.edu.bo',
          passwordHash: defaultHash,
          rol: Role.VOLUNTARIO,
          nombres: 'Rodrigo',
          primerApellido: 'Mendoza',
          segundoApellido: 'Salazar',
          ci: '7412589',
          activo: true,
          esCatoliderVigente: false,
        },
        {
          email: 'camila.alvarez@ucb.edu.bo',
          passwordHash: defaultHash,
          rol: Role.VOLUNTARIO,
          nombres: 'Camila',
          primerApellido: 'Álvarez',
          segundoApellido: 'Quiroga',
          ci: '6589412',
          activo: true,
          esCatoliderVigente: false,
        },
        {
          email: 'andres.choque@ucb.edu.bo',
          passwordHash: defaultHash,
          rol: Role.VOLUNTARIO,
          nombres: 'Andrés',
          primerApellido: 'Choque',
          segundoApellido: 'Limachi',
          ci: '8934120',
          activo: true,
          esCatoliderVigente: false,
        },
        {
          email: 'daniela.gutierrez@ucb.edu.bo',
          passwordHash: defaultHash,
          rol: Role.VOLUNTARIO,
          nombres: 'Daniela',
          primerApellido: 'Gutiérrez',
          segundoApellido: 'Navarro',
          ci: '9456123',
          activo: true,
          esCatoliderVigente: false,
        },
        {
          email: 'sebastian.quiroga@ucb.edu.bo',
          passwordHash: defaultHash,
          rol: Role.VOLUNTARIO,
          nombres: 'Sebastián',
          primerApellido: 'Quiroga',
          segundoApellido: 'Morales',
          ci: '8123764',
          activo: true,
          esCatoliderVigente: false,
        },
      ];

      for (const item of semillas) {
        const exists = await this.usersRepository.findOne({ where: { email: item.email } });
        if (!exists) {
          const u = this.usersRepository.create(item);
          await this.usersRepository.save(u);
        }
      }
      this.logger.log('✅ Base de datos poblada exitosamente con Catolíderes y Voluntarios candidatos');
    } catch (error) {
      this.logger.warn(`Nota: Se omitió seed automático en inicio: ${error.message}`);
    }
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    return this.usersRepository.findOne({
      where: { email: email.toLowerCase().trim() },
    });
  }

  async findByCi(ci: string): Promise<UserEntity | null> {
    return this.usersRepository.findOne({
      where: { ci: ci.trim() },
    });
  }

  async findById(id: number): Promise<UserEntity> {
    const user = await this.usersRepository.findOne({
      where: { id },
    });
    if (!user) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    }
    return user;
  }

  async create(userData: Partial<UserEntity>): Promise<UserEntity> {
    if (userData.email) {
      const existingEmail = await this.findByEmail(userData.email);
      if (existingEmail) {
        throw new ConflictException('El correo electrónico ya se encuentra registrado');
      }
    }

    if (userData.ci) {
      const existingCi = await this.findByCi(userData.ci);
      if (existingCi) {
        throw new ConflictException('El CI ya se encuentra registrado');
      }
    }

    let passwordHash = userData.passwordHash;
    if (!passwordHash && (userData as any).password) {
      const salt = await bcrypt.genSalt(10);
      passwordHash = await bcrypt.hash((userData as any).password, salt);
    }

    const newUser = this.usersRepository.create({
      ...userData,
      email: userData.email?.toLowerCase().trim(),
      passwordHash,
    });

    return this.usersRepository.save(newUser);
  }

  async findAll(): Promise<UserEntity[]> {
    return this.usersRepository.find({
      select: {
        id: true,
        ci: true,
        email: true,
        nombres: true,
        primerApellido: true,
        segundoApellido: true,
        rol: true,
        telefono: true,
        carrera: true,
        semestreIngreso: true,
        activo: true,
        esCatoliderVigente: true,
        semestreLiderazgo: true,
        modalidadLiderazgo: true,
        proyectoReceptorAsignadoId: true,
        createdAt: true,
      },
      order: { nombres: 'ASC' },
    });
  }

  async resetCatolideres(param?: string | ResetCatolideresDto): Promise<{
    message: string;
    catolideresRestablecidos: number;
    semestreAfectado?: string;
  }> {
    const semestre = typeof param === 'string' ? param : param?.semestreAnterior;
    const whereCondition = semestre
      ? [
          { rol: Role.CATOLIDER, semestreLiderazgo: semestre },
          { esCatoliderVigente: true, semestreLiderazgo: semestre },
        ]
      : [{ rol: Role.CATOLIDER }, { esCatoliderVigente: true }];

    const catolideres = await this.usersRepository.find({
      where: whereCondition,
    });

    for (const catolider of catolideres) {
      catolider.rol = Role.VOLUNTARIO;
      catolider.esCatoliderVigente = false;
    }

    await this.usersRepository.save(catolideres);

    return {
      message: `Se han restablecido exitosamente ${catolideres.length} Catolíder(es) al rol de Voluntario estándar para el nuevo semestre ${semestre || ''}`.trim(),
      catolideresRestablecidos: catolideres.length,
      semestreAfectado: semestre,
    };
  }

  async assignCatolider(dto: AssignCatoliderDto): Promise<UserEntity> {
    const user = await this.usersRepository.findOne({
      where: { id: dto.voluntarioId },
    });

    if (!user) {
      throw new NotFoundException(
        `Voluntario con identificador ${dto.voluntarioId} no encontrado`,
      );
    }

    user.rol = Role.CATOLIDER;
    user.esCatoliderVigente = true;
    user.modalidadLiderazgo = dto.modalidadLiderazgo;
    user.semestreLiderazgo = dto.semestre;
    if (dto.proyectoReceptorAsignadoId) {
      user.proyectoReceptorAsignadoId = dto.proyectoReceptorAsignadoId;
    }

    return await this.usersRepository.save(user);
  }

  async getCatolideresVigentes(semestre?: string): Promise<UserEntity[]> {
    if (semestre && semestre.trim() !== '') {
      const s = semestre.trim();
      return await this.usersRepository.find({
        where: [
          { rol: Role.CATOLIDER, semestreLiderazgo: s },
          { esCatoliderVigente: true, semestreLiderazgo: s },
        ],
        order: { primerApellido: 'ASC' },
      });
    }

    return await this.usersRepository.find({
      where: [{ rol: Role.CATOLIDER }, { esCatoliderVigente: true }],
      order: { primerApellido: 'ASC' },
    });
  }

  async getVoluntariosElegibles(): Promise<UserEntity[]> {
    return await this.usersRepository.find({
      where: { rol: Role.VOLUNTARIO, activo: true },
      order: { primerApellido: 'ASC' },
      take: 20,
    });
  }

  async unassignCatolider(id: number): Promise<UserEntity> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`Usuario con identificador ${id} no encontrado`);
    }

    user.rol = Role.VOLUNTARIO;
    user.esCatoliderVigente = false;
    user.semestreLiderazgo = null as unknown as string;
    user.modalidadLiderazgo = null as unknown as string;

    return await this.usersRepository.save(user);
  }

  async updatePassword(id: number, plainPassword: string): Promise<void> {
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(plainPassword, salt);
    await this.usersRepository.update(id, { passwordHash });
  }
}
