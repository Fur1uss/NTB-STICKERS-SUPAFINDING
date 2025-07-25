import React from "react";
import "./UnfoldingBoard.css";

export default function UnfoldingBoard({ open, children, onClose }) {
  return (
    <div className={`unfolding-board${open ? " open" : ""}`}>
      <div className="unfolding-board-content">
        {children}
        {onClose && (
            <img src="/closeButton.webp" alt="" onClick={onClose} className="btn unfolding-board-close" />
        )}
      </div>
    </div>
  );
} 