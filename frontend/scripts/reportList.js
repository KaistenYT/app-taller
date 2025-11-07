const API_PREFIX = "report";
let allReports = [];
let filteredReports = [];

const reportsContainer = document.getElementById("reports-container");
const loadingElement = document.getElementById("loading");
const noReportsElement = document.getElementById("no-reports");
const searchInput = document.getElementById("searchInput");
const dateFilter = document.getElementById("dateFilter");
const btnRefresh = document.getElementById("btn-refresh");
const btnApplyFilters = document.getElementById("btn-apply-filters");

document.addEventListener("DOMContentLoaded", async () => {
  await loadReports();

  setupEventListeners();
});

function setupEventListeners() {
  if (btnRefresh) {
    btnRefresh.addEventListener("click", loadReports);
  }

  if (btnApplyFilters) {
    btnApplyFilters.addEventListener("click", applyFilters);
  }

  if (searchInput) {
    searchInput.addEventListener("keyup", (e) => {
      if (e.key === "Enter") {
        applyFilters();
      }
    });
  }
}

async function loadReports() {
  try {
    showLoading(true);

    const reports = await apiCall("list-reports");

    if (reports && Array.isArray(reports)) {
      allReports = reports.map((report) => ({
        ...report,

        created_at: formatDate(report.created_at),

        isNew: isNewReport(report.created_at),
      }));

      applyFilters();
    } else {
      console.error("Formato de respuesta inesperado:", reports);
      showNoReports(true);
    }
  } catch (error) {
    console.error("Error al cargar reportes:", error);
    showError("Error al cargar los reportes. Intente de nuevo más tarde.");
  } finally {
    showLoading(false);
  }
}

function applyFilters() {
  const searchTerm = searchInput ? searchInput.value.toLowerCase() : "";
  const selectedDate = dateFilter ? dateFilter.value : "";

  filteredReports = allReports.filter((report) => {
    const matchesSearch =
      !searchTerm ||
      (report.id && report.id.toString().includes(searchTerm)) ||
      (report.description &&
        report.description.toLowerCase().includes(searchTerm)) ||
      (report.client_name &&
        report.client_name.toLowerCase().includes(searchTerm));

    const matchesDate =
      !selectedDate ||
      (report.created_at && report.created_at.startsWith(selectedDate));

    return matchesSearch && matchesDate;
  });

  showNoReports(filteredReports.length === 0);

  renderReports(filteredReports);
}

function renderReports(reports) {
  if (!reportsContainer) return;

  reportsContainer.innerHTML = "";

  if (!reports || reports.length === 0) {
    showNoReports(true);
    return;
  }

  reports.forEach((report) => {
    const reportCard = createReportCard(report);
    reportsContainer.appendChild(reportCard);
  });
}

function createReportCard(report) {
  const col = document.createElement("div");
  col.className = "col-12 col-md-6 col-lg-4";

  const card = document.createElement("div");
  card.className = "card h-100 report-card";
  card.style.position = "relative";

  if (report.isNew) {
    const newBadge = document.createElement("span");
    newBadge.className = "badge bg-success status-badge";
    newBadge.textContent = "Nuevo";
    card.appendChild(newBadge);
  }

  const cardBody = document.createElement("div");
  cardBody.className = "card-body";

  const title = document.createElement("h5");
  title.className = "card-title";
  title.textContent = `Reporte #${report.id}`;

  const clientInfo = document.createElement("p");
  clientInfo.className = "card-text text-muted mb-1";
  clientInfo.innerHTML = `<strong>Cliente:</strong> ${report.client_name || "No especificado"}`;

  const deviceInfo = document.createElement("p");
  deviceInfo.className = "card-text text-muted mb-1";
  deviceInfo.innerHTML = `<strong>Dispositivo:</strong> ${report.device_description || "No especificado"}`;

  if (report.reception_defect) {
    const defectInfo = document.createElement("p");
    defectInfo.className = "card-text text-muted mb-1";
    defectInfo.innerHTML = `<strong>Defecto:</strong> ${report.reception_defect}`;
    cardBody.appendChild(defectInfo);
  }

  if (report.reception_status) {
    const statusBadge = document.createElement("span");
    statusBadge.className = `badge bg-${getStatusColor(report.reception_status)} mb-2`;
    statusBadge.textContent = report.reception_status;
    cardBody.appendChild(statusBadge);
  }

  const dateInfo = document.createElement("p");
  dateInfo.className = "card-text";
  const small = document.createElement("small");
  small.className = "text-muted";
  small.innerHTML = `<i class="bi bi-calendar3"></i> ${report.created_at || "Fecha no disponible"}`;
  dateInfo.appendChild(small);

  // Botón para ver detalles
  const button = document.createElement("a");
  button.href = `report.html?id=${report.id}`;
  button.className = "btn btn-outline-primary btn-sm mt-2";
  button.textContent = "Ver detalles";

  cardBody.appendChild(title);
  cardBody.appendChild(clientInfo);
  cardBody.appendChild(deviceInfo);
  cardBody.appendChild(dateInfo);
  cardBody.appendChild(button);

  card.appendChild(cardBody);
  col.appendChild(card);

  return col;
}

function getStatusColor(status) {
  const statusColors = {
    PENDIENTE: "warning",
    EN_PROCESO: "info",
    REPARADO: "success",
    ENTREGADO: "secondary",
    CANCELADO: "danger",
  };
  return statusColors[status] || "secondary";
}

function showLoading(show) {
  if (loadingElement) {
    loadingElement.style.display = show ? "block" : "none";
  }
}

function showNoReports(show) {
  if (noReportsElement) {
    noReportsElement.classList.toggle("d-none", !show);
  }
}

function showError(message) {
  let alertElement = document.getElementById("error-alert");

  if (!alertElement) {
    alertElement = document.createElement("div");
    alertElement.id = "error-alert";
    alertElement.className = "alert alert-danger alert-dismissible fade show";
    alertElement.role = "alert";

    const container = document.querySelector(".container-fluid");
    if (container) {
      container.insertBefore(alertElement, container.firstChild);
    }
  }

  alertElement.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Cerrar"></button>
    `;

  setTimeout(() => {
    alertElement.classList.remove("show");
    setTimeout(() => {
      alertElement.remove();
    }, 150);
  }, 5000);
}

function formatDate(dateString) {
  if (!dateString) return "Fecha no disponible";

  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch (error) {
    console.error("Error al formatear fecha:", error);
    return dateString;
  }
}

function isNewReport(dateString) {
  if (!dateString) return false;

  try {
    const reportDate = new Date(dateString);
    const now = new Date();
    const diffInHours = (now - reportDate) / (1000 * 60 * 60);
    return diffInHours < 24;
  } catch (error) {
    console.error("Error al verificar fecha de reporte:", error);
    return false;
  }
}

async function apiCall(endpoint, data = null) {
  try {
    if (window.electron && window.electron.ipcRenderer) {
      return await window.electron.ipcRenderer.invoke(
        `${API_PREFIX}:${endpoint}`,
        data
      );
    } else if (window.api && window.api.invoke) {
      return await window.api.invoke(`${API_PREFIX}:${endpoint}`, data);
    } else {
      const response = await fetch(`/api/${API_PREFIX}/${endpoint}`, {
        method: data ? "POST" : "GET",
        headers: {
          "Content-Type": "application/json",
        },
        body: data ? JSON.stringify(data) : undefined,
      });

      if (!response.ok) {
        throw new Error(`Error en la petición: ${response.statusText}`);
      }

      return await response.json();
    }
  } catch (error) {
    console.error(`Error en la llamada a la API (${endpoint}):`, error);
    throw error;
  }
}
