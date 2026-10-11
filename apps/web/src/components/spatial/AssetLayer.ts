/**
 * NEXUS Spatial Operational Asset Layer
 * Renders Ambulances, Response Teams, and Tactical Vehicles with dynamic movement.
 */
import { Asset } from "../../../../../packages/shared-types";

export class AssetLayer {
  public static render(viewer: any, assets: Asset[], visible: boolean) {
    if (!viewer) return;
    const Cesium = (window as any).Cesium;
    if (!Cesium) return;

    // Clear existing asset entities
    const existing = viewer.entities.values.filter(
      (e: any) => e.nexusType === "asset"
    );
    existing.forEach((e: any) => viewer.entities.remove(e));

    if (!visible) return;

    assets.forEach((ast) => {
      try {
        const { latitude, longitude } = ast.geometry;
        const isEngaged = ast.availability === "ENGAGED" || ast.availability === "DISPATCHED";

        let assetColor = Cesium.Color.fromCssColorString("#38BDF8"); // light blue available
        if (isEngaged) {
          assetColor = Cesium.Color.fromCssColorString("#F59E0B"); // amber engaged
        }

        const isAmbulance = ast.assetType === "AMBULANCE";

        viewer.entities.add({
          id: ast.id,
          name: ast.name,
          nexusType: "asset",
          nexusData: ast,
          position: Cesium.Cartesian3.fromDegrees(longitude, latitude, 15),
          point: {
            pixelSize: isAmbulance ? 12 : 10,
            color: assetColor,
            outlineColor: Cesium.Color.WHITE,
            outlineWidth: 2,
            disableDepthTestDistance: Number.POSITIVE_INFINITY,
          },
          label: {
            text: `${ast.name} [${ast.availability}]`,
            font: "10px JetBrains Mono, monospace",
            fillColor: Cesium.Color.WHITE,
            outlineColor: Cesium.Color.BLACK,
            outlineWidth: 2,
            style: Cesium.LabelStyle.FILL_AND_OUTLINE,
            verticalOrigin: Cesium.VerticalOrigin.TOP,
            pixelOffset: new Cesium.Cartesian2(0, 10),
            distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0, 10000),
            disableDepthTestDistance: Number.POSITIVE_INFINITY,
          },
        });
      } catch (err) {
        console.warn(`Error rendering asset ${ast.id}:`, err);
      }
    });
  }
}
