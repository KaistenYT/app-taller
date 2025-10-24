window.addEventListener("DOMContentLoaded", () => {
  (async () => {
    const params = new URLSearchParams(window.location.search);
    const reportId = params.get("id");
    const container = document.getElementById("report-content");

    if (!reportId) {
      container.innerHTML = "<p class='text-danger'>No report ID provided.</p>";
      return;
    }

    // Helper wrappers to support both direct helpers (window.api.getReport)
    // and the generic invoke exposed by the preload script.
    const apiCall = async (channel, ...args) => {
      try {
        if (window.api && typeof window.api[channel] === 'function') return await window.api[channel](...args);
        if (window.api && typeof window.api.invoke === 'function') return await window.api.invoke(channel, ...args);
        throw new Error('API de Electron no disponible');
      } catch (err) {
        throw err;
      }
    };

    const report = await apiCall('get-report', Number(reportId));
    if (!report) {
      container.innerHTML = "<p class='text-warning'>Report not found.</p>";
      return;
    }

    // Try to fetch related reception and client/device details for richer header
    let reception = null;
    try {
      if (report.reception_id) reception = await apiCall('get-reception', report.reception_id);
    } catch (e) {
      // ignore: missing reception data is non-fatal for displaying a report
    }

    // Normalize client display values with several fallbacks.
    // Try: reception.client?.name, reception.client_name, reception.client?.fullName, reception.client_idNumber
    // For phone: reception.client?.phone, reception.client_phone; if missing and we have idNumber, try to fetch client.
    async function resolveClientInfo(rec) {
      if (!rec) return { name: '—', phone: '—', idNumber: '' };
      const idNumber = rec.client_idNumber || rec.client?.idNumber || rec.client?.id || '';
      let name = rec.client?.name || rec.client_name || rec.client?.fullName || idNumber || '—';
      let phone = rec.client?.phone || rec.client_phone || '';

      // If phone is missing but we have an idNumber, attempt to fetch the client record (best-effort)
      if ((!phone || phone === '') && idNumber) {
        try {
          const clientObj = await apiCall('get-client', idNumber);
          if (clientObj) {
            name = clientObj.name || name;
            phone = clientObj.phone || phone;
          }
        } catch (e) {
          // ignore errors fetching client — keep fallbacks
        }
      }

      return { name: name || '—', phone: phone || '—', idNumber };
    }

    const clientInfo = await resolveClientInfo(reception);
    const clientName = clientInfo.name;
    const clientPhone = clientInfo.phone;
    const deviceSerial = reception?.device_snapshot?.serial_number || reception?.device?.serial_number || "—";
    const status = reception?.status || "—";
    const created = reception?.created_at || report?.created_at || "—";

    container.innerHTML = `
      <div class="report">
        <div class="report-header d-flex justify-content-between align-items-start mb-3">
          <div>
            <h3 class="mb-1">Reporte de Recepción <small class="text-muted">#${report.id}</small></h3>
            <div class="meta text-muted small">
              <span>Fecha: ${created}</span>
              ${report.reception_id ? `<span class="mx-2">•</span><span>Recepción: ${report.reception_id}</span>` : ''}
            </div>
          </div>
          <div class="text-end">
            <button class="btn btn-sm btn-outline-secondary me-2" onclick="window.print()">Imprimir</button>
            <button id="btn-export" class="btn btn-sm btn-primary">Guardar PDF</button>
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
          ${report.description}
        </div>
      </div>
    `;

    // Export: open print dialog but suggest PDF (browsers usually offer Save as PDF)
    const btnExport = document.getElementById('btn-export');
    if (btnExport) btnExport.addEventListener('click', () => window.print());
  })();
});

// small helper used above
function escapeHtml(str) {
  if (str === null || str === undefined) return "";
  return String(str).replace(/[&<>\"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[ch]);
}
