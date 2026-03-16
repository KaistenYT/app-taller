import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { loginUser } from "../api/httpApi";
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
      // loginUser devuelve { token, user: { id, username, role } }
      if (res && res.token && res.user) {
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

          <div className="text-center mt-2">
            <span className="text-muted">¿No tienes cuenta? </span>
            <Link to="/register-company" className="text-decoration-none">
              Registra tu taller
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
