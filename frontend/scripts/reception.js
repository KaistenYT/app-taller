
function regresar() {
  window.location.href = "index.html";
}

document.addEventListener("DOMContentLoaded", () => {
  const q = {
    form: document.getElementById("reception-form"),
    mensaje: document.getElementById("mensaje"),
    submitBtn: document.getElementById("submit-btn"),
    clientId: document.getElementById("client_idNumber"),
    clientName: document.getElementById("client_name"),
    clientPhone: document.getElementById("client_phone"),
    deviceSerial: document.getElementById("device_serial_number"),
    deviceDescription: document.getElementById("device_description"),
    deviceFeatures: document.getElementById("device_features"),
    defect: document.getElementById("defect"),
    status: document.getElementById("status"),
    repair: document.getElementById("repair"),
  };

  const state = { loading: false, editMode: false, receptionId: null };

  const ui = {
    setMessage(html, type = "info") {
      q.mensaje.innerHTML = `<div class="alert alert-${type}">${html}</div>`;
    },
    clearMessage() {
      q.mensaje.innerHTML = "";
    },
    setLoading(on, text = "Procesando...") {
      state.loading = on;
      q.submitBtn.disabled = on;
      q.submitBtn.textContent = on ? text : (state.editMode ? "Actualizar recepción" : "Guardar recepción");
    },
    disableClientFields(disabled) {
      q.clientId.disabled = disabled;
      q.deviceSerial.disabled = disabled;
      
    },
    resetForm() {
      q.form.reset();
      this.disableClientFields(false);
    }
  };

  // utilidades
  const $ = (el) => el;
  function escapeHtml(str) {
    if (str === null || str === undefined) return "";
    return String(str).replace(/[&<>\"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[ch]);
  }
  const debounce = (fn, wait = 300) => {
    let t;
    return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), wait); };
  };
  const safeGetVal = (el) => (el?.value ?? "").trim();

  // Detectar modo edición
  const urlParams = new URLSearchParams(window.location.search);
  const receptionId = urlParams.get("id");
  if (receptionId) {
    state.editMode = true;
    state.receptionId = receptionId;
    document.getElementById("page-title").textContent = "EDITAR RECEPCIÓN";
    q.submitBtn.textContent = "Actualizar recepción";
    loadReceptionForEdit(receptionId);
  }

  async function loadReceptionForEdit(id) {
    try {
      ui.setLoading(true, "Cargando...");
      const rec = await window.api.getReception(id);
      if (!rec) throw new Error("Recepción no encontrada");

      // Cargar datos del cliente
      q.clientId.value = rec.client_idNumber || "";
      const cliente = await window.api.getClient(rec.client_idNumber);
      if (cliente) {
        q.clientName.value = cliente.name || "";
        q.clientPhone.value = cliente.phone || "";
        ui.disableClientFields(true);
      }

      // Cargar datos del equipo desde snapshot o device
      const snapshot = rec.device_snapshot;
      if (snapshot) {
        q.deviceSerial.value = snapshot.serial_number || "";
        q.deviceDescription.value = snapshot.description || "";
        q.deviceFeatures.value = snapshot.features || "";
      } else if (rec.device_id) {
        const device = await window.api.getDevice(rec.device_id);
        if (device) {
          q.deviceSerial.value = device.serial_number || "";
          q.deviceDescription.value = device.description || "";
          q.deviceFeatures.value = device.features || "";
        }
      }

      // Cargar datos de la recepción
      q.defect.value = rec.defect || "";
      q.status.value = rec.status || "PENDIENTE";
      q.repair.value = rec.repair || "";
    } catch (err) {
      console.error("Error cargando recepción:", err);
      ui.setMessage("Error al cargar la recepción para editar", "danger");
    } finally {
      ui.setLoading(false);
    }
  }

  // Autocompletar cliente por cédula (debounced)
  q.clientId.addEventListener(
    "input",
    debounce(async (e) => {
      const idNumber = safeGetVal(q.clientId);
      if (idNumber.length < 7) {
        ui.disableClientFields(false);
        q.clientName.value = "";
        q.clientPhone.value = "";
        return;
      }

      try {
        const cliente = await window.api.getClient(idNumber);
        if (cliente) {
          q.clientName.value = cliente.name || "";
          q.clientPhone.value = cliente.phone || "";
          ui.disableClientFields(true);
        } else {
          q.clientName.value = "";
          q.clientPhone.value = "";
          ui.disableClientFields(false);
        }
      } catch (err) {
        console.error("Error autocompletar cliente:", err);
        ui.setMessage("Error buscando cliente", "danger");
      }
    }, 300)
  );

  // Validaciones mínimas
  function validateInputs(clientData, receptionData) {
    if (!clientData.idNumber) throw new Error("El número de identificación del cliente es requerido");
    if (!receptionData.defect) throw new Error("La falla/defecto es requerida");
  }

  // Normaliza respuesta del device (acepta id o objeto devuelto por API)
  function extractDeviceId(deviceResp) {
    if (!deviceResp) return null;
    return deviceResp.id ?? (Array.isArray(deviceResp) ? deviceResp[0]?.id : null);
  }

  // Manejo submit
  q.form.addEventListener("submit", async (ev) => {
    ev.preventDefault();
    ui.clearMessage();
    ui.setLoading(true);

    const clientData = {
      idNumber: safeGetVal(q.clientId),
      name: safeGetVal(q.clientName),
      phone: safeGetVal(q.clientPhone),
    };

    const deviceData = {
      serial_number: safeGetVal(q.deviceSerial) || null,
      description: safeGetVal(q.deviceDescription),
      features: safeGetVal(q.deviceFeatures) || null,
    };

    const receptionData = {
      defect: safeGetVal(q.defect),
      status: safeGetVal(q.status) || "PENDIENTE",
      repair: safeGetVal(q.repair) || null,
      device_snapshot: (q.deviceSerial.value || q.deviceDescription.value || q.deviceFeatures.value) ? {
        serial_number: safeGetVal(q.deviceSerial) || null,
        description: safeGetVal(q.deviceDescription),
        features: safeGetVal(q.deviceFeatures) || null,
      } : null,
  }

    try {
      validateInputs(clientData, receptionData);

      // cliente: obtener o crear
      let cliente = await window.api.getClient(clientData.idNumber);
      if (!cliente) cliente = await window.api.createClient(clientData);

      // equipo: upsert por serial si existe, sino crear
      let equipo;
      if (deviceData.serial_number) {
        if (window.api.upsertDeviceBySerial) equipo = await window.api.upsertDeviceBySerial(deviceData);
        else {
          const found = window.api.getDeviceBySerial ? await window.api.getDeviceBySerial(deviceData.serial_number) : null;
          equipo = found || await window.api.createDevice(deviceData);
        }
      } else {
        equipo = await window.api.createDevice(deviceData);
      }

      const device_id = extractDeviceId(equipo);
      if (!device_id) throw new Error("No se pudo obtener el ID del equipo");

      // snapshot garantizado
      const snapshot = {
        id: device_id,
        serial_number: equipo?.serial_number || deviceData.serial_number || null,
        description: equipo?.description || deviceData.description || null,
        features: equipo?.features || deviceData.features || null,
        captured_at: new Date().toISOString(),
      };

      const finalReception = {
        client_idNumber: cliente.idNumber,
        client_name: clientData.name,
        client_phone: clientData.phone,
        device_id,
        defect: receptionData.defect,
        status: receptionData.status,
        repair: receptionData.repair,
        device_snapshot: snapshot
      };

      let result;
      if (state.editMode && state.receptionId) {
        // Modo edición
        result = await window.api.updateReception(state.receptionId, finalReception);
        ui.setMessage(`Recepción actualizada con éxito (ID: ${result?.id ?? state.receptionId})<pre class="small">${escapeHtml(JSON.stringify(result || {}, null, 2))}</pre>`, "success");
      } else {
        // Modo creación
        result = await window.api.createReception(finalReception);
        ui.setMessage(`Recepción creada con éxito (ID: ${result?.id ?? "n/a"})<pre class="small">${escapeHtml(JSON.stringify(result || {}, null, 2))}</pre>`, "success");
      }

      setTimeout(() => regresar(), 1500);
    } catch (error) {
      console.error("Error crear recepción:", error);
      ui.setMessage(error.message || "Error al crear recepción", "danger");
    } finally {
      ui.setLoading(false);
    }
  });
});
