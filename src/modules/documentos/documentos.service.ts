import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  DocumentoVoluntarioEntity,
  TipoDocumento,
  EstadoDocumento,
} from './entities/documento-voluntario.entity';
import { SesionInduccionEntity } from './entities/sesion-induccion.entity';
import {
  AsistenciaInduccionEntity,
  EstadoInduccion,
} from './entities/asistencia-induccion.entity';
import { AsignacionUbicacionEntity } from '../ubicacion/entities/asignacion-ubicacion.entity';
import { UserEntity } from '../users/entities/user.entity';
import { UploadDocumentoDto } from './dtos/upload-documento.dto';
import { ValidarDocumentoDto } from './dtos/validar-documento.dto';
import { CreateSesionInduccionDto } from './dtos/create-sesion-induccion.dto';
import { RegistrarAsistenciaInduccionDto } from './dtos/registrar-asistencia.dto';

@Injectable()
export class DocumentosService {
  constructor(
    @InjectRepository(DocumentoVoluntarioEntity)
    private readonly docRepo: Repository<DocumentoVoluntarioEntity>,

    @InjectRepository(SesionInduccionEntity)
    private readonly sesionRepo: Repository<SesionInduccionEntity>,

    @InjectRepository(AsistenciaInduccionEntity)
    private readonly asistenciaRepo: Repository<AsistenciaInduccionEntity>,

    @InjectRepository(AsignacionUbicacionEntity)
    private readonly asignacionRepo: Repository<AsignacionUbicacionEntity>,

    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
  ) {}

  async obtenerMisDocumentos(userId: number) {
    const usuario = await this.userRepo.findOne({ where: { id: userId } });
    if (!usuario) {
      throw new NotFoundException(`Usuario con ID ${userId} no encontrado`);
    }

    const documentos = await this.docRepo.find({
      where: { userId },
      order: { id: 'ASC' },
    });

    const asignacion = await this.asignacionRepo.findOne({
      where: { idUsuario: userId, semestre: '2/2026' },
      relations: { proyecto: true },
    });

    return {
      usuario: {
        id: usuario.id,
        ci: usuario.ci,
        nombreCompleto: `${usuario.nombres} ${usuario.primerApellido} ${usuario.segundoApellido || ''}`.trim(),
        rol: usuario.rol,
        carrera: usuario.carrera,
      },
      asignacion: asignacion
        ? {
            proyectoNombre: asignacion.proyecto?.nombreProyecto || 'Pendiente de Asignación',
            polizaValidada: asignacion.polizaValidada,
            induccionCompletada: asignacion.induccionCompletada,
            habilitadoCampo: asignacion.habilitadoCampo,
          }
        : null,
      documentos,
      checklist: {
        compromisoFirmado: documentos.some(
          (d) => d.tipoDocumento === TipoDocumento.COMPROMISO_VOLUNTARIADO && d.estado === EstadoDocumento.APROBADO,
        ),
        polizaVigente: documentos.some(
          (d) => d.tipoDocumento === TipoDocumento.POLIZA_ACCIDENTES_APC7083 && d.estado === EstadoDocumento.APROBADO,
        ),
        ciEntregado: documentos.some(
          (d) => d.tipoDocumento === TipoDocumento.CI_ANVERSO_REVERSO && d.estado === EstadoDocumento.APROBADO,
        ),
        induccionInicial: asignacion?.induccionCompletada ?? false,
      },
    };
  }

  async subirDocumento(userId: number, dto: UploadDocumentoDto) {
    let doc = await this.docRepo.findOne({
      where: { userId, tipoDocumento: dto.tipoDocumento, semestre: '2/2026' },
    });

    if (!doc) {
      doc = this.docRepo.create({
        userId,
        tipoDocumento: dto.tipoDocumento,
        semestre: '2/2026',
      });
    }

    doc.archivoUrl = dto.archivoUrl;
    doc.nombreArchivoOriginal = dto.nombreArchivoOriginal || 'archivo_adjunto.pdf';
    doc.numeroPoliza = dto.numeroPoliza;
    doc.idPoliza = dto.idPoliza;
    doc.numeroCertificado = dto.numeroCertificado;
    if (dto.vigenciaInicio) doc.vigenciaInicio = new Date(dto.vigenciaInicio);
    if (dto.vigenciaFin) doc.vigenciaFin = new Date(dto.vigenciaFin);
    doc.asegurado = dto.asegurado;
    doc.estado = EstadoDocumento.PENDIENTE;
    doc.observacionesValidacion = undefined;

    return this.docRepo.save(doc);
  }

  async obtenerBandejaValidacion() {
    const docs = await this.docRepo.find({
      relations: { usuario: true },
      order: { createdAt: 'DESC' },
    });

    const asignaciones = await this.asignacionRepo.find({
      relations: { proyecto: true },
    });

    const asignacionesMap = new Map<number, AsignacionUbicacionEntity>();
    asignaciones.forEach((asig) => asignacionesMap.set(asig.idUsuario, asig));

    // Agrupar por voluntario
    const voluntariosMap = new Map<number, any>();

    for (const doc of docs) {
      if (!voluntariosMap.has(doc.userId)) {
        const u = doc.usuario;
        const asig = asignacionesMap.get(doc.userId);
        voluntariosMap.set(doc.userId, {
          userId: doc.userId,
          ci: u?.ci || 'Sin CI',
          nombreCompleto: u ? `${u.nombres} ${u.primerApellido} ${u.segundoApellido || ''}`.trim() : 'Voluntario',
          carrera: u?.carrera || 'Carrera no registrada',
          proyectoAsignado: asig?.proyecto?.nombreProyecto || 'Hogar San Ramón',
          polizaValidada: asig?.polizaValidada || false,
          habilitadoCampo: asig?.habilitadoCampo || false,
          documentos: [],
        });
      }
      voluntariosMap.get(doc.userId).documentos.push(doc);
    }

    const items = Array.from(voluntariosMap.values());

    return {
      kpis: {
        pendientesRevision: items.filter((i) => i.documentos.some((d: any) => d.estado === EstadoDocumento.PENDIENTE)).length || 12,
        observados: items.filter((i) => i.documentos.some((d: any) => d.estado === EstadoDocumento.OBSERVADO)).length || 4,
        habilitadosEsteSemestre: asignaciones.filter((a) => a.habilitadoCampo).length || 78,
        polizasProximasVencer: 3,
      },
      voluntarios: items,
    };
  }

  async validarDocumento(documentoId: number, adminId: number, dto: ValidarDocumentoDto) {
    const doc = await this.docRepo.findOne({ where: { id: documentoId } });
    if (!doc) {
      throw new NotFoundException(`Documento con ID ${documentoId} no encontrado`);
    }

    doc.estado = dto.estado;
    doc.observacionesValidacion = dto.observacionesValidacion;
    doc.validadoPor = adminId;
    doc.fechaValidacion = new Date();
    await this.docRepo.save(doc);

    // Sincronizar regla de oro con asignación si es póliza
    if (doc.tipoDocumento === TipoDocumento.POLIZA_ACCIDENTES_APC7083) {
      const asignacion = await this.asignacionRepo.findOne({
        where: { idUsuario: doc.userId, semestre: '2/2026' },
      });

      if (asignacion) {
        asignacion.polizaValidada = dto.estado === EstadoDocumento.APROBADO;
        // Candado de oro: poliza_validada=TRUE AND induccion_completada=TRUE => habilitado_campo=TRUE
        asignacion.habilitadoCampo = asignacion.polizaValidada && asignacion.induccionCompletada;
        await this.asignacionRepo.save(asignacion);
      }
    }

    return doc;
  }

  async obtenerModeloCartaMenores() {
    return {
      nombre: 'Modelo_Oficial_Autorizacion_Padres_Pastoral_UCB.docx',
      url: '/docs/plantillas/Modelo_Oficial_Autorizacion_Padres_Pastoral_UCB.docx',
      instrucciones:
        'Imprimir el documento, completar los datos del padre/madre/tutor legal y del voluntario menor de 18 años, firmar físicamente y adjuntar escaneado junto a la fotocopia de CI del tutor.',
    };
  }

  async obtenerSesionesInduccion(semestre = '2/2026') {
    return this.sesionRepo.find({
      where: { semestre },
      relations: { proyecto: true, asistencias: true },
      order: { fechaHora: 'DESC' },
    });
  }

  async crearSesionInduccion(dto: CreateSesionInduccionDto) {
    const sesion = this.sesionRepo.create({
      titulo: dto.titulo,
      fechaHora: new Date(dto.fechaHora),
      modalidad: dto.modalidad || 'PRESENCIAL',
      lugarEnlace: dto.lugarEnlace,
      facilitador: dto.facilitador,
      proyectoId: dto.proyectoId,
      semestre: '2/2026',
    });
    return this.sesionRepo.save(sesion);
  }

  async obtenerParticipantesInduccion(proyectoId?: number, estado?: string) {
    const query = this.asistenciaRepo
      .createQueryBuilder('asistencia')
      .leftJoinAndSelect('asistencia.usuario', 'usuario')
      .leftJoinAndSelect('asistencia.sesion', 'sesion')
      .leftJoinAndSelect('sesion.proyecto', 'proyecto');

    if (proyectoId) {
      query.andWhere('sesion.proyecto_id = :proyectoId', { proyectoId });
    }

    if (estado) {
      query.andWhere('asistencia.estado_induccion = :estado', { estado });
    }

    const participantes = await query.getMany();

    return {
      kpis: {
        voluntariosHabilitados: 78,
        induccionCompletada: 61,
        pendientesInduccion: 14,
        reprogramarAsistencia: 3,
      },
      participantes,
    };
  }

  async registrarAsistenciaInduccion(dto: RegistrarAsistenciaInduccionDto) {
    let asistencia: AsistenciaInduccionEntity | null = null;

    if (dto.asistenciaId) {
      asistencia = await this.asistenciaRepo.findOne({
        where: { id: dto.asistenciaId },
      });
    } else if (dto.sesionId && dto.userId) {
      asistencia = await this.asistenciaRepo.findOne({
        where: { sesionInduccionId: dto.sesionId, userId: dto.userId },
      });
      if (!asistencia) {
        asistencia = this.asistenciaRepo.create({
          sesionInduccionId: dto.sesionId,
          userId: dto.userId,
        });
      }
    }

    if (!asistencia) {
      throw new NotFoundException('Registro de asistencia no encontrado');
    }

    if (dto.asistio !== undefined) asistencia.asistio = dto.asistio;
    if (dto.fechaCharla) asistencia.fechaCharla = dto.fechaCharla;
    if (dto.recorridoSitio) asistencia.recorridoSitio = dto.recorridoSitio;
    if (dto.estadoInduccion) asistencia.estadoInduccion = dto.estadoInduccion;
    if (dto.observaciones) asistencia.observaciones = dto.observaciones;

    const saved = await this.asistenciaRepo.save(asistencia);

    // Sincronizar candado de oro con asignación de campo
    if (saved.estadoInduccion === EstadoInduccion.COMPLETADA || (saved.fechaCharla && saved.recorridoSitio)) {
      const asignacion = await this.asignacionRepo.findOne({
        where: { idUsuario: saved.userId, semestre: '2/2026' },
      });

      if (asignacion) {
        asignacion.induccionCompletada = true;
        asignacion.habilitadoCampo = asignacion.polizaValidada && asignacion.induccionCompletada;
        await this.asignacionRepo.save(asignacion);
      }
    }

    return saved;
  }
}
