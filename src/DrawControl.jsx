//Not used, may be needed later
import { useEffect } from "react";
import L from "leaflet";
import "leaflet-draw";

const DrawControl = ({ map, onShapeCreated }) => {
  useEffect(() => {
    if (!map) return;

    const drawnItems = new L.FeatureGroup();
    map.addLayer(drawnItems);

    const drawControl = new L.Control.Draw({
      draw: {
        polygon: true,
        polyline: false,
        rectangle: true,
        circle: true,
        marker: false,
        circlemarker: false,
      },
      edit: {
        featureGroup: drawnItems,
      },
    });

    map.addControl(drawControl);

    map.on(L.Draw.Event.CREATED, function (event) {
      const layer = event.layer;
      drawnItems.addLayer(layer);

      const shapeGeoJson = layer.toGeoJSON();
      onShapeCreated(shapeGeoJson);
    });
  }, [map]);

  return null;
};

export default DrawControl;
