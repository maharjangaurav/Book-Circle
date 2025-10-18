const NewBook = require("../models/books");
const Book = require("../models/books");

// Create (Writer publishes a book)
exports.createBook = async (req, res) => {
  const { title, author, previewText, isPremium, genre, recentlyAdded, likes, views, completionPercentage, coverImage, chapterCount,status } = req.body;
  try {
    const newBook = new NewBook({
      title,
      author,
      previewText,
      isPremium,
      genre,
      recentlyAdded,
      likes,
      views,
      completionPercentage,
      coverImage,
      chapterCount,
      status
    });
    await newBook.save();
    res.status(200).json({success:true, data:newBook});
  } catch (error) {
    res.status(500).json({ message: `Server error: ${error}` });
  }
}

exports.getBooks = async (req, res) =>{
  try {
        const filter =  req.params.status==="all"?{}:req.params.status ? { status: req.params.status } :{};
    const books = await NewBook.find(filter);
    if (books.length === 0) {
      return res.status(404).json({ success: false, message: "No books found" });
    }
    res.status(200).json({ success: true, data: books });
  } catch (e) {
    res.status(500).json({ message: `Server Error: ${e}` });
  }
}

// Get single book (for reading)
exports.getBookById = async (req, res) => {
  try {
    const book = await NewBook.findById(req.params.id)
    if (!book) return res.status(404).json({ message: "Book not found" });

    // increase view count
    const views=book.views + 1;
    await NewBook.findByIdAndUpdate(req.params.id, { views:views }, { new: true });
    res.status(200).json({success: true, data: book});
  } catch (error) {
    res.status(500).json({ message: "Error fetching book" });
  }
};

// Update book (Writer edits)
exports.updateBook = async (req, res) => {
  try {
    console.log(req.body,"Updating book with ID:", req.params.id);
    const updatedBook = await Book.findByIdAndUpdate(req.params.id, { status:req.body.status }, { new: true });
    res.status(200).json(updatedBook);
  } catch (error) {
    res.status(500).json({ message: "Error updating book" });
  }
};

// Delete book
exports.deleteBook = async (req, res) => {
  try {
    await Book.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Book deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting book" });
  }
};
