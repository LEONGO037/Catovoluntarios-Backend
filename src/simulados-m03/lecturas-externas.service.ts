/**
 * ⚠ TEMPORAL (M03) — Reemplazar al integrar.
 *
 * Lecturas de solo-lectura sobre tablas que NO pertenecen a M03
 * (usuarios, postulaciones, semestres, catolideres_semestre, proyectos_receptores).
 * Se usan consultas SQL directas porque las entidades actuales de M01/M02/M05
 * no coinciden aún con init.sql. Al integrar, sustituir por los servicios de
 * UsersModule (M01), PostulacionesModule (M02) y ProyectosModule (M05).
 */
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

export interface PostulanteResumen {
  postulacionId: number;
  userId: number;
  codigoPostulacion: string;
  nombreCompleto: string;
  ci: string;
  carrera: string;
  edad: number;
  estadoPostulacion: string;
}

export interface CatoliderActivo {
  userId: number;
  nombreCompleto: string;
}

export interface ProyectoReceptorOpcion {
  id: number;
  nombreProyecto: string;
}

interface FilaPostulante {
  postulacion_id: number;
  user_id: number;
  codigo_postulacion: string;
  nombre_completo: string;
  ci: string;
  carrera: string;
  edad: number;
  estado_postulacion: string;
}

const SELECT_POSTULANTE = `
  SELECT p.id AS postulacion_id,
         p.user_id,
         p.codigo_postulacion,
         concat_ws(' ', u.nombres, u.primer_apellido, u.segundo_apellido) AS nombre_completo,
         u.ci,
         p.carrera,
         date_part('year', age(current_date, p.fecha_nacimiento))::int AS edad,
         p.estado_postulacion::text AS estado_postulacion
    FROM postulaciones p
    JOIN usuarios u ON u.id = p.user_id
`;

function aPostulante(f: FilaPostulante): PostulanteResumen {
  return {
    postulacionId: f.postulacion_id,
    userId: f.user_id,
    codigoPostulacion: f.codigo_postulacion,
    nombreCompleto: f.nombre_completo,
    ci: f.ci,
    carrera: f.carrera,
    edad: f.edad,
    estadoPostulacion: f.estado_postulacion,
  };
}

@Injectable()
export class LecturasExternasService {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async obtenerSemestreActivoId(): Promise<number> {
    const filas: { id: number }[] = await this.dataSource.query(
      `SELECT id FROM semestres WHERE activo = TRUE ORDER BY fecha_inicio DESC LIMIT 1`,
    );
    if (filas.length === 0) {
      throw new NotFoundException('No hay un semestre activo configurado');
    }
    return filas[0].id;
  }

  async obtenerPostulacionActivaDeUsuario(userId: number): Promise<PostulanteResumen | null> {
    const semestreId = await this.obtenerSemestreActivoId();
    const filas: FilaPostulante[] = await this.dataSource.query(
      `${SELECT_POSTULANTE} WHERE p.user_id = $1 AND p.semestre_id = $2 LIMIT 1`,
      [userId, semestreId],
    );
    return filas.length > 0 ? aPostulante(filas[0]) : null;
  }

  async obtenerPostulante(postulacionId: number): Promise<PostulanteResumen> {
    const filas: FilaPostulante[] = await this.dataSource.query(
      `${SELECT_POSTULANTE} WHERE p.id = $1`,
      [postulacionId],
    );
    if (filas.length === 0) {
      throw new NotFoundException(`Postulación ${postulacionId} no encontrada`);
    }
    return aPostulante(filas[0]);
  }

  async obtenerPostulantes(postulacionIds: number[]): Promise<Map<number, PostulanteResumen>> {
    const mapa = new Map<number, PostulanteResumen>();
    if (postulacionIds.length === 0) return mapa;
    const filas: FilaPostulante[] = await this.dataSource.query(
      `${SELECT_POSTULANTE} WHERE p.id = ANY($1::int[])`,
      [postulacionIds],
    );
    filas.forEach((f) => mapa.set(f.postulacion_id, aPostulante(f)));
    return mapa;
  }

  /** Catolíderes activos del semestre activo (tabla catolideres_semestre o fallback a usuarios). */
  async listarCatoliderActivos(): Promise<CatoliderActivo[]> {
    const semestreId = await this.obtenerSemestreActivoId();
    let filas: { user_id: number; nombre_completo: string }[] = await this.dataSource.query(
      `SELECT u.id AS user_id,
              concat_ws(' ', u.nombres, u.primer_apellido, u.segundo_apellido) AS nombre_completo
         FROM catolideres_semestre cs
         JOIN usuarios u ON u.id = cs.user_id
        WHERE cs.semestre_id = $1 AND cs.activo = TRUE
          AND u.activo = TRUE AND u.rol = 'CATOLIDER'
        ORDER BY u.id`,
      [semestreId],
    );
    if (filas.length === 0) {
      filas = await this.dataSource.query(
        `SELECT u.id AS user_id,
                concat_ws(' ', u.nombres, u.primer_apellido, u.segundo_apellido) AS nombre_completo
           FROM usuarios u
          WHERE u.activo = TRUE AND (u.rol = 'CATOLIDER' OR u.es_catolider_vigente = TRUE)
          ORDER BY u.id`,
      );
    }
    if (filas.length === 0) {
      filas = await this.dataSource.query(
        `SELECT u.id AS user_id,
                concat_ws(' ', u.nombres, u.primer_apellido, u.segundo_apellido) AS nombre_completo
           FROM usuarios u
          WHERE u.activo = TRUE AND u.rol = 'ADMIN_PASTORAL'
          ORDER BY u.id`,
      );
    }
    return filas.map((f) => ({ userId: f.user_id, nombreCompleto: f.nombre_completo }));
  }

  async obtenerNombresUsuarios(ids: number[]): Promise<Map<number, string>> {
    const mapa = new Map<number, string>();
    if (ids.length === 0) return mapa;
    const filas: { id: number; nombre_completo: string }[] = await this.dataSource.query(
      `SELECT id, concat_ws(' ', nombres, primer_apellido, segundo_apellido) AS nombre_completo
         FROM usuarios WHERE id = ANY($1::int[])`,
      [ids],
    );
    filas.forEach((f) => mapa.set(f.id, f.nombre_completo));
    return mapa;
  }

  async listarProyectosReceptores(): Promise<ProyectoReceptorOpcion[]> {
    const filas: { id: number; nombre_proyecto: string }[] = await this.dataSource.query(
      `SELECT id, nombre_proyecto FROM proyectos_receptores WHERE activo = TRUE ORDER BY nombre_proyecto`,
    );
    return filas.map((f) => ({ id: f.id, nombreProyecto: f.nombre_proyecto }));
  }

  async obtenerProyectoReceptor(id: number): Promise<ProyectoReceptorOpcion | null> {
    const filas: { id: number; nombre_proyecto: string }[] = await this.dataSource.query(
      `SELECT id, nombre_proyecto FROM proyectos_receptores WHERE id = $1 AND activo = TRUE`,
      [id],
    );
    return filas.length > 0 ? { id: filas[0].id, nombreProyecto: filas[0].nombre_proyecto } : null;
  }
}
