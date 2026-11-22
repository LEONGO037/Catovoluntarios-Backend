-- ====================================================================
-- SISTEMA WEB CATOVOLUNTARIOS — PASTORAL UCB REGIONAL LA PAZ
-- SCRIPT DE INICIALIZACIÓN DE BASE DE DATOS POSTGRESQL (DDL + DML)
-- Modelo Relacional Completo, Claves Foráneas, Restricciones y Enlaces Cloudflare R2
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
DROP TABLE IF EXISTS actividades_emergentes CASCADE;
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
-- 3. FUNCIÓN TRIGGER PARA ACTUALIZACIÓN AUTOMÁTICA DE UPDATED_AT
-- ====================================================================
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ====================================================================
-- 4. TABLA: SEMESTRES (Gestiones académicas y operativas)
-- ====================================================================
CREATE TABLE semestres (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(20) UNIQUE NOT NULL,                       -- Ej: '1/2026', '2/2026'
    nombre VARCHAR(100) NOT NULL,                              -- Ej: 'Gestión Semestre 2/2026'
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NOT NULL,
    activo BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- ====================================================================
-- 5. TABLA: USUARIOS (Autenticación, RBAC y accesos)
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
    reset_password_token VARCHAR(255),
    reset_password_expires TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- ====================================================================
-- 6. TABLA: PERFILES_VOLUNTARIO (Base Madre y trayectoria acumulada)
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
    es_menor_edad BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- ====================================================================
-- 7. TABLA: PROYECTOS_RECEPTORES (Centros, convenios y tarifa de pasajes)
-- ====================================================================
CREATE TABLE proyectos_receptores (
    id SERIAL PRIMARY KEY,
    nombre_proyecto VARCHAR(200) NOT NULL,
    direccion_exacta VARCHAR(255) NOT NULL,
    macrodistrito_zona VARCHAR(100),
    supervisor_nombre VARCHAR(150) NOT NULL,
    supervisor_telefono VARCHAR(20) NOT NULL,
    supervisor_email VARCHAR(150),
    fecha_inicio_convenio DATE,
    fecha_fin_convenio DATE,
    poblacion_objetivo TEXT NOT NULL,                         -- Ej: 'Adultos mayores, Niñez, Psiquiatría'
    actividades_semestre_actual TEXT NOT NULL,                -- Específico del semestre actual
    monto_pasaje_por_dia DECIMAL(10, 2) DEFAULT 10.00 NOT NULL CHECK (monto_pasaje_por_dia >= 0), -- Tarifa fija acordada
    cupo_maximo INT DEFAULT 20 NOT NULL CHECK (cupo_maximo > 0),
    cupo_ocupado INT DEFAULT 0 NOT NULL CHECK (cupo_ocupado >= 0),
    catolider_titular_id INT REFERENCES usuarios(id) ON DELETE SET NULL,
    catolider_aprendiz_id INT REFERENCES usuarios(id) ON DELETE SET NULL,
    activo BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- ====================================================================
-- 8. TABLA: POSTULACIONES (Formulario público Wizard en 4 pasos y filtro anti-sobrecarga)
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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT uq_postulacion_usuario_semestre UNIQUE (user_id, semestre_id)
);

-- ====================================================================
-- 9. TABLA: CATOLIDERES_SEMESTRE (P-06B: Selección y asignación semestral)
-- ====================================================================
CREATE TABLE catolideres_semestre (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    semestre_id INT NOT NULL REFERENCES semestres(id) ON DELETE CASCADE,
    proyecto_id INT REFERENCES proyectos_receptores(id) ON DELETE SET NULL,
    tipo_catolider tipo_catolider_enum DEFAULT 'TITULAR' NOT NULL,
    modalidad modalidad_liderazgo_enum DEFAULT 'CAMPO_Y_GESTION' NOT NULL,
    activo BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT uq_catolider_usuario_semestre UNIQUE (user_id, semestre_id)
);

-- ====================================================================
-- 10. TABLA: ENTREVISTAS (P-07, P-08: Agendamiento y Ficha del Catolíder)
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
    dictamen dictamen_entrevista_enum,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- ====================================================================
-- 11. TABLA: EVALUACIONES_PSICOLOGICAS (P-09: Test E-SRE y dictamen clínico)
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
    informe_pdf_url VARCHAR(1000) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- ====================================================================
-- 12. TABLA: DOCUMENTOS_VOLUNTARIO (P-10, P-11: Carga y validación de pólizas)
-- ====================================================================
CREATE TABLE documentos_voluntario (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    semestre_id INT NOT NULL REFERENCES semestres(id) ON DELETE CASCADE,
    tipo_documento tipo_documento_enum NOT NULL,
    -- Enlace Cloudflare R2 donde se almacena el archivo físico (PDF, JPG, PNG)
    archivo_url VARCHAR(1000) NOT NULL,
    nombre_archivo_original VARCHAR(255),
    mime_type VARCHAR(100),
    peso_bytes BIGINT,
    -- Campos específicos para la póliza de seguro UCB (APC-7083)
    numero_poliza VARCHAR(50),
    vigencia_inicio DATE,
    vigencia_fin DATE,
    estado estado_documento_enum DEFAULT 'PENDIENTE' NOT NULL,
    observaciones_validacion TEXT,
    validado_por INT REFERENCES usuarios(id) ON DELETE SET NULL,
    fecha_validacion TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT uq_doc_usuario_semestre_tipo UNIQUE (user_id, semestre_id, tipo_documento)
);

-- ====================================================================
-- 13. TABLA: SESIONES_INDUCCION Y ASISTENCIAS (P-12: Habilitación pre-campo)
-- ====================================================================
CREATE TABLE sesiones_induccion (
    id SERIAL PRIMARY KEY,
    semestre_id INT NOT NULL REFERENCES semestres(id) ON DELETE CASCADE,
    titulo VARCHAR(150) NOT NULL,                              -- Ej: 'Taller de Inducción General Pastoral 2/2026'
    fecha_hora TIMESTAMP WITH TIME ZONE NOT NULL,
    modalidad VARCHAR(50) DEFAULT 'PRESENCIAL',
    lugar_enlace TEXT,
    facilitador VARCHAR(150),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE asistencias_induccion (
    id SERIAL PRIMARY KEY,
    sesion_induccion_id INT NOT NULL REFERENCES sesiones_induccion(id) ON DELETE CASCADE,
    user_id INT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    asistio BOOLEAN DEFAULT FALSE NOT NULL,
    fecha_registro TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT uq_induccion_sesion_usuario UNIQUE (sesion_induccion_id, user_id)
);

-- ====================================================================
-- 14. TABLA: ASIGNACIONES_UBICACION (P-14: Emparejamiento y Candado Legal)
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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT uq_asignacion_usuario_semestre UNIQUE (id_usuario, semestre_id)
);

-- ====================================================================
-- 15. TABLA: REASIGNACIONES_PROYECTO (P-15: Traslados de primer mes)
-- ====================================================================
CREATE TABLE reasignaciones_proyecto (
    id SERIAL PRIMARY KEY,
    asignacion_id INT NOT NULL REFERENCES asignaciones_ubicacion(id) ON DELETE CASCADE,
    proyecto_origen_id INT NOT NULL REFERENCES proyectos_receptores(id) ON DELETE RESTRICT,
    proyecto_destino_id INT NOT NULL REFERENCES proyectos_receptores(id) ON DELETE RESTRICT,
    motivo motivo_traslado_enum NOT NULL,
    detalle_motivo TEXT,
    fecha_efectiva DATE NOT NULL,
    registrado_por INT NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- ====================================================================
-- 16. TABLA: ACTIVIDADES_EMERGENTES (P-18: Eventos extraordinarios convocados por Pastoral)
-- ====================================================================
CREATE TABLE actividades_emergentes (
    id SERIAL PRIMARY KEY,
    semestre_id INT NOT NULL REFERENCES semestres(id) ON DELETE CASCADE,
    titulo VARCHAR(200) NOT NULL,                              -- Ej: 'Apoyo Logístico Concierto Martín Valverde'
    descripcion TEXT,
    fecha DATE NOT NULL,
    horas_reconocidas DECIMAL(5, 2) DEFAULT 4.00 NOT NULL CHECK (horas_reconocidas >= 0),
    genera_pasajes BOOLEAN DEFAULT FALSE NOT NULL,            -- Por defecto NO genera pasajes
    monto_pasaje DECIMAL(10, 2) DEFAULT 0.00 NOT NULL CHECK (monto_pasaje >= 0),
    aprobado_pastoral BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- ====================================================================
-- 17. TABLA: REGISTROS_ASISTENCIA (P-16: Marcación de jornadas y aprobación)
-- ====================================================================
CREATE TABLE registros_asistencia (
    id SERIAL PRIMARY KEY,
    id_asignacion INT NOT NULL REFERENCES asignaciones_ubicacion(id) ON DELETE CASCADE,
    actividad_emergente_id INT REFERENCES actividades_emergentes(id) ON DELETE SET NULL,
    es_actividad_emergente BOOLEAN DEFAULT FALSE NOT NULL,
    fecha DATE NOT NULL,
    hora_ingreso TIME NOT NULL,
    hora_salida TIME NOT NULL,
    horas_calculadas DECIMAL(5, 2) DEFAULT 4.00 NOT NULL CHECK (horas_calculadas >= 0),
    tareas_realizadas TEXT NOT NULL,
    estado_aprobacion estado_asistencia_enum DEFAULT 'REGISTRADO' NOT NULL,
    aprobado_por_catolider_id INT REFERENCES usuarios(id) ON DELETE SET NULL,
    observaciones_aprobacion TEXT,
    conciliado_en_planilla BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- ====================================================================
-- 18. TABLA: CONCILIACIONES_MENSUALES_SUPERVISOR (P-16: Planillas físicas de centros)
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
-- 19. TABLA: LIQUIDACIONES_PASAJES (P-17: Cálculo automatizado y descargo contable)
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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT uq_liquidacion_asignacion_mes_anio UNIQUE (id_asignacion, mes, anio)
);

-- ====================================================================
-- 20. TABLA: REPORTES_SEMAFORO (P-19: Evaluación cualitativa mensual del Catolíder)
-- ====================================================================
CREATE TABLE reportes_semaforo (
    id SERIAL PRIMARY KEY,
    id_asignacion INT NOT NULL REFERENCES asignaciones_ubicacion(id) ON DELETE CASCADE,
    mes VARCHAR(50) NOT NULL,
    anio INT NOT NULL CHECK (anio >= 2020),
    color_semaforo color_semaforo_enum NOT NULL,
    -- Justificación en texto obligatoria requerida por Pastoral UCB
    justificacion_obligatoria TEXT NOT NULL,
    notificar_abandono BOOLEAN DEFAULT FALSE NOT NULL,
    catolider_evaluador_id INT REFERENCES usuarios(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT uq_reporte_asignacion_mes_anio UNIQUE (id_asignacion, mes, anio)
);

-- ====================================================================
-- 21. TABLA: PREMIOS_HISTORICOS (P-20: Podio y reconocimientos Base Madre)
-- ====================================================================
CREATE TABLE premios_historicos (
    id SERIAL PRIMARY KEY,
    id_usuario INT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    semestre_id INT NOT NULL REFERENCES semestres(id) ON DELETE RESTRICT,
    proyecto_id INT REFERENCES proyectos_receptores(id) ON DELETE SET NULL,
    nombre_premio VARCHAR(150) NOT NULL,                      -- Ej: 'Catovoluntario Destacado', 'Beca Misión Carmen Pampa'
    categoria VARCHAR(100),                                   -- Ej: 'Liderazgo en Campo', 'Puntualidad y Compromiso'
    descripcion TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- ====================================================================
-- 22. TABLA: EVALUACIONES_PROYECTOS_RECEPTORES (P-21: Cierre y feedback libre)
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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT uq_evaluacion_proyecto_semestre UNIQUE (proyecto_id, semestre_id)
);

-- ====================================================================
-- 23. TABLA: NOTIFICACIONES_SISTEMA (Alertas internas y movimientos)
-- ====================================================================
CREATE TABLE notificaciones_sistema (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    titulo VARCHAR(150) NOT NULL,
    mensaje TEXT NOT NULL,
    tipo VARCHAR(50) DEFAULT 'INFO' NOT NULL,                 -- 'INFO', 'ALERTA', 'REASIGNACION', 'DOCUMENTO_OBSERVADO'
    leida BOOLEAN DEFAULT FALSE NOT NULL,
    enlace_destino VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- ====================================================================
-- 24. TRIGGERS AUTOMÁTICOS
-- ====================================================================

-- A) Trigger para timestamps automáticos
CREATE TRIGGER tr_semestres_updated_at BEFORE UPDATE ON semestres FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();
CREATE TRIGGER tr_usuarios_updated_at BEFORE UPDATE ON usuarios FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();
CREATE TRIGGER tr_perfiles_voluntario_updated_at BEFORE UPDATE ON perfiles_voluntario FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();
CREATE TRIGGER tr_proyectos_receptores_updated_at BEFORE UPDATE ON proyectos_receptores FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();
CREATE TRIGGER tr_postulaciones_updated_at BEFORE UPDATE ON postulaciones FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();
CREATE TRIGGER tr_catolideres_semestre_updated_at BEFORE UPDATE ON catolideres_semestre FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();
CREATE TRIGGER tr_entrevistas_updated_at BEFORE UPDATE ON entrevistas FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();
CREATE TRIGGER tr_evaluaciones_psicologicas_updated_at BEFORE UPDATE ON evaluaciones_psicologicas FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();
CREATE TRIGGER tr_documentos_voluntario_updated_at BEFORE UPDATE ON documentos_voluntario FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();
CREATE TRIGGER tr_sesiones_induccion_updated_at BEFORE UPDATE ON sesiones_induccion FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();
CREATE TRIGGER tr_asignaciones_ubicacion_updated_at BEFORE UPDATE ON asignaciones_ubicacion FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();
CREATE TRIGGER tr_actividades_emergentes_updated_at BEFORE UPDATE ON actividades_emergentes FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();
CREATE TRIGGER tr_registros_asistencia_updated_at BEFORE UPDATE ON registros_asistencia FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();
CREATE TRIGGER tr_liquidaciones_pasajes_updated_at BEFORE UPDATE ON liquidaciones_pasajes FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();
CREATE TRIGGER tr_reportes_semaforo_updated_at BEFORE UPDATE ON reportes_semaforo FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();
CREATE TRIGGER tr_premios_historicos_updated_at BEFORE UPDATE ON premios_historicos FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();
CREATE TRIGGER tr_evaluaciones_proyectos_updated_at BEFORE UPDATE ON evaluaciones_proyectos_receptores FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();

-- B) Trigger de Seguridad: Habilitación de Campo sujeta a Póliza + Inducción
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

-- C) Trigger de Actualización de Nivel en Base Madre según Horas Acumuladas
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
-- 25. ÍNDICES ESTRATÉGICOS PARA CONSULTAS Y FILTROS RÁPIDOS
-- ====================================================================
CREATE INDEX idx_usuarios_email ON usuarios(email);
CREATE INDEX idx_usuarios_ci ON usuarios(ci);
CREATE INDEX idx_usuarios_rol ON usuarios(rol);

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

-- ====================================================================
-- 26. DATOS SEMILLA (SEED DATA) REALES PARA PRUEBAS Y VALIDACIÓN
-- Contraseña general de prueba para todos: Password123!
-- Hash bcrypt: $2b$10$OrDEhhyULmAJUOzaWT1PbezSxJfXP0pbI6/njlkrkQCRvnVoBZxkC
-- ====================================================================

-- A) Semestre Activo
INSERT INTO semestres (id, codigo, nombre, fecha_inicio, fecha_fin, activo) VALUES
(1, '2/2026', 'Gestión Académica Semestre 2/2026', '2026-08-01', '2026-12-15', TRUE);

-- B) Usuarios del Sistema
INSERT INTO usuarios (id, ci, email, password_hash, nombres, primer_apellido, segundo_apellido, rol, telefono, carrera, semestre_ingreso) VALUES
(1, '4892301LP', 'andrea.moscoso@ucb.edu.bo', '$2b$10$OrDEhhyULmAJUOzaWT1PbezSxJfXP0pbI6/njlkrkQCRvnVoBZxkC', 'Andrea', 'Moscoso', 'Valdivia', 'ADMIN_PASTORAL', '71523489', 'Pastoral Universitaria', '1/2023'),
(2, '6789123LP', 'catolider.santiago@ucb.edu.bo', '$2b$10$OrDEhhyULmAJUOzaWT1PbezSxJfXP0pbI6/njlkrkQCRvnVoBZxkC', 'Santiago', 'Montes', 'Roca', 'CATOLIDER', '76543210', 'Ingeniería de Sistemas', '1/2024'),
(3, '8912345LP', 'voluntario.maria@ucb.edu.bo', '$2b$10$OrDEhhyULmAJUOzaWT1PbezSxJfXP0pbI6/njlkrkQCRvnVoBZxkC', 'María Belén', 'Flores', 'Mendoza', 'VOLUNTARIO', '70654321', 'Psicología', '2/2024'),
(4, '9876543LP', 'postulante.carlos@ucb.edu.bo', '$2b$10$OrDEhhyULmAJUOzaWT1PbezSxJfXP0pbI6/njlkrkQCRvnVoBZxkC', 'Carlos Andrés', 'Quispe', 'Mamani', 'POSTULANTE', '78901234', 'Comunicación Social', '2/2026'),
(5, '5432167LP', 'docente.pastoral@ucb.edu.bo', '$2b$10$OrDEhhyULmAJUOzaWT1PbezSxJfXP0pbI6/njlkrkQCRvnVoBZxkC', 'Rodrigo', 'Gutiérrez', 'Paz', 'DOCENTE_SUPERVISOR', '72098765', 'Teología y Pastoral', '1/2022'),
(6, '7712398LP', 'psicologa.carolina@ucb.edu.bo', '$2b$10$OrDEhhyULmAJUOzaWT1PbezSxJfXP0pbI6/njlkrkQCRvnVoBZxkC', 'Carolina', 'Vargas', 'Rios', 'ADMIN_PASTORAL', '71298456', 'Psicología Clínica UCB', '1/2024');

-- C) Perfiles Base Madre
INSERT INTO perfiles_voluntario (user_id, tipo_relacion_ucb, fecha_nacimiento, zona_residencia, habilidades_destacadas, tres_palabras_personalidad, experiencia_previa, horas_totales_historicas, nivel, es_menor_edad) VALUES
(2, 'Estudiante Regular', '2003-05-14', 'Miraflores', 'Liderazgo, Oratoria, Primeros Auxilios', 'Paciencia, Compromiso, Valentía', TRUE, 72.00, 'SUPER_PRO', FALSE),
(3, 'Estudiante Regular', '2004-09-22', 'Sopocachi', 'Escucha activa, Talleres lúdicos, Teatro', 'Empatía, Calidez, Alegría', TRUE, 48.00, 'PRO', FALSE),
(4, 'Estudiante Regular', '2005-04-12', 'Obrajes', 'Fotografía, Redacción, Apoyo escolar', 'Dinamismo, Creatividad, Constancia', FALSE, 0.00, 'JUNIOR', FALSE);

-- D) Proyectos Receptores Oficiales
INSERT INTO proyectos_receptores (id, nombre_proyecto, direccion_exacta, macrodistrito_zona, supervisor_nombre, supervisor_telefono, supervisor_email, fecha_inicio_convenio, fecha_fin_convenio, poblacion_objetivo, actividades_semestre_actual, monto_pasaje_por_dia, cupo_maximo, cupo_ocupado, catolider_titular_id) VALUES
(1, 'Hogar San Ramón (Adultos Mayores)', 'Av. Hernando Siles, Calle 12 Obrajes', 'Sur - Obrajes', 'Hna. Rosario Peñaranda', '2783412', 'sanramon@pastoral.org', '2026-02-01', '2026-12-15', 'Adultos Mayores / Geriatría y Memoria', 'Acompañamiento en comedor, talleres de estimulación cognitiva, lectura y fisioterapia suave.', 10.00, 25, 24, 2),
(2, 'Comedor San Calixto (Personas en Calle)', 'Calle Indaburo esquina Pichincha s/n', 'Centro - San Calixto', 'P. Marcos Villarroel', '2405678', 'comedor.calixto@pastoral.org', '2026-02-01', '2026-12-15', 'Personas en situación de vulnerabilidad extrema y calle', 'Servicio de mesas, apoyo en cocina, entrega de alimentos calientes y escucha activa.', 10.00, 20, 18, 2),
(3, 'Hospital del Niño - Área Lúdica', 'Av. Saavedra, Miraflores', 'Centro - Miraflores', 'Lic. Gabriela Torrico', '2245678', 'ludoteca.hn@salud.gob.bo', '2026-02-01', '2026-12-15', 'Niñez y salud pediátrica', 'Dinámicas de clown hospitalario, lectura de cuentos y apoyo escolar a pacientes internados.', 12.00, 15, 15, 2),
(4, 'Centro Terapéutico Kallpa (Discapacidad)', 'Calle 21 de Calacoto, Esq. Inofuentes', 'Sur - Calacoto', 'Lic. Daniela Zuazo', '2791234', 'kallpa.bolivia@gmail.com', '2026-02-01', '2026-12-15', 'Jóvenes y adultos con discapacidad psicomotriz y autismo', 'Talleres ocupacionales, hidroterapia asistida y dinámicas de socialización comunitaria.', 15.00, 18, 12, 2),
(5, 'Aldeas Infantiles SOS Mallasa', 'Av. Principal Mallasa s/n', 'Mallasa - Valencia', 'Lic. Marcelo Céspedes', '2745678', 'mallasa@aldeasinfantiles.org.bo', '2026-02-01', '2026-12-15', 'Primera infancia, niñas y niños en desamparo', 'Refuerzo escolar en matemáticas y lenguaje, talleres de robótica básica y juegos al aire libre.', 20.00, 20, 11, 2);

-- E) Catolíderes del Semestre (P-06B)
INSERT INTO catolideres_semestre (user_id, semestre_id, proyecto_id, tipo_catolider, modalidad, activo) VALUES
(2, 1, 1, 'TITULAR', 'CAMPO_Y_GESTION', TRUE);

-- F) Postulación de Prueba (P-04, P-05)
INSERT INTO postulaciones (id, codigo_postulacion, user_id, semestre_id, tipo_relacion_ucb, carrera, zona_residencia, fecha_nacimiento, edad_calculada, numero_materias, tiene_materias_pesadas, actividades_extracurriculares, menor_edad, autorizacion_padres, experiencia_previa, habilidades, tres_palabras_personalidad, poblaciones_interes, compromiso_4h_semanales, compromiso_induccion, estado_postulacion) VALUES
(1, 'POST-2026-0842', 4, 1, 'Estudiante Regular', 'Comunicación Social', 'Obrajes', '2005-04-12', 21, 5, FALSE, 1, FALSE, TRUE, FALSE, 'Fotografía, Apoyo escolar, Redacción', 'Empatía, Compromiso, Dinamismo', 'Adultos mayores, Niñez', TRUE, TRUE, 'APTO_ENTREVISTA');

-- G) Entrevista Agendada (P-07, P-08)
INSERT INTO entrevistas (id, postulacion_id, catolider_id, fecha_hora_programada, estado, apertura_religiosa_escala, proyecto_receptor_sugerido_id, observaciones_recomendaciones, dictamen) VALUES
(1, 1, 2, '2026-08-15 15:00:00-04', 'ASISTIO', 9, 1, 'Joven con alta madurez emocional y vocación social. Perfil óptimo para acompañamiento de adultos mayores en Hogar San Ramón.', 'RECOMENDADO');

-- H) Evaluación Psicológica E-SRE (P-09)
INSERT INTO evaluaciones_psicologicas (id, postulacion_id, psicologo_id, puntaje_global_esre, subdimensiones_esre, dictamen, poblaciones_sugeridas, observaciones_confidenciales, informe_pdf_url) VALUES
(1, 1, 6, 8.75, '{"eficacia": 8.5, "proactividad": 9.0, "socializacion": 8.8, "gestion_personal": 8.7}'::jsonb, 'APROBADO', 'Adultos Mayores, Niñez y Acompañamiento Escolar', 'Perfil empático y equilibrado; apto para dinámicas de estimulación cognitiva.', 'https://pub-catovoluntarios.r2.dev/evaluaciones_psicologicas/informe_esre_POST-2026-0842.pdf');

-- I) Documentos Habilitantes y Póliza UCB (P-10, P-11)
INSERT INTO documentos_voluntario (user_id, semestre_id, tipo_documento, archivo_url, nombre_archivo_original, mime_type, peso_bytes, numero_poliza, vigencia_inicio, vigencia_fin, estado, validado_por, fecha_validacion) VALUES
(3, 1, 'POLIZA_ACCIDENTES_APC7083', 'https://pub-catovoluntarios.r2.dev/documentos/poliza_APC7083_maria_flores.pdf', 'Poliza_Seguro_APC-7083.pdf', 'application/pdf', 1048576, 'APC-7083', '2026-08-01', '2026-12-31', 'APROBADO', 1, '2026-08-10 11:30:00-04'),
(3, 1, 'COMPROMISO_VOLUNTARIADO', 'https://pub-catovoluntarios.r2.dev/documentos/compromiso_maria_flores.pdf', 'Compromiso_Pastoral_Firmado.pdf', 'application/pdf', 524288, NULL, NULL, NULL, 'APROBADO', 1, '2026-08-10 11:35:00-04');

-- J) Sesión de Inducción y Asistencia (P-12)
INSERT INTO sesiones_induccion (id, semestre_id, titulo, fecha_hora, modalidad, lugar_enlace, facilitador) VALUES
(1, 1, 'Inducción General y Carisma de Servicio Pastoral 2/2026', '2026-08-12 18:00:00-04', 'PRESENCIAL', 'Auditorio 1 Bloque Central UCB', 'Lic. Andrea Moscoso');

INSERT INTO asistencias_induccion (sesion_induccion_id, user_id, asistio) VALUES
(1, 3, TRUE);

-- K) Asignación en Campo (P-14)
INSERT INTO asignaciones_ubicacion (id, id_usuario, id_proyecto, semestre_id, condicion, horario_comprometido, poliza_validada, induccion_completada, habilitado_campo, activo) VALUES
(1, 3, 1, 1, 'ANTIGUO', 'Sábados de 09:00 a 13:00', TRUE, TRUE, TRUE, TRUE);

-- L) Registros de Asistencia Diaria (P-16)
INSERT INTO registros_asistencia (id, id_asignacion, fecha, hora_ingreso, hora_salida, horas_calculadas, tareas_realizadas, estado_aprobacion, aprobado_por_catolider_id, observaciones_aprobacion) VALUES
(1, 1, '2026-11-07', '09:00', '13:00', 4.00, 'Taller de estimulación de la memoria con el grupo B y partida de ajedrez guiada.', 'APROBADO_CATOLIDER', 2, 'Puntual y muy participativa.'),
(2, 1, '2026-11-14', '09:00', '13:00', 4.00, 'Apoyo en la merienda comunitaria y lectura guiada de periódicos locales.', 'APROBADO_CATOLIDER', 2, 'Excelente desenvolvimiento en sala común.');

-- M) Conciliación Mensual con Supervisor Externo (P-16)
INSERT INTO conciliaciones_mensuales_supervisor (id, proyecto_id, semestre_id, mes, anio, reporte_firmas_supervisor_url, total_voluntarios_reportados, total_dias_asistidos, monto_total_pasajes, conciliado_por) VALUES
(1, 1, 1, 11, 2026, 'https://pub-catovoluntarios.r2.dev/conciliaciones/reporte_firmas_san_ramon_nov2026.pdf', 24, 96, 960.00, 1);

-- N) Liquidación de Pasajes (P-17)
INSERT INTO liquidaciones_pasajes (id, id_asignacion, mes, anio, dias_presenciales_asistidos, tarifa_diaria_aplicada, monto_total_reponer, estado_pago, recibi_conforme_firmado_url) VALUES
(1, 1, 11, 2026, 2, 10.00, 20.00, 'PENDIENTE_FIRMA', 'https://pub-catovoluntarios.r2.dev/liquidaciones/recibi_conforme_maria_flores_nov2026.pdf');

-- O) Reporte de Semáforo Mensual (P-19)
INSERT INTO reportes_semaforo (id, id_asignacion, mes, anio, color_semaforo, justificacion_obligatoria, notificar_abandono, catolider_evaluador_id) VALUES
(1, 1, 'Noviembre', 2026, 'MORADO', 'María Belén demuestra un liderazgo inspirador con los adultos mayores, puntualidad intachable y excelente iniciativa grupal.', FALSE, 2);

-- P) Premios Históricos y Podio (P-20)
INSERT INTO premios_historicos (id, id_usuario, semestre_id, proyecto_id, nombre_premio, categoria, descripcion) VALUES
(1, 3, 1, 1, 'Catovoluntario Destacado Pastoral UCB', 'Liderazgo en Campo', 'Reconocimiento al compromiso y vocación de servicio con más de 48 horas ejecutadas en el Hogar San Ramón.');

-- Q) Evaluación Semestral del Proyecto Receptor (P-21)
INSERT INTO evaluaciones_proyectos_receptores (id, proyecto_id, semestre_id, voluntarios_recibidos, voluntarios_culminados, calificacion_grupo, calificacion_catolider, solicita_continuidad_convenio, cupos_solicitados_proximo_semestre, bloque4_observaciones_sugerencias_libres, nombre_responsable_llenado, cargo_responsable, documento_respaldo_url) VALUES
(1, 1, 1, 24, 23, 5, 5, TRUE, 25, 'Los jóvenes de la Universidad Católica han sido de gran bendición para nuestros abuelitos. Su calidez, alegría y puntualidad iluminan las mañanas de los sábados. Deseamos renovar y ampliar cupos para el próximo semestre.', 'Hna. Rosario Peñaranda', 'Directora Hogar San Ramón', 'https://pub-catovoluntarios.r2.dev/evaluaciones_centros/acta_cierre_san_ramon_2026.pdf');

-- Sincronizar secuencias automáticas de IDs
SELECT setval('semestres_id_seq', (SELECT MAX(id) FROM semestres));
SELECT setval('usuarios_id_seq', (SELECT MAX(id) FROM usuarios));
SELECT setval('perfiles_voluntario_id_seq', (SELECT MAX(id) FROM perfiles_voluntario));
SELECT setval('proyectos_receptores_id_seq', (SELECT MAX(id) FROM proyectos_receptores));
SELECT setval('postulaciones_id_seq', (SELECT MAX(id) FROM postulaciones));
SELECT setval('catolideres_semestre_id_seq', (SELECT MAX(id) FROM catolideres_semestre));
SELECT setval('entrevistas_id_seq', (SELECT MAX(id) FROM entrevistas));
SELECT setval('evaluaciones_psicologicas_id_seq', (SELECT MAX(id) FROM evaluaciones_psicologicas));
SELECT setval('documentos_voluntario_id_seq', (SELECT MAX(id) FROM documentos_voluntario));
SELECT setval('sesiones_induccion_id_seq', (SELECT MAX(id) FROM sesiones_induccion));
SELECT setval('asistencias_induccion_id_seq', (SELECT MAX(id) FROM asistencias_induccion));
SELECT setval('asignaciones_ubicacion_id_seq', (SELECT MAX(id) FROM asignaciones_ubicacion));
SELECT setval('actividades_emergentes_id_seq', (SELECT COALESCE(MAX(id), 1) FROM actividades_emergentes));
SELECT setval('registros_asistencia_id_seq', (SELECT MAX(id) FROM registros_asistencia));
SELECT setval('conciliaciones_mensuales_supervisor_id_seq', (SELECT MAX(id) FROM conciliaciones_mensuales_supervisor));
SELECT setval('liquidaciones_pasajes_id_seq', (SELECT MAX(id) FROM liquidaciones_pasajes));
SELECT setval('reportes_semaforo_id_seq', (SELECT MAX(id) FROM reportes_semaforo));
SELECT setval('premios_historicos_id_seq', (SELECT MAX(id) FROM premios_historicos));
SELECT setval('evaluaciones_proyectos_receptores_id_seq', (SELECT MAX(id) FROM evaluaciones_proyectos_receptores));
