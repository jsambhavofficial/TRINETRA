/**
 * NEXUS Spatial 3D Building Layer
 * Renders extruded 3D structural volumes with tactical dark-slate materials.
 */
import { SpatialEntity } from "../../../../../packages/shared-types";

export class BuildingLayer {
  public static render(viewer: any, entities: SpatialEntity[], visible: boolean) {
    if (!viewer) return;
    const Cesium = (window as any).Cesium;
    if (!Cesium) return;

    // Remove existing buildings
    const existing = viewer.entities.values.filter(
      (e: any) => e.nexusType === "building"
    );
    existing.forEach((e: any) => viewer.entities.remove(e));

    if (!visible) return;

    const buildings = entities.filter((e) => e.entityType === "BUILDING");

    buildings.forEach((bld) => {
      try {
        if (!bld.geometry || bld.geometry.type !== "Polygon") return;
        const ring = bld.geometry.coordinates[0];
        const flatDegrees = ring.flatMap(([lng, lat]: [number, number]) => [lng, lat]);
        const height = bld.attributes?.height_meters || 45;

        // Tactical glass/metallic building material
        const baseColor = Cesium.Color.fromCssColorString("#1E293B");
        const outlineColor = Cesium.Color.fromCssColorString("#38BDF8").withAlpha(0.6);

        viewer.entities.add({
          id: bld.id,
          name: bld.name,
          nexusType: "building",
          nexusData: bld,
          polygon: {
            hierarchy: Cesium.Cartesian3.fromDegreesArray(flatDegrees),
            extrudedHeight: height,
            material: baseColor,
            outline: true,
            outlineColor,
          },
        });
      } catch (err) {
        console.warn(`Error rendering building ${bld.id}:`, err);
      }
    });
  }
}
