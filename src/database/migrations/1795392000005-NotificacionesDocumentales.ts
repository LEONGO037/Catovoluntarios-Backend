import { MigrationInterface, QueryRunner } from 'typeorm';

export class NotificacionesDocumentales1795392000005 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS notificaciones_sistema (
        id SERIAL PRIMARY KEY,
        user_id INT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
        titulo VARCHAR(150) NOT NULL,
        mensaje TEXT NOT NULL,
        tipo VARCHAR(50) NOT NULL DEFAULT 'INFO',
        leida BOOLEAN NOT NULL DEFAULT FALSE,
        enlace_destino VARCHAR(255),
        fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await queryRunner.query(`
      ALTER TABLE notificaciones_sistema
        ADD COLUMN IF NOT EXISTS semestre VARCHAR(20),
        ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_notificaciones_usuario_gestion
        ON notificaciones_sistema (user_id, semestre, id)
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX IF EXISTS idx_notificaciones_usuario_gestion');
    await queryRunner.query(`
      ALTER TABLE notificaciones_sistema
        DROP COLUMN IF EXISTS semestre,
        DROP COLUMN IF EXISTS updated_at
    `);
  }
}
