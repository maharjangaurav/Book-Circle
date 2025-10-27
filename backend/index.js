const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const bookRouter = require("./routes/books");
const authRoutes = require("./routes/auth");
const authMiddleware = require("./middleware/authMiddleware");
const path = require("path");

dotenv.config();

async function connectDB() {
  try {
    await mongoose.connect("mongodb://localhost:27017/bookcircle");
    console.log("✅ MongoDB connected");
  } catch (err) {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  }
}
connectDB();

const app = express();
app.use(express.json());
app.use(cors({ origin: "*" }));

app.use("/uploads", express.static(__dirname + "/uploads"));
app.use("/images", express.static(path.join(__dirname, "public", "images")));
app.use("/books", bookRouter);
app.use("/api/auth", authRoutes);
app.get("/api/user/profile", authMiddleware, (req, res) => {
  res.json({
    message: "This is a protected route",
    user: req.user,
  });
});

app.listen(3000, () => console.log("🚀 Server started on port 3000"));
