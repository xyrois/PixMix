import React from "react";
import { useNavigate } from "react-router-dom";

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="page home">
      <h2>Welcome to PixMixer</h2>
      <p>Upload and apply effects to your images with ease.</p>
      <button className="primary" onClick={() => navigate("/pixelator")}>
        Start Pixelating!
      </button>
    </div>
  );
};

export default Home;
