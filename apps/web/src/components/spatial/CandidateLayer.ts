/**
 * NEXUS Spatial Candidate Incident Layer
 * Renders unconfirmed multimodal hypothesis candidates in Cesium with pulsing amber diamond pins.
 */
import { IncidentCandidate } from "../../../../../packages/shared-types";

export class CandidateLayer {
  public static render(viewer: any, candidates: IncidentCandidate[], visible: boolean) {
    if (!viewer) return;
    const Cesium = (window as any).Cesium;
    if (!Cesium) return;

    // Clear existing candidate entities
    const existing = viewer.entities.values.filter(
      (e: any) => e.nexusType === "candidate"
    );
    existing.forEach((e: any) => viewer.entities.remove(e));

    if (!visible || !candidates) return;

    candidates.forEach((cand) => {
      try {
        if (!cand.geometry) return;
        const { latitude, longitude } = cand.geometry;
        const color = Cesium.Color.fromCssColorString("#F59E0B"); // Amber 500

        // 1. Candidate ground hypothesis radius
        const radiusMeters = cand.affectedRadiusMeters || 120.0;
        viewer.entities.add({
          id: `${cand.id}-radius`,
          nexusType: "candidate",
          nexusData: cand,
          position: Cesium.Cartesian3.fromDegrees(longitude, latitude),
          ellipse: {
            semiMinorAxis: radiusMeters,
            semiMajorAxis: radiusMeters,
            material: color.withAlpha(0.14),
            outline: true,
            outlineColor: color.withAlpha(0.7),
            outlineWidth: 2,
          },
        });

        // 2. Candidate marker pin
        const confPct = Math.round((cand.confidence ?? 0.75) * 100);
        const incType = cand.incidentType || (cand as any).incident_type || "HAZARD";

        viewer.entities.add({
          id: cand.id,
          name: cand.title,
          nexusType: "candidate",
          nexusData: cand,
          position: Cesium.Cartesian3.fromDegrees(longitude, latitude, 25),
          point: {
            pixelSize: 15,
            color: color,
            outlineColor: Cesium.Color.WHITE,
            outlineWidth: 2,
            disableDepthTestDistance: Number.POSITIVE_INFINITY,
          },
          label: {
            text: `⚡ CANDIDATE: ${incType} (${confPct}%)`,
            font: "bold 11px Inter, sans-serif",
            style: Cesium.LabelStyle.FILL_AND_OUTLINE,
            fillColor: Cesium.Color.fromCssColorString("#FDE68A"), // Amber 200
            outlineColor: Cesium.Color.BLACK,
            outlineWidth: 3,
            verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
            pixelOffset: new Cesium.Cartesian2(0, -16),
            distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0, 25000),
            disableDepthTestDistance: Number.POSITIVE_INFINITY,
          },
        });
      } catch (err) {
        console.warn(`Error rendering candidate ${cand.id}:`, err);
      }
    });
  }
}
