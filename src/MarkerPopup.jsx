// src/MarkerPopup.jsx

import React, { useState, useEffect } from "react";

const MarkerPopup = ({
  marker,
  isNew = false,
  onSave,
  onCancel,
  onDelete,
  showTypeDropdown = true,
}) => {
  // ADDED showTypeDropdown prop

  // Function to safely get initial name for formData
  const getInitialName = (m) => {
    if (!m) return "";

    if (m.name) return m.name;
    if (m.title) return m.title;
    if (typeof m.lat === "number" && typeof m.lng === "number") {
      return `${m.lat.toFixed(4)} ${m.lng.toFixed(4)}`;
    }
    return "";
  };

  const [formData, setFormData] = useState({
    name: getInitialName(marker),
    description: marker?.description || "",
    type: marker?.type || "default",
  });

  useEffect(() => {
    if (marker) {
      setFormData({
        name: getInitialName(marker),
        description: marker.description || "",
        type: marker.type || "default",
      });
    } else {
      setFormData({ name: "", description: "", type: "default" });
    }
  }, [marker]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ ...marker, ...formData });
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Назва"
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        required
      />
      <br />
      <textarea
        placeholder="Опис"
        value={formData.description}
        onChange={(e) =>
          setFormData({ ...formData, description: e.target.value })
        }
      />
      <br />
      {showTypeDropdown && (
        <select
          value={formData.type}
          onChange={(e) => setFormData({ ...formData, type: e.target.value })}
        >
          <option value="default">Звичайний</option>
          <option value="restaurant">Ресторан</option>
          <option value="museum">Музей</option>
          <option value="park">Парк</option>
          <option value="gasStation">Заправка</option>
          <option value="mall">Торговий Центр</option>
          <option value="beach">Пляж</option>
          <option value="station">Метро</option>
          <option value="historicSite">Історичне місце</option>
          <option value="leisure">Місце відпочинку</option>
        </select>
      )}
      <button type="submit" style={{ marginLeft: 4, height: 23, width: 23 }}>
        ✓
      </button>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onCancel();
        }}
        title={isNew ? "Відмінити додавання" : "Відмінити редагування"}
        style={{ marginLeft: 4, height: 23, width: 23 }}
      >
        ⨉
      </button>
      {!isNew && (
        <button
          type="button"
          onClick={() => {
            if (window.confirm("Видалити маркер?")) {
              onDelete(marker.id);
            }
          }}
          title="Видалити"
          style={{ marginLeft: 4, height: 23, width: 23 }}
        >
          🗑
        </button>
      )}
    </form>
  );
};

export default MarkerPopup;
