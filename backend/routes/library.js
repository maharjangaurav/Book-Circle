const express = require("express");
const router = express.Router();
const {
  addToLibrary,
  getLibrary,
  updateStatus,
  getProgress,
  updateProgress,
  removeFromLibrary,
  getLibraryItemByBook,
} = require("../controllers/libraryController");
const authMiddleware = require("../middleware/authMiddleware");


router.get("/", authMiddleware, getLibrary);
router.get("/:bookId", authMiddleware, getLibraryItemByBook);
router.get("/:libraryId/progress", authMiddleware, getProgress);
router.put("/:libraryId/progress", authMiddleware, updateProgress);
router.post("/:bookId", authMiddleware, addToLibrary);
router.patch("/:libraryItemId/status", authMiddleware, updateStatus);
router.delete("/:libraryItemId", authMiddleware, removeFromLibrary);

module.exports = router;
