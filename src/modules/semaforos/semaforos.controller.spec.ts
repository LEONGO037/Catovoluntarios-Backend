jest.mock('../storage/storage.service', () => ({ StorageService: class {} }));

import { Test, TestingModule } from '@nestjs/testing';
import { SemaforosController } from './semaforos.controller';
import { SemaforosService } from './semaforos.service';

describe('SemaforosController', () => {
  let controller: SemaforosController;

  const mockSemaforosService = {
    guardarReporteSemaforo: jest.fn(),
    obtenerReportesPorProyecto: jest.fn(),
    obtenerResumenGeneralSemaforos: jest.fn(),
    obtenerBaseMadre: jest.fn(),
    crearPremio: jest.fn(),
    obtenerPremiosPorUsuario: jest.fn(),
    obtenerRankingDestacados: jest.fn(),
    registrarFeedbackProyecto: jest.fn(),
    obtenerFeedbackProyecto: jest.fn(),
    generarPlantillaCertificado: jest.fn(),
    obtenerPlantillasLote: jest.fn(),
    subirCertificadoFundacion: jest.fn(),
    obtenerCertificadosFundacionPorProyecto: jest.fn(),
    obtenerCertificadosFundacionPorUsuario: jest.fn(),
    listarTodosCertificadosFundacion: jest.fn(),
    eliminarCertificadoFundacion: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SemaforosController],
      providers: [
        {
          provide: SemaforosService,
          useValue: mockSemaforosService,
        },
      ],
    }).compile();

    controller = module.get<SemaforosController>(SemaforosController);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('P-19 Endpoints', () => {
    it('guardarReporte debe invocar semaforosService.guardarReporteSemaforo', async () => {
      const dto = {
        idAsignacion: 1,
        mes: 'Septiembre',
        colorSemaforo: 'Verde',
        observacionesDesempeno: 'Buen desempeño.',
      };
      mockSemaforosService.guardarReporteSemaforo.mockResolvedValue({ id: 1, ...dto });

      const res = await controller.guardarReporte(dto, { sub: 10 });
      expect(mockSemaforosService.guardarReporteSemaforo).toHaveBeenCalledWith(dto, 10);
      expect(res).toHaveProperty('id', 1);
    });

    it('obtenerPorProyecto debe retornar el reporte del centro', async () => {
      mockSemaforosService.obtenerReportesPorProyecto.mockResolvedValue({
        proyecto: { id: 1, nombre: 'Hogar San Ramón' },
        voluntarios: [],
      });

      const res = await controller.obtenerPorProyecto(1, { mes: 'Septiembre', anio: 2026 });
      expect(mockSemaforosService.obtenerReportesPorProyecto).toHaveBeenCalledWith(1, 'Septiembre', 2026);
      expect(res.proyecto.nombre).toBe('Hogar San Ramón');
    });

    it('obtenerResumenMes debe retornar los KPIs agregados de semáforo', async () => {
      mockSemaforosService.obtenerResumenGeneralSemaforos.mockResolvedValue({
        mes: 'Septiembre',
        total: 12,
        verdes: 8,
        amarillos: 2,
        rojos: 1,
        morados: 1,
      });

      const res = await controller.obtenerResumenMes({ mes: 'Septiembre', anio: 2026 });
      expect(res.total).toBe(12);
      expect(res.verdes).toBe(8);
    });
  });

  describe('P-20 Endpoints', () => {
    it('obtenerBaseMadre debe retornar voluntarios históricos y KPIs', async () => {
      mockSemaforosService.obtenerBaseMadre.mockResolvedValue({
        kpis: { totalHistoricos: 418 },
        voluntarios: [],
      });

      const res = await controller.obtenerBaseMadre({ nivel: 'SUPER_PRO' });
      expect(mockSemaforosService.obtenerBaseMadre).toHaveBeenCalledWith({ nivel: 'SUPER_PRO' });
      expect(res.kpis.totalHistoricos).toBe(418);
    });

    it('crearPremio debe registrar un nuevo reconocimiento', async () => {
      const dto = {
        idUsuario: 1,
        semestre: '2/2026',
        nombrePremio: 'Catovoluntario Destacado',
        descripcion: 'Asistencia perfecta y apoyo.',
      };
      mockSemaforosService.crearPremio.mockResolvedValue({ id: 99, ...dto });

      const res = await controller.crearPremio(dto);
      expect(res.id).toBe(99);
    });

    it('obtenerRanking debe retornar el podio RF-22', async () => {
      mockSemaforosService.obtenerRankingDestacados.mockResolvedValue({
        formula: 'Score = ...',
        podio: [{ posicion: 1, nombreCompleto: 'Rodrigo Quispe', score: 96.6 }],
      });

      const res = await controller.obtenerRanking('2/2026');
      expect(res.podio[0].score).toBe(96.6);
    });
  });

  describe('P-21 Endpoints', () => {
    it('registrarFeedback debe invocar semaforosService.registrarFeedbackProyecto', async () => {
      const dto = {
        proyectoId: 1,
        semestre: '2/2026',
        voluntariosRecibidos: 12,
        voluntariosCulminados: 11,
        solicitaContinuidadConvenio: true,
        cuposSolicitadosProximoSemestre: 14,
        bloque4ObservacionesSugerenciasLibres: 'Excelente experiencia.',
        nombreResponsableLlenado: 'Miriam Salinas',
      };
      mockSemaforosService.registrarFeedbackProyecto.mockResolvedValue({ id: 1, ...dto });

      const res = await controller.registrarFeedback(dto);
      expect(res.id).toBe(1);
    });

    it('generarPlantillaCertificado debe retornar la plantilla de datos oficial', async () => {
      mockSemaforosService.generarPlantillaCertificado.mockResolvedValue({
        nombreCompleto: 'Rodrigo Quispe Mendoza',
        ci: '8392104 LP',
        textoPreformateadoCopiar: 'CERTIFICADO...',
      });

      const res = await controller.generarPlantillaCertificado(1, '2/2026');
      expect(res.textoPreformateadoCopiar).toContain('CERTIFICADO');
    });

    it('subirCertificadoFundacion debe invocar el servicio de certificados de fundación', async () => {
      const fakeFile = { originalname: 'Fundacion_Cert.pdf' } as any;
      mockSemaforosService.subirCertificadoFundacion.mockResolvedValue({
        id: 1,
        nombreArchivo: 'Fundacion_Cert.pdf',
      });

      const res = await controller.subirCertificadoFundacion(
        fakeFile,
        1,
        3,
        '2/2026',
        'Todo en orden',
        { sub: 10 },
      );
      expect(mockSemaforosService.subirCertificadoFundacion).toHaveBeenCalledWith(
        fakeFile,
        1,
        3,
        '2/2026',
        10,
        'Todo en orden',
      );
      expect(res.id).toBe(1);
    });

    it('obtenerCertificadosFundacionProyecto debe invocar el servicio', async () => {
      mockSemaforosService.obtenerCertificadosFundacionPorProyecto.mockResolvedValue([
        { id: 1, nombreArchivo: 'Cert.pdf' },
      ]);

      const res = await controller.obtenerCertificadosFundacionProyecto(1, '2/2026');
      expect(mockSemaforosService.obtenerCertificadosFundacionPorProyecto).toHaveBeenCalledWith(1, '2/2026');
      expect(res).toHaveLength(1);
    });
  });
});
