/**
 * NEXUS Spatial Interaction Controller
 * Captures click, hover, and selection events on the 3D canvas and dispatches to Zustand.
 */
import { useWorldStore } from "@/store/useWorldStore";

export class InteractionController {
  private handler: any = null;

  public attach(viewer: any) {
    if (!viewer) return;
    const Cesium = (window as any).Cesium;
    if (!Cesium) return;

    this.detach();
    this.handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);

    // Left click selection: CLICK → SELECT → CAMERA FOCUS → DETAIL PANEL
    this.handler.setInputAction((movement: any) => {
      const pickedObject = viewer.scene.pick(movement.position);
      if (Cesium.defined(pickedObject) && pickedObject.id && pickedObject.id.nexusType) {
        const entity = pickedObject.id;
        const store = useWorldStore.getState();
        const data = entity.nexusData;

        if (!data) return;

        if (entity.nexusType === "district") {
          store.selectDistrict(data);
          if (data.id) store.triggerFlyTo(data.id, "district");
        } else if (entity.nexusType === "incident") {
          store.selectIncident(data);
          if (data.id) store.triggerFlyTo(data.id, "incident");
        } else if (entity.nexusType === "candidate") {
          store.selectCandidate(data);
          if (data.id) store.triggerFlyTo(data.id, "candidate");
        } else if (entity.nexusType === "asset") {
          store.selectAsset(data);
          if (data.id) store.triggerFlyTo(data.id, "asset");
        } else {
          // Entities: hospital, emergency_station, road, bridge, building, utility_node, facility
          store.selectEntity(data);
          if (data.id) store.triggerFlyTo(data.id, "entity");
        }
      } else {
        // Clicked on empty space - clear selection
        useWorldStore.getState().clearSelection();
      }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
  }

  public detach() {
    if (this.handler) {
      this.handler.destroy();
      this.handler = null;
    }
  }
}

export const interactionController = new InteractionController();
