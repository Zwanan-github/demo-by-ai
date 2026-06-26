import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './styles.css';
import { AppShell } from './AppShell';

function App() {
  return <BrowserRouter><AppShell /></BrowserRouter>;
}

createRoot(document.getElementById('root')!).render(<App />);
