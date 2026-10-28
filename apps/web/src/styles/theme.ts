import { createTheme } from '@mui/material/styles'

export const appTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#8d5cf6' },
    background: { default: '#0d111b', paper: '#151c2a' },
  },
  shape: { borderRadius: 3 },
  typography: { fontFamily: '"DM Sans", sans-serif' },
})
