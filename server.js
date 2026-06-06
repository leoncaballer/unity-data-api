import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

const allowedOrigins = [
  "https://html-classic.itch.zone",
  "http://localhost:3000",
  "http://localhost:5173"
];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS: " + origin));
    }
  },
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type"],
};

app.use(cors(corsOptions));
app.options("/api/upload-session", cors(corsOptions));
app.use(express.json({ limit: "1mb" }));

app.get("/", (req, res) => {
  res.json({ ok: true, message: "API is running" });
});

app.post("/api/upload-session", (req, res) => {
  try {
    console.log("Origin:", req.headers.origin);
    console.log("Body:", req.body);

    const outDir = path.join(__dirname, "data");
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

    const line = JSON.stringify(req.body) + "\n";
    fs.appendFileSync(path.join(outDir, "sessions.jsonl"), line, "utf8");

    res.status(200).json({ ok: true });
  } catch (err) {
    console.error("UPLOAD ERROR:", err);
    res.status(500).json({ ok: false, error: String(err) });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`API listening on ${port}`);
});