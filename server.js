// server.js
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const contactRoutes = require("./routes/contact");
const app = express();

const allowlist = (process.env.FRONTEND_ORIGIN || "")
  .split(",")
  .map(o => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin || allowlist.includes(origin)) {
        return cb(null, true);
      }
      return cb(new Error("❌ CORS: Origin not allowed"));
    },
  })
);


app.use(express.json());

// ✅ Health Check
app.get("/api/health", (_req, res) => res.json({ ok: true }));

// ✅ Routes
app.use("/api/contact", contactRoutes);

// ✅ DB + Start Server
const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB connected");
    app.listen(PORT, () =>
      console.log(`🚀 API running on port ${PORT}`)
    );
  })
  .catch((err) => {
    console.error("❌ MongoDB connection failed:", err.message);
    process.exit(1);
  });
