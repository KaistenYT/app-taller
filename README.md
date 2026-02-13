# NanoLogic App (Taller)

Sistema de gestión para taller técnico, desarrollado con **Electron** y **React**.

## Funcionalidades

- **Recepciones:** Registro, seguimiento y cambio de estados (Pendiente, En Proceso, Reparado, etc.).
- **Reportes:** Generación automática de informes técnicos.
- **Inventario:** Gestión de clientes y dispositivos.
- **Historial:** Auditoría completa de cambios en recepciones.
- **Usuarios:** Autenticación y roles de usuario.

## Requisitos

- Node.js 18+
- npm

## Instalación

1.  **Instalar dependencias:**

    ```bash
    npm install
    cd frontend/react/app-taller
    npm install
    ```

2.  **Modo Desarrollo:**
    - Iniciar Frontend (React):
      ```bash
      cd frontend/react/app-taller
      npm run dev
      ```
    - Iniciar Electron (en otra terminal, desde la raíz):
      ```bash
      npm start
      ```

3.  **Construir Ejecutable:**
    ```bash
    npm run package
    ```

## Estructura

- `electron/`: Configuración del proceso principal y puente IPC (`preload.cjs`).
- `backend/`: Lógica del servidor local, base de datos SQLite y servicios.
- `frontend/react/app-taller/`: Código fuente de la interfaz React (Vite).

## Base de Datos

Utiliza SQLite local. La configuración se encuentra en `backend/db/dbConfig.js`. Se recomienda usar `knex` para migraciones.
