import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { ProyectosService } from './proyectos.service';
import { ProyectoReceptorEntity } from './entities/proyecto-receptor.entity';
import { InstitucionEntity } from './entities/institucion.entity';
import { AsignacionUbicacionEntity } from '../ubicacion/entities/asignacion-ubicacion.entity';
import { CreateProyectoReceptorDto } from './dto/create-proyecto-receptor.dto';
import { UpdateProyectoReceptorDto } from './dto/update-proyecto-receptor.dto';

interface MockProyectoRepo {
  findOne: jest.Mock;
  find: jest.Mock;
  create: jest.Mock;
  save: jest.Mock;
  createQueryBuilder: jest.Mock;
}

interface MockInstitucionRepo {
  findOne: jest.Mock;
  create: jest.Mock;
  save: jest.Mock;
}

interface MockAsignacionRepo {
  count: jest.Mock;
}

describe('ProyectosService', () => {
  let service: ProyectosService;
  let proyectoRepo: MockProyectoRepo;
  let institucionRepo: MockInstitucionRepo;
  let asignacionRepo: MockAsignacionRepo;

  const mockInstitucion = {
    id: 1,
    id_institucion: 1,
    nombre: 'Hogar de Niños San José',
    nombre_institucion: 'Hogar de Niños San José',
    direccion_exacta: 'Av. Buenos Aires 1420',
    macrodistrito_zona: 'Cotahuma',
    nombre_supervisor_centro: 'Hna. Teresa Morales',
    telefono_contacto: '2491028',
    correo: 'sanjose@pastoral.ucb.edu.bo',
    fecha_inicio_convenio: '2026-02-01',
    fecha_fin_convenio: '2026-12-31',
    activo: true,
    proyectos: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  } as unknown as InstitucionEntity;

  const mockProyecto = {
    id: 1,
    id_proyecto: 1,
    id_institucion: 1,
    institucion: mockInstitucion,
    semestre: '2/2026',
    gestion: '2/2026',
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
    institucionRepo = {
      findOne: jest.fn().mockResolvedValue(mockInstitucion),
      create: jest.fn((dto: Record<string, unknown>) => ({ ...dto, id: 1 })),
      save: jest.fn((entity: Record<string, unknown>) =>
        Promise.resolve({ ...entity, id: (entity.id as number) || 1 }),
      ),
    };

    proyectoRepo = {
      findOne: jest.fn(),
      find: jest.fn(),
      create: jest.fn((dto: Record<string, unknown>) => ({
        ...dto,
        id: 1,
        id_proyecto: 1,
        monto_pasaje_fijo:
          (dto.monto_pasaje_por_dia as number | undefined) ??
          (dto.monto_pasaje_fijo as number | undefined) ??
          10,
        createdAt: new Date(),
        updatedAt: new Date(),
      })),
      save: jest.fn((entity: Record<string, unknown>) =>
        Promise.resolve({
          ...entity,
          id: (entity.id as number) || 1,
          id_proyecto: (entity.id as number) || 1,
          monto_pasaje_fijo:
            (entity.monto_pasaje_por_dia as number | undefined) ??
            (entity.monto_pasaje_fijo as number | undefined) ??
            10,
        }),
      ),
      createQueryBuilder: jest.fn(() => ({
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[mockProyecto], 1]),
        getMany: jest.fn().mockResolvedValue([mockProyecto]),
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
          provide: getRepositoryToken(InstitucionEntity),
          useValue: institucionRepo,
        },
        {
          provide: getRepositoryToken(AsignacionUbicacionEntity),
          useValue: asignacionRepo,
        },
      ],
    }).compile();

    service = module.get<ProyectosService>(ProyectosService);
  });

  it('debe registrar un nuevo Proyecto Receptor vinculado a una institucion con tarifa fija', async () => {
    proyectoRepo.findOne.mockResolvedValue(null);

    const dto: CreateProyectoReceptorDto = {
      id_institucion: 1,
      semestre: '2/2026',
      nombre_proyecto: 'Nuevo Proyecto',
      poblacion_objetivo: 'Adultos mayores',
      actividades_semestre_actual: 'Acompañamiento',
      monto_pasaje_fijo: 15,
      cupo_maximo_voluntarios: 20,
    };

    const res = await service.create(dto);
    expect(res).toBeDefined();
    expect(res.monto_pasaje_fijo).toBe(15);
    expect(res.id_institucion).toBe(1);
    expect(res.semestre).toBe('2/2026');
    expect(proyectoRepo.save).toHaveBeenCalled();
  });

  it('debe rechazar la creacion si el Proyecto Receptor ya existe en la misma institucion y gestion', async () => {
    proyectoRepo.findOne.mockResolvedValue(mockProyecto);

    const dto: CreateProyectoReceptorDto = {
      id_institucion: 1,
      semestre: '2/2026',
      nombre_proyecto: mockProyecto.nombre_proyecto,
      poblacion_objetivo: 'Adultos mayores',
      actividades_semestre_actual: 'Acompañamiento',
      monto_pasaje_fijo: 15,
      cupo_maximo_voluntarios: 20,
    };

    await expect(service.create(dto)).rejects.toThrow(ConflictException);
  });

  it('debe calcular ocupacion vs cupo_maximo_voluntarios filtrado por semestre en findOne', async () => {
    proyectoRepo.findOne.mockResolvedValue(mockProyecto);
    asignacionRepo.count.mockResolvedValue(6);

    const res = await service.findOne(1);
    expect(res.id_proyecto).toBe(1);
    expect(res.id_institucion).toBe(1);
    expect(res.semestre).toBe('2/2026');
    expect(res.cupo_maximo_voluntarios).toBe(15);
    expect(res.total_asignados_activos).toBe(6);
    expect(res.cupos_disponibles).toBe(9);
    expect(res.porcentaje_ocupacion).toBe(40.0);
    expect(res.monto_pasaje_fijo).toBe(10);
    const countCalls = asignacionRepo.count.mock.calls as [
      [{ where: { semestre: string } }],
    ];
    expect(countCalls[0][0].where.semestre).toBe('2/2026');
  });

  it('debe clonar y reactivar un proyecto hacia una nueva gestion manteniendo la misma institucion', async () => {
    const origenAnterior = {
      ...mockProyecto,
      semestre: '1/2026',
      activo: false,
    };
    proyectoRepo.findOne
      .mockResolvedValueOnce(origenAnterior)
      .mockResolvedValueOnce(null);

    const res = await service.reactivar(1, {
      semestre: '2/2026',
      cupo_maximo_voluntarios: 18,
      monto_pasaje_fijo: 12,
    });

    expect(res.semestre).toBe('2/2026');
    expect(res.id_institucion).toBe(1);
    expect(res.activo).toBe(true);
    expect(res.monto_pasaje_fijo).toBe(12);
  });

  it('debe lanzar NotFoundException si el Proyecto Receptor no existe', async () => {
    proyectoRepo.findOne.mockResolvedValue(null);
    await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
  });

  it('debe rechazar la reduccion de cupo si es inferior a los voluntarios activos asignados', async () => {
    proyectoRepo.findOne.mockResolvedValue({
      ...mockProyecto,
      cupo_maximo_voluntarios: 15,
    });
    asignacionRepo.count.mockResolvedValue(10);

    const updateDto: UpdateProyectoReceptorDto = {
      cupo_maximo_voluntarios: 8,
    };

    await expect(service.update(1, updateDto)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('debe impedir la desactivacion de un proyecto si tiene voluntarios activos asignados', async () => {
    proyectoRepo.findOne.mockResolvedValue(mockProyecto);
    asignacionRepo.count.mockResolvedValue(3);

    await expect(service.remove(1)).rejects.toThrow(BadRequestException);
  });
});
