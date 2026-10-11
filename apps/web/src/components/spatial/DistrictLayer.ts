/**
 * NEXUS Spatial District Layer
 * Renders regional operational sectors with perimeter outlines and status fills.
 */
import { District } from "../../../../../packages/shared-types";

export class DistrictLayer {
  public static render(viewer: any, districts: District[], visible: boolean) {
    if (!viewer) return;
    const Cesium = (window as any).Cesium;
    if (!Cesium) return;

    // Remove existing district entities
    const existing = viewer.entities.values.filter(
      (e: any) => e.nexusType === "district"
    );
    existing.forEach((e: any) => viewer.entities.remove(e));

    if (!visible) return;

    districts.forEach((dist) => {
      try {
        const ring = dist.geometry.coordinates[0];
        const flatDegrees = ring.flatMap(([lng, lat]) => [lng, lat]);

        // Base color mapping
        const colorMap: Record<string, string> = {
          STABLE: "#10B981",
          ELEVATED_RISK: "#F59E0B",
          CONSTRAINED: "#EF4444",
          CRITICAL: "#DC2626",
        };
        const hex = colorMap[dist.status] || dist.color || "#3B82F6";
        const baseColor = Cesium.Color.fromCssColorString(hex);

        viewer.entities.add({
          id: dist.id,
          name: dist.name,
          nexusType: "district",
          nexusData: dist,
          polygon: {
            hierarchy: Cesium.Cartesian3.fromDegreesArray(flatDegrees),
            material: baseColor.withAlpha(0.12),
            outline: true,
            outlineColor: baseColor.withAlpha(0.85),
            outlineWidth: 2,
            height: 0,
          },
        });
      } catch (err) {
        console.warn(`Error rendering district ${dist.id}:`, err);
      }
    });
  }
}
