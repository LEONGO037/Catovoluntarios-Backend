import { MigrationInterface, QueryRunner } from 'typeorm';

export class Modulo02DocumentoHabilidadesGestion1795392000007 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE usuarios
        ADD COLUMN IF NOT EXISTS tipo_documento VARCHAR(20) NOT NULL DEFAULT 'CI'
    `);

    await queryRunner.query(`
      ALTER TABLE usuarios
        ALTER COLUMN ci TYPE VARCHAR(30)
    `);

    await queryRunner.query(`
      ALTER TABLE postulaciones
        ADD COLUMN IF NOT EXISTS tipo_documento VARCHAR(20) NOT NULL DEFAULT 'CI',
        ADD COLUMN IF NOT EXISTS habilidades_otras TEXT,
        ADD COLUMN IF NOT EXISTS semestre VARCHAR(20) NOT NULL DEFAULT '2/2026'
    `);

    await queryRunner.query(`
      ALTER TABLE postulaciones
        ALTER COLUMN ci TYPE VARCHAR(30)
    `);

    await queryRunner.query(`
      ALTER TABLE perfiles_voluntario
        ADD COLUMN IF NOT EXISTS habilidades_otras TEXT
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE perfiles_voluntario
        DROP COLUMN IF EXISTS habilidades_otras
    `);

    await queryRunner.query(`
      ALTER TABLE postulaciones
        DROP COLUMN IF EXISTS habilidades_otras,
        DROP COLUMN IF EXISTS tipo_documento
    `);

    await queryRunner.query(`
      ALTER TABLE usuarios
        DROP COLUMN IF EXISTS tipo_documento
    `);
  }
}
