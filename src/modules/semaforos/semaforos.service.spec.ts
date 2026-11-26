jest.mock('../storage/storage.service', () => ({ StorageService: class {} }));

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { SemaforosService } from './semaforos.service';
import { ReporteSemaforoEntity } from './entities/reporte-semaforo.entity';
import { PremioHistoricoEntity } from './entities/premio-historico.entity';
import { EvaluacionProyectoEntity } from './entities/evaluacion-proyecto.entity';
import { CertificadoFundacionEntity } from './entities/certificado-fundacion.entity';
import { UserEntity } from '../users/entities/user.entity';
import { AsignacionUbicacionEntity } from '../ubicacion/entities/asignacion-ubicacion.entity';
import { ProyectoReceptorEntity } from '../proyectos/entities/proyecto-receptor.entity';
import { StorageService } from '../storage/storage.service';
import { NotificacionesService } from '../notificaciones/notificaciones.service';

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

  const mockCertificadoFundacionRepo = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    delete: jest.fn(),
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

  const mockStorageService = {
    uploadFile: jest.fn().mockResolvedValue({
      url: 'https://r2.catovoluntarios.org/certificados-fundacion/test.pdf',
      key: 'certificados-fundacion/test.pdf',
      nombreArchivo: 'test.pdf',
    }),
  };

  const mockNotificacionesService = {
    alertaSemaforoRojo: jest.fn().mockResolvedValue(undefined),
    certificadoFundacionSubido: jest.fn().mockResolvedValue(undefined),
    premioOtorgado: jest.fn().mockResolvedValue(undefined),
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
          provide: getRepositoryToken(CertificadoFundacionEntity),
          useValue: mockCertificadoFundacionRepo,
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
        {
          provide: StorageService,
          useValue: mockStorageService,
        },
        {
          provide: NotificacionesService,
          useValue: mockNotificacionesService,
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
      mockPremioRepo.find.mockResolvedValue([]);
      mockCertificadoFundacionRepo.find.mockResolvedValue([]);

      const plantilla = await service.generarPlantillaCertificado(1, '2/2026');
      expect(plantilla.nombreCompleto).toBe('Rodrigo Quispe Mendoza');
      expect(plantilla.ci).toBe('8392104 LP');
      expect(plantilla.textoPreformateadoCopiar).toContain('CERTIFICADO DE CULMINACIÓN');
      expect(plantilla.textoPreformateadoCopiar).toContain('Rodrigo Quispe Mendoza');
    });
  });

  describe('certificadosFundacion', () => {
    it('debe subir certificado de fundación y emitir notificación', async () => {
      mockProyectoRepo.findOne.mockResolvedValue({ id: 1, nombreProyecto: 'Hogar San Ramón' });
      mockUserRepo.findOne.mockResolvedValue({
        id: 3,
        nombres: 'Mateo',
        primerApellido: 'Flores',
      });
      mockCertificadoFundacionRepo.findOne.mockResolvedValue(null);
      mockCertificadoFundacionRepo.create.mockImplementation((data) => ({ id: 10, ...data }));
      mockCertificadoFundacionRepo.save.mockImplementation((data) => Promise.resolve(data));

      const fakeFile = {
        originalname: 'Certificado_Hogar_San_Ramon.pdf',
        buffer: Buffer.from('PDF content'),
        mimetype: 'application/pdf',
      } as any;

      const resultado = await service.subirCertificadoFundacion(
        fakeFile,
        1,
        3,
        '2/2026',
        5,
        'Cumplimiento excelente',
      );

      expect(resultado).toBeDefined();
      expect(mockStorageService.uploadFile).toHaveBeenCalledWith(fakeFile, 'certificados-fundacion');
      expect(mockNotificacionesService.certificadoFundacionSubido).toHaveBeenCalled();
    });

    it('debe listar certificados de fundación por proyecto', async () => {
      mockCertificadoFundacionRepo.find.mockResolvedValue([
        { id: 1, idProyecto: 1, nombreArchivo: 'Cert.pdf' },
      ]);

      const lista = await service.obtenerCertificadosFundacionPorProyecto(1, '2/2026');
      expect(lista).toHaveLength(1);
      expect(lista[0].nombreArchivo).toBe('Cert.pdf');
    });
  });
});
