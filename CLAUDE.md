# INSTRUCCIONES DE DESARROLLO PARA AGENTES IA — BACKEND CATOVOLUNTARIOS

Este archivo define las normas de arquitectura, diseño y desarrollo que **TODO AGENTE IA** debe seguir sin excepción en este repositorio backend.

---

## 1. LECTURA PREVIA OBLIGATORIA
Antes de generar código, endpoints o migraciones, debes consultar:
* **Arquitectura y Carpetas:** `docs/architecture-and-folders.md`
* **Protocolo Git Obligatorio:** `docs/git-workflow.md` (Siempre ejecutar `git fetch origin main` antes de push)
* **Requerimientos y Endpoints:** `docs/requirements.md`

---

## 2. REGLAS ARQUITECTURALES DE NESTJS Y POSTGRESQL (TYPEORM)
1. **Modularidad Estricta:**
   * Cada funcionalidad debe encapsularse en su respectivo módulo dentro de `src/modules/<dominio>/`.
   * Todo módulo debe exportar sus servicios si son requeridos por otros módulos y registrarse en `app.module.ts`.
2. **Persistencia con PostgreSQL y TypeORM:**
   * El motor de base de datos oficial es **PostgreSQL**.
   * Toda entidad debe extender de `BaseEntity` (`src/common/entities/base.entity.ts`) o definir columnas `createdAt` y `updatedAt` con tipos `timestamp with time zone`.
   * En desarrollo, `synchronize: true` se maneja mediante variables de entorno; para cambios estructurales de producción se utilizan migraciones versionadas en `src/database/migrations/` mediante `npm run migration:generate` y `npm run migration:run`.
   * Inyectar repositorios utilizando `@InjectRepository(EntityName)`.
3. **Validación Declarativa en DTOs:**
   * Queda prohibido recibir datos en controladores sin un DTO tipado y validado mediante decoradores de `class-validator` (`@IsString()`, `@IsInt()`, `@IsEmail()`, `@Min()`, `@Max()`, `@IsOptional()`).
   * No usar `any` en parámetros o retornos de métodos.
4. **Control de Acceso y Seguridad (RBAC):**
   * Todo endpoint que no sea público debe estar protegido por `JwtAuthGuard` y el decorador de roles `@Roles('ADMIN_PASTORAL', 'CATOLIDER', ...)`.
   * Recordar que los Catolíderes solo tienen permiso de lectura/consulta en la bandeja de postulantes.
5. **Capa de Controladores Delgada y Transacciones:**
   * Los controladores únicamente reciben solicitudes HTTP, validan DTOs y llaman al servicio. Toda la lógica de negocio debe residir en los `Services`.
   * Toda operación multi-tabla crítica (ej. admisión de voluntario, asignación de proyecto) debe usar `DataSource.transaction()` o `QueryRunner` para asegurar consistencia ACID.
6. **Manejo Estandarizado de Excepciones:**
   * Utilizar siempre las excepciones HTTP nativas de `@nestjs/common` (`BadRequestException`, `NotFoundException`, `ForbiddenException`, `ConflictException`).

---

## 3. REGLAS DE NEGOCIO CRÍTICAS
* **Filtro Anti-Sobrecarga (RF-03):** En `postulaciones.service.ts`, si `numero_materias > 6`, retornar `BadRequestException`.
* **Seguro Obligatorio para Campo (RF-07):** El voluntario no puede registrar asistencias si `habilitado_campo` es `false`.
* **Cálculo Fijo de Pasajes (RF-17):** La reposición de transporte se calcula multiplicando los días presenciales asistidos por la tarifa fija del proyecto receptor. No admitir montos con centavos arbitrarios.

---

## 4. PROTOCOLO GIT OBLIGATORIO PARA AGENTES
Al preparar un commit o push:
```bash
git add .
git commit -m "feat(modulo): descripcion de la implementacion"
git fetch origin main
git rebase origin/main
git push origin <rama>
```
Asegurar siempre que `npm run build` ejecute sin errores de TypeScript antes de empujar cambios al repositorio remoto.
