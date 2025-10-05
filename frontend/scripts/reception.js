// Reception Frontend Script

let receptions = [];
let archivedReceptions = [];
let receptionsEdit = null;
let receptionToArchiveId = null;
let receptionToRestoreId = null;

document.addEventListener("DOMContentLoaded", async () => {
  await loadReceptions();
});

async function loadReceptions() {
  try {
    if (window.api && window.api.listReceptions) {
      receptions = await window.api.listReceptions();
      showReceptions();
    } else {
      showError("API NOT AVAILABLE");
    }
  } catch (error) {
    showError("Error loading receptions: " + error.message);
  }
}

function showReceptions() {
  const tbody = document.getElementById("receptionsTableBody");
  const noReceptionsMessage = document.getElementById("noReceptionsMessage");
  if (receptions.length === 0) {
    tbody.innerHTML = "";
    noReceptionsMessage.style.display = "block";
    return;
  }

  noReceptionsMessage.style.display = "none";
  tbody.innerHTML = receptions
    .map(
      (reception) =>
        `<tr> 
    <td>${reception.id}</td>
    <td>${reception.device_id.descripcion}</td>
    <td>${reception.client_id.nombre}</td>
    <td>${reception.estado}</td>
    <td>${
      reception.falla_reportada ||
      '<span class="text-muted">No reportada</span>'
    }</td>
    <td>${
      reception.observaciones ||
      '<span class="text-muted">Sin observaciones</span>'
    }</td>
    <td>${
      reception.reparacion_realizada ||
      '<span class="text-muted">No realizada</span>'
    }</td>
    <td>${
      reception.costo_reparacion != null
        ? `$${reception.costo_reparacion.toFixed(2)}`
        : '<span class="text-muted">No especificado</span>'
    }</td>
    <td>${new Date(reception.fecha_ingreso).toLocaleDateString()}</td>
    <td>${
      reception.fecha_entrega
        ? new Date(reception.fecha_entrega).toLocaleDateString()
        : '<span class="text-muted">No entregada</span>'
    }</td>
    <td>
        <div class="btn-group" role="group">
            <button type="button" class="btn btn-sm btn-outline-primary" onclick="editReception(${
              reception.id
            })" title="Edit">
                <i class="bi bi-pencil"></i>
            </button>
            <button type="button" class="btn btn-sm btn-outline-warning" onclick="confirmArchive(${
              reception.id
            }, '${reception.client_id.nombre.replace(
          /'/g,
          "\\'"
        )}')" title="Archive">
                <i class="bi bi-archive"></i>
            </button>
        </div>
    </td>
    </tr>
        
    `
    )
    .join("");


    // modal event listeners

    function openModalAdd(){
        receptionsEdit = null; 
        document.getElementById("receptionModalLabel").textContent = "AGREGAR RECEPCIÓN";
        document.getElementById("btnSaveText").textContent = "GUARDAR";
        document.getElementById("receptionForm").reset();
        document.getElementById("receptionForm").classList.remove("was-validated");
        new bootstrap.Modal(document.getElementById("receptionModal")).show();
    }

   async function manageSubmitForm(e) {
  e.preventDefault();

  const form = e.target;
  if (!form.checkValidity()) {
    form.classList.add("was-validated");
    return;
  }

  const btnSave = document.getElementById("btnSave");
  const btnOriginalText = btnSave.innerHTML;

  try {
    btnSave.disabled = true;
    btnSave.innerHTML = `<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Guardando...`;

    const formData = new FormData(form);

    const clienteData = {
      nombre: formData.get("cliente_nombre"),
      telefono: formData.get("cliente_telefono"),
    };

    const equipoData = {
      descripcion: formData.get("equipo_descripcion"),
      caracteristicas: formData.get("equipo_caracteristicas"),
    };

    const recepcionData = {
      falla_reportada: formData.get("falla_reportada"),
      observaciones: formData.get("observaciones"),
    };

    // Enviar al backend vía IPC
    const result = await window.api.createReception({
      cliente: clienteData,
      equipo: equipoData,
      recepcion: recepcionData,
    });

    if (result.success) {
      showSuccess("Recepción guardada correctamente");
      form.reset();
      form.classList.remove("was-validated");
      await loadReceptions(); // recargar tabla
    } else {
      throw new Error(result.message || "Error desconocido");
    }
  } catch (error) {
    showError("ERROR SAVING RECEPTION: " + error.message);
  } finally {
    btnSave.disabled = false;
    btnSave.innerHTML = btnOriginalText;
  }
}
}
