import React, { useState, useEffect } from 'react';
import axios from 'axios';
import washerImg from '../assets/washer.jpg';

const LoginForm = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [wsMessage, setWsMessage] = useState('');
  const [wsConnected, setWsConnected] = useState(false);

  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api/v1';

  // ✅ Check server connection
  useEffect(() => {
    let retryCount = 0;
    const maxRetries = 3;
    const retryDelay = 5000;
    let interval;

    const checkServerStatus = async () => {
      if (wsConnected) return;
      try {
        const res = await axios.get(`${API_BASE_URL}/status`, { timeout: 5000 });
        setWsMessage(`✅ Server connected: ${res.data.status || 'OK'}`);
        setWsConnected(true);
        setError('');
        retryCount = 0;
      } catch (err) {
        if (err.response?.status === 404) {
          setWsMessage('⚠️ Server up, but /status endpoint not found.');
          setWsConnected(true);
          setError('');
        } else {
          handleConnectionFailure(err);
        }
      }
    };

    const handleConnectionFailure = (err) => {
      if (err.code === 'ERR_NETWORK' || err.response?.status === 0) {
        setWsMessage('❌ Network error: Check backend CORS or if server is running.');
      } else if (retryCount < maxRetries) {
        retryCount++;
        setWsMessage(`Retrying (${retryCount}/${maxRetries})...`);
        setTimeout(checkServerStatus, retryDelay);
      } else {
        setWsMessage('🚫 Cannot connect to server.');
        setWsConnected(false);
        setError('Network error: Server unreachable.');
      }
    };

    checkServerStatus();
    if (!wsConnected) interval = setInterval(checkServerStatus, 30000);
    return () => clearInterval(interval);
  }, [API_BASE_URL, wsConnected]);

  // ✅ Email validation
  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  // ✅ Toggle login/register mode
  const toggleMode = () => {
    setIsRegistering(!isRegistering);
    setError('');
    setEmail('');
    setPassword('');
    setName('');
    setConfirmPassword('');
  };

  // ✅ Form submit handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!email || !password || (isRegistering && (!name || !confirmPassword))) {
      setError('All fields are required.');
      setLoading(false);
      return;
    }
    if (!validateEmail(email)) {
      setError('Invalid email format.');
      setLoading(false);
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      setLoading(false);
      return;
    }
    if (isRegistering && password !== confirmPassword) {
      setError('Passwords do not match.');
      setLoading(false);
      return;
    }

    const url = isRegistering
      ? `${API_BASE_URL}/user/register`
      : `${API_BASE_URL}/user/login`;

    const payload = isRegistering
      ? { email: email.trim(), password: password.trim(), name: name.trim(), confirmPassword: confirmPassword.trim() }
      : { email: email.trim(), password: password.trim() };

    try {
      const response = await axios.post(url, payload, {
        withCredentials: true,
        timeout: 10000,
        headers: { 'Content-Type': 'application/json' },
      });

      const data = response.data;
      if (isRegistering) {
        alert('✅ Registration successful! Please log in.');
        toggleMode();
      } else if (data.data?.accessToken) {
        localStorage.setItem('token', data.data.accessToken);
        onLoginSuccess(data.data.accessToken);
      } else {
        setError('Login failed: No token received.');
      }
    } catch (err) {
      if (err.response?.status === 500) setError('Server error: Check backend logs.');
      else if (err.response?.status === 400) setError(err.response.data.message || 'Invalid input.');
      else if (err.code === 'ERR_NETWORK') setError('Network error: Server unreachable.');
      else if (err.response?.status === 0) setError('CORS error: Request blocked.');
      else if (err.response?.status === 404) setError('Endpoint not found.');
      else setError(err.response?.data?.message || 'Request failed.');
    } finally {
      setLoading(false);
    }
  };

  // ✅ Styles
  const backgroundStyle = {
    backgroundImage: `url(${washerImg})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    height: '100vh',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  };

  const formStyle = {
    backgroundColor: 'rgba(255,255,255,0.95)',
    padding: '2rem 3rem',
    borderRadius: '12px',
    boxShadow: '0 0 20px rgba(0,0,0,0.3)',
    width: '400px',
    maxWidth: '95%',
    textAlign: 'center',
  };

  const inputStyle = {
    width: '100%',
    padding: '12px',
    margin: '12px 0',
    borderRadius: '6px',
    border: '1px solid #ccc',
    fontSize: '1rem',
    boxSizing: 'border-box',
  };

  const buttonStyle = {
    width: '100%',
    padding: '12px',
    backgroundColor: '#007bff',
    color: 'white',
    fontSize: '1.1rem',
    border: 'none',
    borderRadius: '6px',
    cursor: loading ? 'not-allowed' : 'pointer',
    opacity: loading ? 0.6 : 1,
    transition: 'opacity 0.2s',
  };

  const errorStyle = { color: '#d32f2f', margin: '10px 0', fontSize: '0.9rem' };
  const wsMessageStyle = { color: wsConnected ? '#2e7d32' : '#d32f2f', margin: '10px 0', fontSize: '0.9rem' };
  const toggleLinkStyle = { marginTop: '12px', cursor: 'pointer', color: '#007bff', fontSize: '0.9rem', textDecoration: 'underline' };

  // ✅ Render
  return (
    <div style={backgroundStyle}>
      <form onSubmit={handleSubmit} style={formStyle}>
        <h2 style={{ fontSize: '1.8rem', marginBottom: '1.5rem' }}>
          {isRegistering ? 'Register' : 'Login'}
        </h2>

        {isRegistering && (
          <input
            type="text"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={inputStyle}
            required
            disabled={loading}
            autoComplete="name"
          />
        )}

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={inputStyle}
          required
          disabled={loading}
          autoComplete="email"
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={inputStyle}
          required
          disabled={loading}
          autoComplete="current-password"
        />

        {isRegistering && (
          <input
            type="password"
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            style={inputStyle}
            required
            disabled={loading}
            autoComplete="new-password"
          />
        )}

        {error && <p style={errorStyle}>{error}</p>}
        {wsMessage && <p style={wsMessageStyle}>{wsMessage}</p>}

        <button type="submit" style={buttonStyle} disabled={loading || !wsConnected}>
          {loading
            ? isRegistering
              ? 'Registering...'
              : 'Logging in...'
            : isRegistering
              ? 'Register'
              : 'Login'}
        </button>

        <p style={toggleLinkStyle} onClick={toggleMode}>
          {isRegistering
            ? 'Already have an account? Login'
            : 'No account? Register'}
        </p>
      </form>
    </div>
  );
};

export default LoginForm;
