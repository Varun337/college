const mongoose = require('mongoose');

const FeatureSchema = new mongoose.Schema({
  event_id: String,
  account_id: String,
  features: Object,
  ts: Date
}, { timestamps: true });

// ✅ Important: export as a Mongoose model
module.exports = mongoose.model('Feature', FeatureSchema);
