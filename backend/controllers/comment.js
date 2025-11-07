const NewBook = require("../models/books");
const Comment = require("../models/comment");
const Notification = require("../models/notification");

// Add comment
exports.addComment = async (req, res) => {
  try {
    const { bookId } = req.params;
    const { text } = req.body;
    const userId = req.user.id;

    if (!text || text.trim().length === 0) {
      return res.status(400).json({ message: "Comment text is required" });
    }

    // Create new comment
    const comment = new Comment({
      user: userId,
      text: text.trim(),
    });

    await comment.save();

    // Add comment ID to book's comment array
    const book = await NewBook.findById(bookId);
    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }

    book.comment.push(comment._id);
    await book.save();

    // Populate user info for response
    await comment.populate("user", "name email");

    await Notification.create({
      title: `Comment on your ${book.title} Book`,
      message: `${comment.text} by ${req.user.name}`,
      user: book.author,
    });

    res.status(201).json({
      success: true,
      data: comment,
      commentCount: book.comment.length,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error adding comment", error: error.message });
  }
};

// Get comments for a book
exports.getComments = async (req, res) => {
  try {
    const { bookId } = req.params;

    console.log(bookId, "User ID in getcomment:");

    // Get book and populate all comments
    const book = await NewBook.findById(bookId).populate({
      path: "comment",
      populate: {
        path: "user",
        select: "name email",
      },
      options: { sort: { createdAt: -1 } },
    });

    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }

    res.status(200).json({
      success: true,
      data: book.comment || [],
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching comments", error: error.message });
  }
};

// Update comment
exports.updateComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const { text } = req.body;
    const userId = req.user.id;

    if (!text || text.trim().length === 0) {
      return res.status(400).json({ message: "Comment text is required" });
    }

    const comment = await Comment.findById(commentId);

    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    if (comment.user.toString() !== userId.toString()) {
      return res
        .status(403)
        .json({ message: "Unauthorized to update this comment" });
    }

    comment.text = text.trim();
    await comment.save();
    await comment.populate("user", "name email");

    res.status(200).json({
      success: true,
      data: comment,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error updating comment", error: error.message });
  }
};

// Delete comment
exports.deleteComment = async (req, res) => {
  try {
    const { commentId, bookId } = req.params;
    const userId = req.user.id;

    const comment = await Comment.findById(commentId);

    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    if (comment.user.toString() !== userId.toString()) {
      return res
        .status(403)
        .json({ message: "Unauthorized to delete this comment" });
    }

    // Remove comment ID from book's comment array
    const book = await NewBook.findById(bookId);
    if (book) {
      book.comment = book.comment.filter(
        (id) => id.toString() !== commentId.toString()
      );
      await book.save();
    }

    // Delete the comment
    await Comment.findByIdAndDelete(commentId);

    res.status(200).json({
      success: true,
      message: "Comment deleted successfully",
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error deleting comment", error: error.message });
  }
};
