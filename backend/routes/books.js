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
  updateBookChater,
} = require("../controllers/bookController");
const authMiddleware = require("../middleware/authMiddleware");
const bookController = require('../controllers/bookController');
const auth = require('../middleware/authMiddleware'); // Make sure this path is correct

// Add at the top with other imports
const writerStatsController = require('../controllers/writerStatsController');


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
router.patch("/readChapter/:id", updateBookChater);
router.delete("/read/:id", deleteBook);
router.get('/writer/stats/:writerId', writerStatsController.getWriterStats);
router.get('/submitted', auth, bookController.getSubmittedBooks); // ✅ Add this
router.patch('/:id/approve', auth, bookController.approveBook);     // ✅ Add this
router.patch('/:id/reject', auth, bookController.rejectBook);       // ✅ Add this

module.exports = router;
