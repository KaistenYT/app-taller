/**
 * Extrae el ID de un objeto `device`, manejando posibles propiedades 'id' o '_id'.
 * @param {Object} device - Objeto dispositivo.
 * @returns {number|null} El ID del dispositivo o null si no se encuentra.
 */
function extractDeviceId(device) {
  return device?.id || device?._id || null;
}

/**
 * Redirige la ventana a la página principal (index.html).
 */
function regresar() {
  window.location.href = "index.html";
}

/**
 * Formatea un número de teléfono en un formato más legible (ej. XXXX-XXX-XXXX).
 * @param {string} phone - El número de teléfono sin formato.
 * @returns {string} El número de teléfono formateado o una cadena vacía si es nulo.
 */
function formatPhoneNumber(phone) {
  if (!phone) return "";
  const numbers = phone.replace(/\D/g, "");
  if (numbers.length <= 4) return numbers;
  if (numbers.length <= 7) return `${numbers.slice(0, 4)}-${numbers.slice(4)}`;
  return `${numbers.slice(0, 4)}-${numbers.slice(4, 7)}-${numbers.slice(7, 11)}`;
}

/**
 * Muestra una notificación temporal tipo "toast" en la esquina superior derecha.
 * @param {string} message - Mensaje a mostrar.
 * @param {"success"|"danger"|"info"|"warning"} [type="success"] - Tipo de notificación para aplicar estilos.
 */
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
    setTimeout(() => toast.remove(), 150); // Elimina el toast después de la animación de ocultar
  }, 5000); // El toast es visible por 5 segundos
}

document.addEventListener("DOMContentLoaded", () => {
  // --- Manejo de Sesión de Usuario ---
  let currentUser = null;
  try {
    let sessionRaw = null;
    try {
      sessionRaw = sessionStorage.getItem("app_user");
    } catch (e) {
      console.error("Error al obtener sesión de sessionStorage:", e);
    }
    if (!sessionRaw) {
      try {
        sessionRaw = localStorage.getItem("app_user");
      } catch (e) {
        console.error("Error al obtener sesión de localStorage:", e);
      }
    }
    if (sessionRaw) {
      const session = JSON.parse(sessionRaw);
      if (session && session.id) {
        currentUser = { // Establece el usuario actual si la sesión es válida
          id: session.id,
          username: session.username,
          role: session.role || "user",
        };
      }
    }
  } catch (e) {
    console.error("Error al cargar la sesión del usuario:", e);
  }

  if (!currentUser || !currentUser.id) { // Si no hay usuario o ID de usuario, redirige a login
    window.location.href = "login.html";
    return;
  }

  // --- Referencias a Elementos del DOM del Formulario ---
  const q = {
    form: document.getElementById("reception-form"),
    mensaje: document.getElementById("mensaje"), // Área para mensajes de alerta del formulario
    submitBtn: document.getElementById("submit-btn"),
    formTitle: document.getElementById("form-title"),
    clientIdPrefix: document.getElementById("client_idNumber_prefix"), // Prefijo de la cédula/RIF (V, E, J, etc.)
    clientIdNum: document.getElementById("client_idNumber_num"),     // Número de la cédula/RIF
    clientName: document.getElementById("client_name"),
    clientPhone: document.getElementById("client_phone"),
    deviceSerial: document.getElementById("device_serial_number"),
    deviceDescription: document.getElementById("device_description"),
    deviceFeatures: document.getElementById("device_features"),
    defect: document.getElementById("defect"),       // Falla reportada
    status: document.getElementById("status"),       // Estado de la recepción
    repair: document.getElementById("repair"),       // Diagnóstico/Reparación
  };

  // --- Estado Local de la Aplicación ---
  const state = {
    loading: false,     // Indica si hay una operación de carga en progreso
    editMode: false,    // true si se está editando una recepción existente, false si es nueva
    receptionId: null,  // ID de la recepción si está en modo edición
    clientLocked: false, // Indica si los campos del cliente están deshabilitados
  };

  // --- Funciones de Interfaz de Usuario (UI) ---
  const ui = {
    /**
     * Muestra un mensaje de alerta en el área designada del formulario.
     * @param {string} html - Contenido HTML del mensaje.
     * @param {"info"|"success"|"warning"|"danger"} [type="info"] - Tipo de alerta para estilos.
     */
    setMessage(html, type = "info") {
      q.mensaje.innerHTML = `
        <div class="alert alert-${type} alert-dismissible fade show" role="alert">
          ${html}
          <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
      `;
    },

    /**
     * Limpia el mensaje de alerta del formulario.
     */
    clearMessage() {
      q.mensaje.innerHTML = "";
    },

    /**
     * Muestra u oculta un indicador de carga en el botón de envío del formulario.
     * @param {boolean} on - true para mostrar el indicador, false para ocultar.
     * @param {string} [text="Procesando..."] - Texto a mostrar junto al indicador de carga.
     */
    setLoading(on, text = "Procesando...") {
      state.loading = on;
      const submitBtn = q.submitBtn;
      const icon = submitBtn.querySelector("i");
      const textSpan = submitBtn.querySelector("span");

      if (on) {
        submitBtn.disabled = true;
        icon.className = "bi bi-arrow-repeat me-1 fa-spin"; // Icono de carga giratorio
        textSpan.textContent = text;
      } else {
        submitBtn.disabled = false;
        icon.className = "bi bi-save me-1"; // Icono de guardar
        textSpan.textContent = state.editMode // Texto según el modo (guardar o actualizar)
          ? "Actualizar Recepción"
          : "Guardar Recepción";
      }
    },

    /**
     * Deshabilita/habilita los campos de entrada del cliente y añade/elimina un botón de edición.
     * @param {boolean} disabled - true para deshabilitar los campos, false para habilitar.
     */
    disableClientFields(disabled) {
      state.clientLocked = disabled;
      q.clientIdPrefix.disabled = disabled;
      q.clientIdNum.disabled = disabled;
      q.clientName.disabled = disabled;
      q.clientPhone.disabled = disabled;

      const fields = [
        q.clientIdPrefix,
        q.clientIdNum,
        q.clientName,
        q.clientPhone,
      ];
      fields.forEach((field) => { // Aplica estilos visuales para campos deshabilitados
        field.classList.toggle("bg-light", disabled);
        field.classList.toggle("text-muted", disabled);
      });

      if (disabled && !document.getElementById("edit-client-btn")) {
        // Añade botón de edición si los campos están deshabilitados
        const editBtn = document.createElement("button");
        editBtn.type = "button";
        editBtn.id = "edit-client-btn";
        editBtn.className = "btn btn-sm btn-outline-secondary ms-2";
        editBtn.innerHTML = '<i class="bi bi-pencil"></i>';
        editBtn.title = "Editar cliente";
        editBtn.onclick = () => this.disableClientFields(false); // Vuelve a habilitar campos al hacer clic
        q.clientIdNum.parentNode.parentNode.insertBefore(
          editBtn,
          q.clientIdNum.parentNode.nextSibling,
        );
      } else if (!disabled) {
        const editBtn = document.getElementById("edit-client-btn");
        if (editBtn) editBtn.remove(); // Elimina el botón de edición si los campos están habilitados
      }
    },

    /**
     * Reinicia el formulario a su estado inicial.
     */
    resetForm() {
      q.form.reset();
      this.disableClientFields(false);
      state.clientLocked = false;

      q.form.classList.remove("was-validated"); // Elimina clases de validación

      this.setLoading(false); // Oculta el indicador de carga

      q.clientIdPrefix.focus(); // Establece el foco en el primer campo
    },

    /**
     * Muestra un mensaje de error específico para un campo del formulario.
     * @param {HTMLElement} field - El elemento del campo HTML.
     * @param {string} message - El mensaje de error a mostrar.
     */
    showFieldError(field, message) {
      const targetField = // Determina el campo objetivo para mostrar el error
        field === q.clientIdPrefix || field === q.clientIdNum
          ? q.clientIdNum
          : field;
      const formGroup =
        targetField.closest(".form-group") || targetField.parentElement;
      let feedback = formGroup.querySelector(".invalid-feedback");

      if (!feedback) { // Crea un feedback de validación si no existe
        feedback = document.createElement("div");
        feedback.className = "invalid-feedback";
        formGroup.appendChild(feedback);
      }

      feedback.textContent = message;
      targetField.classList.add("is-invalid"); // Marca el campo como inválido
      targetField.focus(); // Establece el foco en el campo erróneo
    },

    /**
     * Limpia todos los mensajes de error de validación de los campos del formulario.
     */
    clearFieldErrors() {
      q.form.querySelectorAll(".is-invalid").forEach((el) => {
        el.classList.remove("is-invalid"); // Elimina la clase 'is-invalid'
      });
    },
  };

  /**
   * Implementa un patrón debounce para limitar la frecuencia de ejecución de una función.
   * Útil para búsquedas o validaciones en tiempo real.
   * @param {Function} fn - La función a ejecutar.
   * @param {number} [wait=300] - El tiempo de espera en milisegundos.
   * @returns {Function} La función con debounce.
   */
  const debounce = (fn, wait = 300) => {
    let t;
    return (...args) => {
      clearTimeout(t);
      t = setTimeout(() => fn(...args), wait);
    };
  };

  /**
   * Obtiene el valor recortado de un elemento HTML, manejando posibles valores nulos.
   * @param {HTMLElement} el - El elemento HTML.
   * @returns {string} El valor recortado del elemento o una cadena vacía.
   */
  const safeGetVal = (el) => (el?.value ?? "").trim();

  /**
   * Construye el número de identificación completo del cliente a partir del prefijo y el número.
   * @returns {string} El ID de cliente completo en mayúsculas.
   */
  const getClientId = () => {
    const prefix = safeGetVal(q.clientIdPrefix);
    const num = safeGetVal(q.clientIdNum);
    return prefix && num ? `${prefix}${num}`.toUpperCase() : "";
  };

  /**
   * Busca un cliente por su ID en el backend con un debounce.
   * Si lo encuentra, rellena los campos del cliente y los deshabilita.
   */
  const searchClientById = debounce(async () => {
    const idNumber = getClientId();
    if (!idNumber || idNumber.length < 3) { // No busca si el ID es muy corto
      ui.disableClientFields(false); // Habilita campos si no hay ID válido
      return;
    }

    try {
      const cliente = await window.api.getClient(idNumber); // Llama a la API de Electron

      if (cliente) { // Si se encuentra el cliente
        q.clientName.value = cliente.name || "";
        q.clientPhone.value = cliente.phone || "";

        ui.disableClientFields(true); // Deshabilita los campos
        showNotification(`Cliente encontrado: ${cliente.name}`, "info");
      } else { // Si no se encuentra el cliente
        ui.disableClientFields(false); // Habilita los campos para permitir la entrada manual
        q.clientName.value = "";
        q.clientPhone.value = "";
      }
    } catch (error) {
      console.error("Error al buscar cliente:", error);
      ui.disableClientFields(false); // Asegura que los campos estén habilitados en caso de error
    }
  }, 500); // Debounce de 500ms

  /**
   * Inicializa los escuchadores de eventos del formulario y carga los datos de la recepción si está en modo edición.
   */
  function init() {
    // Evita el envío del formulario si no es válido según HTML5
    q.form.addEventListener(
      "submit",
      (event) => {
        if (!q.form.checkValidity()) {
          event.preventDefault();
          event.stopPropagation();
        }
      },
      false,
    );

    // Escuchadores para la búsqueda de clientes por ID
    q.clientIdPrefix.addEventListener("change", searchClientById);
    q.clientIdNum.addEventListener("input", searchClientById);
    q.clientIdNum.addEventListener("blur", searchClientById);

    // Comprueba si se está editando una recepción existente
    const urlParams = new URLSearchParams(window.location.search);
    const receptionId = urlParams.get("id");

    if (receptionId) { // Modo edición
      state.editMode = true;
      state.receptionId = receptionId;
      q.formTitle.textContent = "Editar Recepción";
      document.title = `Editar Recepción #${receptionId} | APP-TALLER`;
      loadReceptionForEdit(receptionId); // Carga los datos de la recepción para editar
    } else { // Modo creación
      q.clientIdPrefix.focus(); // Enfoca el primer campo
    }

    q.form.classList.add("needs-validation"); // Habilita la validación de Bootstrap
  }

  // Inicializa el script
  init();

  /**
   * Carga los datos de una recepción existente en el formulario para su edición.
   * @param {number} id - El ID de la recepción a cargar.
   */
  async function loadReceptionForEdit(id) {
    try {
      ui.setLoading(true, "Cargando recepción..."); // Muestra indicador de carga
      ui.setMessage("Cargando información de la recepción...", "info"); // Muestra mensaje de carga

      const rec = await window.api.getReception(id); // Obtiene la recepción del backend
      if (!rec) throw new Error("No se encontró la recepción solicitada");

      // Rellena los campos del cliente
      if (rec.client_idNumber) {
        const fullIdNumber = rec.client_idNumber;
        const prefix = fullIdNumber.charAt(0).toUpperCase();
        const num = fullIdNumber.substring(1);

        q.clientIdPrefix.value = prefix;
        q.clientIdNum.value = num;

        try {
          const cliente = await window.api.getClient(fullIdNumber); // Intenta obtener detalles completos del cliente
          if (cliente) {
            q.clientName.value = cliente.name || "";
            q.clientPhone.value = cliente.phone || "";
            ui.disableClientFields(true); // Deshabilita campos si el cliente ya existe
          }
        } catch (error) {
          console.warn(
            "No se pudo cargar la información completa del cliente:",
            error,
          );
          ui.disableClientFields(false); // Habilita campos si hay error al cargar cliente
        }
      }

      // Carga los datos del equipo
      const loadDeviceData = async () => {
        try {
          if (rec.device_snapshot) { // Prioriza el snapshot si existe
            const snapshot = rec.device_snapshot;
            q.deviceSerial.value = snapshot.serial_number || "";
            q.deviceDescription.value = snapshot.description || "";
            q.deviceFeatures.value = snapshot.features || "";
            return;
          }

          if (rec.device_id) { // Si no hay snapshot, busca el equipo por ID
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

      await loadDeviceData(); // Ejecuta la carga de datos del equipo

      // Rellena los campos de la recepción
      q.defect.value = rec.defect || "";
      q.status.value = rec.status || "PENDIENTE";
      q.repair.value = rec.repair || "";

      ui.clearMessage(); // Limpia mensajes anteriores
      ui.setMessage(
        "Recepción cargada correctamente. Puede editar los campos necesarios.",
        "success",
      );
    } catch (error) {
      console.error("Error al cargar la recepción:", error);
      ui.setMessage(`Error al cargar la recepción: ${error.message}`, "danger"); // Muestra error en UI
    } finally {
      ui.setLoading(false); // Oculta indicador de carga
    }
  }

  /**
   * Guarda una nueva recepción o actualiza una existente.
   * Gestiona la creación/actualización de cliente y equipo asociados.
   */
  async function saveReception() {
    ui.clearFieldErrors(); // Limpia errores de campo
    ui.clearMessage();     // Limpia mensajes generales

    // Validaciones básicas del formulario
    if (!getClientId() || !q.clientName.value) {
      ui.setMessage("Por favor, complete los datos del cliente", "warning");
      return;
    }

    if (!q.deviceDescription.value || !q.defect.value) {
      ui.setMessage(
        "Por favor, complete la descripción del equipo y el defecto reportado",
        "warning",
      );
      return;
    }

    ui.setLoading(true, state.editMode ? "Actualizando..." : "Guardando..."); // Muestra indicador de carga

    // Construye objetos con los datos del cliente, equipo y recepción
    const clientData = {
      idNumber: getClientId(),
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
      // Crea un snapshot del dispositivo si hay datos relevantes
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
      try { // Gestión de Cliente: crea si no existe, actualiza si hay cambios
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
          "No se pudo guardar la información del cliente. Por favor, verifique los datos e intente nuevamente.",
        );
      }

      let equipo;
      try { // Gestión de Equipo: crea, actualiza o busca por serial
        if (deviceData.serial_number) {
          if (window.api.upsertDeviceBySerial) { // Usa upsert si disponible
            equipo = await window.api.upsertDeviceBySerial(deviceData);
          } else if (window.api.getDeviceBySerial) { // Fallback con get y luego update/create
            const found = await window.api.getDeviceBySerial(
              deviceData.serial_number,
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
        } else { // Si no hay número de serie, siempre crea uno nuevo
          equipo = await window.api.createDevice(deviceData);
        }
      } catch (error) {
        console.error("Error al gestionar el equipo:", error);
        equipo = null;
      }

      const device_id = extractDeviceId(equipo);
      if (!device_id) throw new Error("No se pudo obtener el ID del equipo");

      // Crea el snapshot final del dispositivo para la recepción
      const snapshot = {
        id: device_id,
        serial_number:
          equipo?.serial_number || deviceData.serial_number || null,
        description: equipo?.description || deviceData.description || null,
        features: equipo?.features || deviceData.features || null,
        captured_at: new Date().toISOString(),
      };

      // Construye el objeto final de la recepción a guardar/actualizar
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

      try { // Guarda o actualiza la Recepción
        let recepcion;
        // Asegura que el usuario actual esté disponible
        if (!currentUser || !currentUser.id) {
          throw new Error(
            "No se pudo obtener la información del usuario para realizar esta acción.",
          );
        }

        if (state.editMode) { // Modo edición
          recepcion = await window.api.updateReception(
            state.receptionId,
            finalReception,
            currentUser.id, // Pasa user_id para auditoría
          );
          showNotification("Recepción actualizada correctamente", "success");
        } else { // Modo creación
          recepcion = await window.api.createReception(
            finalReception,
            currentUser.id, // Pasa user_id para auditoría
          );
          showNotification("Recepción creada correctamente", "success");
          // Después de crear, reinicia el formulario y redirige
          setTimeout(() => {
            ui.resetForm();
            window.location.href = "index.html";
          }, 1000);
        }

        // Redirige a la página principal con un hash para la recepción actualizada si está en modo edición
        if (state.editMode) {
          setTimeout(() => {
            window.location.href = `index.html#reception-${recepcion.id}`;
          }, 1500);
        }

        return recepcion;
      } catch (error) {
        console.error("Error al guardar la recepción:", error);
        throw new Error(
          "No se pudo guardar la recepción. Por favor, intente nuevamente.",
        );
      }
    } catch (error) {
      console.error("Error en el proceso de guardado:", error);

      let errorMessage =
        error.message || "Error desconocido al procesar la solicitud";

      // Manejo de errores específicos por violación de unicidad
      if (error.message && error.message.includes("UNIQUE constraint failed")) {
        if (error.message.includes("client.idNumber")) {
          errorMessage = "Ya existe un cliente con esta cédula/RIF";
          ui.showFieldError(q.clientId, errorMessage);
        } else if (error.message.includes("device.serial_number")) {
          errorMessage = "Ya existe un equipo con este número de serie";
          if (q.deviceSerial) ui.showFieldError(q.deviceSerial, errorMessage);
        }
      }

      showNotification(errorMessage, "danger"); // Muestra notificación de error
      window.scrollTo({ top: 0, behavior: "smooth" }); // Desplaza al inicio de la página
    } finally {
      ui.setLoading(false); // Oculta el indicador de carga
    }
  }

  /**
   * Manejador del evento 'submit' del formulario.
   * Valida el formulario y llama a `saveReception` si es válido.
   * @param {Event} event - El evento de envío del formulario.
   */
  async function handleFormSubmit(event) {
    event.preventDefault(); // Previene el envío HTML por defecto

    if (!q.form.checkValidity()) { // Si el formulario no es válido según HTML5
      event.stopPropagation();
      q.form.classList.add("was-validated"); // Muestra los mensajes de validación de Bootstrap
      return;
    }

    await saveReception(); // Guarda o actualiza la recepción
  }

  // Asigna el manejador al evento 'submit' del formulario
  q.form.addEventListener("submit", handleFormSubmit);
});
