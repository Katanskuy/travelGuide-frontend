const SHAPES_URL = "http://localhost:1337/api/shapes";

export async function fetchShapes() {
  const res = await fetch(`${SHAPES_URL}?pagination[pageSize]=100`);
  if (!res.ok) throw new Error("Не вдалося завантажити фігури");
  const json = await res.json();
  return json.data.map((item) => ({
    id: item.id,
    name: item.attributes.name,
    description: item.attributes.description,
    type: item.attributes.type,
    geoJson: item.attributes.geoJson,
  }));
}

export async function saveShape({ name, description, type, geoJson, token }) {
  const newShapeData = {
    data: {
      name,
      description,
      type,
      geoJson,
    },
  };

  const res = await fetch(SHAPES_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(newShapeData),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Помилка: ${err}`);
  }

  const saved = await res.json();
  const s = saved.data;
  return {
    id: s.id,
    ...s.attributes,
  };
}

export async function deleteShape(id, token) {
  const response = await fetch(`${SHAPES_URL}/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Помилка видалення: ${error}`);
  }

  return true;
}

export async function updateShape(id, shape, token) {
  const response = await fetch(`${SHAPES_URL}/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ data: shape }),
  });

  const json = await response.json();
  if (!json.data) throw new Error("Empty data from server");

  return {
    id: json.data.id,
    ...json.data.attributes,
  };
}
