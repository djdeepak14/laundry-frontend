import React, { useState, useEffect } from 'react';
import axios from 'axios';
import washerImg from '../assets/washer.jpg';

const LoginForm = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [wsMessage, setWsMessage] = useState('');
  const [wsConnected, setWsConnected] = useState(false);

  // API and WebSocket URLs from environment variables
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://sevas-laundry-backend.onrender.com';
  const WS_BASE_URL = process.env.REACT_APP_WS_URL || 'wss://sevas-laundry-backend.onrender.com/ws';
  console.log('API URL:', API_BASE_URL);
  console.log('WebSocket URL:', WS_BASE_URL);

  // Initialize WebSocket with reconnection logic
  useEffect(() => {
    let ws;
    let reconnectAttempts = 0;
    const maxReconnectAttempts = 5;
    const reconnectInterval = 5000; // 5 seconds

    const connectWebSocket = () => {
      ws = new WebSocket(WS_BASE_URL);

      ws.onopen = () => {
        console.log('WebSocket connected');
        setWsConnected(true);
        setWsMessage('Connected to real-time updates');
        reconnectAttempts = 0;
      };

      ws.onmessage = (event) => {
        console.log('WebSocket message received:', event.data);
        setWsMessage(`Update: ${event.data}`);
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setWsMessage(`WebSocket connection failed: ${error.message || 'Unknown error'}`);
        setWsConnected(false);
      };

      ws.onclose = (event) => {
        console.log('WebSocket disconnected:', { code: event.code, reason: event.reason });
        setWsConnected(false);
        setWsMessage('Disconnected from live updates');
        if (reconnectAttempts < maxReconnectAttempts) {
          reconnectAttempts++;
          console.log(`Attempting to reconnect (${reconnectAttempts}/${maxReconnectAttempts})...`);
          setTimeout(connectWebSocket, reconnectInterval);
        } else {
          setWsMessage('Failed to reconnect to WebSocket after multiple attempts');
        }
      };
    };

    connectWebSocket();

    return () => {
      if (ws) ws.close();
    };
  }, [WS_BASE_URL]);

  const toggleMode = () => {
    setIsRegistering(!isRegistering);
    setError('');
    setUsername('');
    setPassword('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const url = isRegistering ? `${API_BASE_URL}/register` : `${API_BASE_URL}/login`;
    const payload = {
      username: username.trim(),
      password: password.trim(),
    };

    try {
      if (!payload.username || !payload.password) {
        throw new Error('Username and password are required');
      }

      console.log('Sending to backend:', payload);

      const response = await axios.post(url, payload, {
        headers: {
          'Content-Type': 'application/json',
        },
        withCredentials: true,
        timeout: 10000,
      });

      const data = response.data;
      console.log('Backend response:', data);

      if (response.status !== 200) {
        setError(data.message || 'An error occurred. Check console.');
      } else {
        if (isRegistering) {
          alert('✅ Registration successful! Please login.');
          setIsRegistering(false);
          setUsername('');
          setPassword('');
        } else {
          if (data.token && data.userId) {
            console.log('Login success:', data);
            localStorage.setItem('token', data.token);
            localStorage.setItem('userId', data.userId);
            onLoginSuccess(data.token, data.userId);
          } else {
            setError('Login failed: Invalid server response.');
          }
        }
      }
    } catch (err) {
      console.error('Request error:', {
        message: err.message,
        status: err.response?.status,
        data: err.response?.data,
        code: err.code,
      });
      if (err.code === 'ERR_NETWORK') {
        setError('Network error: Unable to connect to the server. Ensure the backend is running and CORS is configured correctly.');
      } else if (err.response?.status === 0) {
        setError('CORS error: Backend did not allow request from this origin. Check backend CORS configuration.');
      } else if (err.response?.status === 404) {
        setError('Endpoint not found. Verify that /login or /register routes exist on the backend.');
      } else {
        setError(err.response?.data?.message || err.message || 'Failed to connect to server.');
      }
    } finally {
      setLoading(false);
    }
  };

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

  const errorStyle = {
    color: '#d32f2f',
    margin: '10px 0',
    fontSize: '0.9rem',
  };

  const wsMessageStyle = {
    color: wsConnected ? '#2e7d32' : '#d32f2f',
    margin: '10px 0',
    fontSize: '0.9rem',
  };

  const toggleLinkStyle = {
    marginTop: '12px',
    cursor: 'pointer',
    color: '#007bff',
    fontSize: '0.9rem',
    textDecoration: 'underline',
  };

  return (
    <div style={backgroundStyle}>
      <form onSubmit={handleSubmit} style={formStyle}>
        <h2 style={{ fontSize: '1.8rem', marginBottom: '1.5rem' }}>
          {isRegistering ? 'Register' : 'Login'}
        </h2>
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          style={inputStyle}
          required
          disabled={loading}
          autocomplete="username"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={inputStyle}
          required
          disabled={loading}
          autocomplete="current-password"
        />
        {error && <p style={errorStyle}>{error}</p>}
        {wsMessage && <p style={wsMessageStyle}>{wsMessage}</p>}
        <button type="submit" style={buttonStyle} disabled={loading}>
          {loading ? (
            <span>
              {isRegistering ? 'Registering...' : 'Logging in...'} <span>⏳</span>
            </span>
          ) : isRegistering ? (
            'Register'
          ) : (
            'Login'
          )}
        </button>
        <p style={toggleLinkStyle} onClick={toggleMode}>
          {isRegistering ? 'Already have an account? Login' : 'No account? Register'}
        </p>
      </form>
    </div>
  );
};

export default LoginForm;
