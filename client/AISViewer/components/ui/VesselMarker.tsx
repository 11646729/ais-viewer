import { Vessel } from "@/models/vessel";
import Mapbox from "@rnmapbox/maps";
import React from "react";

function lineGeoJson(vessel: Vessel): GeoJSON.Feature {
  const distanceInDegrees = 0.02;
  const targetLat = vessel.latitude + distanceInDegrees * Math.cos(vessel.heading * Math.PI / 180);
  const targetLon = vessel.longitude + distanceInDegrees * Math.sin(vessel.heading * Math.PI / 180);

  const line: GeoJSON.Feature = {
    type: 'Feature',
    properties: {
      mmsi: vessel.mmsi,
      heading: vessel.heading,
      name: vessel.name
    },
    geometry: {
      type: "LineString",
      coordinates: [
        [vessel.longitude, vessel.latitude],
        [targetLon, targetLat]
      ]
    }
  }

  return line;
}

function areEqual(prev: { vessel: Vessel }, next: { vessel: Vessel }) {
  return (
    prev.vessel.mmsi === next.vessel.mmsi &&
    prev.vessel.latitude === next.vessel.latitude &&
    prev.vessel.longitude === next.vessel.longitude
  );
}

export const VesselMarker = React.memo(({ vessel }: { vessel: Vessel }) => {
  return (
    <>
      {vessel.sog !== 0 ?
        <Mapbox.ShapeSource key={`line-source-${vessel.mmsi.toString()}`} id={`line-vessel-${vessel.mmsi}`} shape={lineGeoJson(vessel)}>
          <Mapbox.LineLayer
            id={`line-${vessel.mmsi}`}
            style={{
              lineColor: 'blue',
              lineWidth: 1,
              lineCap: 'butt',
              lineJoin: 'miter'
            }}
          />
          <Mapbox.SymbolLayer
            id={`vessel-label-${vessel.mmsi}`}
            style={{
              textField: ['get', 'name'],
              textSize: 12,
              textColor: 'black',
              textHaloColor: 'white',
              textHaloWidth: 1,
              textAnchor: 'top',
              textOffset: [0, -2],
            }}
          />
        </Mapbox.ShapeSource> : null}
      <Mapbox.ShapeSource key={`circle-source-${vessel.mmsi.toString()}`} id={`circle-vessel-${vessel.mmsi}`} shape={vessel.geometry}>
        <Mapbox.CircleLayer
          id={`circle-${vessel.mmsi}`}
          style={{
            circleRadius: 5,
            circleColor: 'blue',
          }}
        />
      </Mapbox.ShapeSource>
    </>
  );
}, areEqual);

