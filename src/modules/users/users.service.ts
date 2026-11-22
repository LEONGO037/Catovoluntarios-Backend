import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from './entities/user.entity';
import { Role } from '../../common/enums/role.enum';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly usersRepository: Repository<UserEntity>,
  ) {}

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

    const newUser = this.usersRepository.create({
      ...userData,
      email: userData.email?.toLowerCase().trim(),
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
        createdAt: true,
      },
      order: { nombres: 'ASC' },
    });
  }

  async resetCatolideres(semestre?: string): Promise<{ affected: number; message: string }> {
    const catolideres = await this.usersRepository.find({
      where: { rol: Role.CATOLIDER },
    });

    for (const catolider of catolideres) {
      catolider.rol = Role.VOLUNTARIO;
    }

    await this.usersRepository.save(catolideres);

    return {
      affected: catolideres.length,
      message: `Se han reiniciado los roles de ${catolideres.length} Catolíderes al rol estándar Catovoluntario para el nuevo semestre ${semestre || ''}`.trim(),
    };
  }

  async updatePassword(id: number, plainPassword: string): Promise<void> {
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(plainPassword, salt);
    await this.usersRepository.update(id, { passwordHash });
  }
}
