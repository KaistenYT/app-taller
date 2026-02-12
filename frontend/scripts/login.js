function showNotification(message, type = "success", targetElementId = "forgot-password-alert-area") {
  const alertArea = document.getElementById(targetElementId);
  if (!alertArea) return;

  const iconClass = type === "success" ? "bi-check-circle" : "bi-exclamation-triangle";
  alertArea.innerHTML = `
    <div class="alert alert-${type} alert-dismissible fade show" role="alert">
      <i class="bi ${iconClass} me-2"></i>
      ${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    </div>
  `;

  setTimeout(() => {
    if (alertArea) alertArea.innerHTML = "";
  }, 5000);
}

window.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("login-form");
  const inputUser = document.getElementById("username");
  const inputPass = document.getElementById("password");
  const btn = document.getElementById("btn-login");
  const alertArea = document.getElementById("alert-area");

  try {
    let sessionRaw = null;
    try {
      sessionRaw = sessionStorage.getItem("app_user");
    } catch (e) {
      sessionRaw = null;
    }
    if (!sessionRaw) {
      try {
        sessionRaw = localStorage.getItem("app_user");
      } catch (e) {
        sessionRaw = null;
      }
    }
    if (sessionRaw) {
      try {
        const sess = JSON.parse(sessionRaw);
        if (sess && sess.id) {
          if (sess.expires && Number(sess.expires)) {
            const exp = Number(sess.expires);
            if (Date.now() <= exp) {
              window.location.href = "index.html";
              return;
            } else {
              try {
                localStorage.removeItem("app_user");
              } catch (e) {}
            }
          } else {
            window.location.href = "index.html";
            return;
          }
        }
      } catch (e) {}
    }
  } catch (e) {
    throw e;
  }

  function showAlert(type, message, timeout = 4000) {
    if (!alertArea) return;
    alertArea.innerHTML = `<div class="alert alert-${type} alert-sm" role="alert">${message}</div>`;
    if (timeout > 0)
      setTimeout(() => {
        if (alertArea) alertArea.innerHTML = "";
      }, timeout);
  }

  async function attemptLogin(username, password) {
    try {
      if (window.api && typeof window.api.loginUser === "function") {
        return await window.api.loginUser(username, password);
      }
      if (window.api && typeof window.api.invoke === "function") {
        return await window.api.invoke("login-user", username, password);
      }
      throw new Error("API de Electron no disponible");
    } catch (err) {
      throw err;
    }
  }

  if (!form) return;
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const username = inputUser.value && inputUser.value.trim();
    const password = inputPass.value;
    const remember = document.getElementById("remember-me")?.checked;
    if (!username || !password) {
      showAlert("danger", "Usuario y contraseña requeridos", 3500);
      return;
    }
    try {
      btn.disabled = true;
      btn.textContent = "Entrando...";
      const res = await attemptLogin(username, password);

      if (res && res.id) {
        try {
          const sessionObj = { ...res };
          if (remember) {
            const expires = Date.now() + 30 * 24 * 60 * 60 * 1000;
            sessionObj.expires = expires;
            localStorage.setItem("app_user", JSON.stringify(sessionObj));

            try {
              sessionStorage.removeItem("app_user");
            } catch (e) {}
          } else {
            sessionStorage.setItem("app_user", JSON.stringify(sessionObj));
            try {
              localStorage.removeItem("app_user");
            } catch (e) {}
          }
        } catch (e) {
          throw e;
        }

        window.location.href = "index.html";
        return;
      }
      showAlert("warning", "Credenciales inválidas", 4000);
    } catch (err) {
      let userMessage =
        "Ocurrió un problema al intentar iniciar sesión. Por favor, verifica tus credenciales.";
      if (err?.message?.includes("API de Electron no disponible")) {
        userMessage =
          "La aplicación no pudo conectarse con el sistema interno. Contacta al soporte técnico.";
      }
      try {
        showAlert("danger", userMessage, 5000);
      } catch (e) {
        /* ignore */
      }
    } finally {
      btn.disabled = false;
      btn.textContent = "Entrar";
    }
  });

  // --- Forgot Password Logic ---
  const forgotPasswordLink = document.getElementById('forgot-password-link');
  const forgotPasswordModalEl = document.getElementById('forgotPasswordModal');
  const forgotPasswordModal = forgotPasswordModalEl ? new bootstrap.Modal(forgotPasswordModalEl) : null;
  const fpForm = document.getElementById('forgot-password-form');
  const fpUsernameInput = document.getElementById('fp-username');
  const fpNewPasswordInput = document.getElementById('fp-new-password');
  const fpConfirmPasswordInput = document.getElementById('fp-confirm-password');
  const fpSubmitBtn = document.getElementById('fp-submit-btn');

  if (forgotPasswordLink) {
    forgotPasswordLink.addEventListener('click', (e) => {
      e.preventDefault();
      // Clear previous messages and inputs
      document.getElementById('forgot-password-alert-area').innerHTML = '';
      fpForm.reset();
      forgotPasswordModal.show();
    });
  }

  if (fpForm) {
    fpForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const username = fpUsernameInput.value.trim();
      const newPassword = fpNewPasswordInput.value;
      const confirmPassword = fpConfirmPasswordInput.value;

      document.getElementById('forgot-password-alert-area').innerHTML = ''; // Clear alerts

      if (!username) {
        showNotification('Por favor, introduce tu nombre de usuario.', 'danger');
        return;
      }
      if (newPassword.length < 4) {
        showNotification('La nueva contraseña debe tener al menos 4 caracteres.', 'danger');
        return;
      }
      if (newPassword !== confirmPassword) {
        showNotification('Las contraseñas no coinciden.', 'danger');
        return;
      }

      fpSubmitBtn.disabled = true;
      fpSubmitBtn.textContent = 'Restableciendo...';

      try {
        // --- IPC call to main process ---
        // This 'reset-user-password' channel needs to be implemented in electron/main.js
        // and exposed via preload.cjs
        if (window.api && typeof window.api.invoke === 'function') {
          const result = await window.api.invoke('reset-user-password', { username, newPassword });

          if (result && result.success) {
            showNotification('Contraseña restablecida exitosamente. Ahora puedes iniciar sesión con tu nueva contraseña.', 'success');
            setTimeout(() => {
              forgotPasswordModal.hide();
              // Optionally clear login form and pre-fill username
              inputUser.value = username;
              inputPass.value = '';
            }, 2000);
          } else {
            showNotification(result.message || 'Error al restablecer la contraseña. Usuario no encontrado o error interno.', 'danger');
          }
        } else {
          // Fallback for non-Electron environment or API not available
          showNotification('Funcionalidad de recuperación no disponible en este entorno.', 'danger');
        }
      } catch (error) {
        console.error('Error durante el restablecimiento de contraseña:', error);
        showNotification(error.message || 'Error interno al restablecer la contraseña.', 'danger');
      } finally {
        fpSubmitBtn.disabled = false;
        fpSubmitBtn.textContent = 'Restablecer Contraseña';
      }
    });
  }
  // --- End Forgot Password Logic ---

  const toggle = document.getElementById("toggle-pass");
  const eyeSvg =
    '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z"></path><circle cx="12" cy="12" r="3"></circle></svg>';
  const eyeOffSvg =
    '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17.94 17.94A10.94 10.94 0 0112 20c-7 0-11-8-11-8a21.56 21.56 0 015.06-6.39"></path><path d="M1 1l22 22"></path></svg>';
  if (toggle) {
    toggle.addEventListener("click", () => {
      const p = inputPass;
      if (!p) return;
      if (p.type === "password") {
        p.type = "text";
        toggle.innerHTML = eyeOffSvg;
      } else {
        p.type = "password";
        toggle.innerHTML = eyeSvg;
      }
    });

    toggle.innerHTML = eyeSvg;
  }

  try {
    const params = new URLSearchParams(window.location.search);
    if (params.get("registered") === "1")
      showAlert("success", "Registro completado. Ahora inicia sesión.");
  } catch (e) {
    throw e;
  }
});
