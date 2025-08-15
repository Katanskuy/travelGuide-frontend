import React, { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";

import "leaflet/dist/leaflet.css";

import markerIcon2x from "/leaflet-assets/marker-icon-2x.png";
import markerIcon from "/leaflet-assets/marker-icon.png";
import markerShadow from "/leaflet-assets/marker-shadow.png";

delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

import {
  fetchMarkers,
  saveMarker,
  updateMarker,
  deleteMarker,
} from "./MarkerService";
import {
  fetchShapes,
  deleteShape,
  updateShape,
  saveShape,
} from "./ShapeService";

import ClickToAddMarker from "./ClickToAddMarker.jsx";
import MarkerPopup from "./MarkerPopup.jsx";
import LoginForm from "./loginForm.jsx";
import ShapeMarker from "./ShapeMarker.jsx";
import "./MapStyle.css";
import ShapeMaskOverlay from "./ShapeMaskOverlay.jsx";
import ShapeForm from "./ShapeForm.jsx";
import AddShapePanel from "./AddShapePanel.jsx";
import MouseCoordinatesDisplay from "./MouseCoordinatesDisplay.jsx";

const MapViewHandler = ({ center, zoom, selectedShapeBounds }) => {
  const map = useMap();

  useEffect(() => {
    if (center) {
      map.setView(center, zoom, {
        animate: true,
        duration: 1.0,
      });
    }
  }, [center, zoom, map]);

  // ДОДАНО: Ефект для підгонки меж фігури
  useEffect(() => {
    if (selectedShapeBounds && map) {
      try {
        map.fitBounds(selectedShapeBounds, { padding: [20, 20] });
        console.log("Map fitted to shape bounds:", selectedShapeBounds);
      } catch (error) {
        console.error("Error fitting bounds to shape:", error);
      }
    }
  }, [selectedShapeBounds, map]);

  return null;
};

const Map = () => {
  const [pointMarkers, setPointMarkers] = useState([]);
  const [shapes, setShapes] = useState([]);

  const [adding, setAdding] = useState(false);
  const [newMarker, setNewMarker] = useState(null);
  const [editingMarker, setEditingMarker] = useState(null);

  const [token, setToken] = useState(localStorage.getItem("token"));
  const [showLogin, setShowLogin] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [mapCenter, setMapCenter] = useState([50.45, 30.52]);
  const [mapZoom, setMapZoom] = useState(13);

  const [isFormOpen, setIsFormOpen] = useState(false);

  const isLoggedIn = !!token;
  const [editingShape, setEditingShape] = useState(null);

  // ДОДАНО: Новий стан для збереження меж фігури для подальшого використання у MapViewHandler
  const [selectedShapeBounds, setSelectedShapeBounds] = useState(null);

  const allDisplayItems = [...pointMarkers, ...shapes];
  const filteredDisplayItems = allDisplayItems.filter(
    (item) =>
      item.name && item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const mapRef = useRef();

  const handleEditShape = (shape) => {
    setEditingShape(shape);
    setIsFormOpen(true);
  };

  const handleShapeSubmit = async (savedShape, metadata) => {
    console.log("Shape data received:", savedShape, metadata);
    try {
      if (metadata?.operation === "update") {
        setShapes((prevShapes) =>
          prevShapes.map((s) => (s.id === savedShape.id ? savedShape : s))
        );
        setEditingShape(null);
        console.log("Shape updated successfully:", savedShape);
      } else {
        setShapes((prevShapes) => [...prevShapes, savedShape]);
        console.log("New shape added successfully:", savedShape);
      }

      setIsFormOpen(false);

      setTimeout(() => {
        if (mapRef.current) {
          mapRef.current.invalidateSize();
        }
      }, 100);

      // Використовуємо новий стан для меж
      if (savedShape.geoJson) {
        try {
          const geoJsonLayer = L.geoJSON(savedShape.geoJson);
          const layerBounds = geoJsonLayer.getBounds();
          if (layerBounds.isValid()) {
            setSelectedShapeBounds(layerBounds);
          }
        } catch (error) {
          console.error("Error fitting bounds to shape:", error);
        }
      }
    } catch (error) {
      console.error("Error handling shape submit:", error);
    }
  };

  const handleMapClick = (e) => {
    if (!isLoggedIn || !adding) return;
    if (e?.latlng) {
      const { lat, lng } = e.latlng;
      setNewMarker({ lat, lng, type: "default" });
    } else {
      console.warn("Клік без координат:", e);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setShowLogin(false);
    setAdding(false);
    setNewMarker(null);
    setEditingMarker(null);
    setSelectedMarker(null);
    setEditingShape(null);
    setIsFormOpen(false);
    setMapCenter([50.45, 30.52]);
    setMapZoom(13);
    console.log("User logged out. Token state is now null.");
  };

  const handleAddSave = async (markerData) => {
    console.log("Attempting to add new point marker:", markerData);
    try {
      const saved = await saveMarker({
        ...markerData,
        lat: markerData.lat,
        lng: markerData.lng,
        type: markerData.type || "default",
        token: token,
      });
      setPointMarkers((prev) => [...prev, saved]);
      setNewMarker(null);
      setAdding(false);
      setSelectedMarker(saved);
      console.log("Point marker added successfully to backend:", saved);
    } catch (error) {
      console.error("Помилка додавання маркера (Backend):", error);
    }
  };

  const handleEditSave = async (updatedItem) => {
    console.log("Attempting to update point marker:", updatedItem);
    try {
      if (updatedItem.type !== "shape") {
        const pointDataToSave = {
          name: updatedItem.name,
          description: updatedItem.description,
          type: updatedItem.type,
          latitude: updatedItem.lat,
          longitude: updatedItem.lng,
        };
        const updated = await updateMarker(
          updatedItem.id,
          pointDataToSave,
          token
        );
        setPointMarkers((prev) =>
          prev.map((m) => (m.id === updated.id ? updated : m))
        );
        console.log("Point marker updated successfully in backend:", updated);
      } else {
        console.warn(
          "handleEditSave received a shape type. Use handleShapeSubmit instead."
        );
      }
      setEditingMarker(null);
      setSelectedMarker(updatedItem);
    } catch (error) {
      console.error("Помилка редагування елемента:", error);
    }
  };

  const handleDelete = async (idToDelete) => {
    const itemToDelete = [...pointMarkers, ...shapes].find(
      (m) => m.id === idToDelete
    );

    if (!itemToDelete) {
      console.warn("Item not found for deletion:", idToDelete);
      return;
    }

    if (true) {
      try {
        if (itemToDelete.type === "shape") {
          await deleteShape(idToDelete, token);
          setShapes((prev) => prev.filter((s) => s.id !== idToDelete));
          console.log("Shape deleted successfully from backend.");
        } else {
          await deleteMarker(idToDelete, token);
          setPointMarkers((prev) => prev.filter((m) => m.id !== idToDelete));
          console.log("Point marker deleted successfully from backend.");
        }

        setEditingMarker(null);
        if (selectedMarker?.id === idToDelete) {
          setSelectedMarker(null);
        }
      } catch (error) {
        console.error("Помилка видалення елемента (Backend):", error);
      }
    }
  };

  const getMarkerIcon = (type) => {
    const iconOptions = {
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41],
    };

    let iconUrl;
    switch (type) {
      case "restaurant":
        iconUrl = "/icons/restaurant.png";
        break;
      case "museum":
        iconUrl = "/icons/museum.png";
        break;
      case "park":
        iconUrl = "/icons/park.png";
        break;
      case "gasStation":
        iconUrl = "/icons/gasStation.png";
        break;
      case "mall":
        iconUrl = "/icons/mall.png";
        break;
      case "beach":
        iconUrl = "/icons/beach.png";
        break;
      case "station":
        iconUrl = "/icons/train.png";
        break;
      case "historicSite":
        iconUrl = "/icons/historic-site.png";
        break;
      case "leisure":
        iconUrl = "/icons/leisure.png";
        break;
      default:
        return new L.Icon.Default();
    }
    return new L.Icon({
      iconUrl,
      ...iconOptions,
      iconSize: [32, 32],
    });
  };

  const handleSelectMarker = (item) => {
    console.log("handleSelectMarker called with item:", item);

    console.log("Debug info for selected item:", {
      type: item.type,
      hasGeoJson: !!item.geoJson,
      mapRefCurrent: !!mapRef.current,
    });

    setSelectedMarker(item);
    setSearchTerm(item.name);

    if (item.type !== "shape" && item.lat && item.lng) {
      setMapCenter([item.lat, item.lng]);
      setMapZoom(15);
      setSelectedShapeBounds(null);
    } else if (item.type === "shape" && item.geoJson) {
      try {
        const geoJsonCopy = JSON.parse(JSON.stringify(item.geoJson));
        console.log("Processing GeoJSON:", geoJsonCopy);

        // Helper function to properly convert coordinates
        const convertCoordinates = (coords, depth = 0) => {
          if (depth > 5) {
            console.warn("Maximum recursion depth reached");
            return coords;
          }

          if (Array.isArray(coords)) {
            if (
              coords.length === 2 &&
              typeof coords[0] === "number" &&
              typeof coords[1] === "number"
            ) {
              // This is a coordinate pair [lng, lat]
              return [parseFloat(coords[0]), parseFloat(coords[1])];
            } else {
              // This is an array of coordinates or deeper nesting
              return coords.map((coord) =>
                convertCoordinates(coord, depth + 1)
              );
            }
          } else if (typeof coords === "string") {
            return parseFloat(coords);
          }
          return coords;
        };

        // Convert coordinates if they exist
        if (geoJsonCopy.geometry && geoJsonCopy.geometry.coordinates) {
          geoJsonCopy.geometry.coordinates = convertCoordinates(
            geoJsonCopy.geometry.coordinates
          );
          console.log(
            "Converted coordinates:",
            geoJsonCopy.geometry.coordinates
          );
        }

        // Create GeoJSON layer and get bounds
        const geoJsonLayer = L.geoJSON(geoJsonCopy);
        const layerBounds = geoJsonLayer.getBounds();

        if (layerBounds.isValid()) {
          console.log("Valid bounds found, fitting to bounds:", layerBounds);
          setSelectedShapeBounds(layerBounds);
          setMapCenter(null);
          setMapZoom(null);
        } else {
          console.warn(
            "Invalid bounds for selected shape. Trying fallback methods."
          );
          setSelectedShapeBounds(null);

          // Fallback: try to get center point from geometry
          let centerPoint = null;
          const geometry = geoJsonCopy.geometry;

          if (geometry && geometry.coordinates) {
            switch (geometry.type) {
              case "Point":
                if (
                  Array.isArray(geometry.coordinates) &&
                  geometry.coordinates.length >= 2
                ) {
                  centerPoint = [
                    geometry.coordinates[1],
                    geometry.coordinates[0],
                  ]; // [lat, lng]
                }
                break;

              case "LineString":
                if (
                  Array.isArray(geometry.coordinates) &&
                  geometry.coordinates[0] &&
                  geometry.coordinates[0].length >= 2
                ) {
                  centerPoint = [
                    geometry.coordinates[0][1],
                    geometry.coordinates[0][0],
                  ]; // [lat, lng]
                }
                break;

              case "Polygon":
                if (
                  Array.isArray(geometry.coordinates) &&
                  geometry.coordinates[0] &&
                  geometry.coordinates[0][0] &&
                  geometry.coordinates[0][0].length >= 2
                ) {
                  // Calculate centroid of polygon
                  const ring = geometry.coordinates[0];
                  let sumLat = 0,
                    sumLng = 0,
                    count = 0;

                  for (const coord of ring) {
                    if (Array.isArray(coord) && coord.length >= 2) {
                      sumLng += parseFloat(coord[0]);
                      sumLat += parseFloat(coord[1]);
                      count++;
                    }
                  }

                  if (count > 0) {
                    centerPoint = [sumLat / count, sumLng / count]; // [lat, lng]
                  }
                }
                break;

              case "MultiPolygon":
                if (
                  Array.isArray(geometry.coordinates) &&
                  geometry.coordinates[0] &&
                  geometry.coordinates[0][0] &&
                  geometry.coordinates[0][0][0] &&
                  geometry.coordinates[0][0][0].length >= 2
                ) {
                  centerPoint = [
                    geometry.coordinates[0][0][0][1],
                    geometry.coordinates[0][0][0][0],
                  ]; // [lat, lng]
                }
                break;
            }
          }

          if (centerPoint && !isNaN(centerPoint[0]) && !isNaN(centerPoint[1])) {
            console.log("Using calculated center point:", centerPoint);
            setMapCenter(centerPoint);
            setMapZoom(15);
          } else {
            console.error(
              "Could not determine center point for shape:",
              geometry
            );
            // Last fallback - don't change map position
          }
        }
      } catch (error) {
        console.error(
          "Error processing GeoJSON for selected shape:",
          error,
          item.geoJson
        );
        setSelectedShapeBounds(null);
      }
    }
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingShape(null);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [fetchedPointsData, fetchedShapesData] = await Promise.all([
          fetchMarkers(),
          fetchShapes(),
        ]);

        const normalizedFetchedPoints = fetchedPointsData
          .filter((m) => m.type !== "shape" && m.lat && m.lng)
          .map((m) => ({
            id: m.id,
            name: m.name,
            description: m.description,
            lat: m.lat,
            lng: m.lng,
            type: m.type || "default",
            geoJson: null,
          }));
        setPointMarkers(normalizedFetchedPoints);

        const normalizedShapes = fetchedShapesData
          .map((shape) => {
            const geoJsonData = shape.geoJson?.geoJson || shape.geoJson;

            return {
              ...shape,
              type: "shape",
              geoJson: geoJsonData,
            };
          })
          .filter((s) => s.geoJson && s.geoJson.type);

        setShapes(normalizedShapes);
        console.log("Shapes after normalization:", normalizedShapes);
      } catch (error) {
        console.error("Map.jsx: Error during unified data fetch:", error);
        setPointMarkers([]);
        setShapes([]);
      }
    };
    fetchData();
  }, [token]);

  const setMapInstance = (map) => {
    mapRef.current = map;
  };

  return (
    <div>
      {isLoggedIn && (
        <button
          onClick={() => {
            setEditingShape(null);
            setIsFormOpen(!isFormOpen);
          }}
          style={{
            position: "absolute",
            top: 10,
            left: 50,
            height: 32,
            width: 32,
            zIndex: 1000,
            padding: "8px 12px",
            backgroundColor: "#2b2a33",
            color: "#fff",
            border: "1px solid #8f8f9d",
            borderRadius: "5px",
            cursor: "pointer",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          {isFormOpen ? "⨉" : "▢"}
        </button>
      )}

      {isFormOpen && isLoggedIn && (
        <ShapeForm
          onSubmit={handleShapeSubmit}
          onClose={handleFormClose}
          userToken={token}
          editingShape={editingShape}
        />
      )}

      {!isLoggedIn && (
        <button
          onClick={() => setShowLogin(true)}
          style={{
            position: "absolute",
            top: 10,
            right: 10,
            zIndex: 1000,
            padding: "8px 12px",
            cursor: "pointer",
          }}
        >
          Увійти
        </button>
      )}

      {showLogin && !isLoggedIn && (
        <div
          style={{
            position: "absolute",
            top: 50,
            right: 10,
            zIndex: 1000,
            backgroundColor: "white",
            padding: 16,
            borderRadius: 8,
            boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
          }}
        >
          <LoginForm
            onSuccess={() => {
              const newToken = localStorage.getItem("token");
              setToken(newToken);
              setShowLogin(false);
            }}
          />
          <button
            onClick={() => setShowLogin(false)}
            style={{ marginTop: 8, cursor: "pointer" }}
          >
            Закрити
          </button>
        </div>
      )}

      {isLoggedIn && (
        <>
          <button
            onClick={handleLogout}
            style={{
              position: "absolute",
              top: 10,
              right: 10,
              zIndex: 1000,
              padding: "8px 12px",
              cursor: "pointer",
            }}
          >
            Вийти
          </button>

          <button
            onClick={() => {
              setAdding(true);
              setNewMarker(null);
            }}
            style={{
              position: "absolute",
              zIndex: 1000,
              top: 76,
              left: 10,
              width: 32,
              height: 32,
              borderRadius: "7%",
              border: "1px solid #8f8f9d",
              backgroundColor: adding ? "#4a90e2" : "#2b2a33", // Visual feedback when active
              cursor: "pointer",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
            title={adding ? "Режим додавання активний" : "Додати маркер"}
          >
            <span
              style={{
                filter: adding ? "none" : "grayscale(1) invert(0.75)",
                fontSize: "18px",
                lineHeight: "1",
              }}
            >
              📍
            </span>
          </button>

          {/* Cancel button when in adding mode */}
          {adding && (
            <button
              onClick={() => {
                setAdding(false);
                setNewMarker(null);
              }}
              style={{
                position: "absolute",
                zIndex: 1000,
                top: 76,
                left: 50, // Position next to the add button
                width: 32,
                height: 32,
                borderRadius: "7%",
                border: "1px solid #8f8f9d",
                backgroundColor: "#dc3545",
                cursor: "pointer",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
              title="Скасувати додавання"
            >
              <span
                style={{ color: "white", fontSize: "16px", lineHeight: "1" }}
              >
                ✕
              </span>
            </button>
          )}
        </>
      )}

      <div
        style={{
          position: "absolute",
          top: 10,
          left: isLoggedIn ? 90 : 50,
          zIndex: 1000,
          backgroundColor: "#2b2a33",
          borderRadius: "5px",
          boxShadow: "0 2px 5px rgba(0,0,0,0.5)",
          color: "#eee",
          padding: "0",
          overflow: "hidden",
        }}
      >
        <input
          type="text"
          placeholder="Пошук маркерів..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            if (!e.target.value) {
              setSelectedMarker(null);
            }
          }}
          style={{
            border: "1px solid #8f8f9d",
            borderBottom:
              searchTerm && filteredDisplayItems.length > 0
                ? "none"
                : "1px solid #8f8f9d",
            padding: "8px",
            width: "200px",
            backgroundColor: "#2b2a33",
            color: "#fff",
            outline: "none",
            borderTopLeftRadius: "5px",
            borderTopRightRadius: "5px",
            borderBottomLeftRadius:
              searchTerm && filteredDisplayItems.length > 0 ? "0" : "5px",
            borderBottomRightRadius:
              searchTerm && filteredDisplayItems.length > 0 ? "0" : "5px",
            marginBottom:
              searchTerm && filteredDisplayItems.length > 0 ? "-1px" : "0",
          }}
        />
        {searchTerm && filteredDisplayItems.length > 0 && (
          <ul
            style={{
              listStyle: "none",
              padding: "0 0",
              margin: "0",
              maxHeight: "150px",
              overflowY: "auto",
              borderTop: "1px solid #8f8f9d",
              backgroundColor: "#2b2a33",
              borderBottomLeftRadius: "5px",
              borderBottomRightRadius: "5px",
            }}
          >
            {filteredDisplayItems.map((item) => (
              <li
                key={item.id}
                onClick={() => handleSelectMarker(item)}
                style={{
                  padding: "8px 10px",
                  cursor: "pointer",
                  backgroundColor:
                    selectedMarker?.id === item.id
                      ? "#424242ff"
                      : "transparent",
                  borderTop: "1px solid #8f8f9d",
                  color: "#eee",
                }}
              >
                {item.name}
              </li>
            ))}
          </ul>
        )}
        {searchTerm && filteredDisplayItems.length === 0 && (
          <p
            style={{
              margin: "0",
              padding: "8px 10px",
              fontSize: "0.9em",
              color: "#eee",
              borderBottom: "1px solid #8f8f9d",
              borderBottomLeftRadius: "5px",
              borderBottomRightRadius: "5px",
            }}
          >
            Не знайдено маркерів.
          </p>
        )}
      </div>

      <MapContainer
        center={mapCenter}
        zoom={mapZoom}
        style={{ height: "100vh", width: "100vw" }}
        whenCreated={setMapInstance}
      >
        {shapes.length > 0 && (
          <ShapeMaskOverlay
            key={`overlay-${shapes.map((s) => s.id).join("-")}`}
            shapes={shapes}
            maskOpacity={0.6}
          />
        )}

        <TileLayer
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          attribution="Tiles © Esri — Source: Esri, Maxar, Earthstar Geographics"
        />

        <MapViewHandler
          center={mapCenter}
          zoom={mapZoom}
          selectedShapeBounds={selectedShapeBounds}
        />

        <ClickToAddMarker onMapClick={handleMapClick} enabled={adding} />

        {/* New marker with higher z-index */}
        {newMarker && isLoggedIn && (
          <Marker
            position={[newMarker.lat, newMarker.lng]}
            zIndexOffset={1000} // Higher priority
          >
            <Popup>
              <MarkerPopup
                marker={newMarker}
                isNew={true}
                onSave={handleAddSave}
                onCancel={() => setNewMarker(null)}
              />
            </Popup>
          </Marker>
        )}

        {/* Point markers with higher z-index */}
        {pointMarkers.map((item) => {
          const isBeingEdited = editingMarker?.id === item.id;
          return (
            <Marker
              key={`marker-${item.id}`}
              position={[item.lat, item.lng]}
              icon={getMarkerIcon(item.type)}
              zIndexOffset={1000} // Higher priority over shapes
            >
              <Popup>
                <>
                  {isBeingEdited ? (
                    <MarkerPopup
                      marker={item}
                      onSave={handleEditSave}
                      onDelete={handleDelete}
                      onCancel={() => setEditingMarker(null)}
                    />
                  ) : (
                    <>
                      <strong>{item.name}</strong>
                      <p>{item.description}</p>
                      {isLoggedIn && (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingMarker(item);
                            }}
                            style={{
                              marginRight: 8,
                              height: 23,
                              width: 23,
                              textAlign: "center",
                            }}
                          >
                            ✎
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm("Видалити маркер?")) {
                                handleDelete(item.id);
                              }
                            }}
                            style={{
                              marginRight: 8,
                              height: 23,
                              width: 23,
                              textAlign: "center",
                            }}
                          >
                            🗑
                          </button>
                        </>
                      )}
                    </>
                  )}
                </>
              </Popup>
            </Marker>
          );
        })}

        {shapes.map((shape) => (
          <ShapeMarker
            key={`shape-${shape.id}-${JSON.stringify(
              shape.geoJson?.properties || {}
            )}`}
            shape={shape}
            isLoggedIn={isLoggedIn}
            onEditShape={handleEditShape}
            handleDelete={handleDelete}
            disableClick={adding}
          />
        ))}

        <MouseCoordinatesDisplay
          position="bottom-right"
          precision={5}
          showDMS={false}
        />
      </MapContainer>
    </div>
  );
};

export default Map;

/*
<a href="https://www.flaticon.com/free-icons/restaurant" title="restaurant icons">Restaurant icons created by Eucalyp - Flaticon</a>
<a href="https://www.flaticon.com/free-icons/museum" title="museum icons">Museum icons created by Freepik - Flaticon</a>
<a href="https://www.flaticon.com/free-icons/park" title="park icons">Park icons created by setiawanap - Flaticon</a>
<a href="https://www.flaticon.com/free-icons/gas" title="gas icons">Gas icons created by Pixel perfect - Flaticon</a>
<a href="https://www.flaticon.com/free-icons/shopping-mall" title="shopping mall icons">Shopping mall icons created by Freepik - Flaticon</a>
<a href="https://www.flaticon.com/free-icons/summer" title="summer icons">Summer icons created by Freepik - Flaticon</a>
<a href="https://www.flaticon.com/free-icons/train" title="train icons">Train icons created by nawicon - Flaticon</a>
<a href="https://www.flaticon.com/free-icons/historic-site" title="historic site icons">Historic site icons created by SBTS2018 - Flaticon</a>
<a href="https://www.flaticon.com/free-icons/bench" title="bench icons">Bench icons created by Eucalyp - Flaticon</a>
*/
