// src/components/UIOverlay.jsx
import React from 'react'
import ModalPanel from './ModalPanel'

/**
 * UIOverlay
 * - Renders modal panels for Skills / Projects / Hobbies
 * - Displays a small tooltip positioned at client coordinates (passed from SceneCanvas)
 *
 * Props:
 * - panel: null | 'skills' | 'projects' | 'hobbies'
 * - onClose: function to close active panel
 * - tooltip: { visible: boolean, x: number, y: number, text: string }
 */
export default function UIOverlay({ panel, onClose, tooltip }) {
  return (
    <div className="ui-overlay" aria-hidden={panel ? 'false' : 'true'}>
      <ModalPanel title="Skills" open={panel === 'skills'} onClose={onClose}>
        <div>
          <p>
            <strong>Primary</strong>
          </p>
          <ul>
            <li>JavaScript / TypeScript</li>
            <li>three.js (WebGL)</li>
            <li>React + Vite</li>
          </ul>

          <p>
            <strong>Tools</strong>
          </p>
          <ul>
            <li>Blender → GLTF</li>
            <li>Git / GitHub</li>
            <li>Webpack / Vite</li>
          </ul>
        </div>
      </ModalPanel>

      <ModalPanel title="Projects" open={panel === 'projects'} onClose={onClose}>
        <div>
          <p>Example projects (replace with your real projects):</p>
          <ol>
            <li>
              <strong>3D Portfolio</strong> — interactive scene (this project).
            </li>
            <li>
              <strong>Mini Game</strong> — WebGL-based prototype.
            </li>
            <li>
              <strong>Visual Experiments</strong> — shaders & generative art.
            </li>
          </ol>
        </div>
      </ModalPanel>

      <ModalPanel title="Hobbies" open={panel === 'hobbies'} onClose={onClose}>
        <div>
          <p>Short list of hobbies:</p>
          <ul>
            <li>Digital art & illustration</li>
            <li>Speedrunning games</li>
            <li>Playing guitar & composing</li>
          </ul>
        </div>
      </ModalPanel>

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

