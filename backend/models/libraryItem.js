const mongoose = require("mongoose");

const libraryItemSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "NewUser",
      required: true,
    },
    book: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "NewBook",
      required: true,
    },
    status: {
      type: String,
      enum: ["saved", "reading", "finished"],
      default: "saved",
    },
    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    lastReadAt: {
      type: Date,
      default: Date.now,
    },
    currentPage: { 
      type: Number, default: 1
     },
  },
  { timestamps: true }
);

// Ensure each user can only have one library entry per book
libraryItemSchema.index({ user: 1, book: 1 }, { unique: true });

const LibraryItem = mongoose.model("LibraryItem", libraryItemSchema);

module.exports = LibraryItem;
