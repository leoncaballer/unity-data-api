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

const DATA_DIR = "/var/data";
const DATA_FILE = path.join(DATA_DIR, "sessions.jsonl");

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

console.log("Server file directory:", __dirname);
console.log("Session data will be saved to:", DATA_FILE);

app.get("/", (req, res) => {
  res.json({
    ok: true,
    message: "API is running",
    dataFile: DATA_FILE
  });
});

app.post("/api/upload-session", (req, res) => {
  try {
    console.log("Origin:", req.headers.origin);
    console.log("Body:", req.body);

    const line = JSON.stringify(req.body) + "\n";
    fs.appendFileSync(DATA_FILE, line, "utf8");

    console.log("Saved to:", DATA_FILE);

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