const mongoose = require('mongoose');

const ScoreSchema = new mongoose.Schema({
  event_id: String,
  account_id: String,
  score: Number,
  decision: String,
  reasons: [String],
  ts: Date
}, { timestamps: true });

module.exports = mongoose.model('Score', ScoreSchema);
