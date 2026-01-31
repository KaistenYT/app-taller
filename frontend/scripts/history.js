window.addEventListener("DOMContentLoaded", () => {
  // 1. Mejor organización de referencias DOM
  const domRefs = {
    // Filtros
    search: document.getElementById("f-search"),
    receptionId: document.getElementById("f-reception-id"),
    action: document.getElementById("f-action"),
    status: document.getElementById("f-status"),
    from: document.getElementById("f-from"),
    to: document.getElementById("f-to"),
    pageSize: document.getElementById("page-size"),
    
    // Botones
    btnFilter: document.getElementById("btn-filter"),
    btnClear: document.getElementById("btn-clear"),
    btnQuickToday: document.getElementById("btn-quick-today"),
    btnQuickWeek: document.getElementById("btn-quick-week"),
    btnExport: document.getElementById("btn-export"),
    btnPrint: document.getElementById("btn-print"),
    
    // Tabla y contenido
    tbody: document.getElementById("history-body"),
    alertArea: document.getElementById("alert-area"),
    prevBtn: document.getElementById("prev-page"),
    nextBtn: document.getElementById("next-page"),
    pagingInfo: document.getElementById("paging-info"),
    loadingIndicator: document.getElementById("loading-indicator"),
    historyTable: document.getElementById("history-table"),
    totalCount: document.getElementById("total-count"),
    activeFiltersDiv: document.getElementById("active-filters"),
    filterBadges: document.getElementById("filter-badges"),
  };

  // 2. Constantes y configuraciones
  const CONSTANTS = {
    DEFAULT_PAGE_SIZE: 50,
    SEARCH_DEBOUNCE_MS: 500,
    ALERT_TIMEOUT: {
      DEFAULT: 5000,
      SHORT: 2000,
      NONE: 0
    }
  };

  const STATUS_COLORS = {
    PENDIENTE: "warning",
    EN_PROCESO: "info",
    REPARADO: "success",
    ENTREGADO: "secondary",
    CANCELADO: "danger",
  };

  const ACTION_CONFIG = {
    UPDATED: { color: "info", icon: "pencil-square" },
    DELETED: { color: "danger", icon: "trash" },
    ARCHIVED: { color: "warning text-dark", icon: "archive" },
    CREATED: { color: "success", icon: "plus-circle" },
  };

  const FILTER_LABELS = {
    free: { label: "Búsqueda", icon: "search" },
    reception_id: { label: "Recepción #", icon: "receipt" },
    action: { label: "Acción", icon: "lightning" },
    status: { label: "Estado", icon: "flag" },
    from: { label: "Desde", icon: "calendar-event" },
    to: { label: "Hasta", icon: "calendar-check" },
  };

  const ALERT_ICONS = {
    success: "check-circle-fill",
    danger: "exclamation-triangle-fill",
    warning: "exclamation-circle-fill",
    info: "info-circle-fill",
  };

  // 3. Estado de la aplicación
  let state = {
    currentPage: 0,
    pageSize: CONSTANTS.DEFAULT_PAGE_SIZE,
    searchTimeout: null,
    currentFilters: {},
    totalRecords: 0
  };

  // 4. Utilidades reutilizables
  const utils = {
    pad: (n) => n < 10 ? `0${n}` : n,
    
    formatDate: (iso) => {
      if (!iso) return "";
      const d = new Date(iso);
      return `${utils.pad(d.getDate())}/${utils.pad(d.getMonth() + 1)}/${d.getFullYear()}`;
    },
    
    formatDateTime: (iso) => {
      if (!iso) return "";
      const d = new Date(iso);
      return `${utils.pad(d.getDate())}/${utils.pad(d.getMonth() + 1)}/${d.getFullYear()} ${utils.pad(d.getHours())}:${utils.pad(d.getMinutes())}`;
    },
    
    escapeHtml: (text) => {
      if (text == null) return "";
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    },

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
    }
  };

  // 5. Funciones del DOM
  const dom = {
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

    showLoading: (show) => {
      if (domRefs.loadingIndicator) {
        domRefs.loadingIndicator.style.display = show ? "block" : "none";
      }
      if (domRefs.historyTable) {
        domRefs.historyTable.style.display = show ? "none" : "block";
      }
    },

    updatePagination: (total) => {
      state.totalRecords = total || 0;
      const start = state.currentPage * state.pageSize + 1;
      const end = Math.min((state.currentPage + 1) * state.pageSize, state.totalRecords);
      
      if (domRefs.pagingInfo) {
        domRefs.pagingInfo.innerHTML = 
          `Mostrando <strong>${start}-${end}</strong> de <strong>${state.totalRecords}</strong> registros`;
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

    renderRow: (record) => {
      const tr = document.createElement("tr");
      tr.style.cursor = "pointer";
      tr.title = "Ver detalles";

      const client = record.client_name
        ? `${record.client_name}<br><small class="text-muted">${record.client_id || ""}</small>`
        : record.client_id || '<span class="text-muted">N/A</span>';
      
      const device = record.device_description
        ? `${record.device_description}<br><small class="text-muted">${record.device_serial || ""}</small>`
        : record.device_serial || record.device_id || '<span class="text-muted">N/A</span>';

      const statusColor = STATUS_COLORS[record.status] || "secondary";
      const statusBadge = `<span class="badge bg-${statusColor}">${utils.escapeHtml(record.status || "N/A")}</span>`;

      const actionConfig = ACTION_CONFIG[record.action] || { color: "secondary", icon: "circle" };
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
          <small><i class="bi bi-calendar3 me-1"></i>${utils.formatDate(record.reception_date)}</small>
        </td>
        <td class="align-middle">
          <small><i class="bi bi-clock me-1"></i>${utils.formatDateTime(record.event_timestamp)}</small>
        </td>
      `;
      
      return tr;
    }
  };

  // 6. Gestión de filtros
  const filters = {
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
          filters.remove(key);
        });
        
        domRefs.filterBadges.appendChild(badge);
      });
      
      domRefs.activeFiltersDiv.style.display = hasFilters ? "block" : "none";
    },

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
        elementMap[filterKey].value = "";
      }
      
      state.currentPage = 0;
      loadPage();
    },

    clearAll: () => {
      const elementsToClear = [
        domRefs.search,
        domRefs.receptionId,
        domRefs.action,
        domRefs.status,
        domRefs.from,
        domRefs.to
      ];
      
      elementsToClear.forEach(el => el && (el.value = ""));
      
      if (domRefs.pageSize) {
        domRefs.pageSize.value = CONSTANTS.DEFAULT_PAGE_SIZE.toString();
      }
      
      state.pageSize = CONSTANTS.DEFAULT_PAGE_SIZE;
      state.currentPage = 0;
      
      loadPage();
      dom.showAlert("info", "Filtros limpiados", CONSTANTS.ALERT_TIMEOUT.SHORT);
    },

    applyQuickFilter: (type) => {
      const today = new Date();
      const dateString = today.toISOString().split("T")[0];
      
      switch(type) {
        case 'today':
          if (domRefs.from) domRefs.from.value = dateString;
          if (domRefs.to) domRefs.to.value = dateString;
          dom.showAlert("info", "Mostrando registros de hoy", CONSTANTS.ALERT_TIMEOUT.SHORT);
          break;
          
        case 'week':
          const lastWeek = new Date(today);
          lastWeek.setDate(today.getDate() - 7);
          
          if (domRefs.from) domRefs.from.value = lastWeek.toISOString().split("T")[0];
          if (domRefs.to) domRefs.to.value = dateString;
          dom.showAlert("info", "Mostrando registros de la última semana", CONSTANTS.ALERT_TIMEOUT.SHORT);
          break;
      }
      
      state.currentPage = 0;
      loadPage();
    }
  };

  // 7. Carga de datos
  async function loadPage() {
    const currentFilters = filters.build();
    state.currentFilters = currentFilters;
    
    try {
      dom.showLoading(true);
      
      const [rows, total] = await Promise.all([
        window.api.listReceptionHistory(currentFilters),
        window.api.countReceptionHistory(currentFilters)
      ]);
      
      domRefs.tbody.innerHTML = "";
      
      if (!rows || rows.length === 0) {
        dom.renderEmptyState();
      } else {
        const fragment = document.createDocumentFragment();
        rows.forEach(record => {
          fragment.appendChild(dom.renderRow(record));
        });
        domRefs.tbody.appendChild(fragment);
      }
      
      dom.updatePagination(total);
      filters.displayActive(currentFilters);
      
    } catch (err) {
      console.error("Error al cargar el historial:", err);
      dom.showAlert("danger", "Error al cargar el historial. Por favor, intente nuevamente.");
    } finally {
      dom.showLoading(false);
    }
  }

  // 8. Exportación de datos
  const exportHandler = {
    downloadCSV: (rows) => {
      if (!rows || rows.length === 0) {
        return dom.showAlert("warning", "No hay datos para exportar. Intenta ajustar los filtros.");
      }
      
      const headers = [
        "id", "reception_id", "client_id", "client_name",
        "device_id", "device_description", "reception_date",
        "status", "action", "event_timestamp"
      ];
      
      const csvContent = [
        headers.join(","),
        ...rows.map(row => 
          headers.map(header => {
            const value = row[header] == null ? "" : String(row[header]);
            return `"${value.replace(/"/g, '""')}"`;
          }).join(",")
        )
      ].join("\n");
      
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `reception_history_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      dom.showAlert("success", `Archivo CSV exportado exitosamente (${rows.length} registros)`);
    },

    exportCurrentPage: async () => {
      try {
        dom.showAlert("info", "Exportando datos...", CONSTANTS.ALERT_TIMEOUT.NONE);
        const currentFilters = filters.build();
        const rows = await window.api.listReceptionHistory(currentFilters);
        exportHandler.downloadCSV(rows);
      } catch (err) {
        console.error("Error en exportación:", err);
        dom.showAlert("danger", "Error al exportar CSV");
      }
    },

    exportAll: async () => {
      try {
        dom.showAlert("info", "Exportando todos los registros...", CONSTANTS.ALERT_TIMEOUT.NONE);
        const currentFilters = filters.build();
        delete currentFilters.limit;
        delete currentFilters.offset;
        
        const rows = await window.api.listReceptionHistory(currentFilters);
        exportHandler.downloadCSV(rows);
      } catch (err) {
        console.error("Error en exportación total:", err);
        dom.showAlert("danger", "Error al exportar todos los registros");
      }
    }
  };

  // 9. Configuración de eventos optimizada
  const setupEventListeners = () => {
    // Eventos de filtros
    const debouncedLoad = utils.debounce(() => {
      state.currentPage = 0;
      loadPage();
    }, CONSTANTS.SEARCH_DEBOUNCE_MS);
    
    [domRefs.search, domRefs.receptionId].forEach(input => {
      input?.addEventListener("input", debouncedLoad);
    });
    
    [domRefs.action, domRefs.status].forEach(select => {
      select?.addEventListener("change", () => {
        state.currentPage = 0;
        loadPage();
      });
    });
    
    // Enter en campos de búsqueda
    [domRefs.search, domRefs.receptionId, domRefs.from, domRefs.to].forEach(input => {
      input?.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          state.currentPage = 0;
          loadPage();
        }
      });
    });
    
    // Botones principales
    domRefs.btnFilter?.addEventListener("click", () => {
      state.currentPage = 0;
      loadPage();
    });
    
    domRefs.btnClear?.addEventListener("click", filters.clearAll);
    domRefs.btnQuickToday?.addEventListener("click", () => filters.applyQuickFilter('today'));
    domRefs.btnQuickWeek?.addEventListener("click", () => filters.applyQuickFilter('week'));
    
    // Exportación e impresión
    domRefs.btnExport?.addEventListener("click", exportHandler.exportCurrentPage);
    domRefs.btnPrint?.addEventListener("click", () => window.print());
    
    // Paginación
    domRefs.prevBtn?.addEventListener("click", () => {
      if (state.currentPage > 0) {
        state.currentPage--;
        loadPage();
      }
    });
    
    domRefs.nextBtn?.addEventListener("click", () => {
      if (((state.currentPage + 1) * state.pageSize) < state.totalRecords) {
        state.currentPage++;
        loadPage();
      }
    });
    
    // Tamaño de página
    domRefs.pageSize?.addEventListener("change", (e) => {
      state.pageSize = Number(e.target.value) || CONSTANTS.DEFAULT_PAGE_SIZE;
      state.currentPage = 0;
      loadPage();
    });
  };

  // 10. Inicialización
  setupEventListeners();
  loadPage();
});