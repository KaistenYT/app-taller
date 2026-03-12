# App Taller (Sistema de Gestión Técnica)

Sistema integral de gestión para talleres de servicio técnico, desarrollado con **React**, **Node.js (Express)** y base de datos relacional (**PostgreSQL** con Knex).

## Características Principales

- **Gestión de Recepciones:** Control completo del ciclo de vida de un equipo en el taller (Recepción, Diagnóstico, Reparación, Entrega).
- **Gestión de Presupuestos:** Creación de presupuestos detallados asociados a las recepciones, con control de estados (Borrador, Aprobado, Rechazado).
- **Historial y Auditoría Avanzada:** Registro automático e inmutable de cambios de estado, y auditoría estricta de eliminación/archivos con exigencia de "Motivos" (Reasons) tanto para recepciones como para presupuestos.
- **Panel de Administración (Admin):** Vistas exclusivas para administradores que permiten gestionar usuarios, auditar quién borró qué (y por qué), y supervisar la actividad global.
- **Gestión de Clientes y Dispositivos:** Catálogo de clientes y control de dispositivos por número de serie.
- **Generación de Reportes:** Creación de reportes técnicos detallados y exportables.
- **Seguridad y Autenticación:** Autenticación basada en **JWT (JSON Web Tokens)**, contraseñas encriptadas con `bcrypt`, y protección de rutas en el Frontend y Backend.

## Tecnologías Utilizadas

- **Frontend:** React, Vite, Bootstrap 5, Zustand (Estado global), React Router DOM.
- **Backend:** Node.js, Express.js.
- **Base de Datos y ORM:** PostgreSQL, Knex.js (Migraciones y Query Builder).
- **Seguridad:** JSON Web Tokens (JWT), Bcrypt.

## Requisitos Previos

- Node.js v18 o superior.
- Base de datos PostgreSQL en funcionamiento (y las credenciales configuradas en tu entorno).
- NPM o predeterminado.

## Instalación y Configuración

1.  **Clonar el repositorio y entrar a la carpeta del proyecto:**

2.  **Configurar Variables de Entorno (Backend):**
    En la carpeta principal (donde se ubica el backend), crea un archivo `.env`:

    ```env
    PORT=3001
    DB_CLIENT=pg
    DB_HOST=localhost
    DB_USER=tu_usuario
    DB_PASSWORD=tu_password
    DB_NAME=app_taller_db
    DB_PORT=5432
    JWT_SECRET=tu_secreto_super_seguro
    ```

3.  **Configurar Variables de Entorno (Frontend):**
    En `frontend/react/app-taller/`, crea un archivo `.env`:

    ```env
    VITE_API_URL=http://localhost:3001/api
    ```

4.  **Instalación de Dependencias:**
    Debes instalar las dependencias tanto en la raíz (Backend) como en el frontend.

    ```bash
    # En la raíz (Backend)
    npm install

    # En la carpeta del Frontend
    cd frontend/react/app-taller
    npm install
    ```

5.  **Migraciones de Base de Datos:**
    Para crear las tablas necesarias en PostgreSQL, asegúrate de estar en la carpeta raíz/backend y ejecuta:
    ```bash
    npx knex migrate:latest
    ```
    _Nota: Al iniciar el sistema, si no hay usuarios creados, puedes añadir un script de `seed` o usar directamente el endpoint de registro para crear el primer "admin"._

## Ejecución del Sistema

### Modo Desarrollo

1.  **Iniciar Backend:**
    Desde la raíz del backend:

    ```bash
    npm run dev
    ```

    (El servidor correrá en `http://localhost:3001` o el puerto que hayas definido).

2.  **Iniciar Frontend:**
    Desde la carpeta `frontend/react/app-taller`:
    ```bash
    npm run dev
    ```
    (Se abrirá el cliente web de React, generalmente en `http://localhost:5173`).

## Estructura del Proyecto

- `backend/`: Código fuente de la API Node.js/Express.
  - `controllers/`: Lógica de cada endpoint HTTP.
  - `middleware/`: Middlewares como autenticación JWT (`authMiddleware`).
  - `model/`: Clases o funciones que interactúan con Knex.js.
  - `routes/`: Definición de endpoints de la API REST.
  - `service/`: Capa de lógica de negocio (intermediario entre controladores y base de datos).
  - `db/migrations/`: Archivos para crear o modificar esquemas de DB en PostgreSQL.
- `frontend/react/app-taller/`:
  - `src/api/`: Servicios HTTP utilizando `axios` integrados con JWT auth.
  - `src/components/`: Componentes reutilizables UI (Modales, Tablas, Layout, Navbar).
  - `src/context/`: Contextos globales (ej. `AuthContext` para el estado de la sesión).
  - `src/hooks/`: Custom hooks (Zustand para manejo de estado global de recepciones, presupuestos).
  - `src/pages/`: Vistas completas de la aplicación (Dashboard, BudgetList, Auditorías, Login).
  - `src/App.jsx`: Configuración del router y protección de rutas de React.
