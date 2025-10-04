//device caller functions


document.addEventListener("DOMContentLoaded", async () => {
  const devices = await window.api.listDevices();
  console.log("Todos los dispositivos:", devices);
});
