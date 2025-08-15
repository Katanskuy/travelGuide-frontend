import { useMap } from "react-leaflet";
import { useEffect, useState } from "react";

const MouseCoordinatesDisplay = ({
  position = "bottom-left",
  precision = 4,
  showDMS = false, // Show degrees, minutes, seconds format
  style = {},
}) => {
  const map = useMap();
  const [coordinates, setCoordinates] = useState({ lat: null, lng: null });
  const [isVisible, setIsVisible] = useState(false);

  // Convert decimal degrees to DMS (Degrees, Minutes, Seconds)
  const toDMS = (decimal, isLongitude = false) => {
    const absolute = Math.abs(decimal);
    const degrees = Math.floor(absolute);
    const minutesFloat = (absolute - degrees) * 60;
    const minutes = Math.floor(minutesFloat);
    const seconds = Math.round((minutesFloat - minutes) * 60 * 100) / 100;

    const direction =
      decimal >= 0 ? (isLongitude ? "E" : "N") : isLongitude ? "W" : "S";

    return `${degrees}° ${minutes}' ${seconds}" ${direction}`;
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      setCoordinates({
        lat: e.latlng.lat,
        lng: e.latlng.lng,
      });
      setIsVisible(true);
    };

    const handleMouseOut = () => {
      setIsVisible(false);
    };

    // Add event listeners
    map.on("mousemove", handleMouseMove);
    map.on("mouseout", handleMouseOut);

    // Cleanup
    return () => {
      map.off("mousemove", handleMouseMove);
      map.off("mouseout", handleMouseOut);
    };
  }, [map]);

  if (!isVisible || coordinates.lat === null || coordinates.lng === null) {
    return null;
  }

  // Position styles
  const getPositionStyle = () => {
    const baseStyle = {
      position: "absolute",
      zIndex: 1000,
      backgroundColor: "rgba(0, 0, 0, 0.8)",
      color: "#fff",
      padding: "8px 12px",
      borderRadius: "4px",
      fontSize: "12px",
      fontFamily: "monospace",
      pointerEvents: "none",
      whiteSpace: "nowrap",
      ...style,
    };

    switch (position) {
      case "top-left":
        return { ...baseStyle, top: "10px", left: "10px" };
      case "top-right":
        return { ...baseStyle, top: "10px", right: "10px" };
      case "bottom-right":
        return { ...baseStyle, bottom: "20px", right: "10px" };
      case "bottom-left":
      default:
        return { ...baseStyle, bottom: "10px", left: "10px" };
    }
  };

  const formatCoordinate = (value, isLongitude = false) => {
    if (showDMS) {
      return toDMS(value, isLongitude);
    }
    return value.toFixed(precision);
  };

  return (
    <div style={getPositionStyle()}>
      <div>Lng: {formatCoordinate(coordinates.lng, true)}</div>
      <div>Lat: {formatCoordinate(coordinates.lat)}</div>
    </div>
  );
};

export default MouseCoordinatesDisplay;
