# Sistema de Gestión de Taller Técnico (SaaS)

Sistema integral para la gestión de talleres de servicio técnico, diseñado con una arquitectura multitenant (SaaS) que permite a múltiples empresas gestionar sus operaciones de forma aislada, segura y eficiente.

## 🚀 Funcionalidades Principales

- **Gestión Multi-empresa (SaaS):** Aislamiento total de datos por empresa (tenants).
- **Control de Recepciones:** Registro detallado de equipos, fallas y estados de reparación.
- **Auditoría y Trazabilidad:** Historial completo de cambios en recepciones y presupuestos (logs de auditoría).
- **Gestión de Clientes y Equipos:** Catálogo centralizado con historial por serial de equipo.
- **Presupuestos Dinámicos:** Creación, edición y seguimiento de estados de presupuestos.
- **Reportes Técnicos:** Generación automática de informes de servicio en formato web/imprimible.
- **Panel de Control (Dashboard):** Estadísticas y métricas en tiempo real.

## ⚡ Tecnologías de Alto Rendimiento (Novedades)

Para garantizar la escalabilidad y una experiencia de usuario fluida, el sistema integra:

- **WebSockets (Socket.io):** Actualizaciones instantáneas en el dashboard. Cuando un técnico cambia un estado o crea un reporte, todos los usuarios de la empresa ven el cambio sin recargar la página.
- **Caché Distribuida/Local:** Implementación de caché para consultas pesadas (conteos y listados), reduciendo la carga en PostgreSQL. Configurable para usar **Redis** (producción/escalabilidad) o **Memoria Local** (desarrollo rápido).
- **Arquitectura Multitenant:** Filtro automático por `company_id` en todas las capas del sistema (Caché, Base de Datos y WebSockets).

## 🛠️ Stack Tecnológico

- **Backend:** Node.js, Express, Knex.js (Query Builder).
- **Base de Datos:** PostgreSQL.
- **Caché:** Redis / Node-Cache (In-memory).
- **Frontend:** React 18, Vite, Tailwind CSS, Zustand (Estado), Lucide React (Iconos).
- **Tiempo Real:** Socket.io.
- **Contenedores:** Docker & Docker Compose.

## 📦 Instalación y Despliegue

### Requisitos Previos

- Node.js (v20+)
- PostgreSQL
- Redis (Opcional para modo local, recomendado para Docker)

### Opción A: Despliegue con Docker (Recomendado)

Levanta todo el ecosistema (Postgres, Redis, Backend y Frontend) con un solo comando:

```bash
docker-compose up --build
```

El sistema estará disponible en:

- Frontend: `http://localhost:8080`
- Backend API: `http://localhost:3001`

### Opción B: Desarrollo Local

1. Instalar dependencias:
   ```bash
   npm install
   npm install --prefix frontend/react/app-taller
   ```
2. Configurar variables de entorno (`.env` en la raíz).
3. Iniciar entorno de desarrollo (Backend + Frontend):
   ```bash
   npm run dev
   ```
   _Este comando limpia automáticamente puertos bloqueados y habilita hot-reload._

## 🧪 Pruebas Automáticas

El proyecto cuenta con una suite de tests exhaustiva que cubre la lógica de negocio, validaciones, caché y WebSockets:

```bash
npm test
```

---
