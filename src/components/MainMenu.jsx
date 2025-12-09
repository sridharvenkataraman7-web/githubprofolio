import React from "react";
import "./MainMenu.css";

export default function MainMenu({ onStart }) {
  return (
    <div className="main-menu">
      <h1 className="title">PORTFOLIO</h1>

      <div className="menu-buttons">
        <button className="menu-btn" onClick={onStart}>START</button>
        <button className="menu-btn exit" onClick={() => alert("Exit is disabled in browser.")}>
          EXIT
        </button>
      </div>
    </div>
  );
}
