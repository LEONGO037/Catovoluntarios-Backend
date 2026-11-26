import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, In, IsNull, Repository } from 'typeorm';
import { Role } from '../../common/enums/role.enum';
import {
  DocumentoVoluntarioEntity,
  EstadoDocumento,
  TipoDocumento,
} from '../documentos/entities/documento-voluntario.entity';
import { UserEntity } from '../users/entities/user.entity';
import {
  AsignacionUbicacionEntity,
  EstadoAsignacion,
} from '../ubicacion/entities/asignacion-ubicacion.entity';
import { NotificacionEntity } from './notificacion.entity';

const tipoDocumento = {
  [TipoDocumento.POLIZA_ACCIDENTES_APC7083]: 'Póliza de seguro',
  [TipoDocumento.COMPROMISO_VOLUNTARIADO]: 'Carta de compromiso',
  [TipoDocumento.CI_ANVERSO_REVERSO]: 'Fotocopia de CI',
  [TipoDocumento.CARTA_AUTORIZACION_PADRES_MENOR]: 'Autorización para menor',
  [TipoDocumento.CI_PADRE_TUTOR_MENOR]: 'CI de padre, madre o tutor',
  [TipoDocumento.OTRO_RESPALDO]: 'Otro respaldo',
};

@Injectable()
export class NotificacionesService {
  constructor(
    @InjectRepository(NotificacionEntity)
    private readonly notificaciones: Repository<NotificacionEntity>,
    @InjectRepository(UserEntity)
    private readonly users: Repository<UserEntity>,
  ) {}

  async documentosEnviados(
    manager: EntityManager,
    userId: number,
    semestre: string,
    documentos: DocumentoVoluntarioEntity[],
  ) {
    if (!documentos.length) return;

    const voluntario = await manager.findOneByOrFail(UserEntity, { id: userId });
    const asignaciones = await manager.find(AsignacionUbicacionEntity, {
      where: { idUsuario: userId, semestre, activo: true, estado: EstadoAsignacion.ACTIVO },
      relations: { proyecto: true },
    });
    const idsLideres = [
      ...new Set(
        asignaciones
          .flatMap(({ proyecto }) => [proyecto.catolider_titular_id, proyecto.catolider_aprendiz_id])
          .filter((id): id is number => typeof id === 'number'),
      ),
    ];
    const idsProyectos = [...new Set(asignaciones.map(({ idProyecto }) => idProyecto))];
    const destinatarios = await manager.find(UserEntity, {
      select: { id: true, rol: true },
      where: [
        { rol: Role.ADMIN_PASTORAL, activo: true },
        { rol: Role.CATOLIDER, activo: true, id: In(idsLideres) },
        {
          rol: Role.CATOLIDER,
          activo: true,
          esCatoliderVigente: true,
          semestreLiderazgo: semestre,
          proyectoReceptorAsignadoId: In(idsProyectos),
        },
      ],
    });
    if (!destinatarios.length) return;

    const nombre = [voluntario.nombres, voluntario.primerApellido, voluntario.segundoApellido]
      .filter(Boolean)
      .join(' ');
    const nombresDocumentos = documentos.map(this.nombreDocumento).join(', ');
    await manager.insert(
      NotificacionEntity,
      destinatarios.map(({ id, rol }) => ({
        userId: id,
        semestre,
        titulo: 'Documentos pendientes de revisión',
        mensaje: `${nombre} envió ${nombresDocumentos} para revisión en la gestión ${semestre}.`,
        tipo: 'DOCUMENTOS_ENVIADOS',
        enlaceDestino: rol === Role.ADMIN_PASTORAL ? '/validacion-documental' : null,
      })),
    );
  }

  async documentoValidado(manager: EntityManager, documento: DocumentoVoluntarioEntity) {
    const estado = documento.estado.toLowerCase();
    const detalle = documento.observacionesValidacion;
    await manager.insert(NotificacionEntity, {
      userId: documento.userId,
      semestre: documento.semestre,
      titulo: `Resultado de revisión: ${estado}`,
      mensaje: `Tu archivo ${this.nombreDocumento(documento)} recibió el estado ${estado}.${
        detalle && documento.estado !== EstadoDocumento.APROBADO ? ` Motivo: ${detalle}` : ''
      }`,
      tipo: `DOCUMENTO_${documento.estado}`,
      enlaceDestino: '/documentos',
    });
  }

  async alertaSemaforoRojo(datos: {
    voluntarioNombre: string;
    proyectoNombre: string;
    mes: string;
    anio: number;
    observaciones?: string;
    semestre?: string;
  }) {
    const admins = await this.users.find({
      where: { rol: Role.ADMIN_PASTORAL, activo: true },
    });
    if (!admins.length) return;

    const detalle = datos.observaciones ? ` Motivo: "${datos.observaciones}".` : '';
    const sem = datos.semestre || '2/2026';

    await this.notificaciones.insert(
      admins.map((admin) => ({
        userId: admin.id,
        semestre: sem,
        titulo: 'Alerta de Desempeño: Semáforo Rojo / Abandono',
        mensaje: `El Catolíder evaluó a ${datos.voluntarioNombre} con semáforo Rojo o alerta de abandono en el proyecto "${datos.proyectoNombre}" (${datos.mes}/${datos.anio}).${detalle}`,
        tipo: 'SEMAFORO_ROJO',
        enlaceDestino: '/semaforos',
      })),
    );
  }

  async certificadoFundacionSubido(datos: {
    proyectoNombre: string;
    voluntarioNombre: string;
    semestre: string;
  }) {
    const admins = await this.users.find({
      where: { rol: Role.ADMIN_PASTORAL, activo: true },
    });
    if (!admins.length) return;

    await this.notificaciones.insert(
      admins.map((admin) => ({
        userId: admin.id,
        semestre: datos.semestre,
        titulo: 'Nuevo Certificado de Fundación Subido',
        mensaje: `La institución del proyecto "${datos.proyectoNombre}" subió el certificado oficial para ${datos.voluntarioNombre} en la gestión ${datos.semestre}.`,
        tipo: 'CERTIFICADO_FUNDACION',
        enlaceDestino: '/certificados',
      })),
    );
  }

  async premioOtorgado(datos: {
    voluntarioId: number;
    nombrePremio: string;
    categoria?: string;
    semestre: string;
  }) {
    const cat = datos.categoria ? ` en la categoría "${datos.categoria}"` : '';
    await this.notificaciones.insert({
      userId: datos.voluntarioId,
      semestre: datos.semestre,
      titulo: '¡Felicidades por tu distinción en Catovoluntarios!',
      mensaje: `Has sido galardonado con el reconocimiento "${datos.nombrePremio}"${cat} en la gestión ${datos.semestre}. ¡Gracias por tu compromiso y vocación de servicio!`,
      tipo: 'PREMIO_OTORGADO',
      enlaceDestino: '/podio',
    });
  }

  listar(userId: number, semestre?: string) {
    return this.notificaciones.find({
      where: semestre
        ? [{ userId, semestre }, { userId, semestre: IsNull() }]
        : { userId },
      order: { leida: 'ASC', id: 'DESC' },
      take: 100,
    });
  }

  async marcarLeida(userId: number, id: number) {
    const resultado = await this.notificaciones.update({ id, userId }, { leida: true });
    if (!resultado.affected) throw new NotFoundException('Notificación no encontrada');
    return { id, leida: true };
  }

  private nombreDocumento(documento: DocumentoVoluntarioEntity) {
    const tipo = tipoDocumento[documento.tipoDocumento] ?? documento.tipoDocumento;
    return documento.nombreArchivoOriginal ? `${tipo} (${documento.nombreArchivoOriginal})` : tipo;
  }
}
