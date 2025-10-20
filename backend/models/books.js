const mongoose = require("mongoose");

const newBookSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "NewUser",
      required: true,
    },
    previewText: { type: String, required: true },
    genre: { type: [String], required: true },
    status: {
      type: String,
      enum: ["draft", "published", "finished"],
      default: "draft",
    },
    coverImage: { type: String },
    isPremium: { type: Boolean, default: false },
    rending: { type: Boolean, default: false },
    recentlyAdded: { type: Boolean, default: false },
    publishedDate: { type: Date, default: Date.now },
    chapterCount: { type: Number, default: 0 },
    views: { type: Number, default: 0 },
    likes: { type: Number, default: 0 },
    completionPercentage: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const NewBook = mongoose.model("NewBook", newBookSchema);

module.exports = NewBook;
