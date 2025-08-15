import { useState, useEffect } from "react";
import { SketchPicker } from "react-color";
import { saveShape, updateShape } from "./ShapeService";
import "./ShapeForm.css";

const ShapeForm = ({ onSubmit, onClose, userToken, editingShape = null }) => {
  const [points, setPoints] = useState([]);
  const [lng, setLng] = useState("");
  const [lat, setLat] = useState("");
  const [strokeColor, setStrokeColor] = useState("#ff0000");
  const [fillColor, setFillColor] = useState("#ff0000");
  const [fillOpacity, setFillOpacity] = useState(0.5);
  const [lineStyle, setLineStyle] = useState("solid");
  const [transparentFill, setTransparentFill] = useState(false);

  const [shapeName, setShapeName] = useState("");
  const [shapeDescription, setShapeDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [showStrokePicker, setShowStrokePicker] = useState(false);
  const [showFillPicker, setShowFillPicker] = useState(false);

  const isEditMode = editingShape !== null;

  const extractPointsFromGeoJSON = (geoJson) => {
    try {
      if (geoJson && geoJson.geometry && geoJson.geometry.coordinates) {
        const coordinates = geoJson.geometry.coordinates[0];
        return coordinates.slice(0, -1);
      }
    } catch (error) {
      console.error("Error extracting points from GeoJSON:", error);
    }
    return [];
  };

  const extractColorFromHex = (hexColor) => {
    if (!hexColor || hexColor === "transparent") return "#ff0000";
    return hexColor.length > 7 ? hexColor.substring(0, 7) : hexColor;
  };

  const extractOpacityFromHex = (hexColor) => {
    if (!hexColor || hexColor === "transparent" || hexColor.length <= 7)
      return 0.5;
    const alphaHex = hexColor.substring(7, 9);
    return parseInt(alphaHex, 16) / 255;
  };

  useEffect(() => {
    if (isEditMode && editingShape) {
      setShapeName(editingShape.name || "");
      setShapeDescription(editingShape.description || "");

      const extractedPoints = extractPointsFromGeoJSON(editingShape.geoJson);
      setPoints(extractedPoints);

      const properties = editingShape.geoJson?.properties || {};
      const shapeProps = editingShape;

      setStrokeColor(
        extractColorFromHex(properties.strokeColor || shapeProps.strokeColor) ||
          "#ff0000"
      );

      const fillColorFromProps = properties.fillColor || shapeProps.fillColor;
      if (fillColorFromProps === "transparent") {
        setTransparentFill(true);
        setFillColor("#ff0000");
        setFillOpacity(0);
      } else {
        setTransparentFill(false);
        setFillColor(extractColorFromHex(fillColorFromProps) || "#ff0000");
        setFillOpacity(
          extractOpacityFromHex(fillColorFromProps) || properties.opacity || 0.5
        );
      }

      setLineStyle(properties.lineStyle || "solid");

      console.log("Pre-populated form with:", {
        name: editingShape.name,
        points: extractedPoints,
        strokeColor: extractColorFromHex(
          properties.strokeColor || shapeProps.strokeColor
        ),
        fillColor: extractColorFromHex(fillColorFromProps),
        opacity:
          extractOpacityFromHex(fillColorFromProps) || properties.opacity,
        lineStyle: properties.lineStyle,
      });
    } else {
      // Clear form for new shape
      setShapeName("");
      setShapeDescription("");
      setPoints([]);
      setStrokeColor("#ff0000");
      setFillColor("#ff0000");
      setFillOpacity(0.5);
      setLineStyle("solid");
      setTransparentFill(false);
    }
  }, [isEditMode, editingShape]);

  const addPoint = () => {
    const parsedLng = parseFloat(lng);
    const parsedLat = parseFloat(lat);
    if (!isNaN(parsedLng) && !isNaN(parsedLat)) {
      setPoints([...points, [parsedLng, parsedLat]]);
      setLng("");
      setLat("");
    } else {
      alert("Введи коректні координати!");
    }
  };

  const removePoint = (index) => {
    setPoints(points.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Replaced alerts with comments to avoid modal issues.
    if (points.length < 3) {
      // Треба мінімум 3 точки для фігури.
      return;
    }

    if (!shapeName.trim()) {
      // Введіть назву фігури.
      return;
    }

    if (!userToken) {
      // Помилка автентифікації. Увійдіть знову.
      return;
    }

    setIsSubmitting(true);

    try {
      const closedPoints = [...points, points[0]];

      const geoJson = {
        type: "Feature",
        geometry: {
          type: "Polygon",
          coordinates: [closedPoints],
        },
        properties: {
          name: shapeName,
          description: shapeDescription,
          strokeColor,
          fillColor: transparentFill
            ? "transparent"
            : `${fillColor}${Math.round(fillOpacity * 255)
                .toString(16)
                .padStart(2, "0")}`,
          lineStyle,
          opacity: fillOpacity,
        },
      };

      const shapeDataForServer = {
        name: shapeName,
        description: shapeDescription || `Фігура з ${points.length} точками`,
        type: "polygon",
        geoJson,
        token: userToken,
      };

      let savedShape;
      if (isEditMode) {
        // Update existing shape
        savedShape = await updateShape(
          editingShape.id,
          shapeDataForServer,
          userToken
        );
      } else {
        // Create new shape
        savedShape = await saveShape(shapeDataForServer);
      }

      if (!savedShape || !savedShape.id) {
        throw new Error("Server did not return a valid shape with ID");
      }

      // Enhanced callback with operation type for better parent handling
      if (onSubmit) {
        onSubmit(savedShape, {
          operation: isEditMode ? "update" : "create",
          originalShape: isEditMode ? editingShape : null,
        });
      }

      // Reset form only if not in edit mode
      if (!isEditMode) {
        setPoints([]);
        setShapeName("");
        setShapeDescription("");
        setTransparentFill(false);
        setFillOpacity(0.5);
      }

      if (onClose) {
        onClose();
      }

      // Force a small delay to ensure state updates propagate
      setTimeout(() => {
        console.log(
          `Shape ${isEditMode ? "updated" : "created"} successfully:`,
          savedShape
        );
      }, 100);

      // Replaced alerts with comments.
      // alert(isEditMode ? "Фігуру успішно оновлено!" : "Фігуру успішно збережено!");
    } catch (error) {
      console.error("Detailed error saving shape:", error);
      // Error handling comments
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStrokeColorChange = (color) => {
    setStrokeColor(color.hex);
  };

  const handleFillColorChange = (color) => {
    setFillColor(color.hex);
  };

  return (
    <form onSubmit={handleSubmit} className="shapeForm">
      <div className="headerDiv">
        <h3 style={{ margin: "0 0 0 0" }}>
          {isEditMode
            ? `Редагувати фігуру: ${editingShape?.name}`
            : "Створити фігуру"}
        </h3>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            style={{
              cursor: isSubmitting ? "not-allowed" : "pointer",
            }}
            className="close"
          >
            ⨉
          </button>
        )}
      </div>

      <div className="input-container">
        <div style={{ marginBottom: "1rem" }}>
          <label style={{ display: "block", marginBottom: "0.5rem" }}>
            Назва фігури*:
            <input
              value={shapeName}
              onChange={(e) => setShapeName(e.target.value)}
              type="text"
              required
              placeholder="Введіть назву фігури"
              className="shapeName"
            />
          </label>
        </div>

        <div style={{ marginBottom: "1rem" }}>
          <label style={{ display: "block", marginBottom: "0.5rem" }}>
            Опис (необов'язково):
            <textarea
              value={shapeDescription}
              onChange={(e) => setShapeDescription(e.target.value)}
              rows="3"
              placeholder="Додайте опис фігури"
              className="shapeDesc"
            />
          </label>
        </div>
      </div>

      <div style={{ marginBottom: "1rem" }}>
        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.5rem" }}>
          <label style={{ flex: 1 }}>
            Довгота (lng):
            <input
              value={lng}
              onChange={(e) => setLng(e.target.value)}
              type="number"
              step="0.0001"
              className="shapeLng"
            />
          </label>
          <label style={{ flex: 1 }}>
            Широта (lat):
            <input
              value={lat}
              onChange={(e) => setLat(e.target.value)}
              type="number"
              step="0.0001"
              className="shapeLat"
            />
          </label>
        </div>
        <button type="button" onClick={addPoint} className="addPoint">
          Додати точку
        </button>
      </div>

      {points.length > 0 && (
        <div style={{ marginBottom: "1rem" }}>
          <h4>Точки фігури ({points.length}):</h4>
          <ul className="points">
            {points.map(([lng, lat], index) => (
              <li key={index} className="pointsLi">
                <span>
                  [{lng.toFixed(4)}, {lat.toFixed(4)}]
                </span>
                <button
                  onClick={() => removePoint(index)}
                  type="button"
                  className="removePoint"
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div style={{ marginBottom: "1rem" }}>
        <label style={{ display: "block", marginBottom: "0.5rem" }}>
          Колір обводки:
        </label>
        <div style={{ position: "relative" }}>
          <div
            onClick={() => setShowStrokePicker(!showStrokePicker)}
            className="borderColor"
            style={{ backgroundColor: strokeColor }}
          />
          {showStrokePicker && (
            <div style={{ position: "absolute", zIndex: 2, top: "35px" }}>
              <div
                style={{
                  position: "fixed",
                  top: 0,
                  right: 0,
                  bottom: 0,
                  left: 0,
                }}
                onClick={() => setShowStrokePicker(false)}
              />
              <SketchPicker
                color={strokeColor}
                onChange={handleStrokeColorChange}
              />
            </div>
          )}
        </div>
      </div>

      <div style={{ marginBottom: "1rem" }}>
        <label style={{ display: "block", marginBottom: "0.5rem" }}>
          Тип лінії:
        </label>
        <select
          value={lineStyle}
          onChange={(e) => setLineStyle(e.target.value)}
          className="lineType"
        >
          <option value="solid">Суцільна</option>
          <option value="dashed">Пунктир</option>
          <option value="dotted">Точкова</option>
        </select>
      </div>

      <div style={{ marginBottom: "1rem" }}>
        <label
          style={{ display: "flex", alignItems: "center", cursor: "pointer" }}
        >
          <input
            type="checkbox"
            checked={transparentFill}
            onChange={(e) => setTransparentFill(e.target.checked)}
            style={{ marginRight: "0.5rem" }}
          />
          Прозора заливка
        </label>
      </div>

      {!transparentFill && (
        <>
          <div style={{ marginBottom: "1rem" }}>
            <label style={{ display: "block", marginBottom: "0.5rem" }}>
              Колір заливки:
            </label>
            <div style={{ position: "relative" }}>
              <div
                onClick={() => setShowFillPicker(!showFillPicker)}
                style={{
                  backgroundColor: fillColor,
                }}
                className="fillColor"
              />
              {showFillPicker && (
                <div style={{ position: "absolute", zIndex: 2, top: "35px" }}>
                  <div
                    style={{
                      position: "fixed",
                      top: 0,
                      right: 0,
                      bottom: 0,
                      left: 0,
                    }}
                    onClick={() => setShowFillPicker(false)}
                  />
                  <SketchPicker
                    color={fillColor}
                    onChange={handleFillColorChange}
                  />
                </div>
              )}
            </div>
          </div>

          <div style={{ marginBottom: "1rem" }}>
            <label style={{ display: "block", marginBottom: "0.5rem" }}>
              Прозорість заливки: {Math.round(fillOpacity * 100)}%
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={fillOpacity}
              onChange={(e) => setFillOpacity(parseFloat(e.target.value))}
              style={{
                width: "100%",
                accentColor: fillColor,
              }}
            />
          </div>
        </>
      )}

      <button
        type="submit"
        disabled={points.length < 3 || !shapeName.trim() || isSubmitting}
        style={{
          backgroundColor:
            points.length < 3 || !shapeName.trim() || isSubmitting
              ? "#666"
              : "#2196F3",
          cursor:
            points.length < 3 || !shapeName.trim() || isSubmitting
              ? "not-allowed"
              : "pointer",
        }}
        className="submit"
      >
        {isSubmitting
          ? isEditMode
            ? "Оновлення..."
            : "Збереження..."
          : isEditMode
          ? `Оновити фігуру ${
              points.length > 0 ? `(${points.length} точок)` : ""
            }`
          : `Зберегти фігуру ${
              points.length > 0 ? `(${points.length} точок)` : ""
            }`}
      </button>
    </form>
  );
};

export default ShapeForm;
