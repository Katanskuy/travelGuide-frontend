export async function loginUser(identifier, password) {
  const res = await fetch("http://localhost:1337/api/auth/local", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identifier, password }),
  });

  if (!res.ok) throw new Error("Помилка логіну");

  const data = await res.json();
  return data; // { jwt, user }
}

const { jwt, user } = await loginUser("admin@example.com", "пароль");
localStorage.setItem("token", jwt);
