// src/App.jsx
import React, { useState, useCallback } from 'react'
import SceneCanvas from './components/SceneCanvas'
import UIOverlay from './components/UIOverlay'

/**
 * App.jsx
 * - Manages panel state (Skills / Projects / Hobbies)
 * - Manages tooltip state
 * - Renders the 3D scene + UI overlay
 */
export default function App() {
  // panel can be: null | 'skills' | 'projects' | 'hobbies'
  const [panel, setPanel] = useState(null)

  const [tooltip, setTooltip] = useState({
    visible: false,
    x: 0,
    y: 0,
    text: ''
  })

  // Open modal panel
  const openPanel = useCallback(name => {
    setPanel(name)
  }, [])

  // Close modal panel
  const closePanel = useCallback(() => {
    setPanel(null)
  }, [])

  // Tooltip handlers
  const showTooltip = useCallback(tip => {
    setTooltip(tip)
  }, [])

  const hideTooltip = useCallback(() => {
    setTooltip({
      visible: false,
      x: 0,
      y: 0,
      text: ''
    })
  }, [])

  return (
    <div className="app-root">
      {/* 3D Scene */}
      <SceneCanvas
        onOpenPanel={openPanel}
        onShowTooltip={showTooltip}
        onHideTooltip={hideTooltip}
      />

      {/* UI Overlay */}
      <UIOverlay panel={panel} onClose={closePanel} tooltip={tooltip} />
    </div>
  )
}

