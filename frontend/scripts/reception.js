function regresar() {
  console.log("Regresando al index...");
  window.location.href = "index.html";
}

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("reception-form");
  const mensaje = document.getElementById("mensaje");

  // Autocompletar cliente si existe
  document.getElementById("client_idNumber").addEventListener("input", async (e) => {
    const idNumber = e.target.value.trim();
    if (idNumber.length >= 7) {
      try {
        console.log("Buscando cliente con cédula:", idNumber);
        const cliente = await window.api.getClient(idNumber);
        if (cliente) {
          console.log("Cliente encontrado:", cliente);
          document.getElementById("client_name").value = cliente.name;
          document.getElementById("client_phone").value = cliente.phone;
          document.getElementById("client_name").disabled = true;
          document.getElementById("client_phone").disabled = true;
        } else {
          console.log("Cliente no encontrado. Campos habilitados.");
          document.getElementById("client_name").value = "";
          document.getElementById("client_phone").value = "";
          document.getElementById("client_name").disabled = false;
          document.getElementById("client_phone").disabled = false;
        }
      } catch (error) {
        console.error("Error al buscar cliente:", error);
      }
    }
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    console.log("Formulario enviado. Preparando datos...");

    const clientData = {
      idNumber: document.getElementById("client_idNumber").value.trim(),
      name: document.getElementById("client_name").value.trim(),
      phone: document.getElementById("client_phone").value.trim(),
    };
    console.log("Datos del cliente:", clientData);

    const deviceData = {
      description: document.getElementById("device_description").value.trim(),
      features: document.getElementById("device_features").value.trim(),
    };
    console.log("Datos del equipo:", deviceData);

    const receptionData = {
      defect: document.getElementById("defect").value.trim(),
      status: document.getElementById("status").value.trim(),
      repair: document.getElementById("repair").value.trim(),
    };
    console.log("Datos de la recepción:", receptionData);

    try {
      // Verificar o crear cliente
      let cliente = await window.api.getClient(clientData.idNumber);
      if (!cliente) {
        console.log("Cliente no existe. Creando...");
        cliente = await window.api.createClient(clientData);
      }
      console.log("Cliente confirmado:", cliente);

      // Crear equipo
      const equipo = await window.api.createDevice(deviceData);
      console.log("Equipo creado:", equipo);

      // Validar que equipo tenga ID
      const device_id = equipo?.id || equipo?.[0]?.id;
      if (!device_id) throw new Error("No se pudo obtener el ID del equipo");

      // Crear recepción
      const finalReception = {
        client_idNumber: cliente.idNumber,
        device_id,
        ...receptionData,
      };
      console.log("Datos finales para recepción:", finalReception);

      const result = await window.api.createReception(finalReception);
      console.log("Recepción creada:", result);

      mensaje.innerHTML = `<div class="alert alert-success">Recepción creada con éxito (ID: ${result.id || result[0]?.id})</div>`;
      form.reset();
      document.getElementById("client_name").disabled = false;
      document.getElementById("client_phone").disabled = false;
    } catch (error) {
      console.error("❌ Error al crear recepción:", error);
      mensaje.innerHTML = `<div class="alert alert-danger">Error al crear recepción</div>`;
    }
  });
});
