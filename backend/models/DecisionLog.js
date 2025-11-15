// DecisionLog.js
import mongoose from "mongoose";

const DecisionLogSchema = new mongoose.Schema({
  transaction_id: { type: mongoose.Schema.Types.ObjectId, ref: "Alert", required: true },
  account_id: String,
  amount: Number,
  score: Number,
  decision: String,           // 'approve' | 'block' | 'pending'
  auto: { type: Boolean, default: true },
  reason: String,
  createdAt: { type: Date, default: Date.now }
}, { collection: "decision_logs" });

export default mongoose.models.DecisionLog || mongoose.model("DecisionLog", DecisionLogSchema);
