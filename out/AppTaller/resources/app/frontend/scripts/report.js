window.addEventListener("DOMContentLoaded", () => {
  (async () => {
    const params = new URLSearchParams(window.location.search);
    const reportId = params.get("id");
    const container = document.getElementById("report-content");

    if (!reportId) {
      container.innerHTML = "<p class='text-danger'>No report ID provided.</p>";
      return;
    }

    const report = await window.api.getReport(Number(reportId));
    if (!report) {
      container.innerHTML = "<p class='text-warning'>Report not found.</p>";
      return;
    }

    container.innerHTML = `
      <div class="report">
        <h4>📄 Reporte de Recepción</h4>
        ${report.description}
      </div>
    `;
  })();
});
