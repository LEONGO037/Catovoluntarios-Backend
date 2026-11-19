# FLUJO DE TRABAJO Y PROTOCOLO GIT OBLIGATORIO — BACKEND
**Repositorio Oficial:** `https://github.com/LEONGO037/Catovoluntarios-Backend.git`  
**Rama Principal de Producción:** `main`

---

## 1. REGLA FUNDAMENTAL DE SINCRONIZACIÓN (FETCH PREVIO)
> [!IMPORTANT]
> **ANTES DE SUBIR CUALQUIER CAMBIO AL REPOSITORIO REMOTO, ES OBLIGATORIO HACER UN `FETCH` Y REBASAR/INTEGRAR CON LA RAMA `main`.**  
> Esto previene la sobreescritura accidental de endpoints, migraciones de base de datos o lógica de negocio compartida entre integrantes del equipo.

---

## 2. PASO A PASO PARA SUBIR CAMBIOS AL REPOSITORIO

### Paso 1: Verificar el Estado Local
Consultar qué archivos han sido modificados o agregados:
```bash
git status
```

### Paso 2: Crear el Commit Local con Mensaje Convencional
```bash
git add .
git commit -m "feat(postulaciones): agregada validacion de maximo 6 materias en CreatePostulacionDto"
```

### Paso 3: Sincronizar Obligatoriamente con `main` Remoto (Fetch)
Antes de ejecutar `git push`, descargar los cambios más recientes del servidor:
```bash
# 1. Traer las referencias del servidor remoto
git fetch origin main

# 2. Rebasar o integrar los cambios de main sobre tu rama local
git rebase origin/main
# (O alternativamente: git merge origin/main)
```

### Paso 4: Resolución de Conflictos y Verificación de Compilación
Si se produce algún conflicto en archivos o entidades:
1. Resolver los conflictos manteniendo la integridad de las reglas de negocio.
2. Añadir los archivos resueltos:
   ```bash
   git add <archivo-resuelto>
   ```
3. Continuar el rebase:
   ```bash
   git rebase --continue
   ```
4. **Verificación crítica:** Comprobar que la aplicación compila sin errores de TypeScript:
   ```bash
   npm run build
   ```

### Paso 5: Enviar los Cambios al Remoto (Push)
Una vez verificado que el código local compila y está 100% sincronizado con `main`:
```bash
git push origin <tu-rama>
# O si trabajas en main autorizado:
git push origin main
```

---

## 3. CONVENCIONES DE COMMITS Y RAMAS
* `feat(modulo): nueva funcionalidad o endpoint`
* `fix(modulo): corrección de bugs o validaciones`
* `db(migraciones): creación o ajuste de esquemas de base de datos`
* `refactor(modulo): reestructuración de servicios o DTOs`
* `docs(arquitectura): actualización de guías markdown`
