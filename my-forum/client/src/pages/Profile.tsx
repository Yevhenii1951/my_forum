import { useEffect, useState } from "react";
import { api } from "../api";

type ProfileUser = {
  id: number;
  name: string;
  email: string;
  createdAt: string;
  posts: { id: number; title: string; createdAt: string; locked: boolean }[];
};

type Props = {
  userId: number;
};

export function Profile({ userId }: Props) {
  const [user, setUser] = useState<ProfileUser | null>(null);
  const [error, setError] = useState("");

  async function load() {
    setError("");
    try {
      const data = await api(`/users/${userId}`);
      setUser(data);
    } catch (err: any) {
      setError(err.message);
    }
  }

  useEffect(() => {
    load();
  }, [userId]);

  if (error) return <p style={{ color: "red" }}>{error}</p>;
  if (!user) return <p>Loading profile...</p>;

  return (
    <div>
      <h3>Profile</h3>
      <p>
        <b>{user.name}</b> ({user.email})
      </p>

      <h4>User posts</h4>
      {user.posts.length === 0 ? (
        <p>No posts</p>
      ) : (
        <ul>
          {user.posts.map((p) => (
            <li key={p.id}>
              {p.title} {p.locked ? "(locked)" : ""}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
