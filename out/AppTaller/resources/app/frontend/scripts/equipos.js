// frontend/scripts/equipos.js - Módulo de gestión de equipos

let equipos = [];
let equipoEditandoId = null;
let equipoAEliminarId = null;

// Cargar equipos al iniciar
document.addEventListener('DOMContentLoaded', async () => {
  await cargarEquipos();
});

// Función para cargar equipos
async function cargarEquipos() {
  try {
    if (window.api && window.api.listDevices) {
      equipos = await window.api.listDevices();
      mostrarEquipos();
    } else {
      mostrarError('API no disponible');
    }
  } catch (error) {
    mostrarError('Error al cargar equipos: ' + error.message);
  }
}

// Función para mostrar equipos en la tabla
function mostrarEquipos() {
  const tbody = document.getElementById('equiposTableBody');
  const noEquiposMessage = document.getElementById('noEquiposMessage');
  
  if (equipos.length === 0) {
    tbody.innerHTML = '';
    noEquiposMessage.style.display = 'block';
    return;
  }
  
  noEquiposMessage.style.display = 'none';
  tbody.innerHTML = equipos.map(equipo => `
    <tr>
      <td>${equipo.id}</td>
      <td>${equipo.descripcion}</td>
      <td>${equipo.caracteristicas || '<span class="text-muted">Sin características</span>'}</td>
      <td>
        <div class="btn-group" role="group">
          <button type="button" class="btn btn-sm btn-outline-primary" onclick="editarEquipo(${equipo.id})" title="Editar">
            <i class="bi bi-pencil"></i>
          </button>
          <button type="button" class="btn btn-sm btn-outline-danger" onclick="confirmarEliminar(${equipo.id}, '${equipo.descripcion.replace(/'/g, "\\'")}')" title="Eliminar">
            <i class="bi bi-trash"></i>
          </button>
        </div>
      </td>
    </tr>
  `).join('');
}

// Función para abrir modal de agregar
function abrirModalAgregar() {
  equipoEditandoId = null;
  document.getElementById('equipoModalLabel').textContent = 'Agregar Equipo';
  document.getElementById('btnGuardarTexto').textContent = 'Guardar';
  document.getElementById('equipoForm').reset();
  document.getElementById('equipoForm').classList.remove('was-validated');
}

// Función para editar equipo
function editarEquipo(id) {
  const equipo = equipos.find(e => e.id === id);
  if (!equipo) return;
  
  equipoEditandoId = id;
  document.getElementById('equipoModalLabel').textContent = 'Editar Equipo';
  document.getElementById('btnGuardarTexto').textContent = 'Actualizar';
  document.getElementById('descripcion').value = equipo.descripcion;
  document.getElementById('caracteristicas').value = equipo.caracteristicas || '';
  
  new bootstrap.Modal(document.getElementById('equipoModal')).show();
}

// Función para confirmar eliminación
function confirmarEliminar(id, descripcion) {
  equipoAEliminarId = id;
  document.getElementById('equipoAEliminar').textContent = descripcion;
  new bootstrap.Modal(document.getElementById('eliminarModal')).show();
}

// Función para manejar envío del formulario
async function manejarSubmitFormulario(e) {
  e.preventDefault();
  
  const form = e.target;
  if (!form.checkValidity()) {
    form.classList.add('was-validated');
    return;
  }
  
  const btnGuardar = document.getElementById('btnGuardar');
  const btnTextoOriginal = btnGuardar.innerHTML;
  
  try {
    btnGuardar.disabled = true;
    btnGuardar.innerHTML = '<i class="bi bi-hourglass-split"></i> Guardando...';
    
    const formData = new FormData(form);
    const equipoData = {
      descripcion: formData.get('descripcion'),
      caracteristicas: formData.get('caracteristicas')
    };
    
    if (equipoEditandoId) {
      // Actualizar equipo existente
      await window.api.updateDevice(equipoEditandoId, equipoData);
      mostrarExito('Equipo actualizado correctamente');
    } else {
      // Crear nuevo equipo
      await window.api.createDevice(equipoData);
      mostrarExito('Equipo agregado correctamente');
    }
    
    bootstrap.Modal.getInstance(document.getElementById('equipoModal')).hide();
    await cargarEquipos();
    
  } catch (error) {
    mostrarError('Error al guardar: ' + error.message);
  } finally {
    btnGuardar.disabled = false;
    btnGuardar.innerHTML = btnTextoOriginal;
  }
}

// Función para manejar confirmación de eliminación
async function manejarConfirmacionEliminar() {
  if (!equipoAEliminarId) return;
  
  const btn = document.getElementById('btnConfirmarEliminar');
  const textoOriginal = btn.innerHTML;
  
  try {
    btn.disabled = true;
    btn.innerHTML = '<i class="bi bi-hourglass-split"></i> Eliminando...';
    
    await window.api.deleteDevice(equipoAEliminarId);
    mostrarExito('Equipo eliminado correctamente');
    
    bootstrap.Modal.getInstance(document.getElementById('eliminarModal')).hide();
    await cargarEquipos();
    
  } catch (error) {
    mostrarError('Error al eliminar: ' + error.message);
  } finally {
    btn.disabled = false;
    btn.innerHTML = textoOriginal;
    equipoAEliminarId = null;
  }
}

// Función para mostrar errores
function mostrarError(mensaje) {
  mostrarToast(mensaje, 'danger', 'bi-exclamation-triangle');
}

// Función para mostrar éxito
function mostrarExito(mensaje) {
  mostrarToast(mensaje, 'success', 'bi-check-circle');
}

// Función genérica para mostrar toasts
function mostrarToast(mensaje, tipo, icono) {
  const toastHtml = `
    <div class="toast align-items-center text-white bg-${tipo} border-0" role="alert" aria-live="assertive" aria-atomic="true">
      <div class="d-flex">
        <div class="toast-body">
          <i class="bi ${icono}"></i> ${mensaje}
        </div>
        <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
      </div>
    </div>
  `;
  
  // Agregar toast al DOM
  let toastContainer = document.getElementById('toastContainer');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'toastContainer';
    toastContainer.className = 'toast-container position-fixed top-0 end-0 p-3';
    toastContainer.style.zIndex = '9999';
    document.body.appendChild(toastContainer);
  }
  
  toastContainer.insertAdjacentHTML('beforeend', toastHtml);
  const toastElement = toastContainer.lastElementChild;
  const toast = new bootstrap.Toast(toastElement, { delay: 4000 });
  toast.show();
  
  // Remover toast después de que se oculte
  toastElement.addEventListener('hidden.bs.toast', () => {
    toastElement.remove();
  });
}

// Inicializar event listeners cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  // Event listener para el formulario
  const equipoForm = document.getElementById('equipoForm');
  if (equipoForm) {
    equipoForm.addEventListener('submit', manejarSubmitFormulario);
  }
  
  // Event listener para confirmación de eliminación
  const btnConfirmarEliminar = document.getElementById('btnConfirmarEliminar');
  if (btnConfirmarEliminar) {
    btnConfirmarEliminar.addEventListener('click', manejarConfirmacionEliminar);
  }
});