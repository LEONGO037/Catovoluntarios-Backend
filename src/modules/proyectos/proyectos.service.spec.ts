import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { ProyectosService } from './proyectos.service';
import { ProyectoReceptorEntity } from './entities/proyecto-receptor.entity';
import {
  AsignacionUbicacionEntity,
  EstadoAsignacion,
} from '../ubicacion/entities/asignacion-ubicacion.entity';
import { CreateProyectoReceptorDto } from './dto/create-proyecto-receptor.dto';
import { UpdateProyectoReceptorDto } from './dto/update-proyecto-receptor.dto';

describe('ProyectosService', () => {
  let service: ProyectosService;
  let proyectoRepo: any;
  let asignacionRepo: any;

  const mockProyecto: ProyectoReceptorEntity = {
    id_proyecto: 1,
    nombre_proyecto: 'Hogar de Niños San José',
    direccion_exacta: 'Av. Buenos Aires 1420',
    macrodistrito_zona: 'Cotahuma',
    nombre_supervisor_centro: 'Hna. Teresa Morales',
    telefono_contacto: '2491028',
    correo: 'sanjose@pastoral.ucb.edu.bo',
    fecha_inicio_convenio: '2026-02-01',
    fecha_fin_convenio: '2026-12-31',
    poblacion_objetivo: 'Niños 4 a 12 años',
    actividades_semestre_actual: 'Refuerzo escolar',
    monto_pasaje_fijo: 10,
    cupo_maximo_voluntarios: 15,
    catolider_titular_id: 1,
    catolider_aprendiz_id: 2,
    activo: true,
    asignaciones: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  } as unknown as ProyectoReceptorEntity;

  beforeEach(async () => {
    proyectoRepo = {
      findOne: jest.fn(),
      find: jest.fn(),
      create: jest.fn((dto) => ({ ...dto, id_proyecto: 1, createdAt: new Date(), updatedAt: new Date() })),
      save: jest.fn((entity) => Promise.resolve({ ...entity, id_proyecto: entity.id_proyecto || 1 })),
      createQueryBuilder: jest.fn(() => ({
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[mockProyecto], 1]),
      })),
    };

    asignacionRepo = {
      count: jest.fn().mockResolvedValue(5),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProyectosService,
        {
          provide: getRepositoryToken(ProyectoReceptorEntity),
          useValue: proyectoRepo,
        },
        {
          provide: getRepositoryToken(AsignacionUbicacionEntity),
          useValue: asignacionRepo,
        },
      ],
    }).compile();

    service = module.get<ProyectosService>(ProyectosService);
  });

  it('debe registrar un nuevo Proyecto Receptor correctamente con tarifa fija de pasaje', async () => {
    proyectoRepo.findOne.mockResolvedValue(null);

    const dto: CreateProyectoReceptorDto = {
      nombre_proyecto: 'Nuevo Proyecto',
      direccion_exacta: 'Calle Falsa 123',
      macrodistrito_zona: 'Centro',
      nombre_supervisor_centro: 'Lic. Supervisor',
      telefono_contacto: '70000000',
      correo: 'centro@pastoral.ucb.edu.bo',
      fecha_inicio_convenio: '2026-02-01',
      fecha_fin_convenio: '2026-12-31',
      poblacion_objetivo: 'Adultos mayores',
      actividades_semestre_actual: 'Acompañamiento',
      monto_pasaje_fijo: 15,
      cupo_maximo_voluntarios: 20,
    };

    const res = await service.create(dto);
    expect(res).toBeDefined();
    expect(res.monto_pasaje_fijo).toBe(15);
    expect(proyectoRepo.save).toHaveBeenCalled();
  });

  it('debe rechazar la creacion si el nombre del Proyecto Receptor ya existe', async () => {
    proyectoRepo.findOne.mockResolvedValue(mockProyecto);

    const dto: CreateProyectoReceptorDto = {
      nombre_proyecto: mockProyecto.nombre_proyecto,
      direccion_exacta: 'Calle Falsa 123',
      macrodistrito_zona: 'Centro',
      nombre_supervisor_centro: 'Lic. Supervisor',
      telefono_contacto: '70000000',
      correo: 'centro@pastoral.ucb.edu.bo',
      fecha_inicio_convenio: '2026-02-01',
      fecha_fin_convenio: '2026-12-31',
      poblacion_objetivo: 'Adultos mayores',
      actividades_semestre_actual: 'Acompañamiento',
      monto_pasaje_fijo: 15,
      cupo_maximo_voluntarios: 20,
    };

    await expect(service.create(dto)).rejects.toThrow(ConflictException);
  });

  it('debe calcular ocupacion vs cupo_maximo_voluntarios y cupos disponibles en findOne', async () => {
    proyectoRepo.findOne.mockResolvedValue(mockProyecto);
    asignacionRepo.count.mockResolvedValue(6);

    const res = await service.findOne(1);
    expect(res.id_proyecto).toBe(1);
    expect(res.cupo_maximo_voluntarios).toBe(15);
    expect(res.total_asignados_activos).toBe(6);
    expect(res.cupos_disponibles).toBe(9);
    expect(res.porcentaje_ocupacion).toBe(40.0);
    expect(res.monto_pasaje_fijo).toBe(10);
  });

  it('debe lanzar NotFoundException si el Proyecto Receptor no existe', async () => {
    proyectoRepo.findOne.mockResolvedValue(null);
    await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
  });

  it('debe rechazar la reduccion de cupo si es inferior a los voluntarios activos asignados', async () => {
    proyectoRepo.findOne.mockResolvedValue({ ...mockProyecto, cupo_maximo_voluntarios: 15 });
    asignacionRepo.count.mockResolvedValue(10);

    const updateDto: UpdateProyectoReceptorDto = {
      cupo_maximo_voluntarios: 8,
    };

    await expect(service.update(1, updateDto)).rejects.toThrow(BadRequestException);
  });

  it('debe impedir la desactivacion de un proyecto si tiene voluntarios activos asignados', async () => {
    proyectoRepo.findOne.mockResolvedValue(mockProyecto);
    asignacionRepo.count.mockResolvedValue(3);

    await expect(service.remove(1)).rejects.toThrow(BadRequestException);
  });
});
