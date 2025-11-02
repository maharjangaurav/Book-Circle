const Chapter = require("../models/chapter");
const NewBook = require("../models/books");

// Get all chapters for a book
exports.getChapters = async (req, res) => {
  try {
    const chapters = await Chapter.find({}).sort("order_number");
    res.json(chapters);
  } catch (err) {
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};

// Add chapter to book
exports.createChapter = async (req, res) => {
  try {
    console.log(req.body, "creating chapter");
    const book = await NewBook.findById(req.body.book).populate("chapters");

    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }
    const isDuplicateOrder = book.chapters.some(
      (ch) => ch.order_number === req.body.order_number
    );

    if (isDuplicateOrder) {
      return res
        .status(400)
        .json({ message: "Chapter with this order number already exists" });
    }

    const isDuplicateTitle = book.chapters.some(
      (ch) =>
        ch.title.trim().toLowerCase() === req.body.title.trim().toLowerCase()
    );

    if (isDuplicateTitle) {
      return res
        .status(400)
        .json({ message: "Chapter with this title already exists" });
    }
    const chapter = new Chapter({
      title: req.body.title,
      content: req.body.content || "",
      order_number: req.body.order_number,
    });

    await chapter.save();
    await NewBook.findByIdAndUpdate(req.body.book, {
      $push: { chapters: chapter._id },
    });

    return res.status(200).json({ success: true, data: chapter });
  } catch (err) {
    console.error(err);
    return res.status(400).json({
      message: "Error creating chapter",
      error: err.message,
    });
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

exports.updateChapter = async (req, res) => {
  try {
    console.log(req.body, "Updating book Chapter", req.params.id);

    const book = await NewBook.findById(req.body.book).populate("chapters");

    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }

    const isDuplicateOrder = book.chapters.some(
      (ch) =>
        ch._id.toString() !== req.params.id &&
        ch.order_number === req.body.order_number
    );

    if (isDuplicateOrder) {
      return res.status(200).json({
        success: false,
        message: "Chapter with this order number already exists",
      });
    }

    const isDuplicateTitle = book.chapters.some(
      (ch) =>
        ch._id.toString() !== req.params.id &&
        ch.title.trim().toLowerCase() === req.body.title.trim().toLowerCase()
    );

    if (isDuplicateTitle) {
      return res.status(200).json({
        success: false,
        message: "Chapter with this title already exists",
      });
    }

    const updatedBook = await Chapter.findByIdAndUpdate(
      req.params.id,
      {
        content: req.body.content,
        title: req.body.title,
        order_number: req.body.order_number,
      },
      { new: true }
    );

    res.status(200).json({ success: true, updatedBook });
  } catch (err) {
    console.error("Error while updating:", err);
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};
