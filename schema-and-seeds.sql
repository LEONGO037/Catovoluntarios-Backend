-- ====================================================================
-- SISTEMA WEB CATOVOLUNTARIOS — PASTORAL UCB REGIONAL LA PAZ
-- SCRIPT DE INICIALIZACIÓN DE BASE DE DATOS POSTGRESQL (DDL)
-- Compatible con: Neon.tech, Supabase, Render, Railway y PostgreSQL 14+ Local
-- ====================================================================

-- ====================================================================
-- 1. EXTENSIONES Y LIMPIEZA PREVIA (DROP TABLES EN ORDEN INVERSO)
-- ====================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DROP TABLE IF EXISTS notificaciones_sistema CASCADE;
DROP TABLE IF EXISTS evaluaciones_proyectos_receptores CASCADE;
DROP TABLE IF EXISTS premios_historicos CASCADE;
DROP TABLE IF EXISTS reportes_semaforo CASCADE;
DROP TABLE IF EXISTS liquidaciones_pasajes CASCADE;
DROP TABLE IF EXISTS conciliaciones_mensuales_supervisor CASCADE;
DROP TABLE IF EXISTS registros_asistencia CASCADE;
DROP TABLE IF EXISTS reasignaciones_proyecto CASCADE;
DROP TABLE IF EXISTS asignaciones_ubicacion CASCADE;
DROP TABLE IF EXISTS asistencias_induccion CASCADE;
DROP TABLE IF EXISTS sesiones_induccion CASCADE;
DROP TABLE IF EXISTS documentos_voluntario CASCADE;
DROP TABLE IF EXISTS evaluaciones_psicologicas CASCADE;
DROP TABLE IF EXISTS entrevistas CASCADE;
DROP TABLE IF EXISTS catolideres_semestre CASCADE;
DROP TABLE IF EXISTS postulaciones CASCADE;
DROP TABLE IF EXISTS proyectos_receptores CASCADE;
DROP TABLE IF EXISTS perfiles_voluntario CASCADE;
DROP TABLE IF EXISTS usuarios CASCADE;
DROP TABLE IF EXISTS semestres CASCADE;

-- Eliminar Tipos ENUM si existen
DROP TYPE IF EXISTS estado_pago_pasajes_enum CASCADE;
DROP TYPE IF EXISTS color_semaforo_enum CASCADE;
DROP TYPE IF EXISTS estado_asistencia_enum CASCADE;
DROP TYPE IF EXISTS motivo_traslado_enum CASCADE;
DROP TYPE IF EXISTS condicion_voluntario_enum CASCADE;
DROP TYPE IF EXISTS modalidad_liderazgo_enum CASCADE;
DROP TYPE IF EXISTS tipo_catolider_enum CASCADE;
DROP TYPE IF EXISTS nivel_voluntario_enum CASCADE;
DROP TYPE IF EXISTS estado_documento_enum CASCADE;
DROP TYPE IF EXISTS asistencias_induccion_estado_induccion_enum CASCADE;
DROP TYPE IF EXISTS tipo_documento_enum CASCADE;
DROP TYPE IF EXISTS dictamen_psicologico_enum CASCADE;
DROP TYPE IF EXISTS dictamen_entrevista_enum CASCADE;
DROP TYPE IF EXISTS estado_cita_entrevista_enum CASCADE;
DROP TYPE IF EXISTS estado_postulacion_enum CASCADE;
DROP TYPE IF EXISTS tipo_relacion_ucb_enum CASCADE;
DROP TYPE IF EXISTS rol_usuario_enum CASCADE;

-- ====================================================================
-- 2. TIPOS ENUM PERSONALIZADOS
-- ====================================================================

CREATE TYPE rol_usuario_enum AS ENUM (
    'ADMIN_PASTORAL',
    'CATOLIDER',
    'VOLUNTARIO',
    'POSTULANTE',
    'INTERESADO',
    'DOCENTE_SUPERVISOR',
    'SUPERVISOR_CENTRO'
);

CREATE TYPE tipo_relacion_ucb_enum AS ENUM (
    'Estudiante Regular',
    'Titulado/Alumni',
    'Docente',
    'Administrativo',
    'Familiar de Personal',
    'Externo Autorizado'
);

CREATE TYPE estado_postulacion_enum AS ENUM (
    'PENDIENTE',
    'APTO_ENTREVISTA',
    'OBSERVADO_SOBRECARGA',
    'DESCARTADO',
    'ADMITIDO'
);

CREATE TYPE estado_cita_entrevista_enum AS ENUM (
    'PROGRAMADA',
    'ASISTIO',
    'FALTO',
    'REPROGRAMADA',
    'CANCELADA'
);

CREATE TYPE dictamen_entrevista_enum AS ENUM (
    'RECOMENDADO',
    'RECOMENDADO_CON_OBSERVACION',
    'NO_RECOMENDADO'
);

CREATE TYPE dictamen_psicologico_enum AS ENUM (
    'APROBADO',
    'OBSERVADO',
    'NO_HABILITADO'
);

CREATE TYPE tipo_documento_enum AS ENUM (
    'POLIZA_ACCIDENTES_APC7083',
    'COMPROMISO_VOLUNTARIADO',
    'CI_ANVERSO_REVERSO',
    'CARTA_AUTORIZACION_PADRES_MENOR',
    'CI_PADRE_TUTOR_MENOR',
    'OTRO_RESPALDO'
);

CREATE TYPE estado_documento_enum AS ENUM (
    'PENDIENTE',
    'APROBADO',
    'OBSERVADO',
    'RECHAZADO'
);

CREATE TYPE asistencias_induccion_estado_induccion_enum AS ENUM (
    'COMPLETADA', 'EN_PROCESO', 'PENDIENTE', 'REPROGRAMAR'
);

CREATE TYPE nivel_voluntario_enum AS ENUM (
    'JUNIOR',       -- 0 a 39 horas acumuladas
    'PRO',          -- 40 a 59 horas acumuladas
    'SUPER_PRO'     -- 60 o más horas acumuladas
);

CREATE TYPE tipo_catolider_enum AS ENUM (
    'TITULAR',
    'APRENDIZ'
);

CREATE TYPE modalidad_liderazgo_enum AS ENUM (
    'CAMPO_Y_GESTION',
    'SOLO_GESTION'
);

CREATE TYPE condicion_voluntario_enum AS ENUM (
    'NUEVO',
    'ANTIGUO'
);

CREATE TYPE motivo_traslado_enum AS ENUM (
    'CRUCE_MATERIAS_UNIVERSITARIAS',
    'DIFICULTAD_TRANSPORTE_DISTANCIA',
    'SOLICITUD_SUPERVISOR_CENTRO',
    'INCOMPATIBILIDAD_PERFIL',
    'OTRO_JUSTIFICADO'
);

CREATE TYPE estado_asistencia_enum AS ENUM (
    'REGISTRADO',
    'APROBADO_CATOLIDER',
    'OBSERVADO_CATOLIDER',
    'CONCILIADO_PASTORAL'
);

CREATE TYPE color_semaforo_enum AS ENUM (
    'VERDE',        -- Desempeño bueno / normal
    'AMARILLO',     -- Alerta / atrasos / actitud
    'ROJO',         -- Riesgo / inasistencias graves / abandono
    'MORADO'        -- Desempeño excelente / postulado a podio
);

CREATE TYPE estado_pago_pasajes_enum AS ENUM (
    'PENDIENTE_FIRMA',
    'FIRMADO_RECIBI_CONFORME',
    'DESEMBOLSADO'
);

-- ====================================================================
-- 3. TABLA: SEMESTRES (Gestiones académicas y operativas)
-- ====================================================================
CREATE TABLE semestres (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,                              -- Ej: 'Gestión Semestre 2/2026'
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NOT NULL,
    activo BOOLEAN DEFAULT FALSE NOT NULL
);

-- ====================================================================
-- 4. TABLA: USUARIOS (Autenticación, RBAC y accesos de todos los actores)
-- ====================================================================
CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    ci VARCHAR(20) UNIQUE NOT NULL,
    ci_complemento VARCHAR(10),
    ci_expedido VARCHAR(10) DEFAULT 'LP',
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
    es_catolider_vigente BOOLEAN DEFAULT FALSE NOT NULL,
    semestre_liderazgo VARCHAR(20),
    modalidad_liderazgo VARCHAR(100),
    proyecto_receptor_asignado_id INT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- ====================================================================
-- 5. TABLA: PERFILES_VOLUNTARIO (Base Madre y trayectoria acumulada)
-- ====================================================================
CREATE TABLE perfiles_voluntario (
    id SERIAL PRIMARY KEY,
    user_id INT UNIQUE NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    tipo_relacion_ucb tipo_relacion_ucb_enum DEFAULT 'Estudiante Regular' NOT NULL,
    fecha_nacimiento DATE NOT NULL,
    zona_residencia VARCHAR(100),
    alergias_condiciones_medicas TEXT,
    habilidades_destacadas TEXT,
    tres_palabras_personalidad VARCHAR(255),
    experiencia_previa BOOLEAN DEFAULT FALSE NOT NULL,
    detalle_experiencia TEXT,
    horas_totales_historicas DECIMAL(8, 2) DEFAULT 0.00 NOT NULL CHECK (horas_totales_historicas >= 0),
    nivel nivel_voluntario_enum DEFAULT 'JUNIOR' NOT NULL,
    es_menor_edad BOOLEAN DEFAULT FALSE NOT NULL
);

-- ====================================================================
-- 6. TABLA: PROYECTOS_RECEPTORES (Centros, convenios, tarifa y supervisor)
-- ====================================================================
CREATE TABLE proyectos_receptores (
    id SERIAL PRIMARY KEY,
    nombre_proyecto VARCHAR(200) NOT NULL,
    direccion_exacta VARCHAR(255) NOT NULL,
    macrodistrito_zona VARCHAR(100),
    -- Clave foránea al usuario responsable por parte del proyecto receptor (SUPERVISOR_CENTRO)
    usuario_supervisor_id INT REFERENCES usuarios(id) ON DELETE SET NULL,
    supervisor_nombre VARCHAR(150) NOT NULL,
    supervisor_telefono VARCHAR(20) NOT NULL,
    fecha_inicio_convenio DATE,
    fecha_fin_convenio DATE,
    poblacion_objetivo TEXT NOT NULL,                         -- Ej: 'Adultos mayores, Niñez, Psiquiatría'
    actividades_semestre_actual TEXT NOT NULL,                -- Específico del semestre actual
    monto_pasaje_por_dia DECIMAL(10, 2) DEFAULT 10.00 NOT NULL CHECK (monto_pasaje_por_dia >= 0), -- Tarifa fija acordada
    cupo_maximo INT DEFAULT 20 NOT NULL CHECK (cupo_maximo > 0),
    cupo_ocupado INT DEFAULT 0 NOT NULL CHECK (cupo_ocupado >= 0),
    catolider_titular_id INT REFERENCES usuarios(id) ON DELETE SET NULL,
    catolider_aprendiz_id INT REFERENCES usuarios(id) ON DELETE SET NULL,
    activo BOOLEAN DEFAULT TRUE NOT NULL
);

-- ====================================================================
-- 7. TABLA: POSTULACIONES (Formulario público Wizard en 4 pasos y filtro anti-sobrecarga)
-- ====================================================================
CREATE TABLE postulaciones (
    id SERIAL PRIMARY KEY,
    codigo_postulacion VARCHAR(50) UNIQUE NOT NULL,           -- Ej: 'POST-2026-0842'
    user_id INT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    semestre_id INT NOT NULL REFERENCES semestres(id) ON DELETE RESTRICT,
    tipo_relacion_ucb tipo_relacion_ucb_enum DEFAULT 'Estudiante Regular' NOT NULL,
    carrera VARCHAR(150) NOT NULL,
    zona_residencia VARCHAR(100) NOT NULL,
    fecha_nacimiento DATE NOT NULL,
    edad_calculada INT NOT NULL CHECK (edad_calculada >= 15 AND edad_calculada <= 80),
    -- Regla dura de Pastoral UCB: Máximo 6 materias inscritas para evitar abandono
    numero_materias INT NOT NULL CHECK (numero_materias >= 0 AND numero_materias <= 6),
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
    poblaciones_interes TEXT NOT NULL,
    compromiso_4h_semanales BOOLEAN DEFAULT TRUE NOT NULL,
    compromiso_induccion BOOLEAN DEFAULT TRUE NOT NULL,
    estado_postulacion estado_postulacion_enum DEFAULT 'PENDIENTE' NOT NULL,
    observaciones_postulacion TEXT,
    CONSTRAINT uq_postulacion_usuario_semestre UNIQUE (user_id, semestre_id)
);

-- ====================================================================
-- 8. TABLA: CATOLIDERES_SEMESTRE (P-06B: Selección y asignación semestral)
-- ====================================================================
CREATE TABLE catolideres_semestre (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    semestre_id INT NOT NULL REFERENCES semestres(id) ON DELETE CASCADE,
    proyecto_id INT REFERENCES proyectos_receptores(id) ON DELETE SET NULL,
    tipo_catolider tipo_catolider_enum DEFAULT 'TITULAR' NOT NULL,
    modalidad modalidad_liderazgo_enum DEFAULT 'CAMPO_Y_GESTION' NOT NULL,
    activo BOOLEAN DEFAULT TRUE NOT NULL,
    CONSTRAINT uq_catolider_usuario_semestre UNIQUE (user_id, semestre_id)
);

-- ====================================================================
-- 9. TABLA: ENTREVISTAS (P-07, P-08: Agendamiento y Ficha del Catolíder)
-- ====================================================================
CREATE TABLE entrevistas (
    id SERIAL PRIMARY KEY,
    postulacion_id INT UNIQUE NOT NULL REFERENCES postulaciones(id) ON DELETE CASCADE,
    catolider_id INT REFERENCES usuarios(id) ON DELETE SET NULL,
    fecha_hora_programada TIMESTAMP WITH TIME ZONE NOT NULL,
    estado estado_cita_entrevista_enum DEFAULT 'PROGRAMADA' NOT NULL,
    apertura_religiosa_escala INT CHECK (apertura_religiosa_escala BETWEEN 1 AND 10),
    proyecto_receptor_sugerido_id INT REFERENCES proyectos_receptores(id) ON DELETE SET NULL,
    observaciones_motivacion TEXT,
    observaciones_compromiso TEXT,
    observaciones_trabajo_equipo TEXT,
    observaciones_recomendaciones TEXT,                       -- Campo solicitado por Pastoral
    dictamen dictamen_entrevista_enum
);

-- ====================================================================
-- 10. TABLA: EVALUACIONES_PSICOLOGICAS (P-09: Test E-SRE y dictamen clínico)
-- ====================================================================
CREATE TABLE evaluaciones_psicologicas (
    id SERIAL PRIMARY KEY,
    postulacion_id INT UNIQUE NOT NULL REFERENCES postulaciones(id) ON DELETE CASCADE,
    psicologo_id INT REFERENCES usuarios(id) ON DELETE SET NULL,
    puntaje_global_esre DECIMAL(5, 2),
    subdimensiones_esre JSONB,                                 -- Socialización, eficacia, proactividad, etc.
    dictamen dictamen_psicologico_enum NOT NULL,
    -- Campo crítico para ubicación inteligente
    poblaciones_sugeridas TEXT NOT NULL,                      -- Ej: 'Apto para Adultos Mayores; No recomendado para Psiquiatría'
    observaciones_confidenciales TEXT,
    -- Enlace Cloudflare R2 para el informe psicológico en PDF
    informe_pdf_url VARCHAR(1000) NOT NULL
);

-- ====================================================================
-- 11. TABLA: DOCUMENTOS_VOLUNTARIO (P-10, P-11: Carga y validación de pólizas)
-- ====================================================================
CREATE TABLE documentos_voluntario (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    semestre_id INT REFERENCES semestres(id) ON DELETE CASCADE,
    semestre VARCHAR(20) DEFAULT '2/2026' NOT NULL,
    tipo_documento tipo_documento_enum NOT NULL,
    archivo_url VARCHAR(1000) NOT NULL,
    nombre_archivo_original VARCHAR(255),
    numero_poliza VARCHAR(50),
    id_poliza VARCHAR(50),
    numero_certificado VARCHAR(50),
    vigencia_inicio DATE,
    vigencia_fin DATE,
    asegurado VARCHAR(150),
    estado estado_documento_enum DEFAULT 'PENDIENTE' NOT NULL,
    observacion_detalle TEXT,
    validado_por INT REFERENCES usuarios(id) ON DELETE SET NULL,
    fecha_validacion TIMESTAMP WITH TIME ZONE,
    enviado_revision_en TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    CONSTRAINT uq_doc_usuario_semestre_tipo UNIQUE (user_id, semestre_id, tipo_documento),
    CONSTRAINT ck_documento_motivo_veredicto CHECK (
        estado NOT IN ('OBSERVADO', 'RECHAZADO')
        OR (observacion_detalle IS NOT NULL AND observacion_detalle ~ '[^[:space:]]')
    )
);

-- ====================================================================
-- 12. TABLA: SESIONES_INDUCCION Y ASISTENCIAS (P-12: Habilitación pre-campo)
-- ====================================================================
CREATE TABLE sesiones_induccion (
    id SERIAL PRIMARY KEY,
    semestre_id INT REFERENCES semestres(id) ON DELETE CASCADE,
    semestre VARCHAR(20) DEFAULT '2/2026' NOT NULL,
    titulo VARCHAR(150) NOT NULL,
    fecha_hora TIMESTAMP WITH TIME ZONE NOT NULL,
    modalidad VARCHAR(50) DEFAULT 'PRESENCIAL',
    lugar_enlace TEXT,
    facilitador VARCHAR(150),
    proyecto_id INT REFERENCES proyectos_receptores(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE TABLE asistencias_induccion (
    id SERIAL PRIMARY KEY,
    sesion_induccion_id INT NOT NULL REFERENCES sesiones_induccion(id) ON DELETE CASCADE,
    user_id INT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    asistio BOOLEAN DEFAULT FALSE NOT NULL,
    fecha_registro TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    fecha_charla DATE,
    recorrido_sitio VARCHAR(100),
    estado_induccion asistencias_induccion_estado_induccion_enum DEFAULT 'PENDIENTE' NOT NULL,
    observaciones TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    CONSTRAINT uq_induccion_sesion_usuario UNIQUE (sesion_induccion_id, user_id)
);

-- ====================================================================
-- 13. TABLA: ASIGNACIONES_UBICACION (P-14: Emparejamiento y Candado Legal)
-- ====================================================================
CREATE TABLE asignaciones_ubicacion (
    id SERIAL PRIMARY KEY,
    id_usuario INT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    id_proyecto INT NOT NULL REFERENCES proyectos_receptores(id) ON DELETE CASCADE,
    semestre_id INT NOT NULL REFERENCES semestres(id) ON DELETE RESTRICT,
    condicion condicion_voluntario_enum DEFAULT 'NUEVO' NOT NULL,
    horario_comprometido VARCHAR(150),                        -- Ej: 'Sábados de 09:00 a 13:00'
    poliza_validada BOOLEAN DEFAULT FALSE NOT NULL,
    induccion_completada BOOLEAN DEFAULT FALSE NOT NULL,
    -- CANDADO DE ORO: Solo TRUE si poliza_validada=TRUE AND induccion_completada=TRUE
    habilitado_campo BOOLEAN DEFAULT FALSE NOT NULL,
    activo BOOLEAN DEFAULT TRUE NOT NULL,
    CONSTRAINT uq_asignacion_usuario_semestre UNIQUE (id_usuario, semestre_id)
);

-- ====================================================================
-- 14. TABLA: REASIGNACIONES_PROYECTO (P-15: Traslados de primer mes)
-- ====================================================================
CREATE TABLE reasignaciones_proyecto (
    id SERIAL PRIMARY KEY,
    asignacion_id INT NOT NULL REFERENCES asignaciones_ubicacion(id) ON DELETE CASCADE,
    proyecto_origen_id INT NOT NULL REFERENCES proyectos_receptores(id) ON DELETE RESTRICT,
    proyecto_destino_id INT NOT NULL REFERENCES proyectos_receptores(id) ON DELETE RESTRICT,
    motivo motivo_traslado_enum NOT NULL,
    detalle_motivo TEXT,
    fecha_efectiva DATE NOT NULL,
    registrado_por INT NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT
);

-- ====================================================================
-- 15. TABLA: REGISTROS_ASISTENCIA (P-16: Marcación de jornadas y aprobación)
-- ====================================================================
CREATE TABLE registros_asistencia (
    id SERIAL PRIMARY KEY,
    id_asignacion INT NOT NULL REFERENCES asignaciones_ubicacion(id) ON DELETE CASCADE,
    fecha DATE NOT NULL,
    hora_ingreso TIME NOT NULL,
    hora_salida TIME NOT NULL,
    horas_calculadas DECIMAL(5, 2) DEFAULT 4.00 NOT NULL CHECK (horas_calculadas >= 0),
    tareas_realizadas TEXT NOT NULL,
    estado_aprobacion estado_asistencia_enum DEFAULT 'REGISTRADO' NOT NULL,
    aprobado_por_catolider_id INT REFERENCES usuarios(id) ON DELETE SET NULL,
    observaciones_aprobacion TEXT,
    conciliado_en_planilla BOOLEAN DEFAULT FALSE NOT NULL
);

-- ====================================================================
-- 16. TABLA: CONCILIACIONES_MENSUALES_SUPERVISOR (P-16: Planillas físicas de centros)
-- ====================================================================
CREATE TABLE conciliaciones_mensuales_supervisor (
    id SERIAL PRIMARY KEY,
    proyecto_id INT NOT NULL REFERENCES proyectos_receptores(id) ON DELETE CASCADE,
    semestre_id INT NOT NULL REFERENCES semestres(id) ON DELETE RESTRICT,
    mes INT NOT NULL CHECK (mes BETWEEN 1 AND 12),
    anio INT NOT NULL CHECK (anio >= 2020),
    -- Enlace Cloudflare R2 con el escaneo/PDF de la planilla física firmada por el supervisor externo
    reporte_firmas_supervisor_url VARCHAR(1000),
    total_voluntarios_reportados INT NOT NULL CHECK (total_voluntarios_reportados >= 0),
    total_dias_asistidos INT NOT NULL CHECK (total_dias_asistidos >= 0),
    monto_total_pasajes DECIMAL(10, 2) NOT NULL CHECK (monto_total_pasajes >= 0),
    conciliado_por INT REFERENCES usuarios(id) ON DELETE SET NULL,
    fecha_conciliacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT uq_conciliacion_proyecto_mes_anio UNIQUE (proyecto_id, semestre_id, mes, anio)
);

-- ====================================================================
-- 17. TABLA: LIQUIDACIONES_PASAJES (P-17: Cálculo automatizado y descargo contable)
-- ====================================================================
CREATE TABLE liquidaciones_pasajes (
    id SERIAL PRIMARY KEY,
    id_asignacion INT NOT NULL REFERENCES asignaciones_ubicacion(id) ON DELETE CASCADE,
    mes INT NOT NULL CHECK (mes BETWEEN 1 AND 12),
    anio INT NOT NULL CHECK (anio >= 2020),
    dias_presenciales_asistidos INT DEFAULT 0 NOT NULL CHECK (dias_presenciales_asistidos >= 0),
    tarifa_diaria_aplicada DECIMAL(10, 2) NOT NULL CHECK (tarifa_diaria_aplicada >= 0),
    -- Monto calculado: dias_presenciales_asistidos * tarifa_diaria_aplicada
    monto_total_reponer DECIMAL(10, 2) NOT NULL CHECK (monto_total_reponer >= 0),
    estado_pago estado_pago_pasajes_enum DEFAULT 'PENDIENTE_FIRMA' NOT NULL,
    fecha_pago DATE,
    -- Enlace Cloudflare R2 con la planilla individual firmada físicamente de 'Recibí Conforme'
    recibi_conforme_firmado_url VARCHAR(1000),
    CONSTRAINT uq_liquidacion_asignacion_mes_anio UNIQUE (id_asignacion, mes, anio)
);

-- ====================================================================
-- 18. TABLA: REPORTES_SEMAFORO (P-19: Evaluación cualitativa mensual del Catolíder)
-- ====================================================================
CREATE TABLE reportes_semaforo (
    id SERIAL PRIMARY KEY,
    id_asignacion INT NOT NULL REFERENCES asignaciones_ubicacion(id) ON DELETE CASCADE,
    mes VARCHAR(50) NOT NULL,
    anio INT NOT NULL CHECK (anio >= 2020),
    color_semaforo color_semaforo_enum NOT NULL,
    observaciones_desempeno TEXT,
    notificar_abandono BOOLEAN DEFAULT FALSE NOT NULL,
    catolider_evaluador_id INT REFERENCES usuarios(id) ON DELETE SET NULL,
    CONSTRAINT uq_reporte_asignacion_mes_anio UNIQUE (id_asignacion, mes, anio)
);

-- ====================================================================
-- 19. TABLA: PREMIOS_HISTORICOS (P-20: Podio y reconocimientos Base Madre)
-- ====================================================================
CREATE TABLE premios_historicos (
    id SERIAL PRIMARY KEY,
    id_usuario INT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    semestre_id INT NOT NULL REFERENCES semestres(id) ON DELETE RESTRICT,
    proyecto_id INT REFERENCES proyectos_receptores(id) ON DELETE SET NULL,
    nombre_premio VARCHAR(150) NOT NULL,                      -- Ej: 'Catovoluntario Destacado', 'Beca Misión Carmen Pampa'
    categoria VARCHAR(100),                                   -- Ej: 'Liderazgo en Campo', 'Puntualidad y Compromiso'
    descripcion TEXT NOT NULL
);

-- ====================================================================
-- 20. TABLA: EVALUACIONES_PROYECTOS_RECEPTORES (P-21: Cierre y feedback libre)
-- ====================================================================
CREATE TABLE evaluaciones_proyectos_receptores (
    id SERIAL PRIMARY KEY,
    proyecto_id INT NOT NULL REFERENCES proyectos_receptores(id) ON DELETE CASCADE,
    semestre_id INT NOT NULL REFERENCES semestres(id) ON DELETE RESTRICT,
    voluntarios_recibidos INT DEFAULT 0 NOT NULL,
    voluntarios_culminados INT DEFAULT 0 NOT NULL,
    calificacion_grupo INT CHECK (calificacion_grupo BETWEEN 1 AND 5),
    calificacion_catolider INT CHECK (calificacion_catolider BETWEEN 1 AND 5),
    solicita_continuidad_convenio BOOLEAN DEFAULT TRUE NOT NULL,
    cupos_solicitados_proximo_semestre INT DEFAULT 20 NOT NULL,
    -- Bloque 4 libre solicitado para evitar informes físicos largos
    bloque4_observaciones_sugerencias_libres TEXT NOT NULL,
    nombre_responsable_llenado VARCHAR(150) NOT NULL,
    cargo_responsable VARCHAR(100),
    -- Enlace Cloudflare R2 opcional si la institución adjunta un acta firmada
    documento_respaldo_url VARCHAR(1000),
    fecha_evaluacion DATE DEFAULT CURRENT_DATE NOT NULL,
    CONSTRAINT uq_evaluacion_proyecto_semestre UNIQUE (proyecto_id, semestre_id)
);

-- ====================================================================
-- 21. TABLA: NOTIFICACIONES_SISTEMA (Alertas internas y movimientos)
-- ====================================================================
CREATE TABLE notificaciones_sistema (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    titulo VARCHAR(150) NOT NULL,
    mensaje TEXT NOT NULL,
    tipo VARCHAR(50) DEFAULT 'INFO' NOT NULL,                 -- 'INFO', 'ALERTA', 'REASIGNACION', 'DOCUMENTO_OBSERVADO'
    leida BOOLEAN DEFAULT FALSE NOT NULL,
    enlace_destino VARCHAR(255),
    semestre VARCHAR(20),
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE INDEX idx_notificaciones_usuario_gestion
    ON notificaciones_sistema (user_id, semestre, id);

-- ====================================================================
-- 22. TRIGGERS AUTOMÁTICOS
-- ====================================================================

-- A) Trigger de Seguridad: Habilitación de Campo sujeta a Póliza + Inducción
CREATE OR REPLACE FUNCTION trigger_verificar_habilitacion_campo()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.poliza_validada = TRUE AND NEW.induccion_completada = TRUE THEN
        NEW.habilitado_campo = TRUE;
    ELSE
        NEW.habilitado_campo = FALSE;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_check_habilitacion_campo
BEFORE INSERT OR UPDATE OF poliza_validada, induccion_completada ON asignaciones_ubicacion
FOR EACH ROW EXECUTE PROCEDURE trigger_verificar_habilitacion_campo();

-- B) Trigger de Actualización de Nivel en Base Madre según Horas Acumuladas
CREATE OR REPLACE FUNCTION trigger_actualizar_nivel_voluntario()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.horas_totales_historicas >= 60.00 THEN
        NEW.nivel = 'SUPER_PRO';
    ELSIF NEW.horas_totales_historicas >= 40.00 THEN
        NEW.nivel = 'PRO';
    ELSE
        NEW.nivel = 'JUNIOR';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_set_nivel_voluntario
BEFORE INSERT OR UPDATE OF horas_totales_historicas ON perfiles_voluntario
FOR EACH ROW EXECUTE PROCEDURE trigger_actualizar_nivel_voluntario();

-- ====================================================================
-- 23. ÍNDICES ESTRATÉGICOS PARA CONSULTAS Y FILTROS RÁPIDOS
-- ====================================================================
CREATE INDEX idx_usuarios_email ON usuarios(email);
CREATE INDEX idx_usuarios_ci ON usuarios(ci);
CREATE INDEX idx_usuarios_rol ON usuarios(rol);

CREATE INDEX idx_proyectos_supervisor ON proyectos_receptores(usuario_supervisor_id);

CREATE INDEX idx_postulaciones_codigo ON postulaciones(codigo_postulacion);
CREATE INDEX idx_postulaciones_semestre ON postulaciones(semestre_id);
CREATE INDEX idx_postulaciones_estado ON postulaciones(estado_postulacion);
CREATE INDEX idx_postulaciones_carrera ON postulaciones(carrera);

CREATE INDEX idx_asignaciones_proyecto ON asignaciones_ubicacion(id_proyecto);
CREATE INDEX idx_asignaciones_semestre ON asignaciones_ubicacion(semestre_id);
CREATE INDEX idx_asignaciones_habilitado ON asignaciones_ubicacion(habilitado_campo);

CREATE INDEX idx_asistencias_asignacion ON registros_asistencia(id_asignacion);
CREATE INDEX idx_asistencias_fecha ON registros_asistencia(fecha);
CREATE INDEX idx_asistencias_estado ON registros_asistencia(estado_aprobacion);

CREATE INDEX idx_semaforo_asignacion ON reportes_semaforo(id_asignacion);
CREATE INDEX idx_semaforo_color ON reportes_semaforo(color_semaforo);

CREATE INDEX idx_documentos_usuario ON documentos_voluntario(user_id);
CREATE INDEX idx_documentos_estado ON documentos_voluntario(estado);
CREATE INDEX idx_documentos_usuario_gestion_tipo ON documentos_voluntario(user_id, semestre, tipo_documento);
CREATE INDEX idx_documentos_gestion_envio ON documentos_voluntario(semestre, enviado_revision_en);

-- ====================================================================
-- 24. DATOS SEMILLA INICIALES
-- ====================================================================
-- Semestre activo
INSERT INTO semestres (nombre, fecha_inicio, fecha_fin, activo)
VALUES ('Gestión Semestre 2/2026', '2026-08-01', '2026-12-15', TRUE)
ON CONFLICT DO NOTHING;

-- Usuario Administrador Pastoral: Leonardo Delgado (Password: Password123!)
INSERT INTO usuarios (
    ci,
    ci_complemento,
    ci_expedido,
    email,
    password_hash,
    nombres,
    primer_apellido,
    segundo_apellido,
    rol,
    telefono,
    carrera,
    semestre_ingreso,
    activo
) VALUES (
    '4892301LP',
    NULL,
    'LP',
    'leonardo.delgado.medrano@gmail.com',
    '$2b$10$JyiGI04psZwWVKCfvwsH6OsACcbWafNYWLPK1fLjxDUtg0dpOwaz.',
    'Leonardo',
    'Delgado',
    'Medrano',
    'ADMIN_PASTORAL',
    '71523489',
    'Pastoral Universitaria',
    '2/2026',
    TRUE
)
ON CONFLICT (email) DO UPDATE 
SET rol = 'ADMIN_PASTORAL',
    password_hash = '$2b$10$JyiGI04psZwWVKCfvwsH6OsACcbWafNYWLPK1fLjxDUtg0dpOwaz.',
    nombres = 'Leonardo',
    primer_apellido = 'Delgado',
    segundo_apellido = 'Medrano',
    activo = TRUE;

