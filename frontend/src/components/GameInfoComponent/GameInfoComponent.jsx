import React from "react";
import "./GameInfoComponent.css";
import { useNavigate } from "react-router-dom";

export default function GameInfoComponent() {
const navigate = useNavigate();
  return (
    <div className="game-info-container">
      <div className="titleContainer">
        <img src="/howToTitle.webp" alt="" />
      </div>
      <div className="instructionsContainer">
        <img src="/instruccion01.webp" alt="" />
        <img src="/instruccion02.webp" alt="" />
        <img src="/instruccion03.webp" alt="" />
        <img src="/sticker04.webp" alt="" className="stickerDecoration" />
      </div>

    </div>
  );
} 