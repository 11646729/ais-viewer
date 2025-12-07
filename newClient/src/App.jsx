import { useState, useEffect, useRef } from "react"
import "./App.css"
import VesselReport from "./components/VesselReport"
import VesselMap from "./components/VesselMap"

const WS_URL = "ws://localhost:8080"

function useAisMessages(coordinates) {
  const [latestMessage, setLatestMessage] = useState(null)
  const [connected, setConnected] = useState(false)
  const ws = useRef(null)
  const coordsRef = useRef(coordinates)
  const reconnectTimeout = useRef(null)
  const isMounted = useRef(true)

  useEffect(() => {
    coordsRef.current = coordinates
  }, [coordinates])

  useEffect(() => {
    isMounted.current = true

    const connect = () => {
      if (!isMounted.current) return

      ws.current = new WebSocket(WS_URL)

      ws.current.onopen = () => {
        if (!isMounted.current) {
          ws.current?.close()
          return
        }
        setConnected(true)
        console.log("✅ WebSocket connected")

        if (coordsRef.current) {
          ws.current.send(
            JSON.stringify({
              type: "location-update",
              payload: coordsRef.current,
            })
          )
        }
      }

      ws.current.onmessage = (event) => {
        if (!isMounted.current) return
        try {
          const data = JSON.parse(event.data)
          // Get the latest vessel (most recent by updated_at)
          const vessels = Array.isArray(data) ? data : [data]
          if (vessels.length > 0) {
            const latest = vessels.reduce((a, b) =>
              new Date(a.updated_at) > new Date(b.updated_at) ? a : b
            )
            setLatestMessage(latest)
          }
        } catch (err) {
          console.error("Parse error:", err)
        }
      }

      ws.current.onclose = () => {
        if (!isMounted.current) return
        setConnected(false)
        console.log("🔁 Reconnecting in 3s...")
        reconnectTimeout.current = setTimeout(connect, 3000)
      }

      ws.current.onerror = (err) => {
        console.error("❌ WebSocket error:", err)
        ws.current?.close()
      }
    }

    connect()

    return () => {
      isMounted.current = false
      clearTimeout(reconnectTimeout.current)
      ws.current?.close()
    }
  }, [])

  return { latestMessage, connected }
}

function App() {
  const [coords] = useState({
    latitude: 54.6,
    longitude: -5.75,
    radius: 50000,
  })

  const { latestMessage, connected } = useAisMessages(coords)

  return (
    <div className="app">
      <header>
        <h1>AIS Vessel Viewer</h1>
        <span className={`status ${connected ? "online" : "offline"}`}>
          {connected ? "● Connected" : "○ Disconnected"}
        </span>
      </header>

      <main className="main-content">
        <VesselReport vessel={latestMessage} />
        <VesselMap vessel={latestMessage} />
      </main>
    </div>
  )
}

export default App
