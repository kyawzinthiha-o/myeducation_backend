require("dotenv").config();
const express = require("express");
const router = express.Router();
const User = require("../databases/Users");
const jwt = require("jsonwebtoken");
const auth = require("../middlewares/auth");
const Authtoken = require("../tokenGenerator/authToken");
// path /api/token
//desc get new token

router.get("/", auth, async (req, res) => {
  const refreshToken = req.cookies.refreshroken;
  let userID;
  try {
    const decode = jwt.decode(refreshToken);
    userID = decode.user.id;
  } catch (error) {
    return res.status(401).json({ msg: "Please Log In Again" });
  }
  if (!userID) {
    return {};
  }
  const user = await User.findById(userID).select("-password");

  if (!user) {
    return res.status(404).json({ msg: "user doesn't exist" });
  }
  const payload = {
    user: {
      id: user.id,
    },
  };
  try {
    const newToken = await Authtoken(payload);
    res.json(newToken);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ msg: "server error" });
  }
});

module.exports = router;
