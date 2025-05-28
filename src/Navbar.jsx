import React, { useState } from "react";
import { Link } from "react-router-dom";
import AboutModal from "./AboutModal";

const Navbar = () => {
  const [showAbout, setShowAbout] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  const toggleDarkMode = () => {
    document.body.classList.toggle("dark");
    setDarkMode(!darkMode);
  };

  return (
    <>
      <nav className="navbar">
        <h1 className="logo">PixMixer</h1>
        <div className="nav-links">
          <Link to="/">Home</Link>
          <Link to="/pixelator">PixMix</Link>
          <button onClick={() => setShowAbout(true)}>About</button>
          <button onClick={toggleDarkMode}>
            {darkMode ? "☀️ Light Mode" : "🌙 Dark Mode"}
          </button>
        </div>
      </nav>
      <AboutModal isOpen={showAbout} onClose={() => setShowAbout(false)} />
    </>
  );
};

export default Navbar;
