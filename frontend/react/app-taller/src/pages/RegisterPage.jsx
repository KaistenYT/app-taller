import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { registerUser, loginUser } from "../api/httpApi";
import { useAuth } from "../context/AuthContext";
import { getFriendlyErrorMessage } from "../utils/helpers";

export default function RegisterPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [alertType, setAlertType] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const isValid =
    username.trim().length > 0 &&
    password.length >= 4 &&
    password === confirmPassword;

  async function handleRegister(e) {
    e.preventDefault();
    if (!isValid) return;
    setLoading(true);
    setAlertMessage("");
    try {
      const result = await registerUser({
        username: username.trim(),
        password,
      });
      if (result && result.id) {
        // Auto-login después de registro
        try {
          const user = await loginUser(username.trim(), password);
          if (user && user.id) {
            login(user, false);
            navigate("/dashboard", { replace: true });
            return;
          }
        } catch (_) {}
        // Si auto-login falla, ir a login con param
        navigate("/login?registered=1", { replace: true });
      } else {
        setAlertType("danger");
        setAlertMessage(
          getFriendlyErrorMessage(result?.message || "No se pudo registrar"),
        );
      }
    } catch (err) {
      setAlertType("danger");
      setAlertMessage(getFriendlyErrorMessage(err));
    } finally {
      setLoading(false);
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
            <i className="bi bi-person-plus display-4 text-primary"></i>
            <h3 className="mt-2">Crear Cuenta</h3>
            <p className="text-muted">Registra una nueva cuenta de usuario</p>
          </div>

          {alertMessage && (
            <div
              className={`alert alert-${alertType} alert-dismissible fade show`}
            >
              {alertMessage}
              <button
                type="button"
                className="btn-close"
                onClick={() => setAlertMessage("")}
              ></button>
            </div>
          )}

          <form onSubmit={handleRegister}>
            <div className="mb-3">
              <label htmlFor="reg-username" className="form-label">
                Usuario
              </label>
              <div className="input-group">
                <span className="input-group-text">
                  <i className="bi bi-person"></i>
                </span>
                <input
                  id="reg-username"
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
              <label htmlFor="reg-password" className="form-label">
                Contraseña
              </label>
              <div className="input-group">
                <span className="input-group-text">
                  <i className="bi bi-lock"></i>
                </span>
                <input
                  id="reg-password"
                  type={showPassword ? "text" : "password"}
                  className="form-control"
                  placeholder="Mínimo 4 caracteres"
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
              {password.length > 0 && password.length < 4 && (
                <div className="form-text text-danger">
                  La contraseña debe tener al menos 4 caracteres
                </div>
              )}
            </div>
            <div className="mb-3">
              <label htmlFor="reg-confirm" className="form-label">
                Confirmar Contraseña
              </label>
              <div className="input-group">
                <span className="input-group-text">
                  <i className="bi bi-lock-fill"></i>
                </span>
                <input
                  id="reg-confirm"
                  type={showConfirm ? "text" : "password"}
                  className="form-control"
                  placeholder="Repite la contraseña"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                <button
                  className="btn btn-outline-secondary"
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                >
                  <i
                    className={`bi ${showConfirm ? "bi-eye-slash" : "bi-eye"}`}
                  ></i>
                </button>
              </div>
              {confirmPassword.length > 0 && password !== confirmPassword && (
                <div className="form-text text-danger">
                  Las contraseñas no coinciden
                </div>
              )}
            </div>
            <button
              type="submit"
              className="btn btn-primary w-100"
              disabled={loading || !isValid}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2"></span>
                  Registrando...
                </>
              ) : (
                "Crear Cuenta"
              )}
            </button>
          </form>

          <div className="text-center mt-3">
            <span className="text-muted">¿Ya tienes cuenta? </span>
            <Link to="/login" className="text-decoration-none">
              Inicia sesión
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
