import { useState } from "react";
import { api } from "../api";

type Props = { onDone: () => void };

export function Register({ onDone }: Props) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      await api("/auth/register", {
        method: "POST",
        body: JSON.stringify({ email, name, password }),
      });
      alert("Registered! Now login.");
      onDone();
    } catch (err: any) {
      setError(err.message);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <h2>Register</h2>

      <div>
        <input
          placeholder="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

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

      <button type="submit">Register</button>

      {error && <p style={{ color: "red" }}>{error}</p>}
    </form>
  );
}
