const NewBook = require("../models/books");
const Book = require("../models/books");

// Create (Writer publishes a book)
exports.createBook = async (req, res) => {
  const {
    title,
    author,
    previewText,
    isPremium,
    genre,
    recentlyAdded,
    likes,
    views,
    completionPercentage,
    chapterCount,
    status,
  } = req.body;
  const file = req.file;
  if (!file) {
    return res.status(400).json({ message: "Cover image is required" });
  }

  const coverImage = `/images/${file.filename}`;
  console.log(req.body, "Creating new book", coverImage);
  try {
    const newBook = new NewBook({
      title,
      author,
      previewText,
      isPremium,
      genre,
      recentlyAdded,
      likes,
      views,
      completionPercentage,
      coverImage,
      chapterCount,
      status,
    });
    await newBook.save();
    res.status(200).json({ success: true, data: newBook });
  } catch (error) {
    res.status(500).json({ message: `Server error: ${error}` });
  }
};

exports.getBooks = async (req, res) => {
  try {
    const { status } = req.params;
    const { id: userId, role } = req.user;

    let filter = {};

    if (status === "draft" || status === "published") {
      if (role === "admin" && status === "published") {
        filter = { status };
      } else {
        filter = { status, author: userId };
      }
    } else if (status === "finished") {
      filter = { status };
    } else if (status === "all") {
      filter = {};
    }

    const books = await NewBook.find(filter).populate(
      "author",
      "_id name email"
    );

    res.status(200).json({ success: true, data: books });
  } catch (e) {
    res.status(500).json({ message: `Server Error: ${e}` });
  }
};

// Get single book (for reading)
exports.getBookById = async (req, res) => {
  try {
    const book = await NewBook.findById(req.params.id).populate(
      "author",
      "_id name email"
    );
    if (!book) return res.status(404).json({ message: "Book not found" });

    // increase view count
    const views = book.views + 1;
    await NewBook.findByIdAndUpdate(
      req.params.id,
      { views: views },
      { new: true }
    );
    res.status(200).json({ success: true, data: book });
  } catch (error) {
    res.status(500).json({ message: "Error fetching book" });
  }
};

// Update book (Writer edits)
exports.updateBook = async (req, res) => {
  try {
    console.log(req.body, "Updating book with ID:", req.params.id);

    const updateData = {
      title: req.body.title,
      previewText: req.body.previewText,
      genre: req.body.genre,
      status: req.body.status,
    };

    // If a new image is uploaded, update the coverImage path
    if (req.file) {
      updateData.coverImage = `/images/${req.file.filename}`;
    }

    const updatedBook = await Book.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );
    res.status(200).json(updatedBook);
  } catch (error) {
    res.status(500).json({ message: "Error updating book" });
  }
};

// Delete book
exports.deleteBook = async (req, res) => {
  try {
    await Book.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Book deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting book" });
  }
};
