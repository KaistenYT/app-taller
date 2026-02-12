document.addEventListener("DOMContentLoaded", () => {
  // Configuración inicial de la sesión de usuario y redirección si no hay sesión activa
  try {
    let sessionRaw = null;
    let sessionSource = null;
    try {
      sessionRaw = sessionStorage.getItem("app_user");
      sessionSource = "sessionStorage";
    } catch (e) {
      sessionRaw = null;
    }
    if (!sessionRaw) {
      try {
        sessionRaw = localStorage.getItem("app_user");
        sessionSource = "localStorage";
      } catch (e) {
        sessionRaw = null;
      }
    }
    if (!sessionRaw) {
      window.location.href = "login.html"; // Redirige a login si no hay sesión
      return;
    }
    const session = JSON.parse(sessionRaw);
    const currentUser = {
      id: session.id,
      username: session.username,
      role: session.role || "user", // Rol predeterminado 'user'
    };

    if (sessionSource === "localStorage") {
      // Manejo de expiración de sesión si se guarda en localStorage
      if (
        session.expires &&
        Number(session.expires) &&
        Date.now() > Number(session.expires)
      ) {
        try {
          localStorage.removeItem("app_user");
        } catch (e) {}
        window.location.href = "login.html";
        return;
      }
    }

    const navUserEl = document.getElementById("navbar-user");
    if (navUserEl) navUserEl.textContent = currentUser.username || ""; // Muestra el nombre de usuario en la barra de navegación

    window.appContext = {
      currentUser: currentUser, // Guarda el usuario actual en un contexto global
    };
  } catch (e) {
    window.location.href = "login.html";
    return;
  }

  // Referencias a elementos del DOM
  const tbody = document.getElementById("recepciones-body");
  const filtroGeneral = document.getElementById("filtroGeneral");
  const filtroFechaDesde = document.getElementById("filtroFechaDesde");
  const filtroFechaHasta = document.getElementById("filtroFechaHasta");
  const ordenFecha = document.getElementById("ordenFecha");
  const filtroArchivadas = document.getElementById("filtroArchivadas");
  const btnClear = document.getElementById("btn-clear-filters");
  const btnCreate = document.getElementById("btn-create");
  const btnRefresh = document.getElementById("btn-refresh");
  const btnLogout = document.getElementById("btn-logout");
  const pagination = document.getElementById("pagination");
  const listSummary = document.getElementById("list-summary");
  const modalEl = document.getElementById("receptionModal");
  const modal = modalEl ? new bootstrap.Modal(modalEl) : null;
  const modalBody = document.getElementById("modal-body-content");
  const modalEditBtn = document.getElementById("modal-edit-btn");
  const modalGenReportBtn = document.getElementById("modal-gen-report");
  const btnReportList = document.getElementById("btn-reports-list");

  let cache = []; // Caché para almacenar las recepciones (aunque ahora se usa principalmente para procesar snapshots)
  let page = 1;   // Página actual para la paginación
  const perPage = 8; // Elementos por página

  // Navegación a la lista de reportes
  if (btnReportList) {
    btnReportList.addEventListener("click", () => {
      window.location.href = "reportList.html";
    });
  }

  // Redirección para crear nueva recepción
  if (btnCreate)
    btnCreate.addEventListener(
      "click",
      () => (window.location.href = "addReceptionForm.html"),
    );
  // Refrescar la tabla de recepciones
  if (btnRefresh) btnRefresh.addEventListener("click", () => render());
  // Cerrar sesión
  if (btnLogout)
    btnLogout.addEventListener("click", () => {
      try {
        try {
          sessionStorage.removeItem("app_user");
        } catch (e) {}
        try {
          localStorage.removeItem("app_user");
        } catch (e) {}
      } catch (e) {
        throw e;
      }
      window.location.href = "login.html";
    });
  // Evento para el filtro general (con debounce)
  if (filtroGeneral)
    filtroGeneral.addEventListener(
      "input",
      debounce(() => {
        page = 1;
        render();
      }, 250),
    );
  // Eventos para filtros de fecha
  if (filtroFechaDesde)
    filtroFechaDesde.addEventListener("change", () => {
      page = 1;
      render();
    });
  if (filtroFechaHasta)
    filtroFechaHasta.addEventListener("change", () => {
      page = 1;
      render();
    });
  // Evento para ordenamiento por fecha
  if (ordenFecha)
    ordenFecha.addEventListener("change", () => {
      page = 1;
      render();
    });
  // Evento para filtro de archivadas
  if (filtroArchivadas)
    filtroArchivadas.addEventListener("change", () => {
      page = 1;
      render();
    });
  // Evento para limpiar todos los filtros
  if (btnClear)
    btnClear.addEventListener("click", () => {
      if (filtroGeneral) filtroGeneral.value = "";
      if (filtroFechaDesde) filtroFechaDesde.value = "";
      if (filtroFechaHasta) filtroFechaHasta.value = "";
      if (ordenFecha) ordenFecha.value = "desc";
      if (filtroArchivadas) filtroArchivadas.value = "activas";
      page = 1;
      render();
    });

  /**
   * Implementa un patrón debounce para limitar la frecuencia de ejecución de una función.
   * Útil para inputs de búsqueda.
   * @param {Function} fn - La función a ejecutar.
   * @param {number} [wait=300] - El tiempo de espera en milisegundos.
   * @returns {Function} La función con debounce.
   */
  function debounce(fn, wait = 300) {
    let t;
    return (...args) => {
      clearTimeout(t);
      t = setTimeout(() => fn(...args), wait);
    };
  }

  // Instancia del modal personalizado para alertas y confirmaciones
  let customModalInstance = null;

  /**
   * Muestra un modal personalizado para alertas o confirmaciones.
   * @param {Object} options - Opciones de configuración para el modal.
   * @param {string} [options.type='info'] - Tipo de mensaje ('info', 'success', 'warning', 'danger', 'question').
   * @param {string} [options.title='Mensaje del Sistema'] - Título del modal.
   * @param {string} options.message - Mensaje principal del modal.
   * @param {string} [options.detail=''] - Detalles adicionales del mensaje.
   * @param {Array<string>} [options.buttons=['OK']] - Etiquetas de los botones a mostrar.
   * @returns {Promise<number>} Una promesa que resuelve con el índice del botón clicado.
   */
  async function showCustomModal(options) {
    const defaultOptions = {
      type: "info",
      title: "Mensaje del Sistema",
      message: "",
      detail: "",
      buttons: ["OK"],
    };
    const opts = { ...defaultOptions, ...options };

    if (!customModalInstance) {
      customModalInstance = new bootstrap.Modal(
        document.getElementById("customAlertConfirmModal"),
        {
          backdrop: "static",
          keyboard: false,
        },
      );
    }

    const modalTitle = document.getElementById("customAlertConfirmModalLabel");
    const modalIcon = document.getElementById("customAlertConfirmModalIcon");
    const modalMessage = document.getElementById(
      "customAlertConfirmModalMessage",
    );
    const modalDetail = document.getElementById(
      "customAlertConfirmModalDetail",
    );
    const modalFooter = document.getElementById(
      "customAlertConfirmModalFooter",
    );

    modalTitle.textContent = opts.title;
    modalMessage.textContent = opts.message;
    modalDetail.textContent = opts.detail;
    modalIcon.className = `me-3 fs-4`;
    switch (opts.type) {
      case "info":
        modalIcon.classList.add("bi", "bi-info-circle-fill", "text-primary");
        break;
      case "success":
        modalIcon.classList.add("bi", "bi-check-circle-fill", "text-success");
        break;
      case "warning":
        modalIcon.classList.add(
          "bi",
          "bi-exclamation-triangle-fill",
          "text-warning",
        );
        break;
      case "danger":
        modalIcon.classList.add("bi", "bi-x-circle-fill", "text-danger");
        break;
      case "question":
        modalIcon.classList.add(
          "bi",
          "bi-question-circle-fill",
          "text-secondary",
        );
        break;
      default:
        modalIcon.classList.add("bi", "bi-info-circle-fill", "text-primary");
    }

    modalFooter.innerHTML = "";

    return new Promise((resolve) => {
      opts.buttons.forEach((buttonText, index) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = `btn ${index === 0 ? "btn-primary" : "btn-secondary"} me-2`;
        btn.textContent = buttonText;
        btn.addEventListener("click", () => {
          customModalInstance.hide();
          resolve(index);
        });
        modalFooter.appendChild(btn);
      });
      customModalInstance.show();
    });
  }

  /**
   * Muestra un modal de mensaje simple (alerta).
   * @param {string} message - El mensaje a mostrar.
   * @param {string} [type='info'] - Tipo de mensaje ('info', 'success', etc.).
   * @param {string} [title='Mensaje del Sistema'] - Título del modal.
   */
  async function showAppMessageBox(
    message,
    type = "info",
    title = "Mensaje del Sistema",
  ) {
    const options = { type, title, message, buttons: ["OK"] };
    await showCustomModal(options);
  }

  /**
   * Muestra un modal de confirmación con botones "Sí" y "No".
   * @param {string} message - El mensaje de confirmación.
   * @param {string} [title='Confirmación'] - Título del modal.
   * @param {string} [detail=''] - Detalles adicionales.
   * @returns {Promise<boolean>} Una promesa que resuelve a `true` si se presiona "Sí", `false` si se presiona "No".
   */
  async function showAppConfirmBox(
    message,
    title = "Confirmación",
    detail = "",
  ) {
    const options = {
      type: "question",
      title,
      message,
      detail,
      buttons: ["Sí", "No"],
    };
    const responseIndex = await showCustomModal(options);
    return responseIndex === 0;
  }

  /**
   * Construye un objeto de filtros a partir de los valores actuales de los elementos del DOM.
   * Incluye filtros de búsqueda general, rango de fechas, ordenamiento y estado de archivado,
   * así como parámetros de paginación (limit y offset).
   * @returns {Object} Objeto con los filtros activos.
   */
  function buildFilters() {
    const filters = {};
    if (filtroGeneral && filtroGeneral.value.trim()) {
      filters.general = filtroGeneral.value.trim();
    }
    if (filtroFechaDesde && filtroFechaDesde.value) {
      filters.dateFrom = filtroFechaDesde.value;
    }
    if (filtroFechaHasta && filtroFechaHasta.value) {
      filters.dateTo = filtroFechaHasta.value;
    }
    if (ordenFecha && ordenFecha.value) {
      filters.orderBy = "created_at"; // Se asume 'created_at' como campo de ordenamiento
      filters.orderDirection = ordenFecha.value;
    }
    if (filtroArchivadas) {
      if (filtroArchivadas.value === "activas") {
        filters.archived = false;
      } else if (filtroArchivadas.value === "archivadas") {
        filters.archived = true;
      }
      // Si "todas", no se aplica filtro de archivado
    }

    filters.limit = perPage;
    filters.offset = (page - 1) * perPage;

    return filters;
  }

  /**
   * Carga las recepciones desde el backend, aplicando los filtros y la paginación.
   * Actualiza la caché interna de recepciones y devuelve los datos y el conteo total.
   * @param {Object} filters - Objeto con los filtros a aplicar.
   * @returns {Promise<{receptions: Array<Object>, totalCount: number}>} Promesa que resuelve con las recepciones y el total.
   */
  async function loadReceptions(filters) {
    console.log("Cargando recepciones con filtros:", filters);
    if (tbody) showLoadingRows(); // Muestra un indicador de carga
    try {
      if (!window.api) {
        throw new Error("window.api no está disponible");
      }

      if (typeof window.api.listReceptions !== "function") {
        throw new Error(
          "El método listReceptions no está disponible en window.api",
        );
      }
      if (typeof window.api.countReceptions !== "function") {
        throw new Error(
          "El método countReceptions no está disponible en window.api",
        );
      }

      console.log("Llamando a window.api.listReceptions()...");
      // Realiza llamadas IPC concurrentes para obtener la lista de recepciones y el conteo total
      const [receptions, totalCount] = await Promise.all([
        window.api.listReceptions(filters),
        window.api.countReceptions(filters),
      ]);

      const raw = Array.isArray(receptions) ? receptions : [];
      console.log(`Se recibieron ${raw.length} recepciones de ${totalCount}`);

      // Procesa los datos crudos, parseando device_snapshot si es necesario
      cache = raw.map((r) => {
        try {
          if (r.device_snapshot && typeof r.device_snapshot === "string") {
            try {
              r.device_snapshot = JSON.parse(r.device_snapshot);
            } catch (e) {
              console.warn("Error al parsear device_snapshot:", e);
              r.device_snapshot = null;
            }
          }

          const ds = r.device_snapshot || {
            id: r.device_id || r.device?.id || null,
            serial_number: r.device_serial || r.device?.serial_number || null,
            description:
              r.device_description ||
              r.device?.description ||
              "Sin descripción",
            features: r.device?.features || "Sin características",
            captured_at: r.created_at || new Date().toISOString(),
          };

          return { ...r, device_snapshot: ds };
        } catch (error) {
          console.error("Error al procesar recepción:", error, r);

          return {
            ...r,
            device_snapshot: {
              id: null,
              serial_number: "Error al cargar",
              description: "Error al cargar los datos del dispositivo",
              features: "",
              captured_at: new Date().toISOString(),
            },
          };
        }
      });
      return { receptions: cache, totalCount };
    } catch (err) {
      console.error("Error en loadReceptions:", err);

      if (tbody) {
        tbody.innerHTML = `
          <tr>
            <td colspan="6" class="text-center p-4">
              <div class="alert alert-info mb-0">
                <i class="bi bi-info-circle me-2"></i>
                No se encontraron recepciones que coincidan con los filtros actuales.
                <div class="mt-2">
                  <button class="btn btn-sm btn-outline-primary" id="btn-clear-filters-error">
                    <i class="bi bi-x-circle me-1"></i> Limpiar filtros
                  </button>
                  <button class="btn btn-sm btn-primary ms-2" id="btn-create-reception">
                    <i class="bi bi-plus-circle me-1"></i> Crear primera recepción
                  </button>
                </div>
              </div>
            </td>
          </tr>`;

        document
          .getElementById("btn-clear-filters-error")
          ?.addEventListener("click", () => {
            if (filtroGeneral) filtroGeneral.value = "";
            if (filtroFechaDesde) filtroFechaDesde.value = "";
            if (filtroFechaHasta) filtroFechaHasta.value = "";
            loadReceptions(buildFilters()); // Recarga con filtros limpios
          });

        document
          .getElementById("btn-create-reception")
          ?.addEventListener("click", () => {
            window.location.href = "addReceptionForm.html";
          });

        return { receptions: [], totalCount: 0 };
      }

      if (listSummary) {
        listSummary.textContent = "Error al cargar las recepciones";
      }
      throw err; // Re-lanza el error para que `render` pueda manejarlo
    }
  }

  /**
   * Muestra filas de esqueleto para indicar que los datos se están cargando.
   */
  function showLoadingRows() {
    if (!tbody) return;
    tbody.innerHTML = Array.from({ length: perPage })
      .map(
        () => `
      <tr>
        <td><div class="skeleton" style="width:120px"></div></td>
        <td><div class="skeleton" style="width:160px"></div></td>
        <td><div class="skeleton" style="width:180px"></div></td>
        <td><div class="skeleton" style="width:80px"></div></td>
        <td><div class="skeleton" style="width:140px"></div></td>
        <td><div class="skeleton" style="width:100px"></div></td>
      </tr>
    `,
      )
      .join("");
    if (listSummary) listSummary.textContent = "Cargando...";
  }

  /**
   * Escapa caracteres HTML de una cadena para prevenir ataques XSS.
   * @param {string} str - La cadena a escapar.
   * @returns {string} La cadena escapada.
   */
  function escapeHtml(str) {
    if (str === null || str === undefined) return "";
    return String(str).replace(
      /[&<>\"]/g,
      (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[ch],
    );
  }

  /**
   * Formatea el estado de una recepción en un badge con color.
   * @param {string} status - El estado de la recepción.
   * @returns {string} HTML de un badge de estado.
   */
  function formatStatusBadge(status) {
    const s = (status || "").toString().toUpperCase();
    const map = {
      PENDIENTE: "secondary",
      EN_PROGRESO: "warning",
      TERMINADO: "success",
      ENTREGADO: "info",
    };
    const cls = map[s] || "dark";
    return `<span class="badge bg-${cls} badge-status">${escapeHtml(status || "")}</span>`;
  }

  /**
   * Renderiza los controles de paginación en la UI.
   * @param {number} total - El número total de recepciones.
   */
  function renderPagination(total) {
    if (!pagination) return;
    const pages = Math.max(1, Math.ceil(total / perPage));
    pagination.innerHTML = "";

    const createPageItem = (
      text,
      pageNum,
      isActive = false,
      isDisabled = false,
    ) => {
      const li = document.createElement("li");
      li.className = `page-item ${isActive ? "active" : ""} ${isDisabled ? "disabled" : ""}`;
      const btn = document.createElement("button");
      btn.className = "page-link";
      btn.type = "button";
      btn.innerHTML = text;
      if (!isDisabled) {
        btn.addEventListener("click", () => {
          page = pageNum;
          render();
        });
      }
      li.appendChild(btn);
      return li;
    };

    // Botón "Anterior"
    pagination.appendChild(
      createPageItem("Anterior", page - 1, false, page === 1),
    );
    // Lógica para mostrar un rango de páginas
    const startPage = Math.max(1, page - 2);
    const endPage = Math.min(pages, page + 2);

    if (startPage > 1) {
      pagination.appendChild(createPageItem("1", 1));
      if (startPage > 2) {
        pagination.appendChild(createPageItem("...", "disabled", false, true));
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      pagination.appendChild(createPageItem(String(i), i, i === page));
    }

    if (endPage < pages) {
      if (endPage < pages - 1) {
        pagination.appendChild(createPageItem("...", "disabled", false, true));
      }
      pagination.appendChild(createPageItem(String(pages), pages));
    }

    // Botón "Siguiente"
    pagination.appendChild(
      createPageItem("Siguiente", page + 1, false, page === pages),
    );
  }

  /**
   * Función principal para renderizar la tabla de recepciones.
   * Construye los filtros, carga los datos del backend y actualiza la UI.
   */
  async function render() {
    console.log("Renderizando la tabla de recepciones...");

    if (!tbody) {
      console.error("Error: El elemento tbody no existe en el DOM");
      return;
    }

    try {
      const filters = buildFilters(); // Construye los filtros actuales
      const { receptions: list, totalCount: total } =
        await loadReceptions(filters); // Carga los datos filtrados del backend

      if (listSummary) {
        listSummary.textContent = `Mostrando ${total} recepción${total !== 1 ? "es" : ""}`;
      }

      if (total === 0) {
        // Muestra mensaje si no hay recepciones
        tbody.innerHTML = `
          <tr>
            <td colspan="6" class="text-center p-4">
              <div class="alert alert-info mb-0">
                <i class="bi bi-info-circle me-2"></i>
                No se encontraron recepciones que coincidan con los filtros actuales.
                <div class="mt-2">
                  <button class="btn btn-sm btn-outline-primary" id="btn-clear-filters-empty">
                    <i class="bi bi-x-circle me-1"></i> Limpiar filtros
                  </button>
                  <button class="btn btn-sm btn-primary ms-2" id="btn-create-reception">
                    <i class="bi bi-plus-circle me-1"></i> Crear primera recepción
                  </button>
                </div>
              </div>
            </td>
          </tr>`;

        document
          .getElementById("btn-clear-filters-empty")
          ?.addEventListener("click", () => {
            if (filtroGeneral) filtroGeneral.value = "";
            if (filtroFechaDesde) filtroFechaDesde.value = "";
            if (filtroFechaHasta) filtroFechaHasta.value = "";
            render(); // Recarga la vista con filtros limpios
          });

        document
          .getElementById("btn-create-reception")
          ?.addEventListener("click", () => {
            window.location.href = "addReceptionForm.html";
          });

        renderPagination(0); // Renderiza paginación vacía
        return;
      }

      renderPagination(total); // Actualiza la paginación

      tbody.innerHTML = ""; // Limpia la tabla actual

      // Renderiza cada fila de recepción
      list.forEach((r, index) => {
        const cliente = escapeHtml(
          r.client_name || r.client?.name || r.client_idNumber || "",
        );
        const equipo = escapeHtml(
          r.device_snapshot?.description ||
            r.device?.description ||
            r.device_description ||
            "",
        );
        const serial = escapeHtml(
          r.device_snapshot?.serial_number ||
            r.device?.serial_number ||
            r.device_serial ||
            "",
        );
        const estado = formatStatusBadge(r.status || "");
        const falla = escapeHtml(r.defect || "");
        const created = escapeHtml(
          new Date(
            r.created_at || r.createdAt || r.created || "",
          ).toLocaleString(),
        );
        const row = document.createElement("tr");
        row.dataset.id = r.id;
        row.innerHTML = `
          <td class="table-fixed-row">${cliente} <br/><small class="text-muted">${escapeHtml(r.client_idNumber || "")}</small></td>
          <td class="table-fixed-row">${equipo} ${serial ? `<br/><small class="text-muted">S/N: ${serial}</small>` : ""}</td>
          <td>${estado}</td>
          <td class="table-fixed-row">${falla}</td>
          <td>${created}</td>
          <td class="text-center">
            <div class="btn-group" role="group" aria-label="Acciones">
              <button type="button" class="btn btn-sm btn-outline-primary action-small mx-1" data-action="view" data-id="${r.id}" title="Ver" aria-label="Ver">
                <svg class="action-icon" viewBox="0 0 16 16" width="16" height="16" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M16 8s-3-5.5-8-5.5S0 8 0 8s3 5.5 8 5.5S16 8 16 8z"/><circle cx="8" cy="8" r="2.5"/></svg>
                <span class="visually-hidden">Ver</span>
              </button>
              <button type="button" class="btn btn-sm btn-outline-warning action-small mx-1" data-action="edit" data-id="${r.id}" title="Editar" aria-label="Editar">
                <svg class="action-icon" viewBox="0 0 16 16" width="16" height="16" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M12.146 0.146a.5.5 0 01.708 0l3 3a.5.5 0 010 .708l-9.793 9.793a.5.5 0 01-.233.131l-5 1a.5.5 0 01-.61-.61l1-5a.5.5 0 01.131-.232L12.146.146zM11.207 2L3 10.207V12h1.793L14 3.793 11.207 2z"/></svg>
                <span class="visually-hidden">Editar</span>
              </button>
              <button type="button" class="btn btn-sm btn-outline-secondary action-small mx-1" data-action="archive" data-id="${r.id}" title="Archivar/Restaurar" aria-label="Archivar/Restaurar">
                <svg class="action-icon" viewBox="0 0 16 16" width="16" height="16" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M3.5 3a.5.5 0 00-.5.5V4h10v-.5a.5.5 0 00-.5-.5h-9zM1 5v8.5A1.5 1.5 0 002.5 15h11a1.5 1.5 0 001.5-1.5V5H1zm4 3.5a.5.5 0 01.5-.5h5a.5.5 0 010 1h-5a.5.5 0 01-.5-.5z"/></svg>
                <span class="visually-hidden">${r.archived ? "Restaurar" : "Archivar"}</span>
              </button>
              ${
                window.appContext.currentUser.role === "admin"
                  ? `
              <button type="button" class="btn btn-sm btn-outline-danger action-small mx-1" data-action="delete" data-id="${r.id}" title="Eliminar" aria-label="Eliminar">
                <svg class="action-icon" viewBox="0 0 16 16" width="16" height="16" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M5.5 5.5a.5.5 0 01.5.5v6a.5.5 0 01-1 0v-6a.5.5 0 01.5-.5zm3 0a.5.5 0 01.5.5v6a.5.5 0 01-1 0v-6a.5.5 0 01.5-.5z"/><path fill-rule="evenodd" d="M14.5 3a1 1 0 01-1 1H13v9.5A2.5 2.5 0 0110.5 16h-5A2.5 2.5 0 013 13.5V4h-.5a1 1 0 010-2H5l1-1h4l1 1h2.5a1 1 0 011 1zM4.118 4L4 4.059V13.5c0 .827.673 1.5 1.5 1.5h5c.827 0 1.5-.673 1.5-1.5V4.059L11.882 4H4.118z"/></svg>
                <span class="visually-hidden">Eliminar</span>
              </button>
              `
                  : ""
              }
              <button type="button" class="btn btn-sm btn-outline-secondary action-small mx-1" data-action="print" data-id="${r.id}" title="Imprimir" aria-label="Imprimir">
                <svg class="action-icon" viewBox="0 0 16 16" width="16" height="16" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M2 7a1 1 0 011-1h10a1 1 0 011 1v2h-1v4H3V9H2V7zM5 12h6v-3H5v3z"/><path d="M5 1h6v3H5z"/></svg>
                <span class="visually-hidden">Imprimir</span>
              </button>
            </div>
          </td>
        </tr>
        `;
        tbody.appendChild(row);
      });

      try {
        if (tbody._delegatedHandler)
          tbody.removeEventListener("click", tbody._delegatedHandler);
      } catch (e) {
        throw e;
      }

      // Manejador delegado para acciones en botones de la tabla
      const handler = async (e) => {
        const btn = e.target.closest("button");
        if (!btn) return;
        const action = btn.dataset.action;
        const id = btn.dataset.id;
        console.debug("[recepciones] action click", { action, id });
        if (!action || !id) return;

        try {
          if (action === "view") {
            openDetailModal(id);
            return;
          }

          if (action === "edit") {
            window.location.href = `addReceptionForm.html?id=${id}`;
            return;
          }

          if (action === "archive") {
            await toggleArchive(id);
            return;
          }

          if (action === "delete") {
            await deleteReception(id);
            return;
          }

          if (action === "print") {
            console.debug(
              "[recepciones] print requested for reception id",
              id,
              {
                hasApi: !!window.api,
                hasInvoke: !!(window.api && window.api.invoke),
              },
            );

            try {
              await openReportWindow(Number(id));
              console.info("[recepciones] openReportWindow completed for", id);
            } catch (err) {
              console.error(
                "[recepciones] openReportWindow failed for",
                id,
                err,
              );

              try {
                window.open(
                  `report.html?id=${id}`,
                  "_blank",
                  "width=800,height=900",
                );
              } catch (winErr) {
                console.error(
                  "[recepciones] fallback window.open failed",
                  winErr,
                );
              }
            }
            return;
          }
        } catch (err) {
          console.error("[recepciones] handler error", err, { action, id });
        }
      };

      tbody.addEventListener("click", handler);

      tbody._delegatedHandler = handler;

      if (listSummary)
        listSummary.textContent = `Mostrando ${filters.offset + 1}–${Math.min(filters.offset + list.length, total)} de ${total} recepciones`;
    } catch (error) {
      console.error("Error en la función render:", error);

      if (tbody) {
        tbody.innerHTML = `
          <tr>
            <td colspan="6" class="text-center p-4">
              <div class="alert alert-danger">
                <i class="bi bi-exclamation-triangle me-2"></i>
                <strong>Error al cargar los datos</strong>
                <div class="small mt-1">${error.message || "Error desconocido"}</div>
              </div>
              <button class="btn btn-sm btn-outline-primary mt-2" onclick="window.location.reload()">
                <i class="bi bi-arrow-clockwise me-1"></i> Reintentar
              </button>
            </td>
          </tr>`;
      }
    }
  }

  /**
   * Abre un modal para mostrar los detalles de una recepción específica.
   * @param {number} id - El ID de la recepción cuyos detalles se van a mostrar.
   */
  async function openDetailModal(id) {
    try {
      // Busca en caché o obtiene los detalles de la recepción del backend
      const rec =
        cache.find((r) => String(r.id) === String(id)) ||
        (await window.api.receptionDetails(id));
      if (!rec) throw new Error("Recepción no encontrada");

      // Formatea y escapa los datos para mostrar en el modal
      const cliente = escapeHtml(
        rec.client_name || rec.client?.name || rec.client_idNumber || "",
      );
      let clientePhoneRaw = rec.client_phone || rec.client?.phone || "";
      if (!clientePhoneRaw && rec.client_idNumber) {
        try {
          const clientObj = await window.api.getClient(rec.client_idNumber);
          clientePhoneRaw = clientObj?.phone || "";
        } catch {}
      }
      const clientePhone = escapeHtml(clientePhoneRaw || "—");

      // Parsea device_snapshot si es una cadena JSON
      if (rec && typeof rec.device_snapshot === "string") {
        try {
          rec.device_snapshot = JSON.parse(rec.device_snapshot);
        } catch {
          rec.device_snapshot = null;
        }
      }

      const snapshot = rec.device_snapshot || {
        id: rec.device_id || rec.device?.id || null,
        serial_number: rec.device_serial || rec.device?.serial_number || null,
        description: rec.device_description || rec.device?.description || null,
        features: rec.device?.features || null,
        captured_at: rec.created_at || null,
      };

      const equipo = escapeHtml(snapshot.description || "—");
      const serial = escapeHtml(snapshot.serial_number || "—");
      const created = escapeHtml(
        new Date(rec.created_at || "").toLocaleString(),
      );
      const snapFeatures = escapeHtml(snapshot.features || "—");
      // const snapCaptured = escapeHtml(snapshot.captured_at || "—"); // No se usa

      // Rellena el cuerpo del modal con los detalles de la recepción
      if (modalBody) {
        modalBody.innerHTML = `
        <!-- Header con ID de recepción -->
        <div class="alert alert-primary d-flex align-items-center mb-3" role="alert">
          <i class="bi bi-receipt fs-4 me-3"></i>
          <div>
            <h6 class="mb-0">Recepción #${rec.id}</h6>
            <small>Creada el ${created}</small>
          </div>
          <div class="ms-auto">
            ${formatStatusBadge(rec.status)}
          </div>
        </div>

        <!-- Información del Cliente -->
        <div class="card mb-3">
          <div class="card-header bg-light">
            <h6 class="mb-0">
              <i class="bi bi-person-circle me-2"></i>Información del Cliente
            </h6>
          </div>
          <div class="card-body">
            <div class="row g-3">
              <div class="col-md-6">
                <label class="text-muted small mb-1">Nombre</label>
                <div class="fw-semibold">${cliente}</div>
              </div>
              <div class="col-md-6">
                <label class="text-muted small mb-1">Cédula/RIF</label>
                <div class="fw-semibold">${escapeHtml(rec.client_idNumber || "—")}</div>
              </div>
              <div class="col-md-6">
                <label class="text-muted small mb-1">Teléfono</label>
                <div class="fw-semibold">
                  <i class="bi bi-telephone me-1"></i>${clientePhone}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Información del Equipo -->
        <div class="card mb-3">
          <div class="card-header bg-light">
            <h6 class="mb-0">
              <i class="bi bi-laptop me-2"></i>Información del Equipo
            </h6>
          </div>
          <div class="card-body">
            <div class="row g-3">
              <div class="col-md-6">
                <label class="text-muted small mb-1">Descripción</label>
                <div class="fw-semibold">${equipo}</div>
              </div>
              <div class="col-md-6">
                <label class="text-muted small mb-1">Número de Serie</label>
                <div class="fw-semibold">
                  <i class="bi bi-upc-scan me-1"></i>${serial}
                </div>
              </div>
              ${
                snapFeatures !== "—"
                  ? `
              <div class="col-12">
                <label class="text-muted small mb-1">Características</label>
                <div class="fw-semibold">${snapFeatures}</div>
              </div>
              `
                  : ""
              }
            </div>
          </div>
        </div>

        <!-- Detalles de la Recepción -->
        <div class="card mb-3">
          <div class="card-header bg-light">
            <h6 class="mb-0">
              <i class="bi bi-clipboard-check me-2"></i>Detalles de la Recepción
            </h6>
          </div>
          <div class="card-body">
            <div class="row g-3">
              <div class="col-12">
                <label class="text-muted small mb-1">
                  <i class="bi bi-exclamation-triangle me-1"></i>Falla Reportada
                </label>
                <div class="alert alert-warning mb-0 py-2">
                  ${escapeHtml(rec.defect || "No especificada")}
                </div>
              </div>
              ${
                rec.repair
                  ? `
              <div class="col-12">
                <label class="text-muted small mb-1">
                  <i class="bi bi-tools me-1"></i>Diagnóstico/Reparación
                </label>
                <div class="alert alert-info mb-0 py-2">
                  ${escapeHtml(rec.repair)}
                </div>
              </div>
              `
                  : ""
              }
            </div>
          </div>
        </div>

        <!-- Timeline/Historial -->
        <div class="card">
          <div class="card-header bg-light">
            <h6 class="mb-0">
              <i class="bi bi-clock-history me-2"></i>Historial
            </i>
          </div>
          <div class="card-body">
            <div class="d-flex align-items-start">
              <div class="flex-shrink-0">
                <div class="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center" style="width: 40px; height: 40px;">
                  <i class="bi bi-plus-circle"></i>
                </div>
              </div>
              <div class="flex-grow-1 ms-3">
                <div class="fw-semibold">Recepción creada</div>
                <small class="text-muted">
                  <i class="bi bi-calendar3 me-1"></i>${created}
                </small>
              </div>
            </div>
          </div>
        </div>
      `;
      }

      // Configura botones de acción del modal
      if (modalEditBtn) {
        modalEditBtn.onclick = () =>
          (window.location.href = `addReceptionForm.html?id=${id}`);
      }

      if (modalGenReportBtn) {
        modalGenReportBtn.onclick = async () => {
          try {
            modalGenReportBtn.disabled = true;
            modalGenReportBtn.textContent = "Generando...";
            const res = await window.api.invoke(
              "create-report-from-reception",
              Number(id),
            );
            if (res?.id) {
              (await window.api.invoke?.(
                "open-report-window",
                Number(res.id),
              )) ||
                window.open(
                  `report.html?id=${res.id}`,
                  "_blank",
                  "width=900,height=800",
                );
            } else {
              await openReportWindow(id);
            }
          } catch (err) {
            console.error("Error generando reporte:", err);
            showAppMessageBox(
              "Error al generar el reporte: " + (err.message || err),
              "error",
              "Error al Generar Reporte",
            );
          } finally {
            modalGenReportBtn.disabled = false;
            modalGenReportBtn.textContent = "Generar reporte";
          }
        };
      }

      if (modalEl) modalEl.dataset.currentId = String(id);
      console.log("detail rec:", rec); // Log de depuración
      console.log("device_snapshot:", JSON.stringify(snapshot, null, 2)); // Log de depuración
      if (modal) modal.show(); // Muestra el modal
    } catch (err) {
      console.error(err);
      showAppMessageBox(
        "No se pudo cargar el detalle",
        "error",
        "Error al Cargar Detalle",
      );
    }
  }

  /**
   * Alterna el estado de archivado/restaurado de una recepción.
   * Requiere autenticación de usuario.
   * @param {number} id - El ID de la recepción a archivar o restaurar.
   */
  async function toggleArchive(id) {
    const { currentUser } = window.appContext;
    if (!currentUser || !currentUser.id) {
      showAppMessageBox(
        "No se pudo obtener la información del usuario para esta acción.",
        "error",
        "Error de Usuario",
      );
      return;
    }
    try {
      const rec = cache.find((r) => String(r.id) === String(id));
      if (!rec) throw new Error("No encontrado");
      if (rec.archived) await window.api.restoreReception(id, currentUser.id);
      else await window.api.archiveReception(id, currentUser.id);
      await render(); // Vuelve a renderizar la tabla para reflejar el cambio
    } catch (err) {
      console.error(err);
      showAppMessageBox("Error cambiando estado", "error", "Error de Estado");
    }
  }

  /**
   * Elimina una recepción del sistema.
   * Requiere autenticación de usuario con rol de administrador y confirmación.
   * @param {number} id - El ID de la recepción a eliminar.
   */
  async function deleteReception(id) {
    const { currentUser } = window.appContext;
    if (!currentUser || !currentUser.id || !currentUser.role) {
      showAppMessageBox(
        "No se pudo obtener la información del usuario para esta acción.",
        "error",
        "Error de Usuario",
      );
      return;
    }

    if (
      !(await showAppConfirmBox(
        "¿Eliminar esta recepción?",
        "Confirmar Eliminación",
      ))
    )
      return; // Si el usuario cancela, no procede
    try {
      await window.api.deleteReception(id, currentUser.id, currentUser.role);
      await render(); // Vuelve a renderizar la tabla para reflejar el cambio
    } catch (err) {
      console.error(err);
      const errorMessage = err.message.includes("Permiso denegado")
        ? err.message
        : "Error eliminando";
      showAppMessageBox(errorMessage, "error", "Error al Eliminar");
    }
  }

  // Lógica para cargar datos de prueba (seed)
  const btnSeed = document.getElementById("btn-seed");
  if (btnSeed) {
    btnSeed.addEventListener("click", async () => {
      if (
        !(await showAppConfirmBox(
          "Cargar datos de prueba en la base de datos?",
          "Confirmar Carga de Datos",
          "Esto añadirá clientes, equipos y recepciones de ejemplo.",
        ))
      )
        return;

      // Datos de ejemplo para clientes, equipos y recepciones
      const sampleClients = [
        { idNumber: "V12345678", name: "María Pérez", phone: "04141234567" },
        { idNumber: "V87654321", name: "José González", phone: "04147654321" },
        { idNumber: "E00000001", name: "Taller Demo", phone: "02121234567" },
      ];

      const sampleDevices = [
        {
          serial_number: "SN-1000-A",
          description: "PC Generica Modelo A",
          features: "Características varias",
        },
        {
          serial_number: "SN-1001-B",
          description: "Laptop modelo B",
          features: "i5, 8GB RAM, 256SSD",
        },
        {
          serial_number: "SN-1002-C",
          description: "AIO modelo C",
          features: "i7, 16GB RAM, 512SSD",
        },
      ];

      const sampleReceptions = [
        {
          client_idNumber: "V12345678",
          device_serial: "SN-1000-A",
          defect: "No enciende",
          status: "PENDIENTE",
          repair: "",
        },
        {
          client_idNumber: "V87654321",
          device_serial: "SN-1001-B",
          defect: "Pantalla rota",
          status: "EN REPARACION",
          repair: "No Se Consigue la Pantalla",
        },
        {
          client_idNumber: "E00000001",
          device_serial: "SN-1002-C",
          defect: "Batería dura poco",
          status: "ENTREGADO",
          repair: "Se cambio la bateria",
        },
      ];

      btnSeed.disabled = true; // Deshabilita el botón durante la carga
      btnSeed.textContent = "Cargando datos..."; // Cambia el texto del botón
      const results = { clients: 0, devices: 0, receptions: 0, errors: [] };

      try {
        // Carga clientes de prueba
        for (const c of sampleClients) {
          try {
            const existing = await window.api.getClient(c.idNumber);
            if (!existing) {
              await window.api.createClient(c);
              results.clients++;
            }
          } catch (err) {
            console.error("Error creando cliente", c, err);
            results.errors.push({
              type: "client",
              item: c,
              err: err.message || err,
            });
          }
        }

        // Carga dispositivos de prueba
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
            results.errors.push({
              type: "device",
              item: d,
              err: err.message || err,
            });
          }
        }

        // Carga recepciones de prueba
        for (const r of sampleReceptions) {
          try {
            const cliente = await window.api.getClient(r.client_idNumber);
            if (!cliente)
              throw new Error(`Cliente ${r.client_idNumber} no existe`);

            let device = null;
            if (window.api.getDeviceBySerial)
              device = await window.api.getDeviceBySerial(r.device_serial);
            if (!device) {
              if (window.api.upsertDeviceBySerial)
                device = await window.api.upsertDeviceBySerial({
                  serial_number: r.device_serial,
                  description: r.device_serial,
                });
              else
                device = await window.api.createDevice({
                  serial_number: r.device_serial,
                  description: r.device_serial,
                });
            }

            const device_id = device?.id;
            if (!device_id)
              throw new Error(
                "No se resolvió device_id para serial " + r.device_serial,
              );

            const device_snapshot = {
              id: device.id,
              serial_number: device.serial_number || r.device_serial,
              description: device.description || "",
              features: device.features || null,
              captured_at: new Date().toISOString(),
            };

            const finalReception = {
              client_idNumber: cliente.idNumber,
              device_id,
              defect: r.defect,
              status: r.status || "PENDIENTE",
              repair: r.repair || "",
              device_snapshot: device_snapshot,
            };

            await window.api.createReception(
              finalReception,
              window.appContext.currentUser.id,
            ); // Pasa user_id
            results.receptions++;
          } catch (err) {
            console.error("Error creando recepción", r, err);
            results.errors.push({
              type: "reception",
              item: r,
              err: err.message || err,
            });
          }
        }

        await render(); // Vuelve a renderizar la tabla principal

        const summary =
          `Carga completada: clientes ${results.clients}, dispositivos ${results.devices}, recepciones ${results.receptions}` +
          (results.errors.length ? `; errores: ${results.errors.length}` : "");
        showAppMessageBox(summary, "info", "Carga de Datos de Prueba");
      } catch (err) {
        console.error("Error en proceso de seed:", err);
        showAppMessageBox(
          "Ocurrió un error al cargar datos de prueba",
          "error",
          "Error de Carga de Datos",
        );
      } finally {
        btnSeed.disabled = false;
        btnSeed.textContent = "Cargar datos de prueba";
      }
    });
  }

  render(); // Carga y renderiza la tabla al iniciar la página

  /**
   * Abre una ventana o pestaña nueva para visualizar un reporte.
   * Si no existe un reporte para la recepción, intenta crearlo.
   * @param {number} receptionId - El ID de la recepción para la cual abrir/crear el reporte.
   */
  async function openReportWindow(receptionId) {
    console.debug("[openReportWindow] start", { receptionId });
    let reports;
    try {
      reports = await window.api.getReportByReception(receptionId); // Intenta obtener reportes existentes
      console.debug("[openReportWindow] reports by reception", {
        receptionId,
        count: reports?.length || 0,
      });
    } catch (err) {
      console.error("[openReportWindow] getReportByReception failed", err, {
        receptionId,
      });
      reports = null;
    }

    if (!reports || reports.length === 0) {
      console.debug(
        "[openReportWindow] no reports found; creating new report for reception",
        receptionId,
      );
      let reception = null;
      try {
        reception = await window.api.getReception(receptionId); // Obtiene detalles de la recepción
        console.debug(
          "[openReportWindow] fetched reception",
          receptionId,
          reception,
        );
      } catch (err) {
        console.error("[openReportWindow] getReception failed", err, {
          receptionId,
        });
      }

      // Construye una descripción predeterminada para el reporte
      const description = `
      <p><strong>ID Recepción:</strong> ${reception?.id ?? receptionId}</p>
      <p><strong>Fecha de ingreso:</strong> ${reception?.created_at ?? ""}</p>
      <p><strong>Cliente:</strong> ${reception?.client_idNumber ?? ""}</p>
      <p><strong>Equipo:</strong> ${reception?.device_snapshot?.description || reception?.device?.description || "No especificado"}</p>
      <p><strong>Estado inicial:</strong> ${reception?.defect ?? ""}</p>
      <hr />
      <p><strong>Diagnóstico técnico:</strong></p>
      <p>${reception?.repair || "Pendiente de evaluación"}</p>
    `;

      let newReport = null;
      try {
        newReport = await window.api.createReport({
          reception_id: receptionId,
          description,
        }); // Crea el nuevo reporte
        console.debug("[openReportWindow] createReport result", newReport);
      } catch (err) {
        console.error("[openReportWindow] createReport failed", err, {
          receptionId,
        });
      }

      if (!newReport || !newReport.id) {
        showAppMessageBox(
          "No se pudo crear el reporte.",
          "error",
          "Error al Crear Reporte",
        );
        return;
      }

      reports = [newReport];
    }

    const reportId = reports[0].id;
    console.debug("[openReportWindow] opening report window", { reportId });
    try {
      if (window.api && typeof window.api.invoke === "function") {
        await window.api.invoke("open-report-window", Number(reportId)); // Usa la API de Electron para abrir la ventana
      } else {
        window.open(
          `report.html?id=${reportId}`,
          "_blank",
          "width=800,height=900",
        ); // Fallback para abrir en una nueva pestaña del navegador
      }
    } catch (err) {
      console.error("[openReportWindow] failed to open report window", err, {
        reportId,
      });
    }
  }
});