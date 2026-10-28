import { createTheme } from '@mui/material/styles'

export const appTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#8d5cf6', light: '#aa7cff', dark: '#30254f' },
    success: { main: '#55c791', light: '#55c791', dark: '#1d4938' },
    warning: { main: '#f1a652', light: '#f1a652', dark: '#49351f' },
    info: { main: '#59c4df', light: '#59c4df', dark: '#193d4a' },
    background: { default: '#0d111b', paper: '#151c2a' },
    divider: '#252e42',
  },
  shape: { borderRadius: 3 },
  typography: {
    fontFamily: '"DM Sans", sans-serif',
    body1: { fontSize: '0.95rem' },
    body2: { fontSize: '0.875rem' },
    caption: { fontSize: '0.75rem' },
    h4: { fontFamily: '"Space Grotesk", sans-serif', fontWeight: 600 },
    h5: { fontFamily: '"Space Grotesk", sans-serif', fontWeight: 600 },
    h6: { fontFamily: '"Space Grotesk", sans-serif', fontWeight: 600, fontSize: '1.05rem' },
  },
  components: {
    MuiCard: { styleOverrides: { root: { border: '1px solid #252e42', boxShadow: '0 3px 12px #00000018' } } },
    MuiButton: { defaultProps: { disableElevation: true }, styleOverrides: { root: { textTransform: 'none', borderRadius: 3, fontSize: 13 } } },
    MuiChip: { styleOverrides: { root: { borderRadius: 3 } } },
    MuiTableCell: { styleOverrides: { root: { borderColor: '#252e42', color: '#aab3c4', fontSize: 12, padding: '13px 10px' }, head: { color: '#aab3c4', fontSize: 11, fontWeight: 600, letterSpacing: '.04em' } }, },
    MuiListItemText: { styleOverrides: { primary: { fontSize: 14 } } },
  },
})
