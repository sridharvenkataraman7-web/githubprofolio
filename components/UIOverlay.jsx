// src/components/UIOverlay.jsx
import React from 'react'
import ModalPanel from './ModalPanel'
import SpotifyPanel from './SpotifyPanel'  // ⭐ required import

/**
 * UIOverlay
 * - Renders modal panels for Skills / Projects / Hobbies / Spotify
 * - Displays tooltip at cursor
 *
 * Props:
 * - panel: string panel name
 * - onClose: close panel function
 * - tooltip: { visible, x, y, text }
 */
export default function UIOverlay({ panel, onClose, tooltip }) {
  return (
    <div className="ui-overlay" aria-hidden={panel ? 'false' : 'true'}>

      {/* ⭐ SKILLS PANEL */}
      <ModalPanel title="Skills" open={panel === 'skills'} onClose={onClose}>
        <div>
          <p><strong>Primary</strong></p>
          <ul>
            <li>HTMl/CSS/Javascript</li>
            <li>three.js (WebGL)</li>
            <li>React</li>
            <li>C/C#/Python</li>
          
          </ul>

          <p><strong>Tools</strong></p>
          <ul>
            <li>Blender</li>
            <li>Git / GitHub</li>
            <li>Unity</li>
          </ul>
        </div>
      </ModalPanel>

      {/* ⭐ PROJECTS PANEL */}
      <ModalPanel title="Projects" open={panel === 'projects'} onClose={onClose}>
        <div>
          <p>Example projects:</p>
          <ol>
            <li><strong>3D Portfolio</strong> — interactive scene.</li>
            <li><strong>Mini Game</strong> — WebGL prototype.</li>
            <li><strong>Visual Experiments</strong> — shaders & generative art.</li>
          </ol>
        </div>
      </ModalPanel>

      {/* ⭐ HOBBIES PANEL */}
      <ModalPanel title="Hobbies" open={panel === 'hobbies'} onClose={onClose}>
        <div>
          <p>Short list of hobbies:</p>
          <ul>
            <li>Digital art & illustration</li>
            <li>Playing games</li>
            <li>sketching</li>
          </ul>
        </div>
      </ModalPanel>

      {/* ⭐ NEW SPOTIFY PANEL ⭐ */}
<ModalPanel title="Spotify Playlist" open={panel === 'spotify'} onClose={onClose}>
  <iframe
    src="https://open.spotify.com/embed/playlist/2aBwdqfXtWoYBsHsa7689C"
    width="100%"
    height="380"
    frameBorder="0"
    allow="autoplay; clipboard-write; encrypted-media; picture-in-picture"
    loading="lazy"
    style={{ borderRadius: "10px" }}
  ></iframe>
</ModalPanel>


      {/* TOOLTIP */}
      {tooltip && tooltip.visible && (
        <div
          className="tooltip"
          role="tooltip"
          style={{
            left: tooltip.x + 12,
            top: tooltip.y + 12,
            position: 'fixed',
            zIndex: 9999
          }}
        >
          {tooltip.text}
        </div>
      )}
    </div>
  )
}
