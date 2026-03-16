import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function LandingPage() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="landing-page min-vh-100 d-flex flex-column">
      {/* Navbar Transparente/Oscuro */}
      <nav className="navbar navbar-expand-lg navbar-dark bg-dark py-3 fixed-top shadow-sm">
        <div className="container">
          <span className="navbar-brand fw-bold d-flex align-items-center gap-2">
            <div className="bg-primary text-white rounded p-1 d-flex align-items-center justify-content-center" style={{ width: '32px', height: '32px' }}>
               <i className="bi bi-tools fs-5"></i>
            </div>
            <span className="fs-4 tracking-tight">AppTaller</span>
          </span>
          <div className="d-flex gap-3 align-items-center">
             <a href="#planes" className="nav-link text-light d-none d-md-block fw-medium hover-opacity">Planes</a>
             <a href="#features" className="nav-link text-light d-none d-md-block fw-medium hover-opacity">Características</a>
            {isAuthenticated ? (
              <Link to="/dashboard" className="btn btn-primary fw-semibold rounded-pill px-4 shadow-sm">
                Ir al Panel <i className="bi bi-arrow-right ms-1"></i>
              </Link>
            ) : (
              <>
                <Link to="/login" className="btn btn-link text-light text-decoration-none fw-medium">
                  Iniciar Sesión
                </Link>
                <Link to="/register-company" className="btn btn-primary fw-semibold rounded-pill px-4 shadow-sm">
                  Registrar Taller
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section Premium */}
      <header className="hero-section text-center text-white d-flex align-items-center position-relative overflow-hidden" style={{ minHeight: '90vh', background: 'linear-gradient(135deg, #1a1c29 0%, #0d1b2a 100%)', paddingTop: '80px' }}>
        {/* Elementos decorativos de fondo */}
        <div className="position-absolute shape-blob opacity-10 bg-primary rounded-circle" style={{ width: '500px', height: '500px', top: '-10%', left: '-10%', filter: 'blur(80px)' }}></div>
        <div className="position-absolute shape-blob opacity-10 bg-info rounded-circle" style={{ width: '400px', height: '400px', bottom: '-5%', right: '-5%', filter: 'blur(60px)' }}></div>
        
        <div className="container position-relative z-1 mt-5">
          <span className="badge bg-primary bg-opacity-25 text-primary-light border border-primary border-opacity-50 rounded-pill px-3 py-2 mb-4 animate-fade-in-up">
            <i className="bi bi-stars me-1"></i> La nueva forma de gestionar tu taller
          </span>
          <h1 className="display-3 fw-black mb-4 mx-auto animate-fade-in-up delay-1" style={{ maxWidth: '900px', lineHeight: '1.1' }}>
            Un único sistema.<br/>
            <span className="text-transparent bg-clip-text bg-gradient-primary">Múltiples sucursales y talleres.</span>
          </h1>
          <p className="lead fw-normal mb-5 mx-auto text-light opacity-75 animate-fade-in-up delay-2" style={{ maxWidth: "700px", fontSize: '1.25rem' }}>
            Software SaaS B2B diseñado para organizar recepciones, generar reportes técnicos y controlar presupuestos. Todo aislado, seguro y en la nube.
          </p>
          <div className="d-flex justify-content-center gap-3 animate-fade-in-up delay-3">
             <Link
              to="/register-company"
              className="btn btn-primary btn-lg fw-bold px-5 rounded-pill shadow-lg hover-lift"
            >
              Comenzar Prueba Gratis
            </Link>
            <a href="#planes" className="btn btn-outline-light btn-lg fw-bold px-4 rounded-pill hover-lift">
               Ver Precios
            </a>
          </div>
          
          {/* Mockup visual abstracto del UI */}
          <div className="mt-5 mx-auto animate-fade-in-up delay-4 position-relative" style={{ maxWidth: '800px', perspective: '1000px' }}>
            <div className="bg-dark border border-secondary border-opacity-25 rounded-3 shadow-2xl overflow-hidden glass-effect" style={{ transform: 'rotateX(5deg)', transformStyle: 'preserve-3d' }}>
               <div className="bg-black bg-opacity-50 py-2 px-3 d-flex gap-2">
                 <div className="rounded-circle bg-danger" style={{width: 10, height: 10}}></div>
                 <div className="rounded-circle bg-warning" style={{width: 10, height: 10}}></div>
                 <div className="rounded-circle bg-success" style={{width: 10, height: 10}}></div>
               </div>
               <div className="p-4 bg-white bg-opacity-10 d-flex gap-3 h-100" style={{ minHeight: '200px' }}>
                  <div className="w-25 rounded bg-white bg-opacity-10 h-100"></div>
                  <div className="w-75 d-flex flex-column gap-3">
                     <div className="w-100 rounded bg-white bg-opacity-25" style={{ height: '40px' }}></div>
                     <div className="w-100 rounded bg-white bg-opacity-10" style={{ height: '80px' }}></div>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </header>

      {/* Features Multi-tenant */}
      <section id="features" className="py-6 bg-white">
        <div className="container py-5">
          <div className="text-center mb-5 pb-3">
             <h2 className="fw-bold mb-3 d-inline-block position-relative">
               Por qué elegir AppTaller
               <svg className="position-absolute w-100 text-primary start-0 top-100 mt-1" height="8" viewBox="0 0 200 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M2.38269 5.86982C58.1724 2.14818 114.717 1.34159 170.597 3.45686" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
               </svg>
             </h2>
             <p className="text-muted fs-5 mt-3">Arquitectura multi-empresa diseñada para escalar contigo.</p>
          </div>
          
          <div className="row g-4 mt-2">
            {[
              {
                icon: "bi-building-fill-check",
                title: "Espacios Aislados (SaaS)",
                desc: "Cada empresa tiene su propio entorno. Datos, usuarios y presupuestos 100% particionados y seguros gracias a nuestra arquitectura Multi-Tenant.",
                color: "primary"
              },
              {
                icon: "bi-laptop",
                title: "Gestión de Equipos",
                desc: "Historial completo por serial. Registra diagnósticos, fotos y estado de reparación de cada dispositivo que ingresa al taller.",
                color: "success"
              },
              {
                icon: "bi-receipt-cutoff",
                title: "Presupuestos Profesionales",
                desc: "Genera facturas proforma y presupuestos detallados al instante. Convierte recepciones en ventas con un clic.",
                color: "warning"
              },
              {
                icon: "bi-people-fill",
                title: "Roles y Permisos",
                desc: "Crea técnicos y administradores. Controla quién puede borrar, editar o aprobar presupuestos dentro de tu taller.",
                color: "info"
              },
              {
                icon: "bi-shield-check",
                title: "Auditoría en Tiempo Real",
                desc: "El sistema registra automáticamente quién modificó qué cosa. Ideal para el control de calidad y resolución de disputas.",
                color: "danger"
              },
              {
                icon: "bi-printer-fill",
                title: "Reportes Exportables",
                desc: "Todos los documentos listos para imprimir o exportar a PDF con el logo y términos legales de tu empresa.",
                color: "secondary"
              },
            ].map((f, i) => (
              <div key={i} className="col-md-6 col-lg-4">
                <div className="card h-100 border-0 shadow-sm bg-light feature-card hover-lift transition-all">
                  <div className="card-body p-4 p-xl-5">
                    <div className={`icon-box bg-${f.color} bg-opacity-10 text-${f.color} rounded-circle d-flex align-items-center justify-content-center mb-4`} style={{width: '64px', height: '64px'}}>
                       <i className={`bi ${f.icon} fs-3`}></i>
                    </div>
                    <h5 className="fw-bold mb-3">{f.title}</h5>
                    <p className="text-muted mb-0">{f.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Planes y Precios */}
      <section id="planes" className="py-6 bg-light border-top border-bottom">
         <div className="container py-5">
            <div className="text-center mb-5">
               <span className="text-primary fw-bold tracking-widest text-uppercase small">Precios Claros</span>
               <h2 className="fw-bold display-6 mt-2 mb-3">Planes diseñados para tu crecimiento</h2>
               <p className="text-muted fs-5">Paga solo por lo que necesitas. Sin contratos a largo plazo.</p>
            </div>

            <div className="row g-4 justify-content-center align-items-center mt-3">
               {/* Tier 1: Básicol */}
               <div className="col-lg-4 col-md-6">
                  <div className="card border-0 shadow-sm h-100 hover-lift relative overflow-hidden">
                     <div className="card-body p-5">
                        <h4 className="fw-bold text-muted">Emprendedor</h4>
                        <div className="my-4">
                           <span className="display-4 fw-bold">$0</span>
                           <span className="text-muted">/mes</span>
                        </div>
                        <p className="text-muted mb-4">Para talleres independientes o técnicos que recién inician.</p>
                        <ul className="list-unstyled mb-5 d-flex flex-column gap-3">
                           <li><i className="bi bi-check-circle-fill text-success me-2"></i> 1 Usuario Admin</li>
                           <li><i className="bi bi-check-circle-fill text-success me-2"></i> 50 Recepciones al mes</li>
                           <li><i className="bi bi-check-circle-fill text-success me-2"></i> Presupuestos básicos</li>
                           <li><i className="bi bi-check-circle-fill text-success me-2"></i> Soporte por email</li>
                        </ul>
                        <Link to="/register-company?plan=1" className="btn btn-outline-primary w-100 rounded-pill py-2 fw-semibold mt-auto">Comienza Gratis</Link>
                     </div>
                  </div>
               </div>

               {/* Tier 2: Pro (Destacado) */}
               <div className="col-lg-4 col-md-6">
                  <div className="card border-primary shadow-lg h-100 hover-lift relative overflow-hidden transform-scale-lg z-3">
                     <div className="bg-primary text-white text-center py-2 fw-bold small text-uppercase tracking-wider">
                        Más Popular
                     </div>
                     <div className="card-body p-5">
                        <h4 className="fw-bold text-primary">Profesional</h4>
                        <div className="my-4">
                           <span className="display-4 fw-bold">$29</span>
                           <span className="text-muted">/mes</span>
                        </div>
                        <p className="text-muted mb-4">Ideal para talleres establecidos con un equipo de trabajo.</p>
                        <ul className="list-unstyled mb-5 d-flex flex-column gap-3">
                           <li><i className="bi bi-check-circle-fill text-primary me-2"></i> Hasta 5 Usuarios Técnicos</li>
                           <li><i className="bi bi-check-circle-fill text-primary me-2"></i> Recepciones ilimitadas</li>
                           <li><i className="bi bi-check-circle-fill text-primary me-2"></i> Personalización de PDFs</li>
                           <li><i className="bi bi-check-circle-fill text-primary me-2"></i> Historial de Auditoría</li>
                           <li><i className="bi bi-check-circle-fill text-primary me-2"></i> Soporte prioritario</li>
                        </ul>
                        <Link to="/register-company?plan=2" className="btn btn-primary w-100 rounded-pill py-2 px-4 fw-bold shadow-sm mt-auto">Comenzar Prueba Gratis</Link>
                     </div>
                  </div>
               </div>

               {/* Tier 3: Enterprise */}
               <div className="col-lg-4 col-md-6">
                  <div className="card border-0 shadow-sm h-100 hover-lift relative flex-column d-flex">
                     <div className="card-body p-5 flex-grow-1 d-flex flex-column">
                        <h4 className="fw-bold text-dark">Empresarial</h4>
                        <div className="my-4">
                           <span className="display-4 fw-bold">$89</span>
                           <span className="text-muted">/mes</span>
                        </div>
                        <p className="text-muted mb-4">Múltiples sucursales, API de acceso y reportes avanzados.</p>
                        <ul className="list-unstyled mb-5 d-flex flex-column gap-3">
                           <li><i className="bi bi-check-circle-fill text-dark me-2"></i> Usuarios Ilimitados</li>
                           <li><i className="bi bi-check-circle-fill text-dark me-2"></i> Gestión Multi-Sucursal</li>
                           <li><i className="bi bi-check-circle-fill text-dark me-2"></i> Acceso a API REST</li>
                           <li><i className="bi bi-check-circle-fill text-dark me-2"></i> Integraciones personalizadas</li>
                           <li><i className="bi bi-check-circle-fill text-dark me-2"></i> Manager de cuenta dedicado</li>
                        </ul>
                        <Link to="/register-company?plan=3" className="btn btn-outline-dark w-100 rounded-pill py-2 fw-semibold mt-auto">Comenzar Empresa</Link>
                     </div>
                  </div>
               </div>
            </div>
         </div>
      </section>

      {/* CTA Final */}
      <section className="py-6 bg-primary text-white text-center position-relative overflow-hidden" style={{ minHeight: '300px' }}>
         <div className="position-absolute shape-blob opacity-25 bg-white rounded-circle" style={{ width: '300px', height: '300px', top: '-50%', left: '10%', filter: 'blur(40px)' }}></div>
         <div className="container position-relative z-1 py-5">
          <h2 className="display-5 fw-bold mb-4">¿Listo para llevar tu taller al siguiente nivel?</h2>
          <p className="fs-5 mb-5 opacity-75">Configuración en 2 minutos. Sin tarjeta de crédito requerida.</p>
          <Link to="/register-company" className="btn btn-light text-primary btn-lg fw-bold px-5 py-3 rounded-pill shadow-lg hover-lift">
            Crear Empresa Ahora <i className="bi bi-arrow-right ms-2"></i>
          </Link>
        </div>
      </section>

      {/* Footer minimalista */}
      <footer className="bg-dark text-light py-5">
         <div className="container">
            <div className="row g-4 align-items-center">
               <div className="col-md-6 text-center text-md-start">
                  <div className="d-flex align-items-center justify-content-center justify-content-md-start gap-2 mb-2">
                     <i className="bi bi-tools text-primary fs-4"></i>
                     <span className="fs-5 fw-bold">AppTaller</span>
                  </div>
                  <small className="opacity-50">&copy; {new Date().getFullYear()} Software Multi-Tenant para Talleres.</small>
               </div>
               <div className="col-md-6 text-center text-md-end">
                  <div className="d-flex gap-3 justify-content-center justify-content-md-end opacity-75">
                     <a href="#" className="text-light text-decoration-none hover-opacity">Términos</a>
                     <a href="#" className="text-light text-decoration-none hover-opacity">Privacidad</a>
                     <a href="#" className="text-light text-decoration-none hover-opacity">Contacto</a>
                  </div>
               </div>
            </div>
         </div>
      </footer>
    </div>
  );
}
