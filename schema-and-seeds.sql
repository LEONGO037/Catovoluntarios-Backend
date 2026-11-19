-- ====================================================================
-- SISTEMA CATOVOLUNTARIOS — PASTORAL UCB REGIONAL LA PAZ
-- SCRIPT DE INICIALIZACIÓN DE BASE DE DATOS POSTGRESQL Y SEMILLAS
-- Compatible con: Neon.tech, Supabase, Render, Railway y PostgreSQL Local
-- Fecha: 18 de Noviembre de 2026
-- ====================================================================

-- 1. EXTENSIONES Y LIMPIEZA PREVIA
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Eliminar tablas si existen (en orden inverso de dependencia)
DROP TABLE IF EXISTS premios_historicos CASCADE;
DROP TABLE IF EXISTS reportes_semaforo CASCADE;
DROP TABLE IF EXISTS registros_asistencia CASCADE;
DROP TABLE IF EXISTS asignaciones_ubicacion CASCADE;
DROP TABLE IF EXISTS postulaciones CASCADE;
DROP TABLE IF EXISTS proyectos_receptores CASCADE;
DROP TABLE IF EXISTS usuarios CASCADE;

-- Eliminar tipo enum si existe
DROP TYPE IF EXISTS rol_usuario_enum CASCADE;

-- 2. TIPO ENUM OFICIAL DE ROLES
CREATE TYPE rol_usuario_enum AS ENUM (
    'ADMIN_PASTORAL',
    'CATOLIDER',
    'VOLUNTARIO',
    'POSTULANTE',
    'INTERESADO'
);

-- 3. TABLA: USUARIOS
CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    ci VARCHAR(20) UNIQUE NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    nombres VARCHAR(100) NOT NULL,
    primer_apellido VARCHAR(100) NOT NULL,
    segundo_apellido VARCHAR(100),
    rol rol_usuario_enum DEFAULT 'POSTULANTE' NOT NULL,
    telefono VARCHAR(20),
    carrera VARCHAR(150),
    semestre_ingreso VARCHAR(20) DEFAULT '2/2026',
    activo BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 4. TABLA: PROYECTOS RECEPTORES (Centros y Convenios)
CREATE TABLE proyectos_receptores (
    id SERIAL PRIMARY KEY,
    nombre_proyecto VARCHAR(200) NOT NULL,
    direccion_exacta VARCHAR(255) NOT NULL,
    macrodistrito_zona VARCHAR(100),
    supervisor_nombre VARCHAR(150),
    supervisor_telefono VARCHAR(20),
    supervisor_email VARCHAR(150),
    fecha_inicio_convenio DATE,
    fecha_fin_convenio DATE,
    poblacion_objetivo TEXT NOT NULL,
    actividades_semestre_actual TEXT NOT NULL,
    monto_pasaje_por_dia DECIMAL(10, 2) DEFAULT 10.00 NOT NULL,
    cupo_maximo INT DEFAULT 20 NOT NULL,
    cupo_ocupado INT DEFAULT 0 NOT NULL,
    catolider_titular_id INT,
    catolider_aprendiz_id INT,
    activo BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 5. TABLA: POSTULACIONES
CREATE TABLE postulaciones (
    id SERIAL PRIMARY KEY,
    codigo_postulacion VARCHAR(50) UNIQUE NOT NULL,
    user_id INT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    tipo_relacion_ucb VARCHAR(50) DEFAULT 'Estudiante Regular' NOT NULL,
    fecha_nacimiento DATE NOT NULL,
    edad_calculada INT NOT NULL,
    numero_materias INT NOT NULL,
    tiene_materias_pesadas BOOLEAN DEFAULT FALSE NOT NULL,
    detalle_materias_pesadas TEXT,
    actividades_extracurriculares INT DEFAULT 0 NOT NULL,
    detalle_actividades TEXT,
    menor_edad BOOLEAN DEFAULT FALSE NOT NULL,
    autorizacion_padres BOOLEAN DEFAULT FALSE NOT NULL,
    experiencia_previa BOOLEAN DEFAULT FALSE NOT NULL,
    detalle_experiencia TEXT,
    habilidades TEXT,
    tres_palabras_personalidad VARCHAR(255),
    alergias_condiciones_medicas TEXT,
    poblaciones_interes TEXT,
    estado_postulacion VARCHAR(50) DEFAULT 'PENDIENTE' NOT NULL,
    semestre VARCHAR(20) DEFAULT '2/2026' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 6. TABLA: ASIGNACIONES DE UBICACIÓN
CREATE TABLE asignaciones_ubicacion (
    id SERIAL PRIMARY KEY,
    id_usuario INT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    id_proyecto INT NOT NULL REFERENCES proyectos_receptores(id) ON DELETE CASCADE,
    semestre VARCHAR(20) DEFAULT '2/2026' NOT NULL,
    condicion VARCHAR(20) DEFAULT 'Nuevo' NOT NULL,
    poliza_validada BOOLEAN DEFAULT FALSE NOT NULL,
    induccion_completada BOOLEAN DEFAULT FALSE NOT NULL,
    habilitado_campo BOOLEAN DEFAULT FALSE NOT NULL,
    activo BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 7. TABLA: REGISTROS DE ASISTENCIA
CREATE TABLE registros_asistencia (
    id SERIAL PRIMARY KEY,
    id_asignacion INT NOT NULL REFERENCES asignaciones_ubicacion(id) ON DELETE CASCADE,
    fecha DATE NOT NULL,
    hora_ingreso TIME NOT NULL,
    hora_salida TIME NOT NULL,
    horas_calculadas DECIMAL(5, 2) DEFAULT 4.00 NOT NULL,
    tareas_realizadas TEXT,
    estado_aprobacion VARCHAR(50) DEFAULT 'Registrado' NOT NULL,
    es_actividad_emergente BOOLEAN DEFAULT FALSE NOT NULL,
    aprobado_por_catolider_id INT REFERENCES usuarios(id) ON DELETE SET NULL,
    observaciones_aprobacion TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 8. TABLA: REPORTES DE SEMÁFORO MENSUAL
CREATE TABLE reportes_semaforo (
    id SERIAL PRIMARY KEY,
    id_asignacion INT NOT NULL REFERENCES asignaciones_ubicacion(id) ON DELETE CASCADE,
    mes VARCHAR(50) NOT NULL,
    color_semaforo VARCHAR(20) NOT NULL,
    justificacion_obligatoria TEXT NOT NULL,
    notificar_abandono BOOLEAN DEFAULT FALSE NOT NULL,
    catolider_evaluador_id INT REFERENCES usuarios(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 9. TABLA: PREMIOS HISTÓRICOS Y PODIO
CREATE TABLE premios_historicos (
    id SERIAL PRIMARY KEY,
    id_usuario INT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    semestre VARCHAR(20) NOT NULL,
    nombre_premio VARCHAR(150) NOT NULL,
    descripcion TEXT NOT NULL,
    foto_podio_url VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- ====================================================================
-- 10. DATOS SEMILLA (SEED DATA) DE PRUEBA
-- Contraseña para todos los usuarios: Password123!
-- ====================================================================

-- A) USUARIOS MAESTROS
INSERT INTO usuarios (ci, email, password_hash, nombres, primer_apellido, segundo_apellido, rol, telefono, carrera, semestre_ingreso) VALUES
('4892301LP', 'andrea.moscoso@ucb.edu.bo', '$2b$10$OrDEhhyULmAJUOzaWT1PbezSxJfXP0pbI6/njlkrkQCRvnVoBZxkC', 'Andrea', 'Moscoso', 'Valdivia', 'ADMIN_PASTORAL', '71523489', 'Pastoral Universitaria', '1/2023'),
('6789123LP', 'catolider.santiago@ucb.edu.bo', '$2b$10$OrDEhhyULmAJUOzaWT1PbezSxJfXP0pbI6/njlkrkQCRvnVoBZxkC', 'Santiago', 'Montes', 'Roca', 'CATOLIDER', '76543210', 'Ingeniería de Sistemas', '1/2024'),
('8912345LP', 'voluntario.maria@ucb.edu.bo', '$2b$10$OrDEhhyULmAJUOzaWT1PbezSxJfXP0pbI6/njlkrkQCRvnVoBZxkC', 'María Belén', 'Flores', 'Mendoza', 'VOLUNTARIO', '70654321', 'Psicología', '2/2024'),
('9876543LP', 'postulante.carlos@ucb.edu.bo', '$2b$10$OrDEhhyULmAJUOzaWT1PbezSxJfXP0pbI6/njlkrkQCRvnVoBZxkC', 'Carlos Andrés', 'Quispe', 'Mamani', 'POSTULANTE', '78901234', 'Comunicación Social', '2/2026'),
('5432167LP', 'docente.pastoral@ucb.edu.bo', '$2b$10$OrDEhhyULmAJUOzaWT1PbezSxJfXP0pbI6/njlkrkQCRvnVoBZxkC', 'Rodrigo', 'Gutiérrez', 'Paz', 'ADMIN_PASTORAL', '72098765', 'Teología y Pastoral', '1/2022');

-- B) PROYECTOS RECEPTORES OFICIALES
INSERT INTO proyectos_receptores (nombre_proyecto, direccion_exacta, macrodistrito_zona, supervisor_nombre, supervisor_telefono, supervisor_email, fecha_inicio_convenio, fecha_fin_convenio, poblacion_objetivo, actividades_semestre_actual, monto_pasaje_por_dia, cupo_maximo, cupo_ocupado, catolider_titular_id) VALUES
('Hogar San Ramón (Adultos Mayores)', 'Av. Hernando Siles, Calle 12 Obrajes', 'Sur - Obrajes', 'Hna. Rosario Peñaranda', '2783412', 'sanramon@pastoral.org', '2026-02-01', '2026-12-15', 'Adultos Mayores / Geriatría y Memoria', 'Acompañamiento en comedor, talleres de estimulación cognitiva, lectura y fisioterapia suave.', 10.00, 25, 24, 2),
('Comedor San Calixto (Personas en Calle)', 'Calle Indaburo esquina Pichincha s/n', 'Centro - San Calixto', 'P. Marcos Villarroel', '2405678', 'comedor.calixto@pastoral.org', '2026-02-01', '2026-12-15', 'Personas en situación de vulnerabilidad extrema y calle', 'Servicio de mesas, apoyo en cocina, entrega de alimentos calientes y escucha activa.', 10.00, 20, 18, 2),
('Hospital del Niño - Área Lúdica y Acompañamiento', 'Av. Saavedra, Miraflores', 'Centro - Miraflores', 'Lic. Gabriela Torrico', '2245678', 'ludoteca.hn@salud.gob.bo', '2026-02-01', '2026-12-15', 'Niñez y salud pediátrica', 'Dinámicas de clown hospitalario, lectura de cuentos y apoyo escolar a pacientes internados.', 12.00, 15, 15, 2),
('Centro Terapéutico Kallpa (Discapacidad)', 'Calle 21 de Calacoto, Esq. Inofuentes', 'Sur - Calacoto', 'Lic. Daniela Zuazo', '2791234', 'kallpa.bolivia@gmail.com', '2026-02-01', '2026-12-15', 'Jóvenes y adultos con discapacidad psicomotriz y autismo', 'Talleres ocupacionales, hidroterapia asistida y dinámicas de socialización comunitaria.', 15.00, 18, 12, 2),
('Aldeas Infantiles SOS Mallasa', 'Av. Principal Mallasa s/n', 'Mallasa - Valencia', 'Lic. Marcelo Céspedes', '2745678', 'mallasa@aldeasinfantiles.org.bo', '2026-02-01', '2026-12-15', 'Primera infancia, niñas y niños en desamparo', 'Refuerzo escolar en matemáticas y lenguaje, talleres de robótica básica y juegos al aire libre.', 20.00, 20, 11, 2);

-- C) POSTULACIÓN DE EJEMPLO
INSERT INTO postulaciones (codigo_postulacion, user_id, tipo_relacion_ucb, fecha_nacimiento, edad_calculada, numero_materias, tiene_materias_pesadas, actividades_extracurriculares, menor_edad, autorizacion_padres, experiencia_previa, habilidades, tres_palabras_personalidad, poblaciones_interes, estado_postulacion, semestre) VALUES
('POST-2026-0001', 4, 'Estudiante Regular', '2005-04-12', 21, 5, FALSE, 1, FALSE, TRUE, TRUE, 'Música, Escucha activa, Apoyo escolar', 'Empatía, Compromiso, Dinamismo', 'Adultos mayores, Niñez', 'APTO_ENTREVISTA', '2/2026');

-- D) ASIGNACIÓN DE VOLUNTARIO
INSERT INTO asignaciones_ubicacion (id_usuario, id_proyecto, semestre, condicion, poliza_validada, induccion_completada, habilitado_campo, activo) VALUES
(3, 1, '2/2026', 'Antiguo', TRUE, TRUE, TRUE, TRUE);

-- E) REGISTROS DE ASISTENCIA DE EJEMPLO
INSERT INTO registros_asistencia (id_asignacion, fecha, hora_ingreso, hora_salida, horas_calculadas, tareas_realizadas, estado_aprobacion, es_actividad_emergente, aprobado_por_catolider_id) VALUES
(1, '2026-11-07', '14:00', '18:00', 4.00, 'Taller de estimulación de la memoria con el grupo B y juego de ajedrez.', 'Aprobado_Catolider', FALSE, 2),
(1, '2026-11-14', '14:00', '18:00', 4.00, 'Apoyo en la merienda comunitaria y lectura guiada de periódicos locales.', 'Aprobado_Catolider', FALSE, 2);

-- F) REPORTE DE SEMÁFORO MENSUAL
INSERT INTO reportes_semaforo (id_asignacion, mes, color_semaforo, justificacion_obligatoria, notificar_abandono, catolider_evaluador_id) VALUES
(1, 'Noviembre 2026', 'Morado', 'María Belén demuestra un liderazgo inspirador con los adultos mayores, puntualidad intachable y excelente iniciativa grupal.', FALSE, 2);

-- G) PREMIO HISTÓRICO
INSERT INTO premios_historicos (id_usuario, semestre, nombre_premio, descripcion) VALUES
(3, '1/2026', 'Catovoluntario Destacado Pastoral UCB', 'Reconocimiento al compromiso y vocación de servicio con 68 horas ejecutadas en el Hogar San Ramón.');
