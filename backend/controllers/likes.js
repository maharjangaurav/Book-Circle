const NewBook = require("../models/books");
const Notification = require("../models/notification");

// Add like
exports.addLike = async (req, res) => {
  try {
    const { bookId } = req.params;
    const userId = req.user.id;

    console.log(bookId, "User ID:", userId);

    const book = await NewBook.findById(bookId);
    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }

    // Check if user already liked this book
    if (book.likes.includes(userId)) {
      return res.status(400).json({ message: "You already liked this book" });
    }

    // Add userId to likes array
    book.likes.push(userId);
    await book.save();

    await Notification.create({
      title: `Liked your ${book.title} Book`,
      message: `${req.user.name} liked your book`,
      user: book.author,
    });

    res.status(201).json({
      success: true,
      likeCount: book.likes.length,
      message: "Like added successfully",
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error adding like", error: error.message });
  }
};

// Remove like
exports.removeLike = async (req, res) => {
  try {
    const { bookId } = req.params;
    const userId = req.user.id;

    const book = await NewBook.findById(bookId);
    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }

    // Remove userId from likes array
    book.likes = book.likes.filter((id) => id.toString() !== userId.toString());
    await book.save();

    res.status(200).json({
      success: true,
      likeCount: book.likes.length,
      message: "Like removed successfully",
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error removing like", error: error.message });
  }
};

// Get like status for a book
exports.getLikeStatus = async (req, res) => {
  try {
    const { bookId } = req.params;
    const userId = req.user.id;

    console.log(bookId, "User ID in getlikestatus:", userId);

    const book = await NewBook.findById(bookId);
    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }

    const isLiked = book.likes.some(
      (id) => id.toString() === userId.toString()
    );

    res.status(200).json({
      success: true,
      isLiked: isLiked,
      likeCount: book.likes.length,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching like status", error: error.message });
  }
};

// Get total likes for a book
exports.getBookLikes = async (req, res) => {
  try {
    const { bookId } = req.params;

    const book = await NewBook.findById(bookId);
    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }

    res.status(200).json({
      success: true,
      likeCount: book.likes.length,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching likes", error: error.message });
  }
};
