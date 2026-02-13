// src/pages/LoginPage.jsx
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { loginUser, resetUserPassword } from "../api/electronApi";
import { useAuth } from "../context/AuthContext";
import { getFriendlyErrorMessage } from "../utils/helpers";

export default function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [alertClass, setAlertClass] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Forgot password modal state
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [fpUsername, setFpUsername] = useState("");
  const [fpNewPassword, setFpNewPassword] = useState("");
  const [fpConfirmPassword, setFpConfirmPassword] = useState("");
  const [fpLoading, setFpLoading] = useState(false);
  const [fpAlert, setFpAlert] = useState({ message: "", type: "" });

  useEffect(() => {
    if (isAuthenticated) navigate("/dashboard", { replace: true });
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (searchParams.get("registered") === "1") {
      setAlertClass("alert-success");
      setAlertMessage("Registro completado. Ahora inicia sesión.");
    }
  }, [searchParams]);

  async function handleLogin(e) {
    e.preventDefault();
    if (!username.trim() || !password) {
      setAlertClass("alert-danger");
      setAlertMessage("Usuario y contraseña requeridos");
      return;
    }
    setLoading(true);
    setAlertMessage("");
    try {
      const res = await loginUser(username.trim(), password);
      if (res && res.id) {
        login(res, rememberMe);
        navigate("/dashboard", { replace: true });
      } else {
        setAlertClass("alert-warning");
        setAlertMessage("Credenciales inválidas");
      }
    } catch (err) {
      setAlertClass("alert-danger");
      setAlertMessage(getFriendlyErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleForgotPassword(e) {
    e.preventDefault();
    if (!fpUsername.trim()) {
      setFpAlert({ message: "Ingrese el nombre de usuario", type: "danger" });
      return;
    }
    if (fpNewPassword.length < 4) {
      setFpAlert({
        message: "La contraseña debe tener al menos 4 caracteres",
        type: "danger",
      });
      return;
    }
    if (fpNewPassword !== fpConfirmPassword) {
      setFpAlert({ message: "Las contraseñas no coinciden", type: "danger" });
      return;
    }

    setFpLoading(true);
    try {
      const result = await resetUserPassword({
        username: fpUsername.trim(),
        newPassword: fpNewPassword,
      });
      if (result && result.success !== false) {
        setFpAlert({
          message:
            "Contraseña restablecida correctamente inicie sesión con la nueva contraseña",
          type: "success",
        });
        setTimeout(() => {
          setShowForgotModal(false);
          setFpAlert({ message: "", type: "" });
        }, 2000);
      } else {
        setFpAlert({
          message: result?.message || "No se pudo restablecer la contraseña",
          type: "danger",
        });
      }
    } catch (err) {
      setFpAlert({
        message: getFriendlyErrorMessage(err),
        type: "danger",
      });
    } finally {
      setFpLoading(false);
    }
  }

  return (
    <div className="d-flex justify-content-center align-items-center min-vh-100 bg-light">
      <div
        className="card shadow-sm"
        style={{ width: "100%", maxWidth: "420px" }}
      >
        <div className="card-body p-4">
          <div className="text-center mb-4">
            <i className="bi bi-tools display-4 text-primary"></i>
            <h3 className="mt-2">App Taller</h3>
            <p className="text-muted">Inicia sesión para continuar</p>
          </div>

          {alertMessage && (
            <div
              className={`alert ${alertClass} alert-dismissible fade show`}
              role="alert"
            >
              {alertMessage}
              <button
                type="button"
                className="btn-close"
                onClick={() => setAlertMessage("")}
              ></button>
            </div>
          )}

          <form onSubmit={handleLogin}>
            <div className="mb-3">
              <label htmlFor="username" className="form-label">
                Usuario
              </label>
              <div className="input-group">
                <span className="input-group-text">
                  <i className="bi bi-person"></i>
                </span>
                <input
                  id="username"
                  type="text"
                  className="form-control"
                  placeholder="Nombre de usuario"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoFocus
                />
              </div>
            </div>
            <div className="mb-3">
              <label htmlFor="password" className="form-label">
                Contraseña
              </label>
              <div className="input-group">
                <span className="input-group-text">
                  <i className="bi bi-lock"></i>
                </span>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  className="form-control"
                  placeholder="Contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  className="btn btn-outline-secondary"
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <i
                    className={`bi ${showPassword ? "bi-eye-slash" : "bi-eye"}`}
                  ></i>
                </button>
              </div>
            </div>
            <div className="mb-3 form-check">
              <input
                type="checkbox"
                className="form-check-input"
                id="remember-me"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <label className="form-check-label" htmlFor="remember-me">
                Recordarme
              </label>
            </div>
            <button
              type="submit"
              className="btn btn-primary w-100"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2"></span>
                  Entrando...
                </>
              ) : (
                "Entrar"
              )}
            </button>
          </form>

          <div className="text-center mt-3">
            <button
              className="btn btn-link btn-sm text-decoration-none"
              onClick={() => {
                setShowForgotModal(true);
                setFpUsername("");
                setFpNewPassword("");
                setFpConfirmPassword("");
                setFpAlert({ message: "", type: "" });
              }}
            >
              ¿Olvidaste tu contraseña?
            </button>
          </div>
          <div className="text-center mt-2">
            <span className="text-muted">¿No tienes cuenta? </span>
            <Link to="/register" className="text-decoration-none">
              Regístrate
            </Link>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div
          className="modal show d-block"
          tabIndex="-1"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Restablecer Contraseña</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowForgotModal(false)}
                ></button>
              </div>
              <form onSubmit={handleForgotPassword}>
                <div className="modal-body">
                  {fpAlert.message && (
                    <div className={`alert alert-${fpAlert.type} small`}>
                      {fpAlert.message}
                    </div>
                  )}
                  <div className="mb-3">
                    <label className="form-label">Usuario</label>
                    <input
                      type="text"
                      className="form-control"
                      value={fpUsername}
                      onChange={(e) => setFpUsername(e.target.value)}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Nueva Contraseña</label>
                    <input
                      type="password"
                      className="form-control"
                      value={fpNewPassword}
                      onChange={(e) => setFpNewPassword(e.target.value)}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Confirmar Contraseña</label>
                    <input
                      type="password"
                      className="form-control"
                      value={fpConfirmPassword}
                      onChange={(e) => setFpConfirmPassword(e.target.value)}
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowForgotModal(false)}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={fpLoading}
                  >
                    {fpLoading ? "Restableciendo..." : "Restablecer Contraseña"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
