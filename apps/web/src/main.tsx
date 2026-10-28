import ReactDOM from 'react-dom/client'
import { App } from './app/App'
import './styles.css'

const root = document.querySelector<HTMLElement>('#app')

if (!root) {
  throw new Error('App root element was not found')
}

ReactDOM.createRoot(root).render(<App />)
