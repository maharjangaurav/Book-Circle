const express = require("express")
const router = express.Router()
const jwt = require("jsonwebtoken")
const bcrypt = require("bcryptjs")
const authMiddleware = require("../middleware/authMiddleware")
const User = require("../models/User")

// Mock user database (replace with real database)
const users = [
  {
    id: 1,
    email: "user@example.com",
    password: "$2a$10$QWfUPOtnUbzSMXYxW3d5du32cnZikgK8Rzj.QFglcb/sFG1hAAlVG", // bcrypt hashed password
    name: "John Doe",
    role: "reader",
  },
]


async function login(req, res) {
  try {
    const { email, password } = req.body;

    // 1️⃣ Validate input
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    // 2️⃣ Find user in MongoDB
    const user = await User.findOne({ email }); // ✅ query DB
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // 3️⃣ Compare entered password with hashed password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // 4️⃣ Generate JWT token
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET || "your-secret-key",
      { expiresIn: "7d" }
    );

    // 5️⃣ Return response
    res.json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });

  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Login failed", message: error.message });
  }
}

async function signup(req, res) {
  try {
    const { email, password, name } = req.body;

    // 1. Validate input
    if (!email || !password || !name) {
      return res.status(400).json({ error: "Email, password, and name are required" });
    }

    // 2. Check if user already exists
    const existingUser = await User.findOne({ email }); // ✅ correct query
    if (existingUser) {
      return res.status(400).json({ error: "User already exists" });
    }

    // 3. Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 4. Create and save new user in MongoDB
    const newUser = new User({
      email,
      password: hashedPassword,
      name,
      role: "reader",
    });

    await newUser.save(); // ✅ save to MongoDB

    // 5. Generate JWT token
    const token = jwt.sign(
      { id: newUser._id, email: newUser.email, role: newUser.role },
      process.env.JWT_SECRET || "your-secret-key",
      { expiresIn: "7d" }
    );

    // 6. Respond with success
    res.status(201).json({
      success: true,
      token,
      user: {
        id: newUser._id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
      },
    });

  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ error: "Signup failed", message: error.message });
  }
}

async function refresh(req, res) {
  try {
    const user = users.find((u) => u.id === req.user.id)
    if (!user) {
      return res.status(401).json({ error: "User not found" })
    }

    // Generate new token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || "your-secret-key",
      { expiresIn: "7d" },
    )

    res.json({
      success: true,
      token,
    })
  } catch (error) {
    res.status(500).json({ error: "Token refresh failed", message: error.message })
  }
}

async function getProfile(req, res) {
  try {
    const user = users.find((u) => u.id === req.user.id)
    if (!user) {
      return res.status(404).json({ error: "User not found" })
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    })
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch profile", message: error.message })
  }
}

module.exports = {
  login,
  signup,
  refresh,
  getProfile,
}
