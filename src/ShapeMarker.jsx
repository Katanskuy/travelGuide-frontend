import React from "react";
import L from "leaflet";
import { GeoJSON, Popup } from "react-leaflet";

const ShapeMarker = ({
  shape,
  isLoggedIn,
  onEditShape,
  handleDelete,
  disableClick = false,
}) => {
  if (!shape || !shape.geoJson) {
    console.warn("ShapeMarker: Invalid shape data, not rendering.", shape);
    return null;
  }

  const getShapeStyle = (feature) => {
    const props = feature.properties || {};
    const shapeProps = shape || {};
    return {
      color: props.strokeColor || shapeProps.strokeColor || "#3498db",
      weight: 3,
      opacity: 0.8,
      fillColor: props.fillColor || shapeProps.fillColor || "#3498db",
      fillOpacity: props.fillColor === "transparent" ? 0 : props.opacity || 0.5,
      dashArray:
        props.lineStyle === "dashed"
          ? "10, 10"
          : props.lineStyle === "dotted"
          ? "2, 5"
          : null,
      // Add interactive property based on disableClick
      interactive: !disableClick,
    };
  };

  const onEachFeature = (feature, layer) => {
    const item = {
      ...shape,
      name: shape.name || feature.properties?.name || "Без назви",
      description:
        shape.description || feature.properties?.description || "Без опису",
    };

    // If clicks are disabled, don't set up popup or event handlers
    if (disableClick) {
      // Make layer non-interactive
      layer.options.interactive = false;
      if (layer.setStyle) {
        layer.setStyle({ interactive: false });
      }
      return;
    }

    const createPopupContent = () => {
      const container = document.createElement("div");

      const title = document.createElement("strong");
      title.textContent = item.name;
      container.appendChild(title);

      const description = document.createElement("p");
      description.textContent = item.description;
      description.style.margin = "5px 0";
      container.appendChild(description);

      if (isLoggedIn) {
        const buttonContainer = document.createElement("div");
        buttonContainer.style.marginTop = "10px";
        buttonContainer.style.display = "flex";
        buttonContainer.style.gap = "8px";

        const editButton = document.createElement("button");
        editButton.innerHTML = "✎";
        editButton.style.padding = "4px 4px";
        editButton.style.cursor = "pointer";
        editButton.style.backgroundColor = "#2b2a33";
        editButton.style.color = "#8f8f9d";
        editButton.style.border = "1px solid #8f8f9d";
        editButton.style.borderRadius = "3px";
        editButton.style.fontSize = "12px";
        editButton.style.color = "white";
        editButton.style.height = "23px";
        editButton.style.width = "23px";

        editButton.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();
          layer.closePopup();
          onEditShape(item);
        });

        const deleteButton = document.createElement("button");
        deleteButton.innerHTML = "🗑";
        deleteButton.style.padding = "4px 6px";
        deleteButton.style.cursor = "pointer";
        deleteButton.style.backgroundColor = "#2b2a33";
        deleteButton.style.color = "#8f8f9d";
        deleteButton.style.border = "1px solid #8f8f9d";
        deleteButton.style.borderRadius = "3px";
        deleteButton.style.fontSize = "12px";
        deleteButton.style.color = "white";
        deleteButton.style.height = "23px";
        deleteButton.style.width = "23px";

        deleteButton.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();

          if (window.confirm("Видалити маркер?")) {
            layer.closePopup();
            handleDelete(item.id);
          }
        });

        buttonContainer.appendChild(editButton);
        buttonContainer.appendChild(deleteButton);
        container.appendChild(buttonContainer);
      }

      return container;
    };

    layer.bindPopup(createPopupContent, {
      className: "custom-popup",
      maxWidth: 300,
      closeButton: true,
    });

    layer.on("popupopen", function () {
      const popup = this.getPopup();
      const popupNode = popup.getElement();
      if (popupNode) {
        L.DomEvent.disableClickPropagation(popupNode);
        L.DomEvent.disableScrollPropagation(popupNode);
      }
    });

    // Only add hover effects if clicks are enabled
    layer.on("mouseover", function (e) {
      if (!disableClick) {
        this.setStyle({
          weight: 5,
          opacity: 1.0,
        });
      }
    });

    layer.on("mouseout", function (e) {
      if (!disableClick) {
        this.setStyle(getShapeStyle(feature));
      }
    });

    // Handle click events
    layer.on("click", function (e) {
      if (disableClick) {
        // Stop event propagation to prevent shape interaction
        L.DomEvent.stopPropagation(e);
        return false;
      }
    });
  };

  return (
    <GeoJSON
      key={`${shape.id}-${disableClick ? "disabled" : "enabled"}`} // Force re-render when disableClick changes
      data={shape.geoJson}
      style={getShapeStyle}
      onEachFeature={onEachFeature}
      eventHandlers={{
        click: (e) => {
          if (disableClick) {
            // Prevent the click from bubbling up to the map
            L.DomEvent.stopPropagation(e.originalEvent);
            return false;
          }
        },
      }}
    />
  );
};

export default ShapeMarker;
