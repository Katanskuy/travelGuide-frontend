import { useState } from "react";

const EditablePopup = ({ marker, onUpdate }) => {
  const [title, setTitle] = useState(marker.title);
  const [description, setDescription] = useState(marker.description);
  const [editing, setEditing] = useState(false);

  const handleSave = () => {
    onUpdate(marker.id, title, description);
    setEditing(false);
  };

  return (
    <div>
      {editing ? (
        <>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={{ width: "100%", marginBottom: "4px" }}
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            style={{ width: "100%" }}
          />
          <button onClick={handleSave}>Зберегти</button>
        </>
      ) : (
        <>
          <h3 style={{ margin: 0 }}>{marker.title}</h3>
          <p style={{ margin: 0 }}>{marker.description}</p>
          <button onClick={() => setEditing(true)}>Редагувати</button>
        </>
      )}
    </div>
  );
};

export default EditablePopup;
