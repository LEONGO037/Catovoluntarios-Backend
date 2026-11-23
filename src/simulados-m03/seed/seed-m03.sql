-- ====================================================================
-- ⚠ TEMPORAL (M03) — DATOS DE PRUEBA SOLO PARA DESARROLLO LOCAL
-- Ejecutar DESPUÉS de init.sql y de `npm run migration:run`.
-- Todos los datos son ficticios. Contraseña de todos: Password123!
-- No es una migración: no ejecutar en bases compartidas ni en producción.
-- ====================================================================
BEGIN;

INSERT INTO semestres (id, nombre, fecha_inicio, fecha_fin, activo)
VALUES (1, 'Semestre de Prueba M03', DATE '2026-08-01', DATE '2026-12-31', TRUE);

INSERT INTO usuarios (id, ci, email, password_hash, nombres, primer_apellido, segundo_apellido, rol, carrera)
VALUES
  (1, '1000001', 'admin.m03@example.com',      crypt('Password123!', gen_salt('bf', 10)), 'Admin',      'Prueba',     NULL,   'ADMIN_PASTORAL', NULL),
  (2, '1000002', 'catolider1.m03@example.com', crypt('Password123!', gen_salt('bf', 10)), 'Catolíder',  'Prueba Uno', NULL,   'CATOLIDER',      'Ingeniería de Sistemas'),
  (3, '1000003', 'catolider2.m03@example.com', crypt('Password123!', gen_salt('bf', 10)), 'Catolíder',  'Prueba Dos', NULL,   'CATOLIDER',      'Psicología'),
  (4, '1000004', 'postulante1.m03@example.com',crypt('Password123!', gen_salt('bf', 10)), 'Postulante', 'Prueba Uno', 'Test', 'POSTULANTE',     'Medicina'),
  (5, '1000005', 'postulante2.m03@example.com',crypt('Password123!', gen_salt('bf', 10)), 'Postulante', 'Prueba Dos', 'Test', 'POSTULANTE',     'Derecho'),
  (6, '1000006', 'postulante3.m03@example.com',crypt('Password123!', gen_salt('bf', 10)), 'Postulante', 'Prueba Tres','Test', 'POSTULANTE',     'Arquitectura');

INSERT INTO catolideres_semestre (user_id, semestre_id) VALUES (2, 1), (3, 1);

INSERT INTO proyectos_receptores
  (id, nombre_proyecto, direccion_exacta, supervisor_nombre, supervisor_telefono, poblacion_objetivo, actividades_semestre_actual)
VALUES
  (1, 'Proyecto Receptor de Prueba A', 'Dirección de prueba A', 'Supervisor Prueba A', '70000001', 'Dato de prueba', 'Dato de prueba'),
  (2, 'Proyecto Receptor de Prueba B', 'Dirección de prueba B', 'Supervisor Prueba B', '70000002', 'Dato de prueba', 'Dato de prueba'),
  (3, 'Proyecto Receptor de Prueba C', 'Dirección de prueba C', 'Supervisor Prueba C', '70000003', 'Dato de prueba', 'Dato de prueba');

INSERT INTO postulaciones
  (id, codigo_postulacion, user_id, semestre_id, carrera, zona_residencia, fecha_nacimiento,
   edad_calculada, numero_materias, poblaciones_interes, estado_postulacion)
VALUES
  (1, 'POST-PRUEBA-0001', 4, 1, 'Medicina',     'Zona de prueba', DATE '2005-03-10', 21, 5, 'Dato de prueba', 'APTO_ENTREVISTA'),
  (2, 'POST-PRUEBA-0002', 5, 1, 'Derecho',      'Zona de prueba', DATE '2004-07-22', 22, 6, 'Dato de prueba', 'APTO_ENTREVISTA'),
  (3, 'POST-PRUEBA-0003', 6, 1, 'Arquitectura', 'Zona de prueba', DATE '2006-01-15', 20, 4, 'Dato de prueba', 'APTO_ENTREVISTA');

-- Alinear secuencias SERIAL con los ids fijos
SELECT setval('semestres_id_seq', (SELECT MAX(id) FROM semestres));
SELECT setval('usuarios_id_seq', (SELECT MAX(id) FROM usuarios));
SELECT setval('proyectos_receptores_id_seq', (SELECT MAX(id) FROM proyectos_receptores));
SELECT setval('postulaciones_id_seq', (SELECT MAX(id) FROM postulaciones));

COMMIT;
