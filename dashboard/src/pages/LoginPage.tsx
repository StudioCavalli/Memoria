import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { authService } from '../services/api';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await authService.login(email, password);
      localStorage.setItem('memoria_token', data.access_token);
      if (data.refresh_token) {
        localStorage.setItem('memoria_refresh', data.refresh_token);
      }
      if (data.senior_id) {
        localStorage.setItem('memoria_senior_id', data.senior_id);
      }
      navigate(from, { replace: true });
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data
          ?.detail || 'Identifiants incorrects. Veuillez réessayer.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.logo}>Memoria</h1>
        <p style={styles.subtitle}>
          Tableau de bord familial
        </p>

        {error && <div style={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit} style={styles.form}>
          <label style={styles.label}>
            Adresse e-mail
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={styles.input}
              placeholder="vous@exemple.fr"
            />
          </label>

          <label style={styles.label}>
            Mot de passe
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={styles.input}
              placeholder="••••••••"
            />
          </label>

          <button type="submit" disabled={loading} style={styles.button}>
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>

        <p style={styles.footer}>
          Pas encore de compte ?{' '}
          <a href="#" style={styles.link}>
            Contactez l'équipe Memoria
          </a>
        </p>
      </div>
    </div>
  );
};

const COLORS = {
  warmCream: '#FFF8F0',
  warmBrown: '#8B6F47',
  warmBrownDark: '#6B5235',
  warmOrange: '#E8A87C',
  warmBeige: '#F5E6D3',
  textDark: '#3D2C1E',
  textMuted: '#7A6555',
  errorBg: '#FDE8E8',
  errorText: '#B91C1C',
  white: '#FFFFFF',
};

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.warmCream,
    fontFamily: "'Nunito', sans-serif",
    padding: 16,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: '40px 32px',
    boxShadow: '0 4px 24px rgba(139,111,71,0.10)',
  },
  logo: {
    fontFamily: "'Merriweather', serif",
    fontSize: 36,
    color: COLORS.warmBrown,
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    textAlign: 'center',
    color: COLORS.textMuted,
    fontSize: 15,
    marginBottom: 28,
  },
  error: {
    backgroundColor: COLORS.errorBg,
    color: COLORS.errorText,
    padding: '10px 14px',
    borderRadius: 8,
    fontSize: 14,
    marginBottom: 16,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: 18,
  },
  label: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    fontSize: 14,
    fontWeight: 600,
    color: COLORS.textDark,
  },
  input: {
    padding: '12px 14px',
    borderRadius: 10,
    border: `1px solid ${COLORS.warmBeige}`,
    fontSize: 15,
    fontFamily: "'Nunito', sans-serif",
    outline: 'none',
    transition: 'border 0.2s',
    backgroundColor: COLORS.warmCream,
  },
  button: {
    marginTop: 8,
    padding: '14px',
    borderRadius: 10,
    border: 'none',
    backgroundColor: COLORS.warmBrown,
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 700,
    fontFamily: "'Nunito', sans-serif",
    cursor: 'pointer',
    transition: 'background 0.2s',
  },
  footer: {
    marginTop: 24,
    textAlign: 'center',
    fontSize: 13,
    color: COLORS.textMuted,
  },
  link: {
    color: COLORS.warmBrown,
    fontWeight: 700,
    textDecoration: 'underline',
  },
};

export default LoginPage;
