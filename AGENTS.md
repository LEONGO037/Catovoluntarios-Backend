# INSTRUCCIONES DE DESARROLLO PARA AGENTES IA — BACKEND CATOVOLUNTARIOS

Este archivo define las normas de arquitectura, diseño y desarrollo que **TODO AGENTE IA** debe seguir sin excepción en este repositorio backend.

---

## 1. LECTURA PREVIA OBLIGATORIA
Antes de generar código, endpoints o migraciones, debes consultar:
* **Arquitectura y Carpetas:** `docs/architecture-and-folders.md`
* **Protocolo Git Obligatorio:** `docs/git-workflow.md` (Siempre ejecutar `git fetch origin main` antes de push)
* **Requerimientos y Endpoints:** `docs/requirements.md`

---

## 2. REGLAS ARQUITECTURALES DE NESTJS
1. **Modularidad Estricta:**
   * Cada funcionalidad debe encapsularse en su respectivo módulo dentro de `src/modules/<dominio>/`.
   * Todo módulo debe exportar sus servicios si son requeridos por otros módulos y registrarse en `app.module.ts`.
2. **Validación Declarativa en DTOs:**
   * Queda prohibido recibir datos en controladores sin un DTO tipado y validado mediante decoradores de `class-validator` (`@IsString()`, `@IsInt()`, `@IsEmail()`, `@Min()`, `@Max()`, `@IsOptional()`).
   * No usar `any` en parámetros o retornos de métodos.
3. **Control de Acceso y Seguridad (RBAC):**
   * Todo endpoint que no sea público debe estar protegido por `JwtAuthGuard` y el decorador de roles `@Roles('ADMIN_PASTORAL', 'CATOLIDER', ...)`.
   * Recordar que los Catolíderes solo tienen permiso de lectura/consulta en la bandeja de postulantes.
4. **Capa de Controladores Delgada:**
   * Los controladores únicamente reciben solicitudes HTTP, validan DTOs y llaman al servicio. Toda la lógica de negocio y las transacciones deben residir en los `Services`.
5. **Manejo Estandarizado de Excepciones:**
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
