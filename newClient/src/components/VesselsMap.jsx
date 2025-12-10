import { APIProvider, Map, AdvancedMarker } from "@vis.gl/react-google-maps"

// const VesselsMapTitle = "Vessel Locations"

const mapContainerStyle = {
  height: "600px",
  width: "600px", //"100%",
  border: "1px solid #ccc",
  marginLeft: 20,
  marginRight: 20,
  marginBottom: 20,
}

const CustomCircle = ({
  color = "#78a32e",
  size = 15,
  borderColor = "#ffffff",
  borderWidth = 1,
}) => (
  <div
    style={{
      width: `${size}px`,
      height: `${size}px`,
      backgroundColor: color,
      borderRadius: "50%",
      border: `${borderWidth}px solid ${borderColor}`,
      boxShadow: "0 2px 4px rgba(0,0,0,0.3)",
      cursor: "pointer",
    }}
  />
)

const VesselMap = ({ vessel }) => {
  if (!vessel || !vessel.latitude || !vessel.longitude) {
    return (
      <div className="vessel-map-placeholder">
        <p>Waiting for vessel position...</p>
      </div>
    )
  }

  const position = { lat: vessel.latitude, lng: vessel.longitude }

  return (
    <APIProvider apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}>
      {/* <Title>{VesselsMapTitle}</Title> */}
      <Map
        defaultZoom={parseInt(import.meta.env.VITE_DEFAULT_ZOOM) || 10}
        defaultCenter={{
          lat: parseFloat(import.meta.env.VITE_HOME_LATITUDE),
          lng: parseFloat(import.meta.env.VITE_HOME_LONGITUDE),
        }}
        enter={{
          lat: parseFloat(import.meta.env.VITE_HOME_LATITUDE),
          lng: parseFloat(import.meta.env.VITE_HOME_LONGITUDE),
        }}
        // center={position}
        style={mapContainerStyle}
        mapId="vessels-map"
        disableDefaultUI={true}
        zoomControl={true}
      >
        <AdvancedMarker
          key={position._markerId}
          position={position}
          // onClick={() => handleMarkerClick(position._markerId)}
        >
          <CustomCircle />
        </AdvancedMarker>
      </Map>
    </APIProvider>
  )
}

export default VesselMap
