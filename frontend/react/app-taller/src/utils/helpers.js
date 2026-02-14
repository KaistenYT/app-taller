// Genera timestamp ISO 8601 en hora LOCAL, no UTC.
// new Date().toISOString() usa UTC, lo que desplaza la fecha en zonas horarias negativas.
export function toLocalISOString(date = new Date()) {
  const d = date instanceof Date ? date : new Date(date);
  const pad = (n) => String(n).padStart(2, "0");
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
    `T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}` +
    `.${String(d.getMilliseconds()).padStart(3, "0")}`
  );
}

export function escapeHtml(str) {
  if (!str) return "";
  const map = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };
  return String(str).replace(/[&<>"']/g, (m) => map[m]);
}

export function formatDate(iso) {
  if (!iso) return "N/A";
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "N/A";
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return "N/A";
  }
}

export function formatDateTime(iso) {
  if (!iso) return "N/A";
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "N/A";
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, "0");
    const mins = String(d.getMinutes()).padStart(2, "0");
    return `${day}/${month}/${year} ${hours}:${mins}`;
  } catch {
    return "N/A";
  }
}

export function formatPhoneNumber(phone) {
  if (!phone) return "";
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 11) {
    return `${digits.slice(0, 4)}-${digits.slice(4, 7)}-${digits.slice(7)}`;
  }
  return phone;
}

export function debounce(fn, wait = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), wait);
  };
}

// Mapea errores técnicos del backend a mensajes amigables para el usuario
export function getFriendlyErrorMessage(err) {
  if (!err) return "Ha ocurrido un error inesperado.";
  const msg = (typeof err === "string" ? err : err.message || "").toLowerCase();

  if (
    msg.includes("api") ||
    msg.includes("electron") ||
    msg.includes("connect")
  ) {
    return "No se pudo conectar con el sistema interno. Contacte a soporte técnico.";
  }
  if (msg.includes("network") || msg.includes("failed to fetch")) {
    return "Error de red o comunicación. Verifique su conexión.";
  }

  if (
    msg.includes("credential") ||
    msg.includes("credenciales") ||
    msg.includes("password")
  ) {
    return "Usuario o contraseña incorrectos.";
  }
  if (
    msg.includes("usuario ya existe") ||
    msg.includes("username exists") ||
    msg.includes("unique")
  ) {
    return "El nombre de usuario ya está en uso. Intente con otro.";
  }
  if (msg.includes("user not found") || msg.includes("usuario no encontrado")) {
    return "El usuario no existe.";
  }

  return "Ocurrió un problema al procesar su solicitud. Por favor intente nuevamente.";
}
