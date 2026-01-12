import ReactDOM from 'react-dom/client';
import App from './App.tsx';

const rootElement = document.getElementById('root');

if (!rootElement) {
  const msg = "Could not find root element to mount to. Ensure index.html has a <div id='root'></div>";
  console.error(msg);
  throw new Error(msg);
}

const root = ReactDOM.createRoot(rootElement);
root.render(<App />);
