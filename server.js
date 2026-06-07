import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

const allowedOrigins = [
  "https://f003.backblazeb2.com",
  "https://game.mtvreginald.com",
  "https://html-classic.itch.zone",
  "http://localhost:3000",
  "http://localhost:5173"
];

const corsOptions = {
  origin(origin, callback) {
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
const JSONL_FILE = path.join(DATA_DIR, "sessions.jsonl");
const CSV_FILE = path.join(DATA_DIR, "sessions.csv");

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

console.log("Server file directory:", __dirname);
console.log("JSONL data file:", JSONL_FILE);
console.log("CSV data file:", CSV_FILE);

app.get("/", (req, res) => {
  res.json({
    ok: true,
    message: "API is running",
    jsonlFile: JSONL_FILE,
    csvFile: CSV_FILE
  });
});

app.post("/api/upload-session", (req, res) => {
  try {
    console.log("Origin:", req.headers.origin);
    console.log("Body:", req.body);

    const line = JSON.stringify(req.body) + "\n";
    fs.appendFileSync(JSONL_FILE, line, "utf8");

    res.status(200).json({ ok: true, mode: "json" });
  } catch (err) {
    console.error("UPLOAD ERROR:", err);
    res.status(500).json({ ok: false, error: String(err) });
  }
});

app.post(
  "/api/upload-csv",
  express.text({ type: ["text/csv", "text/plain"], limit: "2mb" }),
  (req, res) => {
    try {
      console.log("Origin:", req.headers.origin);

      if (typeof req.body !== "string" || !req.body.trim()) {
        return res.status(400).json({ ok: false, error: "Empty CSV body" });
      }

      let csvText = req.body;
      const fileExists = fs.existsSync(CSV_FILE);

      if (fileExists) {
        const lines = csvText.split(/\r?\n/);
        if (lines.length > 1) {
          csvText = lines.slice(1).join("\n").trimStart();
        }
      }

      if (csvText.trim()) {
        fs.appendFileSync(
          CSV_FILE,
          csvText.endsWith("\n") ? csvText : csvText + "\n",
          "utf8"
        );
      }

      res.status(200).json({ ok: true, mode: "csv" });
    } catch (err) {
      console.error("CSV UPLOAD ERROR:", err);
      res.status(500).json({ ok: false, error: String(err) });
    }
  }
);

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`API listening on ${port}`);
});