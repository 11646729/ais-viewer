import { APIProvider, Map, Marker } from "@vis.gl/react-google-maps"

const API_KEY = "AIzaSyDGo8SPcAF8hOBnNhqR1398qUYQrtkgIHQ"

function VesselMap({ vessel }) {
  if (!vessel || !vessel.latitude || !vessel.longitude) {
    return (
      <div className="vessel-map-placeholder">
        <p>Waiting for vessel position...</p>
      </div>
    )
  }

  const position = { lat: vessel.latitude, lng: vessel.longitude }

  return (
    <div className="vessel-map">
      <APIProvider apiKey={API_KEY}>
        <Map
          defaultCenter={position}
          center={position}
          defaultZoom={12}
          style={{ width: "100%", height: "400px" }}
        >
          <Marker
            position={position}
            title={vessel.name || `MMSI: ${vessel.mmsi}`}
          />
        </Map>
      </APIProvider>
    </div>
  )
}

export default VesselMap
