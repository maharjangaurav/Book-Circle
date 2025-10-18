// controllers/authController.js
const User = require("../models/User");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

// Environment variables or defaults
const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET || "access_secret";
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || "refresh_secret";
const ACCESS_TOKEN_EXPIRY = process.env.TOKEN_EXPIRY || "15m";
const REFRESH_TOKEN_EXPIRY = process.env.REFRESH_TOKEN_EXPIRY || "7d";

// Generate JWT tokens
const generateTokens = (user) => {
  const payload = { id: user._id, username: user.username, role: user.role };
  const access = jwt.sign(payload, ACCESS_TOKEN_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY });
  const refresh = jwt.sign(payload, REFRESH_TOKEN_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRY });
  return { access, refresh };
};

// ------------------- REGISTER -------------------
exports.register = async (req, res) => {
  try {
    const { username, email, password, role } = req.body;

    const userExists = await User.findOne({ $or: [{ email }, { username }] });
    if (userExists) return res.status(400).json({ message: "User already exists" });

    // Hash password before saving
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({ username, email, password: hashedPassword, role });
    const tokens = generateTokens(user);

    res.status(201).json({ 
      user: { id: user._id, username, email, role }, 
      ...tokens 
    });
  } catch (err) {
    res.status(500).json({ message: "Registration failed", error: err.message });
  }
};

// ------------------- LOGIN -------------------
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({ username });
    if (!user) return res.status(400).json({ message: "Invalid username or password" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid username or password" });

    const tokens = generateTokens(user);

    res.json({
      user: { id: user._id, username: user.username, email: user.email, role: user.role },
      ...tokens
    });
  } catch (err) {
    res.status(500).json({ message: "Login failed", error: err.message });
  }
};

// ------------------- REFRESH TOKEN -------------------
exports.refreshToken = (req, res) => {
  try {
    const { refresh } = req.body;
    if (!refresh) return res.status(400).json({ message: "Refresh token missing" });

    jwt.verify(refresh, REFRESH_TOKEN_SECRET, (err, decoded) => {
      if (err) return res.status(403).json({ message: "Invalid refresh token" });

      // Generate new access token
      const tokens = generateTokens(decoded);
      res.json({ access: tokens.access });
    });
  } catch (err) {
    res.status(500).json({ message: "Token refresh failed", error: err.message });
  }
};

// ------------------- GET CURRENT USER -------------------
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch user", error: err.message });
  }
};

// ------------------- AUTHENTICATION MIDDLEWARE -------------------
exports.authenticate = async (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Access token missing" });

  try {
    const decoded = jwt.verify(token, ACCESS_TOKEN_SECRET);
    req.user = await User.findById(decoded.id).select("-password");
    if (!req.user) return res.status(401).json({ message: "User not found" });
    next();
  } catch (err) {
    res.status(403).json({ message: "Invalid access token", error: err.message });
  }
};
