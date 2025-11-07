const LibraryItem = require("../models/libraryItem");

// Add book to library
exports.addToLibrary = async (req, res) => {
  try {
    const { bookId } = req.params;
    const { status } = req.body;
    const userId = req.user.id;

    console.log("Adding book to library:", { userId, bookId, status });

    // Check if book already in library
    const existingItem = await LibraryItem.findOne({
      user: userId,
      book: bookId,
    });
    if (existingItem) {
      return res.status(400).json({ message: "Book already in your library" });
    }

    const libraryItem = new LibraryItem({
      user: userId,
      book: bookId,
      status: status || "saved",
    });

    await libraryItem.save();
    await libraryItem.populate("book");

    res.status(201).json({ success: true, data: libraryItem });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error adding to library", error: error.message });
  }
};

// Get user's library
exports.getLibrary = async (req, res) => {
  try {
    const userId = req.user.id;

    const libraryItems = await LibraryItem.find({ user: userId })
      .populate("book")
      .sort({ lastReadAt: -1 });

    res.status(200).json({
      success: true,
      data: libraryItems,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching library", error: error.message });
  }
};

// Update library item status
exports.updateStatus = async (req, res) => {
  try {
    const { libraryItemId } = req.params;
    const { status } = req.body;
    const userId = req.user.id;

    const libraryItem = await LibraryItem.findById(libraryItemId);

    if (!libraryItem || libraryItem.user.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    libraryItem.status = status;
    libraryItem.lastReadAt = new Date();

    if (status === "finished") {
      libraryItem.progress = 100;
    }

    await libraryItem.save();
    await libraryItem.populate("book");

    res.status(200).json({ success: true, data: libraryItem });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error updating status", error: error.message });
  }
};

// Update reading progress
exports.updateProgress = async (req, res) => {
  try {
    const { libraryItemId } = req.params;
    const { progress } = req.body;
    const userId = req.user.id;

    if (progress < 0 || progress > 100) {
      return res
        .status(400)
        .json({ message: "Progress must be between 0 and 100" });
    }

    const libraryItem = await LibraryItem.findById(libraryItemId);

    if (!libraryItem || libraryItem.user.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    libraryItem.progress = progress;
    libraryItem.lastReadAt = new Date();

    if (progress === 100) {
      libraryItem.status = "finished";
    }

    await libraryItem.save();

    res.status(200).json({ success: true, data: libraryItem });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error updating progress", error: error.message });
  }
};

// Remove book from library
exports.removeFromLibrary = async (req, res) => {
  try {
    const { libraryItemId } = req.params;
    const userId = req.user.id;

    const libraryItem = await LibraryItem.findById(libraryItemId);

    if (!libraryItem || libraryItem.user.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    await LibraryItem.findByIdAndDelete(libraryItemId);

    res.status(200).json({ success: true, message: "Removed from library" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error removing from library", error: error.message });
  }
};

// Get library item by book id
exports.getLibraryItemByBook = async (req, res) => {
  try {
    const { bookId } = req.params;
    const userId = req.user.id;
    console.log("Fetching library for user:", userId);

    const libraryItem = await LibraryItem.findOne({
      user: userId,
      book: bookId,
    });

    console.log("Library item found:", libraryItem);

    res.status(200).json({
      success: true,
      data: libraryItem || null,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching library item", error: error.message });
  }
};
