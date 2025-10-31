// Kiosko Mode - Client Self-Service Display
window.addEventListener('DOMContentLoaded', () => {
  // Elements
  const searchInput = document.getElementById('search-input');
  const searchBtn = document.getElementById('search-btn');
  const statusFilter = document.getElementById('status-filter');
  const listAllBtn = document.getElementById('list-all-btn');
  const loading = document.getElementById('loading');
  const noResults = document.getElementById('no-results');
  const resultsGrid = document.getElementById('results-grid');
  const fullscreenBtn = document.getElementById('fullscreen-btn');
  const currentTime = document.getElementById('current-time');
  const currentDate = document.getElementById('current-date');
  const detailModal = new bootstrap.Modal(document.getElementById('detailModal'));
  const modalBody = document.getElementById('modal-body');

  let autoRefreshInterval = null;
  let lastSearchTerm = '';

  // Initialize
  init();

  function init() {
    updateClock();
    setInterval(updateClock, 1000);
    setupEventListeners();
    showWelcomeAnimation();
    checkAPIAvailability();
  }

  // List all receptions (respect status filter)
  async function listAll() {
    showLoading(true);
    hideResults();
    try {
      if (!window.api || typeof window.api.listReceptions !== 'function') {
        throw new Error('API no disponible.');
      }
      const statusValue = (statusFilter && statusFilter.value) || '';
      let receptions = await window.api.listReceptions();
      if (statusValue) {
        receptions = receptions.filter(r => (r.status || '').toUpperCase() === statusValue.toUpperCase());
      }
      // Optional: cap the number to avoid overload on kiosk
      const sorted = receptions.sort((a,b) => new Date(b.created_at) - new Date(a.created_at));
      displayResults(sorted);
      startAutoRefresh();
    } catch (error) {
      console.error('Error listing all:', error);
      showAlert('Error al listar recepciones', 'danger');
    } finally {
      showLoading(false);
    }
  }

  // Parse advanced query string supporting key:value terms
  function parseQuery(text) {
    const result = {
      raw: text,
      terms: [],
      by: {}
    };
    if (!text) return result;
    const tokens = text.split(/\s+/).filter(Boolean);
    for (const t of tokens) {
      const idx = t.indexOf(':');
      if (idx > 0) {
        const key = t.slice(0, idx).toLowerCase();
        const val = t.slice(idx + 1);
        if (val) result.by[key] = val;
      } else {
        result.terms.push(t);
      }
    }
    return result;
  }

  // Determine if a reception matches the query
  function matchesQuery(r, query) {
    if (!query || (!query.raw && !query.terms.length && !Object.keys(query.by).length)) return true;
    const t = (s) => (s || '').toString().toLowerCase();
    const haystack = [
      r.id?.toString() || '',
      r.client_name || '',
      r.client_idNumber || '',
      r.client_phone || '',
      r.device_description || '',
      r.defect || '',
      r.repair || '',
      r.device_serial || '',
      r.device_snapshot?.serial_number || '',
      r.device_snapshot?.description || ''
    ].map(t);

    // Free terms: all must be found somewhere
    if (query.terms.length) {
      const allTerms = query.terms.every(term => haystack.some(h => h.includes(term.toLowerCase())));
      if (!allTerms) return false;
    }

    // Keyed filters
    for (const [key, val] of Object.entries(query.by)) {
      const v = val.toLowerCase();
      switch (key) {
        case 'estado':
        case 'status':
          if (t(r.status) !== v) return false;
          break;
        case 'nombre':
        case 'cliente':
          if (!t(r.client_name).includes(v)) return false;
          break;
        case 'id':
          if (!r.id?.toString().includes(val)) return false;
          break;
        case 'serial':
          if (!(t(r.device_serial).includes(v) || t(r.device_snapshot?.serial_number).includes(v))) return false;
          break;
        case 'tel':
        case 'telefono':
          if (!t(r.client_phone).includes(v)) return false;
          break;
        case 'cedula':
        case 'rif':
          if (!t(r.client_idNumber).includes(v)) return false;
          break;
        case 'equipo':
          if (!(t(r.device_description).includes(v) || t(r.device_snapshot?.description).includes(v))) return false;
          break;
        default:
          // Unknown key => treat as generic term
          if (!haystack.some(h => h.includes(`${key}:${v}`))) {
            // ignore unknown key silently
          }
      }
    }
    return true;
  }

  // Check if API is available
  function checkAPIAvailability() {
    if (!window.api || typeof window.api.listReceptions !== 'function') {
      showAlert('⚠️ Modo de demostración: La API no está disponible. Abre esta página desde la aplicación Electron para funcionalidad completa.', 'warning');
      
      // Disable search if no API
      searchBtn.disabled = true;
      searchInput.disabled = true;
      searchInput.placeholder = 'API no disponible - Abre desde la aplicación principal';
    }
  }

  // Update clock
  function updateClock() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('es-VE', { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    });
    const dateString = now.toLocaleDateString('es-VE', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    
    if (currentTime) currentTime.textContent = timeString;
    if (currentDate) currentDate.textContent = dateString.charAt(0).toUpperCase() + dateString.slice(1);
  }

  // Setup event listeners
  function setupEventListeners() {
    searchBtn.addEventListener('click', handleSearch);
    searchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        handleSearch();
      }
    });

    if (statusFilter) {
      statusFilter.addEventListener('change', () => {
        // Permitir búsqueda solo por estado sin texto
        handleSearch();
      });
    }

    if (listAllBtn) {
      listAllBtn.addEventListener('click', listAll);
    }

    fullscreenBtn.addEventListener('click', toggleFullscreen);

    // Auto-clear search after inactivity
    let inactivityTimer;
    searchInput.addEventListener('input', () => {
      clearTimeout(inactivityTimer);
      inactivityTimer = setTimeout(() => {
        if (resultsGrid.style.display === 'none') {
          searchInput.value = '';
        }
      }, 300000); // 5 minutes
    });
  }

  // Welcome animation
  function showWelcomeAnimation() {
    searchInput.focus();
  }

  // Handle search
  async function handleSearch() {
    const searchTerm = (searchInput.value || '').trim();
    const statusValue = (statusFilter && statusFilter.value) || '';
    
    if (!searchTerm && !statusValue) {
      showAlert('Ingresa un término o selecciona un estado', 'warning');
      return;
    }

    lastSearchTerm = searchTerm;
    showLoading(true);
    hideResults();

    try {
      // Check if API is available
      if (!window.api || typeof window.api.listReceptions !== 'function') {
        throw new Error('API no disponible. Por favor abre esta página desde la aplicación principal.');
      }

      // Search in receptions
      let receptions = await window.api.listReceptions();
      
      // Optional status pre-filter
      if (statusValue) {
        receptions = receptions.filter(r => (r.status || '').toUpperCase() === statusValue.toUpperCase());
      }

      const query = parseQuery(searchTerm);

      // Filter by parsed query and free text
      const filtered = receptions
        .filter(r => matchesQuery(r, query))
        .sort((a,b) => new Date(b.created_at) - new Date(a.created_at));

      showLoading(false);

      if (filtered.length === 0) {
        showNoResults();
      } else {
        displayResults(filtered);
        startAutoRefresh();
      }
    } catch (error) {
      console.error('Error searching:', error);
      showLoading(false);
      showAlert('Error al buscar. Por favor intenta nuevamente.', 'danger');
    }
  }

  // Display results
  function displayResults(receptions) {
    resultsGrid.innerHTML = '';
    resultsGrid.style.display = 'flex';
    noResults.style.display = 'none';

    receptions.forEach((reception, index) => {
      const card = createReceptionCard(reception, index);
      resultsGrid.appendChild(card);
    });
  }

  // Create reception card
  function createReceptionCard(reception, index) {
    const col = document.createElement('div');
    col.className = 'col-lg-6 col-xl-4';
    col.style.animationDelay = `${index * 0.1}s`;

    const statusClass = `status-${reception.status || 'PENDIENTE'}`;
    const statusIcon = getStatusIcon(reception.status);
    const statusText = reception.status || 'PENDIENTE';

    const deviceDesc = reception.device_snapshot?.description || 
                       reception.device_description || 
                       'Equipo no especificado';
    const serial = reception.device_snapshot?.serial_number || 
                   reception.device_serial || 
                   'N/A';
    const clientName = reception.client_name || 'Cliente';
    const createdDate = new Date(reception.created_at).toLocaleDateString('es-VE', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });

    col.innerHTML = `
      <div class="card reception-card">
        <div class="card-header text-white">
          <div class="d-flex justify-content-between align-items-center">
            <div>
              <small class="opacity-75">Recepción</small>
              <div class="reception-id">#${reception.id}</div>
            </div>
            <div>
              <i class="bi bi-calendar3 fs-4"></i>
            </div>
          </div>
        </div>
        <div class="card-body">
          <div class="text-center mb-4">
            <span class="status-badge ${statusClass}">
              <i class="bi ${statusIcon} me-2"></i>${statusText}
            </span>
          </div>

          <div class="info-row">
            <div class="info-label">
              <i class="bi bi-person me-2"></i>Cliente
            </div>
            <div class="info-value">${escapeHtml(clientName)}</div>
          </div>

          <div class="info-row">
            <div class="info-label">
              <i class="bi bi-laptop me-2"></i>Equipo
            </div>
            <div class="info-value">${escapeHtml(deviceDesc)}</div>
          </div>

          <div class="info-row">
            <div class="info-label">
              <i class="bi bi-upc-scan me-2"></i>Serie
            </div>
            <div class="info-value">${escapeHtml(serial)}</div>
          </div>

          <div class="info-row">
            <div class="info-label">
              <i class="bi bi-calendar-check me-2"></i>Ingreso
            </div>
            <div class="info-value">${createdDate}</div>
          </div>

          ${reception.status === 'REPARADO' ? `
          <div class="alert alert-success mt-3 mb-0">
            <i class="bi bi-check-circle-fill me-2"></i>
            <strong>¡Tu equipo está listo!</strong> Puedes pasar a retirarlo.
          </div>
          ` : ''}

          <div class="text-center mt-4">
            <button class="btn detail-btn w-100" onclick="window.kiosko.showDetail(${reception.id})">
              <i class="bi bi-eye me-2"></i>Ver Detalles
            </button>
          </div>
        </div>
      </div>
    `;

    return col;
  }

  // Show detail modal
  async function showDetail(receptionId) {
    try {
      // Check if API is available
      if (!window.api || typeof window.api.getReception !== 'function') {
        showAlert('API no disponible', 'danger');
        return;
      }

      const reception = await window.api.getReception(receptionId);
      
      if (!reception) {
        showAlert('No se pudo cargar la información', 'danger');
        return;
      }

      const statusClass = `status-${reception.status || 'PENDIENTE'}`;
      const statusIcon = getStatusIcon(reception.status);
      const deviceDesc = reception.device_snapshot?.description || 'N/A';
      const serial = reception.device_snapshot?.serial_number || 'N/A';
      const features = reception.device_snapshot?.features || 'No especificadas';
      const defect = reception.defect || 'No especificado';
      const repair = reception.repair || 'Pendiente de diagnóstico';
      const createdDate = new Date(reception.created_at).toLocaleString('es-VE');

      modalBody.innerHTML = `
        <div class="text-center mb-4">
          <h2 class="text-primary mb-3">Recepción #${reception.id}</h2>
          <span class="status-badge ${statusClass}">
            <i class="bi ${statusIcon} me-2"></i>${reception.status || 'PENDIENTE'}
          </span>
        </div>

        <div class="row g-3">
          <div class="col-md-6">
            <div class="card bg-secondary">
              <div class="card-body">
                <h6 class="text-white-50 mb-2">
                  <i class="bi bi-laptop me-2"></i>Equipo
                </h6>
                <p class="text-white mb-0 fs-5">${escapeHtml(deviceDesc)}</p>
              </div>
            </div>
          </div>
          <div class="col-md-6">
            <div class="card bg-secondary">
              <div class="card-body">
                <h6 class="text-white-50 mb-2">
                  <i class="bi bi-upc-scan me-2"></i>Serie
                </h6>
                <p class="text-white mb-0 fs-5">${escapeHtml(serial)}</p>
              </div>
            </div>
          </div>
          <div class="col-12">
            <div class="card bg-secondary">
              <div class="card-body">
                <h6 class="text-white-50 mb-2">
                  <i class="bi bi-list-ul me-2"></i>Características
                </h6>
                <p class="text-white mb-0">${escapeHtml(features)}</p>
              </div>
            </div>
          </div>
          <div class="col-12">
            <div class="card bg-warning text-dark">
              <div class="card-body">
                <h6 class="mb-2">
                  <i class="bi bi-exclamation-triangle me-2"></i>Falla Reportada
                </h6>
                <p class="mb-0 fs-5">${escapeHtml(defect)}</p>
              </div>
            </div>
          </div>
          ${reception.repair ? `
          <div class="col-12">
            <div class="card bg-info text-white">
              <div class="card-body">
                <h6 class="mb-2">
                  <i class="bi bi-tools me-2"></i>Diagnóstico/Reparación
                </h6>
                <p class="mb-0 fs-5">${escapeHtml(repair)}</p>
              </div>
            </div>
          </div>
          ` : ''}
          <div class="col-12">
            <div class="card bg-secondary">
              <div class="card-body">
                <h6 class="text-white-50 mb-2">
                  <i class="bi bi-calendar3 me-2"></i>Fecha de Ingreso
                </h6>
                <p class="text-white mb-0">${createdDate}</p>
              </div>
            </div>
          </div>
        </div>
      `;

      detailModal.show();
    } catch (error) {
      console.error('Error loading detail:', error);
      showAlert('Error al cargar los detalles', 'danger');
    }
  }

  // Get status icon
  function getStatusIcon(status) {
    const icons = {
      'PENDIENTE': 'bi-clock-history',
      'EN_PROCESO': 'bi-tools',
      'REPARADO': 'bi-check-circle-fill',
      'ENTREGADO': 'bi-box-arrow-right',
      'CANCELADO': 'bi-x-circle'
    };
    return icons[status] || 'bi-question-circle';
  }

  // Show/hide loading
  function showLoading(show) {
    loading.style.display = show ? 'block' : 'none';
  }

  // Show no results
  function showNoResults() {
    noResults.style.display = 'block';
    resultsGrid.style.display = 'none';
  }

  // Hide results
  function hideResults() {
    resultsGrid.style.display = 'none';
    noResults.style.display = 'none';
  }

  // Auto-refresh results
  function startAutoRefresh() {
    stopAutoRefresh();
    
    // Show indicator
    const indicator = document.createElement('div');
    indicator.className = 'auto-refresh-indicator';
    indicator.innerHTML = '<i class="bi bi-arrow-clockwise me-2"></i>Actualización automática activa';
    document.body.appendChild(indicator);

    // Refresh every 30 seconds
    autoRefreshInterval = setInterval(() => {
      if (lastSearchTerm) {
        handleSearch();
      }
    }, 30000);
  }

  function stopAutoRefresh() {
    if (autoRefreshInterval) {
      clearInterval(autoRefreshInterval);
      autoRefreshInterval = null;
    }
    const indicator = document.querySelector('.auto-refresh-indicator');
    if (indicator) indicator.remove();
  }

  // Toggle fullscreen
  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.error('Error entering fullscreen:', err);
      });
      fullscreenBtn.innerHTML = '<i class="bi bi-fullscreen-exit"></i>';
    } else {
      document.exitFullscreen();
      fullscreenBtn.innerHTML = '<i class="bi bi-arrows-fullscreen"></i>';
    }
  }

  // Show alert
  function showAlert(message, type = 'info') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show position-fixed top-0 start-50 translate-middle-x mt-3`;
    alertDiv.style.zIndex = '9999';
    alertDiv.innerHTML = `
      ${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    document.body.appendChild(alertDiv);

    setTimeout(() => {
      alertDiv.remove();
    }, 5000);
  }

  // Escape HTML
  function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // Expose functions globally
  window.kiosko = {
    showDetail,
    handleSearch
  };

  // Handle visibility change (pause auto-refresh when tab is hidden)
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      stopAutoRefresh();
    } else if (lastSearchTerm) {
      startAutoRefresh();
    }
  });
});
