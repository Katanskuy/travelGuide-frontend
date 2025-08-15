import { useState } from "react";
import "./App.css";
import Map from "./Map";
import "leaflet/dist/leaflet.css";
import "leaflet-defaulticon-compatibility";
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css";

function App() {
  return (
    <div style={{ height: "100vh", width: "100vw" }}>
      <Map />
    </div>
  );
}

export default App;
