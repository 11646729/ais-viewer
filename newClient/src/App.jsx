import { useState, useEffect, useRef } from "react"
import "./App.css"

const WS_URL = "ws://localhost:8080"

function useAisMessages(coordinates) {
  const [messages, setMessages] = useState([])
  const [connected, setConnected] = useState(false)
  const ws = useRef(null)
  const coordsRef = useRef(coordinates)

  useEffect(() => {
    coordsRef.current = coordinates
  }, [coordinates])

  useEffect(() => {
    const connect = () => {
      ws.current = new WebSocket(WS_URL)

      ws.current.onopen = () => {
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
        try {
          const data = JSON.parse(event.data)
          setMessages(Array.isArray(data) ? data : [data])
        } catch (err) {
          console.error("Parse error:", err)
        }
      }

      ws.current.onclose = () => {
        setConnected(false)
        console.log("🔁 Reconnecting in 3s...")
        setTimeout(connect, 3000)
      }

      ws.current.onerror = (err) => {
        console.error("❌ WebSocket error:", err)
        ws.current?.close()
      }
    }

    connect()

    return () => {
      ws.current?.close()
    }
  }, [])

  return { messages, connected }
}

function App() {
  const [coords] = useState({
    latitude: 54.6,
    longitude: -5.75,
    radius: 50000,
  })

  const { messages, connected } = useAisMessages(coords)

  return (
    <div className="app">
      <header>
        <h1>AIS Vessel Viewer</h1>
        <span className={`status ${connected ? "online" : "offline"}`}>
          {connected ? "● Connected" : "○ Disconnected"}
        </span>
      </header>

      <main>
        {messages.length === 0 ? (
          <p className="empty">Waiting for vessel data...</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>MMSI</th>
                <th>Name</th>
                <th>Latitude</th>
                <th>Longitude</th>
                <th>SOG</th>
                <th>COG</th>
                <th>Heading</th>
                <th>Updated</th>
              </tr>
            </thead>
            <tbody>
              {messages.map((vessel) => (
                <tr key={vessel.mmsi}>
                  <td>{vessel.mmsi}</td>
                  <td>{vessel.name || "—"}</td>
                  <td>{vessel.latitude?.toFixed(5)}</td>
                  <td>{vessel.longitude?.toFixed(5)}</td>
                  <td>{vessel.sog?.toFixed(1)}</td>
                  <td>{vessel.cog?.toFixed(1)}°</td>
                  <td>{vessel.heading}°</td>
                  <td>{new Date(vessel.updated_at).toLocaleTimeString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </main>
    </div>
  )
}

export default App
