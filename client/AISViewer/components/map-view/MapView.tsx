import React, { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View, PermissionsAndroid, Platform, Text } from 'react-native';
import Mapbox from '@rnmapbox/maps';

import { useWebSocket } from '@/services/aisdataservice';
import { getDistanceFromLatLonInMeters } from '@/helpers/locationDistance';
import { Vessel } from '@/models/vessel';

import { MAPBOX_ACCESS_TOKEN } from '@env';
import { VesselMarker } from '@/components/ui/VesselMarker';

Mapbox.setAccessToken(MAPBOX_ACCESS_TOKEN);

async function requestLocationPermission() {
  if (Platform.OS === 'android') {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
    );
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  }
  return true;
}

const MapView = () => {
  const [userCoordinates, setUSerCoordinates] = useState<{ latitude: number, longitude: number, radius: number }>();

  const cameraRef = useRef<Mapbox.Camera>(null);
  const [vessels, setVessels] = useState<Record<string, Vessel>>({});

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
      const updated: Record<number, Vessel> = {};

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