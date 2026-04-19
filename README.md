# TallerGestion - Sistema de Gestión de Taller Técnico (Escritorio)

TallerGestion es una solución integral diseñada para la gestión eficiente de talleres de servicio técnico. Tras su migración, ha evolucionado de una arquitectura SaaS a una **aplicación de escritorio nativa (Electron)** totalmente autónoma, centrada en la privacidad de los datos y la facilidad de uso local.

## 🚀 Funcionalidades Principales

- **Arquitectura de Escritorio (Offline-First):** Ejecución 100% local sin dependencia de servidores externos.
- **Control de Recepciones:** Registro detallado de equipos, fallas y estados de reparación con snapshots del estado de entrada.
- **Auditoría y Trazabilidad:** Historial completo de cambios en recepciones y presupuestos para un control total.
- **Gestión de Clientes y Equipos:** Catálogo centralizado con búsqueda rápida por serial e historial de servicios.
- **Presupuestos y Finanzas:** Creación dinámica de presupuestos, seguimiento de abonos y estados de pago.
- **Reportes e Impresión:** Generación de informes de servicio listos para impresión local.
- **Dashboard en Tiempo Real:** Métricas y estadísticas actualizadas al instante mediante WebSockets internos.
- **Backup Nativo:** Sistema integrado para respaldar y restaurar la base de datos localmente.

## 🏗️ Arquitectura y Tecnologías

- **Motor de Escritorio:** [Electron](https://www.electronjs.org/).
- **Backend:** Node.js, Express, Knex.js.
- **Base de Datos:** [SQLite](https://www.sqlite.org/) (embebida, rápida y portable).
- **Frontend:** React 18, Vite, Tailwind CSS, Zustand (Estado), Lucide React (Iconos).
- **Tiempo Real:** Socket.io (adaptador local).
- **Distribución:** Electron Builder (generación de instaladores .exe, .dmg, .appimage).

## 🛠️ Desarrollo e Instalación

### Requisitos Previos

- [Node.js](https://nodejs.org/) (v20 o superior recomendado).
- Herramientas de compilación de C++ (necesarias para módulos nativos como `better-sqlite3`).

### Configuración del Entorno

1. Instalar dependencias en la raíz:
   ```bash
   npm install
   ```
2. Instalar dependencias del frontend:
   ```bash
   npm install --prefix frontend/react/app-taller
   ```

### Comandos de Ejecución

- **Modo Desarrollo:** Inicia el backend, el frontend y la ventana de Electron con Hot-Reload.
  ```bash
  npm run dev
  ```
- **Generar Instalador (Producción):** Compila el frontend y genera el ejecutable distribuible en la carpeta `/release`.
  ```bash
  npm run electron:build
  ```

## 🔐 Configuración Inicial (Setup)

Al iniciar la aplicación por primera vez en un equipo limpio, se activará automáticamente el **Asistente de Configuración**. Aquí podrás:

1. Definir los datos de identidad de tu taller (Nombre, RIF, Logo, Dirección).
2. Crear tu cuenta maestra de administrador local.

## 🧪 Pruebas

Ejecuta la suite de pruebas unitarias e integración para el backend:

```bash
npm test
```

---

**Desarrollado con ❤️ para servicios técnicos modernos.**
