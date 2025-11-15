const mongoose = require("mongoose");

const alertSchema = new mongoose.Schema({
  account_id: String,
  card_id: String,
  amount: Number,
  merchant: String,
  category: String,
  score: Number,
  decision: String,
  reasons: [String],
  analyst_action: { type: String, default: null },
  reviewed_at: { type: Date, default: null },
  created_at: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Alert", alertSchema);
