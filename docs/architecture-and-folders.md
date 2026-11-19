# ARQUITECTURA Y ESTRUCTURA DE CARPETAS — BACKEND CATOVOLUNTARIOS
**Sistema Web de Gestión Integral del Programa Catovoluntarios (Pastoral UCB)**  
*Tecnologías: NestJS 11 + TypeScript + PostgreSQL + ConfigModule + Class-Validator*

---

## 1. PRINCIPIOS DE DISEÑO ARQUITECTURAL
El backend está diseñado siguiendo los principios de **Clean Architecture**, **Inyección de Dependencias (IoC)** y **Módulos de Dominio Desacoplados (Domain-Driven Modules)** propios del ecosistema NestJS:
1. **Alta Cohesión y Bajo Acoplamiento:** Cada dominio funcional del sistema (Usuarios, Postulaciones, Entrevistas, Documentos, Proyectos, Asistencias, Pasajes, Semáforos) se encapsula en su propio módulo independiente con su Controller, Service, DTOs y Entidades.
2. **Validación Declarativa Fuerte:** Uso estricto de DTOs (*Data Transfer Objects*) validados mediante decoradores de `class-validator` en todas las entradas (`POST`, `PUT`, `PATCH`).
3. **Seguridad y Control de Acceso (RBAC):** Guards globales y decoradores personalizados (`@Roles()`, `@Auth()`) para restringir endpoints según los roles aprobados: `ADMIN_PASTORAL`, `CATOLIDER`, `VOLUNTARIO`, `POSTULANTE`.
4. **CORS Centralizado:** Configuración nativa en `main.ts` permitiendo la interacción fluida con el frontend (`http://localhost:5173`).

---

## 2. ESTRUCTURA COMPLETA DE CARPETAS

```
Catovoluntarios-Backend/
├── .env.example                     # Variables de entorno modelo
├── .env                             # Variables de entorno locales
├── .prettierrc                      # Formateo de código
├── AGENTS.md                        # Directrices obligatorias para agentes IA
├── CLAUDE.md                        # Espejo de directrices para agentes
├── nest-cli.json                    # Configuración de compilación NestJS
├── package.json                     # Dependencias y scripts
├── tsconfig.json                    # TypeScript compiler options
├── tsconfig.build.json              # Configuración de build de producción
│
├── docs/                            # Documentación técnica del backend
│   ├── architecture-and-folders.md  # Este archivo
│   ├── git-workflow.md              # Protocolo obligatorio de Git (Fetch previo)
│   └── requirements.md              # Requerimientos de endpoints, lógica y base de datos
│
└── src/
    ├── common/                      # Recursos transversales compartidos
    │   ├── decorators/              # @GetUser(), @Roles(), @Public()
    │   ├── filters/                 # HttpExceptionFilter global
    │   ├── guards/                  # JwtAuthGuard, RolesGuard
    │   ├── interceptors/            # LoggingInterceptor, TransformInterceptor
    │   ├── pipes/                   # Custom ValidationPipes (ParseCI, ParseDate)
    │   └── dtos/                    # PaginationDto, BaseResponseDto
    │
    ├── config/                      # Configuración de entorno y servicios
    │   ├── app.config.ts            # Puerto, entorno, CORS
    │   └── database.config.ts       # Parámetros de conexión a PostgreSQL
    │
    ├── database/                    # Capa de persistencia y migraciones
    │   ├── entities/                # Entidades maestras de base de datos
    │   └── migrations/              # Scripts de migración SQL versionados
    │
    ├── modules/                     # Módulos organizados por dominio
    │   │
    │   ├── auth/                    # Autenticación, JWT, Login y Reseteo
    │   │   ├── auth.controller.ts   # /api/auth/login, /api/auth/refresh
    │   │   ├── auth.service.ts      # Verificación de credenciales y emisión de tokens
    │   │   ├── strategies/          # JwtStrategy, LocalStrategy
    │   │   └── dtos/                # LoginDto, RegisterDto, ForgotPasswordDto
    │   │
    │   ├── users/                   # Gestión de usuarios, roles y perfiles
    │   │   ├── users.controller.ts  # /api/users
    │   │   ├── users.service.ts     # CRUD y asignación de roles
    │   │   └── entities/            # UserEntity (ci, email, rol, activo)
    │   │
    │   ├── postulaciones/           # Wizard de postulación y filtros (P-04 a P-06B)
    │   │   ├── postulaciones.controller.ts
    │   │   ├── postulaciones.service.ts # Regla dura: bloqueo si materias > 6
    │   │   ├── dtos/                # CreatePostulacionDto, UpdatePostulacionDto
    │   │   └── entities/            # PostulacionEntity
    │   │
    │   ├── entrevistas/             # Agendamiento, ficha y psicología E-SRE (P-07 a P-09)
    │   │   ├── entrevistas.controller.ts
    │   │   ├── entrevistas.service.ts
    │   │   └── entities/            # EntrevistaEntity, EvaluacionPsicologicaEntity
    │   │
    │   ├── documentacion/           # Pólizas, cartas de menores e inducción (P-10 a P-12)
    │   │   ├── documentacion.controller.ts
    │   │   ├── documentacion.service.ts # Candado: poliza_validada obligatoria
    │   │   └── entities/            # DocumentoEntity, PolizaEntity
    │   │
    │   ├── proyectos/               # Proyectos receptores y tarifas fijas (P-13)
    │   │   ├── proyectos.controller.ts
    │   │   ├── proyectos.service.ts
    │   │   └── entities/            # ProyectoReceptorEntity
    │   │
    │   ├── ubicacion/               # Emparejamiento demográfico y traslados (P-14, P-15)
    │   │   ├── ubicacion.controller.ts
    │   │   ├── ubicacion.service.ts
    │   │   └── entities/            # AsignacionEntity, ReasignacionHistorialEntity
    │   │
    │   ├── asistencia/              # Registro de jornada y aprobación (P-16)
    │   │   ├── asistencia.controller.ts
    │   │   ├── asistencia.service.ts # Flujo: voluntario -> líder -> supervisor
    │   │   └── entities/            # RegistroAsistenciaEntity
    │   │
    │   ├── pasajes/                 # Liquidación contable fija (P-17)
    │   │   ├── pasajes.controller.ts
    │   │   ├── pasajes.service.ts   # Cálculo: días asistidos * tarifa fija
    │   │   └── entities/            # PlanillaPasajesEntity
    │   │
    │   ├── portal-voluntario/       # Horas, gamificación y emergentes (P-18)
    │   │   ├── portal-voluntario.controller.ts
    │   │   ├── portal-voluntario.service.ts
    │   │   └── entities/            # ActividadEmergenteEntity
    │   │
    │   └── semaforos/               # Semáforos, Base Madre y Certificados (P-19 a P-21)
    │       ├── semaforos.controller.ts
    │       ├── semaforos.service.ts
    │       └── entities/            # ReporteSemaforoEntity, PremioEntity
    │
    ├── app.controller.ts            # Health check endpoint (/api/health)
    ├── app.service.ts               # Servicio base
    ├── app.module.ts                # Módulo raíz que importa los sub-módulos
    └── main.ts                      # Bootstrap, CORS, ValidationPipe y prefijo /api
```

---

## 3. CONVENCIONES DE CÓDIGO PARA AGENTES
1. **Controladores Limpios:** Los controladores solo deben recibir peticiones, ejecutar validación de DTOs y delegar el flujo a los servicios. No colocar lógica de negocio en los controladores.
2. **Uso de Transacciones en Operaciones Complejas:** Toda operación que involucre más de una tabla (ej. Admitir postulante y crear usuario con rol `Voluntario`) debe ejecutarse dentro de una transacción de base de datos.
3. **Manejo Estandarizado de Errores:** Utilizar las excepciones integradas de NestJS (`BadRequestException`, `UnauthorizedException`, `ForbiddenException`, `NotFoundException`, `ConflictException`).
