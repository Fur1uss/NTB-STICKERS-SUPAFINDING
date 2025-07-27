import React, { useState, useEffect } from "react";
import "./UnfoldingBoard.css";

export default function UnfoldingBoard({ open, children, onClose, showCloseButton = true }) {
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (open) {
      setIsVisible(true);
      setIsClosing(false);
    } else {
      setIsClosing(true);
      // Delay hiding the component until animation finishes
      const timer = setTimeout(() => {
        setIsVisible(false);
        setIsClosing(false);
      }, 1200); // Duration of the exit animation
      return () => clearTimeout(timer);
    }
  }, [open]);

  if (!isVisible) return null;

  return (
    <div className={`unfolding-board${open && !isClosing ? " open" : ""}${isClosing ? " closing" : ""}`}>
      <div className="unfolding-board-content">
        {children}
        {onClose && showCloseButton && (
            <img src="/closeButton.webp" alt="" onClick={onClose} className="btn unfolding-board-close" />
        )}
      </div>
    </div>
  );
} 