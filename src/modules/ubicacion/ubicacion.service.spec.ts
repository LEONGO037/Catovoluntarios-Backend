import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, ConflictException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { UbicacionService } from './ubicacion.service';
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

interface NotificacionGuardadaMock {
  tipo_notificacion?: TipoNotificacionMovimiento;
  mensaje?: string;
}

interface MockRepo {
  find: jest.Mock;
  findOne?: jest.Mock;
  count?: jest.Mock;
  create: jest.Mock;
  save: jest.Mock;
  createQueryBuilder?: jest.Mock;
}

interface MockManager {
  findOne: jest.Mock;
  count: jest.Mock;
  create: jest.Mock;
  save: jest.Mock;
  insert: jest.Mock;
}

interface MockDataSource {
  transaction: jest.Mock;
}

describe('UbicacionService', () => {
  let service: UbicacionService;
  let asignacionRepo: MockRepo;
  let historialRepo: MockRepo;
  let notificacionRepo: MockRepo;
  let proyectoRepo: { findOne: jest.Mock };
  let dataSource: MockDataSource;
  let notificacionesGuardadas: NotificacionGuardadaMock[];

  const mockProyectoOrigen = {
    id: 1,
    id_proyecto: 1,
    semestre: '2/2026',
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
    cupoOcupado: 5,
    catolider_titular_id: 10,
    catolider_aprendiz_id: 11,
    activo: true,
    asignaciones: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  } as unknown as ProyectoReceptorEntity;

  const mockProyectoDestino = {
    id: 2,
    id_proyecto: 2,
    semestre: '2/2026',
    nombre_proyecto: 'Centro de Acogida San Ramón',
    direccion_exacta: 'Calle 18 Achumani',
    macrodistrito_zona: 'Sur - Achumani',
    nombre_supervisor_centro: 'Lic. Gonzalo Fernández',
    telefono_contacto: '2793041',
    correo: 'sanramon@pastoral.ucb.edu.bo',
    fecha_inicio_convenio: '2026-02-01',
    fecha_fin_convenio: '2026-12-31',
    poblacion_objetivo: 'Adultos mayores',
    actividades_semestre_actual: 'Acompañamiento',
    monto_pasaje_fijo: 15,
    cupo_maximo_voluntarios: 20,
    cupoOcupado: 5,
    catolider_titular_id: 20,
    catolider_aprendiz_id: 21,
    activo: true,
    asignaciones: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  } as unknown as ProyectoReceptorEntity;

  const mockAsignacion = {
    id: 50,
    id_asignacion: 50,
    idUsuario: 101,
    id_usuario: 101,
    idProyecto: 1,
    id_proyecto: 1,
    semestre: '2/2026',
    condicion: CondicionVoluntario.NUEVO,
    horario_comprometido: 'Lunes 14:00 - 18:00',
    polizaValidada: false,
    poliza_validada: false,
    induccionCompletada: false,
    induccion_completada: false,
    habilitadoCampo: false,
    habilitado_campo: false,
    estado: EstadoAsignacion.ACTIVO,
    activo: true,
    proyecto: mockProyectoOrigen,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as unknown as AsignacionUbicacionEntity;

  beforeEach(async () => {
    notificacionesGuardadas = [];

    asignacionRepo = {
      find: jest.fn().mockResolvedValue([mockAsignacion]),
      findOne: jest.fn().mockResolvedValue(mockAsignacion),
      count: jest.fn().mockResolvedValue(5),
      create: jest.fn((dto: Record<string, unknown>) => ({
        ...dto,
        id_asignacion: 51,
        createdAt: new Date(),
      })),
      save: jest.fn((entity: Record<string, unknown>) =>
        Promise.resolve(entity),
      ),
    };

    historialRepo = {
      find: jest.fn().mockResolvedValue([]),
      createQueryBuilder: jest.fn(() => ({
        orderBy: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      })),
      create: jest.fn((dto: Record<string, unknown>) => ({
        ...dto,
        id_historial: 1,
      })),
      save: jest.fn((entity: Record<string, unknown>) =>
        Promise.resolve(entity),
      ),
    };

    notificacionRepo = {
      find: jest.fn().mockResolvedValue([]),
      createQueryBuilder: jest.fn(() => ({
        orderBy: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      })),
      create: jest.fn((dto: Record<string, unknown>) => ({
        ...dto,
        id_notificacion: 1,
      })),
      save: jest.fn((entity: Record<string, unknown>) =>
        Promise.resolve(entity),
      ),
      findOne: jest.fn(),
    };

    proyectoRepo = {
      findOne: jest.fn().mockResolvedValue(mockProyectoOrigen),
    };

    dataSource = {
      transaction: jest.fn(
        async (cb: (manager: MockManager) => Promise<unknown>) => {
          const manager: MockManager = {
            findOne: jest.fn(
              (
                entityClass: unknown,
                options?: { where?: Record<string, unknown> },
              ) => {
                if (entityClass === ProyectoReceptorEntity) {
                  if (
                    options?.where?.id === 2 ||
                    options?.where?.id_proyecto === 2
                  ) {
                    return Promise.resolve({ ...mockProyectoDestino });
                  }
                  return Promise.resolve({ ...mockProyectoOrigen });
                }
                if (entityClass === AsignacionUbicacionEntity) {
                  if (
                    options?.where?.idUsuario === 999 ||
                    options?.where?.id_usuario === 999
                  ) {
                    return Promise.resolve(null);
                  }
                  if (
                    options?.where?.id === 50 ||
                    options?.where?.id_asignacion === 50
                  ) {
                    return Promise.resolve({ ...mockAsignacion });
                  }
                  return Promise.resolve(null);
                }
                return Promise.resolve(null);
              },
            ),
            count: jest.fn(() => Promise.resolve(5)),
            create: jest.fn((_entityClass: unknown, dto: unknown) => dto),
            save: jest.fn((entity: Record<string, unknown>) => {
              if (entity?.tipo_notificacion) {
                notificacionesGuardadas.push({
                  tipo_notificacion:
                    entity.tipo_notificacion as TipoNotificacionMovimiento,
                  mensaje: entity.mensaje as string,
                });
              }
              return Promise.resolve({
                ...entity,
                id: (entity?.id as number) || 55,
                id_asignacion: (entity?.id_asignacion as number) || 55,
                id_historial: (entity?.id_historial as number) || 10,
              });
            }),
            insert: jest.fn().mockResolvedValue({}),
          };
          return await cb(manager);
        },
      ),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UbicacionService,
        {
          provide: getRepositoryToken(AsignacionUbicacionEntity),
          useValue: asignacionRepo,
        },
        {
          provide: getRepositoryToken(HistorialReasignacionEntity),
          useValue: historialRepo,
        },
        {
          provide: getRepositoryToken(NotificacionMovimientoEntity),
          useValue: notificacionRepo,
        },
        {
          provide: getRepositoryToken(ProyectoReceptorEntity),
          useValue: proyectoRepo,
        },
        {
          provide: DataSource,
          useValue: dataSource,
        },
      ],
    }).compile();

    service = module.get<UbicacionService>(UbicacionService);
  });

  describe('P-14 (RF-12): Consultas y Balance Demografico', () => {
    it('debe filtrar postulantes admitidos sin ubicar excluyendo a los ya asignados', async () => {
      asignacionRepo.find.mockResolvedValue([{ idUsuario: 101 }]);

      const postulantes = await service.getPostulantesAdmitidosSinUbicar({
        carrera: 'Sistemas',
      });

      expect(postulantes.some((p) => p.id_usuario === 101)).toBe(false);
      expect(postulantes.every((p) => p.carrera.includes('Sistemas'))).toBe(
        true,
      );
    });

    it('debe calcular el balance demografico en tiempo real por proyecto y gestion', async () => {
      asignacionRepo.find.mockResolvedValue([
        {
          ...mockAsignacion,
          idUsuario: 101,
          id_usuario: 101,
          condicion: CondicionVoluntario.NUEVO,
          habilitado_campo: false,
        },
        {
          ...mockAsignacion,
          idUsuario: 102,
          id_usuario: 102,
          condicion: CondicionVoluntario.ANTIGUO,
          habilitado_campo: true,
        },
      ]);

      const balance = await service.getBalanceDemografico(1);

      expect(balance.id_proyecto).toBe(1);
      expect(balance.semestre).toBe('2/2026');
      expect(balance.total_asignados_activos).toBe(2);
      expect(balance.balance_condicion.nuevos).toBe(1);
      expect(balance.balance_condicion.antiguos).toBe(1);
      expect(balance.balance_condicion.porcentaje_nuevos).toBe(50.0);
      expect(balance.balance_condicion.porcentaje_antiguos).toBe(50.0);
      expect(balance.resumen_habilitacion_campo.habilitados).toBe(1);
      expect(balance.resumen_habilitacion_campo.pendientes).toBe(1);
      expect(balance.promedio_edad).toBe(21.0);
    });
  });

  describe('P-14 & Regla de Habilitacion de Campo', () => {
    it('mantiene habilitado_campo en FALSE si no cumple poliza validada e induccion completada', async () => {
      const dto: AsignarUbicacionDto = {
        id_usuario: 999,
        id_proyecto: 1,
        semestre: '2/2026',
        condicion: CondicionVoluntario.NUEVO,
        horario_comprometido: 'Miercoles 14:00 - 18:00',
        poliza_validada: true,
        induccion_completada: false,
      };

      const res = await service.asignarUbicacion(dto);
      expect(res.habilitado_campo).toBe(false);
    });

    it('establece habilitado_campo en TRUE solo cuando poliza_validada e induccion_completada son TRUE', async () => {
      const dto: AsignarUbicacionDto = {
        id_usuario: 999,
        id_proyecto: 1,
        semestre: '2/2026',
        condicion: CondicionVoluntario.NUEVO,
        horario_comprometido: 'Viernes 09:00 - 13:00',
        poliza_validada: true,
        induccion_completada: true,
      };

      const res = await service.asignarUbicacion(dto);
      expect(res.habilitado_campo).toBe(true);
    });

    it('rechaza asignacion si el voluntario ya cuenta con asignacion activa en el semestre', async () => {
      dataSource.transaction = jest.fn(
        async (cb: (manager: MockManager) => Promise<unknown>) => {
          const manager: MockManager = {
            findOne: jest.fn((entityClass: unknown) => {
              if (entityClass === ProyectoReceptorEntity) {
                return Promise.resolve(mockProyectoOrigen);
              }
              if (entityClass === AsignacionUbicacionEntity) {
                return Promise.resolve(mockAsignacion);
              }
              return Promise.resolve(null);
            }),
            count: jest.fn().mockResolvedValue(2),
            create: jest.fn(),
            save: jest.fn(),
            insert: jest.fn(),
          };
          return await cb(manager);
        },
      );

      const dto: AsignarUbicacionDto = {
        id_usuario: 101,
        id_proyecto: 1,
        semestre: '2/2026',
        condicion: CondicionVoluntario.NUEVO,
        horario_comprometido: 'Lunes 14:00',
      };

      await expect(service.asignarUbicacion(dto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('P-15 (RF-13): Reasignaciones, Motivo Otro y Notificaciones', () => {
    it('valida en DTO que motivo_otro_detalle sea obligatorio cuando motivo_traslado es Otro', async () => {
      const dtoSinDetalle = plainToInstance(ReasignarUbicacionDto, {
        id_asignacion_origen: 50,
        id_proyecto_destino: 2,
        motivo_traslado: 'Otro',
        fecha_efectiva: new Date().toISOString(),
      });
      const errores = await validate(dtoSinDetalle);
      expect(errores.some((e) => e.property === 'motivo_otro_detalle')).toBe(
        true,
      );

      const dtoConDetalle = plainToInstance(ReasignarUbicacionDto, {
        id_asignacion_origen: 50,
        id_proyecto_destino: 2,
        motivo_traslado: 'Otro',
        motivo_otro_detalle: 'Cambio de domicilio familiar',
        fecha_efectiva: new Date().toISOString(),
      });
      const erroresValido = await validate(dtoConDetalle);
      expect(erroresValido.length).toBe(0);
    });

    it('ejecuta la reasignacion con motivo Otro + motivo_otro_detalle y notifica a Catolideres de origen y destino', async () => {
      const dto: ReasignarUbicacionDto = {
        id_asignacion_origen: 50,
        id_proyecto_destino: 2,
        motivo_traslado: MotivoTraslado.OTRO,
        motivo_otro_detalle: 'Mudanza a otra zona de la ciudad',
        fecha_efectiva: new Date().toISOString(),
        observaciones: 'Respaldo adjunto',
      };

      const res = await service.reasignarUbicacion(dto, 1);
      expect(res.mensaje).toContain('ejecutada exitosamente');
      expect(res.historial.motivo_traslado).toBe(MotivoTraslado.OTRO);
      expect(res.historial.motivo_otro_detalle).toBe(
        'Mudanza a otra zona de la ciudad',
      );

      const notifOrigen = notificacionesGuardadas.filter(
        (n) =>
          n.tipo_notificacion === TipoNotificacionMovimiento.BAJA_CATOLIDER,
      );
      const notifDestino = notificacionesGuardadas.filter(
        (n) =>
          n.tipo_notificacion === TipoNotificacionMovimiento.ALTA_CATOLIDER,
      );
      expect(notifOrigen.length).toBe(2);
      expect(notifDestino.length).toBe(2);
      expect(notifOrigen[0].mensaje).toContain(
        'Otro: Mudanza a otra zona de la ciudad',
      );
      expect(notifDestino[0].mensaje).toContain(
        'Otro: Mudanza a otra zona de la ciudad',
      );
    });

    it('rechaza la reasignacion si fecha_efectiva es anterior a la asignacion de origen', async () => {
      const ayer = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();

      const dto: ReasignarUbicacionDto = {
        id_asignacion_origen: 50,
        id_proyecto_destino: 2,
        motivo_traslado: MotivoTraslado.CRUCE_MATERIAS,
        fecha_efectiva: ayer,
      };

      await expect(service.reasignarUbicacion(dto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('rechaza la reasignacion si el proyecto destino no cuenta con cupo disponible', async () => {
      dataSource.transaction = jest.fn(
        async (cb: (manager: MockManager) => Promise<unknown>) => {
          const manager: MockManager = {
            findOne: jest.fn((entityClass: unknown) => {
              if (entityClass === AsignacionUbicacionEntity) {
                return Promise.resolve(mockAsignacion);
              }
              if (entityClass === ProyectoReceptorEntity) {
                return Promise.resolve(mockProyectoDestino);
              }
              return Promise.resolve(null);
            }),
            count: jest.fn().mockResolvedValue(20),
            create: jest.fn(),
            save: jest.fn(),
            insert: jest.fn(),
          };
          return await cb(manager);
        },
      );

      const dto: ReasignarUbicacionDto = {
        id_asignacion_origen: 50,
        id_proyecto_destino: 2,
        motivo_traslado: MotivoTraslado.CRUCE_MATERIAS,
        fecha_efectiva: new Date().toISOString(),
      };

      await expect(service.reasignarUbicacion(dto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('rechaza la reasignacion si han transcurrido mas de 4 semanas', async () => {
      const asignacionAntigua = {
        ...mockAsignacion,
        createdAt: new Date('2026-01-01T00:00:00Z'),
      };

      dataSource.transaction = jest.fn(
        async (cb: (manager: MockManager) => Promise<unknown>) => {
          const manager: MockManager = {
            findOne: jest.fn((entityClass: unknown) => {
              if (entityClass === AsignacionUbicacionEntity) {
                return Promise.resolve(asignacionAntigua);
              }
              return Promise.resolve(mockProyectoDestino);
            }),
            count: jest.fn().mockResolvedValue(5),
            create: jest.fn(),
            save: jest.fn(),
            insert: jest.fn(),
          };
          return await cb(manager);
        },
      );

      const dto: ReasignarUbicacionDto = {
        id_asignacion_origen: 50,
        id_proyecto_destino: 2,
        motivo_traslado: MotivoTraslado.CRUCE_MATERIAS,
        fecha_efectiva: '2026-03-01T00:00:00Z',
      };

      await expect(service.reasignarUbicacion(dto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
