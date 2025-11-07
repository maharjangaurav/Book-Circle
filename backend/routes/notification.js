const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const {
  getNotification,
  deleteNotification,
  updateNotification,
} = require("../controllers/notification");

router.delete("/:id", authMiddleware, deleteNotification);
router.get("/", authMiddleware, getNotification);
router.patch("/:id/:read", authMiddleware, updateNotification);

module.exports = router;
