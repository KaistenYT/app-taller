# nanologic-app (app-taller)

## Resumen
`nanologic-app` (branch `v1`) es una aplicación de escritorio desarrollada con Electron que integra un backend Node.js local y una interfaz frontend basada en HTML/CSS/JS. Está diseñada para gestionar clientes, dispositivos y recepciones en un taller: registro de recepciones, historial, reportes y gestión de usuarios.

## Propósito
- Registrar y gestionar recepciones de dispositivos.
- Mantener historial de reparaciones/recepciones.
- Generar reportes y listar recepciones por criterios.
- Gestionar clientes y usuarios (autenticación básica con `bcrypt`).

## Requisitos
- Node.js (versión compatible con las dependencias; recomendado Node 18+ o la versión usada en desarrollo).
- npm (o yarn).
- Windows/macOS/Linux (es una aplicación Electron multiplataforma).

## Instalación (desarrollo)
1. Clonar el repositorio.
2. Instalar dependencias:

```bash
npm install
```

3. Ejecutar la aplicación en modo desarrollo (abre la ventana de Electron):

```bash
npm start
```

## Empaquetado / Distribución
- Empaquetar con Electron Forge:

```bash
npm run package
```

- Generar instaladores/artifacts:

```bash
npm run make
```

(Revisa y ajusta la configuración de `electron-forge` en `package.json` si necesitas plataformas/formatos específicos.)

## Estructura del proyecto (alto nivel)
- `electron/`
  - [electron/main.js](electron/main.js) — Proceso principal de Electron: crea ventanas, controla lifecycle.
  - [electron/preload.cjs](electron/preload.cjs) — Preload script para exponer APIs seguras al renderer.

- `backend/`
  - `db/`
    - `db.sqbpro` — proyecto/definición de la DB (herramienta externa).
    - [backend/db/dbConfig.js](backend/db/dbConfig.js) — configuración de `knex` y `sqlite3`.
  - `model/` — Modelos/data-access para entidades: `client.js`, `device.js`, `reception.js`, `receptionHistory.js`, `reports.js`, `user.js`.
  - `service/` — Lógica de negocio: `clientService.js`, `deviceService.js`, `receptionHistoryService.js`, `receptionService.js`, `reportService.js`, `userService.js`.

- `frontend/`
  - `views/` — Vistas HTML: `index.html`, `login.html`, `register.html`, `report.html`, `reportList.html`, `addReceptionForm.html`, `history.html`.
  - `scripts/` — JS del cliente: `index.js`, `login.js`, `register.js`, `reception.js`, `report.js`, `reportList.js`, `history.js`.
  - `styles/` — `style.css`, `report.css`.

- `package.json` — scripts y dependencias principales.


## Dependencias principales
- `electron` (devDependency): ejecuta la app como aplicación de escritorio.
- `knex`: query builder para SQLite.
- `sqlite3`: motor de base de datos local.
- `bcrypt`: hashing de contraseñas.

## Base de datos
- Motor: SQLite (archivo local).
- Configuración por `knex` en [backend/db/dbConfig.js](backend/db/dbConfig.js).
- No se incluyen migraciones por defecto; se recomienda añadir migraciones y seeds con `knex` para reproducibilidad.

## Flujo de la aplicación
1. El usuario abre la app Electron (inicia `electron/main.js`).
2. La UI (archivos en `frontend/views/`) se carga en la ventana del renderer.
3. El renderer interactúa con el backend mediante APIs locales o por medio del `preload` (IPC seguro).
4. El backend usa `knex` + `sqlite3` para persistir y consultar datos.
5. Los servicios en `backend/service/` encapsulan la lógica de negocio y llaman a los modelos.

## Puntos de entrada / Archivos clave
- [electron/main.js](electron/main.js) — arranque y creación de ventanas.
- [electron/preload.cjs](electron/preload.cjs) — canal seguro de comunicación entre renderer y main.
- [backend/db/dbConfig.js](backend/db/dbConfig.js) — configuración DB.
- [backend/service/receptionService.js](backend/service/receptionService.js) — lógica central de recepciones.
- [frontend/views/index.html](frontend/views/index.html) y [frontend/scripts/index.js](frontend/scripts/index.js) — interfaz principal.

## Buenas prácticas y recomendaciones
- Añadir migraciones y seeds con `knex` para versionar el esquema de la base de datos.
- Añadir tests unitarios para los servicios y modelos.
- Revisar exposición de APIs en `preload.cjs` para asegurar que solo se exponen lo necesario (principio de menor privilegio).
- Añadir manejo de errores y validaciones robustas en los servicios.

## Ejemplo breve: exponer una API segura desde `preload.cjs`

```js
// preload.cjs (ejemplo)
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  invoke: (channel, data) => ipcRenderer.invoke(channel, data),
});
```

Y en el renderer (frontend/scripts/*):

```js
// desde cualquier script del renderer
window.api.invoke('reception:create', { clientId: 1, deviceId: 2, notes: '...' })
  .then(result => console.log(result))
  .catch(err => console.error(err));
```

(Asegúrate de tener handlers en el `main` para `ipcMain.handle('reception:create', ...)`.)

## Desarrollo y debugging
- Usa las DevTools de la ventana renderer para depurar la UI.
- Agrega logging en servicios para rastrear flujo y errores.

## Contribuir
- Abrir issues y PRs para mejoras o correcciones.
- Mantener commits pequeños y descriptivos.


