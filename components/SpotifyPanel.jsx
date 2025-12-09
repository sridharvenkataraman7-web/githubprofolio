// src/components/SpotifyPanel.jsx
import React from "react";
import "./Panel.css";

export default function SpotifyPanel({ playlistId, visible, onClose }) {
  return (
    <div
      className="panel spotify-panel"
      style={{
        opacity: visible ? 1 : 0,
        pointerEvents: visible ? "auto" : "none",
        transition: "opacity 0.3s ease"
      }}
    >

      {/* ⭐ Close button hides panel but does NOT stop music */}
      <button className="close-btn" onClick={onClose}>X</button>

      <h2 style={{ marginBottom: "15px" }}>My Spotify Playlist</h2>

      <iframe
        style={{ borderRadius: "12px" }}
        src={`https://open.spotify.com/embed/playlist/${playlistId}`}
        width="100%"
        height="380"
        frameBorder="0"
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        loading="lazy"
      ></iframe>
    </div>
  );
}




