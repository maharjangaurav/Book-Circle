const express = require("express");
const {
  createChapter,
  getChaptersByBook,
  getChapterById,
  getChapters,
  updateChapter,
  deleteChapter,
  updateContent,
} = require("../controllers/chapterController");
const router = express.Router();

router.post("/create", createChapter);
router.get("/readbyid/:id", getChapterById);
router.get("/read", getChapters);
router.patch("/read/:id", updateChapter);
router.patch("/read/content/:id", updateContent);
router.delete("/read/:bookId/:chapterId", deleteChapter);
module.exports = router;
