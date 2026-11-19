# REQUERIMIENTOS TÉCNICOS, ENDPOINTS Y REGLAS DE NEGOCIO — BACKEND
**Programa Catovoluntarios (Pastoral UCB La Paz)**  
*Módulos Funcionales y Reglas de Dominio*

---

## 1. ENDPOINTS Y LÓGICA DE NEGOCIO POR MÓDULO

### M01: Autenticación, Usuarios y Permisos RBAC
* `POST /api/auth/login`: Autenticación con email y password. Devuelve JWT con payload: `{ sub: id, email, rol, nombres, ci }`.
* `POST /api/auth/forgot-password`: Genera token temporal de reseteo (expiración: 15 minutos).
* `POST /api/auth/reset-password`: Actualización de contraseña con token válido.
* `GET /api/users/profile`: Consulta de perfil del usuario en sesión.
* `POST /api/users/reset-catolideres`: Endpoint exclusivo de Admin Pastoral para reiniciar los roles de liderazgo al inicio de cada semestre.

### M02: Admisión y Postulaciones (Filtro Anti-Sobrecarga)
* `POST /api/postulaciones`: Envío del formulario público de postulación en 4 pasos.
  * **Regla Dura Backend (RF-03):** Si `numero_materias > 6`, lanzar `BadRequestException('No se permite postular con más de 6 materias inscritas por normativa anti-sobrecarga de Pastoral')`.
  * Si `fecha_nacimiento` resulta en `< 18 años`, exigir `autorizacion_padres = true`.
  * Genera código alfanumérico único de postulación (ej. `POST-2026-0842`) y crea usuario provisional con rol `POSTULANTE`.
* `GET /api/postulaciones`: Consulta filtrable de postulantes.
  * Permiso: `ADMIN_PASTORAL` (Lectura y Escritura) y `CATOLIDER` (**Solo Lectura / Consulta**).
* `PATCH /api/postulaciones/:id/estado`: Cambio de estado (`APTO_ENTREVISTA`, `OBSERVADO_SOBRECARGA`, `DESCARTADO`).

### M03: Entrevistas y Evaluación Psicológica E-SRE
* `GET /api/entrevistas/disponibilidad`: Franjas horarias de entrevista abiertas por semana.
* `POST /api/entrevistas/agendar`: Reserva de cita por parte del postulante.
* `PATCH /api/entrevistas/:id/asistencia`: Marcado de estado (`ASISTIO`, `FALTO`, `REPROGRAMAR`).
* `POST /api/entrevistas/:id/ficha`: Registro de la ficha semiestructurada del Catolíder (Observaciones, escala 1-10 y proyecto receptor sugerido).
* `POST /api/psicologia/evaluacion`: Registro del informe clínico E-SRE.
  * Restricción: Exclusivo `PSICOLOGO` y `ADMIN_PASTORAL`.
  * **Campo Obligatorio:** `poblaciones_sugeridas` (Array de strings con poblaciones aptas).

### M04: Habilitación Documental y Seguro Estudiantil
* `POST /api/documentos/upload`: Subida multipart de Póliza UCB (`APC-7083`), Compromiso y CI.
* `GET /api/documentos/modelo-carta-menores`: Descarga del modelo oficial de carta para padres.
* `PATCH /api/documentos/:id/validar`: Aprobación u observación por parte de Pastoral.
* **Candado Crítico de Seguridad:** El campo `habilitado_campo` permanece en `false` hasta que `poliza_validada = true` e `induccion_completada = true`.

### M05: Proyectos Receptores y Ubicación
* `GET /api/proyectos`: Listado de los centros con sus cupos, población atendida, actividades semestrales y **tarifa fija de pasajes**.
* `POST /api/proyectos`: Alta o modificación de un proyecto receptor.
* `GET /api/ubicacion/tablero`: Matriz de asignación en tiempo real con datos de postulantes (nombre, celular visible, carrera, nuevo/antiguo, edad y cruce con población sugerida por el psicólogo).
* `POST /api/ubicacion/asignar`: Vinculación de un voluntario a un proyecto receptor.
* `POST /api/ubicacion/reasignar`: Traslado del primer mes con generación de notificaciones internas.

### M06: Control de Asistencia y Liquidación de Pasajes
* `POST /api/asistencia/marcar`: Registro de jornada por parte del Catovoluntario.
* `PATCH /api/asistencia/:id/aprobar`: Aprobación preliminar por parte del Catolíder.
* `POST /api/asistencia/conciliar`: Cierre mensual cruzado con la planilla de firmas del supervisor externo del centro.
* `GET /api/pasajes/planilla-macro`: Generación de planilla mensual por centro.
  * **Fórmula de cálculo:** $\text{Días Presenciales Asistidos} \times \text{Tarifa Fija del Proyecto}$.
* `GET /api/pasajes/planilla-individual/:voluntarioId`: Generación de hoja de *"Recibí Conforme"* para firma física del estudiante.
* `POST /api/portal-voluntario/actividades-emergentes`: Registro de participación en actividades extraordinarias convocadas por Pastoral (sin pasajes por defecto).

### M07: Semáforos, Base Madre y Certificados
* `POST /api/semaforos/reporte-mensual`: Registro mensual del semáforo (`Verde`, `Amarillo`, `Rojo`, `Morado`) con **justificación obligatoria en texto**.
* `GET /api/base-madre`: Consulta histórica consolidada con columna de cantidad de premios recibidos y desglose histórico.
* `POST /api/base-madre/premios`: Asignación de reconocimientos y fotografías al podio semestral.
* `POST /api/proyectos/feedback-semestral`: Registro de la evaluación semestral del centro con el Bloque 4 de sugerencias y comentarios libres.
* `GET /api/certificados/plantilla-datos`: Endpoint que consolida los datos del voluntario (nombre, CI, proyecto, actividades y horas) para exportar y copiar al portapapeles.
