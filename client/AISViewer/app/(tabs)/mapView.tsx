import React, { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View, PermissionsAndroid, Platform, Alert, TouchableOpacity, Text } from 'react-native';
import Mapbox, { UserTrackingMode } from '@rnmapbox/maps';
import { useWebSocket } from '@/services/aisdataservice';
import { Point } from 'geojson';
import { getDistanceFromLatLonInMeters } from '../helpers/locationDistance';

Mapbox.setAccessToken('pk.eyJ1IjoibWFpbmV2ZW50eHgiLCJhIjoiY21jMmJxY2Z6MDV0aTJqc2t3d2V3ZGFqdiJ9.NLDsaiK5iCH6GwDD71ZqlA');


interface VesselData {
  cog: number;
  geometry: Point;
  heading: number;
  latitude: number;
  longitude: number;
  mmsi: number;
  name: string;
  sog: number;
  updated_at: string
}

async function requestLocationPermission() {
  if (Platform.OS === 'android') {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
    );
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  }
  return true;
}

const VesselMarker = React.memo(({ vessel }: { vessel: VesselData }) => {
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
            circleRadius: 4,
            circleColor: 'blue',
          }}
        />
      </Mapbox.ShapeSource>
    </>
  );
}, areEqual);

function areEqual(prev: { vessel: VesselData }, next: { vessel: VesselData }) {
  return (
    prev.vessel.mmsi === next.vessel.mmsi &&
    prev.vessel.latitude === next.vessel.latitude &&
    prev.vessel.longitude === next.vessel.longitude
  );
}

function lineGeoJson(vessel: VesselData): GeoJSON.Feature {
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

const MapView = () => {
  const [userCoordinates, setUSerCoordinates] = useState<{ latitude: number, longitude: number, radius: number, heading: number }>();
  const { data } = useWebSocket(userCoordinates);
  const cameraRef = useRef<Mapbox.Camera>(null);
  const [vessels, setVessels] = useState<Record<string, VesselData>>({});

  const nearbyVessels = useMemo(() => {
    if (!userCoordinates) {
      return [];
    }
    const allVessels = Object.values(vessels);
    return allVessels.filter((vessel) =>
      getDistanceFromLatLonInMeters(
        userCoordinates.latitude,
        userCoordinates.longitude,
        vessel.latitude,
        vessel.longitude
      ) <= 10000)
  }, [vessels]);

  useEffect(() => {
    requestLocationPermission();
  }, []);

  useEffect(() => {
    setVessels((prev) => {
      const updated = { ...prev };
      for (const vessel of data) {
        updated[vessel.mmsi] = vessel;
      }
      return updated;
    });
  }, [data])

  const onLocationUptade = (location: Mapbox.Location) => {
    if (location.coords && location.coords.latitude && location.coords.longitude) {
      cameraRef.current?.setCamera({
        centerCoordinate: [location.coords.longitude, location.coords.latitude],
        zoomLevel: 12,
        animationDuration: 500,
      });

      console.log(Object.entries(vessels).length)

      setUSerCoordinates({ latitude: location.coords.latitude, longitude: location.coords.longitude, radius: 10000, heading: location.coords.heading || 0 })
    }
  }

  return (
    <>
      <Mapbox.MapView style={styles.map} zoomEnabled={true} key={'map'} scaleBarEnabled={true}>
        <Mapbox.Camera
          ref={cameraRef}
          zoomLevel={12}
          defaultSettings={{ zoomLevel: 12 }}
          followUserLocation={true}
          followZoomLevel={13}
          followUserMode={Mapbox.UserTrackingMode.FollowWithHeading}
        />
        <Mapbox.UserLocation animated androidRenderMode='compass' showsUserHeadingIndicator={true} onUpdate={onLocationUptade}>
          <Mapbox.CircleLayer
            key="user-location-circle"
            id="user-location-circle"
            style={{ circleColor: 'red', circleRadius: 8 }}
          />
        </Mapbox.UserLocation>


        {nearbyVessels.map((vessel) => (
          <VesselMarker key={vessel.mmsi} vessel={vessel} />
        ))}
      </Mapbox.MapView>
    </>

  );
}

export default MapView;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1
  },
  marker: {
    width: 20,
    height: 20,
    backgroundColor: 'transparent',
    borderLeftWidth: 12,
    borderRightWidth: 12,
    borderBottomWidth: 20,
    borderTopWidth: 0,
    borderStyle: 'solid',
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: 'blue',
  },
  zoomControls: {
    position: 'absolute',
    right: 10,
    bottom: 30,
    justifyContent: 'space-between',
  },
  zoomButton: {
    backgroundColor: '#fff',
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginVertical: 4,
    alignItems: 'center',
    elevation: 3,
  },
  zoomText: {
    fontSize: 22,
    fontWeight: 'bold',
  },
});