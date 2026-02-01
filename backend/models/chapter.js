const mongoose = require("mongoose");

const chapterSchema = new mongoose.Schema({
  book: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "NewBook",
    required: true
  },
  title: { type: String, required: true },
  content: { type: String },
  order_number: { type: Number, required: true },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

const Chapter = mongoose.model("Chapter", chapterSchema);

module.exports = Chapter;
