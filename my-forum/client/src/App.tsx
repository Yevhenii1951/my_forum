import { useEffect, useState } from "react";
import { api } from "./api";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import { Posts } from "./pages/Posts";

type User = {
  id: number;
  email: string;
  name: string;
};

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [page, setPage] = useState<"login" | "register">("login");
  const [error, setError] = useState("");

  async function loadMe() {
    try {
      const data = await api("/auth/me");
      setUser(data.user);
    } catch (err: any) {
      setError(err.message);
    }
  }

  useEffect(() => {
    loadMe();
  }, []);

  async function logout() {
    await api("/auth/logout", { method: "POST" });
    setUser(null);
  }

  if (!user) {
    return (
      <div>
        <h1>My Forum</h1>

        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={() => setPage("login")}>Login</button>
          <button onClick={() => setPage("register")}>Register</button>
        </div>

        <hr />

        {page === "login" ? (
          <Login onDone={loadMe} />
        ) : (
          <Register onDone={() => setPage("login")} />
        )}

        {error && <p style={{ color: "red" }}>{error}</p>}
      </div>
    );
  }

  return (
    <div>
      <h1>My Forum</h1>
      <p>
        Logged in as: <b>{user.name}</b> ({user.email})
      </p>

      <button onClick={logout}>Logout</button>

      <hr />
      <Posts />
    </div>
  );
}
