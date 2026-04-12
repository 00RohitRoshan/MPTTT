import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Patch for Nakama SDK bug in some browser environments
if (typeof XMLHttpRequest !== 'undefined' && !Object.getOwnPropertyDescriptor(XMLHttpRequest.prototype, "withCredentials")?.set) {
  Object.defineProperty(XMLHttpRequest.prototype, "withCredentials", {
    set: function() {},
    configurable: true
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
