import { useState, useEffect, useRef } from "react"
import "./App.css"

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

      <main>
        {!latestMessage ? (
          <p className="empty">Waiting for vessel data...</p>
        ) : (
          <div className="latest-report">
            <h2>Latest Position Report</h2>
            <table>
              <tbody>
                <tr>
                  <th>MMSI</th>
                  <td>{latestMessage.mmsi}</td>
                </tr>
                <tr>
                  <th>Name</th>
                  <td>{latestMessage.name || "—"}</td>
                </tr>
                <tr>
                  <th>Latitude</th>
                  <td>{latestMessage.latitude?.toFixed(5)}</td>
                </tr>
                <tr>
                  <th>Longitude</th>
                  <td>{latestMessage.longitude?.toFixed(5)}</td>
                </tr>
                <tr>
                  <th>SOG</th>
                  <td>{latestMessage.sog?.toFixed(1)} knots</td>
                </tr>
                <tr>
                  <th>COG</th>
                  <td>{latestMessage.cog?.toFixed(1)}°</td>
                </tr>
                <tr>
                  <th>Heading</th>
                  <td>{latestMessage.heading}°</td>
                </tr>
                <tr>
                  <th>Updated</th>
                  <td>{new Date(latestMessage.updated_at).toLocaleString()}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  )
}

export default App
