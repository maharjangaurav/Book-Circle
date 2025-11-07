const express = require("express");
const router = express.Router();
const {
  addComment,
  getComments,
  updateComment,
  deleteComment,
} = require("../controllers/comment");
const authMiddleware = require("../middleware/authMiddleware");

router.post("/:bookId", authMiddleware, addComment);
router.get("/:bookId", getComments);
router.patch("/:commentId", authMiddleware, updateComment);
router.delete("/:bookId/:commentId", authMiddleware, deleteComment);

module.exports = router;
