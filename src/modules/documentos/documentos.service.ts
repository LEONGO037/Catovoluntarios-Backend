import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, In, IsNull, Not, Repository } from 'typeorm';
import { Role } from '../../common/enums/role.enum';
import { NotificacionesService } from '../notificaciones/notificaciones.service';
import { PostulacionEntity } from '../postulaciones/entities/postulacion.entity';
import { StorageService } from '../storage/storage.service';
import { AsignacionUbicacionEntity, EstadoAsignacion } from '../ubicacion/entities/asignacion-ubicacion.entity';
import { UserEntity } from '../users/entities/user.entity';
import { CreateSesionInduccionDto } from './dtos/create-sesion-induccion.dto';
import { RegistrarAsistenciaInduccionDto } from './dtos/registrar-asistencia.dto';
import { UploadDocumentoDto } from './dtos/upload-documento.dto';
import { ValidarDocumentoDto } from './dtos/validar-documento.dto';
import { AsistenciaInduccionEntity, EstadoInduccion } from './entities/asistencia-induccion.entity';
import { DocumentoVoluntarioEntity, EstadoDocumento, TipoDocumento } from './entities/documento-voluntario.entity';
import { SesionInduccionEntity } from './entities/sesion-induccion.entity';

export interface UsuarioDocumentos {
  id: number;
  rol: Role;
}

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
    private readonly storageService: StorageService,
    private readonly notificaciones: NotificacionesService,
    private readonly dataSource: DataSource,
  ) {}

  async obtenerGestiones() {
    const registros: { nombre: string; activo: boolean }[] = await this.dataSource.query(
      'SELECT nombre, activo FROM semestres ORDER BY activo DESC, fecha_inicio DESC, id DESC',
    );
    const opciones = [...new Set(registros.flatMap(({ nombre }) => {
      const semestre = nombre.match(/\b[12]\/\d{4}\b/)?.[0];
      return semestre ? [semestre] : [];
    }))];
    const hoy = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/La_Paz', month: 'numeric', year: 'numeric',
    }).formatToParts();
    const mes = Number(hoy.find(({ type }) => type === 'month')?.value);
    const anio = hoy.find(({ type }) => type === 'year')?.value;
    const actual = `${mes <= 6 ? 1 : 2}/${anio}`;
    const activa = opciones[0] ?? actual;
    return { opciones: opciones.length ? opciones : [activa], activa };
  }

  private async gestion(semestre?: string) {
    if (semestre === undefined) return (await this.obtenerGestiones()).activa;
    if (typeof semestre !== 'string' || !/^[12]\/\d{4}$/.test(semestre)) {
      throw new BadRequestException('La gestión debe tener el formato 1/2027 o 2/2027.');
    }
    return semestre;
  }

  private async bloquearExpediente(manager: EntityManager, userId: number, semestre: string) {
    await manager.query(
      "SELECT pg_advisory_xact_lock($1::integer, hashtext('documentos:' || $2))",
      [userId, semestre],
    );
  }

  private async buscarAsignaciones(semestre: string, userIds?: number[]) {
    if (userIds && !userIds.length) return [];
    return this.asignacionRepo.find({
      where: {
        semestre,
        activo: true,
        estado: EstadoAsignacion.ACTIVO,
        ...(userIds ? { idUsuario: In(userIds) } : {}),
      },
      relations: { usuario: true, proyecto: true },
      order: { id: 'DESC' },
    });
  }

  private async edadesPorUsuario(semestre: string, userIds: number[]) {
    if (!userIds.length) return new Map<number, number>();
    const postulaciones = await this.dataSource.getRepository(PostulacionEntity).find({
      select: { id: true, userId: true, edadCalculada: true },
      where: { semestre, userId: In(userIds) },
      order: { id: 'ASC' },
    });
    return new Map(postulaciones.flatMap((p) => p.userId === undefined ? [] : [[p.userId, p.edadCalculada]]));
  }

  private documentoParaVista(doc: DocumentoVoluntarioEntity) {
    return { ...doc, archivoUrl: `/documentos/${doc.id}/archivo` };
  }

  private expediente(
    usuario: UserEntity,
    docs: DocumentoVoluntarioEntity[],
    asignacion?: AsignacionUbicacionEntity,
    edad?: number,
  ) {
    const observados = docs.some((doc) => doc.estado === EstadoDocumento.OBSERVADO);
    const rechazados = docs.some((doc) => doc.estado === EstadoDocumento.RECHAZADO);
    const aprobados = docs.length > 0 && docs.every((doc) => doc.estado === EstadoDocumento.APROBADO);
    return {
      id: usuario.id,
      userId: usuario.id,
      ci: usuario.ci,
      nombres: usuario.nombres,
      primerApellido: usuario.primerApellido,
      segundoApellido: usuario.segundoApellido,
      email: usuario.email,
      telefono: usuario.telefono,
      edad: edad ?? null,
      esMenor: edad !== undefined && edad < 18,
      rol: usuario.rol,
      nombreCompleto: `${usuario.nombres} ${usuario.primerApellido} ${usuario.segundoApellido ?? ''}`.trim(),
      carrera: usuario.carrera,
      proyectoAsignado: asignacion?.proyecto?.nombreProyecto ?? 'Sin asignar',
      polizaValidada: asignacion?.polizaValidada ?? false,
      induccionCompletada: asignacion?.induccionCompletada ?? false,
      habilitadoCampo: asignacion?.habilitadoCampo ?? false,
      estadoGeneral: rechazados ? EstadoDocumento.RECHAZADO : observados ? EstadoDocumento.OBSERVADO
        : aprobados ? EstadoDocumento.APROBADO : EstadoDocumento.PENDIENTE,
      documentos: docs.map((doc) => this.documentoParaVista(doc)),
    };
  }

  async obtenerMisDocumentos(userId: number, seleccion?: string) {
    const semestre = await this.gestion(seleccion);
    const [usuario, documentos, asignaciones, edades] = await Promise.all([
      this.userRepo.findOneBy({ id: userId }),
      this.docRepo.find({ where: { userId, semestre }, order: { id: 'DESC' } }),
      this.buscarAsignaciones(semestre, [userId]),
      this.edadesPorUsuario(semestre, [userId]),
    ]);
    if (!usuario) throw new NotFoundException('Usuario no encontrado.');
    return this.expediente(usuario, documentos, asignaciones[0], edades.get(userId));
  }

  async subirDocumento(userId: number, dto: UploadDocumentoDto, file: Express.Multer.File, seleccion?: string) {
    const semestre = await this.gestion(seleccion);
    if (!file?.size) throw new BadRequestException('Adjunta un archivo para cargar el documento.');
    const carga = await this.storageService.uploadFile(file, `documentos/usuario_${userId}`, true);
    let anterior: string | undefined;
    let documento: DocumentoVoluntarioEntity;

    try {
      documento = await this.dataSource.transaction(async (manager) => {
        await this.bloquearExpediente(manager, userId, semestre);
        const repo = manager.getRepository(DocumentoVoluntarioEntity);
        const existente = await repo.findOne({
          where: { userId, semestre, tipoDocumento: dto.tipoDocumento },
          order: { id: 'DESC' },
        });
        anterior = existente?.archivoUrl;
        const doc = existente ?? repo.create({ userId, semestre, tipoDocumento: dto.tipoDocumento });
        doc.archivoUrl = carga.url;
        doc.nombreArchivoOriginal = dto.nombreArchivoOriginal?.trim() || carga.nombreArchivo.slice(0, 255);
        doc.numeroPoliza = dto.numeroPoliza ?? null;
        doc.idPoliza = dto.idPoliza ?? null;
        doc.numeroCertificado = dto.numeroCertificado ?? null;
        doc.vigenciaInicio = dto.vigenciaInicio ?? null;
        doc.vigenciaFin = dto.vigenciaFin ?? null;
        doc.asegurado = dto.asegurado ?? null;
        doc.estado = EstadoDocumento.PENDIENTE;
        doc.observacionesValidacion = null;
        doc.fechaValidacion = null;
        doc.validadoPor = null;
        doc.enviadoRevisionEn = null;
        const guardado = await repo.save(doc);
        if (existente && doc.tipoDocumento === TipoDocumento.POLIZA_ACCIDENTES_APC7083) {
          await this.actualizarHabilitacion(manager, userId, semestre, 'polizaValidada', false);
        }
        return guardado;
      });
    } catch (error) {
      await this.storageService.eliminarDocumento(carga.url, userId);
      throw error;
    }

    if (anterior) await this.storageService.eliminarDocumento(anterior, userId);
    return this.documentoParaVista(documento);
  }

  async enviarRevision(userId: number, documentoIds: number[], seleccion?: string) {
    const semestre = await this.gestion(seleccion);
    return this.dataSource.transaction(async (manager) => {
      await this.bloquearExpediente(manager, userId, semestre);
      const repo = manager.getRepository(DocumentoVoluntarioEntity);
      const documentos = await repo.findBy({ id: In(documentoIds), userId, semestre });
      if (documentos.length !== documentoIds.length) {
        throw new NotFoundException('Uno o más documentos ya no pertenecen a este expediente.');
      }
      const nuevos = documentos.filter((doc) => !doc.enviadoRevisionEn && doc.estado === EstadoDocumento.PENDIENTE);
      if (nuevos.length) {
        const enviadoRevisionEn = new Date();
        nuevos.forEach((doc) => { doc.enviadoRevisionEn = enviadoRevisionEn; });
        await repo.save(nuevos);
        await this.notificaciones.documentosEnviados(manager, userId, semestre, nuevos);
      }
      return { documentos: documentos.map((doc) => this.documentoParaVista(doc)) };
    });
  }

  private comprobarAcceso(doc: DocumentoVoluntarioEntity, user: UsuarioDocumentos) {
    if (doc.userId !== user.id && user.rol !== Role.ADMIN_PASTORAL) {
      throw new ForbiddenException('No tienes acceso a este documento.');
    }
  }

  async obtenerArchivo(id: number, user: UsuarioDocumentos, seleccion?: string) {
    const semestre = await this.gestion(seleccion);
    const doc = await this.docRepo.findOneBy({ id, semestre });
    if (!doc) throw new NotFoundException('Documento no encontrado en esta gestión.');
    this.comprobarAcceso(doc, user);
    const contenido = await this.storageService.leerDocumento(doc.archivoUrl, doc.userId);
    const firma = contenido.subarray(0, 12);
    const mimeType = firma.subarray(0, 5).toString() === '%PDF-' ? 'application/pdf'
      : firma.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff])) ? 'image/jpeg'
      : firma.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) ? 'image/png'
      : firma.subarray(0, 4).toString() === 'RIFF' && firma.subarray(8, 12).toString() === 'WEBP' ? 'image/webp'
      : 'application/octet-stream';
    return { contenido, mimeType };
  }

  async eliminarDocumento(id: number, user: UsuarioDocumentos, seleccion?: string) {
    const semestre = await this.gestion(seleccion);
    const encontrado = await this.docRepo.findOneBy({ id, semestre });
    if (!encontrado) throw new NotFoundException('Documento no encontrado en esta gestión.');
    this.comprobarAcceso(encontrado, user);

    const doc = await this.dataSource.transaction(async (manager) => {
      await this.bloquearExpediente(manager, encontrado.userId, semestre);
      const repo = manager.getRepository(DocumentoVoluntarioEntity);
      const vigente = await repo.findOneBy({ id, semestre });
      if (!vigente) throw new NotFoundException('Documento no encontrado en esta gestión.');
      await repo.delete(id);
      if (vigente.tipoDocumento === TipoDocumento.POLIZA_ACCIDENTES_APC7083) {
        await this.actualizarHabilitacion(manager, vigente.userId, semestre, 'polizaValidada', false);
      }
      return vigente;
    });

    await this.storageService.eliminarDocumento(doc.archivoUrl, doc.userId);
    return { mensaje: 'Documento eliminado del expediente.', id };
  }

  async obtenerBandejaValidacion(seleccion?: string) {
    const semestre = await this.gestion(seleccion);
    const docs = await this.docRepo.find({
      where: { semestre, enviadoRevisionEn: Not(IsNull()) },
      order: { enviadoRevisionEn: 'DESC', id: 'DESC' },
    });
    const agrupados = new Map<number, DocumentoVoluntarioEntity[]>();
    for (const doc of docs) {
      const grupo = agrupados.get(doc.userId) ?? [];
      grupo.push(doc);
      agrupados.set(doc.userId, grupo);
    }
    const userIds = [...agrupados.keys()];
    const [usuarios, asignaciones, edades] = await Promise.all([
      userIds.length ? this.userRepo.findBy({ id: In(userIds) }) : [],
      this.buscarAsignaciones(semestre),
      this.edadesPorUsuario(semestre, userIds),
    ]);
    const asignacionPorUsuario = new Map(asignaciones.slice().reverse().map((a) => [a.idUsuario, a]));
    const voluntarios = usuarios.map((u) => this.expediente(
      u, agrupados.get(u.id) ?? [], asignacionPorUsuario.get(u.id), edades.get(u.id),
    ));
    return {
      kpis: {
        pendientesRevision: voluntarios.filter((v) => v.documentos.some((d) => d.estado === EstadoDocumento.PENDIENTE)).length,
        observados: voluntarios.filter((v) => v.documentos.some((d) =>
          d.estado === EstadoDocumento.OBSERVADO || d.estado === EstadoDocumento.RECHAZADO)).length,
        habilitadosEsteSemestre: asignacionPorUsuario.size
          ? [...asignacionPorUsuario.values()].filter((a) => a.habilitadoCampo).length : 0,
        polizasProximasVencer: voluntarios.filter((v) => v.documentos.some((d) => {
          if (d.tipoDocumento !== TipoDocumento.POLIZA_ACCIDENTES_APC7083 || !d.vigenciaFin) return false;
          const plazo = new Date(d.vigenciaFin).getTime() - Date.now();
          return plazo >= 0 && plazo < 30 * 86400000;
        })).length,
      },
      voluntarios,
    };
  }

  async validarDocumento(id: number, adminId: number, dto: ValidarDocumentoDto, seleccion?: string) {
    const semestre = await this.gestion(seleccion);
    const detalle = dto.estado === EstadoDocumento.APROBADO ? null : dto.observacionesValidacion?.trim() || null;
    if (dto.estado !== EstadoDocumento.APROBADO && !detalle) {
      throw new BadRequestException('Indica el motivo para observar o rechazar este documento.');
    }
    const encontrado = await this.docRepo.findOneBy({ id, semestre });
    if (!encontrado) throw new NotFoundException('Documento no encontrado en esta gestión.');

    return this.dataSource.transaction(async (manager) => {
      await this.bloquearExpediente(manager, encontrado.userId, semestre);
      const repo = manager.getRepository(DocumentoVoluntarioEntity);
      const doc = await repo.findOneBy({ id, semestre });
      if (!doc) throw new NotFoundException('Documento no encontrado en esta gestión.');
      if (!doc.enviadoRevisionEn) throw new ConflictException('El documento aún no se ha enviado a revisión.');
      if (dto.enviadoRevisionEn && Date.parse(dto.enviadoRevisionEn) !== doc.enviadoRevisionEn.getTime()) {
        throw new ConflictException('Se envió una versión nueva de este documento. Actualiza la bandeja antes de revisarlo.');
      }
      if (doc.estado === dto.estado && doc.observacionesValidacion === detalle) {
        return this.documentoParaVista(doc);
      }
      doc.estado = dto.estado;
      doc.observacionesValidacion = detalle;
      doc.fechaValidacion = new Date();
      doc.validadoPor = adminId;
      await repo.save(doc);
      if (doc.tipoDocumento === TipoDocumento.POLIZA_ACCIDENTES_APC7083) {
        await this.actualizarHabilitacion(manager, doc.userId, semestre, 'polizaValidada', doc.estado === EstadoDocumento.APROBADO);
      }
      await this.notificaciones.documentoValidado(manager, doc);
      return this.documentoParaVista(doc);
    });
  }

  private async actualizarHabilitacion(
    manager: EntityManager,
    userId: number,
    semestre: string,
    campo: 'polizaValidada' | 'induccionCompletada',
    valor: boolean,
  ) {
    const complemento = campo === 'polizaValidada' ? 'induccion_completada' : 'poliza_validada';
    await manager.createQueryBuilder().update(AsignacionUbicacionEntity)
      .set({ [campo]: valor, habilitadoCampo: () => `CASE WHEN :valor THEN ${complemento} ELSE false END` })
      .where({ idUsuario: userId, semestre, activo: true, estado: EstadoAsignacion.ACTIVO })
      .setParameter('valor', valor)
      .execute();
  }

  obtenerModeloCartaMenores() {
    return {
      nombre: 'Modelo_Oficial_Autorizacion_Padres_Pastoral_UCB.pdf',
      url: '/docs/plantillas/Modelo_Oficial_Autorizacion_Padres_Pastoral_UCB.pdf',
      instrucciones: 'Completar los datos del padre, madre o tutor legal y del voluntario menor. Adjuntar la autorización firmada y una copia del CI del tutor.',
    };
  }

  private lideraProyecto(asignacion: AsignacionUbicacionEntity, user: UsuarioDocumentos, proyectoLiderado?: number) {
    return user.rol === Role.ADMIN_PASTORAL || (
      asignacion.proyecto.catolider_titular_id === user.id ||
      asignacion.proyecto.catolider_aprendiz_id === user.id ||
      asignacion.idProyecto === proyectoLiderado
    );
  }

  private async proyectoLiderado(user: UsuarioDocumentos, semestre: string) {
    if (user.rol !== Role.CATOLIDER) return undefined;
    const lider = await this.userRepo.findOneBy({
      id: user.id, rol: Role.CATOLIDER, activo: true, esCatoliderVigente: true, semestreLiderazgo: semestre,
    });
    return lider?.proyectoReceptorAsignadoId;
  }

  private async asignacionesVisibles(user: UsuarioDocumentos, semestre: string, proyectoId?: number) {
    const [asignaciones, proyectoLiderado] = await Promise.all([
      this.buscarAsignaciones(semestre),
      this.proyectoLiderado(user, semestre),
    ]);
    return asignaciones.filter((a) => a.proyecto && this.lideraProyecto(a, user, proyectoLiderado)
      && (!proyectoId || a.idProyecto === proyectoId));
  }

  async obtenerProyectosInduccion(user: UsuarioDocumentos, seleccion?: string) {
    const semestre = await this.gestion(seleccion);
    const asignaciones = await this.asignacionesVisibles(user, semestre);
    return [...new Map(asignaciones.map((a) => [
      a.idProyecto, { id: a.idProyecto, nombre: a.proyecto.nombreProyecto },
    ])).values()].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
  }

  async obtenerSesionesInduccion(user: UsuarioDocumentos, seleccion?: string) {
    const semestre = await this.gestion(seleccion);
    const sesiones = await this.sesionRepo.find({ where: { semestre }, order: { fechaHora: 'DESC', id: 'DESC' } });
    if (user.rol === Role.ADMIN_PASTORAL) return sesiones;
    const proyectos = await this.obtenerProyectosInduccion(user, semestre);
    return sesiones.filter((sesion) =>
      sesion.proyectoId ? proyectos.some((p) => p.id === sesion.proyectoId) : proyectos.length > 0,
    );
  }

  async crearSesionInduccion(dto: CreateSesionInduccionDto, user: UsuarioDocumentos, seleccion?: string) {
    const semestre = await this.gestion(seleccion);
    if (dto.proyectoId) {
      const proyectos = await this.obtenerProyectosInduccion(user, semestre);
      if (!proyectos.some((p) => p.id === dto.proyectoId)) {
        throw new BadRequestException('El proyecto no tiene asignaciones activas en esta gestión.');
      }
    }
    const titulo = dto.titulo.trim();
    if (!titulo) throw new BadRequestException('Indica el título de la sesión.');
    return this.sesionRepo.save(this.sesionRepo.create({
      ...dto,
      titulo,
      fechaHora: new Date(dto.fechaHora),
      modalidad: dto.modalidad ?? 'PRESENCIAL',
      semestre,
    }));
  }

  async obtenerParticipantesInduccion(
    user: UsuarioDocumentos,
    seleccion?: string,
    proyectoId?: number,
    estado?: EstadoInduccion,
  ) {
    const semestre = await this.gestion(seleccion);
    const [asignaciones, sesiones] = await Promise.all([
      this.asignacionesVisibles(user, semestre, proyectoId),
      this.obtenerSesionesInduccion(user, semestre),
    ]);
    const userIds = [...new Set(asignaciones.map((a) => a.idUsuario))];
    const asistencias = userIds.length && sesiones.length ? await this.asistenciaRepo.find({
      where: { userId: In(userIds), sesionInduccionId: In(sesiones.map((s) => s.id)) },
    }) : [];
    const asistenciaPorSesion = new Map(asistencias.map((a) => [`${a.userId}:${a.sesionInduccionId}`, a]));
    const vistas = [...new Map(asignaciones.slice().reverse().map((a) => [a.idUsuario, a])).values()];
    const participantes = vistas.flatMap((a) => {
      const usuario = a.usuario;
      if (!usuario) return [];
      const aplicables = sesiones.filter((s) => !s.proyectoId || s.proyectoId === a.idProyecto);
      const sesion = aplicables.find((s) => asistenciaPorSesion.has(`${a.idUsuario}:${s.id}`)) ?? aplicables[0];
      const registro = sesion && asistenciaPorSesion.get(`${a.idUsuario}:${sesion.id}`);
      const estadoInduccion = registro?.estadoInduccion ?? EstadoInduccion.PENDIENTE;
      if (estado && estado !== estadoInduccion) return [];
      return [{
        id: registro?.id ?? null,
        sesionId: sesion?.id ?? null,
        userId: a.idUsuario,
        nombreCompleto: `${usuario.nombres} ${usuario.primerApellido} ${usuario.segundoApellido ?? ''}`.trim(),
        ci: usuario.ci,
        rol: usuario.rol,
        proyectoId: a.idProyecto,
        proyectoAsignado: a.proyecto.nombreProyecto,
        documentosHabilitados: a.polizaValidada,
        asistio: registro?.asistio ?? false,
        fechaCharla: registro?.fechaCharla ?? null,
        recorridoSitio: registro?.recorridoSitio && /^\d{4}-\d{2}-\d{2}$/.test(registro.recorridoSitio)
          ? registro.recorridoSitio : null,
        estadoInduccion,
        observaciones: registro?.observaciones ?? null,
        habilitadoCampo: a.habilitadoCampo,
      }];
    });
    return {
      kpis: {
        voluntariosHabilitados: participantes.filter((p) => p.habilitadoCampo).length,
        induccionCompletada: participantes.filter((p) => p.estadoInduccion === EstadoInduccion.COMPLETADA).length,
        pendientesInduccion: participantes.filter((p) => p.estadoInduccion === EstadoInduccion.PENDIENTE).length,
        reprogramarAsistencia: participantes.filter((p) => p.estadoInduccion === EstadoInduccion.REPROGRAMAR).length,
      },
      participantes,
    };
  }

  async registrarAsistenciaInduccion(dto: RegistrarAsistenciaInduccionDto, user: UsuarioDocumentos, seleccion?: string) {
    const semestre = await this.gestion(seleccion);
    const existente = dto.asistenciaId ? await this.asistenciaRepo.findOneBy({ id: dto.asistenciaId }) : null;
    const userId = existente?.userId ?? dto.userId;
    const sesionId = existente?.sesionInduccionId ?? dto.sesionId;
    if ((dto.asistenciaId && !existente) || !userId || !sesionId) {
      throw new NotFoundException('No se encontró la asistencia o no se indicó la sesión y el participante.');
    }
    const [sesion, asignaciones, proyectoLiderado] = await Promise.all([
      this.sesionRepo.findOneBy({ id: sesionId, semestre }),
      this.buscarAsignaciones(semestre, [userId]),
      this.proyectoLiderado(user, semestre),
    ]);
    if (!sesion) throw new NotFoundException('Sesión no encontrada en la gestión seleccionada.');
    const asignacion = asignaciones.find((a) => a.proyecto
      && (!sesion.proyectoId || sesion.proyectoId === a.idProyecto)
      && this.lideraProyecto(a, user, proyectoLiderado));
    if (!asignacion) {
      throw new ForbiddenException('No tienes acceso a modificar la asistencia de este participante.');
    }

    return this.dataSource.transaction(async (manager) => {
      await this.bloquearExpediente(manager, userId, semestre);
      const repo = manager.getRepository(AsistenciaInduccionEntity);
      const registro = await repo.findOneBy({ userId, sesionInduccionId: sesionId }) ??
        repo.create({ userId, sesionInduccionId: sesionId });
      if (dto.asistio !== undefined) registro.asistio = dto.asistio;
      if (dto.fechaCharla !== undefined) registro.fechaCharla = dto.fechaCharla;
      if (dto.recorridoSitio !== undefined) registro.recorridoSitio = dto.recorridoSitio;
      if (dto.observaciones !== undefined) registro.observaciones = dto.observaciones;
      if (registro.asistio && !registro.fechaCharla) throw new BadRequestException('Indica la fecha de la charla.');
      if (!registro.asistio) registro.fechaCharla = null;
      registro.estadoInduccion = registro.asistio && registro.recorridoSitio ? EstadoInduccion.COMPLETADA
        : registro.asistio || registro.recorridoSitio ? EstadoInduccion.EN_PROCESO
        : dto.estadoInduccion === EstadoInduccion.REPROGRAMAR ? EstadoInduccion.REPROGRAMAR : EstadoInduccion.PENDIENTE;
      const guardado = await repo.save(registro);
      const otraCompletada = await repo.existsBy({
        userId,
        estadoInduccion: EstadoInduccion.COMPLETADA,
        sesion: { semestre },
      });
      await this.actualizarHabilitacion(manager, userId, semestre, 'induccionCompletada', otraCompletada);
      return guardado;
    });
  }
}
