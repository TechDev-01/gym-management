import { login } from './api'

const app = document.querySelector<HTMLElement>('#app')

if (!app) {
  throw new Error('App root element was not found')
}

app.innerHTML = `
  <h1>Gym Management</h1>
  <p>Frontend inicial conectado a la API.</p>
  <form id="login-form">
    <label>
      Email
      <input name="email" type="email" required />
    </label>
    <label>
      Contraseña
      <input name="password" type="password" required />
    </label>
    <button type="submit">Iniciar sesión</button>
    <p id="login-status" role="status"></p>
  </form>
`

const form = document.querySelector<HTMLFormElement>('#login-form')
const status = document.querySelector<HTMLElement>('#login-status')

form?.addEventListener('submit', async (event) => {
  event.preventDefault()
  if (!status || !form) return

  const data = new FormData(form)
  status.textContent = 'Iniciando sesión...'

  try {
    const result = await login(String(data.get('email')), String(data.get('password')))
    sessionStorage.setItem('gym_access_token', result.accessToken)
    status.textContent = `Sesión iniciada como ${result.user.role}`
  } catch (error: unknown) {
    status.textContent = error instanceof Error ? error.message : 'Error inesperado'
  }
})
