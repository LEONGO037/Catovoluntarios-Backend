import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
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

describe('UbicacionService', () => {
  let service: UbicacionService;
  let asignacionRepo: any;
  let historialRepo: any;
  let notificacionRepo: any;
  let proyectoRepo: any;
  let dataSource: any;

  const mockProyectoOrigen: ProyectoReceptorEntity = {
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
    catolider_titular_id: 10,
    catolider_aprendiz_id: 11,
    activo: true,
    asignaciones: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockProyectoDestino: ProyectoReceptorEntity = {
    id_proyecto: 2,
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
    catolider_titular_id: 20,
    catolider_aprendiz_id: 21,
    activo: true,
    asignaciones: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockAsignacion: AsignacionUbicacionEntity = {
    id_asignacion: 50,
    id_usuario: 101,
    id_proyecto: 1,
    semestre: '2026-1',
    condicion: CondicionVoluntario.NUEVO,
    horario_comprometido: 'Lunes 14:00 - 18:00',
    poliza_validada: false,
    induccion_completada: false,
    habilitado_campo: false,
    estado: EstadoAsignacion.ACTIVO,
    proyecto: mockProyectoOrigen,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    asignacionRepo = {
      find: jest.fn().mockResolvedValue([mockAsignacion]),
      findOne: jest.fn().mockResolvedValue(mockAsignacion),
      count: jest.fn().mockResolvedValue(5),
      create: jest.fn((dto) => ({ ...dto, id_asignacion: 51, createdAt: new Date() })),
      save: jest.fn((entity) => Promise.resolve(entity)),
    };

    historialRepo = {
      find: jest.fn().mockResolvedValue([]),
      createQueryBuilder: jest.fn(() => ({
        orderBy: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      })),
      create: jest.fn((dto) => ({ ...dto, id_historial: 1 })),
      save: jest.fn((entity) => Promise.resolve(entity)),
    };

    notificacionRepo = {
      find: jest.fn().mockResolvedValue([]),
      createQueryBuilder: jest.fn(() => ({
        orderBy: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      })),
      create: jest.fn((dto) => ({ ...dto, id_notificacion: 1 })),
      save: jest.fn((entity) => Promise.resolve(entity)),
      findOne: jest.fn(),
    };

    proyectoRepo = {
      findOne: jest.fn().mockResolvedValue(mockProyectoOrigen),
    };

    dataSource = {
      transaction: jest.fn(async (cb) => {
        const manager = {
          findOne: jest.fn((entityClass, options) => {
            if (entityClass === ProyectoReceptorEntity) {
              if (options?.where?.id_proyecto === 2) return Promise.resolve(mockProyectoDestino);
              return Promise.resolve(mockProyectoOrigen);
            }
            if (entityClass === AsignacionUbicacionEntity) {
              if (options?.where?.id_usuario === 999) return Promise.resolve(null);
              if (options?.where?.id_asignacion === 50) return Promise.resolve(mockAsignacion);
              return Promise.resolve(null);
            }
            return Promise.resolve(null);
          }),
          count: jest.fn((entityClass, options) => {
            return Promise.resolve(5);
          }),
          create: jest.fn((entityClass, dto) => dto),
          save: jest.fn((entity) => Promise.resolve({ ...entity, id_asignacion: 55, id_historial: 10 })),
        };
        return await cb(manager);
      }),
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
      asignacionRepo.find.mockResolvedValue([{ id_usuario: 101 }]);

      const postulantes = await service.getPostulantesAdmitidosSinUbicar({
        carrera: 'Sistemas',
      });

      expect(postulantes.some((p) => p.id_usuario === 101)).toBe(false);
      expect(postulantes.every((p) => p.carrera.includes('Sistemas'))).toBe(true);
    });

    it('debe calcular el balance demografico en tiempo real por proyecto', async () => {
      asignacionRepo.find.mockResolvedValue([
        { ...mockAsignacion, id_usuario: 101, condicion: CondicionVoluntario.NUEVO, habilitado_campo: false },
        { ...mockAsignacion, id_usuario: 102, condicion: CondicionVoluntario.ANTIGUO, habilitado_campo: true },
      ]);

      const balance = await service.getBalanceDemografico(1);

      expect(balance.id_proyecto).toBe(1);
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
        semestre: '2026-1',
        condicion: CondicionVoluntario.NUEVO,
        horario_comprometido: 'Miercoles 14:00 - 18:00',
        poliza_validada: true,
        induccion_completada: false, // Falso
      };

      const res = await service.asignarUbicacion(dto);
      expect(res.habilitado_campo).toBe(false);
    });

    it('establece habilitado_campo en TRUE solo cuando poliza_validada e induccion_completada son TRUE', async () => {
      const dto: AsignarUbicacionDto = {
        id_usuario: 999,
        id_proyecto: 1,
        semestre: '2026-1',
        condicion: CondicionVoluntario.NUEVO,
        horario_comprometido: 'Viernes 09:00 - 13:00',
        poliza_validada: true,
        induccion_completada: true,
      };

      const res = await service.asignarUbicacion(dto);
      expect(res.habilitado_campo).toBe(true);
    });

    it('rechaza asignacion si el voluntario ya cuenta con asignacion activa en el semestre', async () => {
      dataSource.transaction = jest.fn(async (cb) => {
        const manager = {
          findOne: jest.fn((entityClass, options) => {
            if (entityClass === ProyectoReceptorEntity) return Promise.resolve(mockProyectoOrigen);
            if (entityClass === AsignacionUbicacionEntity) return Promise.resolve(mockAsignacion);
            return Promise.resolve(null);
          }),
          count: jest.fn().mockResolvedValue(2),
        };
        return await cb(manager);
      });

      const dto: AsignarUbicacionDto = {
        id_usuario: 101,
        id_proyecto: 1,
        semestre: '2026-1',
        condicion: CondicionVoluntario.NUEVO,
        horario_comprometido: 'Lunes 14:00',
      };

      await expect(service.asignarUbicacion(dto)).rejects.toThrow(ConflictException);
    });
  });

  describe('P-15 (RF-13): Reasignaciones y Notificaciones de Movimiento', () => {
    it('ejecuta la reasignacion durante las 4 semanas generando historial y notificaciones', async () => {
      const dto: ReasignarUbicacionDto = {
        id_asignacion_origen: 50,
        id_proyecto_destino: 2,
        motivo_traslado: MotivoTraslado.CRUCE_MATERIAS,
        fecha_efectiva: new Date().toISOString(),
        observaciones: 'Cambio de horario academico',
      };

      const res = await service.reasignarUbicacion(dto, 1);
      expect(res.mensaje).toContain('ejecutada exitosamente');
      expect(res.historial).toBeDefined();
      expect(res.nueva_asignacion).toBeDefined();
    });

    it('rechaza la reasignacion si el proyecto destino no cuenta con cupo disponible', async () => {
      dataSource.transaction = jest.fn(async (cb) => {
        const manager = {
          findOne: jest.fn((entityClass, options) => {
            if (entityClass === AsignacionUbicacionEntity) return Promise.resolve(mockAsignacion);
            if (entityClass === ProyectoReceptorEntity) return Promise.resolve(mockProyectoDestino);
            return Promise.resolve(null);
          }),
          count: jest.fn().mockResolvedValue(20), // Cupo lleno (20/20)
        };
        return await cb(manager);
      });

      const dto: ReasignarUbicacionDto = {
        id_asignacion_origen: 50,
        id_proyecto_destino: 2,
        motivo_traslado: MotivoTraslado.CRUCE_MATERIAS,
        fecha_efectiva: new Date().toISOString(),
      };

      await expect(service.reasignarUbicacion(dto)).rejects.toThrow(BadRequestException);
    });

    it('rechaza la reasignacion si han transcurrido mas de 4 semanas', async () => {
      const asignacionAntigua = {
        ...mockAsignacion,
        createdAt: new Date('2026-01-01T00:00:00Z'),
      };

      dataSource.transaction = jest.fn(async (cb) => {
        const manager = {
          findOne: jest.fn((entityClass) => {
            if (entityClass === AsignacionUbicacionEntity) return Promise.resolve(asignacionAntigua);
            return Promise.resolve(mockProyectoDestino);
          }),
          count: jest.fn().mockResolvedValue(5),
        };
        return await cb(manager);
      });

      const dto: ReasignarUbicacionDto = {
        id_asignacion_origen: 50,
        id_proyecto_destino: 2,
        motivo_traslado: MotivoTraslado.CRUCE_MATERIAS,
        fecha_efectiva: '2026-03-01T00:00:00Z', // Mas de 4 semanas (60 dias)
      };

      await expect(service.reasignarUbicacion(dto)).rejects.toThrow(BadRequestException);
    });
  });
});
