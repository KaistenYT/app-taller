window.addEventListener("DOMContentLoaded", () => {
  (async () => {
    const params = new URLSearchParams(window.location.search);
    const reportId = params.get("id");
    const container = document.getElementById("report-content");

    function setContainerHTML(html) {
      if (container) {
        container.innerHTML = html;
      } else {
        console.error("report: container element #report-content not found.");
        const fallback = document.createElement("div");
        fallback.className = "m-3 alert alert-warning";
        fallback.innerHTML = html;
        document.body.appendChild(fallback);
      }
    }

    if (!reportId) {
      setContainerHTML(
        "<p class='text-danger'>No se proporcionó un ID de reporte.</p>",
      );
      return;
    }

    const toCamel = (s) => s.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
    const apiCall = async (channel, ...args) => {
      try {
        if (!window.api) throw new Error("API de Electron no disponible");
        const maybeFn = window.api[channel] || window.api[toCamel(channel)];
        if (typeof maybeFn === "function") return await maybeFn(...args);
        if (typeof window.api.invoke === "function")
          return await window.api.invoke(channel, ...args);
        throw new Error("API de Electron no disponible");
      } catch (err) {
        console.error("apiCall error", err);
        throw err;
      }
    };

    const report = await apiCall("get-report", Number(reportId));
    if (!report) {
      setContainerHTML("<p class='text-warning'>Reporte no encontrado.</p>");
      return;
    }

    let reception = null;
    try {
      if (report.reception_id) {
        reception = await apiCall("get-reception", report.reception_id);
      }
    } catch (e) {
      // Ignore
    }

    async function resolveClientInfo(rec) {
      if (!rec) return { name: "—", phone: "—", idNumber: "" };

      const idNumber =
        rec.client_idNumber || rec.client?.idNumber || rec.client?.id || "";
      let name =
        rec.client?.name ||
        rec.client_name ||
        rec.client?.fullName ||
        idNumber ||
        "—";
      let phone = rec.client?.phone || rec.client_phone || "";

      if ((!phone || phone === "") && idNumber) {
        try {
          const clientObj = await apiCall("get-client", idNumber);
          if (clientObj) {
            name = clientObj.name || name;
            phone = clientObj.phone || phone;
          }
        } catch (e) {
          // Ignore
        }
      }

      return { name: name || "—", phone: phone || "—", idNumber };
    }

    const clientInfo = await resolveClientInfo(reception);
    const clientName = clientInfo.name;
    const clientPhone = clientInfo.phone;
    const deviceSerial =
      reception?.device_snapshot?.serial_number ||
      reception?.device?.serial_number ||
      "—";
    const status = reception?.status || "—";
    const created = reception?.created_at || report?.created_at || "—";

    function escapeHtml(str) {
      if (str === null || str === undefined) return "";
      return String(str).replace(
        /[&<>"']/g,
        (ch) =>
          ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;",
          })[ch],
      );
    }

    setContainerHTML(`
      <div class="report">
        <div class="report-header d-flex justify-content-between align-items-start mb-3">
          <div>
            <h3 class="mb-1">Reporte de Recepción <small class="text-muted">#${report.id}</small></h3>
            <div class="meta text-muted small">
              <span>Fecha: ${created}</span>
              ${report.reception_id ? `<span class="mx-2">•</span><span>Recepción: ${report.reception_id}</span>` : ""}
            </div>
          </div>
          <div class="text-end">
            <button id="btn-export" class="btn btn-sm btn-primary">Imprimir</button>
          </div>
        </div>

        <div class="row mb-3">
          <div class="col-md-4">
            <div class="card p-2 mb-2">
              <div class="fw-bold">Cliente</div>
              <div>${escapeHtml(clientName)}</div>
              <div class="text-muted small">${escapeHtml(clientPhone)}</div>
            </div>
          </div>
          <div class="col-md-4">
            <div class="card p-2 mb-2">
              <div class="fw-bold">Equipo</div>
              <div>${escapeHtml(deviceSerial)}</div>
              <div class="text-muted small">Estado: ${escapeHtml(status)}</div>
            </div>
          </div>
          <div class="col-md-4">
            <div class="card p-2 mb-2">
              <div class="fw-bold">Reporte</div>
              <div class="text-muted small">ID: ${report.id}</div>
            </div>
          </div>
        </div>

        <div class="report-body">
          ${report.description || ""}
        </div>
      </div>
    `);

    const btnExport = document.getElementById("btn-export");
    if (btnExport) {
      btnExport.addEventListener("click", () => window.print());
    }
  })();
});

function regresar() {
  window.history.back();
}
