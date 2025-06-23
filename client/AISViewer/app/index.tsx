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
            circleRadius: 5,
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
  const [userCoordinates, setUSerCoordinates] = useState<{ latitude: number, longitude: number, radius: number }>();

  const cameraRef = useRef<Mapbox.Camera>(null);
  const [vessels, setVessels] = useState<Record<string, VesselData>>({});

  const { data } = useWebSocket(userCoordinates);
  const [filterRadius, setFilterRadius] = useState(10000);

  const nearbyVessels = useMemo(() => {
    if (!userCoordinates) {
      return [];
    }

    const allVessels = Object.values(vessels);
    return allVessels
  }, [vessels]);

  useEffect(() => {
    requestLocationPermission();
  }, []);

  useEffect(() => {
    if (!userCoordinates || !data) return;

    setVessels(() => {
      const updated: Record<number, VesselData> = {};

      for (const vessel of data) {
        const distance = getDistanceFromLatLonInMeters(
          userCoordinates.latitude,
          userCoordinates.longitude,
          vessel.latitude,
          vessel.longitude
        );
        updated[vessel.mmsi] = vessel;

        if (distance <= filterRadius) {
          updated[vessel.mmsi] = vessel;
        }
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

      setUSerCoordinates({ latitude: location.coords.latitude, longitude: location.coords.longitude, radius: filterRadius })
    }
  }

  return (
    <View style={styles.container}>
      <Mapbox.MapView style={styles.map} zoomEnabled={true} key={'map'} scaleBarEnabled={true}>
        <Mapbox.Camera
          ref={cameraRef}
          zoomLevel={10}
          defaultSettings={{ zoomLevel: 10 }}
          followUserLocation={true}
          followZoomLevel={10}
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
       <View style={styles.badgeContainer}>
        <View style={styles.badge}>
          <Text style={styles.text}>Nearby vessels: {nearbyVessels.length}</Text>
          <Text style={styles.text}>Radius: {filterRadius / 1000} km</Text>
        </View>
      </View>
    </View>
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
  badgeContainer: {
    flex: 0,
    position: 'absolute',
    top: 20,
    right: 20,
    zIndex: 999,
  },
  badge: {
    backgroundColor: 'lightgreen',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
    minWidth: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: 'black',
    fontWeight: 'light',
  },
});