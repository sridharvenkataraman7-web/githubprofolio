// src/main.jsx
import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './styles/app.css'

/**
 * Entry point for Vite + React app.
 * Attaches React to #root in index.html.
 */

const rootElement = document.getElementById('root')
const root = createRoot(rootElement)

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)

