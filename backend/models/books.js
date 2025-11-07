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
    chapters: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Chapter",
      },
    ],
    views: { type: Number, default: 0 },
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "NewUser",
      },
    ],
    comment: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Comment",
      },
    ],
    completionPercentage: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const NewBook = mongoose.model("NewBook", newBookSchema);

module.exports = NewBook;
