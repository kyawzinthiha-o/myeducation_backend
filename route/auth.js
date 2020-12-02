require("dotenv").config();
const express = require("express");
const router = express.Router();
const auth = require("../middlewares/auth");
const bcrypt = require("bcrypt");
const { body, validationResult } = require("express-validator");

//generate token
const AuthToken = require("../tokenGenerator/authToken");
const RefreshToken = require("../tokenGenerator/refreshToken");

//database
const User = require("../databases/Users");
const Content = require("../databases/Content");
const Post = require("../databases/Posts");

router.get("/", auth, async (req, res) => {
  const userID = req.user.id;
  try {
    const user = await User.findById(userID).select("-password");
    if (user === null) {
      res.status(404).json({ msg: " user not found" });
    }
    res.json(user);
  } catch (error) {
    return res.status(500).json({ msg: "server error" });
  }
});

//route /api/auth
//desc  log in user
//acce  PUBLIC
router.post(
  "/",
  [
    body("email", "Email is required").isEmail(),
    body("password", "Password is require").notEmpty(),
  ],
  async (req, res) => {
    //check validation error start
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    //check validation error finish

    const { email, password } = req.body;

    //start log in process
    try {
      let user = await User.findOne({ email });
      if (user === null) {
        return res.status(400).json({ msg: "Email invalid credential" });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ msg: "Password invalid credential" });
      }
      //payload for jwt
      const payload = {
        user: {
          id: user.id,
        },
      };

      let ContentID, PostID;
      const content = await Content.findOne({ userID: user.id });
      if (content) {
        ContentID = content.id;
      }
      const post = await Post.findOne({ userID: user.id });
      if (post) {
        PostID = post.id;
      }
      //send content and posts if there is
      res.cookie("Content", ContentID, { httpOnly: true });
      res.cookie("Post", PostID, { httpOnly: true });

      //generate jwt
      const token = await AuthToken(payload);
      const refreshToken = await RefreshToken(payload, user.password);

      //send jwt and refresh token
      res.cookie("RefreshToken", refreshToken, {
        httpOnly: true,
        maxAge: 29.6 * 24 * 60 * 60 * 1000,
        expires: 29.6 * 24 * 60 * 60 * 1000 + Date.now()
      });
      res.json(token);
    } catch (error) {
      console.error(error.message);
      return res.status(500).json({ msg: "Server Error" });
    }
  }
);

module.exports = router;
