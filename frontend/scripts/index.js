// index.js
let receptions = [];

document.getElementById("filtroGeneral").addEventListener("input", aplicarFiltros);
document.getElementById("filtroFecha").addEventListener("input", aplicarFiltros);
document.getElementById("ordenFecha").addEventListener("change", aplicarFiltros);

document.addEventListener("DOMContentLoaded", async () => {
  await cargarRecepciones();
});

async function cargarRecepciones() {
  try {
    if (window.api && window.api.listReceptions) {
      receptions = await window.api.listReceptions();
      mostrarRecepciones();
    } else {
      mostrarError("API NO DISPONIBLE");
    }
  } catch (error) {
    mostrarError("API NO DISPONIBLE");
    console.error(error);
  }
}



function mostrarRecepciones(lista = receptions) {
  const tbody = document.getElementById("recepciones-body");
  tbody.innerHTML = "";

  lista.forEach((r) => {
    const fila = document.createElement("tr");
    fila.innerHTML = `
      <td>${r.cliente}</td>
      <td>${r.equipo}</td>
      <td>${r.status}</td>
      <td>${r.defect}</td>
      <td>${new Date(r.created_at).toLocaleDateString()}</td>
      <td><button class="btn btn-sm btn-primary" onclick="verDetalle(${r.id})">Ver</button></td>
    `;
    tbody.appendChild(fila);
  });
}




function aplicarFiltros() {
  console.log("Aplicando filtros...");
 const texto = document.getElementById("filtroGeneral").value.toLowerCase();
  const fecha = document.getElementById("filtroFecha").value;
  const orden = document.getElementById("ordenFecha").value;

  let filtradas = receptions.filter((r) => {
    const coincideTexto =
      r.cliente.toLowerCase().includes(texto) ||
      r.equipo.toLowerCase().includes(texto);

    const coincideFecha = fecha
      ? new Date(r.created_at).toISOString().slice(0, 10) === fecha
      : true;

    return coincideTexto && coincideFecha;
  });

  filtradas.sort((a, b) => {
    const fechaA = new Date(a.created_at);
    const fechaB = new Date(b.created_at);
    return orden === "asc" ? fechaA - fechaB : fechaB - fechaA;
  });

  mostrarRecepciones(filtradas);
}




window.verDetalle = function (id) {
  window.location.href = `detalle.html?id=${id}`;
};

function crearRecepcion() {
  window.location.href = "addReceptionForm.html";
}


// <td>${r.id}</td>

 