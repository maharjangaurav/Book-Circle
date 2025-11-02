const express = require("express");
const {
  createChapter,
  getChaptersByBook,
  getChapterById,
  getChapters,
  updateChapter,
} = require("../controllers/chapterController");
const router = express.Router();

router.post("/create", createChapter);
router.get("/readbyid/:id", getChapterById);
router.get("/read", getChapters);
router.patch("/read/:id", updateChapter);
// router.delete("/read/:id", deleteBook);
module.exports = router;
