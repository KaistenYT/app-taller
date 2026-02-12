window.addEventListener("DOMContentLoaded", () => {
  // 1. Referencias a elementos del DOM: Organiza todos los elementos del HTML con los que el script interactúa.
  const domRefs = {
    // Filtros de búsqueda (inputs, selects)
    search: document.getElementById("f-search"),
    receptionId: document.getElementById("f-reception-id"),
    action: document.getElementById("f-action"),
    status: document.getElementById("f-status"),
    from: document.getElementById("f-from"), // Filtro de fecha "desde"
    to: document.getElementById("f-to"),     // Filtro de fecha "hasta"
    pageSize: document.getElementById("page-size"), // Tamaño de página para la paginación
    
    // Botones de acción y control
    btnFilter: document.getElementById("btn-filter"),       // Botón para aplicar filtros
    btnClear: document.getElementById("btn-clear"),         // Botón para limpiar todos los filtros
    btnQuickToday: document.getElementById("btn-quick-today"), // Botón para filtro rápido "hoy"
    btnQuickWeek: document.getElementById("btn-quick-week"),   // Botón para filtro rápido "última semana"
    btnExport: document.getElementById("btn-export"),       // Botón para exportar datos
    btnPrint: document.getElementById("btn-print"),         // Botón para imprimir la página
    
    // Elementos de la tabla y UI de resultados
    tbody: document.getElementById("history-body"),               // Cuerpo de la tabla donde se renderizan los registros
    alertArea: document.getElementById("alert-area"),             // Área para mostrar mensajes de alerta
    prevBtn: document.getElementById("prev-page"),                // Botón de paginación "Anterior"
    nextBtn: document.getElementById("next-page"),                // Botón de paginación "Siguiente"
    pagingInfo: document.getElementById("paging-info"),           // Información de paginación (ej. "Mostrando X de Y registros")
    loadingIndicator: document.getElementById("loading-indicator"), // Indicador de carga
    historyTable: document.getElementById("history-table"),       // Contenedor principal de la tabla de historial
    totalCount: document.getElementById("total-count"),           // Badge para mostrar el total de registros
    activeFiltersDiv: document.getElementById("active-filters"),  // Div para mostrar los filtros activos en forma de badges
    filterBadges: document.getElementById("filter-badges"),       // Contenedor de los badges de filtro activo
  };

  // 2. Constantes de configuración: Define valores fijos y configuraciones globales.
  const CONSTANTS = {
    DEFAULT_PAGE_SIZE: 10,       // Tamaño de página predeterminado
    SEARCH_DEBOUNCE_MS: 500,     // Retraso para la función debounce en búsquedas (evita llamadas excesivas a la API)
    ALERT_TIMEOUT: {             // Tiempos de duración de las alertas
      DEFAULT: 5000,
      SHORT: 2000,
      NONE: 0,
    },
  };

  // Mapeo de estados a colores para badges de UI
  const STATUS_COLORS = {
    PENDIENTE: "warning",
    EN_PROCESO: "info",
    REPARADO: "success",
    ENTREGADO: "secondary",
    CANCELADO: "danger",
  };

  // Configuración de acciones para badges de UI (color e icono)
  const ACTION_CONFIG = {
    UPDATED: { color: "info", icon: "pencil-square" },
    DELETED: { color: "danger", icon: "trash" },
    ARCHIVED: { color: "warning text-dark", icon: "archive" },
    CREATED: { color: "success", icon: "plus-circle" },
  };

  // Etiquetas y iconos para los filtros mostrados como badges
  const FILTER_LABELS = {
    free: { label: "Búsqueda", icon: "search" },
    reception_id: { label: "Recepción #", icon: "receipt" },
    action: { label: "Acción", icon: "lightning" },
    status: { label: "Estado", icon: "flag" },
    from: { label: "Desde", icon: "calendar-event" },
    to: { label: "Hasta", icon: "calendar-check" },
  };

  // Iconos para los diferentes tipos de alertas
  const ALERT_ICONS = {
    success: "check-circle-fill",
    danger: "exclamation-triangle-fill",
    warning: "exclamation-circle-fill",
    info: "info-circle-fill",
  };

  // 3. Estado de la aplicación: Almacena el estado dinámico (paginación, filtros activos, etc.).
  let state = {
    currentPage: 0,       // Página actual (0-indexada)
    pageSize: CONSTANTS.DEFAULT_PAGE_SIZE, // Registros por página
    searchTimeout: null,  // Temporizador para el debounce de búsqueda
    currentFilters: {},   // Objeto con los filtros activos actualmente
    totalRecords: 0,      // Número total de registros que coinciden con los filtros
  };

  // 4. Utilidades reutilizables: Funciones auxiliares genéricas.
  const utils = {
    // Rellena con un cero a la izquierda si el número es menor que 10
    pad: (n) => (n < 10 ? `0${n}` : n),
    
    /**
     * Formatea una fecha ISO a "DD/MM/YYYY".
     * @param {string} iso - Fecha en formato ISO string.
     * @returns {string} Fecha formateada.
     */
    formatDate: (iso) => {
      if (!iso) return "";
      const d = new Date(iso);
      return `${utils.pad(d.getDate())}/${utils.pad(d.getMonth() + 1)}/${d.getFullYear()}`;
    },
    
    /**
     * Formatea una fecha y hora ISO a "DD/MM/YYYY HH:MM".
     * @param {string} iso - Fecha y hora en formato ISO string.
     * @returns {string} Fecha y hora formateada.
     */
    formatDateTime: (iso) => {
      if (!iso) return "";
      const d = new Date(iso);
      return `${utils.pad(d.getDate())}/${utils.pad(d.getMonth() + 1)}/${d.getFullYear()} ${utils.pad(d.getHours())}:${utils.pad(d.getMinutes())}`;
    },
    
    /**
     * Escapa caracteres HTML para prevenir inyección.
     * @param {string} text - Texto a escapar.
     * @returns {string} Texto con caracteres HTML escapados.
     */
    escapeHtml: (text) => {
      if (text == null) return "";
      const div = document.createElement("div");
      div.textContent = text;
      return div.innerHTML;
    },

    /**
     * Implementa un patrón debounce para limitar la frecuencia de ejecución de una función.
     * @param {Function} func - La función a ejecutar.
     * @param {number} wait - El tiempo de espera en milisegundos.
     * @returns {Function} La función con debounce.
     */
    debounce: (func, wait) => {
      let timeout;
      return function executedFunction(...args) {
        const later = () => {
          clearTimeout(timeout);
          func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
      };
    },
  };

  // 5. Funciones de manipulación del DOM y UI: Gestiona la interfaz de usuario.
  const dom = {
    /**
     * Muestra una alerta temporal en la interfaz.
     * @param {string} type - Tipo de alerta (ej. "success", "danger", "info").
     * @param {string} msg - Mensaje a mostrar.
     * @param {number} [timeout=CONSTANTS.ALERT_TIMEOUT.DEFAULT] - Duración de la alerta.
     */
    showAlert: (type, msg, timeout = CONSTANTS.ALERT_TIMEOUT.DEFAULT) => {
      if (!domRefs.alertArea) return;
      
      const icon = ALERT_ICONS[type] || "info-circle-fill";
      domRefs.alertArea.innerHTML = `
        <div class="alert alert-${type} alert-dismissible fade show" role="alert">
          <i class="bi bi-${icon} me-2"></i>${msg}
          <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
      `;
      
      if (timeout) {
        setTimeout(() => {
          domRefs.alertArea.innerHTML = "";
        }, timeout);
      }
    },

    /**
     * Muestra u oculta el indicador de carga y la tabla principal.
     * @param {boolean} show - true para mostrar el indicador de carga, false para ocultarlo.
     */
    showLoading: (show) => {
      if (domRefs.loadingIndicator) {
        domRefs.loadingIndicator.style.display = show ? "block" : "none";
      }
      if (domRefs.historyTable) {
        domRefs.historyTable.style.display = show ? "none" : "block";
      }
    },

    /**
     * Actualiza la información de paginación y el estado de los botones "Anterior" y "Siguiente".
     * @param {number} total - Número total de registros que coinciden con los filtros.
     */
    updatePagination: (total) => {
      state.totalRecords = total || 0;
      const start = state.currentPage * state.pageSize + 1;
      const end = Math.min(
        (state.currentPage + 1) * state.pageSize,
        state.totalRecords,
      );

      if (domRefs.pagingInfo) {
        domRefs.pagingInfo.innerHTML = `Mostrando <strong>${start}-${end}</strong> de <strong>${state.totalRecords}</strong> registros`;
      }

      if (domRefs.totalCount) {
        domRefs.totalCount.textContent = `${state.totalRecords} registros`;
      }

      if (domRefs.prevBtn) {
        domRefs.prevBtn.disabled = state.currentPage === 0;
      }

      if (domRefs.nextBtn) {
        domRefs.nextBtn.disabled = end >= state.totalRecords;
      }
    },

    /**
     * Renderiza un mensaje cuando no se encuentran registros.
     */
    renderEmptyState: () => {
      domRefs.tbody.innerHTML = `
        <tr>
          <td colspan="8" class="text-center py-5">
            <i class="bi bi-inbox text-muted" style="font-size: 3rem;"></i>
            <p class="text-muted mt-3 mb-0">No se encontraron registros</p>
            <small class="text-muted">Intenta ajustar los filtros de búsqueda</small>
          </td>
        </tr>
      `;
    },

    /**
     * Renderiza una fila de la tabla de historial a partir de un objeto de registro.
     * @param {Object} record - Objeto con los datos del registro de historial.
     * @returns {HTMLTableRowElement} Elemento <tr> con los datos del registro.
     */
    renderRow: (record) => {
      const tr = document.createElement("tr");
      tr.style.cursor = "pointer";
      tr.title = "Ver detalles";

      const client = record.client_name
        ? `${record.client_name}<br><small class="text-muted">${record.client_id || ""}</small>`
        : record.client_id || '<span class="text-muted">N/A</span>';

      const device = record.device_description
        ? `${record.device_description}<br><small class="text-muted">${record.device_serial || ""}</small>`
        : record.device_serial ||
          record.device_id ||
          '<span class="text-muted">N/A</span>';

      const statusColor = STATUS_COLORS[record.status] || "secondary";
      const statusBadge = `<span class="badge bg-${statusColor}">${utils.escapeHtml(record.status || "N/A")}</span>`;

      const actionConfig = ACTION_CONFIG[record.action] || {
        color: "secondary",
        icon: "circle",
      };
      const actionBadge = `<span class="badge bg-${actionConfig.color}">
        <i class="bi bi-${actionConfig.icon} me-1"></i>${utils.escapeHtml(record.action || "N/A")}
      </span>`;

      tr.innerHTML = `
        <td class="text-center align-middle fw-bold text-muted">${record.id}</td>
        <td class="align-middle">
          <span class="badge bg-primary-subtle text-primary">#${record.reception_id || "N/A"}</span>
        </td>
        <td class="align-middle">${client}</td>
        <td class="align-middle">${device}</td>
        <td class="text-center align-middle">${statusBadge}</td>
        <td class="text-center align-middle">${actionBadge}</td>
        <td class="align-middle">
          <small><i class="bi bi-person-circle me-1"></i>${utils.escapeHtml(record.performed_by_username || "N/A")}</small>
        </td>
        <td class="align-middle">
          <small><i class="bi bi-calendar3 me-1"></i>${utils.formatDate(record.reception_date)}</small>
        </td>
        <td class="align-middle">
          <small><i class="bi bi-clock me-1"></i>${utils.formatDateTime(record.event_timestamp)}</small>
        </td>
      `;

      return tr;
    },
  };

  // 6. Gestión de filtros: Funciones para construir, mostrar y limpiar filtros.
  const filters = {
    /**
     * Construye un objeto de filtros a partir de los valores actuales de los elementos del DOM.
     * Incluye filtros de búsqueda general, ID de recepción, acción, estado, rango de fechas y paginación.
     * @returns {Object} Objeto con los filtros activos.
     */
    build: () => {
      const filters = {};
      
      const values = {
        free: domRefs.search?.value?.trim(),
        reception_id: domRefs.receptionId?.value?.trim(),
        action: domRefs.action?.value,
        status: domRefs.status?.value,
        from: domRefs.from?.value,
        to: domRefs.to?.value,
      };
      
      Object.entries(values).forEach(([key, value]) => {
        if (value) filters[key] = value;
      });
      
      filters.limit = state.pageSize;
      filters.offset = state.currentPage * state.pageSize;
      
      return filters;
    },

    /**
     * Muestra los filtros activos en la interfaz como badges.
     * Permite al usuario eliminar filtros individuales haciendo clic en el badge.
     * @param {Object} filters - Objeto con los filtros actualmente activos.
     */
    displayActive: (filters) => {
      if (!domRefs.filterBadges || !domRefs.activeFiltersDiv) return;
      
      domRefs.filterBadges.innerHTML = "";
      let hasFilters = false;
      
      Object.entries(filters).forEach(([key, value]) => {
        if (key === "limit" || key === "offset" || !value) return;
        
        hasFilters = true;
        const config = FILTER_LABELS[key] || { label: key, icon: "filter" };
        
        const badge = document.createElement("span");
        badge.className = "badge bg-primary-subtle text-primary me-2 mb-2";
        badge.innerHTML = `
          <i class="bi bi-${config.icon} me-1"></i>${config.label}: ${value}
          <button type="button" class="btn-close btn-close-sm ms-1" data-filter="${key}"></button>
        `;
        
        badge.querySelector(".btn-close").addEventListener("click", (e) => {
          e.stopPropagation();
          filters.remove(key); // Elimina el filtro individual al hacer clic en el botón de cerrar
        });
        
        domRefs.filterBadges.appendChild(badge);
      });
      
      domRefs.activeFiltersDiv.style.display = hasFilters ? "block" : "none";
    },

    /**
     * Elimina un filtro específico por su clave y recarga la página.
     * @param {string} filterKey - Clave del filtro a eliminar.
     */
    remove: (filterKey) => {
      const elementMap = {
        free: domRefs.search,
        reception_id: domRefs.receptionId,
        action: domRefs.action,
        status: domRefs.status,
        from: domRefs.from,
        to: domRefs.to,
      };
      
      if (elementMap[filterKey]) {
        elementMap[filterKey].value = ""; // Limpia el valor del campo de filtro en el DOM
      }
      
      state.currentPage = 0; // Reinicia la paginación al cambiar filtros
      loadPage(); // Recarga la página con los filtros actualizados
    },

    /**
     * Limpia todos los filtros de búsqueda y recarga la página.
     */
    clearAll: () => {
      const elementsToClear = [
        domRefs.search,
        domRefs.receptionId,
        domRefs.action,
        domRefs.status,
        domRefs.from,
        domRefs.to
      ];
      
      elementsToClear.forEach(el => el && (el.value = "")); // Limpia el valor de todos los campos de filtro
      
      if (domRefs.pageSize) {
        domRefs.pageSize.value = CONSTANTS.DEFAULT_PAGE_SIZE.toString(); // Restaura el tamaño de página por defecto
      }
      
      state.pageSize = CONSTANTS.DEFAULT_PAGE_SIZE; // Restaura el tamaño de página en el estado
      state.currentPage = 0; // Reinicia la paginación
      
      loadPage(); // Recarga la página con los filtros limpios
      dom.showAlert("info", "Filtros limpiados", CONSTANTS.ALERT_TIMEOUT.SHORT); // Muestra una notificación
    },

    /**
     * Aplica un filtro de fecha rápido (hoy o última semana) y recarga la página.
     * @param {string} type - Tipo de filtro rápido ("today" o "week").
     */
    applyQuickFilter: (type) => {
      const today = new Date();
      const dateString = today.toISOString().split("T")[0]; // Fecha actual en formato "YYYY-MM-DD"
      
      switch(type) {
        case 'today':
          if (domRefs.from) domRefs.from.value = dateString; // Establece "desde" y "hasta" a la fecha actual
          if (domRefs.to) domRefs.to.value = dateString;
          dom.showAlert(
            "info",
            "Mostrando registros de hoy",
            CONSTANTS.ALERT_TIMEOUT.SHORT,
          );
          break;
          
        case 'week':
          const lastWeek = new Date(today);
          lastWeek.setDate(today.getDate() - 7); // Calcula la fecha de hace 7 días
          
          if (domRefs.from)
            domRefs.from.value = lastWeek.toISOString().split("T")[0]; // Establece "desde" a hace 7 días
          if (domRefs.to) domRefs.to.value = dateString; // Establece "hasta" a la fecha actual
          dom.showAlert(
            "info",
            "Mostrando registros de la última semana",
            CONSTANTS.ALERT_TIMEOUT.SHORT,
          );
          break;
      }
      
      state.currentPage = 0; // Reinicia la paginación
      loadPage(); // Recarga la página con el filtro rápido aplicado
    }
  };

  /**
   * Carga los datos del historial de recepciones desde el backend, aplicando los filtros actuales y paginación.
   * Actualiza la tabla y la UI de paginación.
   */
  async function loadPage() {
    const currentFilters = filters.build(); // Construye los filtros a partir de la UI
    state.currentFilters = currentFilters; // Almacena los filtros activos en el estado
    
    try {
      dom.showLoading(true); // Muestra el indicador de carga
      
      // Realiza llamadas concurrentes a la API para obtener los registros y el conteo total
      const [rows, total] = await Promise.all([
        window.api.listReceptionHistory(currentFilters), // Obtiene los registros filtrados y paginados
        window.api.countReceptionHistory(currentFilters)  // Obtiene el conteo total de registros
      ]);
      
      domRefs.tbody.innerHTML = ""; // Limpia la tabla actual
      
      if (!rows || rows.length === 0) {
        dom.renderEmptyState(); // Muestra el estado vacío si no hay registros
      } else {
        const fragment = document.createDocumentFragment();
        rows.forEach(record => {
          fragment.appendChild(dom.renderRow(record)); // Renderiza cada fila de registro
        });
        domRefs.tbody.appendChild(fragment); // Añade todas las filas a la tabla
      }
      
      dom.updatePagination(total); // Actualiza la UI de paginación
      filters.displayActive(currentFilters); // Muestra los filtros activos como badges
      
    } catch (err) {
      console.error("Error al cargar el historial:", err);
      dom.showAlert("danger", "Error al cargar el historial. Por favor, intente nuevamente."); // Muestra una alerta de error
    } finally {
      dom.showLoading(false); // Oculta el indicador de carga
    }
  }

  // 8. Exportación de datos: Funciones para exportar el historial a CSV.
  const exportHandler = {
    /**
     * Descarga los registros proporcionados como un archivo CSV.
     * @param {Array<Object>} rows - Array de objetos de registro a exportar.
     */
    downloadCSV: (rows) => {
      if (!rows || rows.length === 0) {
        return dom.showAlert(
          "warning",
          "No hay datos para exportar. Intenta ajustar los filtros.",
        );
      }

      // Define las cabeceras del CSV
      const headers = [
        "id",
        "reception_id",
        "client_id",
        "client_name",
        "device_id",
        "device_description",
        "reception_date",
        "status",
        "action",
        "event_timestamp",
      ];
      
      // Crea el contenido del CSV
      const csvContent = [
        headers.join(","), // Fila de cabeceras
        ...rows.map((row) =>
          headers
            .map((header) => {
              const value = row[header] == null ? "" : String(row[header]);
              return `"${value.replace(/"/g, '""')}"`; // Escapa comillas dentro del valor
            })
            .join(","),
        ),
      ].join("\n");

      // Crea un Blob y descarga el archivo
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `reception_history_${new Date().toISOString().slice(0, 10)}.csv`; // Nombre del archivo
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      dom.showAlert(
        "success",
        `Archivo CSV exportado exitosamente (${rows.length} registros)`,
      );
    },

    /**
     * Exporta a CSV los registros de la página actual, según los filtros aplicados.
     */
    exportCurrentPage: async () => {
      try {
        dom.showAlert(
          "info",
          "Exportando datos...",
          CONSTANTS.ALERT_TIMEOUT.NONE,
        );
        const currentFilters = filters.build(); // Obtiene los filtros actuales
        const rows = await window.api.listReceptionHistory(currentFilters); // Obtiene los datos del backend
        exportHandler.downloadCSV(rows); // Descarga el CSV
      } catch (err) {
        console.error("Error en exportación:", err);
        dom.showAlert("danger", "Error al exportar CSV");
      }
    },

    /**
     * Exporta a CSV todos los registros que coinciden con los filtros, ignorando la paginación.
     */
    exportAll: async () => {
      try {
        dom.showAlert(
          "info",
          "Exportando todos los registros...",
          CONSTANTS.ALERT_TIMEOUT.NONE,
        );
        const currentFilters = filters.build(); // Obtiene los filtros actuales
        delete currentFilters.limit; // Elimina la paginación para obtener todos los registros
        delete currentFilters.offset;

        const rows = await window.api.listReceptionHistory(currentFilters);
        exportHandler.downloadCSV(rows);
      } catch (err) {
        console.error("Error en exportación total:", err);
        dom.showAlert("danger", "Error al exportar todos los registros");
      }
    },
  };

  // 9. Configuración de escuchadores de eventos para la interacción del usuario.
  const setupEventListeners = () => {
    // Eventos de filtros que activan una recarga de página con debounce para inputs
    const debouncedLoad = utils.debounce(() => {
      state.currentPage = 0; // Reinicia la paginación al cambiar filtros
      loadPage();
    }, CONSTANTS.SEARCH_DEBOUNCE_MS);
    
    // Escuchadores para inputs de búsqueda general y ID de recepción
    [domRefs.search, domRefs.receptionId].forEach((input) => {
      input?.addEventListener("input", debouncedLoad);
    });
    
    // Escuchadores para selects de acción y estado
    [domRefs.action, domRefs.status].forEach((select) => {
      select?.addEventListener("change", () => {
        state.currentPage = 0; // Reinicia la paginación al cambiar filtros
        loadPage();
      });
    });
    
    // Escuchadores para inputs de fecha y búsqueda al presionar Enter
    [domRefs.search, domRefs.receptionId, domRefs.from, domRefs.to].forEach(
      (input) => {
        input?.addEventListener("keypress", (e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            state.currentPage = 0; // Reinicia la paginación
            loadPage();
          }
        });
      },
    );
    
    // Escuchadores para botones de filtro y limpieza
    domRefs.btnFilter?.addEventListener("click", () => {
      state.currentPage = 0; // Reinicia la paginación
      loadPage();
    });
    
    domRefs.btnClear?.addEventListener("click", filters.clearAll); // Limpia todos los filtros
    domRefs.btnQuickToday?.addEventListener("click", () =>
      filters.applyQuickFilter("today"), // Aplica filtro rápido "hoy"
    );
    domRefs.btnQuickWeek?.addEventListener("click", () =>
      filters.applyQuickFilter("week"), // Aplica filtro rápido "última semana"
    );
    
    // Escuchadores para botones de exportación e impresión
    domRefs.btnExport?.addEventListener(
      "click",
      exportHandler.exportCurrentPage, // Exporta la página actual a CSV
    );
    domRefs.btnPrint?.addEventListener("click", () => window.print()); // Imprime la página
    
    // Escuchadores para botones de paginación
    domRefs.prevBtn?.addEventListener("click", () => {
      if (state.currentPage > 0) {
        state.currentPage--; // Decrementa la página actual
        loadPage();
      }
    });
    
    domRefs.nextBtn?.addEventListener("click", () => {
      if ((state.currentPage + 1) * state.pageSize < state.totalRecords) {
        state.currentPage++; // Incrementa la página actual
        loadPage();
      }
    });
    
    // Escuchador para el cambio de tamaño de página
    domRefs.pageSize?.addEventListener("change", (e) => {
      state.pageSize = Number(e.target.value) || CONSTANTS.DEFAULT_PAGE_SIZE; // Actualiza el tamaño de página
      state.currentPage = 0; // Reinicia la paginación
      loadPage();
    });
  };

  // 10. Inicialización: Configura los escuchadores y carga la primera página.
  setupEventListeners(); // Configura todos los escuchadores de eventos
  loadPage(); // Carga la página inicial con los filtros por defecto
});
