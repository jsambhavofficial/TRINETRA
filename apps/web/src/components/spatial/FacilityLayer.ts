/**
 * NEXUS Spatial Facility Layer
 * Renders Hospitals, Emergency Stations, and Critical Utilities with 3D pins and operational status.
 */
import { SpatialEntity } from "../../../../../packages/shared-types";

export class FacilityLayer {
  public static render(
    viewer: any,
    entities: SpatialEntity[],
    visibility: { hospitals: boolean; emergencyStations: boolean; utilities: boolean }
  ) {
    if (!viewer) return;
    const Cesium = (window as any).Cesium;
    if (!Cesium) return;

    // Remove existing facilities
    const existing = viewer.entities.values.filter(
      (e: any) =>
        e.nexusType === "hospital" ||
        e.nexusType === "emergency_station" ||
        e.nexusType === "utility_node" ||
        e.nexusType === "facility"
    );
    existing.forEach((e: any) => viewer.entities.remove(e));

    entities.forEach((fac) => {
      try {
        if (!fac.geometry || fac.geometry.type !== "Point") return;
        const [lng, lat] = fac.geometry.coordinates;

        const isHosp = fac.entityType === "HOSPITAL";
        const isStation = fac.entityType === "EMERGENCY_STATION";
        const isUtil = fac.entityType === "UTILITY_NODE" || fac.entityType === "FACILITY";

        if (isHosp && !visibility.hospitals) return;
        if (isStation && !visibility.emergencyStations) return;
        if (isUtil && !visibility.utilities) return;

        // Color coding
        let pointColor = Cesium.Color.fromCssColorString("#3B82F6"); // Blue for generic
        if (isHosp) {
          pointColor = fac.status === "AT_RISK"
            ? Cesium.Color.fromCssColorString("#EF4444") // Red
            : Cesium.Color.fromCssColorString("#10B981"); // Green
        } else if (isStation) {
          pointColor = Cesium.Color.fromCssColorString("#F59E0B"); // Amber
        } else if (isUtil) {
          pointColor = Cesium.Color.fromCssColorString("#06B6D4"); // Cyan
        }

        viewer.entities.add({
          id: fac.id,
          name: fac.name,
          nexusType: fac.entityType.toLowerCase(),
          nexusData: fac,
          position: Cesium.Cartesian3.fromDegrees(lng, lat, 25),
          point: {
            pixelSize: isHosp ? 14 : 11,
            color: pointColor,
            outlineColor: Cesium.Color.WHITE,
            outlineWidth: 2,
            disableDepthTestDistance: Number.POSITIVE_INFINITY,
          },
          label: {
            text: fac.name,
            font: "11px Inter, sans-serif",
            style: Cesium.LabelStyle.FILL_AND_OUTLINE,
            fillColor: Cesium.Color.WHITE,
            outlineColor: Cesium.Color.BLACK,
            outlineWidth: 3,
            verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
            pixelOffset: new Cesium.Cartesian2(0, -12),
            distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0, 15000),
            disableDepthTestDistance: Number.POSITIVE_INFINITY,
          },
        });
      } catch (err) {
        console.warn(`Error rendering facility ${fac.id}:`, err);
      }
    });
  }
}
