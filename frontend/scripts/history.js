window.addEventListener("DOMContentLoaded", () => {
  const fSearch = document.getElementById("f-search");
  const fReceptionId = document.getElementById("f-reception-id");
  const fAction = document.getElementById("f-action");
  const fStatus = document.getElementById("f-status");
  const fFrom = document.getElementById("f-from");
  const fTo = document.getElementById("f-to");
  const pageSizeSelect = document.getElementById("page-size");
  const btnFilter = document.getElementById("btn-filter");
  const btnClear = document.getElementById("btn-clear");
  const btnQuickToday = document.getElementById("btn-quick-today");
  const btnQuickWeek = document.getElementById("btn-quick-week");
  const tbody = document.getElementById("history-body");
  const alertArea = document.getElementById("alert-area");
  const prevBtn = document.getElementById("prev-page");
  const nextBtn = document.getElementById("next-page");
  const pagingInfo = document.getElementById("paging-info");
  const loadingIndicator = document.getElementById("loading-indicator");
  const historyTable = document.getElementById("history-table");
  const totalCount = document.getElementById("total-count");
  const activeFiltersDiv = document.getElementById("active-filters");
  const filterBadges = document.getElementById("filter-badges");

  let page = 0;
  let pageSize = 50;
  let searchTimeout = null;

  function showAlert(type, msg, timeout = 5000) {
    if (!alertArea) return;
    const iconMap = {
      success: "check-circle-fill",
      danger: "exclamation-triangle-fill",
      warning: "exclamation-circle-fill",
      info: "info-circle-fill",
    };
    const icon = iconMap[type] || "info-circle-fill";
    alertArea.innerHTML = `
      <div class="alert alert-${type} alert-dismissible fade show" role="alert">
        <i class="bi bi-${icon} me-2"></i>${msg}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
      </div>
    `;
    if (timeout)
      setTimeout(() => {
        alertArea.innerHTML = "";
      }, timeout);
  }

  function showLoading(show) {
    if (loadingIndicator)
      loadingIndicator.style.display = show ? "block" : "none";
    if (historyTable) historyTable.style.display = show ? "none" : "block";
  }

  function buildFilters() {
    const filters = {};

    const free = fSearch?.value?.trim();
    if (free) filters.free = free;

    const receptionId = fReceptionId?.value?.trim();
    if (receptionId) filters.reception_id = receptionId;

    if (fAction?.value) filters.action = fAction.value;

    if (fStatus?.value) filters.status = fStatus.value;

    if (fFrom?.value) filters.from = fFrom.value;
    if (fTo?.value) filters.to = fTo.value;

    filters.limit = pageSize;
    filters.offset = page * pageSize;

    return filters;
  }

  function displayActiveFilters(filters) {
    if (!filterBadges || !activeFiltersDiv) return;

    filterBadges.innerHTML = "";
    let hasFilters = false;

    const filterLabels = {
      free: { label: "Búsqueda", icon: "search" },
      reception_id: { label: "Recepción #", icon: "receipt" },
      action: { label: "Acción", icon: "lightning" },
      status: { label: "Estado", icon: "flag" },
      from: { label: "Desde", icon: "calendar-event" },
      to: { label: "Hasta", icon: "calendar-check" },
    };

    Object.keys(filters).forEach((key) => {
      if (key === "limit" || key === "offset") return;
      if (!filters[key]) return;

      hasFilters = true;
      const config = filterLabels[key] || { label: key, icon: "filter" };
      const badge = document.createElement("span");
      badge.className = "badge bg-primary-subtle text-primary";
      badge.innerHTML = `
        <i class="bi bi-${config.icon} me-1"></i>${config.label}: ${filters[key]}
        <button type="button" class="btn-close btn-close-sm ms-1" style="font-size: 0.6rem;" data-filter="${key}"></button>
      `;

      badge.querySelector(".btn-close").addEventListener("click", () => {
        removeFilter(key);
      });

      filterBadges.appendChild(badge);
    });

    activeFiltersDiv.style.display = hasFilters ? "block" : "none";
  }

  function removeFilter(filterKey) {
    switch (filterKey) {
      case "free":
        if (fSearch) fSearch.value = "";
        break;
      case "reception_id":
        if (fReceptionId) fReceptionId.value = "";
        break;
      case "action":
        if (fAction) fAction.value = "";
        break;
      case "status":
        if (fStatus) fStatus.value = "";
        break;
      case "from":
        if (fFrom) fFrom.value = "";
        break;
      case "to":
        if (fTo) fTo.value = "";
        break;
    }
    page = 0;
    loadPage();
  }

  async function loadPage() {
    const filters = buildFilters();
    currentFilters = filters;

    try {
      showLoading(true);
      const rows = await window.api.listReceptionHistory(filters);
      tbody.innerHTML = "";

      if (!rows || rows.length === 0) {
        tbody.innerHTML = `
          <tr>
            <td colspan="8" class="text-center py-5">
              <i class="bi bi-inbox text-muted" style="font-size: 3rem;"></i>
              <p class="text-muted mt-3 mb-0">No se encontraron registros</p>
              <small class="text-muted">Intenta ajustar los filtros de búsqueda</small>
            </td>
          </tr>
        `;
      } else {
        for (const r of rows) {
          const tr = document.createElement("tr");
          tr.style.cursor = "pointer";
          tr.title = "Ver detalles";

          const client = r.client_name
            ? `${r.client_name}<br><small class="text-muted">${r.client_id || ""}</small>`
            : r.client_id || '<span class="text-muted">N/A</span>';
          const device = r.device_description
            ? `${r.device_description}<br><small class="text-muted">${r.device_serial || ""}</small>`
            : r.device_serial ||
              r.device_id ||
              '<span class="text-muted">N/A</span>';

          const statusColors = {
            PENDIENTE: "warning",
            EN_PROCESO: "info",
            REPARADO: "success",
            ENTREGADO: "secondary",
            CANCELADO: "danger",
          };
          const statusColor = statusColors[r.status] || "secondary";
          const statusBadge = `<span class="badge bg-${statusColor}">${escapeHtml(r.status || "N/A")}</span>`;

          const actionConfig = {
            UPDATED: { color: "info", icon: "pencil-square" },
            DELETED: { color: "danger", icon: "trash" },
            ARCHIVED: { color: "warning text-dark", icon: "archive" },
            CREATED: { color: "success", icon: "plus-circle" },
          };
          const config = actionConfig[r.action] || {
            color: "secondary",
            icon: "circle",
          };
          const actionBadge = `<span class="badge bg-${config.color}"><i class="bi bi-${config.icon} me-1"></i>${escapeHtml(r.action || "N/A")}</span>`;

          tr.innerHTML = `
            <td class="text-center align-middle fw-bold text-muted">${r.id}</td>
            <td class="align-middle">
              <span class="badge bg-primary-subtle text-primary">#${r.reception_id || "N/A"}</span>
            </td>
            <td class="align-middle">${client}</td>
            <td class="align-middle">${device}</td>
            <td class="text-center align-middle">${statusBadge}</td>
            <td class="text-center align-middle">${actionBadge}</td>
            <td class="align-middle">
              <small><i class="bi bi-calendar3 me-1"></i>${formatDate(r.reception_date)}</small>
            </td>
            <td class="align-middle">
              <small><i class="bi bi-clock me-1"></i>${formatDateTime(r.event_timestamp)}</small>
            </td>
          `;
          tbody.appendChild(tr);
        }
      }

      const total = await window.api.countReceptionHistory(filters);
      const start = page * pageSize + 1;
      const end = Math.min((page + 1) * pageSize, total || 0);

      pagingInfo.innerHTML = `Mostrando <strong>${start}-${end}</strong> de <strong>${total || 0}</strong> registros`;
      if (totalCount) totalCount.textContent = `${total || 0} registros`;

      prevBtn.disabled = page === 0;
      nextBtn.disabled = end >= (total || 0);

      showLoading(false);
      displayActiveFilters(filters);
    } catch (err) {
      console.error("load history error", err);
      showLoading(false);
      showAlert(
        "danger",
        "Error al cargar el historial. Por favor, intente nuevamente."
      );
    }
  }

  function debounceSearch() {
    if (searchTimeout) clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      page = 0;
      loadPage();
    }, 500);
  }

  function downloadCSV(rows) {
    if (!rows || rows.length === 0) {
      return showAlert(
        "warning",
        "No hay datos para exportar. Intenta ajustar los filtros."
      );
    }

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
    const csv = [headers.join(",")];
    for (const r of rows) {
      const line = headers
        .map((h) => {
          let v = r[h] == null ? "" : String(r[h]);

          v = '"' + v.replace(/"/g, '""') + '"';
          return v;
        })
        .join(",");
      csv.push(line);
    }
    const blob = new Blob([csv.join("\n")], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `reception_history_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    showAlert(
      "success",
      `Archivo CSV exportado exitosamente (${rows.length} registros)`
    );
  }

  async function exportCurrentPage() {
    const filters = buildFilters();
    try {
      showAlert("info", "Exportando datos...", 0);
      const rows = await window.api.listReceptionHistory(filters);
      downloadCSV(rows);
    } catch (err) {
      console.error("export error", err);
      showAlert("danger", "Error al exportar CSV");
    }
  }

  async function exportAll() {
    const filters = buildFilters();
    delete filters.limit;
    delete filters.offset;

    try {
      showAlert("info", "Exportando todos los registros...", 0);
      const rows = await window.api.listReceptionHistory(filters);
      downloadCSV(rows);
    } catch (err) {
      console.error("export all error", err);
      showAlert("danger", "Error al exportar todos los registros");
    }
  }

  function printView() {
    window.print();
  }

  function pad(n) {
    return n < 10 ? "0" + n : n;
  }
  function formatDate(iso) {
    if (!iso) return "";
    const d = new Date(iso);
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
  }
  function formatDateTime(iso) {
    if (!iso) return "";
    const d = new Date(iso);
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }
  function escapeHtml(s) {
    if (s == null) return "";
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  btnFilter.addEventListener("click", () => {
    page = 0;
    loadPage();
  });

  if (fSearch) {
    fSearch.addEventListener("input", debounceSearch);
  }

  if (fReceptionId) {
    fReceptionId.addEventListener("input", debounceSearch);
  }

  if (fAction) {
    fAction.addEventListener("change", () => {
      page = 0;
      loadPage();
    });
  }

  if (fStatus) {
    fStatus.addEventListener("change", () => {
      page = 0;
      loadPage();
    });
  }

  document
    .getElementById("btn-export")
    ?.addEventListener("click", exportCurrentPage);
  document.getElementById("btn-print")?.addEventListener("click", printView);

  prevBtn.addEventListener("click", () => {
    if (page > 0) page--;
    loadPage();
  });
  nextBtn.addEventListener("click", () => {
    page++;
    loadPage();
  });

  pageSizeSelect?.addEventListener("change", (e) => {
    pageSize = Number(e.target.value) || 50;
    page = 0;
    loadPage();
  });

  [fSearch, fReceptionId, fFrom, fTo].forEach((input) => {
    if (input) {
      input.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          page = 0;
          loadPage();
        }
      });
    }
  });

  btnClear?.addEventListener("click", () => {
    if (fSearch) fSearch.value = "";
    if (fReceptionId) fReceptionId.value = "";
    if (fAction) fAction.value = "";
    if (fStatus) fStatus.value = "";
    if (fFrom) fFrom.value = "";
    if (fTo) fTo.value = "";
    if (pageSizeSelect) pageSizeSelect.value = "50";
    pageSize = 50;
    page = 0;
    loadPage();
    showAlert("info", "Filtros limpiados", 2000);
  });

  btnQuickToday?.addEventListener("click", () => {
    const today = new Date().toISOString().split("T")[0];
    if (fFrom) fFrom.value = today;
    if (fTo) fTo.value = today;
    page = 0;
    loadPage();
    showAlert("info", "Mostrando registros de hoy", 2000);
  });

  btnQuickWeek?.addEventListener("click", () => {
    const today = new Date();
    const lastWeek = new Date(today);
    lastWeek.setDate(today.getDate() - 7);

    if (fFrom) fFrom.value = lastWeek.toISOString().split("T")[0];
    if (fTo) fTo.value = today.toISOString().split("T")[0];
    page = 0;
    loadPage();
    showAlert("info", "Mostrando registros de la última semana", 2000);
  });

  loadPage();
});
