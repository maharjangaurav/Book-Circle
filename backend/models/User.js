const mongoose = require("mongoose");


const userSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true },
  email: { type: String, required: true, unique: true, trim: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["reader", "writer", "admin"], default: "reader" },
}, { timestamps: true });

const User = mongoose.model("NewUser", userSchema);

module.exports = User;
