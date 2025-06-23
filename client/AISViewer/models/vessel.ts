import { Point } from "geojson";

export interface Vessel {
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