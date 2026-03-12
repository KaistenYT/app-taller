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
    <nav className="navbar navbar-expand-lg navbar-dark bg-primary shadow-sm">
      <div className="container-fluid px-4">
        <Link className="navbar-brand fw-bold d-flex align-items-center gap-2" to="/dashboard">
          <i className="bi bi-tools fs-4"></i>
          <span>App Taller</span>
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
          <ul className="navbar-nav me-auto fw-medium">
            <li className="nav-item">
              <Link
                className={`nav-link px-3 ${isActive("/dashboard") || isActive("/")}`}
                to="/dashboard"
              >
                <i className="bi bi-house-door me-2"></i>Inicio
              </Link>
            </li>

            <li className="nav-item">
              <Link
                className={`nav-link px-3 ${isActive("/reports")}`}
                to="/reports"
              >
                <i className="bi bi-file-earmark-text me-2"></i>Reportes
              </Link>
            </li>
            <li className="nav-item">
              <Link
                className={`nav-link px-3 ${isActive("/budgets")}`}
                to="/budgets"
              >
                <i className="bi bi-calculator me-2"></i>Presupuestos
              </Link>
            </li>

            {user?.role === "admin" && (
              <li className="nav-item dropdown px-2">
                <a
                  className={`nav-link dropdown-toggle ${
                    isActive("/history") || isActive("/budget-logs")
                  }`}
                  href="#"
                  role="button"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                >
                  <i className="bi bi-shield-lock me-2"></i>Auditoría
                </a>
                <ul className="dropdown-menu dropdown-menu-dark shadow">
                  <li>
                    <Link className="dropdown-item" to="/history">
                      <i className="bi bi-clock-history me-2"></i>Recepciones
                    </Link>
                  </li>
                  <li>
                    <Link className="dropdown-item" to="/budget-logs">
                      <i className="bi bi-journal-text me-2"></i>Presupuestos
                    </Link>
                  </li>
                </ul>
              </li>
            )}
            {user?.role === "admin" && (
              <li className="nav-item">
                <Link className={`nav-link px-3 ${isActive("/users")}`} to="/users">
                  <i className="bi bi-people me-2"></i>Usuarios
                </Link>
              </li>
            )}
          </ul>
          
          <div className="d-flex align-items-center gap-3">
            <div className="text-light d-flex align-items-center gap-2 bg-white bg-opacity-10 px-3 py-1 rounded-pill">
              <i className="bi bi-person-circle"></i>
              <span className="fw-semibold">{user?.username || ""}</span>
            </div>
            <button
              className="btn btn-light btn-sm fw-semibold shadow-sm"
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
