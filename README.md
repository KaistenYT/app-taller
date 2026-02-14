# NanoLogic App (Taller)

Sistema de gestión para taller técnico, desarrollado con **Electron**, **React**, y **SQLite**.

## Características Principales

- **Gestión de Recepciones**: Ciclo de vida completo (Recepción -> Diagnóstico -> Reparación -> Entrega).
- **Base de Datos Local**: SQLite con **Knex.js** para migraciones y consultas seguras.
- **Gestión de Usuarios**: Roles (Admin/User), seguridad con `bcrypt` y validación robusta con `Joi`.
- **Historial de Auditoría**: Registro inmutable de todas las acciones sobre las recepciones.
- **Reportes Técnicos**: Generación de informes para imprimir o guardar.
- **Multi-plataforma**: Compatible con Windows (probado), Linux y macOS.

## Tecnologías

- **Frontend**: React, Vite, Bootstrap 5.
- **Backend (Main Process)**: Electron, Node.js.
- **Persistencia**: SQLite3, Knex.js.
- **Seguridad y Calidad**: Joi (Validación), Bcrypt (Hashing).

## Requisitos Previos

- Node.js 18+
- npm

## Instalación y Ejecución

1.  **Instalar dependencias:**
    Desde la raíz del proyecto, ejecuta:

    ```bash
    npm install
    # Esto instalará automáticamente las dependencias del frontend también (postinstall)
    # Si falla, instala manualmente en backend y frontend:
    # npm install
    # cd frontend/react/app-taller && npm install
    ```

2.  **Modo Desarrollo (Recomendado):**
    Ejecuta Front y Back simultáneamente con _Hot Reload_:

    ```bash
    npm run dev
    ```

3.  **Construir para Producción:**
    Genera el instalador/ejecutable en la carpeta `out/`:
    ```bash
    npm run build
    ```

## Primer Uso

Al iniciar la aplicación por primera vez, si la base de datos está vacía, el sistema generará automáticamente un **Usuario Administrador**.

Se mostrará una ventana emergente con la contraseña temporal. Además, **se creará un archivo `NanoLogic_Credenciales.txt` en el Escritorio** con esta información para su seguridad.

**Importante:** Guarde estas credenciales en un lugar seguro y elimine el archivo del escritorio.
**Importante:** Cambie la contraseña del usuario administrador por una que recuerde una vez tenga acceso al sistema.

## Estructura del Proyecto

- `electron/`: Proceso principal de Electron.
  - `main.js`: Entrada de la app, IPC handlers, gestión de ventana.
  - `preload.cjs`: Puente seguro (ContextBridge) entre Front y Back.
- `backend/`: Lógica de negocio.
  - `db/`: Configuración de SQLite y migraciones (`migrations/`).
  - `service/`: Lógica de negocio y acceso a datos (Modelos).
  - `validation/`: Esquemas de validación de datos (Joi).
- `frontend/react/app-taller/`: Interfaz de usuario (React + Vite).

## Base de Datos

El sistema usa migraciones de Knex para gestionar el esquema de la base de datos.

- Las migraciones se ejecutan automáticamente al iniciar la aplicación.
- En desarrollo: `backend/db/db.sqlite`
- En producción: `%APPDATA%/NanoLogic/data/db.sqlite`
