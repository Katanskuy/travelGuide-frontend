const API_URL = "http://localhost:1337/api/map-markers";

// No need for 'const token = localStorage.getItem("token");' here anymore.
// The token will be passed dynamically.

export async function fetchMarkers() {
  const res = await fetch(
    `http://localhost:1337/api/map-markers?pagination[pageSize]=100`
  );
  if (!res.ok) throw new Error("Не вдалося завантажити маркери");
  const json = await res.json();
  return json.data.map((item) => ({
    id: item.id,
    lat: item.attributes.latitude,
    lng: item.attributes.longitude,
    name: item.attributes.name, // Changed from 'title' to 'name' for consistency with save/update
    description: item.attributes.description,
    type: item.attributes.type,
  }));
}

export async function saveMarker({ lat, lng, name, description, type, token }) {
  // Add token here
  const newMarkerData = {
    data: {
      name,
      latitude: lat,
      longitude: lng,
      description,
      type,
    },
  };

  const res = await fetch(`http://localhost:1337/api/map-markers`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`, // <-- ADD THIS HEADER
    },
    body: JSON.stringify(newMarkerData),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Помилка: ${err}`);
  }

  const saved = await res.json();
  const m = saved.data;
  return {
    id: m.id,
    lat: m.attributes.latitude,
    lng: m.attributes.longitude,
    name: m.attributes.name, // Changed from 'title' to 'name'
    description: m.attributes.description,
    type: m.attributes.type,
  };
}

export const deleteMarker = async (id, token) => {
  // Add token here
  const response = await fetch(`http://localhost:1337/api/map-markers/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`, // <-- ADD THIS HEADER
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Помилка видалення: ${error}`);
  }

  return true;
};

export const updateMarker = async (id, marker, token) => {
  // Add token here
  const response = await fetch(`http://localhost:1337/api/map-markers/${id}`, {
    // Ensure this is http://localhost
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`, // <-- ADD THIS HEADER
    },
    body: JSON.stringify({ data: marker }),
  });
  const json = await response.json();

  if (!json.data) throw new Error("Empty data from server");

  return {
    id: json.data.id,
    ...json.data.attributes,
    name: json.data.attributes.name, // Ensure 'name' is used instead of 'title' if that's the attribute
    lat: json.data.attributes.latitude,
    lng: json.data.attributes.longitude,
  };
};
