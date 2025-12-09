// src/components/ModalPanel.jsx
import React, { useEffect, useRef } from 'react'

/**
 * ModalPanel Component
 * - A simple accessible modal dialog
 * - Closes on ESC
 * - Focus is moved to the modal when opened
 *
 * Props:
 *   - title: string
 *   - open: boolean
 *   - onClose: () => void
 */
export default function ModalPanel({ title, children, open, onClose }) {
  const panelRef = useRef(null)

  // Close with ESC
  useEffect(() => {
    function handleKey(e) {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    if (open) {
      window.addEventListener('keydown', handleKey)
    }
    return () => window.removeEventListener('keydown', handleKey)
  }, [open, onClose])

  // Auto-focus modal when opened
  useEffect(() => {
    if (open && panelRef.current) {
      panelRef.current.focus()
    }
  }, [open])

  if (!open) return null

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div
        className="modal-panel"
        tabIndex="-1"
        ref={panelRef}
        aria-label={title}
      >
        <header className="modal-header">
          <h2 className="modal-title">{title}</h2>
          <button className="modal-close" onClick={onClose} aria-label="Close Panel">
            ✕
          </button>
        </header>

        <div className="modal-body">{children}</div>
      </div>
    </div>
  )
}


