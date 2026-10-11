/**
 * NEXUS Spatial Camera Controller
 * Manages tactical camera flight, focal transitions, and viewport framing.
 */

export interface CameraPreset {
  name: string;
  latitude: number;
  longitude: number;
  altitude: number;
  pitchDeg: number;
  headingDeg: number;
}

export const CAMERA_PRESETS: Record<string, CameraPreset> = {
  OVERVIEW: {
    name: "Metropolitan Overview",
    latitude: 26.9124,
    longitude: 75.7873,
    altitude: 12000,
    pitchDeg: -45,
    headingDeg: 0,
  },
  CORRIDOR_R17: {
    name: "Road R17 / Bridge B02 Incident",
    latitude: 26.9218,
    longitude: 75.7985,
    altitude: 1800,
    pitchDeg: -35,
    headingDeg: 35,
  },
  MEMORIAL_HOSPITAL: {
    name: "Central Memorial Hospital",
    latitude: 26.918,
    longitude: 75.792,
    altitude: 1200,
    pitchDeg: -30,
    headingDeg: 15,
  },
  NORTH_SECTOR: {
    name: "North Operational Sector",
    latitude: 26.955,
    longitude: 75.805,
    altitude: 4500,
    pitchDeg: -40,
    headingDeg: 0,
  },
  CITIZEN_OBSERVATION: {
    name: "Citizen Observation Site",
    latitude: 26.9180,
    longitude: 75.7920,
    altitude: 1100,
    pitchDeg: -35,
    headingDeg: 20,
  },
  R17_INCIDENT: {
    name: "Incident Focus R17",
    latitude: 26.9124,
    longitude: 75.7873,
    altitude: 1400,
    pitchDeg: -35,
    headingDeg: 15,
  },
  BYPASS_SIMULATION: {
    name: "Simulated Bypass Corridor R14",
    latitude: 26.9300,
    longitude: 75.7850,
    altitude: 2600,
    pitchDeg: -40,
    headingDeg: 0,
  },
  AMBULANCE_DISPATCH: {
    name: "Rescue Asset PU-04",
    latitude: 26.9080,
    longitude: 75.7750,
    altitude: 1200,
    pitchDeg: -30,
    headingDeg: 45,
  },
  VERIFICATION_SITE: {
    name: "Drone Recon Site",
    latitude: 26.9124,
    longitude: 75.7873,
    altitude: 1100,
    pitchDeg: -45,
    headingDeg: 0,
  },
};

export class CameraController {
  private viewer: any = null;

  public setViewer(viewerInstance: any) {
    this.viewer = viewerInstance;
  }

  public flyToPreset(presetKey: keyof typeof CAMERA_PRESETS, durationSeconds = 1.5) {
    const preset = CAMERA_PRESETS[presetKey];
    if (!preset) return;
    this.flyToLocation(preset.latitude, preset.longitude, preset.altitude, durationSeconds);
  }

  public flyToLocation(lat: number, lon: number, altitude = 2000, duration = 1.5) {
    if (!this.viewer || !this.viewer.camera) return;
    try {
      const Cesium = (window as any).Cesium;
      if (!Cesium) return;

      this.viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(lon, lat, altitude),
        orientation: {
          heading: Cesium.Math.toRadians(0),
          pitch: Cesium.Math.toRadians(-45),
          roll: 0.0,
        },
        duration,
      });
    } catch (err) {
      console.warn("Camera flight error:", err);
    }
  }

  public zoomToDistrict(bounds: { north: number; south: number; east: number; west: number }) {
    if (!this.viewer || !this.viewer.camera) return;
    try {
      const Cesium = (window as any).Cesium;
      if (!Cesium) return;

      const rectangle = Cesium.Rectangle.fromDegrees(
        bounds.west,
        bounds.south,
        bounds.east,
        bounds.north
      );
      this.viewer.camera.flyTo({
        destination: rectangle,
        duration: 1.5,
      });
    } catch (err) {
      console.warn("District zoom error:", err);
    }
  }

  public resetCamera() {
    this.flyToPreset("OVERVIEW", 2.0);
  }
}

export const cameraController = new CameraController();
