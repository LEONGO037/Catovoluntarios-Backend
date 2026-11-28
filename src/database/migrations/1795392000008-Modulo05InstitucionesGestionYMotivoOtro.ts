import { MigrationInterface, QueryRunner } from 'typeorm';

export class Modulo05InstitucionesGestionYMotivoOtro1795392000008 implements MigrationInterface {
  name = 'Modulo05InstitucionesGestionYMotivoOtro1795392000008';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "instituciones" (
        "id" SERIAL NOT NULL,
        "nombre" character varying(200) NOT NULL,
        "direccion_exacta" character varying(255) NOT NULL DEFAULT '',
        "macrodistrito_zona" character varying(100) NOT NULL DEFAULT 'Centro',
        "nombre_supervisor_centro" character varying(150) NOT NULL DEFAULT 'Supervisor Asignado',
        "telefono_contacto" character varying(30) NOT NULL DEFAULT '70000000',
        "correo" character varying(150) DEFAULT 'centro@pastoral.ucb.edu.bo',
        "fecha_inicio_convenio" date,
        "fecha_fin_convenio" date,
        "activo" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_instituciones" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_instituciones_nombre" ON "instituciones" (LOWER("nombre"))`,
    );

    await queryRunner.query(
      `ALTER TABLE "proyectos_receptores" ADD COLUMN IF NOT EXISTS "id_institucion" integer`,
    );
    await queryRunner.query(
      `ALTER TABLE "proyectos_receptores" ADD COLUMN IF NOT EXISTS "semestre" character varying(20) NOT NULL DEFAULT '2/2026'`,
    );

    await queryRunner.query(`
      INSERT INTO "instituciones" (
        "nombre",
        "direccion_exacta",
        "macrodistrito_zona",
        "nombre_supervisor_centro",
        "telefono_contacto",
        "correo",
        "fecha_inicio_convenio",
        "fecha_fin_convenio",
        "activo"
      )
      SELECT DISTINCT ON (LOWER(p."nombre_proyecto"))
        p."nombre_proyecto",
        COALESCE(p."direccion_exacta", ''),
        COALESCE(p."macrodistrito_zona", 'Centro'),
        COALESCE(p."supervisor_nombre", 'Supervisor Asignado'),
        COALESCE(p."supervisor_telefono", '70000000'),
        COALESCE(p."correo", 'centro@pastoral.ucb.edu.bo'),
        p."fecha_inicio_convenio",
        p."fecha_fin_convenio",
        COALESCE(p."activo", true)
      FROM "proyectos_receptores" p
      WHERE NOT EXISTS (
        SELECT 1 FROM "instituciones" i WHERE LOWER(i."nombre") = LOWER(p."nombre_proyecto")
      )
    `);

    await queryRunner.query(`
      UPDATE "proyectos_receptores" p
      SET "id_institucion" = i."id"
      FROM "instituciones" i
      WHERE p."id_institucion" IS NULL
        AND LOWER(i."nombre") = LOWER(p."nombre_proyecto")
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'FK_proyectos_institucion'
        ) THEN
          ALTER TABLE "proyectos_receptores"
            ADD CONSTRAINT "FK_proyectos_institucion"
            FOREIGN KEY ("id_institucion") REFERENCES "instituciones"("id")
            ON DELETE RESTRICT;
        END IF;
      END $$;
    `);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_proyectos_institucion_semestre" ON "proyectos_receptores" ("id_institucion", "semestre")`,
    );

    await queryRunner.query(`
      DO $$ BEGIN
        IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'motivo_traslado_enum') THEN
          ALTER TYPE "motivo_traslado_enum" ADD VALUE IF NOT EXISTS 'Otro';
        END IF;
      END $$;
    `);

    await queryRunner.query(
      `ALTER TABLE "historial_reasignaciones" ADD COLUMN IF NOT EXISTS "motivo_otro_detalle" text`,
    );
    await queryRunner.query(
      `ALTER TABLE "historial_reasignaciones" ADD COLUMN IF NOT EXISTS "semestre" character varying(20) NOT NULL DEFAULT '2/2026'`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_historial_reasig_semestre" ON "historial_reasignaciones" ("semestre")`,
    );

    await queryRunner.query(
      `ALTER TABLE "notificaciones_movimiento" ADD COLUMN IF NOT EXISTS "semestre" character varying(20) NOT NULL DEFAULT '2/2026'`,
    );
    await queryRunner.query(
      `ALTER TABLE "notificaciones_movimiento" ADD COLUMN IF NOT EXISTS "motivo_traslado" character varying(100)`,
    );
    await queryRunner.query(
      `ALTER TABLE "notificaciones_movimiento" ADD COLUMN IF NOT EXISTS "motivo_otro_detalle" text`,
    );

    await queryRunner.query(`
      DO $$ BEGIN
        IF EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'uq_asignacion_usuario_semestre'
        ) THEN
          ALTER TABLE "asignaciones_ubicacion" DROP CONSTRAINT "uq_asignacion_usuario_semestre";
        END IF;
      END $$;
    `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "uq_asignacion_activa_usuario_semestre" ON "asignaciones_ubicacion" ("id_usuario", "semestre") WHERE estado = 'Activo' AND activo = true`,
    );
  }

  public async down(): Promise<void> {
    // Migracion aditiva e idempotente para preservar datos institucionales e historicos.
  }
}
