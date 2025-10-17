// index.js
let receptions = [];

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

function mostrarRecepciones() {
  const tbody = document.getElementById("recepciones-body");
  tbody.innerHTML = "";

  receptions.forEach((r) => {
    const fila = document.createElement("tr");
    fila.innerHTML = `
      <td>${r.id}</td>
      <td>${r.cliente}</td>
      <td>${r.equipo}</td>
      <td>${r.status}</td>
      <td>${r.defect}</td>
      <td>${new Date(r.created_at).toLocaleDateString()}</td>
      <td><button class="btn btn-sm btn-primary" onclick="verDetalle(${
        r.id
      })">Ver</button></td>
    `;
    tbody.appendChild(fila);
  });
}

window.verDetalle = function (id) {
  window.location.href = `detalle.html?id=${id}`;
};

function crearRecepcion() {
  window.location.href = "";
}

async function crearDatosPrueba() {
  try {
    await window.api.createClient({
      idNumber: "V123456789",
      name: "Carlos Perez",
      phone: "04123456789",
    });
    await window.api.createClient({
      idNumber: "V24687592",
      name: "Luis Rodriguez",
      phone: "0417852369875",
    });
    await window.api.createClient({
      idNumber: "V9876543210",
      name: "Ana Perez",
      phone: "04123454785",
    });
    await window.api.createDevice({
      description: "Laptop HP",
      features: "Core i5, 8GB RAM",
    });
     await window.api.createDevice({
      description: "Laptop Dell",
      features: "Core i5 8va Gen, 16GB RAM",
    });
     await window.api.createDevice({
      description: "Laptop Lenovo",
      features: "Core i9 10ma, 32GB RAM",
    });

     await window.api.createReception({
      client_idNumber: "V123456789",
      device_id: 1,
      defect: "No enciende",
      status: "PENDIENTE"
      
    });
     await window.api.createReception({
      client_idNumber: "V9876543210",
      device_id: 2,
      defect: "No enciende",
      status: "DEVUELTO"
      
    });

     await window.api.createReception({
      client_idNumber:"V24687592" ,
      device_id: 2,
      defect: "No enciende",
      status: "GARANTIA"
      
    });



    console.log("DATOS CREADOS CORRECTAMENTE");
  } catch (error) {
    console.error("Error al crear datos de prueba:", error);
  }
}

document.addEventListener("DOMContentLoaded", crearDatosPrueba())
