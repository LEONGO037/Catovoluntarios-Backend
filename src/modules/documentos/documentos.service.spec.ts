import { BadRequestException, ConflictException } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { NotificacionesService } from '../notificaciones/notificaciones.service';
import type { StorageService } from '../storage/storage.service';
import { AsignacionUbicacionEntity } from '../ubicacion/entities/asignacion-ubicacion.entity';
import { UserEntity } from '../users/entities/user.entity';
import { DocumentosService } from './documentos.service';
import { AsistenciaInduccionEntity } from './entities/asistencia-induccion.entity';
import { DocumentoVoluntarioEntity, EstadoDocumento, TipoDocumento } from './entities/documento-voluntario.entity';
import { SesionInduccionEntity } from './entities/sesion-induccion.entity';

jest.mock('../storage/storage.service', () => ({ StorageService: class {} }));

describe('DocumentosService - revisión documental', () => {
  const semestre = '2/2026';
  const documentos = new Map<number, DocumentoVoluntarioEntity>();
  const repo = {
    findOneBy: jest.fn(async ({ id, semestre: gestion }: { id: number; semestre: string }) => {
      const documento = documentos.get(id);
      return documento?.semestre === gestion ? documento : null;
    }),
    save: jest.fn(),
  };
  const manager = {
    query: jest.fn(),
    getRepository: jest.fn(() => repo),
  };
  const transaction = jest.fn((callback: (m: typeof manager) => unknown) => callback(manager));
  const notificaciones = { documentoValidado: jest.fn() };
  const servicio = new DocumentosService(
    repo as unknown as Repository<DocumentoVoluntarioEntity>,
    {} as Repository<SesionInduccionEntity>,
    {} as Repository<AsistenciaInduccionEntity>,
    {} as Repository<AsignacionUbicacionEntity>,
    {} as Repository<UserEntity>,
    {} as StorageService,
    notificaciones as unknown as NotificacionesService,
    { transaction } as unknown as DataSource,
  );

  const crearDocumento = (id: number, tipoDocumento: TipoDocumento) => Object.assign(
    new DocumentoVoluntarioEntity(),
    {
      id,
      userId: 42,
      semestre,
      tipoDocumento,
      estado: EstadoDocumento.PENDIENTE,
      observacionesValidacion: null,
      enviadoRevisionEn: new Date('2026-11-20T16:00:00Z'),
    },
  );

  beforeEach(() => {
    jest.clearAllMocks();
    documentos.clear();
    documentos.set(17, crearDocumento(17, TipoDocumento.CI_ANVERSO_REVERSO));
    documentos.set(18, crearDocumento(18, TipoDocumento.POLIZA_ACCIDENTES_APC7083));
  });

  it.each([EstadoDocumento.OBSERVADO, EstadoDocumento.RECHAZADO] as const)(
    'exige un motivo no vacío para el estado %s',
    async (estado) => {
      await expect(servicio.validarDocumento(17, 1, { estado, observacionesValidacion: '   ' }, semestre))
        .rejects.toBeInstanceOf(BadRequestException);
      expect(transaction).not.toHaveBeenCalled();
    },
  );

  it('valida el documento seleccionado y evita duplicar su notificación al reintentar', async () => {
    const veredicto = {
      estado: EstadoDocumento.OBSERVADO as const,
      observacionesValidacion: '  Volver a escanear el reverso  ',
    };
    await expect(servicio.validarDocumento(17, 1, veredicto, semestre)).resolves.toMatchObject({
      id: 17,
      estado: EstadoDocumento.OBSERVADO,
      observacionesValidacion: 'Volver a escanear el reverso',
      validadoPor: 1,
    });
    await servicio.validarDocumento(17, 1, veredicto, semestre);
    expect(documentos.get(18)?.estado).toBe(EstadoDocumento.PENDIENTE);
    expect(repo.save).toHaveBeenCalledTimes(1);
    expect(notificaciones.documentoValidado).toHaveBeenCalledTimes(1);
    expect(notificaciones.documentoValidado).toHaveBeenCalledWith(manager, documentos.get(17));
  });

  it('impide aprobar una versión anterior del archivo', async () => {
    await expect(servicio.validarDocumento(17, 1, {
      estado: EstadoDocumento.APROBADO,
      enviadoRevisionEn: '2026-11-19T16:00:00Z',
    }, semestre)).rejects.toBeInstanceOf(ConflictException);
    expect(repo.save).not.toHaveBeenCalled();
    expect(notificaciones.documentoValidado).not.toHaveBeenCalled();
  });
});
