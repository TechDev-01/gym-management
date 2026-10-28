import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import './landing.css'

interface Plan {
  name: string
  description: string
  price: string
  highlighted?: boolean
  features: string[]
}

const plans: Plan[] = [
  {
    name: 'Starter',
    description: 'Para gimnasios que están dando el siguiente paso.',
    price: '$29',
    features: ['Hasta 150 clientes', 'Membresías y asistencia', 'Panel operativo básico'],
  },
  {
    name: 'Growth',
    description: 'Todo lo necesario para crecer con orden.',
    price: '$59',
    highlighted: true,
    features: ['Hasta 500 clientes', 'Pagos y renovaciones', 'Rutinas, progreso y reportes'],
  },
  {
    name: 'Scale',
    description: 'Control completo para equipos y sedes.',
    price: '$99',
    features: ['Clientes ilimitados', 'Estadísticas avanzadas', 'Soporte prioritario'],
  },
]

const features = [
  { number: '01', title: 'Clientes y entrenadores', text: 'Toda la información de tu equipo y tus socios, organizada y disponible en segundos.' },
  { number: '02', title: 'Membresías y pagos', text: 'Controla planes, renovaciones y pagos sin perseguir hojas de cálculo.' },
  { number: '03', title: 'Asistencia inteligente', text: 'Registra cada ingreso y entiende los hábitos de tus clientes.' },
  { number: '04', title: 'Rutinas y progreso', text: 'Crea planes de entrenamiento y mide la evolución que mantiene motivados a tus socios.' },
  { number: '05', title: 'Horarios del equipo', text: 'Coordina la disponibilidad de entrenadores y asigna mejor tu operación.' },
  { number: '06', title: 'Decisiones con datos', text: 'Visualiza las métricas importantes desde un panel claro y accionable.' },
]

export function LandingPage() {
  const [darkMode, setDarkMode] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitted(true)
  }

  return (
    <div className={`landing ${darkMode ? 'landing-dark' : ''}`}>
      <header className="landing-header">
        <a className="landing-brand" href="#inicio" aria-label="IronPulse, inicio">
          <span className="landing-brand-mark">I</span>
          <span>Iron<span>Pulse</span></span>
        </a>
        <nav className="landing-nav" aria-label="Navegación principal">
          <a href="#funciones">Funciones</a>
          <a href="#planes">Planes</a>
          <a href="#contacto">Contacto</a>
        </nav>
        <div className="landing-header-actions">
          <button className="theme-toggle" type="button" onClick={() => setDarkMode((current) => !current)} aria-label="Cambiar tema">
            {darkMode ? '☼' : '☾'}
          </button>
          <Link className="landing-button landing-button-small landing-button-primary" to="/login">Iniciar sesión</Link>
        </div>
      </header>

      <main id="inicio">
        <section className="landing-hero landing-container">
          <div className="landing-hero-copy">
            <p className="landing-kicker">Software de gestión para gimnasios</p>
            <h1>Haz crecer tu gimnasio. <em>Controla todo lo demás.</em></h1>
            <p className="landing-lead">IronPulse reúne clientes, membresías, pagos, asistencia y rutinas en un solo lugar para que puedas enfocarte en hacer crecer tu comunidad.</p>
            <div className="landing-actions">
              <a className="landing-button landing-button-primary" href="#contacto">Solicitar una demo <span>↗</span></a>
              <a className="landing-button landing-button-ghost" href="#funciones">Ver funciones</a>
            </div>
            <p className="landing-note">Para administradores, entrenadores y equipos que quieren trabajar mejor.</p>
          </div>
          <DashboardPreview />
        </section>

        <section className="landing-trust landing-container" aria-label="Beneficios principales">
          <span>Una operación más clara empieza aquí</span>
          <div><strong>Clientes</strong><strong>Pagos</strong><strong>Asistencia</strong><strong>Progreso</strong></div>
        </section>

        <section className="landing-section landing-container" id="funciones">
          <div className="landing-section-heading">
            <p className="landing-kicker">Todo en un solo lugar</p>
            <h2>La operación de tu gimnasio, <em>sin fricción.</em></h2>
          </div>
          <div className="feature-grid">
            {features.map((feature) => (
              <article className="feature-card" key={feature.number}>
                <span className="feature-number">{feature.number}</span>
                <h3>{feature.title}</h3>
                <p>{feature.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="landing-process landing-container">
          <div className="landing-section-heading">
            <p className="landing-kicker">Empieza en tres pasos</p>
            <h2>Menos administración. <em>Más impulso.</em></h2>
          </div>
          <div className="process-grid">
            <div><b>01</b><h3>Registra tu gimnasio</h3><p>Organiza tus socios, entrenadores y planes desde el primer día.</p></div>
            <div><b>02</b><h3>Configura tu operación</h3><p>Define membresías, horarios y la forma en que trabaja tu equipo.</p></div>
            <div><b>03</b><h3>Gestiona desde el panel</h3><p>Consulta ingresos, asistencia y progreso con información clara.</p></div>
          </div>
        </section>

        <section className="landing-section landing-container" id="planes">
          <div className="landing-section-heading landing-section-heading-centered">
            <p className="landing-kicker">Planes provisionales</p>
            <h2>Elige el ritmo de tu <em>crecimiento.</em></h2>
            <p>Comienza con lo esencial y escala cuando tu gimnasio esté listo.</p>
          </div>
          <div className="plans-grid">
            {plans.map((plan) => (
              <article className={`plan-card ${plan.highlighted ? 'plan-card-highlighted' : ''}`} key={plan.name}>
                {plan.highlighted && <span className="plan-badge">Más elegido</span>}
                <h3>{plan.name}</h3>
                <p>{plan.description}</p>
                <div className="plan-price"><strong>{plan.price}</strong><span>/ mes</span></div>
                <ul>{plan.features.map((feature) => <li key={feature}>✓ {feature}</li>)}</ul>
                <a className={`landing-button ${plan.highlighted ? 'landing-button-primary' : 'landing-button-ghost'}`} href="#contacto">Quiero conocerlo</a>
              </article>
            ))}
          </div>
          <p className="landing-disclaimer">Precios de referencia para la primera versión comercial. La cotización final puede variar según las necesidades de cada gimnasio.</p>
        </section>

        <section className="landing-contact landing-container" id="contacto">
          <div className="contact-copy">
            <p className="landing-kicker">Hablemos de tu gimnasio</p>
            <h2>Tu próxima etapa empieza con una conversación.</h2>
            <p>Cuéntanos qué necesitas y te mostraremos cómo IronPulse puede adaptarse a tu operación.</p>
            <div className="contact-points"><span>✓ Demo personalizada</span><span>✓ Sin compromiso</span><span>✓ Respuesta rápida</span></div>
          </div>
          <form className="contact-form" onSubmit={handleSubmit}>
            {submitted ? (
              <div className="form-success" role="status"><span>✓</span><h3>¡Solicitud recibida!</h3><p>Gracias por escribirnos. Te contactaremos pronto para coordinar la demostración.</p><button className="landing-button landing-button-ghost" type="button" onClick={() => setSubmitted(false)}>Enviar otra solicitud</button></div>
            ) : (
              <>
                <label>Nombre<input name="name" required placeholder="Tu nombre" /></label>
                <label>Correo electrónico<input name="email" type="email" required placeholder="tu@correo.com" /></label>
                <label>Nombre del gimnasio<input name="gym" required placeholder="Gimnasio Iron" /></label>
                <label>¿Cómo podemos ayudarte?<textarea name="message" rows={3} required placeholder="Cuéntanos brevemente sobre tu gimnasio" /></label>
                <button className="landing-button landing-button-primary" type="submit">Solicitar demo <span>↗</span></button>
              </>
            )}
          </form>
        </section>
      </main>

      <footer className="landing-footer landing-container">
        <a className="landing-brand" href="#inicio"><span className="landing-brand-mark">I</span><span>Iron<span>Pulse</span></span></a>
        <span>Gestión con impulso.</span>
        <Link to="/login">Acceder al sistema ↗</Link>
        <small>© 2026 IronPulse</small>
      </footer>
    </div>
  )
}

function DashboardPreview() {
  return (
    <div className="dashboard-preview" aria-label="Vista previa del dashboard de IronPulse">
      <div className="preview-topbar"><span className="preview-dots">● ● ●</span><span>Dashboard / Resumen</span><span className="preview-avatar">IR</span></div>
      <div className="preview-content"><div className="preview-heading"><div><small>RESUMEN DE OPERACIÓN</small><h2>Hola, equipo Iron.</h2></div><span className="preview-period">Este mes⌄</span></div>
        <div className="preview-kpis"><div><span>Clientes activos</span><strong>1,248</strong><small>↑ 12.4%</small></div><div><span>Ingresos del mes</span><strong>$18.6k</strong><small>↑ 8.2%</small></div><div><span>Asistencias hoy</span><strong>312</strong><small>↑ 5.1%</small></div></div>
        <div className="preview-panels"><div className="preview-chart"><div className="preview-panel-title"><b>Asistencia semanal</b><span>Últimos 7 días</span></div><div className="bars"><i /><i /><i /><i className="active" /><i /><i /><i /></div><div className="bar-labels"><span>Lun</span><span>Mar</span><span>Mié</span><span>Jue</span><span>Vie</span><span>Sáb</span><span>Dom</span></div></div><div className="preview-activity"><div className="preview-panel-title"><b>Actividad reciente</b><span>Ver todo</span></div><p><i className="activity-dot violet" />Pago recibido <small>Hace 8 min</small></p><p><i className="activity-dot green" />Nuevo cliente <small>Hace 24 min</small></p><p><i className="activity-dot orange" />Renovación pendiente <small>Hace 1 h</small></p></div></div>
      </div>
    </div>
  )
}
