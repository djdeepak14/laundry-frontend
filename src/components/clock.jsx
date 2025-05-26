
import React, { useState, useEffect } from 'react';

const Clock = () => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="text-sm text-right font-mono text-gray-700">
      <div>{currentTime.toLocaleDateString()}</div>
      <div>{currentTime.toLocaleTimeString()}</div>
    </div>
  );
};

export default Clock;
