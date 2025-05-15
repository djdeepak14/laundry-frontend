// src/components/LogoHeader.js
import React from 'react';
import sevasLogo from '../assets/Sevas.png'; // relative path from components folder

const LogoHeader = () => {
  return (
    <header className="logo-header">
      <img src={sevasLogo} alt="Sevas Laundry Logo" style={{ height: '50px' }} />
    </header>
  );
};

export default LogoHeader;
