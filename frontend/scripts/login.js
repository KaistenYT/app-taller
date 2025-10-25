window.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('login-form');
  const inputUser = document.getElementById('username');
  const inputPass = document.getElementById('password');
  const btn = document.getElementById('btn-login');
  const alertArea = document.getElementById('alert-area');

  function showAlert(type, message, timeout = 4000) {
    if (!alertArea) return;
    alertArea.innerHTML = `<div class="alert alert-${type} alert-sm" role="alert">${message}</div>`;
    if (timeout > 0) setTimeout(() => { if (alertArea) alertArea.innerHTML = ''; }, timeout);
  }

  async function attemptLogin(username, password) {
    // Prefer explicit helper if available, otherwise use generic invoke
    try {
      if (window.api && typeof window.api.loginUser === 'function') {
        return await window.api.loginUser(username, password);
      }
      if (window.api && typeof window.api.invoke === 'function') {
        return await window.api.invoke('login-user', username, password);
      }
      throw new Error('API de Electron no disponible');
    } catch (err) {
      throw err;
    }
  }

  if (!form) return;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = inputUser.value && inputUser.value.trim();
    const password = inputPass.value;
    if (!username || !password) {
      showAlert('danger', 'Usuario y contraseña requeridos', 3500);
      return;
    }
    try {
      btn.disabled = true;
      btn.textContent = 'Entrando...';
      const res = await attemptLogin(username, password);
      // Expecting an object { id, username } on success
      if (res && res.id) {
        // Save session-lite in localStorage
        try { localStorage.setItem('app_user', JSON.stringify(res)); } catch(e){ /* ignore */ }
        // Redirect to main index
        window.location.href = 'index.html';
        return;
      }
      showAlert('warning', 'Credenciales inválidas', 4000);
    } catch (err) {
      console.error('Login error:', err);
      showAlert('danger', err?.message || 'Error al iniciar sesión', 6000);
    } finally {
      btn.disabled = false;
      btn.textContent = 'Entrar';
    }
  });

  // Toggle password visibility with SVG icon swap
  const toggle = document.getElementById('toggle-pass');
  const eyeSvg = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z"></path><circle cx="12" cy="12" r="3"></circle></svg>';
  const eyeOffSvg = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17.94 17.94A10.94 10.94 0 0112 20c-7 0-11-8-11-8a21.56 21.56 0 015.06-6.39"></path><path d="M1 1l22 22"></path></svg>';
  if (toggle) {
    toggle.addEventListener('click', () => {
      const p = inputPass;
      if (!p) return;
      if (p.type === 'password') { p.type = 'text'; toggle.innerHTML = eyeOffSvg; }
      else { p.type = 'password'; toggle.innerHTML = eyeSvg; }
    });
    // ensure icon initial
    toggle.innerHTML = eyeSvg;
  }

  // If arrived from registration, show success message
  try {
    const params = new URLSearchParams(window.location.search);
    if (params.get('registered') === '1') showAlert('success', 'Registro completado. Ahora inicia sesión.');
  } catch (e) { /* ignore */ }
});
