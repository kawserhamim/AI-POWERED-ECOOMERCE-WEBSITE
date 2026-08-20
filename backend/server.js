import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { connectDB } from "./config/db.js";
import apiRoutes from "./routes/index.js";
import { upload } from "./services/ai-service.js";
import { notFound } from "./middleware/notFound.middleware.js";
import { errorHandler } from "./middleware/error.middleware.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;

// ─── Rate Limiters ────────────────────────────────────────────────────────────
// Global: 200 requests per 15 minutes per IP
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many requests, please try again later." },
});

// Auth routes: 15 attempts per 15 minutes (stops brute-force on login/register)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many auth attempts, please try again in 15 minutes." },
});

// AI/smart-search: 30 per 15 minutes (protects Groq/Gemini API costs)
const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "AI search rate limit reached, please wait a moment." },
});

async function startServer() {
  await connectDB();

  // ─── Security Headers (helmet) ───────────────────────────────────────────
  app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }, // allow images from other origins
  }));

  // ─── CORS ────────────────────────────────────────────────────────────────
  const corsOrigin = process.env.CORS_ORIGIN;
  if (!corsOrigin || corsOrigin === "*") {
    console.warn(
      "[CORS] WARNING: CORS_ORIGIN is '*' or unset. " +
      "Set it to your frontend URL (e.g. http://localhost:5173) for production."
    );
  }
  app.use(
    cors({
      origin: corsOrigin === "*" ? true : (corsOrigin || "http://localhost:5173"),
      credentials: true,
    })
  );

  // ─── Body Parsers ────────────────────────────────────────────────────────
  app.use(cookieParser());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // ─── Rate Limiting ───────────────────────────────────────────────────────
  app.use(globalLimiter);                    // applies to all routes
  app.use("/auth", authLimiter);             // tighter on login/register
  app.use("/smart-search", aiLimiter);       // protect AI API costs

  // ─── Routes ──────────────────────────────────────────────────────────────
  app.use("/", apiRoutes);
  app.use(notFound);
  app.use(errorHandler);

  upload();

  const server = app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });

  const shutdown = async () => {
    server.close(() => process.exit(0));
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);

  return server;
}

if (process.argv[1] && process.argv[1].endsWith("server.js")) {
  startServer();
}

export { app, startServer };