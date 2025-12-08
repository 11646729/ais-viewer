import { APIProvider, Map, Marker } from "@vis.gl/react-google-maps"
// .golfcoursescontainer {
//   display: flex;

//   .golfcoursestablecontainer {
//     flex: 2;
//   }

//   .golfcoursesmapcontainer {
//     flex: 2;
//   }
// }

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
      <APIProvider apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}>
        <Map
          defaultCenter={position}
          center={position}
          defaultZoom={10}
          style={{ width: "100%", height: "100%" }}
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
