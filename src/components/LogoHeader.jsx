// src/components/LogoHeader.js
import React from 'react';
import sevasLogo from '../assets/Sevas.png'; // Import from src/assets

const LogoHeader = () => {
  return (
    <div className="logo-container">
      <img src={sevasLogo} alt="Sevas Laundry Logo" />
    </div>
  );
};

export default LogoHeader;