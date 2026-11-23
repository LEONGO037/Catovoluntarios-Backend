import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * M03 (P-07, P-08, P-09) — Ajustes sobre init.sql requeridos por la ficha de
 * entrevista y la evaluación psicológica E-SRE.
 *
 * 1. entrevistas: columnas del Bloque 2 (manejo de transporte, tiempo semanal)
 *    y horarios del postulante definidos en la entrevista.
 * 2. evaluaciones_psicologicas.poblaciones_sugeridas: de TEXT libre a un arreglo
 *    de un ENUM cerrado, obligatorio (mínimo 1) e indexado con GIN para que el
 *    módulo de Ubicación de Voluntarios (P-14) pueda consultarlo con ANY / @>.
 */
export class M03EntrevistasYPoblaciones1795392000000 implements MigrationInterface {
  name = 'M03EntrevistasYPoblaciones1795392000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE entrevistas
        ADD COLUMN manejo_transporte TEXT,
        ADD COLUMN tiempo_semanal TEXT,
        ADD COLUMN horarios_disponibles JSONB
    `);

    await queryRunner.query(`
      CREATE TYPE poblacion_sugerida_enum AS ENUM (
        'NINEZ_PRIMERA_INFANCIA',
        'ADULTOS_MAYORES',
        'SITUACION_CALLE_ADICCIONES',
        'DISCAPACIDAD',
        'SALUD_HOSPITALES',
        'CUIDADO_ANIMAL_MEDIO_AMBIENTE'
      )
    `);

    // Falla a propósito si ya existieran filas con texto libre que no coincida
    // con los códigos: así no se pierde información en silencio.
    await queryRunner.query(`
      ALTER TABLE evaluaciones_psicologicas
        ALTER COLUMN poblaciones_sugeridas TYPE poblacion_sugerida_enum[]
        USING string_to_array(poblaciones_sugeridas, ';')::poblacion_sugerida_enum[]
    `);

    await queryRunner.query(`
      ALTER TABLE evaluaciones_psicologicas
        ADD CONSTRAINT chk_eval_poblaciones_minimo
        CHECK (cardinality(poblaciones_sugeridas) >= 1)
    `);

    await queryRunner.query(`
      CREATE INDEX idx_eval_poblaciones_sugeridas
        ON evaluaciones_psicologicas USING GIN (poblaciones_sugeridas)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS idx_eval_poblaciones_sugeridas`);
    await queryRunner.query(`
      ALTER TABLE evaluaciones_psicologicas
        DROP CONSTRAINT IF EXISTS chk_eval_poblaciones_minimo
    `);
    await queryRunner.query(`
      ALTER TABLE evaluaciones_psicologicas
        ALTER COLUMN poblaciones_sugeridas TYPE TEXT
        USING array_to_string(poblaciones_sugeridas, ';')
    `);
    await queryRunner.query(`DROP TYPE IF EXISTS poblacion_sugerida_enum`);
    await queryRunner.query(`
      ALTER TABLE entrevistas
        DROP COLUMN IF EXISTS horarios_disponibles,
        DROP COLUMN IF EXISTS tiempo_semanal,
        DROP COLUMN IF EXISTS manejo_transporte
    `);
  }
}
