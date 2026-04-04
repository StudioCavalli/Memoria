import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import MemoriesPage from './pages/MemoriesPage';
import AlertsPage from './pages/AlertsPage';
import GazettesPage from './pages/GazettesPage';
import MetricsPage from './pages/MetricsPage';
import SettingsPage from './pages/SettingsPage';

/* ---------- Global reset ---------- */
if (typeof document !== 'undefined') {
  const id = 'memoria-global-styles';
  if (!document.getElementById(id)) {
    const style = document.createElement('style');
    style.id = id;
    style.textContent = `
      *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
      body {
        font-family: 'Nunito', sans-serif;
        background: #FFF8F0;
        color: #3D2C1E;
        -webkit-font-smoothing: antialiased;
      }
      a { color: inherit; }
    `;
    document.head.appendChild(style);
  }
}

const Guarded: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ProtectedRoute>
    <Layout>{children}</Layout>
  </ProtectedRoute>
);

const App: React.FC = () => (
  <Routes>
    <Route path="/login" element={<LoginPage />} />
    <Route path="/" element={<Guarded><DashboardPage /></Guarded>} />
    <Route path="/memories" element={<Guarded><MemoriesPage /></Guarded>} />
    <Route path="/alerts" element={<Guarded><AlertsPage /></Guarded>} />
    <Route path="/gazettes" element={<Guarded><GazettesPage /></Guarded>} />
    <Route path="/metrics" element={<Guarded><MetricsPage /></Guarded>} />
    <Route path="/settings" element={<Guarded><SettingsPage /></Guarded>} />
  </Routes>
);

export default App;
