import { MigrationInterface, QueryRunner } from 'typeorm';

export class EnvioYValidacionDocumental1795392000004 implements MigrationInterface {
  name = 'EnvioYValidacionDocumental1795392000004';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema = current_schema() AND table_name = 'documentos_voluntario'
            AND column_name = 'observaciones_validacion'
        ) AND NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema = current_schema() AND table_name = 'documentos_voluntario'
            AND column_name = 'observacion_detalle'
        ) THEN
          ALTER TABLE documentos_voluntario RENAME COLUMN observaciones_validacion TO observacion_detalle;
        END IF;
        ALTER TABLE documentos_voluntario ADD COLUMN IF NOT EXISTS observacion_detalle text;
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema = current_schema() AND table_name = 'documentos_voluntario'
            AND column_name = 'enviado_revision_en'
        ) THEN
          ALTER TABLE documentos_voluntario ADD COLUMN enviado_revision_en timestamp with time zone;
          -- Los documentos previos se listaban en la bandeja inmediatamente al cargarse.
          UPDATE documentos_voluntario SET enviado_revision_en = coalesce(fecha_validacion, created_at);
        END IF;
      END $$;
      CREATE INDEX IF NOT EXISTS idx_documentos_usuario_gestion_tipo
        ON documentos_voluntario (user_id, semestre, tipo_documento);
      CREATE INDEX IF NOT EXISTS idx_documentos_gestion_envio
        ON documentos_voluntario (semestre, enviado_revision_en);
    `);

    for (const tabla of ['documentos_voluntario', 'sesiones_induccion']) {
      if (await queryRunner.hasColumn(tabla, 'semestre_id')) {
        await queryRunner.query(`
          UPDATE ${tabla} AS registro
          SET semestre = substring(gestion.nombre FROM '[12]/[0-9]{4}')
          FROM semestres AS gestion
          WHERE registro.semestre_id = gestion.id
            AND registro.semestre = '2/2026'
            AND substring(gestion.nombre FROM '[12]/[0-9]{4}') <> registro.semestre
        `);
      }
    }

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint
          WHERE conname = 'ck_documento_motivo_veredicto' AND conrelid = 'documentos_voluntario'::regclass
        ) THEN
          -- NOT VALID conserva los veredictos históricos emitidos bajo las reglas anteriores.
          ALTER TABLE documentos_voluntario
            ADD CONSTRAINT ck_documento_motivo_veredicto CHECK (
              estado NOT IN ('OBSERVADO', 'RECHAZADO')
              OR (observacion_detalle IS NOT NULL AND observacion_detalle ~ '[^[:space:]]')
            ) NOT VALID;
        END IF;
      END $$;
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS idx_documentos_gestion_envio;
      DROP INDEX IF EXISTS idx_documentos_usuario_gestion_tipo;
      ALTER TABLE documentos_voluntario DROP CONSTRAINT IF EXISTS ck_documento_motivo_veredicto;
      ALTER TABLE documentos_voluntario DROP COLUMN IF EXISTS enviado_revision_en;
      ALTER TABLE documentos_voluntario RENAME COLUMN observacion_detalle TO observaciones_validacion;
    `);
  }
}
