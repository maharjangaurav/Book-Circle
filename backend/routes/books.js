const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const {
  createBook,
  getBookById,
  updateBook,
  deleteBook,
  getBooks,
} = require("../controllers/bookController");
const authMiddleware = require("../middleware/authMiddleware");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "..", "public", "images"));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "_" + file.originalname;
    cb(null, uniqueSuffix);
  },
});

const upload = multer({ storage });

router.post("/create", upload.single("coverImage"), createBook);
router.get("/read/:status", authMiddleware, getBooks);
router.get("/readbyid/:id", getBookById);
router.patch("/read/:id", upload.single("coverImage"), updateBook);
router.delete("/read/:id", deleteBook);
module.exports = router;
