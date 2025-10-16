const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");


dotenv.config();

async function connectDB() {
  try {
    await mongoose.connect("mongodb://localhost:27017");
    console.log("✅ MongoDB connected");
  } catch (err) {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  }
}
connectDB();

const app = express();
app.use("/uploads", express.static(__dirname + "/uploads"));
app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    credentials: true,
    origin: [
      "http://localhost:3000",
      "http://172.18.32.1:3000",
      "file:///D:/Projects/Bots/chat-bot/embed-example.html",
      "http://localhost:5173",
    ],
  })
);


const server = app.listen(30000, () => {
  console.log("Server started on port 30000");
});

