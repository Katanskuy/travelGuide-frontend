import { useMapEvents } from "react-leaflet";

const ClickToAddMarker = ({ onMapClick, enabled }) => {
  useMapEvents({
    click(e) {
      if (!enabled || typeof onMapClick !== "function") return;

      onMapClick(e);
    },
  });

  return null;
};

export default ClickToAddMarker;
