import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Alinea el esquema creado con `schema-and-seeds.sql` con las entidades TypeORM actuales.
 *
 * Es 100 % aditiva e idempotente: solo agrega columnas, tablas y valores de enum que falten,
 * relaja NOT NULL de columnas que el código ya no llena y convierte a JSONB las columnas que
 * las entidades guardan como JSON. Puede ejecutarse sobre una base nueva o sobre una base que
 * ya tenga estos cambios (por ejemplo, creada con `synchronize`): en ese caso no hace nada.
 * No borra columnas, tablas ni datos.
 */
export class AlinearEsquemaConEntidades1795392000002 implements MigrationInterface {
  name = 'AlinearEsquemaConEntidades1795392000002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Tipos enum nuevos que usan las entidades
    await this.crearEnum(queryRunner, 'asignaciones_ubicacion_estado_enum', ['Activo', 'Reasignado', 'Retirado']);
    await this.crearEnum(queryRunner, 'asistencias_induccion_estado_induccion_enum', [
      'COMPLETADA', 'EN_PROCESO', 'PENDIENTE', 'REPROGRAMAR',
    ]);
    await this.crearEnum(queryRunner, 'notificaciones_movimiento_tipo_notificacion_enum', [
      'ALTA_UBICACION', 'BAJA_UBICACION', 'BAJA_CATOLIDER', 'ALTA_CATOLIDER', 'REASIGNACION_VOLUNTARIO',
    ]);
    await this.crearEnum(queryRunner, 'motivo_traslado_enum', [
      'CRUCE_MATERIAS_UNIVERSITARIAS',
      'DIFICULTAD_TRANSPORTE_DISTANCIA',
      'SOLICITUD_SUPERVISOR_CENTRO',
      'INCOMPATIBILIDAD_PERFIL',
      'OTRO_JUSTIFICADO',
    ]);

    // 2. Valores de enum que el formulario de postulación envía y el script SQL no tenía
    for (const tipo of ['tipo_relacion_ucb_enum', 'postulaciones_tipo_relacion_ucb_enum']) {
      for (const valor of ['Familiar de personal UCB', 'Externo autorizado']) {
        await queryRunner.query(`
          DO $$ BEGIN
            IF EXISTS (SELECT 1 FROM pg_type WHERE typname = '${tipo}') THEN
              ALTER TYPE "${tipo}" ADD VALUE IF NOT EXISTS '${valor}';
            END IF;
          END $$;
        `);
      }
    }

    // 3. Columnas que faltan (timestamps de auditoría, semestre y campos de negocio)
    const tablasConTimestamps = [
      'postulaciones', 'proyectos_receptores', 'reportes_semaforo', 'asignaciones_ubicacion',
      'registros_asistencia', 'sesiones_induccion', 'asistencias_induccion', 'documentos_voluntario',
      'evaluaciones_proyectos_receptores', 'premios_historicos',
    ];
    for (const tabla of tablasConTimestamps) {
      await this.agregarColumna(queryRunner, tabla, 'created_at', 'TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()');
      await this.agregarColumna(queryRunner, tabla, 'updated_at', 'TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()');
    }
    for (const tabla of [
      'postulaciones', 'asignaciones_ubicacion', 'sesiones_induccion', 'documentos_voluntario',
      'evaluaciones_proyectos_receptores', 'premios_historicos',
    ]) {
      await this.agregarColumna(queryRunner, tabla, 'semestre', `character varying(20) NOT NULL DEFAULT '2/2026'`);
    }

    const columnas: [string, string, string][] = [
      ['postulaciones', 'nombres', 'character varying(100)'],
      ['postulaciones', 'primer_apellido', 'character varying(100)'],
      ['postulaciones', 'segundo_apellido', 'character varying(100)'],
      ['postulaciones', 'ci', 'character varying(20)'],
      ['postulaciones', 'complemento', 'character varying(10)'],
      ['postulaciones', 'expedido', `character varying(10) NOT NULL DEFAULT 'LP'`],
      ['postulaciones', 'celular', 'character varying(20)'],
      ['postulaciones', 'correo_electronico', 'character varying(150)'],
      ['postulaciones', 'experiencia_voluntariado_previa', 'boolean NOT NULL DEFAULT false'],
      ['postulaciones', 'habilidades_destacadas', `jsonb DEFAULT '[]'`],
      ['postulaciones', 'conocimiento_computacion', 'boolean NOT NULL DEFAULT false'],
      ['postulaciones', 'requiere_autorizacion_padres', 'boolean NOT NULL DEFAULT false'],
      ['postulaciones', 'autorizacion_padres_confirmada', 'boolean NOT NULL DEFAULT false'],
      ['postulaciones', 'compromiso_aceptado', 'boolean NOT NULL DEFAULT true'],
      ['proyectos_receptores', 'correo', `character varying(150) DEFAULT 'centro@pastoral.ucb.edu.bo'`],
      ['asignaciones_ubicacion', 'estado', `"asignaciones_ubicacion_estado_enum" NOT NULL DEFAULT 'Activo'`],
      ['sesiones_induccion', 'proyecto_id', 'integer'],
      ['asistencias_induccion', 'fecha_charla', 'date'],
      ['asistencias_induccion', 'recorrido_sitio', 'character varying(100)'],
      ['asistencias_induccion', 'estado_induccion', `"asistencias_induccion_estado_induccion_enum" NOT NULL DEFAULT 'PENDIENTE'`],
      ['asistencias_induccion', 'observaciones', 'text'],
      ['documentos_voluntario', 'id_poliza', 'character varying(50)'],
      ['documentos_voluntario', 'numero_certificado', 'character varying(50)'],
      ['documentos_voluntario', 'asegurado', 'character varying(150)'],
    ];
    for (const [tabla, columna, definicion] of columnas) {
      await this.agregarColumna(queryRunner, tabla, columna, definicion);
    }

    // 4. Columnas que el código ya no llena: quitar NOT NULL para que los INSERT no fallen
    const relajar: [string, string][] = [
      ['postulaciones', 'semestre_id'],
      ['postulaciones', 'user_id'],
      ['postulaciones', 'poblaciones_interes'],
      ['asignaciones_ubicacion', 'semestre_id'],
      ['documentos_voluntario', 'semestre_id'],
      ['evaluaciones_proyectos_receptores', 'semestre_id'],
      ['sesiones_induccion', 'semestre_id'],
      ['premios_historicos', 'semestre_id'],
      ['registros_asistencia', 'tareas_realizadas'],
    ];
    for (const [tabla, columna] of relajar) {
      await queryRunner.query(`
        DO $$ BEGIN
          IF EXISTS (SELECT 1 FROM information_schema.columns
                     WHERE table_schema = 'public' AND table_name = '${tabla}' AND column_name = '${columna}') THEN
            ALTER TABLE "${tabla}" ALTER COLUMN "${columna}" DROP NOT NULL;
          END IF;
        END $$;
      `);
    }

    // 5. Columnas que las entidades guardan como JSON (arreglos) pero el script creó como texto
    for (const columna of ['tres_palabras_personalidad', 'poblaciones_interes']) {
      await queryRunner.query(`
        DO $$ BEGIN
          IF EXISTS (SELECT 1 FROM information_schema.columns
                     WHERE table_schema = 'public' AND table_name = 'postulaciones'
                       AND column_name = '${columna}' AND data_type NOT IN ('jsonb', 'json')) THEN
            ALTER TABLE "postulaciones" ALTER COLUMN "${columna}" DROP DEFAULT;
            ALTER TABLE "postulaciones" ALTER COLUMN "${columna}" TYPE jsonb USING (
              CASE
                WHEN "${columna}" IS NULL OR btrim("${columna}") = '' THEN '[]'::jsonb
                WHEN btrim("${columna}") LIKE '[%' THEN "${columna}"::jsonb
                ELSE to_jsonb(regexp_split_to_array(btrim("${columna}"), '\\s*[,;]\\s*'))
              END
            );
            ALTER TABLE "postulaciones" ALTER COLUMN "${columna}" SET DEFAULT '[]'::jsonb;
          END IF;
        END $$;
      `);
    }

    // 6. Tablas del módulo de ubicación (P-14 / P-15) que el script SQL no crea
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "historial_reasignaciones" (
        "id_historial" SERIAL NOT NULL,
        "id_asignacion" integer NOT NULL,
        "id_usuario" integer NOT NULL,
        "id_proyecto_origen" integer NOT NULL,
        "id_proyecto_destino" integer NOT NULL,
        "motivo_traslado" "motivo_traslado_enum" NOT NULL,
        "fecha_efectiva" TIMESTAMP WITH TIME ZONE NOT NULL,
        "observaciones" text,
        "registrado_por_id" integer,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_historial_reasignaciones" PRIMARY KEY ("id_historial")
      )
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "notificaciones_movimiento" (
        "id_notificacion" SERIAL NOT NULL,
        "id_usuario_destinatario" integer NOT NULL,
        "rol_destinatario" character varying(50) NOT NULL,
        "tipo_notificacion" "notificaciones_movimiento_tipo_notificacion_enum" NOT NULL,
        "id_asignacion" integer,
        "id_proyecto" integer,
        "titulo" character varying(200) NOT NULL,
        "mensaje" text NOT NULL,
        "leido" boolean NOT NULL DEFAULT false,
        "fecha_envio" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_notificaciones_movimiento" PRIMARY KEY ("id_notificacion")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_notif_mov_destinatario" ON "notificaciones_movimiento" ("id_usuario_destinatario", "leido")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_historial_reasig_asignacion" ON "historial_reasignaciones" ("id_asignacion")`,
    );
  }

  public async down(): Promise<void> {
    // Migración aditiva: revertirla podría borrar datos reales de postulantes y asistencias.
    // Se deja sin efecto a propósito.
  }

  private async crearEnum(queryRunner: QueryRunner, nombre: string, valores: string[]): Promise<void> {
    const lista = valores.map((v) => `'${v.replace(/'/g, "''")}'`).join(', ');
    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = '${nombre}') THEN
          CREATE TYPE "${nombre}" AS ENUM (${lista});
        END IF;
      END $$;
    `);
  }

  private async agregarColumna(
    queryRunner: QueryRunner,
    tabla: string,
    columna: string,
    definicion: string,
  ): Promise<void> {
    await queryRunner.query(`ALTER TABLE "${tabla}" ADD COLUMN IF NOT EXISTS "${columna}" ${definicion}`);
  }
}
