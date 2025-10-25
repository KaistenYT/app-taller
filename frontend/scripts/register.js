window.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('register-form');
  const inputUser = document.getElementById('username');
  const inputPass = document.getElementById('input-pass');
  const inputConfirm = document.getElementById('input-pass-confirm');
  const btn = document.getElementById('btn-register');
  const alertArea = document.getElementById('alert-area');
  const passwordStrengthBar = document.getElementById('passwordStrength');

  // 👁 SVGs para mostrar/ocultar contraseña
  const eyeSvg = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z"></path><circle cx="12" cy="12" r="3"></circle></svg>';
  const eyeOffSvg = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17.94 17.94A10.94 10.94 0 0112 20c-7 0-11-8-11-8a21.56 21.56 0 015.06-6.39"></path><path d="M1 1l22 22"></path></svg>';

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
    if (timeout > 0) setTimeout(() => { alertArea.innerHTML = ''; }, timeout);
  }

  async function registerUser(username, password) {
    try {
      if (window.api?.registerUser) return await window.api.registerUser({ username, password });
      if (window.api?.invoke) return await window.api.invoke('register-user', { username, password });
      throw new Error('API de Electron no disponible');
    } catch (err) {
      throw err;
    }
  }

  if (!form) return;

  // basic password strength calculator
  function passwordScore(pw) {
    let score = 0;
    if (!pw) return score;
    if (pw.length >= 8) score++;
    if (pw.length >= 12) score++;
    if (/[a-z]/.test(pw)) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    return score; // 0..6
  }

  function updateStrengthBar() {
    if (!passwordStrengthBar) return;
    const score = passwordScore(inputPass.value);
    const percent = Math.round((score / 6) * 100);
    passwordStrengthBar.style.width = percent + '%';
    passwordStrengthBar.classList.remove('bg-danger','bg-warning','bg-success');
    if (score <= 2) passwordStrengthBar.classList.add('bg-danger');
    else if (score <= 4) passwordStrengthBar.classList.add('bg-warning');
    else passwordStrengthBar.classList.add('bg-success');
  }

  function validateForm() {
    const username = inputUser.value?.trim();
    const password = inputPass.value || '';
    const confirm = inputConfirm.value || '';
    const ok = username.length > 0 && password.length >= 8 && password === confirm;
    btn.disabled = !ok;
  }

  // wire input events
  inputPass.addEventListener('input', () => {
    updateStrengthBar();
    validateForm();
  });
  inputConfirm.addEventListener('input', validateForm);
  inputUser.addEventListener('input', validateForm);

  // initialize
  updateStrengthBar();
  validateForm();

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = inputUser.value?.trim();
    const password = inputPass.value;
    const confirm = inputConfirm.value;

    if (!username || !password) {
      showAlert('danger', 'Usuario y contraseña requeridos');
      return;
    }

    if (password !== confirm) {
      showAlert('warning', 'Las contraseñas no coinciden');
      return;
    }

    try {
      btn.disabled = true;
      const originalText = btn.innerHTML;
      btn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Registrando...';
      const res = await registerUser(username, password);
      if (res?.id) {
        showAlert('success', 'Usuario creado correctamente. Redirigiendo al login...', 3000);
        setTimeout(() => {
          window.location.href = 'login.html?registered=1';
        }, 900);
        return;
      }
      showAlert('danger', 'No se pudo registrar el usuario');
    } catch (err) {
      console.error('Register error:', err);
      showAlert('danger', err?.message || 'Error al registrar');
    } finally {
      btn.disabled = false;
      btn.innerHTML = 'Registrar';
    }
  });
});
