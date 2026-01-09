const path = require("path");
const express = require("express");

const app = express();

// =============== RATE LIMITER ===================
const rateLimit = require("express-rate-limit");

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 100,                 // 100 requests per IP
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter); // global
app.set("trust proxy", 1);
// ================================================

app.use(express.urlencoded({ extended: false }));
app.use(express.json());

const frontPath =
  process.env.FRONT_PATH || path.join(__dirname, "..", "..", "front");
app.use(express.static(frontPath));

// ========== ROUTES ==============
const reportRoutes = require("./routes/report");

app.use("/report", reportRoutes);
// ================================

module.exports = app;
