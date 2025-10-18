const mongoose = require("mongoose");

const bookmarkSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  book: { type: mongoose.Schema.Types.ObjectId, ref: "Book", required: true },
  position: { type: Number, default: 0 },
  created_at: { type: Date, default: Date.now },
});

// prevent duplicate (user, book)
bookmarkSchema.index({ user: 1, book: 1 }, { unique: true });

module.exports = mongoose.model("Bookmark", bookmarkSchema);
