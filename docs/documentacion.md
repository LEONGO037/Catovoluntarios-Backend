# Documentación Técnica - Módulo 07: Evaluación de Desempeño, Base Madre, Podio de Excelencia y Certificación

**Responsable:** Leandro Baldur Colque Palacios (`leandrobaldur`)  
**Proyecto:** Sistema de Gestión de Voluntariado Católico (Catovoluntarios) - Pastoral Universitaria UCB  
**Repositorio:** `Catovoluntarios-Backend`  
**Rama:** `leandro`  
**Versión:** 2.0.0 (Actualización Plan de Cierre y Producción)  

---

## 1. Resumen de Nuevas Funcionalidades y Cierre Técnico

En esta fase de consolidación e integración de extremo a extremo con `origin/main`, se implementaron las siguientes capacidades clave asignadas a Leandro Baldur Colque Palacios:

1. **Subida y Gestión de Certificados de Fundación (`certificados_fundacion`):**
   - Nueva entidad TypeORM y tabla en PostgreSQL `certificados_fundacion` con llaves foráneas a `proyectos_receptores`, `usuarios` y auditoría de `subido_por`.
   - Soporte para subida real de archivos (PDF/Imagen) conectada a `StorageService` (Cloudflare R2 o almacenamiento local con UUID y nombres sanitizados).
   - Notificación automática al `ADMIN_PASTORAL` cuando un centro receptor sube un certificado.
2. **Alertas de Desempeño y Notificaciones Automáticas en Semáforos:**
   - Detección inmediata en `SemaforosService.guardarReporteSemaforo`: si se evalúa con semáforo **Rojo** o se marca la casilla de **Alerta de Abandono**, se dispara una notificación prioritaria a todos los administradores de Pastoral Universitaria.
   - Al otorgar un reconocimiento en `crearPremio`, se notifica al voluntario galardonado informándole de su distinción y medalla.
3. **Ampliación de Control de Acceso y RBAC para Podio de Excelencia:**
   - Permisos en `/base-madre/ranking` extendidos a `ADMIN_PASTORAL`, `CATOLIDER` y `VOLUNTARIO` (modo consulta de honor).
   - Permisos en `/base-madre/premios` extendidos a `ADMIN_PASTORAL` y `CATOLIDER` para premiación oficial.
   - Inclusión del rol `ENCARGADO_RECEPTOR` en el enumerador `Role` de NestJS.
4. **Base de Datos Maestro para Producción:**
   - Actualización sincronizada de `src/database/init.sql`, `schema-and-seeds.sql` y `src/database/schema-and-seeds.sql` con la definición DDL de `certificados_fundacion`, índices y constraints.
   - Creación de la migración TypeORM versionada `1795392000006-CertificadosFundacion.ts`.

---

## 2. Modelo de Datos (`certificados_fundacion`)

```sql
CREATE TABLE certificados_fundacion (
    id SERIAL PRIMARY KEY,
    id_proyecto INT NOT NULL REFERENCES proyectos_receptores(id) ON DELETE CASCADE,
    id_usuario INT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    semestre VARCHAR(20) NOT NULL DEFAULT '2/2026',
    url_pdf VARCHAR(1000) NOT NULL,
    nombre_archivo VARCHAR(255) NOT NULL,
    subido_por INT REFERENCES usuarios(id) ON DELETE SET NULL,
    observaciones TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT uq_certificado_fundacion_proyecto_usuario_semestre UNIQUE (id_proyecto, id_usuario, semestre)
);
CREATE INDEX idx_certificados_fundacion_proyecto_semestre ON certificados_fundacion (id_proyecto, semestre);
CREATE INDEX idx_certificados_fundacion_usuario ON certificados_fundacion (id_usuario);
```

---

## 3. Endpoints REST Nuevos y Actualizados

| Método | Ruta | Roles Autorizados | Descripción |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/certificados/fundacion/upload` | `ADMIN_PASTORAL`, `ENCARGADO_RECEPTOR`, `SUPERVISOR_CENTRO` | Sube el certificado PDF emitido por la fundación con notificación al Admin |
| `GET` | `/api/certificados/fundacion/proyecto/:id` | `ADMIN_PASTORAL`, `ENCARGADO_RECEPTOR`, `SUPERVISOR_CENTRO`, `CATOLIDER` | Lista los certificados de fundación del proyecto en el semestre |
| `GET` | `/api/certificados/fundacion/usuario/:id` | `ADMIN_PASTORAL`, `ENCARGADO_RECEPTOR`, `SUPERVISOR_CENTRO`, `VOLUNTARIO` | Consulta certificados de fundación otorgados al voluntario |
| `GET` | `/api/certificados/fundacion` | `ADMIN_PASTORAL` | Listado global con filtros por semestre y proyecto |
| `DELETE` | `/api/certificados/fundacion/:id` | `ADMIN_PASTORAL`, `ENCARGADO_RECEPTOR`, `SUPERVISOR_CENTRO` | Elimina un certificado de fundación |
| `GET` | `/api/base-madre/ranking` | `ADMIN_PASTORAL`, `CATOLIDER`, `VOLUNTARIO` | Retorna el podio Top 3 y ranking general RF-22 |
| `POST` | `/api/base-madre/premios` | `ADMIN_PASTORAL`, `CATOLIDER` | Registra distinciones y notifica al voluntario |
| `GET` | `/api/certificados/oficial/:usuarioId` | `ADMIN_PASTORAL`, `VOLUNTARIO` | Datos completos enriquecidos para el diploma universitario oficial |
| `GET` | `/api/certificados/oficial/lote` | `ADMIN_PASTORAL` | Emisión por lotes para impresión masiva |

---

## 4. Resultados de Pruebas Unitarias y Compilación

- **Pruebas unitarias (`npm test`):**
  - **42 pruebas pasadas de 42 (100% PASS)** en 7 suites de prueba (incluyendo `semaforos.service.spec.ts` y `semaforos.controller.spec.ts`).
- **Compilación de producción (`npm run build`):**
  - `nest build` completado exitosamente con **0 errores**.
