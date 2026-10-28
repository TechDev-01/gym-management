import { useState } from 'react'

const navigationItems = [
  ['⌂', 'Dashboard'],
  ['♙', 'Clientes'],
  ['◈', 'Membresías'],
  ['◷', 'Asistencia'],
  ['◒', 'Rutinas'],
  ['▥', 'Estadísticas'],
] as const

const renewals = [
  ['CM', 'Carla Mendoza', 'Premium · vence en 2 días', '$89', 'avatar-pink'],
  ['JP', 'Jorge Pérez', 'Gold · vence en 3 días', '$59', 'avatar-yellow'],
  ['SL', 'Sofía López', 'Premium · vence en 5 días', '$89', 'avatar-cyan'],
  ['DG', 'Diego García', 'Basic · vence en 6 días', '$39', 'avatar-purple'],
] as const

export function DashboardPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="app-shell">
      <aside className={`sidebar${sidebarOpen ? ' open' : ''}`}>
        <div className="brand">
          <span className="brand-mark">G</span>
          <span>
            Gym<span className="brand-accent">Flow</span>
          </span>
        </div>
        <nav className="navigation" aria-label="Navegación principal">
          <p className="nav-label">Workspace</p>
          {navigationItems.map(([icon, label], index) => (
            <a className={`nav-item${index === 0 ? ' active' : ''}`} href={`#${label.toLowerCase()}`} key={label}>
              <span>{icon}</span>
              {label}
              {label === 'Clientes' && <b>124</b>}
            </a>
          ))}
          <p className="nav-label nav-label-spaced">Sistema</p>
          <a className="nav-item" href="#settings">
            <span>⚙</span>
            Configuración
          </a>
        </nav>
        <div className="sidebar-footer">
          <div className="help-card">
            <span className="help-icon">?</span>
            <strong>¿Necesitas ayuda?</strong>
            <small>Consulta la documentación</small>
          </div>
          <button className="user-card" type="button">
            <span className="avatar">AR</span>
            <span>
              <strong>Alex Rivera</strong>
              <small>Administrador</small>
            </span>
            <span className="user-more">•••</span>
          </button>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <button className="mobile-menu" type="button" aria-label="Abrir menú" onClick={() => setSidebarOpen((open) => !open)}>
            ☰
          </button>
          <div className="search-box">
            <span>⌕</span>
            <input aria-label="Buscar" placeholder="Buscar clientes, rutinas..." />
          </div>
          <div className="topbar-actions">
            <button className="icon-button" aria-label="Notificaciones" type="button">
              ♢<i />
            </button>
            <span className="topbar-date">Martes, 27 de octubre de 2026</span>
          </div>
        </header>

        <div className="content">
          <section className="page-heading">
            <div>
              <p className="eyebrow">Resumen general</p>
              <h1>
                Buenos días, Alex <span>✦</span>
              </h1>
              <p className="muted">Aquí tienes lo que está pasando hoy en tu gimnasio.</p>
            </div>
            <div className="heading-actions">
              <button className="button button-secondary" type="button">↓ Exportar</button>
              <button className="button button-primary" type="button">+ Nuevo cliente</button>
            </div>
          </section>

          <section className="kpi-grid" aria-label="Indicadores principales">
            <KpiCard icon="♙" color="purple" trend="+12.5%" label="Clientes activos" value="1,248" detail="vs. mes anterior" />
            <KpiCard icon="◈" color="orange" trend="+8.2%" label="Ingresos este mes" value="$24,680" detail="vs. mes anterior" />
            <KpiCard icon="◷" color="blue" trend="+4.8%" label="Asistencias hoy" value="186" detail="de 220 esperadas" />
            <KpiCard icon="↗" color="green" trend="14 pendientes" label="Renovaciones próximas" value="32" detail="en los próximos 7 días" warning />
          </section>

          <section className="dashboard-grid">
            <article className="panel attendance-panel">
              <PanelHeading title="Asistencia de hoy" subtitle="Ingresos registrados durante el día">
                <button className="text-button" type="button">Ver todo →</button>
              </PanelHeading>
              <div className="attendance-summary">
                <div className="donut"><span>84<small>%</small></span></div>
                <div>
                  <strong>186 check-ins</strong>
                  <p className="muted">de 220 miembros esperados</p>
                  <span className="status-dot green-dot" /> 84% de ocupación
                </div>
              </div>
              <div className="bar-chart">
                {[28, 40, 35, 52, 67, 48, 82, 61, 45, 32, 25, 20].map((height, index) => (
                  <span className={index === 6 ? 'current' : ''} key={height} style={{ height: `${height}%` }} />
                ))}
              </div>
              <div className="chart-labels"><span>6 AM</span><span>9 AM</span><span>12 PM</span><span>3 PM</span><span>6 PM</span><span>9 PM</span></div>
            </article>

            <article className="panel renewals-panel">
              <PanelHeading title="Renovaciones próximas" subtitle="Requieren atención esta semana">
                <button className="more-button" type="button">•••</button>
              </PanelHeading>
              <div className="renewal-list">
                {renewals.map(([initials, name, description, amount, color]) => (
                  <div className="renewal-item" key={name}>
                    <span className={`avatar ${color}`}>{initials}</span>
                    <span><strong>{name}</strong><small>{description}</small></span>
                    <b>{amount}</b>
                  </div>
                ))}
              </div>
              <button className="button button-full button-light" type="button">Ver todas las renovaciones</button>
            </article>
          </section>

          <section className="panel activity-panel">
            <PanelHeading title="Actividad reciente" subtitle="Últimas operaciones del sistema">
              <button className="filter-button" type="button">Últimos 7 días⌄</button>
            </PanelHeading>
            <div className="table-wrap">
              <table>
                <thead><tr><th>CLIENTE</th><th>ACTIVIDAD</th><th>FECHA</th><th>ESTADO</th><th /></tr></thead>
                <tbody>
                  <ActivityRow initials="CM" color="avatar-pink" name="Carla Mendoza" activity="Renovó su membresía Premium" date="Hoy, 10:42 AM" status="Completado" statusClass="success" />
                  <ActivityRow initials="JP" color="avatar-yellow" name="Jorge Pérez" activity="Registró asistencia" date="Hoy, 09:18 AM" status="Completado" statusClass="success" />
                  <ActivityRow initials="SL" color="avatar-cyan" name="Sofía López" activity="Pago pendiente generado" date="Ayer, 04:32 PM" status="Pendiente" statusClass="pending" />
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}

function KpiCard({ icon, color, trend, label, value, detail, warning = false }: { icon: string; color: string; trend: string; label: string; value: string; detail: string; warning?: boolean }) {
  return (
    <article className="kpi-card">
      <div className="kpi-top"><span className={`kpi-icon ${color}`}>{icon}</span><span className={`trend ${warning ? 'warning' : 'positive'}`}>{trend}</span></div>
      <p>{label}</p><strong>{value}</strong><small>{detail}</small>
    </article>
  )
}

function PanelHeading({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return <div className="panel-heading"><div><h2>{title}</h2><p className="muted">{subtitle}</p></div>{children}</div>
}

function ActivityRow({ initials, color, name, activity, date, status, statusClass }: { initials: string; color: string; name: string; activity: string; date: string; status: string; statusClass: string }) {
  return <tr><td><span className={`avatar avatar-small ${color}`}>{initials}</span><strong> {name}</strong></td><td>{activity}</td><td>{date}</td><td><span className={`pill ${statusClass}`}>{status}</span></td><td>•••</td></tr>
}
