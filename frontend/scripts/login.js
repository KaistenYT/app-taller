/**
 * Muestra una notificación temporal en un área de alerta específica del DOM.
 * @param {string} message - El mensaje a mostrar en la notificación.
 * @param {string} [type="success"] - El tipo de notificación (ej. "success", "danger", "warning", "info") para estilos CSS.
 * @param {string} [targetElementId="forgot-password-alert-area"] - El ID del elemento HTML donde se mostrará la notificación.
 */
function showNotification(
  message,
  type = "success",
  targetElementId = "forgot-password-alert-area",
) {
  const alertArea = document.getElementById(targetElementId);
  if (!alertArea) return;

  const iconClass =
    type === "success" ? "bi-check-circle" : "bi-exclamation-triangle";
  alertArea.innerHTML = `
    <div class="alert alert-${type} alert-dismissible fade show" role="alert">
      <i class="bi ${iconClass} me-2"></i>
      ${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    </div>
  `;

  setTimeout(() => {
    if (alertArea) alertArea.innerHTML = "";
  }, 5000); // La notificación desaparece después de 5 segundos
}

window.addEventListener("DOMContentLoaded", () => {
  // Referencias a elementos del DOM
  const form = document.getElementById("login-form");
  const inputUser = document.getElementById("username");
  const inputPass = document.getElementById("password");
  const btn = document.getElementById("btn-login");
  const alertArea = document.getElementById("alert-area"); // Área de alerta para el formulario de login

  // --- Manejo de Sesión ---
  try {
    let sessionRaw = null;
    let sessionSource = null; // Indica si la sesión viene de sessionStorage o localStorage
    try {
      sessionRaw = sessionStorage.getItem("app_user");
      sessionSource = "sessionStorage";
    } catch (e) {
      sessionRaw = null; // Error al acceder a sessionStorage
    }
    if (!sessionRaw) {
      try {
        sessionRaw = localStorage.getItem("app_user");
        sessionSource = "localStorage";
      } catch (e) {
        sessionRaw = null; // Error al acceder a localStorage
      }
    }
    if (sessionRaw) {
      try {
        const sess = JSON.parse(sessionRaw);
        if (sess && sess.id) { // Si hay una sesión válida
          if (sess.expires && Number(sess.expires)) {
            const exp = Number(sess.expires);
            if (Date.now() <= exp) { // Si la sesión no ha expirado
              window.location.href = "index.html"; // Redirige a la página principal
              return;
            } else { // Sesión expirada
              try {
                localStorage.removeItem("app_user"); // Limpia la sesión expirada
              } catch (e) {}
            }
          } else { // Sesión sin expiración definida (ej. de sessionStorage)
            window.location.href = "index.html"; // Redirige a la página principal
            return;
          }
        }
      } catch (e) {} // Error al parsear la sesión
    }
  } catch (e) {
    throw e; // Error crítico en el manejo de sesión
  }

  /**
   * Muestra una alerta temporal en el área de alerta del formulario de login.
   * @param {string} type - Tipo de alerta (ej. "danger", "warning", "success").
   * @param {string} message - Mensaje a mostrar.
   * @param {number} [timeout=4000] - Duración de la alerta en milisegundos.
   */
  function showAlert(type, message, timeout = 4000) {
    if (!alertArea) return;
    alertArea.innerHTML = `<div class="alert alert-${type} alert-sm" role="alert">${message}</div>`;
    if (timeout > 0)
      setTimeout(() => {
        if (alertArea) alertArea.innerHTML = "";
      }, timeout);
  }

  /**
   * Intenta iniciar sesión llamando a la API de Electron.
   * @param {string} username - Nombre de usuario.
   * @param {string} password - Contraseña.
   * @returns {Promise<Object>} Promesa que resuelve con los datos del usuario si el login es exitoso.
   */
  async function attemptLogin(username, password) {
    try {
      if (window.api && typeof window.api.loginUser === "function") {
        // Usa directamente loginUser si está expuesto
        return await window.api.loginUser(username, password);
      }
      if (window.api && typeof window.api.invoke === "function") {
        // Usa el método genérico invoke si loginUser no está directamente expuesto
        return await window.api.invoke("login-user", username, password);
      }
      throw new Error("API de Electron no disponible");
    } catch (err) {
      throw err; // Propaga el error de login
    }
  }

  // --- Manejo del Formulario de Login ---
  if (!form) return;
  form.addEventListener("submit", async (e) => {
    e.preventDefault(); // Previene el envío del formulario por defecto
    const username = inputUser.value && inputUser.value.trim();
    const password = inputPass.value;
    const remember = document.getElementById("remember-me")?.checked; // Opción "Recordarme"

    if (!username || !password) {
      showAlert("danger", "Usuario y contraseña requeridos", 3500);
      return;
    }

    try {
      btn.disabled = true; // Deshabilita el botón de login
      btn.textContent = "Entrando..."; // Cambia el texto del botón
      const res = await attemptLogin(username, password); // Intenta iniciar sesión

      if (res && res.id) { // Si el login es exitoso
        try {
          const sessionObj = { ...res };
          if (remember) { // Si se selecciona "Recordarme"
            const expires = Date.now() + 30 * 24 * 60 * 60 * 1000; // Expira en 30 días
            sessionObj.expires = expires;
            localStorage.setItem("app_user", JSON.stringify(sessionObj)); // Guarda en localStorage
            try { sessionStorage.removeItem("app_user"); } catch (e) {} // Elimina de sessionStorage
          } else { // Si no se selecciona "Recordarme"
            sessionStorage.setItem("app_user", JSON.stringify(sessionObj)); // Guarda en sessionStorage (sesión de navegador)
            try { localStorage.removeItem("app_user"); } catch (e) {} // Elimina de localStorage
          }
        } catch (e) {
          throw e; // Error en el almacenamiento de la sesión
        }

        window.location.href = "index.html"; // Redirige a la página principal
        return;
      }
      showAlert("warning", "Credenciales inválidas", 4000); // Muestra alerta de credenciales inválidas
    } catch (err) {
      let userMessage =
        "Ocurrió un problema al intentar iniciar sesión. Por favor, verifica tus credenciales.";
      if (err?.message?.includes("API de Electron no disponible")) {
        userMessage =
          "La aplicación no pudo conectarse con el sistema interno. Contacta al soporte técnico.";
      }
      try {
        showAlert("danger", userMessage, 5000); // Muestra mensaje de error al usuario
      } catch (e) {
        console.error(e);
      }
    } finally {
      btn.disabled = false; // Habilita el botón de login
      btn.textContent = "Entrar"; // Restaura el texto del botón
    }
  });

  // --- Lógica de Recuperación de Contraseña ---
  const forgotPasswordLink = document.getElementById("forgot-password-link");
  const forgotPasswordModalEl = document.getElementById("forgotPasswordModal");
  const forgotPasswordModal = forgotPasswordModalEl
    ? new bootstrap.Modal(forgotPasswordModalEl)
    : null;
  const fpForm = document.getElementById("forgot-password-form");
  const fpUsernameInput = document.getElementById("fp-username");
  const fpNewPasswordInput = document.getElementById("fp-new-password");
  const fpConfirmPasswordInput = document.getElementById("fp-confirm-password");
  const fpSubmitBtn = document.getElementById("fp-submit-btn");

  // Abre el modal de recuperación de contraseña
  if (forgotPasswordLink) {
    forgotPasswordLink.addEventListener("click", (e) => {
      e.preventDefault();
      document.getElementById("forgot-password-alert-area").innerHTML = ""; // Limpia alertas previas
      fpForm.reset(); // Reinicia el formulario
      forgotPasswordModal.show(); // Muestra el modal
    });
  }

  // Envío del formulario de recuperación de contraseña
  if (fpForm) {
    fpForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const username = fpUsernameInput.value.trim();
      const newPassword = fpNewPasswordInput.value;
      const confirmPassword = fpConfirmPasswordInput.value;

      document.getElementById("forgot-password-alert-area").innerHTML = ""; // Limpia alertas

      if (!username) {
        showNotification(
          "Por favor, introduce tu nombre de usuario.",
          "danger",
        );
        return;
      }
      if (newPassword.length < 4) {
        showNotification(
          "La nueva contraseña debe tener al menos 4 caracteres.",
          "danger",
        );
        return;
      }
      if (newPassword !== confirmPassword) {
        showNotification("Las contraseñas no coinciden.", "danger");
        return;
      }

      fpSubmitBtn.disabled = true; // Deshabilita el botón
      fpSubmitBtn.textContent = "Restableciendo..."; // Cambia el texto

      try {
        if (window.api && typeof window.api.invoke === "function") {
          // Llama a la API para restablecer la contraseña
          const result = await window.api.invoke("reset-user-password", {
            username,
            newPassword,
          });

          if (result && result.success) { // Contraseña restablecida con éxito
            showNotification(
              "Contraseña restablecida exitosamente. Ahora puedes iniciar sesión con tu nueva contraseña.",
              "success",
            );
            setTimeout(() => {
              forgotPasswordModal.hide(); // Cierra el modal
              inputUser.value = username; // Pre-rellena el campo de usuario
              inputPass.value = ""; // Limpia el campo de contraseña
            }, 2000);
          } else { // Fallo al restablecer la contraseña
            showNotification(
              result.message ||
                "Error al restablecer la contraseña. Usuario no encontrado o error interno.",
              "danger",
            );
          }
        } else { // API no disponible
          showNotification(
            "Funcionalidad de recuperación no disponible en este entorno.",
            "danger",
          );
        }
      } catch (error) {
        console.error(
          "Error durante el restablecimiento de contraseña:",
          error,
        );
        showNotification(
          error.message || "Error interno al restablecer la contraseña.",
          "danger",
        );
      } finally {
        fpSubmitBtn.disabled = false; // Habilita el botón
        fpSubmitBtn.textContent = "Restablecer Contraseña"; // Restaura el texto
      }
    });
  }

  // --- Lógica para mostrar/ocultar contraseña ---
  const toggle = document.getElementById("toggle-pass"); // Botón para alternar visibilidad de contraseña
  const eyeSvg =
    '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z"></path><circle cx="12" cy="12" r="3"></circle></svg>';
  const eyeOffSvg =
    '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17.94 17.94A10.94 10.94 0 0112 20c-7 0-11-8-11-8a21.56 21.56 0 015.06-6.39"></path><path d="M1 1l22 22"></path></svg>';
  if (toggle) {
    toggle.addEventListener("click", () => {
      const p = inputPass;
      if (!p) return;
      if (p.type === "password") {
        p.type = "text"; // Muestra la contraseña
        toggle.innerHTML = eyeOffSvg; // Cambia el icono a "ojo tachado"
      } else {
        p.type = "password"; // Oculta la contraseña
        toggle.innerHTML = eyeSvg; // Cambia el icono a "ojo"
      }
    });

    toggle.innerHTML = eyeSvg; // Establece el icono inicial como "ojo"
  }

  // --- Manejo de Parámetros de URL ---
  try {
    const params = new URLSearchParams(window.location.search);
    if (params.get("registered") === "1")
      showAlert("success", "Registro completado. Ahora inicia sesión."); // Muestra alerta si el registro fue exitoso
  } catch (e) {
    throw e;
  }
});
