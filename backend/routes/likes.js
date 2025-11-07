const express = require("express");
const router = express.Router();
const {
  addLike,
  removeLike,
  getLikeStatus,
  getBookLikes,
} = require("../controllers/likes");
const authMiddleware = require("../middleware/authMiddleware");

router.post("/:bookId", authMiddleware, addLike);
router.delete("/:bookId", authMiddleware, removeLike);
router.get("/:bookId/status", authMiddleware, getLikeStatus);
router.get("/:bookId/count", getBookLikes);

module.exports = router;
