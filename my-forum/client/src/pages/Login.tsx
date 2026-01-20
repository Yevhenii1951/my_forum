import { useState } from "react";
import { api } from "../api";

type Props = { onDone: () => void };

export function Login({ onDone }: Props) {
  const [email, setEmail] = useState("test@test.com");
  const [password, setPassword] = useState("123456");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      await api("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      onDone();
    } catch (err: any) {
      setError(err.message);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <h2>Login</h2>

      <div>
        <input
          placeholder="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>

      <div>
        <input
          placeholder="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>

      <button type="submit">Login</button>

      {error && <p style={{ color: "red" }}>{error}</p>}
    </form>
  );
}
