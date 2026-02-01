const NewBook = require("../models/books");
const User = require("../models/User");
const Notification = require("../models/notification");

// Create (Writer publishes a book)
exports.createBook = async (req, res) => {
  const {
    title,
    author,
    previewText,
    isPremium,
    genre,
    recentlyAdded,
    likes,
    views,
    completionPercentage,
    chapterCount,
    status,
  } = req.body;
  const file = req.file;
  if (!file) {
    return res.status(400).json({ message: "Cover image is required" });
  }

  const coverImage = `/images/${file.filename}`;
  console.log(req.body, "Creating new book", coverImage);
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
      status,
    });
    await newBook.save();
    
    // ✅ FIXED: Different logic based on status
    if (newBook.status === "submitted") {
      try {
        // Notify all admins about new submission
        const admins = await User.find({ role: "admin" }, "_id name");
        
        if (admins.length > 0) {
          // Get writer info for notification message
          const writer = await User.findById(newBook.author, "name");
          
          // Create notifications for admins
          const adminNotifications = admins.map(admin => ({
            title: "📖 New Book Submission",
            message: `"${newBook.title}" by ${writer?.name || "A writer"} needs review`,
            user: admin._id,
            book: newBook._id,
            type: "submission"
          }));
          
          await Notification.insertMany(adminNotifications);
          console.log(`📋 Notified ${admins.length} admins about submission`);
        }
      } catch (notifError) {
        console.error("❌ Error sending admin notifications:", notifError);
      }
    }
    // ✅ Only send to readers when status is "published" (admin approved)
    else if (newBook.status === "published") {
      try {
        // Get all readers
        const readers = await User.find({ role: "reader" }, "_id");
        
        if (readers.length > 0) {
          // Get writer info
          const writer = await User.findById(newBook.author, "name");
          
          // Create notifications for all readers
          const notifications = readers.map(reader => ({
            title: "📚 New Book Published!",
            message: `${newBook.title} by ${writer?.name || "a writer"} is now available!`,
            user: reader._id,
            book: newBook._id,
            type: "new_book"
          }));
          
          await Notification.insertMany(notifications);
          console.log(`✅ Sent ${notifications.length} notifications for new book`);
        }
      } catch (notifError) {
        console.error("❌ Error sending reader notifications:", notifError);
      }
    }
    
    res.status(200).json({
      success: true,
      data: newBook,
    });
  } catch (error) {
    res.status(500).json({ message: `Server error: ${error}` });
  }
};

exports.getBooks = async (req, res) => {
  try {
    const { status } = req.params;
    const { id: userId, role } = req.user;
    console.log("Fetching books with status:", status, "for user:", userId);

    let filter = {};

    // Handle different statuses
    if (status === "all") {
      // For 'all', show books based on user role
      if (role === "admin") {
        filter = {};
      } else {
        filter = { author: userId };
      }
    } else if (status === "published" || status === "finished") {
      // These are public statuses - anyone can see them
      filter = { status };
    } else if (status === "draft" || status === "submitted") {
      // Private statuses - users only see their own
      if (role === "admin") {
        filter = { status };
      } else {
        filter = { status, author: userId };
      }
    } else {
      // Invalid status
      return res.status(400).json({ 
        success: false, 
        message: "Invalid status parameter" 
      });
    }

    const books = await NewBook.find(filter)
      .populate("author", "_id name email")
      .populate("chapters");

    res.status(200).json({ success: true, data: books });
  } catch (e) {
    console.error("Error fetching books:", e);
    res.status(500).json({ 
      success: false, 
      message: "Server error", 
      error: e.message 
    });
  }
};

// Get submitted books for admin approval
exports.getSubmittedBooks = async (req, res) => {
  try {
    // Only admin can see submitted books
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }
    
    const submittedBooks = await NewBook.find({ status: "submitted" })
      .populate("author", "name email")
      .populate("chapters");
      
    res.status(200).json({ success: true, data: submittedBooks });
  } catch (error) {
    res.status(500).json({ message: "Error fetching submitted books: " + error.message });
  }
};

// Get single book (for reading)
exports.getBookById = async (req, res) => {
  try {
    const book = await NewBook.findById(req.params.id)
      .populate("author", "_id name email")
      .populate("chapters");
    if (!book) return res.status(404).json({ message: "Book not found" });

    // increase view count
    const views = book.views + 1;
    await NewBook.findByIdAndUpdate(
      req.params.id,
      { views: views },
      { new: true }
    );
    res.status(200).json({ success: true, data: book });
  } catch (error) {
    res.status(500).json({ message: "Error fetching book" });
  }
};

// Update book (Writer edits)
exports.updateBook = async (req, res) => {
  try {
    console.log(req.body, "Updating book with ID:", req.params.id);

    const updateData = {
      title: req.body.title,
      previewText: req.body.previewText,
      genre: req.body.genre,
      status: req.body.status,
    };

    // If a new image is uploaded, update the coverImage path
    if (req.file) {
      updateData.coverImage = `/images/${req.file.filename}`;
    }
    
    // Get the current book before update
    const currentBook = await NewBook.findById(req.params.id);
    
    const updatedBook = await NewBook.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );
    
    // ✅ FIXED: Only trigger notifications when admin changes status to "published"
    if (req.body.status === "published" && currentBook.status === "submitted") {
      try {
        // Get all readers
        const readers = await User.find({ role: "reader" }, "_id");
        
        if (readers.length > 0) {
          // Get writer info
          const writer = await User.findById(updatedBook.author, "name");
          
          // Create notifications for all readers
          const notifications = readers.map(reader => ({
            title: "📚 New Book Published!",
            message: `${updatedBook.title} by ${writer?.name || "a writer"} is now available!`,
            user: reader._id,
            book: updatedBook._id,
            type: "new_book"
          }));
          
          await Notification.insertMany(notifications);
          console.log(`✅ Sent ${notifications.length} notifications for approved book`);
        }
        
        // Also notify the author
        await Notification.create({
          title: "✅ Book Approved!",
          message: `Your book "${updatedBook.title}" has been approved and is now live!`,
          user: updatedBook.author,
          book: updatedBook._id,
          type: "book_approved"
        });
        
      } catch (notifError) {
        console.error("❌ Error sending approval notifications:", notifError);
      }
    }
    
    // Keep the existing "finished" notification logic
    if (req.body.status === "finished") {
      await Notification.create({
        title: `${updatedBook.title} is completed`,
        message: `Your book "${updatedBook.title}" has been marked as finished!`,
        user: updatedBook.author,
        type: "book_finished"
      });
      
      // Optional: Notify readers that the book is completed
      const readers = await User.find({ role: "reader" }, "_id");
      
      if (readers.length > 0) {
        const readerNotifications = readers.map(reader => ({
          title: "✅ Book Completed",
          message: `"${updatedBook.title}" has been marked as finished by the author.`,
          user: reader._id,
          book: updatedBook._id,
          type: "book_completed"
        }));
        
        await Notification.insertMany(readerNotifications);
      }
    }

    res.status(200).json(updatedBook);
  } catch (error) {
    res.status(500).json({ message: "Error updating book" });
  }
};

// Admin approves book (special endpoint)
exports.approveBook = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }
    
    // Update book status from "submitted" to "published"
    const book = await NewBook.findByIdAndUpdate(
      req.params.id,
      { 
        status: "published",
        approvedAt: new Date(),
        approvedBy: req.user.id 
      },
      { new: true }
    ).populate("author", "name email");
    
    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }
    
    // ✅ Send notifications to readers
    const readers = await User.find({ role: "reader" }, "_id");
    
    if (readers.length > 0) {
      const notifications = readers.map(reader => ({
        title: "📚 New Book Published!",
        message: `"${book.title}" by ${book.author.name} is now available!`,
        user: reader._id,
        book: book._id,
        type: "new_book"
      }));
      
      await Notification.insertMany(notifications);
      console.log(`📢 Sent ${notifications.length} notifications to readers`);
    }
    
    // Notify the author
    await Notification.create({
      title: "✅ Book Approved!",
      message: `Your book "${book.title}" has been approved and is now live!`,
      user: book.author._id,
      book: book._id,
      type: "book_approved"
    });
    
    res.status(200).json({
      success: true,
      message: "Book approved and published",
      data: book
    });
    
  } catch (error) {
    res.status(500).json({ message: "Error approving book: " + error.message });
  }
};

// Admin rejects book
exports.rejectBook = async (req, res) => {
  try {
    const { reason } = req.body;
    
    // Check if user is admin
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }
    
    const book = await NewBook.findByIdAndUpdate(
      req.params.id,
      { 
        status: "draft",
        rejectionReason: reason,
        rejectedAt: new Date(),
        rejectedBy: req.user.id
      },
      { new: true }
    ).populate("author", "name email");
    
    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }
    
    // Notify author about rejection
    await Notification.create({
      title: "⚠️ Book Needs Revision",
      message: `Your book "${book.title}" was not approved. Reason: ${reason}`,
      user: book.author._id,
      book: book._id,
      type: "book_rejected"
    });
    
    res.status(200).json({
      success: true,
      message: "Book rejected and returned to draft",
      data: book
    });
    
  } catch (error) {
    res.status(500).json({ message: "Error rejecting book: " + error.message });
  }
};

exports.updateBookChater = async (req, res) => {
  try {
    console.log(req.body, "Updating book Chapter", req.params.id);

    const updatedBook = await NewBook.findByIdAndUpdate(
      req.params.id,
      { $addToSet: { chapters: req.body.chapter } }, // prevents duplicates
      { new: true }
    );
    res.status(200).json({ success: true, data: updatedBook }); 
   } catch (error) {
    res.status(500).json({ message: "Error updating book" });
  }
};

// Delete book
exports.deleteBook = async (req, res) => {
  try {
    await NewBook.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Book deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting book" });
  }
};

// Test endpoint to manually trigger notifications
exports.testNotifications = async (req, res) => {
  try {
    // Get all readers
    const readers = await User.find({ role: "reader" }, "_id");
    
    const notifications = readers.map(reader => ({
      title: "📚 Test Notification",
      message: "This is a test notification to verify the system works!",
      user: reader._id,
      type: "test"
    }));
    
    await Notification.insertMany(notifications);
    
    res.status(200).json({
      success: true,
      message: `Sent ${notifications.length} test notifications`,
      count: notifications.length
    });
  } catch (error) {
    res.status(500).json({ message: "Test failed: " + error.message });
  }
};