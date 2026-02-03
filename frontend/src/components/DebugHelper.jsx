import React, { useEffect, useState } from 'react'

/**
 * DEBUG HELPER FOR SUBMIT COMPLAINT
 * Add this to SubmitComplaint.jsx to debug issues
 */

export function DebugInfo() {
  const [debugInfo, setDebugInfo] = useState({
    server: '❓',
    token: '❓',
    location: '❓',
  })

  useEffect(() => {
    // Check server connection
    const checkServer = async () => {
      try {
        const response = await fetch('http://127.0.0.1:8000/api/test/')
        const status = response.ok ? '✅' : '❌'
        setDebugInfo(prev => ({ ...prev, server: `${status} ${response.status}` }))
      } catch (err) {
        setDebugInfo(prev => ({ ...prev, server: '❌ Cannot connect' }))
      }
    }

    // Check token
    const token = localStorage.getItem('access')
    setDebugInfo(prev => ({
      ...prev,
      token: token ? `✅ Present (${token.substring(0, 20)}...)` : '❌ Missing'
    }))

    // Check location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setDebugInfo(prev => ({
            ...prev,
            location: `✅ (${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)})`
          }))
        },
        (err) => {
          setDebugInfo(prev => ({ ...prev, location: `❌ ${err.message}` }))
        }
      )
    } else {
      setDebugInfo(prev => ({ ...prev, location: '❌ Not supported' }))
    }

    checkServer()
  }, [])

  return (
    <div className="fixed bottom-4 right-4 bg-gray-900 text-white p-4 rounded-lg text-xs font-mono shadow-lg z-50">
      <h3 className="font-bold mb-2">🔧 Debug Info</h3>
      <p>Server: {debugInfo.server}</p>
      <p>Token: {debugInfo.token}</p>
      <p>Location: {debugInfo.location}</p>
    </div>
  )
}

// To use: Add <DebugInfo /> to your SubmitComplaint JSX
