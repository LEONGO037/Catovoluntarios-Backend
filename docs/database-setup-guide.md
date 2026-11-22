# GUÍA DE INSTALACIÓN Y CONEXIÓN DE BASE DE DATOS POSTGRESQL
**Sistema Web Catovoluntarios — Pastoral UCB La Paz**

Esta guía explica detalladamente dónde alojar la base de datos PostgreSQL, cómo importar el script SQL y cómo configurar las variables en el archivo `.env` del backend.

---

## 1. DÓNDE SUBIR LA BASE DE DATOS (OPCIONES RECOMENDADAS)

Puedes elegir cualquiera de las siguientes opciones gratuitas y de alta confiabilidad:

### Opción A: Neon.tech (Recomendada — 100% Gratuita, Instantánea, Serverless)
1. Ingresa a [https://neon.tech](https://neon.tech) y crea una cuenta gratuita con GitHub o Google.
2. Crea un nuevo proyecto:
   * **Project name:** `catovoluntarios-db`
   * **Region:** US East (Ohio o N. Virginia)
   * **PostgreSQL version:** 16 o 17
3. En el panel principal de Neon, copia la **Connection String** que tiene este formato:
   `postgresql://usuario:contraseña@ep-xyz.us-east-2.aws.neon.tech/catovoluntarios_db?sslmode=require`
4. Ve a la pestaña **SQL Editor** en la consola de Neon.
5. Abre el archivo `src/database/schema-and-seeds.sql` de este repositorio, copia todo su contenido, pégalo en el editor SQL de Neon y presiona **Run**.
6. ¡Listo! Todas las tablas, enums y datos semilla de prueba se crearán en 2 segundos.

### Opción B: Supabase (Alternativa Gratuita)
1. Ingresa a [https://supabase.com](https://supabase.com) y crea una cuenta.
2. Crea un **New Project**:
   * **Name:** `catovoluntarios`
   * **Database Password:** Define una contraseña segura (anótala).
   * **Region:** São Paulo (Brasil) o US East.
3. En el menú izquierdo ve a **SQL Editor**, presiona **New Query**, pega el contenido de `schema-and-seeds.sql` y presiona **Run**.
4. Ve a **Project Settings -> Database** y en **Connection String -> URI** copia la URL de conexión.

### Opción C: Render.com o Railway.app
1. En [Render.com](https://render.com) o [Railway.app](https://railway.app), crea una instancia de PostgreSQL gratuita ("New PostgreSQL").
2. Conéctate con cualquier cliente (DBeaver, pgAdmin o terminal `psql`) y ejecuta `schema-and-seeds.sql`.

### Opción D: PostgreSQL Local (pgAdmin o Docker)
Si tienes PostgreSQL instalado localmente en Windows:
1. Abre **pgAdmin** o tu terminal `psql`.
2. Crea la base de datos:
   ```sql
   CREATE DATABASE catovoluntarios_db;
   ```
3. Conéctate a `catovoluntarios_db` y ejecuta el script `schema-and-seeds.sql`.

---

## 2. CONFIGURACIÓN DEL ARCHIVO `.env` EN EL BACKEND

Abre el archivo `Catovoluntarios-Backend/.env` y coloca las variables correspondientes a tu base de datos:

### Para Neon.tech (con SSL):
```env
PORT=3000
NODE_ENV=development

# Configuración de CORS
CORS_ORIGIN=http://localhost:5173,http://127.0.0.1:5173

# Base de Datos PostgreSQL (Neon)
DATABASE_HOST=ep-tu-endpoint.us-east-2.aws.neon.tech
DATABASE_PORT=5432
DATABASE_USER=tu_usuario
DATABASE_PASSWORD=tu_contraseña_secreta
DATABASE_NAME=neondb
DATABASE_SSL=true

# Seguridad JWT
JWT_SECRET=super_secret_catovoluntarios_jwt_key_ucb_2026
JWT_EXPIRES_IN=7d

# Parámetros Institucionales Pastoral UCB
MAX_SUBJECTS_ALLOWED=6
INSURANCE_POLICY_CODE=APC-7083
MIN_HOURS_SEMESTER=40
```

### Para PostgreSQL Local:
```env
PORT=3000
NODE_ENV=development

CORS_ORIGIN=http://localhost:5173,http://127.0.0.1:5173

DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=postgres
DATABASE_NAME=catovoluntarios_db
DATABASE_SSL=false

JWT_SECRET=super_secret_catovoluntarios_jwt_key_ucb_2026
JWT_EXPIRES_IN=7d

MAX_SUBJECTS_ALLOWED=6
INSURANCE_POLICY_CODE=APC-7083
MIN_HOURS_SEMESTER=40
```

---

## 3. USUARIOS Y CREDENCIALES PRECARGADAS PARA PRUEBAS

Todos los usuarios tienen la misma contraseña para facilitar las pruebas del equipo docente y Pastoral:
* **Contraseña común:** `Password123!`

| Rol | Correo Electrónico | Carnet (CI) | Nombre Completo |
| :--- | :--- | :--- | :--- |
| **Administración Pastoral** | `andrea.moscoso@ucb.edu.bo` | `4892301LP` | Lic. Andrea Moscoso (Coordinadora) |
| **Catolíder** | `catolider.santiago@ucb.edu.bo` | `6789123LP` | Santiago Montes Roca |
| **Catovoluntario Activo** | `voluntario.maria@ucb.edu.bo` | `8912345LP` | María Belén Flores Mendoza |
| **Postulante en Proceso** | `postulante.carlos@ucb.edu.bo` | `9876543LP` | Carlos Andrés Quispe Mamani |
| **Docente Supervisor** | `docente.pastoral@ucb.edu.bo` | `5432167LP` | Rodrigo Gutiérrez Paz |
| **Psicología Clínica** | `psicologa.carolina@ucb.edu.bo` | `7712398LP` | Carolina Vargas Rios |

---

## 4. POLÍTICA DE ALMACENAMIENTO DE ARCHIVOS EN CLOUDFLARE R2

Para dar cumplimiento estricto al requerimiento institucional de almacenar archivos sin saturar la base de datos ni exceder el presupuesto de hosting (arquitectura de costo cero o menor a \$50 USD/año), **todos los archivos físicos (PDFs, imágenes JPG/PNG, planillas escaneadas y fotografías)** se guardan en **Cloudflare R2** y la base de datos almacena exclusivamente el enlace (`URL`) directo:

| Tabla | Campo de Enlace | Tipo de Archivo Almacenado en Cloudflare |
| :--- | :--- | :--- |
| `usuarios` | `avatar_url` | Foto de perfil o avatar del usuario. |
| `proyectos_receptores` | `logo_url` | Logotipo institucional o imagen de portada del proyecto. |
| `evaluaciones_psicologicas` | `informe_pdf_url` | Informe clínico E-SRE en formato PDF. |
| `documentos_voluntario` | `archivo_url` | Póliza de seguro UCB (`APC-7083`), compromiso firmado, fotocopias de CI y carta de menores. |
| `conciliaciones_mensuales_supervisor` | `reporte_firmas_supervisor_url` | Escaneo en PDF o imagen de la planilla física de firmas entregada por el supervisor externo. |
| `liquidaciones_pasajes` | `recibi_conforme_firmado_url` | Hoja física individual de *Recibí Conforme* firmada por el voluntario. |
| `premios_historicos` | `foto_podio_url` | Fotografía en alta resolución del podio o reconocimiento en Base Madre. |
| `evaluaciones_proyectos_receptores` | `documento_respaldo_url` | Documento o acta física de respaldo de la institución al cierre de semestre. |
