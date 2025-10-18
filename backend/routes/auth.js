const express = require("express");
const { login, signup, refresh, getProfile } = require("../controllers/auth");
const authMiddleware = require("../middleware/authMiddleware");
const router = express.Router();


router.post("/login", login);

router.post("/signup", signup);

router.post("/refresh", authMiddleware, refresh);

router.get("/profile", authMiddleware, getProfile);

module.exports = router;