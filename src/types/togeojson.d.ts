declare module "togeojson" {
  import type { FeatureCollection, Geometry, GeoJsonProperties } from "geojson";

  export function gpx(document: unknown): FeatureCollection<Geometry, GeoJsonProperties>;
}
