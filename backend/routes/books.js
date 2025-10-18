const express = require("express");
const router = express.Router();
const {
  createBook,
  getBookById,
  updateBook,
  deleteBook,
  getBooks,
} = require("../controllers/bookController");

// Routes
router.post("/create", createBook);     // writer publishes book
router.get("/read/:status", getBooks);       // homepage list
router.get("/readbyid/:id", getBookById);        // open one book
router.patch("/read/:id", updateBook);         // edit book
router.delete("/read/:id", deleteBook);      // delete book
module.exports = router;