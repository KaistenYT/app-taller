window.addEventListener('DOMContentLoaded', () => {
  const fSearch = document.getElementById('f-search');
  const fAction = document.getElementById('f-action');
  const fFrom = document.getElementById('f-from');
  const pageSizeSelect = document.getElementById('page-size');
  const btnFilter = document.getElementById('btn-filter');
  const btnClear = document.getElementById('btn-clear');
  const tbody = document.getElementById('history-body');
  const alertArea = document.getElementById('alert-area');
  const prevBtn = document.getElementById('prev-page');
  const nextBtn = document.getElementById('next-page');
  const pagingInfo = document.getElementById('paging-info');

  let page = 0;
  let pageSize = 50;

  function showAlert(type, msg, timeout = 5000) {
    if (!alertArea) return;
    alertArea.innerHTML = `<div class="alert alert-${type}" role="alert">${msg}</div>`;
    if (timeout) setTimeout(() => { alertArea.innerHTML = ''; }, timeout);
  }

  async function loadPage() {
    const filters = {};
    const free = fSearch?.value?.trim();
    if (free) filters.free = free;
    if (fAction.value) filters.action = fAction.value || undefined;
    if (fFrom.value) filters.from = fFrom.value;

  filters.limit = pageSize;
    filters.offset = page * pageSize;

    try {
      const rows = await window.api.listReceptionHistory(filters);
      tbody.innerHTML = '';
      if (!rows || rows.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="text-center text-muted small py-4">No hay registros</td></tr>';
      } else {
        for (const r of rows) {
          const tr = document.createElement('tr');
          // format small cells and badges
          const client = r.client_name ? `${r.client_name} (${r.client_id})` : r.client_id || '';
          const device = r.device_description || r.device_serial || r.device_id || '';
          const statusBadge = `<span class="badge bg-secondary badge-status">${escapeHtml(r.status || '')}</span>`;
          const actionBadge = `<span class="badge ${r.action === 'ARCHIVED' ? 'bg-warning text-dark' : r.action === 'DELETED' ? 'bg-danger' : 'bg-info'}">${escapeHtml(r.action || '')}</span>`;

          tr.innerHTML = `
            <td class="small align-middle">${r.id}</td>
            <td class="small align-middle">${r.reception_id || ''}</td>
            <td class="small align-middle">${escapeHtml(client)}</td>
            <td class="small align-middle">${escapeHtml(device)}</td>
            <td class="small align-middle">${statusBadge}</td>
            <td class="small align-middle">${actionBadge}</td>
            <td class="small align-middle">${formatDate(r.reception_date)}</td>
            <td class="small align-middle">${formatDateTime(r.event_timestamp)}</td>
          `;
          tbody.appendChild(tr);
        }
      }

      const total = await window.api.countReceptionHistory(filters);
      const start = page * pageSize + 1;
      const end = Math.min((page + 1) * pageSize, total || 0);
      pagingInfo.textContent = `Mostrando ${start}-${end} de ${total || 0}`;
      prevBtn.disabled = page === 0;
      nextBtn.disabled = end >= (total || 0);
    } catch (err) {
      console.error('load history error', err);
      showAlert('danger', 'Error al cargar historial');
    }
  }

  function downloadCSV(rows) {
    if (!rows || rows.length === 0) return showAlert('info', 'No hay datos para exportar');
    const headers = ['id','reception_id','client_id','client_name','device_id','device_description','reception_date','status','action','event_timestamp'];
    const csv = [headers.join(',')];
    for (const r of rows) {
      const line = headers.map(h => {
        let v = r[h] == null ? '' : String(r[h]);
        // escape quotes
        v = '"' + v.replace(/"/g, '""') + '"';
        return v;
      }).join(',');
      csv.push(line);
    }
    const blob = new Blob([csv.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reception_history_${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  async function exportCurrentPage() {
    // re-request the current page without limiting transform (we already have rows but safer to request)
    const filters = {};
    const free = fSearch?.value?.trim();
    if (free) filters.free = free;
    if (fAction.value) filters.action = fAction.value || undefined;
    if (fFrom.value) filters.from = fFrom.value;
    filters.limit = pageSize;
    filters.offset = page * pageSize;
    try {
      const rows = await window.api.listReceptionHistory(filters);
      downloadCSV(rows);
    } catch (err) {
      console.error('export error', err);
      showAlert('danger','Error al exportar CSV');
    }
  }

  function printView() {
    window.print();
  }

  // helpers
  function pad(n){ return n<10 ? '0'+n : n; }
  function formatDate(iso){ if(!iso) return ''; const d=new Date(iso); return `${pad(d.getDate())}/${pad(d.getMonth()+1)}/${d.getFullYear()}` }
  function formatDateTime(iso){ if(!iso) return ''; const d=new Date(iso); return `${pad(d.getDate())}/${pad(d.getMonth()+1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}` }
  function escapeHtml(s){ if(s==null) return ''; return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

  btnFilter.addEventListener('click', () => {
    page = 0;
    loadPage();
  });

  document.getElementById('btn-export')?.addEventListener('click', exportCurrentPage);
  document.getElementById('btn-print')?.addEventListener('click', printView);

  prevBtn.addEventListener('click', () => {
    if (page > 0) page--;
    loadPage();
  });
  nextBtn.addEventListener('click', () => {
    page++;
    loadPage();
  });

  // page size change
  pageSizeSelect?.addEventListener('change', (e) => {
    pageSize = Number(e.target.value) || 50;
    page = 0;
    loadPage();
  });

  btnClear?.addEventListener('click', () => {
    if (fSearch) fSearch.value = '';
    if (fAction) fAction.value = '';
    if (fFrom) fFrom.value = '';
    if (pageSizeSelect) pageSizeSelect.value = '50';
    pageSize = 50;
    page = 0;
    loadPage();
  });

  // initial load
  loadPage();
});
