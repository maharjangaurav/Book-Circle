const Chapter = require("../models/chapter");

// Get all chapters for a book
exports.getChaptersByBook = async (req, res) => {
  try {
    const chapters = await Chapter.find({ book: req.params.bookId }).sort("order_number");
    res.json(chapters);
  } catch (err) {
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};

// Add chapter to book
exports.createChapter = async (req, res) => {
  try {
    const chapter = new Chapter(req.body);
    await chapter.save();
    res.status(201).json(chapter);
  } catch (err) {
    res.status(400).json({ message: "Error creating chapter", error: err.message });
  }
};

// Get single chapter
exports.getChapterById = async (req, res) => {
  try {
    const chapter = await Chapter.findById(req.params.id);
    if (!chapter) return res.status(404).json({ message: "Chapter not found" });
    res.json(chapter);
  } catch (err) {
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};
