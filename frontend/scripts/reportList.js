// Configuración global
const API_PREFIX = 'report';
let allReports = [];
let filteredReports = [];

// Elementos del DOM
const reportsContainer = document.getElementById('reports-container');
const loadingElement = document.getElementById('loading');
const noReportsElement = document.getElementById('no-reports');
const searchInput = document.getElementById('searchInput');
const dateFilter = document.getElementById('dateFilter');
const btnRefresh = document.getElementById('btn-refresh');
const btnApplyFilters = document.getElementById('btn-apply-filters');

// Inicialización
document.addEventListener('DOMContentLoaded', async () => {
    // Cargar reportes al iniciar
    await loadReports();
    
    // Configurar eventos
    setupEventListeners();
});

/**
 * Configura los event listeners de la interfaz
 */
function setupEventListeners() {
    // Botón de actualizar
    if (btnRefresh) {
        btnRefresh.addEventListener('click', loadReports);
    }
    
    // Aplicar filtros al hacer clic en el botón
    if (btnApplyFilters) {
        btnApplyFilters.addEventListener('click', applyFilters);
    }
    
    // Búsqueda en tiempo real
    if (searchInput) {
        searchInput.addEventListener('keyup', (e) => {
            if (e.key === 'Enter') {
                applyFilters();
            }
        });
    }
}

/**
 * Carga los reportes desde el servidor
 */
async function loadReports() {
    try {
        showLoading(true);
        
        // Llamar a la API para obtener los reportes
        const reports = await apiCall('list-reports');
        
        if (reports && Array.isArray(reports)) {
            allReports = reports.map(report => ({
                ...report,
                // Asegurar que las fechas estén formateadas correctamente
                created_at: formatDate(report.created_at),
                // Estado basado en la fecha de creación
                isNew: isNewReport(report.created_at)
            }));
            
            // Aplicar filtros por defecto
            applyFilters();
        } else {
            console.error('Formato de respuesta inesperado:', reports);
            showNoReports(true);
        }
    } catch (error) {
        console.error('Error al cargar reportes:', error);
        showError('Error al cargar los reportes. Intente de nuevo más tarde.');
    } finally {
        showLoading(false);
    }
}

/**
 * Aplica los filtros a la lista de reportes
 */
function applyFilters() {
    const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
    const selectedDate = dateFilter ? dateFilter.value : '';
    
    // Filtrar reportes
    filteredReports = allReports.filter(report => {
        // Filtrar por término de búsqueda (ID, descripción o cliente)
        const matchesSearch = !searchTerm || 
            (report.id && report.id.toString().includes(searchTerm)) ||
            (report.description && report.description.toLowerCase().includes(searchTerm)) ||
            (report.client_name && report.client_name.toLowerCase().includes(searchTerm));
        
        // Filtrar por fecha
        const matchesDate = !selectedDate || 
            (report.created_at && report.created_at.startsWith(selectedDate));
        
        return matchesSearch && matchesDate;
    });
    
    // Mostrar u ocultar mensaje de "no hay reportes"
    showNoReports(filteredReports.length === 0);
    
    // Renderizar los reportes filtrados
    renderReports(filteredReports);
}

/**
 * Renderiza la lista de reportes en el DOM
 * @param {Array} reports - Lista de reportes a renderizar
 */
function renderReports(reports) {
    if (!reportsContainer) return;
    
    // Limpiar contenedor
    reportsContainer.innerHTML = '';
    
    if (!reports || reports.length === 0) {
        showNoReports(true);
        return;
    }
    
    // Crear y agregar cada tarjeta de reporte
    reports.forEach(report => {
        const reportCard = createReportCard(report);
        reportsContainer.appendChild(reportCard);
    });
}

/**
 * Crea un elemento de tarjeta para un reporte
 * @param {Object} report - Datos del reporte
 * @returns {HTMLElement} - Elemento de tarjeta de reporte
 */
function createReportCard(report) {
    const col = document.createElement('div');
    col.className = 'col-12 col-md-6 col-lg-4';
    
    const card = document.createElement('div');
    card.className = 'card h-100 report-card';
    card.style.position = 'relative';
    
    // Marcar como nuevo si corresponde
    if (report.isNew) {
        const newBadge = document.createElement('span');
        newBadge.className = 'badge bg-success status-badge';
        newBadge.textContent = 'Nuevo';
        card.appendChild(newBadge);
    }
    
    // Cuerpo de la tarjeta
    const cardBody = document.createElement('div');
    cardBody.className = 'card-body';
    
    // Título del reporte
    const title = document.createElement('h5');
    title.className = 'card-title';
    title.textContent = `Reporte #${report.id}`;
    
    // Información del cliente
    const clientInfo = document.createElement('p');
    clientInfo.className = 'card-text text-muted mb-1';
    clientInfo.innerHTML = `<strong>Cliente:</strong> ${report.client_name || 'No especificado'}`;
    
    // Información del dispositivo
    const deviceInfo = document.createElement('p');
    deviceInfo.className = 'card-text text-muted mb-1';
    deviceInfo.innerHTML = `<strong>Dispositivo:</strong> ${report.device_description || 'No especificado'}`;
    
    // Defecto reportado (si está disponible)
    if (report.reception_defect) {
        const defectInfo = document.createElement('p');
        defectInfo.className = 'card-text text-muted mb-1';
        defectInfo.innerHTML = `<strong>Defecto:</strong> ${report.reception_defect}`;
        cardBody.appendChild(defectInfo);
    }
    
    // Estado de la recepción (si está disponible)
    if (report.reception_status) {
        const statusBadge = document.createElement('span');
        statusBadge.className = `badge bg-${getStatusColor(report.reception_status)} mb-2`;
        statusBadge.textContent = report.reception_status;
        cardBody.appendChild(statusBadge);
    }
    
    // Fecha de creación
    const dateInfo = document.createElement('p');
    dateInfo.className = 'card-text';
    const small = document.createElement('small');
    small.className = 'text-muted';
    small.innerHTML = `<i class="bi bi-calendar3"></i> ${report.created_at || 'Fecha no disponible'}`;
    dateInfo.appendChild(small);
    
    // Botón para ver detalles
    const button = document.createElement('a');
    button.href = `report.html?id=${report.id}`;
    button.className = 'btn btn-outline-primary btn-sm mt-2';
    button.textContent = 'Ver detalles';
    
    // Construir la tarjeta
    cardBody.appendChild(title);
    cardBody.appendChild(clientInfo);
    cardBody.appendChild(deviceInfo);
    cardBody.appendChild(dateInfo);
    cardBody.appendChild(button);
    
    card.appendChild(cardBody);
    col.appendChild(card);
    
    return col;
}

/**
 * Obtiene el color del badge según el estado
 * @param {string} status - Estado de la recepción
 * @returns {string} - Clase de color de Bootstrap
 */
function getStatusColor(status) {
    const statusColors = {
        'PENDIENTE': 'warning',
        'EN_PROCESO': 'info',
        'REPARADO': 'success',
        'ENTREGADO': 'secondary',
        'CANCELADO': 'danger'
    };
    return statusColors[status] || 'secondary';
}

/**
 * Muestra u oculta el indicador de carga
 * @param {boolean} show - Mostrar u ocultar
 */
function showLoading(show) {
    if (loadingElement) {
        loadingElement.style.display = show ? 'block' : 'none';
    }
}

/**
 * Muestra u oculta el mensaje de "no hay reportes"
 * @param {boolean} show - Mostrar u ocultar
 */
function showNoReports(show) {
    if (noReportsElement) {
        noReportsElement.classList.toggle('d-none', !show);
    }
}

/**
 * Muestra un mensaje de error
 * @param {string} message - Mensaje de error
 */
function showError(message) {
    // Crear elemento de alerta si no existe
    let alertElement = document.getElementById('error-alert');
    
    if (!alertElement) {
        alertElement = document.createElement('div');
        alertElement.id = 'error-alert';
        alertElement.className = 'alert alert-danger alert-dismissible fade show';
        alertElement.role = 'alert';
        
        const container = document.querySelector('.container-fluid');
        if (container) {
            container.insertBefore(alertElement, container.firstChild);
        }
    }
    
    // Actualizar mensaje y mostrar
    alertElement.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Cerrar"></button>
    `;
    
    // Ocultar después de 5 segundos
    setTimeout(() => {
        alertElement.classList.remove('show');
        setTimeout(() => {
            alertElement.remove();
        }, 150);
    }, 5000);
}

/**
 * Formatea una fecha a un formato legible
 * @param {string} dateString - Cadena de fecha a formatear
 * @returns {string} - Fecha formateada
 */
function formatDate(dateString) {
    if (!dateString) return 'Fecha no disponible';
    
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (error) {
        console.error('Error al formatear fecha:', error);
        return dateString; // Devolver el valor original si hay un error
    }
}

/**
 * Determina si un reporte es nuevo (menos de 24 horas)
 * @param {string} dateString - Fecha del reporte
 * @returns {boolean} - true si el reporte es nuevo
 */
function isNewReport(dateString) {
    if (!dateString) return false;
    
    try {
        const reportDate = new Date(dateString);
        const now = new Date();
        const diffInHours = (now - reportDate) / (1000 * 60 * 60);
        return diffInHours < 24; // Menos de 24 horas
    } catch (error) {
        console.error('Error al verificar fecha de reporte:', error);
        return false;
    }
}

/**
 * Realiza una llamada a la API
 * @param {string} endpoint - Endpoint de la API
 * @param {*} data - Datos a enviar
 * @returns {Promise<*>} - Respuesta de la API
 */
async function apiCall(endpoint, data = null) {
    try {
        // Verificar si estamos en un entorno Electron
        if (window.electron && window.electron.ipcRenderer) {
            // Usar IPC de Electron para la comunicación con el backend
            return await window.electron.ipcRenderer.invoke(`${API_PREFIX}:${endpoint}`, data);
        } else if (window.api && window.api.invoke) {
            // Alternativa para versiones anteriores de Electron
            return await window.api.invoke(`${API_PREFIX}:${endpoint}`, data);
        } else {
            // Para desarrollo sin Electron (usando fetch)
            const response = await fetch(`/api/${API_PREFIX}/${endpoint}`, {
                method: data ? 'POST' : 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: data ? JSON.stringify(data) : undefined,
            });
            
            if (!response.ok) {
                throw new Error(`Error en la petición: ${response.statusText}`);
            }
            
            return await response.json();
        }
    } catch (error) {
        console.error(`Error en la llamada a la API (${endpoint}):`, error);
        throw error;
    }
}
