const defaultApiUrl = 'http://localhost:3000/api/v1'

export const appConfig = {
  apiUrl: import.meta.env.VITE_API_URL || defaultApiUrl,
} as const
