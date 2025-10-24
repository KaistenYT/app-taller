// ../scripts/index.js
document.addEventListener("DOMContentLoaded", () => {
  // Cache DOM elements with guards (page may not include all elements)
  const tbody = document.getElementById("recepciones-body");
  const filtroGeneral = document.getElementById("filtroGeneral");
  const filtroFecha = document.getElementById("filtroFecha");
  const ordenFecha = document.getElementById("ordenFecha");
  const filtroArchivadas = document.getElementById("filtroArchivadas");
  const btnClear = document.getElementById("btn-clear-filters");
  const btnCreate = document.getElementById("btn-create");
  const btnRefresh = document.getElementById("btn-refresh");
  const pagination = document.getElementById("pagination");
  const listSummary = document.getElementById("list-summary");
  const modalEl = document.getElementById("receptionModal");
  const modal = modalEl ? new bootstrap.Modal(modalEl) : null;
  const modalBody = document.getElementById("modal-body-content");
  const modalEditBtn = document.getElementById("modal-edit-btn");
  const modalGenReportBtn = document.getElementById("modal-gen-report");

  let cache = [];
  let page = 1;
  const perPage = 8;

  if (btnCreate) btnCreate.addEventListener("click", () => window.location.href = "addReceptionForm.html");
  if (btnRefresh) btnRefresh.addEventListener("click", () => loadReceptions());
  if (filtroGeneral) filtroGeneral.addEventListener("input", debounce(() => { page = 1; render(); }, 250));
  if (filtroFecha) filtroFecha.addEventListener("change", () => { page = 1; render(); });
  if (ordenFecha) ordenFecha.addEventListener("change", () => { page = 1; render(); });
  if (filtroArchivadas) filtroArchivadas.addEventListener("change", () => { page = 1; render(); });
  if (btnClear) btnClear.addEventListener("click", () => {
    if (filtroGeneral) filtroGeneral.value = "";
    if (filtroFecha) filtroFecha.value = "";
    if (ordenFecha) ordenFecha.value = "desc";
    if (filtroArchivadas) filtroArchivadas.value = "activas";
    page = 1; render();
  });

  function debounce(fn, wait = 300) { let t; return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), wait); }; }

  async function loadReceptions() {
    if (tbody) showLoadingRows();
    try {
      const res = await window.api.listReceptions();
      const raw = Array.isArray(res) ? res : [];
      // Normalize each reception so `device_snapshot` is always present when possible
      cache = raw.map(r => {
        // If device_snapshot exists, keep it; otherwise build minimal snapshot from known fallbacks
        const ds = r.device_snapshot || {
          id: r.device_id || r.device?.id || null,
          serial_number: r.device_snapshot?.serial_number || r.device_serial || r.device?.serial_number || null,
          description: r.device_snapshot?.description || r.device_description || r.device?.description || null,
          // Prefer explicit features, else fall back to device.features, then description
          features: r.device_snapshot?.features || r.device?.features || r.device_snapshot?.description || r.device?.description || null,
          // Use created_at as sensible fallback for captured_at when snapshot lacks it
          captured_at: r.device_snapshot?.captured_at || r.created_at || null
        };
        return Object.assign({}, r, { device_snapshot: ds });
      });
      if (listSummary) listSummary.textContent = `Total: ${cache.length} recepciones`;
      page = 1;
      render();
    } catch (err) {
      console.error(err);
      if (tbody) tbody.innerHTML = `<tr><td colspan="7" class="text-danger p-3">Error al cargar recepciones</td></tr>`;
      if (listSummary) listSummary.textContent = "Error al cargar";
    }
  }

  function showLoadingRows() {
    if (!tbody) return;
    tbody.innerHTML = Array.from({ length: 4 }).map(() => `
      <tr>
        <td><div class="skeleton" style="width:120px"></div></td>
        <td><div class="skeleton" style="width:160px"></div></td>
        <td><div class="skeleton" style="width:180px"></div></td>
        <td><div class="skeleton" style="width:80px"></div></td>
        <td><div class="skeleton" style="width:140px"></div></td>
        <td><div class="skeleton" style="width:100px"></div></td>
        <td><div class="skeleton" style="width:120px"></div></td>
      </tr>
    `).join("");
    if (listSummary) listSummary.textContent = "Cargando...";
  }

  // Fast HTML escaper (small set of chars) using regex
  function escapeHtml(str) {
    if (str === null || str === undefined) return "";
    return String(str).replace(/[&<>\"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[ch]);
  }

  function formatStatusBadge(status) {
    const s = (status || "").toString().toUpperCase();
    const map = { PENDIENTE: "secondary", EN_PROGRESO: "warning", TERMINADO: "success", ENTREGADO: "info" };
    const cls = map[s] || "dark";
    return `<span class="badge bg-${cls} badge-status">${escapeHtml(status || "")}</span>`;
  }

  // Normalize created date to a timestamp (ms) for faster sorting
  function getCreatedTs(r) {
    const v = r.created_at || r.createdAt || r.created || "";
    const t = Date.parse(v);
    return Number.isFinite(t) ? t : 0;
  }

  function getFilteredList() {
    const q = filtroGeneral ? filtroGeneral.value.trim().toLowerCase() : "";
    const dateFilter = filtroFecha ? filtroFecha.value : "";
    const order = ordenFecha && ordenFecha.value === "asc" ? 1 : -1;
    const archivoFilter = filtroArchivadas ? filtroArchivadas.value : "todas";
    let list = cache.slice();

    if (archivoFilter === "activas") list = list.filter(r => !r.archived);
    else if (archivoFilter === "archivadas") list = list.filter(r => r.archived);

    if (q) {
      list = list.filter(r => {
        const cliente = (r.client_name || r.client?.name || r.client_idNumber || "").toString().toLowerCase();
        const equipo = (r.device_snapshot?.description || r.device?.description || r.device_description || "").toString().toLowerCase();
        const serial = (r.device_snapshot?.serial_number || r.device?.serial_number || r.device_serial || "").toString().toLowerCase();
        const falla = (r.defect || "").toString().toLowerCase();
        return cliente.includes(q) || equipo.includes(q) || serial.includes(q) || falla.includes(q);
      });
    }

    if (dateFilter) {
      list = list.filter(r => {
        const created = r.created_at || r.createdAt || r.created || "";
        if (!created) return false;
        // compare YYYY-MM-DD
        return new Date(created).toISOString().slice(0,10) === dateFilter;
      });
    }

    list.sort((a,b) => (getCreatedTs(a) - getCreatedTs(b)) * order);
    return list;
  }

  function renderPagination(total) {
    if (!pagination) return;
    const pages = Math.max(1, Math.ceil(total / perPage));
    pagination.innerHTML = "";
    for (let i = 1; i <= pages; i++) {
      const li = document.createElement("li");
      li.className = `page-item ${i === page ? "active" : ""}`;
      const btn = document.createElement("button");
      btn.className = "page-link";
      btn.type = "button";
      btn.textContent = String(i);
      btn.addEventListener("click", () => { page = i; render(); });
      li.appendChild(btn);
      pagination.appendChild(li);
    }
  }

  function render() {
    if (!tbody) return;
    const list = getFilteredList();
    const total = list.length;
    if (total === 0) {
      tbody.innerHTML = `<tr><td colspan="7" class="text-center p-4 text-muted">No hay recepciones que coincidan</td></tr>`;
      if (listSummary) listSummary.textContent = "0 recepciones";
      if (pagination) pagination.innerHTML = "";
      return;
    }
    renderPagination(total);
    const start = (page - 1) * perPage;
    const slice = list.slice(start, start + perPage);
    tbody.innerHTML = slice.map(r => {
      const cliente = escapeHtml(r.client_name || r.client?.name || r.client_idNumber || "");
  const equipo = escapeHtml(r.device_snapshot?.description || r.device?.description || r.device_description || "");
  const serial = escapeHtml(r.device_snapshot?.serial_number || r.device?.serial_number || r.device_serial || "");
  const snapShort = escapeHtml(r.device_snapshot?.features || r.device_snapshot?.description || r.device?.description || "");
      const estado = formatStatusBadge(r.status || "");
      const falla = escapeHtml(r.defect || "");
      const created = escapeHtml(new Date(r.created_at || r.createdAt || r.created || "").toLocaleString());
      return `
        <tr data-id="${r.id}">
          <td class="table-fixed-row">${cliente} <br/><small class="text-muted">${escapeHtml(r.client_idNumber || "")}</small></td>
          <td class="table-fixed-row">${equipo} ${serial ? `<br/><small class="text-muted">S/N: ${serial}</small>` : ""}</td>
          <td class="snapshot-cell"><span class="snapshot-serial">${serial ? `S/N: ${serial}` : ""}</span><br/><small class="text-muted">${snapShort}</small></td>
          <td>${estado}</td>
          <td class="table-fixed-row">${falla}</td>
          <td>${created}</td>
          <td class="text-end">
            <div class="btn-group" role="group" aria-label="Acciones">
              <button type="button" class="btn btn-sm btn-outline-primary action-small" data-action="view" data-id="${r.id}" title="Ver" aria-label="Ver">
                <svg class="action-icon" viewBox="0 0 16 16" width="16" height="16" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M16 8s-3-5.5-8-5.5S0 8 0 8s3 5.5 8 5.5S16 8 16 8z"/><circle cx="8" cy="8" r="2.5"/></svg>
                <span class="visually-hidden">Ver</span>
              </button>
              <button type="button" class="btn btn-sm btn-outline-warning action-small" data-action="edit" data-id="${r.id}" title="Editar" aria-label="Editar">
                <svg class="action-icon" viewBox="0 0 16 16" width="16" height="16" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M12.146 0.146a.5.5 0 01.708 0l3 3a.5.5 0 010 .708l-9.793 9.793a.5.5 0 01-.233.131l-5 1a.5.5 0 01-.61-.61l1-5a.5.5 0 01.131-.232L12.146.146zM11.207 2L3 10.207V12h1.793L14 3.793 11.207 2z"/></svg>
                <span class="visually-hidden">Editar</span>
              </button>
              <button type="button" class="btn btn-sm btn-outline-secondary action-small" data-action="archive" data-id="${r.id}" title="Archivar/Restaurar" aria-label="Archivar/Restaurar">
                <svg class="action-icon" viewBox="0 0 16 16" width="16" height="16" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M3.5 3a.5.5 0 00-.5.5V4h10v-.5a.5.5 0 00-.5-.5h-9zM1 5v8.5A1.5 1.5 0 002.5 15h11a1.5 1.5 0 001.5-1.5V5H1zm4 3.5a.5.5 0 01.5-.5h5a.5.5 0 010 1h-5a.5.5 0 01-.5-.5z"/></svg>
                <span class="visually-hidden">${r.archived ? 'Restaurar' : 'Archivar'}</span>
              </button>
              <button type="button" class="btn btn-sm btn-outline-danger action-small" data-action="delete" data-id="${r.id}" title="Eliminar" aria-label="Eliminar">
                <svg class="action-icon" viewBox="0 0 16 16" width="16" height="16" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M5.5 5.5a.5.5 0 01.5.5v6a.5.5 0 01-1 0v-6a.5.5 0 01.5-.5zm3 0a.5.5 0 01.5.5v6a.5.5 0 01-1 0v-6a.5.5 0 01.5-.5z"/><path fill-rule="evenodd" d="M14.5 3a1 1 0 01-1 1H13v9.5A2.5 2.5 0 0110.5 16h-5A2.5 2.5 0 013 13.5V4h-.5a1 1 0 010-2H5l1-1h4l1 1h2.5a1 1 0 011 1zM4.118 4L4 4.059V13.5c0 .827.673 1.5 1.5 1.5h5c.827 0 1.5-.673 1.5-1.5V4.059L11.882 4H4.118z"/></svg>
                <span class="visually-hidden">Eliminar</span>
              </button>
              <button type="button" class="btn btn-sm btn-outline-secondary action-small" data-action="print" data-id="${r.id}" title="Imprimir" aria-label="Imprimir">
                <svg class="action-icon" viewBox="0 0 16 16" width="16" height="16" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M2 7a1 1 0 011-1h10a1 1 0 011 1v2h-1v4H3V9H2V7zM5 12h6v-3H5v3z"/><path d="M5 1h6v3H5z"/></svg>
                <span class="visually-hidden">Imprimir</span>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join("");

    // Single delegated handler for action buttons (better perf than multiple listeners)
    tbody.removeEventListener && tbody.removeEventListener('click', tbody._delegatedHandler);
    const handler = (e) => {
      const btn = e.target.closest('button');
      if (!btn) return;
      const action = btn.dataset.action;
      const id = btn.dataset.id;
      if (!action || !id) return;
      if (action === 'view') openDetailModal(id);
      else if (action === 'edit') window.location.href = `addReceptionForm.html?id=${id}`;
      else if (action === 'archive') toggleArchive(id);
      else if (action === 'delete') deleteReception(id);
      else if (action === 'print') {
        // Open via main so preload is applied (ensures window.api is available)
        if (window.api && typeof window.api.invoke === 'function') {
          window.api.invoke('open-report-window', Number(id));
        } else {
          // fallback for environments without preload
          window.open(`report.html?id=${id}`, "_blank", "width=800,height=900");
        }
      }
    };
    tbody.addEventListener('click', handler);
    // keep reference so we can remove later if re-rendering
    tbody._delegatedHandler = handler;

    if (listSummary) listSummary.textContent = `Mostrando ${start + 1}–${Math.min(start + perPage, total)} de ${total} recepciones`;
  }

  async function openDetailModal(id) {
    try {
      const rec = cache.find(r => String(r.id) === String(id)) || await window.api.receptionDetails(id);
      if (!rec) throw new Error("Recepción no encontrada");
      const cliente = escapeHtml(rec.client_name || rec.client?.name || rec.client_idNumber || "");
      const equipo = escapeHtml(rec.device_snapshot?.description || rec.device?.description || rec.device_description || "");
      const serial = escapeHtml(rec.device_snapshot?.serial_number || rec.device?.serial_number || rec.device_serial || "");
      const created = escapeHtml(new Date(rec.created_at || rec.createdAt || rec.created || "").toLocaleString());
      // Build a fallback snapshot object when device_snapshot is missing
      const snapshot = rec.device_snapshot || {
        id: rec.device_id || rec.device?.id || null,
        serial_number: rec.device_snapshot?.serial_number || rec.device_serial || rec.device?.serial_number || null,
        description: rec.device_snapshot?.description || rec.device_description || rec.device?.description || null,
        features: rec.device_snapshot?.features || rec.device?.features || null,
        // prefer snapshot.captured_at else use created_at
        captured_at: rec.device_snapshot?.captured_at || rec.created_at || null
      };

      if (modalBody) {
        const snap = snapshot || {};
        const snapSerial = escapeHtml(snap.serial_number || "—");
        const snapDesc = escapeHtml(snap.description || "—");
        // Prefer features; if missing, fall back to description for a more useful display
        const snapFeatures = escapeHtml(snap.device_snapshot || "—");
        const snapCaptured = escapeHtml(snap.captured_at || "—");

        
        let clientePhoneRaw = rec.client_phone || rec.client?.phone || "";
        if (!clientePhoneRaw && rec.client_idNumber) {
          try {
            const clientObj = await window.api.getClient(rec.client_idNumber);
            clientePhoneRaw = clientObj?.phone || "";
          } catch (e) {
            // ignore fetch errors and keep phone empty
          }
        }
        const clientePhone = escapeHtml(clientePhoneRaw || "—");

        modalBody.innerHTML = `
          <dl class="row">
            <dt class="col-sm-3">Cliente</dt>
            <dd class="col-sm-9">${cliente} <br/><small class="text-muted">${escapeHtml(rec.client_idNumber || "")}</small>
              <br/><small class="text-muted">Tel: ${clientePhone}</small>
            </dd>

            <dt class="col-sm-3">Equipo</dt><dd class="col-sm-9">${equipo} ${serial ? `<br/><small class="text-muted">S/N: ${serial}</small>` : ""}</dd>
            <dt class="col-sm-3">Estado</dt><dd class="col-sm-9">${formatStatusBadge(rec.status)}</dd>
            <dt class="col-sm-3">Falla</dt><dd class="col-sm-9">${escapeHtml(rec.defect || "")}</dd>
            <dt class="col-sm-3">Diagnóstico</dt><dd class="col-sm-9">${escapeHtml(rec.repair || "")}</dd>
            <dt class="col-sm-3">Ingreso</dt><dd class="col-sm-9">${created}</dd>
            <dt class="col-sm-3">Snapshot</dt>
            <dd class="col-sm-9">
              <div><strong>Serial:</strong> ${snapSerial}</div>
              <div><strong>Descripción:</strong> ${snapDesc}</div>
              <div><strong>Características:</strong> ${snapFeatures}</div>
              <div><strong>Capturado:</strong> ${snapCaptured}</div>
              <pre class="small mt-2">${escapeHtml(JSON.stringify(snap || {}, null, 2))}</pre>
            </dd>
          </dl>
        `;
      }
      if (modalEditBtn) modalEditBtn.onclick = () => window.location.href = `addReceptionForm.html?id=${id}`;
      // store current id on modal element for later actions
      if (modalEl) modalEl.dataset.currentId = String(id);

      // Attach generate-report handler (uses new IPC channel)
      if (modalGenReportBtn) {
        modalGenReportBtn.onclick = async () => {
          try {
            modalGenReportBtn.disabled = true;
            modalGenReportBtn.textContent = 'Generando...';
            const res = await window.api.invoke('create-report-from-reception', Number(id));
            if (res && res.id) {
              // ask main to open the report in a new BrowserWindow (preload ensured)
              if (window.api && typeof window.api.invoke === 'function') {
                await window.api.invoke('open-report-window', Number(res.id));
              } else {
                window.open(`report.html?id=${res.id}`, '_blank', 'width=900,height=800');
              }
            } else {
              // fallback: use older flow which ensures a report exists and opens it
              await openReportWindow(id);
            }
          } catch (err) {
            console.error('Error generando reporte:', err);
            alert('Error al generar el reporte: ' + (err.message || err));
          } finally {
            modalGenReportBtn.disabled = false;
            modalGenReportBtn.textContent = 'Generar reporte';
          }
        };
      }
      console.log("detail rec: ", rec);
      // Log snapshot as JSON to avoid console showing expanded objects later
      console.log("device_snapshot:", JSON.stringify(snapshot || {}, null, 2));
      if (modal) modal.show();
    } catch (err) {
      console.error(err);
      alert("No se pudo cargar el detalle");
    }
  }

  async function toggleArchive(id) {
    try {
      const rec = cache.find(r => String(r.id) === String(id));
      if (!rec) throw new Error("No encontrado");
      if (rec.archived) await window.api.restoreReception(id);
      else await window.api.archiveReception(id);
      await loadReceptions();
    } catch (err) {
      console.error(err);
      alert("Error cambiando estado");
    }
  }

  async function deleteReception(id) {
    if (!confirm("¿Eliminar esta recepción?")) return;
    try {
      await window.api.deleteReception(id);
      await loadReceptions();
    } catch (err) {
      console.error(err);
      alert("Error eliminando");
    }
  }

  // Handler para cargar datos de prueba (si existe el botón)
  const btnSeed = document.getElementById("btn-seed");
  if (btnSeed) {
    btnSeed.addEventListener("click", async () => {
      if (!confirm("Cargar datos de prueba en la base de datos? Esto añadirá clientes, equipos y recepciones de ejemplo.")) return;

      // Datos de prueba: ajusta o añade más objetos según quieras
      const sampleClients = [
        { idNumber: "V12345678", name: "María Pérez", phone: "04141234567" },
        { idNumber: "V87654321", name: "José González", phone: "04147654321" },
        { idNumber: "E00000001", name: "Taller Demo", phone: "02121234567" }
      ];

      const sampleDevices = [
        { serial_number: "SN-1000-A", description: "Teléfono modelo A", features: "Pantalla 6.1, 4GB RAM" },
        { serial_number: "SN-1001-B", description: "Laptop modelo B", features: "i5, 8GB RAM, 256SSD" },
        { serial_number: "SN-1002-C", description: "Tablet modelo C", features: "10\" , 3GB RAM" }
      ];

      // Recepciones de ejemplo; device_id se resolverá luego
      const sampleReceptions = [
        { client_idNumber: "V12345678", device_serial: "SN-1000-A", defect: "No enciende", status: "PENDIENTE", repair: "" },
        { client_idNumber: "V87654321", device_serial: "SN-1001-B", defect: "Pantalla rota", status: "PENDIENTE", repair: "" },
        { client_idNumber: "E00000001", device_serial: "SN-1002-C", defect: "Batería dura poco", status: "PENDIENTE", repair: "" }
      ];

      // UI feedback
      btnSeed.disabled = true;
      btnSeed.textContent = "Cargando datos...";
      const results = { clients: 0, devices: 0, receptions: 0, errors: [] };

      try {
        // 1) Crear o asegurar clientes
        for (const c of sampleClients) {
          try {
            const existing = await window.api.getClient(c.idNumber);
            if (!existing) {
              await window.api.createClient(c);
              results.clients++;
            }
          } catch (err) {
            console.error("Error creando cliente", c, err);
            results.errors.push({ type: "client", item: c, err: err.message || err });
          }
        }

        // 2) Crear / upsert dispositivos (por serial)
        for (const d of sampleDevices) {
          try {
            if (window.api.upsertDeviceBySerial) {
              await window.api.upsertDeviceBySerial(d);
            } else {
              await window.api.createDevice(d);
            }
            results.devices++;
          } catch (err) {
            console.error("Error creando dispositivo", d, err);
            results.errors.push({ type: "device", item: d, err: err.message || err });
          }
        }

        // 3) Crear recepciones: resolver device_id por serial y crear recepción
        for (const r of sampleReceptions) {
          try {
            const cliente = await window.api.getClient(r.client_idNumber);
            if (!cliente) throw new Error(`Cliente ${r.client_idNumber} no existe`);

            let device = null;
            if (window.api.getDeviceBySerial) device = await window.api.getDeviceBySerial(r.device_serial);
            if (!device) {
              if (window.api.upsertDeviceBySerial) device = await window.api.upsertDeviceBySerial({ serial_number: r.device_serial, description: r.device_serial });
              else device = await window.api.createDevice({ serial_number: r.device_serial, description: r.device_serial });
            }

            const device_id = device?.id;
            if (!device_id) throw new Error("No se resolvió device_id para serial " + r.device_serial);

            const device_snapshot = {
              id: device.id,
              serial_number: device.serial_number || r.device_serial,
              description: device.description || "",
              features: device.features || null,
              captured_at: new Date().toISOString()
            };

            const finalReception = {
              client_idNumber: cliente.idNumber,
              device_id,
              defect: r.defect,
              status: r.status || "PENDIENTE",
              repair: r.repair || "",
              device_snapshot: device_snapshot
            };

            await window.api.createReception(finalReception);
            results.receptions++;
          } catch (err) {
            console.error("Error creando recepción", r, err);
            results.errors.push({ type: "reception", item: r, err: err.message || err });
          }
        }

        await loadReceptions();

        const summary = `Carga completada: clientes ${results.clients}, dispositivos ${results.devices}, recepciones ${results.receptions}` +
          (results.errors.length ? `; errores: ${results.errors.length}` : "");
        alert(summary);
      } catch (err) {
        console.error("Error en proceso de seed:", err);
        alert("Ocurrió un error al cargar datos de prueba");
      } finally {
        btnSeed.disabled = false;
        btnSeed.textContent = "Cargar datos de prueba";
      }
    });
  }

  loadReceptions();
});


// Keep this global function for compatibility with other scripts that may call it.
async function openReportWindow(receptionId) {
  let reports = await window.api.getReportByReception(receptionId);

  if (!reports || reports.length === 0) {
    const reception = await window.api.getReception(receptionId);
  console.log("Reception:", reception);

    const description = `
      <p><strong>ID Recepción:</strong> ${reception.id}</p>
      <p><strong>Fecha de ingreso:</strong> ${reception.created_at}</p>
      <p><strong>Cliente:</strong> ${reception.client_idNumber}</p>
      <p><strong>Equipo:</strong> ${reception.device_snapshot?.description || "No especificado"}</p>
      <p><strong>Estado inicial:</strong> ${reception.defect}</p>
      <hr />
      <p><strong>Diagnóstico técnico:</strong></p>
      <p>${reception.repair || "Pendiente de evaluación"}</p>
    `;

    const newReport = await window.api.createReport({
      reception_id: receptionId,
      description,
    });

    if (!newReport || !newReport.id) {
      alert("No se pudo crear el reporte.");
      return;
    }

    reports = [newReport];
  }

  const reportId = reports[0].id;
  // Open the report via main to ensure preload is used
  if (window.api && typeof window.api.invoke === 'function') {
    await window.api.invoke('open-report-window', Number(reportId));
  } else {
    window.open(`report.html?id=${reportId}`, "_blank", "width=800,height=900");
  }
}



