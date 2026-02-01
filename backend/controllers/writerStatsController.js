exports.getWriterStats = async (req, res) => {
  try {
    const writerId = req.params.writerId;
    
    // Get ALL writer's books (published)
    const books = await NewBook.find({ 
      author: writerId, 
      status: "published" 
    }).populate('likes comment');
    
    // Calculate REAL stats
    let totalReaders = 0;
    let totalComments = 0;
    let mostPopularBook = null;
    let maxEngagement = 0;
    
    books.forEach(book => {
      // Readers = unique users who liked or commented
      const uniqueEngagers = new Set();
      
      book.likes?.forEach(like => uniqueEngagers.add(like.toString()));
      book.comment?.forEach(comment => {
        if (comment.user) uniqueEngagers.add(comment.user.toString());
      });
      
      totalReaders += uniqueEngagers.size;
      totalComments += book.comment?.length || 0;
      
      // Engagement score for most popular
      const engagementScore = (book.views || 0) + (book.likes?.length || 0) + (book.comment?.length || 0);
      
      if (engagementScore > maxEngagement) {
        maxEngagement = engagementScore;
        mostPopularBook = {
          title: book.title,
          views: book.views || 0,
          likes: book.likes?.length || 0,
          comments: book.comment?.length || 0
        };
      }
    });
    
    res.status(200).json({
      success: true,
      data: {
        totalReaders,
        totalComments,
        totalBooks: books.length,
        mostPopularBook
      }
    });
    
  } catch (error) {
    console.error("Writer stats error:", error);
    res.status(200).json({
      success: true,
      data: {
        totalReaders: 0,
        totalComments: 0,
        totalBooks: 0,
        mostPopularBook: null
      }
    });
  }
};
