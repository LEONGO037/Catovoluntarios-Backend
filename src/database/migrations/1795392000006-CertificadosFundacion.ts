import { MigrationInterface, QueryRunner } from 'typeorm';

export class CertificadosFundacion1795392000006 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS certificados_fundacion (
        id SERIAL PRIMARY KEY,
        id_proyecto INT NOT NULL REFERENCES proyectos_receptores(id) ON DELETE CASCADE,
        id_usuario INT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
        semestre VARCHAR(20) NOT NULL DEFAULT '2/2026',
        url_pdf VARCHAR(1000) NOT NULL,
        nombre_archivo VARCHAR(255) NOT NULL,
        subido_por INT REFERENCES usuarios(id) ON DELETE SET NULL,
        observaciones TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT uq_certificado_fundacion_proyecto_usuario_semestre UNIQUE (id_proyecto, id_usuario, semestre)
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_certificados_fundacion_proyecto_semestre
        ON certificados_fundacion (id_proyecto, semestre)
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_certificados_fundacion_usuario
        ON certificados_fundacion (id_usuario)
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX IF EXISTS idx_certificados_fundacion_usuario');
    await queryRunner.query('DROP INDEX IF EXISTS idx_certificados_fundacion_proyecto_semestre');
    await queryRunner.query('DROP TABLE IF EXISTS certificados_fundacion CASCADE');
  }
}
