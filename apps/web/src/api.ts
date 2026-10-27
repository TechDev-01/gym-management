const apiBaseUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api/v1'

export interface LoginResponse {
  accessToken: string
  user: {
    id: string
    email: string
    role: string
    clientId: number | null
    coachId: number | null
  }
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  const response = await fetch(`${apiBaseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })

  if (!response.ok) {
    throw new Error('No fue posible iniciar sesión')
  }

  return response.json() as Promise<LoginResponse>
}
