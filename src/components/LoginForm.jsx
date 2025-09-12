import React, { useState } from 'react';
import axios from 'axios';
import washerImg from '../assets/washer.jpg';

const LoginForm = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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

    // Use environment variable for API URL
    const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';
    const url = isRegistering ? `${BASE_URL}/register` : `${BASE_URL}/login`;

    try {
      if (!username.trim() || !password.trim()) {
        throw new Error('Username and password are required');
      }

      console.log('Sending to backend:', { username, password });

      const response = await axios.post(url, {
        username: username.trim(),
        password: password.trim(),
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
            onLoginSuccess(data.token, data.userId); // Pass token and userId
          } else {
            setError('Login failed: invalid server response.');
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
      setError(err.response?.data?.message || err.message || 'Failed to connect to server. Please try again.');
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
    padding: '3rem 4rem',
    borderRadius: '10px',
    boxShadow: '0 0 20px rgba(0,0,0,0.4)',
    width: '400px',
    maxWidth: '90%',
    textAlign: 'center',
  };

  const inputStyle = {
    width: '100%',
    padding: '14px',
    margin: '15px 0',
    borderRadius: '6px',
    border: '1.5px solid #ccc',
    fontSize: '1.2rem',
  };

  const buttonStyle = {
    width: '100%',
    padding: '14px',
    backgroundColor: '#007bff',
    color: 'white',
    fontSize: '1.3rem',
    border: 'none',
    borderRadius: '6px',
    cursor: loading ? 'not-allowed' : 'pointer',
    opacity: loading ? 0.7 : 1,
  };

  const errorStyle = { color: 'red', marginTop: '12px', fontSize: '1rem' };

  return (
    <div style={backgroundStyle}>
      <form onSubmit={handleSubmit} style={formStyle}>
        <h2 style={{ fontSize: '2rem', marginBottom: '1.5rem' }}>
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
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={inputStyle}
          required
          disabled={loading}
        />
        {error && <p style={errorStyle}>{error}</p>}
        <button type="submit" style={buttonStyle} disabled={loading}>
          {loading
            ? isRegistering
              ? 'Registering...'
              : 'Logging in...'
            : isRegistering
            ? 'Register'
            : 'Login'}
        </button>
        <p
          style={{ marginTop: '12px', cursor: 'pointer', color: '#007bff' }}
          onClick={toggleMode}
        >
          {isRegistering ? 'Already have an account? Login' : 'No account? Register'}
        </p>
      </form>
    </div>
  );
};

export default LoginForm;