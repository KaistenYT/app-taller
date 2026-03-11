import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();

  const isActive = (path) => (location.pathname === path ? "active" : "");

  function handleLogout() {
    logout();
  }

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
      <div className="container-fluid">
        <Link className="navbar-brand" to="/dashboard">
          <i className="bi bi-tools me-2"></i>App Taller
        </Link>
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav me-auto">
            <li className="nav-item">
              <Link
                className={`nav-link ${isActive("/dashboard") || isActive("/")}`}
                to="/dashboard"
              >
                <i className="bi bi-house-door me-1"></i>Inicio
              </Link>
            </li>
            <li className="nav-item">
              <Link
                className={`nav-link ${isActive("/history")}`}
                to="/history"
              >
                <i className="bi bi-clock-history me-1"></i>Historial
              </Link>
            </li>
            <li className="nav-item">
              <Link
                className={`nav-link ${isActive("/reports")}`}
                to="/reports"
              >
                <i className="bi bi-file-earmark-text me-1"></i>Reportes
              </Link>
            </li>
            <li className="nav-item">
              <Link
                className={`nav-link ${isActive("/budgets")}`}
                to="/budgets"
              >
                <i className="bi bi-calculator me-1"></i>Presupuestos
              </Link>
            </li>
            {user?.role === "admin" && (
              <li className="nav-item">
                <Link className={`nav-link ${isActive("/users")}`} to="/users">
                  <i className="bi bi-people me-1"></i>Usuarios
                </Link>
              </li>
            )}
          </ul>
          <div className="d-flex align-items-center">
            <span className="text-light me-3">
              <i className="bi bi-person-circle me-1"></i>
              {user?.username || ""}
            </span>
            <button
              className="btn btn-outline-light btn-sm"
              onClick={handleLogout}
            >
              <i className="bi bi-box-arrow-right me-1"></i>Salir
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
