// src/components/LogoHeader.js
import React from 'react';
import sevasLogo from '../assets/Sevas.png'; // relative path from components folder
import Clock from './clock'; // Make sure Clock.js is in the same folder

const LogoHeader = () => {
  return (
    <header className="flex justify-between items-center p-4 bg-blue-100 shadow">
      <div className="flex items-center space-x-4">
        <img src={sevasLogo} alt="Sevas Laundry Logo" style={{ height: '50px' }} />
        <h1 className="text-xl font-bold text-blue-800">Sevas Laundry Booking</h1>
      </div>
      <Clock />
    </header>
  );
};

export default LogoHeader;
