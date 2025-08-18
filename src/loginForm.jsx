import { useState } from "react";

const LoginForm = ({ onSuccess }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(
        "https://committed-example-923d921288.strapiapp.com/api/auth/local",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            identifier: email,
            password: password,
          }),
        }
      );

      const data = await res.json();

      console.log("Response data:", data);
      console.log("Is res.ok?", res.ok);
      console.log("Does data have jwt?", !!data.jwt);

      if (res.ok && data.jwt) {
        localStorage.setItem("token", data.jwt);
        onSuccess(); // передаємо токен в App
      } else {
        setError(data.error?.message || "Помилка автентифікації");
      }
    } catch {
      setError("Мережева помилка");
    }
  };

  return (
    <form onSubmit={handleLogin} style={{ padding: "1em", background: "#fff" }}>
      <h3>Вхід для адміністратора</h3>
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <br />
      <input
        type="password"
        placeholder="Пароль"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      <br />
      <button type="submit">Увійти</button>
      {error && <p style={{ color: "red" }}>{error}</p>}
    </form>
  );
};

export default LoginForm;
