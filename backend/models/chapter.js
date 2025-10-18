const mongoose = require("mongoose");

const chapterSchema = new mongoose.Schema({
  book: { type: mongoose.Schema.Types.ObjectId, ref: "Book", required: true },
  title: { type: String, required: true },
  content: { type: String, required: true },
  order_number: { type: Number, required: true },
  is_premium: { type: Boolean, default: false },
  status: { type: String, enum: ["draft", "published"], default: "draft" },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

chapterSchema.index({ book: 1, order_number: 1 }, { unique: true });

module.exports = mongoose.model("Chapter", chapterSchema);
