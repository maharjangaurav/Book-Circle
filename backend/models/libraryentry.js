const mongoose = require("mongoose");

const libraryEntrySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  book: { type: mongoose.Schema.Types.ObjectId, ref: "Book", required: true },
  status: {
    type: String,
    enum: ["reading", "saved", "finished"],
    default: "saved",
  },
  created_at: { type: Date, default: Date.now },
});

libraryEntrySchema.index({ user: 1, book: 1 }, { unique: true });

module.exports = mongoose.model("LibraryEntry", libraryEntrySchema);