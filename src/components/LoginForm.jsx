// src/components/LoginForm.jsx
import React, { useState } from 'react';
import washerImg from '../assets/washer.jpg';

const LoginForm = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (username === '1' && password === '1') {
      onLoginSuccess();
    } else {
      setError('Invalid username or password');
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
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: '3rem 4rem',
    borderRadius: '10px',
    boxShadow: '0 0 20px rgba(0, 0, 0, 0.4)',
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
    cursor: 'pointer',
  };

  const errorStyle = {
    color: 'red',
    marginTop: '12px',
    fontSize: '1rem',
  };

  return (
    <div style={backgroundStyle}>
      <form onSubmit={handleSubmit} style={formStyle}>
        <h2 style={{ fontSize: '2rem', marginBottom: '1.5rem' }}>Login</h2>
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={e => setUsername(e.target.value)}
          style={inputStyle}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          style={inputStyle}
          required
        />
        {error && <p style={errorStyle}>{error}</p>}
        <button type="submit" style={buttonStyle}>Login</button>
      </form>
    </div>
  );
};

export default LoginForm;
