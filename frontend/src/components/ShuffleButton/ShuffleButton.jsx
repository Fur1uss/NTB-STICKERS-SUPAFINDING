import React from "react";
import "./shuffleButton.css";

const ShuffleButton = ({ onClick, className = "" }) => {
  return (
    <button 
      onClick={onClick} 
      className={`shuffle-button ${className}`}
    >
      Mezclar
    </button>
  );
};

export default ShuffleButton;
