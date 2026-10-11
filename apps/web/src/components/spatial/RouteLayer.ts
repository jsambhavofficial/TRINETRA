/**
 * NEXUS Spatial Route & Road Network Layer
 * Renders roads, expressways, and bridges with dynamic status styling.
 */
import { SpatialEntity } from "../../../../../packages/shared-types";

export class RouteLayer {
  public static render(viewer: any, entities: SpatialEntity[], visible: boolean) {
    if (!viewer) return;
    const Cesium = (window as any).Cesium;
    if (!Cesium) return;

    // Clear existing route entities
    const existing = viewer.entities.values.filter(
      (e: any) => e.nexusType === "road" || e.nexusType === "bridge"
    );
    existing.forEach((e: any) => viewer.entities.remove(e));

    if (!visible) return;

    const roadsAndBridges = entities.filter(
      (e) => e.entityType === "ROAD" || e.entityType === "BRIDGE"
    );

    roadsAndBridges.forEach((ent) => {
      try {
        if (!ent.geometry || ent.geometry.type !== "LineString") return;
        const coords = ent.geometry.coordinates;
        const flatDegrees = coords.flatMap(([lng, lat]: [number, number]) => [lng, lat]);

        // Status coloring
        const isBlocked = ent.status === "BLOCKED";
        const isDegraded = ent.status === "DEGRADED" || ent.status === "CONSTRAINED";
        const isRestricted = ent.status === "RESTRICTED";

        let routeColor = Cesium.Color.fromCssColorString("#10B981"); // nominal green
        let width = 4;

        if (isBlocked) {
          routeColor = Cesium.Color.fromCssColorString("#EF4444"); // critical red
          width = 6;
        } else if (isDegraded) {
          routeColor = Cesium.Color.fromCssColorString("#F59E0B"); // warning amber
          width = 5;
        } else if (isRestricted) {
          routeColor = Cesium.Color.fromCssColorString("#8B5CF6"); // purple
          width = 4;
        }

        if (ent.entityType === "BRIDGE") {
          width = 7;
        }

        viewer.entities.add({
          id: ent.id,
          name: ent.name,
          nexusType: ent.entityType.toLowerCase(),
          nexusData: ent,
          polyline: {
            positions: Cesium.Cartesian3.fromDegreesArray(flatDegrees),
            width,
            material: new Cesium.PolylineGlowMaterialProperty({
              glowPower: 0.25,
              color: routeColor,
            }),
            clampToGround: true,
          },
        });
      } catch (err) {
        console.warn(`Error rendering route ${ent.id}:`, err);
      }
    });
  }
}
