const express = require("express");
const router = express.Router();
const {
  addToLibrary,
  getLibrary,
  updateStatus,
  updateProgress,
  removeFromLibrary,
  getLibraryItemByBook,
} = require("../controllers/libraryController");
const authMiddleware = require("../middleware/authMiddleware");

router.post("/:bookId", authMiddleware, addToLibrary);
router.get("/", authMiddleware, getLibrary);
router.get("/:bookId", authMiddleware, getLibraryItemByBook);
router.patch("/:libraryItemId/status", authMiddleware, updateStatus);
router.patch("/:libraryItemId/progress", authMiddleware, updateProgress);
router.delete("/:libraryItemId", authMiddleware, removeFromLibrary);

module.exports = router;
