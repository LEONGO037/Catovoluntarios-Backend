# Documentación Técnica - Módulo 07: Evaluación de Desempeño, Base Madre y Reconocimiento / Cierre

**Responsable:** Leandro Baldur Colque Palacios (`leandrobaldur`)  
**Proyecto:** Sistema de Gestión de Voluntariado Católico (Catovoluntarios) - Pastoral Universitaria UCB  
**Repositorio:** `Catovoluntarios-Backend`  
**Rama:** `leandro`  
**Versión:** 1.0.0  

---

## 1. Resumen Ejecutivo y Alcance

El **Módulo 07** tiene como objetivo centralizar la evaluación del voluntario, el seguimiento cualitativo mensual de desempeño en campo, la base histórica multi-semestre, la preselección algorítmica de los voluntarios destacados y el feedback institucional de proyectos receptores, culminando en la generación de plantillas de certificados de conclusión.

### Requerimientos Funcionales Asignados:
- **RF-18 & RF-19 (P-19):** Reporte Mensual y Semáforo Cualitativo de Desempeño.
- **RF-20 & RF-21 (P-20):** Base Madre Histórica Multi-Semestre y Asignación de Nivel (`JUNIOR`, `PRO`, `SUPER_PRO`).
- **RF-22 (P-20):** Preselección y Ranking Algorítmico de Destacados (Podio y Premios Históricos).
- **RF-23 (P-21):** Feedback Semestral de Proyectos Receptores (con Bloque 4 libre) y Plantilla de Certificados de Conclusión.

---

## 2. Arquitectura de Backend (`NestJS` + `TypeORM`)

La implementación se encuentra modularizada bajo `src/modules/semaforos/` y registrada en `AppModule` y el `DatabaseModule` central.

```
src/modules/semaforos/
├── dtos/
│   ├── create-feedback-proyecto.dto.ts
│   ├── create-premio-historico.dto.ts
│   ├── create-reporte-semaforo.dto.ts
│   ├── filter-base-madre.dto.ts
│   └── filter-semaforo.dto.ts
├── entities/
│   ├── evaluacion-proyecto.entity.ts
│   ├── premio-historico.entity.ts
│   └── reporte-semaforo.entity.ts
├── semaforos.controller.spec.ts
├── semaforos.controller.ts
├── semaforos.module.ts
├── semaforos.service.spec.ts
└── semaforos.service.ts
```

### 2.1 Entidades de Base de Datos (`entities/`)

1. **`ReporteSemaforoEntity` (`reportes_semaforo`)**:
   - `id`: Clave primaria autoincremental.
   - `id_asignacion`: Identificador de la asignación del voluntario al proyecto.
   - `id_usuario`: ID del voluntario evaluado (relación `ManyToOne` con `UsuarioEntity`).
   - `id_proyecto`: ID del proyecto correspondiente (relación `ManyToOne` con `ProyectoEntity`).
   - `mes`: Mes evaluado (número 1 al 12).
   - `anio`: Año evaluado (por defecto 2026).
   - `color`: Enum con los 4 colores semafóricos: `'Verde'`, `'Amarillo'`, `'Rojo'`, `'Morado'`.
   - `justificacion`: Justificación cualitativa textual (**obligatoria**, no puede ser vacía según la regla de negocio de Pastoral).
   - `notificar_abandono`: Booleano para alertar a la coordinación de abandono inminente (activación sugerida en rojo).
   - `evaluador_id`: Usuario que registró la evaluación (generalmente el líder de proyecto).
   - `created_at`, `updated_at`: Marcas de tiempo de auditoría.

2. **`PremioHistoricoEntity` (`premios_historicos`)**:
   - `id`: Clave primaria autoincremental.
   - `id_usuario`: Relación `ManyToOne` con `UsuarioEntity`.
   - `semestre`: Semestre en que se otorgó (ej. `'2/2026'`).
   - `nombre_premio`: Título o distinción otorgada (ej. `'Catovoluntario Destacado'`).
   - `categoria`: Categoría del mérito (ej. `'Liderazgo en Campo'`, `'Constancia y Vocación'`).
   - `descripcion`: Reseña del reconocimiento.
   - `otorgado_por`: Responsable o comité que concedió la distinción.
   - `fecha_otorgamiento`: Fecha de registro.

3. **`EvaluacionProyectoEntity` (`evaluaciones_proyectos_receptores`)**:
   - `id`: Clave primaria autoincremental.
   - `id_proyecto`: Relación `ManyToOne` con `ProyectoEntity`.
   - `semestre`: Semestre evaluado (ej. `'2/2026'`).
   - `responsable_institucion`: Nombre del representante del centro/institución externa.
   - `cargo_responsable`: Cargo dentro de la organización receptora.
   - `telefono_contacto`: Contacto telefónico verificado.
   - `bloque1CumplimientoCompromisos`: Puntaje (1 a 5) en asistencia, puntualidad y cumplimiento.
   - `bloque2IntegracionComunidad`: Puntaje (1 a 5) en empatía y trato humano.
   - `bloque3CoordinacionPastoral`: Puntaje (1 a 5) en comunicación con Pastoral UCB.
   - `bloque4ObservacionesSugerenciasLibres`: Campo de texto libre (**obligatorio**) que sustituye los informes físicos tradicionales.
   - `promedio_general`: Promedio calculado de los bloques cuantitativos.

---

## 3. Lógica de Negocio y Algoritmos (`SemaforosService`)

### 3.1 Reglas de Validación de Semáforo Mensual (RF-18 / RF-19)
- El color debe ser uno de los cuatro válidos: `Verde`, `Amarillo`, `Rojo`, `Morado`.
- La **justificación es estrictamente obligatoria**. Si se envía una cadena vacía o solo espacios, el servicio arroja `BadRequestException('La justificación cualitativa es obligatoria para registrar el semáforo.')`.

### 3.2 Categorización Automática de Nivel en Base Madre (RF-21)
La clasificación del voluntario según sus horas históricas acumuladas en el servicio pastoral se calcula de acuerdo con los siguientes baremos:
- **`JUNIOR`**: De 0 a 39 horas históricas acumuladas.
- **`PRO`**: De 40 a 59 horas históricas acumuladas.
- **`SUPER_PRO`**: 60 o más horas históricas acumuladas.

### 3.3 Algoritmo Automatizado de Ranking de Destacados (RF-22)
Para seleccionar con equidad y transparencia a los voluntarios acreedores de diplomas y reconocimientos de honor al cierre del semestre, el sistema implementa la fórmula ponderada oficial:

$$\text{Puntaje} = (\text{Horas del Semestre} \times 0.4) + (\text{Semáforos Morados} \times 15) + (\text{Evaluación de Institución} \times 5) + \text{Bonus}$$

Donde:
- `Horas del Semestre`: Horas acreditadas durante el periodo en curso (peso 40%).
- `Semáforos Morados`: Cantidad de meses evaluados con desempeño excepcional (15 puntos por cada uno).
- `Evaluación de Institución`: Calificación obtenida por el proyecto receptor (escala 1 a 5, multiplicada por 5).
- `Bonus`: Si el voluntario ostenta nivel `SUPER_PRO`, recibe automáticamente **+10 puntos de bonificación**.

El servicio ordena a los postulantes de forma descendente y genera el **Podio de Honor** (Primer Lugar - Oro, Segundo Lugar - Plata, Tercer Lugar - Bronce) junto con el ranking consolidado.

### 3.4 Generación de Plantilla de Certificados de Conclusión (RF-23)
De acuerdo a las directrices de Pastoral Universitaria UCB, los certificados de voluntariado **no requieren firma digital ni hashes criptográficos**; requieren una plantilla textual estandarizada con los datos del voluntario, horas válidas cumplidas, proyecto, semestre y fecha oficial de emisión para ser transferidos a los diplomas impresos o compartidos en formato digital legible.

---

## 4. Catálogo de Endpoints REST

| Método | Endpoint | Descripción | DTO Entrada |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/semaforos/reporte` | Registra o actualiza el semáforo cualitativo mensual de un voluntario | `CreateReporteSemaforoDto` |
| `GET` | `/api/semaforos/proyecto/:id` | Lista el estado de semáforos de un proyecto en un mes y año determinado | Query: `mes`, `anio` |
| `GET` | `/api/semaforos/resumen-general` | Retorna los KPIs globales de semáforos (totales verde, amarillo, rojo, morado) | Query: `mes`, `anio` |
| `GET` | `/api/base-madre` | Consulta multi-semestre de la Base Madre con filtros y cálculo de nivel | `FilterBaseMadreDto` |
| `POST` | `/api/base-madre/premios` | Registra un reconocimiento/premio en el historial del voluntario | `CreatePremioHistoricoDto` |
| `GET` | `/api/base-madre/premios/:usuarioId` | Consulta el historial de galardones de un voluntario específico | Param: `usuarioId` |
| `GET` | `/api/base-madre/ranking-destacados` | Ejecuta el algoritmo RF-22 y retorna el podio y ranking general | Query: `semestre` |
| `POST` | `/api/proyectos/feedback-semestral` | Registra la evaluación semestral del proyecto receptor (Bloques 1 al 4) | `CreateFeedbackProyectoDto` |
| `GET` | `/api/proyectos/:id/feedback-semestral` | Consulta el feedback semestral de una institución receptora | Query: `semestre` |
| `GET` | `/api/certificados/plantilla/:usuarioId` | Genera la plantilla de certificado de conclusión para un voluntario | Query: `semestre` |
| `GET` | `/api/certificados/lote` | Genera las plantillas de certificados en lote para todo un proyecto | Query: `proyectoId`, `semestre` |

---

## 5. Pruebas Unitarias y Verificación

Se diseñaron suites de pruebas exhaustivas con **Jest** cubriendo casos de éxito y de borde para el servicio y el controlador.

### Ejecución de Pruebas:
```bash
npm test
```

### Resultados Obtenidos:
```
PASS src/app.controller.spec.ts
PASS src/modules/semaforos/semaforos.service.spec.ts
PASS src/modules/semaforos/semaforos.controller.spec.ts

Test Suites: 3 passed, 3 total
Tests:       16 passed, 16 total
Snapshots:   0 total
Time:        2.675 s
Ran all test suites.
```

### Casos Clave Verificados:
1. `guardarReporteSemaforo`: Lanza `BadRequestException` cuando falta la justificación cualitativa obligatoria.
2. `guardarReporteSemaforo`: Guarda y actualiza correctamente semáforos verde, amarillo, rojo y morado.
3. `obtenerBaseMadre`: Aplica la regla RF-21 asignando correctamente `JUNIOR` (<40h), `PRO` (40-59h) y `SUPER_PRO` (>=60h).
4. `obtenerRankingDestacados`: Calcula los puntajes conforme a la fórmula matemática de RF-22 y asigna bonificación de 10 puntos a los voluntarios `SUPER_PRO`.
5. `registrarFeedbackProyecto`: Valida que el Bloque 4 libre contenga texto y calcula el promedio ponderado.
6. `generarPlantillaCertificado`: Emite la plantilla textual con todos los metadatos requeridos por Pastoral.
7. `SemaforosController`: Verifica la delegación adecuada de todas las rutas REST con sus códigos HTTP correspondientes.

### Compilación:
```bash
npm run build
# nest build completado con 0 errores.
```
