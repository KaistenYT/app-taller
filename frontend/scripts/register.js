window.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("register-form");
  const inputUser = document.getElementById("username");
  const inputPass = document.getElementById("input-pass");
  const inputConfirm = document.getElementById("input-pass-confirm");
  const btn = document.getElementById("btn-register");
  const alertArea = document.getElementById("alert-area");

  const eyeSvg =
    '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z"></path><circle cx="12" cy="12" r="3"></circle></svg>';
  const eyeOffSvg =
    '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17.94 17.94A10.94 10.94 0 0112 20c-7 0-11-8-11-8a21.56 21.56 0 015.06-6.39"></path><path d="M1 1l22 22"></path></svg>';

  function setupToggle(toggleId, inputId) {
    const toggle = document.getElementById(toggleId);
    const input = document.getElementById(inputId);
    if (!toggle || !input) return;

    toggle.innerHTML = eyeSvg;
    toggle.addEventListener("click", () => {
      const isHidden = input.type === "password";
      input.type = isHidden ? "text" : "password";
      toggle.innerHTML = isHidden ? eyeOffSvg : eyeSvg;
    });
  }

  setupToggle("toggle-pass", "input-pass");
  setupToggle("toggle-pass-confirm", "input-pass-confirm");

  function showAlert(type, message, timeout = 5000) {
    if (!alertArea) return;
    alertArea.innerHTML = `<div class="alert alert-${type}" role="alert">${message}</div>`;
    if (timeout > 0)
      setTimeout(() => {
        alertArea.innerHTML = "";
      }, timeout);
  }

  async function registerUser(username, password) {
    try {
      if (window.api?.registerUser)
        return await window.api.registerUser({ username, password });
      if (window.api?.invoke)
        return await window.api.invoke("register-user", { username, password });
      throw new Error("API de Electron no disponible");
    } catch (err) {
      throw err;
    }
  }

  function validateForm() {
    const username = inputUser.value?.trim();
    const password = inputPass.value || "";
    const confirm = inputConfirm.value || "";
    const ok =
      username.length > 0 && password.length >= 4 && password === confirm;
    btn.disabled = !ok;
  }

  inputUser.addEventListener("input", validateForm);
  inputPass.addEventListener("input", validateForm);
  inputConfirm.addEventListener("input", validateForm);

  validateForm();

  if (!form) return;
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const username = inputUser.value?.trim();
    const password = inputPass.value;
    const confirm = inputConfirm.value;

    if (!username || password.length < 4) {
      showAlert(
        "danger",
        "Usuario y contraseña deben tener al menos 4 caracteres"
      );
      return;
    }

    if (password !== confirm) {
      showAlert("warning", "Las contraseñas no coinciden");
      return;
    }

    try {
      btn.disabled = true;
      btn.innerHTML =
        '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Registrando...';

      const res = await registerUser(username, password);
      if (res?.id) {
        showAlert(
          "success",
          "Usuario creado correctamente. Redirigiendo al login...",
          3000
        );
        setTimeout(() => {
          window.location.href = "login.html?registered=1";
        }, 900);
        return;
      }

      showAlert("danger", "No se pudo registrar el usuario");
    } catch (err) {
      const msg = err?.message?.toLowerCase() || "";
      let userMessage =
        "Ocurrió un error al registrar el usuario. Intenta nuevamente más tarde.";

      if (
        msg.includes("usuario ya existe") ||
        msg.includes("username exists")
      ) {
        userMessage =
          "El nombre de usuario ya está registrado. Intenta con otro.";
      } else if (
        msg.includes("credenciales inválidas") ||
        msg.includes("invalid credentials")
      ) {
        userMessage = "Las credenciales proporcionadas no son válidas.";
      } else if (msg.includes("api de electron no disponible")) {
        userMessage =
          "No se pudo conectar con el sistema interno. Contacta al soporte técnico.";
      }

      showAlert("danger", userMessage, 6000);
    } finally {
      btn.disabled = false;
      btn.innerHTML = "Registrar";
    }
  });
});
