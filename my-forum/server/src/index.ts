// server/src/index.ts
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import session from "express-session";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";

dotenv.config();

const app = express();
const prisma = new PrismaClient();

app.use(express.json());
app.use(cookieParser());

// Чтобы React (Vite) мог ходить на API и передавать cookies
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

// Простая session-cookie настройка (для учебного проекта)
app.use(
  session({
    secret: process.env.SESSION_SECRET || "dev_secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: false, // true только если https
    },
  })
);

// ---------- helper (проверка логина) ----------
function requireAuth(req: any, res: any, next: any) {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  next();
}

// ---------- test ----------
app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

// ========== AUTH ==========

// Register
app.post("/auth/register", async (req, res) => {
  const { email, name, password } = req.body;

  if (!email || !name || !password) {
    return res.status(400).json({ error: "email, name, password required" });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return res.status(409).json({ error: "Email already used" });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: { email, name, password: passwordHash },
    select: { id: true, email: true, name: true, createdAt: true },
  });

  res.json(user);
});

// Login (sets cookie)
app.post("/auth/login", async (req: any, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "email and password required" });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(401).json({ error: "Invalid credentials" });

  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return res.status(401).json({ error: "Invalid credentials" });

  req.session.userId = user.id; // <-- вот здесь "логин через cookie"

  res.json({ id: user.id, email: user.email, name: user.name });
});

// Me (who am I)
app.get("/auth/me", async (req: any, res) => {
  if (!req.session.userId) return res.json({ user: null });

  const user = await prisma.user.findUnique({
    where: { id: req.session.userId },
    select: { id: true, email: true, name: true, createdAt: true },
  });

  res.json({ user });
});

// Logout
app.post("/auth/logout", requireAuth, (req: any, res) => {
  req.session.destroy((err: any) => {
    if (err) return res.status(500).json({ error: "Logout failed" });
    res.clearCookie("connect.sid");
    res.json({ ok: true });
  });
});

// ========== POSTS ==========

// List posts
app.get("/posts", requireAuth, async (_req, res) => {
  const posts = await prisma.post.findMany({
    orderBy: { createdAt: "desc" },
    include: { author: { select: { id: true, name: true } } },
  });

  res.json(posts);
});

// Create post
app.post("/posts", requireAuth, async (req: any, res) => {
  const { title, body } = req.body;

  if (!title || !body) {
    return res.status(400).json({ error: "title and body required" });
  }

  const post = await prisma.post.create({
    data: {
      title,
      body,
      authorId: req.session.userId,
    },
  });

  res.json(post);
});

// Post details (with comments)
app.get("/posts/:id", requireAuth, async (req, res) => {
  const postId = Number(req.params.id);
  if (!postId) return res.status(400).json({ error: "Invalid id" });

  const post = await prisma.post.findUnique({
    where: { id: postId },
    include: {
      author: { select: { id: true, name: true } },
      comments: {
        orderBy: { createdAt: "asc" },
        include: { author: { select: { id: true, name: true } } },
      },
    },
  });

  if (!post) return res.status(404).json({ error: "Post not found" });
  res.json(post);
});

// Add comment (blocked if locked)
app.post("/posts/:id/comments", requireAuth, async (req: any, res) => {
  const postId = Number(req.params.id);
  const { body } = req.body;

  if (!postId) return res.status(400).json({ error: "Invalid id" });
  if (!body) return res.status(400).json({ error: "comment body required" });

  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post) return res.status(404).json({ error: "Post not found" });
  if (post.locked) return res.status(403).json({ error: "Post is locked" });

  const comment = await prisma.comment.create({
    data: {
      body,
      postId,
      authorId: req.session.userId,
    },
  });

  res.json(comment);
});

// Lock post (only author)
app.post("/posts/:id/lock", requireAuth, async (req: any, res) => {
  const postId = Number(req.params.id);
  if (!postId) return res.status(400).json({ error: "Invalid id" });

  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post) return res.status(404).json({ error: "Post not found" });

  if (post.authorId !== req.session.userId) {
    return res.status(403).json({ error: "Only author can lock" });
  }

  const updated = await prisma.post.update({
    where: { id: postId },
    data: { locked: true },
  });

  res.json(updated);
});

// ========== PROFILE ==========

// View profile of another user
app.get("/users/:id", requireAuth, async (req, res) => {
  const userId = Number(req.params.id);
  if (!userId) return res.status(400).json({ error: "Invalid id" });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      createdAt: true,
      posts: {
        orderBy: { createdAt: "desc" },
        select: { id: true, title: true, createdAt: true, locked: true },
      },
    },
  });

  if (!user) return res.status(404).json({ error: "User not found" });
  res.json(user);
});

// ---------- start ----------
const PORT = Number(process.env.PORT || 3001);
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
