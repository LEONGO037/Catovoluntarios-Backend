import { Injectable, NotFoundException, OnModuleInit, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity, RolUsuario } from './entities/user.entity';
import {
  AssignCatoliderDto,
  ResetCatolideresDto,
} from './dtos/assign-catolider.dto';

@Injectable()
export class UsersService implements OnModuleInit {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
  ) {}

  async onModuleInit() {
    await this.seedDatosIniciales();
  }

  /**
   * Población inicial de Catolíderes y voluntarios candidatos en PostgreSQL
   */
  async seedDatosIniciales() {
    const totalCatolideres = await this.userRepo.count({
      where: { rol: RolUsuario.CATOLIDER },
    });
    if (totalCatolideres > 0) return;

    this.logger.log('🌱 Inicializando datos semilla de Catolíderes y Voluntarios en PostgreSQL...');

    const semillas = [
      {
        email: 'valeria.rios@ucb.edu.bo',
        password: 'Password_Valeria_2026',
        rol: RolUsuario.CATOLIDER,
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
        password: 'Password_Mateo_2026',
        rol: RolUsuario.CATOLIDER,
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
        password: 'Password_Luciana_2026',
        rol: RolUsuario.CATOLIDER,
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
        password: 'Password_Rodrigo_2026',
        rol: RolUsuario.VOLUNTARIO,
        nombres: 'Rodrigo',
        primerApellido: 'Mendoza',
        segundoApellido: 'Salazar',
        ci: '7412589',
        activo: true,
        esCatoliderVigente: false,
      },
      {
        email: 'camila.alvarez@ucb.edu.bo',
        password: 'Password_Camila_2026',
        rol: RolUsuario.VOLUNTARIO,
        nombres: 'Camila',
        primerApellido: 'Álvarez',
        segundoApellido: 'Quiroga',
        ci: '6589412',
        activo: true,
        esCatoliderVigente: false,
      },
      {
        email: 'andres.choque@ucb.edu.bo',
        password: 'Password_Andres_2026',
        rol: RolUsuario.VOLUNTARIO,
        nombres: 'Andrés',
        primerApellido: 'Choque',
        segundoApellido: 'Limachi',
        ci: '8934120',
        activo: true,
        esCatoliderVigente: false,
      },
      {
        email: 'daniela.gutierrez@ucb.edu.bo',
        password: 'Password_Daniela_2026',
        rol: RolUsuario.VOLUNTARIO,
        nombres: 'Daniela',
        primerApellido: 'Gutiérrez',
        segundoApellido: 'Navarro',
        ci: '9456123',
        activo: true,
        esCatoliderVigente: false,
      },
      {
        email: 'sebastian.quiroga@ucb.edu.bo',
        password: 'Password_Sebastian_2026',
        rol: RolUsuario.VOLUNTARIO,
        nombres: 'Sebastián',
        primerApellido: 'Quiroga',
        segundoApellido: 'Morales',
        ci: '8123764',
        activo: true,
        esCatoliderVigente: false,
      },
    ];

    for (const item of semillas) {
      const u = this.userRepo.create(item);
      await this.userRepo.save(u);
    }

    this.logger.log('✅ Base de datos poblada exitosamente con Catolíderes y Voluntarios candidatos');
  }

  /**
   * Reseteo semestral de Catolíderes a rol estándar de Voluntario
   */
  async resetCatolideres(dto: ResetCatolideresDto): Promise<{
    message: string;
    catolideresRestablecidos: number;
    semestreAfectado?: string;
  }> {
    const qb = this.userRepo
      .createQueryBuilder()
      .update(UserEntity)
      .set({
        rol: RolUsuario.VOLUNTARIO,
        esCatoliderVigente: false,
      })
      .where('rol = :rolCatolider OR esCatoliderVigente = true', {
        rolCatolider: RolUsuario.CATOLIDER,
      });

    const result = await qb.execute();
    const count = result.affected || 0;

    return {
      message: `Se han restablecido exitosamente ${count} Catolíder(es) al rol de Voluntario estándar para el nuevo semestre`,
      catolideresRestablecidos: count,
      semestreAfectado: dto.semestreAnterior,
    };
  }

  /**
   * Asignación semestral de liderazgo a un voluntario
   */
  async assignCatolider(dto: AssignCatoliderDto): Promise<UserEntity> {
    const user = await this.userRepo.findOne({
      where: { id: dto.voluntarioId },
    });

    if (!user) {
      throw new NotFoundException(
        `Voluntario con identificador ${dto.voluntarioId} no encontrado`,
      );
    }

    user.rol = RolUsuario.CATOLIDER;
    user.esCatoliderVigente = true;
    user.modalidadLiderazgo = dto.modalidadLiderazgo;
    user.semestreLiderazgo = dto.semestre;
    if (dto.proyectoReceptorAsignadoId) {
      user.proyectoReceptorAsignadoId = dto.proyectoReceptorAsignadoId;
    }

    return await this.userRepo.save(user);
  }

  /**
   * Listado de Catolíderes activos en el semestre
   */
  async getCatolideresVigentes(): Promise<UserEntity[]> {
    return await this.userRepo.find({
      where: [{ rol: RolUsuario.CATOLIDER }, { esCatoliderVigente: true }],
      order: { primerApellido: 'ASC' },
    });
  }

  /**
   * Listado de voluntarios elegibles para asumir liderazgo
   */
  async getVoluntariosElegibles(): Promise<UserEntity[]> {
    return await this.userRepo.find({
      where: { rol: RolUsuario.VOLUNTARIO, activo: true },
      order: { primerApellido: 'ASC' },
      take: 20,
    });
  }
}
