import React from "react";

const AboutModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>About PixMixer</h2>
        <p>This tool lets you pixelate any image using canvas magic. </p>
        <button className="Primary"onClick={onClose}>Close</button>
      </div>
    </div>
  );
};

export default AboutModal;
