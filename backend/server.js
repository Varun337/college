// =======================================================
// FRAUD DETECTION BACKEND (Node.js + MongoDB + Python ML)
// =======================================================

import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import axios from "axios";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/fraudDB";

const AUTO_BLOCK_THRESHOLD = 0.8;
const AUTO_APPROVE_THRESHOLD = 0.3;
const DISABLE_AUTO = false;

// =======================================================
// MIDDLEWARE
// =======================================================
app.use(cors());
app.use(bodyParser.json());

// =======================================================
// CONNECT TO MONGO DB
// =======================================================
mongoose
  .connect(MONGO_URI)
  .then(() => console.log("✅ Mongo connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// =======================================================
// SCHEMAS
// =======================================================
const alertSchema = new mongoose.Schema({
  account_id: String,
  amount: Number,
  score: Number,
  decision: String,
  reason: String,
  auto: Boolean,
  timestamp: { type: Date, default: Date.now },
});

const decisionLogSchema = new mongoose.Schema({
  transaction_id: { type: mongoose.Schema.Types.ObjectId, ref: "Alert" },
  account_id: String,
  amount: Number,
  score: Number,
  decision: String,
  auto: Boolean,
  reason: String,
  createdAt: { type: Date, default: Date.now },
});

const Alert = mongoose.model("Alert", alertSchema);
const DecisionLog = mongoose.model("DecisionLog", decisionLogSchema);

// =======================================================
// ROUTE: /api/alerts  ➕ Create New Alert
// =======================================================
app.post("/api/alerts", async (req, res) => {
  try {
    const { account_id, amount, merchant = "default", geo = "IN", device = "mobile" } = req.body;
    console.log("📩 Incoming transaction:", { account_id, amount });

    // 🧠 STEP 1 — Call ML Scoring Service
    console.log("📡 Sending request to ML model at http://127.0.0.1:8000/score ...");
    const mlResponse = await axios.post("http://127.0.0.1:8000/score", {
      amount,
      merchant,
      geo,
      device,
    });

    console.log("✅ ML Response:", mlResponse.data);
    const score = mlResponse.data.score;

    if (score === undefined) {
      console.error("❌ No score received from ML model!");
      return res.status(500).json({ error: "No score returned from ML model" });
    }

    // 🧮 STEP 2 — Decision Logic
    let decision = "pending";
    let reason = "AUTO_PENDING_REVIEW";

    if (!DISABLE_AUTO) {
      if (score >= AUTO_BLOCK_THRESHOLD) {
        decision = "block";
        reason = "AUTO_BLOCK_HIGH_RISK_SCORE";
      } else if (score <= AUTO_APPROVE_THRESHOLD) {
        decision = "approve";
        reason = "AUTO_APPROVE_LOW_RISK_SCORE";
      }
    }

    console.log(
      `🧠 Decision -> score=${score}, thresholds: block>=${AUTO_BLOCK_THRESHOLD}, approve<=${AUTO_APPROVE_THRESHOLD}, decision=${decision}`
    );

    // 💾 STEP 3 — Save Alert to MongoDB
    const alert = new Alert({
      account_id,
      amount,
      score,
      decision,
      reason,
      auto: true,
      timestamp: new Date(),
    });
    await alert.save();
    console.log("✅ Alert saved to MongoDB:", alert._id);

    // 🧾 STEP 4 — Save Decision Log
    await DecisionLog.create({
      transaction_id: alert._id,
      account_id,
      amount,
      score,
      decision,
      auto: true,
      reason,
      createdAt: new Date(),
    });
    console.log("✅ Decision log entry created");

    // ✅ STEP 5 — Send Response
    res.status(201).json({ message: "Transaction processed", alert });
  } catch (err) {
    console.error("❌ Error processing transaction:", err.message);
    if (err.response) {
      console.log("ML Response Error Data:", err.response.data);
    }
    res.status(500).json({ error: "Failed to process transaction" });
  }
});

// =======================================================
// ROUTE: /api/alerts (GET) 🧠 Fetch All Alerts
// =======================================================
app.get("/api/alerts", async (req, res) => {
  try {
    const alerts = await Alert.find().sort({ timestamp: -1 }).limit(50);
    res.json(alerts);
  } catch (err) {
    console.error("❌ Error fetching alerts:", err.message);
    res.status(500).json({ error: "Failed to fetch alerts" });
  }
});

// =======================================================
// ROUTE: /api/action 🖱️ Analyst Manual Decision
// =======================================================
app.post("/api/action", async (req, res) => {
  try {
    const { alertId, action } = req.body;
    const alert = await Alert.findById(alertId);
    if (!alert) return res.status(404).json({ error: "Alert not found" });

    alert.decision = action;
    alert.auto = false;
    alert.reason = `MANUAL_OVERRIDE_${action.toUpperCase()}`;
    await alert.save();

    await DecisionLog.create({
      transaction_id: alert._id,
      account_id: alert.account_id,
      amount: alert.amount,
      score: alert.score,
      decision: action,
      auto: false,
      reason: alert.reason,
      createdAt: new Date(),
    });

    console.log(`📝 Manual ${action} applied to alert ${alertId}`);
    res.json({ message: `Transaction ${action} successful`, alert });
  } catch (err) {
    console.error("❌ Error saving action:", err.message);
    res.status(500).json({ error: "Error saving action" });
  }
});

// =======================================================
// HEALTH CHECK
// =======================================================
app.get("/api/health", (req, res) => {
  res.json({
    status: "Backend running ✅",
    mongo: mongoose.connection.readyState === 1 ? "Connected" : "Disconnected",
  });
});

// =======================================================
// START SERVER
// =======================================================
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
