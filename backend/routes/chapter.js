const express = require("express");
const {
  createChapter,
  getChaptersByBookId,
  getChapterById,
  getChapters,
  updateChapter,
  deleteChapter,
  updateContent,
} = require("../controllers/chapterController");

const router = express.Router();

// chapter.js - Add this route
router.post("/create", createChapter);
router.get("/readbybook/:bookId", getChaptersByBookId);
router.get("/readbyid/:id", getChapterById);
router.get("/read", getChapters)
router.patch("/read/content/:id", updateContent);
router.patch("/read/:id", updateChapter);
router.delete("/read/:bookId/:chapterId", deleteChapter);
module.exports = router;
