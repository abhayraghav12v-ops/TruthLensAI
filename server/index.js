import "dotenv/config";
import express from "express";
import cors from "cors";
import multer from "multer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import {
  analyzeImage,
  analyzeVideo,
  analyzeAudio,
  extractScoreAndFlags,
} from "./sightengine.js";
import {
  getVerifications,
  getNotifications,
  getActivity,
  saveVerification,
  deleteVerification,
  computeStats,
} from "./store.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3001;
const MAX_FILE_MB = 50;
const MAX_FILE_BYTES = MAX_FILE_MB * 1024 * 1024;

const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
    cb(null, `${Date.now()}_${safe}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_BYTES },
  fileFilter: (_req, file, cb) => {
    const t = file.mimetype || "";
    if (
      t.startsWith("image/") ||
      t.startsWith("video/") ||
      t.startsWith("audio/")
    ) {
      cb(null, true);
    } else {
      cb(new Error("UNSUPPORTED_TYPE"));
    }
  },
});

/** Match frontend getVerdict in src/constants/navigation.js */
function getVerdict(score) {
  if (score >= 75) return "manipulated";
  if (score >= 50) return "likelyManipulated";
  if (score >= 25) return "suspicious";
  return "authentic";
}

function randomId() {
  return Math.random().toString(36).slice(2, 8);
}

function detectMediaType(mimetype) {
  if (!mimetype) return null;
  if (mimetype.startsWith("image/")) return "image";
  if (mimetype.startsWith("video/")) return "video";
  if (mimetype.startsWith("audio/")) return "audio";
  return null;
}

function formatFileSize(bytes) {
  const mb = bytes / 1024 / 1024;
  return `${mb.toFixed(1)} MB`;
}

function cleanup(filePath) {
  try {
    if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath);
  } catch {
    // ignore
  }
}

const app = express();

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://127.0.0.1:5173",
      "http://localhost:4173",
    ],
    credentials: true,
  }),
);
app.use(express.json());

app.use("/uploads", express.static(uploadDir));

app.get("/api/v1/health", (_req, res) => {
  res.json({
    ok: true,
    sightengineConfigured: Boolean(
      process.env.SIGHTENGINE_API_USER && process.env.SIGHTENGINE_API_SECRET,
    ),
  });
});

app.post("/api/v1/verify", (req, res) => {
  upload.single("file")(req, res, async (err) => {
    const started = Date.now();

    if (err) {
      if (err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE") {
        return res.status(413).json({
          error: "File too large",
          message: `Maximum upload size is ${MAX_FILE_MB} MB`,
        });
      }
      if (err.message === "UNSUPPORTED_TYPE") {
        return res.status(415).json({
          error: "Unsupported media type",
          message: "Only image, video, and audio files are supported",
        });
      }
      return res
        .status(400)
        .json({ error: "Upload failed", message: err.message });
    }

    if (!req.file) {
      return res.status(400).json({
        error: "No file",
        message: 'Please upload a file under the field name "file"',
      });
    }

    const mediaType = detectMediaType(req.file.mimetype);
    if (!mediaType) {
      cleanup(req.file.path);
      return res.status(415).json({
        error: "Unsupported media type",
        message: "Only image, video, and audio files are supported",
      });
    }

    try {
      let seData;
      if (mediaType === "image") {
        seData = await analyzeImage(req.file.path, req.file.originalname);
      } else if (mediaType === "video") {
        seData = await analyzeVideo(req.file.path, req.file.originalname);
      } else {
        seData = await analyzeAudio(req.file.path, req.file.originalname);
      }

      const { probability, flags } = extractScoreAndFlags(seData, mediaType);
      const score = Math.round(Math.min(1, Math.max(0, probability)) * 100);
      const elapsedSec = ((Date.now() - started) / 1000).toFixed(1);

      const result = {
        id: `vrf_${randomId()}`,
        fileName: req.file.originalname,
        mediaType,
        thumbnailUrl: `http://localhost:${PORT}/uploads/${req.file.filename}`,
        score,
        verdict: getVerdict(score),
        fileSize: formatFileSize(req.file.size),
        uploadedAt: new Date().toISOString(),
        processedIn: `${elapsedSec}s`,
        flags,
      };

      saveVerification(result);
      // cleanup(req.file.path);
      return res.json(result);
    } catch (e) {
      cleanup(req.file.path);
      const status = e.status || 502;
      return res.status(status).json({
        error:
          e.code === "MISSING_CREDENTIALS"
            ? "Configuration error"
            : "Detection failed",
        message: e.message || "Sightengine API failure",
        details: e.details || undefined,
      });
    }
  });
});

app.get("/api/v1/verifications", (_req, res) => {
  res.json(getVerifications());
});
app.delete("/api/v1/verifications/:id", (req, res) => {
  try {
    const deleted = deleteVerification(req.params.id);

    if (!deleted) {
      return res.status(404).json({
        error: "Not found",
        message: "Verification record not found",
      });
    }

    // Delete the uploaded file as well
   if (deleted.thumbnailUrl) {
  const fileName = path.basename(
    new URL(deleted.thumbnailUrl).pathname
  );

  const filePath = path.join(uploadDir, fileName);

  cleanup(filePath);
}

    return res.json({
      success: true,
      message: "Verification deleted successfully",
    });
  } catch (error) {
    console.error("[DELETE VERIFICATION]", error);

    return res.status(500).json({
      error: "Delete failed",
      message: error.message,
    });
  }
});

app.get("/api/v1/dashboard-stats", (_req, res) => {
  res.json(computeStats());
});

app.get("/api/v1/notifications", (_req, res) => {
  res.json(getNotifications());
});

app.get("/api/v1/activity", (_req, res) => {
  res.json(getActivity());
});

app.use((err, _req, res, _next) => {
  console.error("[server]", err);
  res
    .status(500)
    .json({ error: "Internal server error", message: err.message });
});

app.listen(PORT, () => {
  console.log(`TruthLens API listening on http://localhost:${PORT}`);
  if (
    !process.env.SIGHTENGINE_API_USER ||
    !process.env.SIGHTENGINE_API_SECRET
  ) {
    console.warn(
      "⚠  SIGHTENGINE_API_USER / SIGHTENGINE_API_SECRET not set — copy server/.env.example to server/.env",
    );
  }
});
