function extractDeviceId(device) {
  return device?.id || device?._id || null;
}

function regresar() {
  window.location.href = "index.html";
}

function formatIdNumber(input) {
  if (!input) return "";
  let value = input.replace(/\D/g, "");
  if (value.length > 0) {
    const firstChar = input[0].toUpperCase();
    if (["V", "E", "J", "P", "G"].includes(firstChar)) {
      value = firstChar + value.slice(0, 9);
    } else {
      value = value.slice(0, 9);
    }
  }
  return value;
}

function formatPhoneNumber(phone) {
  if (!phone) return "";
  const numbers = phone.replace(/\D/g, "");
  if (numbers.length <= 4) return numbers;
  if (numbers.length <= 7) return `${numbers.slice(0, 4)}-${numbers.slice(4)}`;
  return `${numbers.slice(0, 4)}-${numbers.slice(4, 7)}-${numbers.slice(7, 11)}`;
}

function showNotification(message, type = "success") {
  const toastContainer =
    document.getElementById("toast-container") ||
    (() => {
      const div = document.createElement("div");
      div.id = "toast-container";
      div.style.position = "fixed";
      div.style.top = "20px";
      div.style.right = "20px";
      div.style.zIndex = "1100";
      document.body.appendChild(div);
      return div;
    })();

  const toast = document.createElement("div");
  toast.className = `toast show align-items-center text-white bg-${type} border-0`;
  toast.role = "alert";
  toast.setAttribute("aria-live", "assertive");
  toast.setAttribute("aria-atomic", "true");

  toast.innerHTML = `
    <div class="d-flex">
      <div class="toast-body">
        <i class="bi ${type === "success" ? "bi-check-circle" : "bi-exclamation-triangle"} me-2"></i>
        ${message}
      </div>
      <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
    </div>
  `;

  toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 150);
  }, 5000);
}

document.addEventListener("DOMContentLoaded", () => {
  const q = {
    form: document.getElementById("reception-form"),
    mensaje: document.getElementById("mensaje"),
    submitBtn: document.getElementById("submit-btn"),
    formTitle: document.getElementById("form-title"),
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

  const state = {
    loading: false,
    editMode: false,
    receptionId: null,
    clientLocked: false,
  };

  const ui = {
    setMessage(html, type = "info") {
      q.mensaje.innerHTML = `
        <div class="alert alert-${type} alert-dismissible fade show" role="alert">
          ${html}
          <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
      `;
    },

    clearMessage() {
      q.mensaje.innerHTML = "";
    },

    setLoading(on, text = "Procesando...") {
      state.loading = on;
      const submitBtn = q.submitBtn;
      const icon = submitBtn.querySelector("i");
      const textSpan = submitBtn.querySelector("span");

      if (on) {
        submitBtn.disabled = true;
        icon.className = "bi bi-arrow-repeat me-1 fa-spin";
        textSpan.textContent = text;
      } else {
        submitBtn.disabled = false;
        icon.className = "bi bi-save me-1";
        textSpan.textContent = state.editMode
          ? "Actualizar Recepción"
          : "Guardar Recepción";
      }
    },

    disableClientFields(disabled) {
      state.clientLocked = disabled;
      q.clientId.disabled = disabled;
      q.clientName.disabled = disabled;
      q.clientPhone.disabled = disabled;

      const fields = [q.clientId, q.clientName, q.clientPhone];
      fields.forEach((field) => {
        field.classList.toggle("bg-light", disabled);
        field.classList.toggle("text-muted", disabled);
      });

      if (disabled && !document.getElementById("edit-client-btn")) {
        const editBtn = document.createElement("button");
        editBtn.type = "button";
        editBtn.id = "edit-client-btn";
        editBtn.className = "btn btn-sm btn-outline-secondary ms-2";
        editBtn.innerHTML = '<i class="bi bi-pencil"></i>';
        editBtn.title = "Editar cliente";
        editBtn.onclick = () => this.disableClientFields(false);
        q.clientId.parentNode.insertBefore(editBtn, q.clientId.nextSibling);
      } else if (!disabled) {
        const editBtn = document.getElementById("edit-client-btn");
        if (editBtn) editBtn.remove();
      }
    },

    resetForm() {
      q.form.reset();
      this.disableClientFields(false);
      state.clientLocked = false;

      q.form.classList.remove("was-validated");

      this.setLoading(false);

      q.clientId.focus();
    },

    showFieldError(field, message) {
      const formGroup = field.closest(".form-group") || field.parentElement;
      let feedback = formGroup.querySelector(".invalid-feedback");

      if (!feedback) {
        feedback = document.createElement("div");
        feedback.className = "invalid-feedback";
        formGroup.appendChild(feedback);
      }

      feedback.textContent = message;
      field.classList.add("is-invalid");
      field.focus();
    },

    clearFieldErrors() {
      q.form.querySelectorAll(".is-invalid").forEach((el) => {
        el.classList.remove("is-invalid");
      });
    },
  };

  const debounce = (fn, wait = 300) => {
    let t;
    return (...args) => {
      clearTimeout(t);
      t = setTimeout(() => fn(...args), wait);
    };
  };

  const safeGetVal = (el) => (el?.value ?? "").trim();

  const searchClientById = debounce(async (idNumber) => {
    if (!idNumber || idNumber.length < 3) {
      ui.disableClientFields(false);
      return;
    }

    try {
      const cliente = await window.api.getClient(idNumber);

      if (cliente) {
        q.clientName.value = cliente.name || "";
        q.clientPhone.value = cliente.phone || "";

        ui.disableClientFields(true);

        showNotification(`Cliente encontrado: ${cliente.name}`, "info");
      } else {
        ui.disableClientFields(false);
        q.clientName.value = "";
        q.clientPhone.value = "";
      }
    } catch (error) {
      console.error("Error al buscar cliente:", error);
      ui.disableClientFields(false);
    }
  }, 500);

  function init() {
    q.form.addEventListener(
      "submit",
      (event) => {
        if (!q.form.checkValidity()) {
          event.preventDefault();
          event.stopPropagation();
        }
      },
      false
    );

    q.clientId.addEventListener("input", (e) => {
      const idNumber = e.target.value.trim().toUpperCase();
      e.target.value = idNumber;
      searchClientById(idNumber);
    });

    q.clientId.addEventListener("blur", (e) => {
      const idNumber = e.target.value.trim().toUpperCase();
      if (idNumber) {
        searchClientById(idNumber);
      }
    });

    const urlParams = new URLSearchParams(window.location.search);
    const receptionId = urlParams.get("id");

    if (receptionId) {
      state.editMode = true;
      state.receptionId = receptionId;
      q.formTitle.textContent = "Editar Recepción";

      document.title = `Editar Recepción #${receptionId} | APP-TALLER`;

      loadReceptionForEdit(receptionId);
    } else {
      q.clientId.focus();
    }

    q.form.classList.add("needs-validation");
  }

  init();

  async function loadReceptionForEdit(id) {
    try {
      ui.setLoading(true, "Cargando recepción...");

      ui.setMessage("Cargando información de la recepción...", "info");

      const rec = await window.api.getReception(id);
      if (!rec) throw new Error("No se encontró la recepción solicitada");

      if (rec.client_idNumber) {
        q.clientId.value = rec.client_idNumber;

        try {
          const cliente = await window.api.getClient(rec.client_idNumber);
          if (cliente) {
            q.clientName.value = cliente.name || "";
            q.clientPhone.value = cliente.phone || "";
            ui.disableClientFields(true);
          }
        } catch (error) {
          console.warn(
            "No se pudo cargar la información completa del cliente:",
            error
          );
          ui.disableClientFields(false);
        }
      }


      const loadDeviceData = async () => {
        try {
          if (rec.device_snapshot) {
            const snapshot = rec.device_snapshot;
            q.deviceSerial.value = snapshot.serial_number || "";
            q.deviceDescription.value = snapshot.description || "";
            q.deviceFeatures.value = snapshot.features || "";
            return;
          }

          if (rec.device_id) {
            const device = await window.api.getDevice(rec.device_id);
            if (device) {
              q.deviceSerial.value = device.serial_number || "";
              q.deviceDescription.value = device.description || "";
              q.deviceFeatures.value = device.features || "";
            }
          }
        } catch (error) {
          console.warn("No se pudo cargar la información del equipo:", error);
        }
      };

      await loadDeviceData();

      q.defect.value = rec.defect || "";
      q.status.value = rec.status || "PENDIENTE";
      q.repair.value = rec.repair || "";

      ui.clearMessage();
      ui.setMessage(
        "Recepción cargada correctamente. Puede editar los campos necesarios.",
        "success"
      );
    } catch (error) {
      console.error("Error al cargar la recepción:", error);
      ui.setMessage(`Error al cargar la recepción: ${error.message}`, "danger");
    } finally {
      ui.setLoading(false);
    }
  }

  async function saveReception() {
    ui.clearFieldErrors();
    ui.clearMessage();

    if (!q.clientId.value || !q.clientName.value) {
      ui.setMessage("Por favor, complete los datos del cliente", "warning");
      return;
    }

    if (!q.deviceDescription.value || !q.defect.value) {
      ui.setMessage(
        "Por favor, complete la descripción del equipo y el defecto reportado",
        "warning"
      );
      return;
    }

    ui.setLoading(true, state.editMode ? "Actualizando..." : "Guardando...");

    const clientData = {
      idNumber: safeGetVal(q.clientId).toUpperCase(),
      name: safeGetVal(q.clientName),
      phone: safeGetVal(q.clientPhone) || null,
    };

    const deviceData = {
      serial_number: safeGetVal(q.deviceSerial) || null,
      description: safeGetVal(q.deviceDescription),
      features: safeGetVal(q.deviceFeatures) || null,
    };

    const receptionData = {
      defect: safeGetVal(q.defect).trim(),
      status: safeGetVal(q.status) || "PENDIENTE",
      repair: safeGetVal(q.repair) || null,
      device_snapshot:
        q.deviceSerial.value ||
        q.deviceDescription.value ||
        q.deviceFeatures.value
          ? {
              serial_number: safeGetVal(q.deviceSerial) || null,
              description: safeGetVal(q.deviceDescription).trim(),
              features: safeGetVal(q.deviceFeatures) || null,
            }
          : null,
    };

    try {
      let cliente;
      try {
        cliente = await window.api.getClient(clientData.idNumber);

        if (cliente) {
          if (
            cliente.name !== clientData.name ||
            cliente.phone !== clientData.phone
          ) {
            cliente = await window.api.updateClient({
              ...cliente,
              name: clientData.name,
              phone: clientData.phone,
            });
          }
        } else {
          cliente = await window.api.createClient(clientData);
        }
      } catch (error) {
        console.error("Error al gestionar el cliente:", error);
        throw new Error(
          "No se pudo guardar la información del cliente. Por favor, verifique los datos e intente nuevamente."
        );
      }

      let equipo;
      try {
        if (deviceData.serial_number) {
          if (window.api.upsertDeviceBySerial) {
            equipo = await window.api.upsertDeviceBySerial(deviceData);
          } else if (window.api.getDeviceBySerial) {
            const found = await window.api.getDeviceBySerial(
              deviceData.serial_number
            );
            if (found) {
              equipo = await window.api.updateDevice({
                ...found,
                ...deviceData,
                id: found.id,
              });
            } else {
              equipo = await window.api.createDevice(deviceData);
            }
          } else {
            equipo = await window.api.createDevice(deviceData);
          }
        } else {
          equipo = await window.api.createDevice(deviceData);
        }
      } catch (error) {
        console.error("Error al gestionar el equipo:", error);

        equipo = null;
      }

      const device_id = extractDeviceId(equipo);
      if (!device_id) throw new Error("No se pudo obtener el ID del equipo");

      const snapshot = {
        id: device_id,
        serial_number:
          equipo?.serial_number || deviceData.serial_number || null,
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
        device_snapshot: snapshot,
      };

      try {
        let recepcion;

        if (state.editMode) {
          recepcion = await window.api.updateReception(
            state.receptionId,
            finalReception
          );

          showNotification("Recepción actualizada correctamente", "success");
        } else {
          recepcion = await window.api.createReception(finalReception);

          showNotification("Recepción creada correctamente", "success");

          setTimeout(() => {
            ui.resetForm();
            window.location.href = "index.html";
          }, 1000);
        }

        if (state.editMode) {
          setTimeout(() => {
            window.location.href = `index.html#reception-${recepcion.id}`;
          }, 1500);
        }

        return recepcion;
      } catch (error) {
        console.error("Error al guardar la recepción:", error);
        throw new Error(
          "No se pudo guardar la recepción. Por favor, intente nuevamente."
        );
      }
    } catch (error) {
      console.error("Error en el proceso de guardado:", error);

      let errorMessage =
        error.message || "Error desconocido al procesar la solicitud";

      if (error.message && error.message.includes("UNIQUE constraint failed")) {
        if (error.message.includes("client.idNumber")) {
          errorMessage = "Ya existe un cliente con esta cédula/RIF";
          ui.showFieldError(q.clientId, errorMessage);
        } else if (error.message.includes("device.serial_number")) {
          errorMessage = "Ya existe un equipo con este número de serie";
          if (q.deviceSerial) ui.showFieldError(q.deviceSerial, errorMessage);
        }
      }

      showNotification(errorMessage, "danger");

      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      ui.setLoading(false);
    }
  }

  async function handleFormSubmit(event) {
    event.preventDefault();

    if (!q.form.checkValidity()) {
      event.stopPropagation();
      q.form.classList.add("was-validated");
      return;
    }

    await saveReception();
  }

  q.form.addEventListener("submit", handleFormSubmit);
});
