import React from "react";
import "./ShuffleButton.css";

const ShuffleButton = ({ onClick, className = "" }) => {
  return (
    <img src="/shuffleButton.webp" alt="" onClick={onClick} className={`shuffle-button ${className}`} />
  );
};

export default ShuffleButton;
