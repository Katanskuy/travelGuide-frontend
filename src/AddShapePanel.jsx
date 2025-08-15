import { useState } from "react";
import ShapeForm from "./ShapeForm";

const AddShapePanel = ({ onAddShape }) => {
  const [showForm, setShowForm] = useState(false);

  return (
    <div style={{ position: "absolute", top: 10, left: 10, zIndex: 1000 }}>
      <button onClick={() => setShowForm(!showForm)}>
        {showForm ? "Закрити" : "Додати фігуру"}
      </button>

      {showForm && <ShapeForm onSubmit={onAddShape} />}
    </div>
  );
};

export default AddShapePanel;
