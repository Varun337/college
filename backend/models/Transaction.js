const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
  account_id: String,
  card_id: String,
  amount: Number,
  merchant: String,
  category: String,
  geo: Object,
  device: Object,
  ts: Date
}, { timestamps: true });

module.exports = mongoose.model('Transaction', TransactionSchema);
