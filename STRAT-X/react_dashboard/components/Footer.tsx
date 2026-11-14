
import React, { useState, useEffect } from 'react';

const Footer: React.FC = () => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timerId = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timerId);
  }, []);

  return (
    <footer className="bg-slate-800 p-3 text-center text-sm text-slate-400 shadow-md mt-auto border-t border-slate-700/50">
      <p>&copy; {new Date().getFullYear()} HeartSenseAI. All rights reserved.</p>
      <p>Current Time: {currentTime.toLocaleTimeString()}</p>
    </footer>
  );
};

export default Footer;