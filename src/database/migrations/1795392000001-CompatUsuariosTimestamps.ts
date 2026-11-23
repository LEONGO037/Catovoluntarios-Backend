import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * COMPATIBILIDAD M01 ⇄ init.sql (pendiente de validar por el responsable de M01).
 *
 * UserEntity extiende BaseEntity (created_at / updated_at), pero la tabla
 * `usuarios` de init.sql no tiene esas columnas, por lo que el login
 * (POST /api/auth/login) falla con "column does not exist".
 * Se agregan de forma idempotente para poder autenticar en P-07, P-08 y P-09.
 */
export class CompatUsuariosTimestamps1795392000001 implements MigrationInterface {
  name = 'CompatUsuariosTimestamps1795392000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE usuarios
        ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
        ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE usuarios
        DROP COLUMN IF EXISTS updated_at,
        DROP COLUMN IF EXISTS created_at
    `);
  }
}
