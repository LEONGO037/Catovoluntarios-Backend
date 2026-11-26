import { BadRequestException } from '@nestjs/common';
import { PostulacionesService } from './postulaciones.service';
import { TipoRelacionUcb } from './entities/postulacion.entity';

describe('PostulacionesService - Reglas Institucionales de Admisión', () => {
  let service: PostulacionesService;

  const mockPostulacionRepo = {
    createQueryBuilder: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    count: jest.fn(),
  };

  const mockUserRepo = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockDataSource = {
    transaction: jest.fn(),
  };

  beforeEach(() => {
    service = new PostulacionesService(
      mockPostulacionRepo as any,
      mockUserRepo as any,
      mockDataSource as any,
    );
  });

  it('debe inicializarse correctamente', () => {
    expect(service).toBeDefined();
  });

  it('debe rechazar la postulación si el estudiante tiene más de 6 materias inscritas', async () => {
    const dtoInvalido: any = {
      tipoRelacionUcb: TipoRelacionUcb.ESTUDIANTE_REGULAR,
      nombres: 'Carlos',
      primerApellido: 'Vaca',
      ci: '1234567',
      expedido: 'LP',
      fechaNacimiento: '2004-01-01',
      edad: 22,
      celular: '70012345',
      correoElectronico: 'carlos@ucb.edu.bo',
      carrera: 'Ingeniería de Sistemas',
      zonaResidencia: 'Centro',
      numeroMaterias: 7, // Excede 6 materias
      tieneMateriasPesadas: false,
      actividadesExtracurriculares: 0,
      experienciaVoluntariadoPrevia: false,
      habilidadesDestacadas: [],
      conocimientoComputacion: true,
      tresPalabrasPersonalidad: ['Alegre', 'Leal', 'Atento'],
      poblacionesInteres: ['Niños y primera infancia'],
      compromisoAceptado: true,
    };

    await expect(service.create(dtoInvalido)).rejects.toThrow(
      BadRequestException,
    );
    await expect(service.create(dtoInvalido)).rejects.toThrow(
      'Por política institucional de Pastoral UCB, el límite máximo permitido es de 6 materias inscritas para evitar la sobrecarga académica.',
    );
  });

  it('debe exigir la autorización explícita de padres o tutores para menores de edad', async () => {
    const dtoMenorSinPermiso: any = {
      tipoRelacionUcb: TipoRelacionUcb.ESTUDIANTE_REGULAR,
      nombres: 'Sofía',
      primerApellido: 'Ramos',
      ci: '7654321',
      expedido: 'LP',
      fechaNacimiento: '2010-06-15',
      edad: 16,
      celular: '70098765',
      correoElectronico: 'sofia@ucb.edu.bo',
      carrera: 'Comunicación Social',
      zonaResidencia: 'Miraflores',
      numeroMaterias: 5,
      tieneMateriasPesadas: false,
      actividadesExtracurriculares: 0,
      experienciaVoluntariadoPrevia: false,
      habilidadesDestacadas: [],
      conocimientoComputacion: true,
      tresPalabrasPersonalidad: ['Creativa', 'Dinámica', 'Empática'],
      poblacionesInteres: ['Niños y primera infancia'],
      autorizacionPadresConfirmada: false, // No confirmada
      compromisoAceptado: true,
    };

    await expect(service.create(dtoMenorSinPermiso)).rejects.toThrow(
      BadRequestException,
    );
    await expect(service.create(dtoMenorSinPermiso)).rejects.toThrow(
      'Para postulantes menores de 18 años es obligatoria la confirmación de autorización de padres o tutores legales.',
    );
  });

  it('debe crear un usuario con passwordHash válido al registrar una postulación exitosa', async () => {
    const dtoValido: any = {
      tipoRelacionUcb: TipoRelacionUcb.ESTUDIANTE_REGULAR,
      nombres: 'Mateo',
      primerApellido: 'Flores',
      ci: '9988776',
      expedido: 'LP',
      fechaNacimiento: '2002-05-10',
      edad: 24,
      celular: '71122334',
      correoElectronico: 'mateo.flores@ucb.edu.bo',
      carrera: 'Derecho',
      zonaResidencia: 'Sopocachi',
      numeroMaterias: 5,
      tieneMateriasPesadas: false,
      actividadesExtracurriculares: 1,
      experienciaVoluntariadoPrevia: true,
      habilidadesDestacadas: ['Liderazgo'],
      conocimientoComputacion: true,
      tresPalabrasPersonalidad: ['Solidario', 'Comprometido', 'Puntual'],
      poblacionesInteres: ['Adultos mayores'],
      compromisoAceptado: true,
    };

    let savedUser: any = null;
    let savedPostulacion: any = null;

    mockDataSource.transaction.mockImplementation(async (cb: any) => {
      const mockManager = {
        getRepository: (entity: any) => {
          if (entity.name === 'UserEntity' || entity.name === 'usuarios') {
            return {
              findOne: jest.fn().mockResolvedValue(null),
              create: jest.fn().mockImplementation((u) => ({ ...u })),
              save: jest.fn().mockImplementation(async (u) => {
                savedUser = { ...u, id: 501 };
                return savedUser;
              }),
            };
          }
          return {
            createQueryBuilder: jest.fn().mockReturnValue({
              where: jest.fn().mockReturnThis(),
              getOne: jest.fn().mockResolvedValue(null),
              getCount: jest.fn().mockResolvedValue(0),
            }),
            create: jest.fn().mockImplementation((p) => ({ ...p })),
            save: jest.fn().mockImplementation(async (p) => {
              savedPostulacion = { ...p, id: 10 };
              return savedPostulacion;
            }),
          };
        },
      };
      return await cb(mockManager);
    });

    const resultado = await service.create(dtoValido);

    expect(resultado).toBeDefined();
    expect(savedUser).toBeDefined();
    expect(savedUser.passwordHash).toBeDefined();
    expect(savedUser.passwordHash.length).toBeGreaterThan(20);
    expect(savedPostulacion.userId).toBe(501);
  });

  it('debe soportar pasaporte alfanumérico, habilidades adicionales y semestre en la postulación', async () => {
    const dtoPasaporte: any = {
      tipoRelacionUcb: TipoRelacionUcb.EXTERNO_AUTORIZADO,
      tipoDocumento: 'PASAPORTE',
      nombres: 'Lucía',
      primerApellido: 'Fernández',
      ci: 'PA894512B',
      fechaNacimiento: '2001-03-20',
      edad: 25,
      celular: '72233445',
      correoElectronico: 'lucia.ext@gmail.com',
      carrera: 'N/A',
      zonaResidencia: 'Otro: Achumani',
      numeroMaterias: 0,
      tieneMateriasPesadas: false,
      actividadesExtracurriculares: 0,
      experienciaVoluntariadoPrevia: false,
      habilidadesDestacadas: ['Otros'],
      habilidadesOtras: 'Lengua de señas boliviana y confección de pelucas',
      semestre: '1/2027',
      conocimientoComputacion: true,
      tresPalabrasPersonalidad: ['Empática', 'Creativa', 'Constante'],
      poblacionesInteres: ['Personas con discapacidad'],
      compromisoAceptado: true,
    };

    let savedUser: any = null;
    let savedPostulacion: any = null;

    mockDataSource.transaction.mockImplementation(async (cb: any) => {
      const mockManager = {
        getRepository: (entity: any) => {
          if (entity.name === 'UserEntity' || entity.name === 'usuarios') {
            return {
              findOne: jest.fn().mockResolvedValue(null),
              create: jest.fn().mockImplementation((u) => ({ ...u })),
              save: jest.fn().mockImplementation(async (u) => {
                savedUser = { ...u, id: 502 };
                return savedUser;
              }),
            };
          }
          return {
            createQueryBuilder: jest.fn().mockReturnValue({
              where: jest.fn().mockReturnThis(),
              getOne: jest.fn().mockResolvedValue(null),
              getCount: jest.fn().mockResolvedValue(1),
            }),
            create: jest.fn().mockImplementation((p) => ({ ...p })),
            save: jest.fn().mockImplementation(async (p) => {
              savedPostulacion = { ...p, id: 11 };
              return savedPostulacion;
            }),
          };
        },
      };
      return await cb(mockManager);
    });

    const resultado = await service.create(dtoPasaporte);

    expect(resultado).toBeDefined();
    expect(savedUser.tipoDocumento).toBe('PASAPORTE');
    expect(savedUser.ci).toBe('PA894512B');
    expect(savedUser.semestreIngreso).toBe('1/2027');
    expect(savedPostulacion.tipoDocumento).toBe('PASAPORTE');
    expect(savedPostulacion.expedido).toBe('N/A');
    expect(savedPostulacion.habilidadesOtras).toBe(
      'Lengua de señas boliviana y confección de pelucas',
    );
    expect(savedPostulacion.semestre).toBe('1/2027');
  });
});
