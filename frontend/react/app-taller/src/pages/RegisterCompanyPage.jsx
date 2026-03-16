import { useState, useEffect } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { registerCompany } from "../api/httpApi";
import { getFriendlyErrorMessage } from "../utils/helpers";

export default function RegisterCompanyPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Wizard step (0 = Plan, 1 = Company, 2 = Admin)
  const [step, setStep] = useState(0);

  // Seleccion de plan (por defecto 2 = Profesional)
  const [planId, setPlanId] = useState(2);

  // Usar query param ?plan=X si viene de la landing
  useEffect(() => {
    const p = searchParams.get("plan");
    if (p && !isNaN(p)) {
      const pid = parseInt(p, 10);
      if ([1, 2, 3].includes(pid)) setPlanId(pid);
    }
  }, [searchParams]);

  // Company data
  const [companyName, setCompanyName] = useState("");
  const [rif, setRif] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [email, setEmail] = useState("");

  // Admin data
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function nextStep() {
    if (step === 1 && !companyName.trim()) {
      setError("El nombre del taller es obligatorio");
      return;
    }
    setError("");
    setStep(step + 1);
  }

  function prevStep() {
    setError("");
    setStep(step - 1);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (step !== 2) return; // solo permitir submit en el paso final
    setError("");

    if (!username.trim()) {
      setError("El nombre de usuario es obligatorio");
      return;
    }
    if (password.length < 4) {
      setError("La contraseña debe tener al menos 4 caracteres");
      return;
    }
    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }

    setLoading(true);
    try {
      await registerCompany({
        company: {
          name: companyName.trim(),
          rif: rif.trim() || null,
          phone: phone.trim() || null,
          address: address.trim() || null,
          email: email.trim() || null,
        },
        admin: {
          username: username.trim(),
          password,
        },
        planId: planId
      });
      navigate("/login?registered=1");
    } catch (err) {
      setError(getFriendlyErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  // Helper arrays for plans UI
  const planes = [
    { 
      id: 1, 
      name: "Emprendedor", 
      price: "$0", 
      desc: "Para empezar",
      features: ["1 Usuario Admin", "50 Recepciones al mes", "Presupuestos básicos"]
    },
    { 
      id: 2, 
      name: "Profesional", 
      price: "$29", 
      desc: "El más popular",
      features: ["Hasta 5 Usuarios Técnicos", "Recepciones ilimitadas", "Soporte prioritario"]
    },
    { 
      id: 3, 
      name: "Empresarial", 
      price: "$89", 
      desc: "Sin límites",
      features: ["Usuarios Ilimitados", "Gestión Multi-Sucursal", "Manager dedicado"]
    },
  ];

  return (
    <div className="d-flex justify-content-center align-items-center min-vh-100 bg-light py-5">
      <div className="card shadow border-0" style={{ width: "100%", maxWidth: step === 0 ? "800px" : "520px", transition: 'max-width 0.3s ease' }}>
        <div className="card-body p-4 p-md-5">
          <div className="text-center mb-4">
            <i className="bi bi-building display-4 text-primary"></i>
            <h3 className="mt-2 fw-bold">Registro de Empresa</h3>
            <p className="text-muted">
              Paso {step + 1} de 3 &mdash;{" "}
              {step === 0 ? "Elige tu Plan" : step === 1 ? "Datos de la Empresa" : "Cuenta de Administrador"}
            </p>
          </div>

          {/* Progress */}
          <div className="progress mb-4" style={{ height: "6px" }}>
            <div
              className="progress-bar bg-primary"
              style={{ width: `${((step + 1) / 3) * 100}%`, transition: "width 0.3s ease" }}
            ></div>
          </div>

          {error && (
            <div className="alert alert-danger alert-dismissible fade show" role="alert">
              {error}
              <button type="button" className="btn-close" onClick={() => setError("")}></button>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {step === 0 && (
              <div className="animate-fade-in-up">
                <div className="row g-3 justify-content-center mb-4">
                  {planes.map((p) => (
                    <div className="col-md-4" key={p.id}>
                      <div 
                        className={`card h-100 cursor-pointer transition-all border-2 ${
                          planId === p.id ? 'border-primary shadow bg-primary bg-opacity-10' : 'border-light shadow-sm hover-lift'
                        }`}
                        onClick={() => setPlanId(p.id)}
                        role="button"
                      >
                        <div className="card-body text-center p-4 d-flex flex-column">
                          {planId === p.id && (
                            <div className="position-absolute top-0 end-0 mt-2 me-2">
                              <i className="bi bi-check-circle-fill text-primary fs-5"></i>
                            </div>
                          )}
                          <h5 className="fw-bold">{p.name}</h5>
                          <h3 className="text-primary my-3">{p.price}<small className="text-muted fs-6">/mes</small></h3>
                          <p className="text-muted small mb-3">{p.desc}</p>
                          <ul className="list-unstyled text-start small mt-auto mb-0 bg-light p-3 rounded text-muted">
                             {p.features.map((feature, idx) => (
                                <li key={idx} className="mb-2"><i className="bi bi-check2 text-primary me-2 fw-bold"></i>{feature}</li>
                             ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="text-center">
                  <button type="button" className="btn btn-primary btn-lg px-5 rounded-pill shadow-sm hover-lift" onClick={nextStep}>
                    Continuar con este Plan <i className="bi bi-arrow-right ms-2"></i>
                  </button>
                  <div className="mt-3">
                    <span className="text-muted">¿Ya tienes cuenta? </span>
                    <Link to="/login" className="text-decoration-none fw-semibold">Iniciar Sesión</Link>
                  </div>
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="animate-fade-in-up">
                <div className="mb-3">
                  <label htmlFor="company-name" className="form-label fw-semibold">
                    Nombre de Empresa <span className="text-danger">*</span>
                  </label>
                  <div className="input-group">
                    <span className="input-group-text bg-white"><i className="bi bi-shop text-muted"></i></span>
                    <input
                      id="company-name"
                      className="form-control"
                      placeholder="Ej: Taller Electrónico Central"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      autoFocus
                    />
                  </div>
                </div>
                <div className="mb-3">
                  <label htmlFor="rif" className="form-label fw-semibold">RUT / NIT / RIF / CUIT</label>
                  <div className="input-group">
                    <span className="input-group-text bg-white"><i className="bi bi-card-text text-muted"></i></span>
                    <input
                      id="rif"
                      className="form-control"
                      placeholder="Documento legal de la empresa"
                      value={rif}
                      onChange={(e) => setRif(e.target.value)}
                    />
                  </div>
                </div>
                <div className="row g-3 mb-3">
                  <div className="col-md-6">
                    <label htmlFor="company-phone" className="form-label fw-semibold">Teléfono</label>
                    <input
                      id="company-phone"
                      className="form-control"
                      placeholder="Ej: +1 234 567 8900"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>
                  <div className="col-md-6">
                    <label htmlFor="company-email" className="form-label fw-semibold">Email de Contacto</label>
                    <input
                      id="company-email"
                      className="form-control"
                      type="email"
                      placeholder="contacto@empresa.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>
                <div className="mb-4">
                  <label htmlFor="company-address" className="form-label fw-semibold">Dirección Física</label>
                  <input
                    id="company-address"
                    className="form-control"
                    placeholder="Av. Principal, Edificio, País"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                  />
                </div>
                
                <div className="d-flex gap-2">
                  <button type="button" className="btn btn-outline-secondary" onClick={prevStep}>
                    <i className="bi bi-arrow-left me-1"></i>Atrás
                  </button>
                  <button type="button" className="btn btn-primary flex-fill fw-semibold shadow-sm hover-lift" onClick={nextStep}>
                    Siguiente <i className="bi bi-arrow-right ms-2"></i>
                  </button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="animate-fade-in-up">
                <div className="alert alert-info border-0 bg-info bg-opacity-10 d-flex gap-3 mb-4">
                   <i className="bi bi-info-circle-fill fs-4 text-info"></i>
                   <div>
                     <p className="mb-0 small text-dark">
                       Este usuario será el <strong>Administrador Principal</strong> del sistema. Podrá configurar roles, crear otros usuarios e invitar técnicos según las capacidades de su Plan {planes.find(p => p.id === planId)?.name}.
                     </p>
                   </div>
                </div>

                <div className="mb-3">
                  <label htmlFor="admin-username" className="form-label fw-semibold">
                    Usuario Administrador <span className="text-danger">*</span>
                  </label>
                  <div className="input-group">
                    <span className="input-group-text bg-white"><i className="bi bi-person-badge text-muted"></i></span>
                    <input
                      id="admin-username"
                      className="form-control"
                      placeholder="admin"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      autoFocus
                    />
                  </div>
                </div>
                <div className="mb-3">
                  <label htmlFor="admin-password" className="form-label fw-semibold">
                    Contraseña Fuerte <span className="text-danger">*</span>
                  </label>
                  <div className="input-group">
                    <span className="input-group-text bg-white"><i className="bi bi-shield-lock text-muted"></i></span>
                    <input
                      id="admin-password"
                      type={showPassword ? "text" : "password"}
                      className="form-control"
                      placeholder="Mínimo 4 caracteres"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <button
                      className="btn btn-outline-secondary bg-white"
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      <i className={`bi ${showPassword ? "bi-eye-slash text-muted" : "bi-eye text-primary"}`}></i>
                    </button>
                  </div>
                </div>
                <div className="mb-4">
                  <label htmlFor="confirm-password" className="form-label fw-semibold">
                    Confirmar Contraseña <span className="text-danger">*</span>
                  </label>
                  <div className="input-group">
                    <span className="input-group-text bg-white"><i className="bi bi-check2-circle text-muted"></i></span>
                    <input
                      id="confirm-password"
                      type={showPassword ? "text" : "password"}
                      className="form-control"
                      placeholder="Repite la contraseña"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </div>
                </div>
                <div className="d-flex gap-2 mt-3">
                  <button type="button" className="btn btn-outline-secondary" onClick={prevStep}>
                    <i className="bi bi-arrow-left me-1"></i>Atrás
                  </button>
                  <button type="submit" className="btn btn-primary flex-fill fw-bold shadow-sm hover-lift" disabled={loading}>
                    {loading ? (
                      <><span className="spinner-border spinner-border-sm me-2"></span>Registrando...</>
                    ) : (
                      <><i className="bi bi-send me-1"></i>Finalizar Registro</>
                    )}
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
