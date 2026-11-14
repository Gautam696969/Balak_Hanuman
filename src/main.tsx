import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { MatchProvider } from './context/MatchContext';
import './index.css';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <MatchProvider>
      <App />
    </MatchProvider>
  </React.StrictMode>
);

