import { useMap } from "react-leaflet";
import { useEffect, useRef } from "react";
import L from "leaflet";

const ShapeMaskOverlay = ({ shapes = [], maskOpacity = 0.7 }) => {
  const map = useMap();
  const overlayRef = useRef(L.DomUtil.create("div"));

  const extractCoordinatesFromShape = (shape) => {
    if (!shape || !shape.geoJson) return [];

    const geometry = shape.geoJson.geometry;
    if (!geometry) return [];

    switch (geometry.type) {
      case "Polygon":
        // Return the exterior ring (first array of coordinates)
        return geometry.coordinates[0] || [];

      case "MultiPolygon":
        // Return all exterior rings flattened
        return geometry.coordinates.flatMap((polygon) => polygon[0] || []);

      case "LineString":
        return geometry.coordinates || [];

      case "MultiLineString":
        return geometry.coordinates.flatMap((line) => line || []);

      case "Point":
        // For points, create a small circle
        const [lng, lat] = geometry.coordinates;
        const radius = 0.001; // Small radius in degrees
        const points = [];
        for (let i = 0; i <= 16; i++) {
          const angle = (i / 16) * 2 * Math.PI;
          points.push([
            lng + radius * Math.cos(angle),
            lat + radius * Math.sin(angle),
          ]);
        }
        return points;

      case "MultiPoint":
        // Convert all points to small circles
        return geometry.coordinates.flatMap(([lng, lat]) => {
          const radius = 0.001;
          const points = [];
          for (let i = 0; i <= 8; i++) {
            const angle = (i / 8) * 2 * Math.PI;
            points.push([
              lng + radius * Math.cos(angle),
              lat + radius * Math.sin(angle),
            ]);
          }
          return points;
        });

      default:
        console.warn("Unsupported geometry type:", geometry.type);
        return [];
    }
  };

  const renderOverlay = () => {
    if (!shapes?.length) {
      overlayRef.current.innerHTML = "";
      return;
    }

    const bounds = map.getBounds();
    const nw = bounds.getNorthWest();
    const topLeft = map.latLngToLayerPoint(nw);
    const size = map.getSize();
    const width = size.x;
    const height = size.y;

    // Create the outer path (full screen)
    const outerPath = `M0,0 H${width} V${height} H0 Z`;

    // Create inner paths for all shapes
    const innerPaths = shapes
      .map((shape) => extractCoordinatesFromShape(shape))
      .filter((coordinates) => coordinates.length > 0)
      .map((coordinates) => {
        return (
          coordinates
            .map(([lng, lat], index) => {
              const point = map.latLngToLayerPoint([lat, lng]);
              const x = point.x - topLeft.x;
              const y = point.y - topLeft.y;
              return `${index === 0 ? "M" : "L"}${x},${y}`;
            })
            .join(" ") + " Z"
        );
      })
      .join(" ");

    // Combine outer path with all inner paths
    const combinedPath = `${outerPath} ${innerPaths}`;

    overlayRef.current.innerHTML = `
      <svg
        width="${width}"
        height="${height}"
        viewBox="0 0 ${width} ${height}"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <style>
            .mask-overlay {
              fill: rgba(0, 0, 0, ${maskOpacity});
              fill-rule: evenodd;
            }
          </style>
        </defs>
        <path d="${combinedPath}" class="mask-overlay" />
      </svg>
    `;

    overlayRef.current.style.transform = `translate(${topLeft.x}px, ${topLeft.y}px)`;
  };

  useEffect(() => {
    const overlayPane = map.getPanes().overlayPane;
    const overlay = overlayRef.current;

    overlay.style.position = "absolute";
    overlay.style.top = "0";
    overlay.style.left = "0";
    overlay.style.pointerEvents = "none";
    overlay.style.zIndex = 650;

    overlayPane.appendChild(overlay);
    renderOverlay();

    // Listen to map events
    const handleMapUpdate = () => {
      // Small delay to ensure map has updated
      requestAnimationFrame(renderOverlay);
    };

    map.on("zoom viewreset move zoomend moveend", handleMapUpdate);

    return () => {
      map.off("zoom viewreset move zoomend moveend", handleMapUpdate);
      if (overlayPane.contains(overlay)) {
        overlayPane.removeChild(overlay);
      }
    };
  }, [map, shapes, maskOpacity]);

  return null;
};

export default ShapeMaskOverlay;
