// ../scripts/index.js
document.addEventListener("DOMContentLoaded", () => {
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
  const modal = new bootstrap.Modal(modalEl);
  const modalBody = document.getElementById("modal-body-content");
  const modalEditBtn = document.getElementById("modal-edit-btn");

  let cache = [];
  let page = 1;
  const perPage = 8;

  btnCreate.addEventListener("click", () => window.location.href = "addReceptionForm.html");
  btnRefresh.addEventListener("click", () => loadReceptions());
  filtroGeneral.addEventListener("input", debounce(() => { page = 1; render(); }, 250));
  filtroFecha.addEventListener("change", () => { page = 1; render(); });
  ordenFecha.addEventListener("change", () => { page = 1; render(); });
  filtroArchivadas.addEventListener("change", () => { page = 1; render(); });
  btnClear.addEventListener("click", () => { filtroGeneral.value = ""; filtroFecha.value = ""; ordenFecha.value = "desc"; filtroArchivadas.value = "activas"; page = 1; render(); });

  function debounce(fn, wait = 300) { let t; return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), wait); }; }

  async function loadReceptions() {
    showLoadingRows();
    try {
      cache = Array.isArray(await window.api.listReceptions()) ? await window.api.listReceptions() : [];
      listSummary.textContent = `Total: ${cache.length} recepciones`;
      page = 1;
      render();
    } catch (err) {
      console.error(err);
      tbody.innerHTML = `<tr><td colspan="6" class="text-danger p-3">Error al cargar recepciones</td></tr>`;
      listSummary.textContent = "Error al cargar";
    }
  }

  function showLoadingRows() {
    tbody.innerHTML = Array.from({ length: 4 }).map(() => `
      <tr>
        <td><div class="skeleton" style="width:120px"></div></td>
        <td><div class="skeleton" style="width:160px"></div></td>
        <td><div class="skeleton" style="width:80px"></div></td>
        <td><div class="skeleton" style="width:140px"></div></td>
        <td><div class="skeleton" style="width:100px"></div></td>
        <td><div class="skeleton" style="width:120px"></div></td>
      </tr>
    `).join("");
    listSummary.textContent = "Cargando...";
  }

  function escapeHtml(str) {
    if (str === null || str === undefined) return "";
    return String(str).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;");
  }

  function formatStatusBadge(status) {
    const s = (status || "").toString().toUpperCase();
    const map = { PENDIENTE: "secondary", EN_PROGRESO: "warning", TERMINADO: "success", ENTREGADO: "info" };
    const cls = map[s] || "dark";
    return `<span class="badge bg-${cls} badge-status">${escapeHtml(status || "")}</span>`;
  }

  function getFilteredList() {
    const q = filtroGeneral.value.trim().toLowerCase();
    const dateFilter = filtroFecha.value;
    const order = ordenFecha.value === "asc" ? 1 : -1;
    const archivoFilter = filtroArchivadas.value;
    let list = cache.slice();
    
    // Filtrar por estado de archivo
    if (archivoFilter === "activas") {
      list = list.filter(r => !r.archived);
    } else if (archivoFilter === "archivadas") {
      list = list.filter(r => r.archived);
    }
    // Si es "todas", no filtramos
    
    if (q) {
      list = list.filter(r => {
        const cliente = (r.client_name || r.client?.name || r.client_idNumber || "").toString().toLowerCase();
        const equipo = (r.device_snapshot?.description || r.device?.description || "").toString().toLowerCase();
        const serial = (r.device_snapshot?.serial_number || r.device?.serial_number || "").toString().toLowerCase();
        const falla = (r.defect || "").toString().toLowerCase();
        return cliente.includes(q) || equipo.includes(q) || serial.includes(q) || falla.includes(q);
      });
    }
    if (dateFilter) {
      list = list.filter(r => {
        const created = r.created_at || r.createdAt || "";
        if (!created) return false;
        return new Date(created).toISOString().slice(0,10) === dateFilter;
      });
    }
    list.sort((a,b) => {
      const da = new Date(a.created_at || a.createdAt || a.created || 0);
      const db = new Date(b.created_at || b.createdAt || b.created || 0);
      return (da - db) * order;
    });
    return list;
  }

  function renderPagination(total) {
    const pages = Math.max(1, Math.ceil(total / perPage));
    pagination.innerHTML = "";
    for (let i = 1; i <= pages; i++) {
      const li = document.createElement("li");
      li.className = `page-item ${i === page ? "active" : ""}`;
      li.innerHTML = `<button class="page-link">${i}</button>`;
      li.addEventListener("click", () => { page = i; render(); });
      pagination.appendChild(li);
    }
  }

  function render() {
    const list = getFilteredList();
    const total = list.length;
    if (total === 0) {
      tbody.innerHTML = `<tr><td colspan="6" class="text-center p-4 text-muted">No hay recepciones que coincidan</td></tr>`;
      listSummary.textContent = "0 recepciones";
      pagination.innerHTML = "";
      return;
    }
    renderPagination(total);
    const start = (page - 1) * perPage;
    const slice = list.slice(start, start + perPage);
    tbody.innerHTML = slice.map(r => {
      const cliente = escapeHtml(r.client_name || r.client?.name || r.client_idNumber || "");
      const equipo = escapeHtml(r.device_snapshot?.description || r.device?.description || "");
      const serial = escapeHtml(r.device_snapshot?.serial_number || r.device?.serial_number || "");
      const estado = formatStatusBadge(r.status || "");
      const falla = escapeHtml(r.defect || "");
      const created = escapeHtml(new Date(r.created_at || r.createdAt || r.created || "").toLocaleString());
      return `
        <tr data-id="${r.id}">
          <td class="table-fixed-row">${cliente} <br/><small class="text-muted">${escapeHtml(r.client_idNumber || "")}</small></td>
          <td class="table-fixed-row">${equipo} ${serial ? `<br/><small class="text-muted">S/N: ${serial}</small>` : ""}</td>
          <td>${estado}</td>
          <td class="table-fixed-row">${falla}</td>
          <td>${created}</td>
          <td class="text-end">
            <button class="btn btn-sm btn-outline-primary btn-view" data-id="${r.id}">Ver</button>
            <button class="btn btn-sm btn-outline-warning btn-edit" data-id="${r.id}">Editar</button>
            <button class="btn btn-sm btn-outline-secondary btn-archive" data-id="${r.id}">${r.archived ? 'Restaurar' : 'Archivar'}</button>
            <button class="btn btn-sm btn-outline-danger btn-delete" data-id="${r.id}">Eliminar</button>
            <button class="btn btn-sm btn-outline-secondary" onclick="openReportWindow(${r.id})"> Print Report</button>

          </td>
        </tr>
      `;
    }).join("");

    tbody.querySelectorAll(".btn-view").forEach(btn => btn.addEventListener("click", e => openDetailModal(e.currentTarget.dataset.id)));
    tbody.querySelectorAll(".btn-edit").forEach(btn => btn.addEventListener("click", e => window.location.href = `addReceptionForm.html?id=${e.currentTarget.dataset.id}`));
    tbody.querySelectorAll(".btn-archive").forEach(btn => btn.addEventListener("click", e => toggleArchive(e.currentTarget.dataset.id)));
    tbody.querySelectorAll(".btn-delete").forEach(btn => btn.addEventListener("click", e => deleteReception(e.currentTarget.dataset.id)));

    listSummary.textContent = `Mostrando ${start + 1}–${Math.min(start + perPage, total)} de ${total} recepciones`;
  }

  async function openDetailModal(id) {
    try {
      const rec = cache.find(r => String(r.id) === String(id)) || await window.api.getReception(id);
      if (!rec) throw new Error("Recepción no encontrada");
      const cliente = escapeHtml(rec.client_name || rec.client?.name || rec.client_idNumber || "");
      const equipo = escapeHtml(rec.device_snapshot?.description || rec.device?.description || "");
      const serial = escapeHtml(rec.device_snapshot?.serial_number || rec.device?.serial_number || "");
      const created = escapeHtml(new Date(rec.created_at || rec.createdAt || rec.created || "").toLocaleString());
      modalBody.innerHTML = `
        <dl class="row">
          <dt class="col-sm-3">Cliente</dt><dd class="col-sm-9">${cliente} <br/><small class="text-muted">${escapeHtml(rec.client_idNumber || "")}</small></dd>
          <dt class="col-sm-3">Equipo</dt><dd class="col-sm-9">${equipo} ${serial ? `<br/><small class="text-muted">S/N: ${serial}</small>` : ""}</dd>
          <dt class="col-sm-3">Estado</dt><dd class="col-sm-9">${formatStatusBadge(rec.status)}</dd>
          <dt class="col-sm-3">Falla</dt><dd class="col-sm-9">${escapeHtml(rec.defect || "")}</dd>
          <dt class="col-sm-3">Diagnóstico</dt><dd class="col-sm-9">${escapeHtml(rec.repair || "")}</dd>
          <dt class="col-sm-3">Ingreso</dt><dd class="col-sm-9">${created}</dd>
          <dt class="col-sm-3">Snapshot</dt><dd class="col-sm-9"><pre class="small">${escapeHtml(JSON.stringify(rec.device_snapshot || {}, null, 2))}</pre></dd>
        </dl>
      `;
      modalEditBtn.onclick = () => window.location.href = `addReceptionForm.html?id=${id}`;
      modal.show();
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

  // Handler para cargar datos de prueba
  const btnSeed = document.getElementById("btn-seed");
  
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
    { serial_number: "SN-1002-C", description: "Tablet modelo C", features: "10\", 3GB RAM" }
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
        } else {
          // opcional: podrías actualizar datos si difieren
        }
      } catch (err) {
        console.error("Error creando cliente", c, err);
        results.errors.push({ type: "client", item: c, err: err.message || err });
      }
    }

    // 2) Crear / upsert dispositivos (por serial)
    for (const d of sampleDevices) {
      try {
        // si tienes upsertDeviceBySerial, úsala; si no, usa createDevice y confía en unique constraint
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
        // Buscar cliente
        const cliente = await window.api.getClient(r.client_idNumber);
        if (!cliente) {
          throw new Error(`Cliente ${r.client_idNumber} no existe`);
        }

        // Buscar/crear dispositivo por serial
        let device = null;
        if (window.api.getDeviceBySerial) device = await window.api.getDeviceBySerial(r.device_serial);
        if (!device) {
          // intentar upsert/create (esto devolverá el device con id)
          if (window.api.upsertDeviceBySerial) device = await window.api.upsertDeviceBySerial({ serial_number: r.device_serial, description: r.device_serial });
          else device = await window.api.createDevice({ serial_number: r.device_serial, description: r.device_serial });
        }

        const device_id = device?.id;
        if (!device_id) throw new Error("No se resolvió device_id para serial " + r.device_serial);

        // Preparar snapshot mínimo
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
          device_snapshot
        };

        await window.api.createReception(finalReception);
        results.receptions++;
      } catch (err) {
        console.error("Error creando recepción", r, err);
        results.errors.push({ type: "reception", item: r, err: err.message || err });
      }
    }

    // 4) refrescar lista en pantalla
    await loadReceptions();

    // Mostrar resumen al usuario
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

  loadReceptions();
});



async function openReportWindow(receptionId) {
  let reports = await window.api.getReportByReception(receptionId);

  if (!reports || reports.length === 0) {
    const reception = await window.api.getReception(receptionId);
    console.log("📦 Reception:", reception);

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
  window.open(`report.html?id=${reportId}`, "_blank", "width=800,height=900");
}



