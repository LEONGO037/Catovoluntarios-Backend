import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { SemaforosService } from './semaforos.service';
import { ReporteSemaforoEntity } from './entities/reporte-semaforo.entity';
import { PremioHistoricoEntity } from './entities/premio-historico.entity';
import { EvaluacionProyectoEntity } from './entities/evaluacion-proyecto.entity';
import { UserEntity } from '../users/entities/user.entity';
import { AsignacionUbicacionEntity } from '../ubicacion/entities/asignacion-ubicacion.entity';
import { ProyectoReceptorEntity } from '../proyectos/entities/proyecto-receptor.entity';

// Helper de token para compatibilidad Jest CommonJS sin ESM

describe('SemaforosService', () => {
  let service: SemaforosService;

  const mockSemaforoRepo = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
  };

  const mockPremioRepo = {
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockEvaluacionRepo = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
  };

  const mockUserRepo = {
    find: jest.fn(),
    findOne: jest.fn(),
  };

  const mockAsignacionRepo = {
    findOne: jest.fn(),
    find: jest.fn(),
  };

  const mockProyectoRepo = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SemaforosService,
        {
          provide: getRepositoryToken(ReporteSemaforoEntity),
          useValue: mockSemaforoRepo,
        },
        {
          provide: getRepositoryToken(PremioHistoricoEntity),
          useValue: mockPremioRepo,
        },
        {
          provide: getRepositoryToken(EvaluacionProyectoEntity),
          useValue: mockEvaluacionRepo,
        },
        {
          provide: getRepositoryToken(UserEntity),
          useValue: mockUserRepo,
        },
        {
          provide: getRepositoryToken(AsignacionUbicacionEntity),
          useValue: mockAsignacionRepo,
        },
        {
          provide: getRepositoryToken(ProyectoReceptorEntity),
          useValue: mockProyectoRepo,
        },
      ],
    }).compile();

    service = module.get<SemaforosService>(SemaforosService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('guardarReporteSemaforo', () => {
    it('debe lanzar BadRequestException si observacionesDesempeno está vacío', async () => {
      await expect(
        service.guardarReporteSemaforo({
          idAsignacion: 1,
          mes: 'Septiembre',
          colorSemaforo: 'Verde',
          observacionesDesempeno: '   ',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('debe lanzar NotFoundException si la asignación no existe', async () => {
      mockAsignacionRepo.findOne.mockResolvedValue(null);

      await expect(
        service.guardarReporteSemaforo({
          idAsignacion: 999,
          mes: 'Septiembre',
          colorSemaforo: 'Verde',
          observacionesDesempeno: 'Buen desempeño general en sala.',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('debe guardar un reporte con justificación y color normalizado', async () => {
      mockAsignacionRepo.findOne.mockResolvedValue({ id: 1, idUsuario: 10 });
      mockSemaforoRepo.findOne.mockResolvedValue(null);
      mockSemaforoRepo.create.mockImplementation((dto) => dto);
      mockSemaforoRepo.save.mockImplementation((r) => Promise.resolve({ id: 5, ...r }));

      const resultado = await service.guardarReporteSemaforo({
        idAsignacion: 1,
        mes: 'Septiembre',
        colorSemaforo: 'morado',
        observacionesDesempeno: 'Excelente iniciativa y puntualidad.',
      });

      expect(resultado.colorSemaforo).toBe('Morado');
      expect(resultado.observacionesDesempeno).toBe('Excelente iniciativa y puntualidad.');
      expect(mockSemaforoRepo.save).toHaveBeenCalled();
    });
  });

  describe('registrarFeedbackProyecto', () => {
    it('debe lanzar BadRequestException si el Bloque 4 libre está vacío', async () => {
      mockProyectoRepo.findOne.mockResolvedValue({ id: 1, nombreProyecto: 'Hogar San Ramón' });

      await expect(
        service.registrarFeedbackProyecto({
          proyectoId: 1,
          semestre: '2/2026',
          voluntariosRecibidos: 10,
          voluntariosCulminados: 10,
          solicitaContinuidadConvenio: true,
          cuposSolicitadosProximoSemestre: 12,
          bloque4ObservacionesSugerenciasLibres: '',
          nombreResponsableLlenado: 'Miriam Salinas',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('generarPlantillaCertificado', () => {
    it('debe generar texto preformateado para copiar al portapapeles', async () => {
      mockUserRepo.findOne.mockResolvedValue({
        id: 1,
        ci: '8392104 LP',
        nombres: 'Rodrigo',
        primerApellido: 'Quispe',
        segundoApellido: 'Mendoza',
        carrera: 'Ing. Biomédica',
        asignaciones: [
          {
            proyecto: { nombreProyecto: 'Hogar San Ramón' },
          },
        ],
      });

      const plantilla = await service.generarPlantillaCertificado(1, '2/2026');
      expect(plantilla.nombreCompleto).toBe('Rodrigo Quispe Mendoza');
      expect(plantilla.ci).toBe('8392104 LP');
      expect(plantilla.textoPreformateadoCopiar).toContain('CERTIFICADO DE CULMINACIÓN');
      expect(plantilla.textoPreformateadoCopiar).toContain('Rodrigo Quispe Mendoza');
    });
  });
});
