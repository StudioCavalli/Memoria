import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';

interface Props {
  children: React.ReactNode;
}

const navItems = [
  { to: '/', label: 'Accueil', icon: '⌂' },
  { to: '/memories', label: 'Souvenirs', icon: '♡' },
  { to: '/alerts', label: 'Alertes', icon: '⚠' },
  { to: '/gazettes', label: 'Gazettes', icon: '✉' },
  { to: '/metrics', label: 'Suivi cognitif', icon: '↗' },
  { to: '/settings', label: 'Paramètres', icon: '⚙' },
];

const Layout: React.FC<Props> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('memoria_token');
    localStorage.removeItem('memoria_refresh');
    navigate('/login');
  };

  return (
    <div style={styles.wrapper}>
      {/* Mobile header */}
      <header style={styles.mobileHeader}>
        <button
          style={styles.hamburger}
          onClick={() => setSidebarOpen(!sidebarOpen)}
          aria-label="Menu"
        >
          {sidebarOpen ? '✕' : '☰'}
        </button>
        <h1 style={styles.logoSmall}>Memoria</h1>
      </header>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          style={styles.overlay}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        style={{
          ...styles.sidebar,
          ...(sidebarOpen ? styles.sidebarOpen : {}),
        }}
      >
        <div style={styles.logoContainer}>
          <h1 style={styles.logo}>Memoria</h1>
          <p style={styles.tagline}>Préserver les souvenirs</p>
        </div>

        <nav style={styles.nav}>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              onClick={() => setSidebarOpen(false)}
              style={({ isActive }) => ({
                ...styles.navLink,
                ...(isActive ? styles.navLinkActive : {}),
              })}
            >
              <span style={styles.navIcon}>{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <button style={styles.logoutBtn} onClick={handleLogout}>
          Déconnexion
        </button>
      </aside>

      {/* Main content */}
      <main style={styles.main}>
        {children}
      </main>
    </div>
  );
};

/* ---------- Inline styles (warm palette) ---------- */

const COLORS = {
  warmCream: '#FFF8F0',
  warmBeige: '#F5E6D3',
  warmBrown: '#8B6F47',
  warmBrownDark: '#6B5235',
  warmOrange: '#E8A87C',
  warmRose: '#D4A5A5',
  warmGreen: '#7FB069',
  textDark: '#3D2C1E',
  textMuted: '#7A6555',
  white: '#FFFFFF',
  sidebarBg: '#FAF0E4',
};

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    display: 'flex',
    minHeight: '100vh',
    backgroundColor: COLORS.warmCream,
    fontFamily: "'Nunito', sans-serif",
    color: COLORS.textDark,
  },
  mobileHeader: {
    display: 'none',
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    height: 56,
    backgroundColor: COLORS.white,
    borderBottom: `1px solid ${COLORS.warmBeige}`,
    alignItems: 'center',
    padding: '0 16px',
    zIndex: 100,
    gap: 12,
  },
  hamburger: {
    background: 'none',
    border: 'none',
    fontSize: 24,
    cursor: 'pointer',
    color: COLORS.warmBrown,
    padding: 4,
  },
  logoSmall: {
    fontFamily: "'Merriweather', serif",
    fontSize: 20,
    color: COLORS.warmBrown,
    margin: 0,
  },
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    zIndex: 199,
  },
  sidebar: {
    width: 260,
    minWidth: 260,
    backgroundColor: COLORS.sidebarBg,
    borderRight: `1px solid ${COLORS.warmBeige}`,
    display: 'flex',
    flexDirection: 'column',
    padding: '24px 16px',
    position: 'sticky',
    top: 0,
    height: '100vh',
    overflowY: 'auto',
    transition: 'transform 0.3s ease',
    zIndex: 200,
  },
  sidebarOpen: {
    transform: 'translateX(0)',
  },
  logoContainer: {
    marginBottom: 32,
    textAlign: 'center',
  },
  logo: {
    fontFamily: "'Merriweather', serif",
    fontSize: 28,
    color: COLORS.warmBrown,
    margin: 0,
  },
  tagline: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  nav: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    flex: 1,
  },
  navLink: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '12px 16px',
    borderRadius: 10,
    textDecoration: 'none',
    color: COLORS.textDark,
    fontSize: 15,
    fontWeight: 600,
    transition: 'background 0.2s',
  },
  navLinkActive: {
    backgroundColor: COLORS.warmOrange + '33',
    color: COLORS.warmBrownDark,
  },
  navIcon: {
    fontSize: 18,
    width: 24,
    textAlign: 'center',
  },
  logoutBtn: {
    marginTop: 16,
    padding: '10px 16px',
    border: `1px solid ${COLORS.warmBeige}`,
    borderRadius: 8,
    backgroundColor: 'transparent',
    color: COLORS.textMuted,
    cursor: 'pointer',
    fontSize: 14,
    fontFamily: "'Nunito', sans-serif",
    fontWeight: 600,
  },
  main: {
    flex: 1,
    padding: '32px 40px',
    maxWidth: 1200,
    width: '100%',
  },
};

// Inject responsive CSS via a style tag once
if (typeof document !== 'undefined') {
  const id = 'memoria-layout-responsive';
  if (!document.getElementById(id)) {
    const style = document.createElement('style');
    style.id = id;
    style.textContent = `
      @media (max-width: 768px) {
        header[style] { display: flex !important; }
        aside[style] {
          position: fixed !important;
          top: 0 !important;
          left: 0 !important;
          bottom: 0 !important;
          transform: translateX(-100%) !important;
          height: 100vh !important;
        }
        main[style] {
          padding: 72px 16px 24px !important;
        }
      }
    `;
    document.head.appendChild(style);
  }
}

export default Layout;
