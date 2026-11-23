import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * M06 — Asistencia, Pasajes y Portal del Catovoluntario (P-16, P-17, P-18).
 *
 * Aditiva e idempotente:
 * - registros_asistencia: tipo de actividad (presencial / no presencial / emergente),
 *   bandera `genera_pasaje` y vínculo opcional a una actividad emergente.
 * - actividades_emergentes: eventos extraordinarios habilitados por Pastoral (P-18).
 * - conciliaciones_mensuales_supervisor y liquidaciones_pasajes: se completan con las
 *   columnas que usan las entidades (semestre en texto, auditoría) y se relajan los NOT NULL
 *   de `semestre_id`, que el sistema no usa.
 */
export class ModuloAsistenciaPasajes1795392000003 implements MigrationInterface {
  name = 'ModuloAsistenciaPasajes1795392000003';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Enum de estados de asistencia (por si la base no se creó con el script SQL)
    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'estado_asistencia_enum') THEN
          CREATE TYPE "estado_asistencia_enum" AS ENUM ('REGISTRADO', 'APROBADO_CATOLIDER', 'OBSERVADO_CATOLIDER', 'CONCILIADO_PASTORAL');
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'estado_pago_pasajes_enum') THEN
          CREATE TYPE "estado_pago_pasajes_enum" AS ENUM ('PENDIENTE_FIRMA', 'FIRMADO_RECIBI_CONFORME', 'DESEMBOLSADO');
        END IF;
      END $$;
    `);

    // Normaliza valores escritos con la nomenclatura antigua de la entidad ('Registrado', etc.)
    await queryRunner.query(`
      DO $$ BEGIN
        IF EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'registros_asistencia' AND column_name = 'estado_aprobacion'
                     AND data_type = 'character varying') THEN
          UPDATE registros_asistencia SET estado_aprobacion = CASE estado_aprobacion
            WHEN 'Registrado' THEN 'REGISTRADO'
            WHEN 'Aprobado_Catolider' THEN 'APROBADO_CATOLIDER'
            WHEN 'Observado_Catolider' THEN 'OBSERVADO_CATOLIDER'
            WHEN 'Conciliado' THEN 'CONCILIADO_PASTORAL'
            ELSE estado_aprobacion END;
          ALTER TABLE registros_asistencia ALTER COLUMN estado_aprobacion DROP DEFAULT;
          ALTER TABLE registros_asistencia ALTER COLUMN estado_aprobacion
            TYPE "estado_asistencia_enum" USING estado_aprobacion::"estado_asistencia_enum";
          ALTER TABLE registros_asistencia ALTER COLUMN estado_aprobacion SET DEFAULT 'REGISTRADO';
        END IF;
      END $$;
    `);

    // Actividades emergentes (P-18)
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "actividades_emergentes" (
        "id" SERIAL PRIMARY KEY,
        "nombre" character varying(200) NOT NULL,
        "descripcion" text,
        "lugar" character varying(200),
        "fecha" date NOT NULL,
        "hora_inicio" time NOT NULL,
        "hora_fin" time NOT NULL,
        "horas_otorgadas" numeric(5,2) NOT NULL CHECK ("horas_otorgadas" > 0),
        "genera_pasaje" boolean NOT NULL DEFAULT false,
        "cupo_maximo" integer,
        "semestre" character varying(20) NOT NULL DEFAULT '2/2026',
        "activa" boolean NOT NULL DEFAULT true,
        "creado_por" integer REFERENCES usuarios(id) ON DELETE SET NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
      )
    `);

    // Registros de asistencia
    await queryRunner.query(`ALTER TABLE "registros_asistencia" ADD COLUMN IF NOT EXISTS "tipo_actividad" character varying(20) NOT NULL DEFAULT 'PRESENCIAL'`);
    await queryRunner.query(`ALTER TABLE "registros_asistencia" ADD COLUMN IF NOT EXISTS "genera_pasaje" boolean NOT NULL DEFAULT true`);
    await queryRunner.query(`ALTER TABLE "registros_asistencia" ADD COLUMN IF NOT EXISTS "id_actividad_emergente" integer REFERENCES actividades_emergentes(id) ON DELETE SET NULL`);
    await queryRunner.query(`ALTER TABLE "registros_asistencia" ADD COLUMN IF NOT EXISTS "conciliado_en_planilla" boolean NOT NULL DEFAULT false`);
    await queryRunner.query(`ALTER TABLE "registros_asistencia" ADD COLUMN IF NOT EXISTS "registrado_por_id" integer`);
    await queryRunner.query(`ALTER TABLE "registros_asistencia" ADD COLUMN IF NOT EXISTS "fecha_aprobacion" TIMESTAMP WITH TIME ZONE`);
    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_asistencia_tipo_actividad') THEN
          ALTER TABLE registros_asistencia ADD CONSTRAINT chk_asistencia_tipo_actividad
            CHECK (tipo_actividad IN ('PRESENCIAL', 'NO_PRESENCIAL', 'EMERGENTE'));
        END IF;
      END $$;
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_asistencia_asignacion_fecha" ON "registros_asistencia" ("id_asignacion", "fecha")`);
    // Un voluntario no puede participar dos veces en la misma actividad emergente
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "uq_asistencia_emergente"
        ON "registros_asistencia" ("id_asignacion", "id_actividad_emergente")
        WHERE "id_actividad_emergente" IS NOT NULL
    `);

    // Conciliaciones mensuales (P-16, cierre de mes)
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "conciliaciones_mensuales_supervisor" (
        "id" SERIAL PRIMARY KEY,
        "proyecto_id" integer NOT NULL REFERENCES proyectos_receptores(id) ON DELETE CASCADE,
        "mes" integer NOT NULL CHECK ("mes" BETWEEN 1 AND 12),
        "anio" integer NOT NULL CHECK ("anio" >= 2020),
        "reporte_firmas_supervisor_url" character varying(1000),
        "total_voluntarios_reportados" integer NOT NULL DEFAULT 0,
        "total_dias_asistidos" integer NOT NULL DEFAULT 0,
        "monto_total_pasajes" numeric(10,2) NOT NULL DEFAULT 0,
        "conciliado_por" integer REFERENCES usuarios(id) ON DELETE SET NULL,
        "fecha_conciliacion" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`ALTER TABLE "conciliaciones_mensuales_supervisor" ADD COLUMN IF NOT EXISTS "semestre" character varying(20) NOT NULL DEFAULT '2/2026'`);
    await queryRunner.query(`ALTER TABLE "conciliaciones_mensuales_supervisor" ADD COLUMN IF NOT EXISTS "observaciones" text`);
    await queryRunner.query(`ALTER TABLE "conciliaciones_mensuales_supervisor" ADD COLUMN IF NOT EXISTS "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`);
    await queryRunner.query(`ALTER TABLE "conciliaciones_mensuales_supervisor" ADD COLUMN IF NOT EXISTS "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`);
    await this.relajarNotNull(queryRunner, 'conciliaciones_mensuales_supervisor', 'semestre_id');
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "uq_conciliacion_proyecto_mes"
        ON "conciliaciones_mensuales_supervisor" ("proyecto_id", "mes", "anio")
    `);

    // Liquidaciones de pasajes (P-17, snapshot inmutable tras conciliar — RNF-06)
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "liquidaciones_pasajes" (
        "id" SERIAL PRIMARY KEY,
        "id_asignacion" integer NOT NULL REFERENCES asignaciones_ubicacion(id) ON DELETE CASCADE,
        "mes" integer NOT NULL CHECK ("mes" BETWEEN 1 AND 12),
        "anio" integer NOT NULL CHECK ("anio" >= 2020),
        "dias_presenciales_asistidos" integer NOT NULL DEFAULT 0,
        "tarifa_diaria_aplicada" numeric(10,2) NOT NULL,
        "monto_total_reponer" numeric(10,2) NOT NULL,
        "estado_pago" "estado_pago_pasajes_enum" NOT NULL DEFAULT 'PENDIENTE_FIRMA',
        "fecha_pago" date,
        "recibi_conforme_firmado_url" character varying(1000),
        CONSTRAINT "uq_liquidacion_asignacion_mes_anio" UNIQUE ("id_asignacion", "mes", "anio")
      )
    `);
    await queryRunner.query(`ALTER TABLE "liquidaciones_pasajes" ADD COLUMN IF NOT EXISTS "horas_presenciales" numeric(6,2) NOT NULL DEFAULT 0`);
    await queryRunner.query(`ALTER TABLE "liquidaciones_pasajes" ADD COLUMN IF NOT EXISTS "id_conciliacion" integer REFERENCES conciliaciones_mensuales_supervisor(id) ON DELETE SET NULL`);
    await queryRunner.query(`ALTER TABLE "liquidaciones_pasajes" ADD COLUMN IF NOT EXISTS "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`);
    await queryRunner.query(`ALTER TABLE "liquidaciones_pasajes" ADD COLUMN IF NOT EXISTS "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`);
  }

  public async down(): Promise<void> {
    // Aditiva: no se revierte para no perder asistencias ni planillas ya conciliadas.
  }

  private async relajarNotNull(queryRunner: QueryRunner, tabla: string, columna: string): Promise<void> {
    await queryRunner.query(`
      DO $$ BEGIN
        IF EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema = 'public' AND table_name = '${tabla}' AND column_name = '${columna}') THEN
          ALTER TABLE "${tabla}" ALTER COLUMN "${columna}" DROP NOT NULL;
        END IF;
      END $$;
    `);
  }
}
