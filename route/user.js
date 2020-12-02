require("dotenv").config();
const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const { body, validationResult } = require("express-validator");
const auth = require("../middlewares/auth");

//generate token
const AuthToken = require("../tokenGenerator/authToken");
const RefreshToken = require("../tokenGenerator/refreshToken");

//database
const User = require("../databases/Users");

//user register route
router.post(
  "/",
  [
    body("email", "Email is required").notEmpty(),
    body("password", "Password is require").notEmpty(),
  ],
  async (req, res) => {
    //validate user input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
      let search = await User.findOne({ email });
      if (search) {
        return res.status(400).json({ msg: "User already exist" });
      }

      const newUser = new User({
        email,
        password,
      });

      const salt = await bcrypt.genSalt(11);
      newUser.password = await bcrypt.hashSync(password, salt);

      try {
        await newUser.save();
      } catch (error) {
        console.errors(error);
      }

      //jwt payload
      const payload = {
        user: {
          id: newUser.id,
        },
      };

      //generate token
      const token = await AuthToken(payload);
      const refreshtoken = await RefreshToken(payload, newUser.password);
      res.cookie("RefreshToken", refreshtoken, {
        httpOnly: true,
        maxAge: 29.6 * 24 * 60 * 60 * 1000,
        expires: 29.6 * 24 * 60 * 60 * 1000 + Date.now(),
      });
      res.json(token);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ msg: "server error" });
    }
  }
);

//updata password
router.put(
  "/",
  [auth, [body("newPassword", "New Password is required").notEmpty()]],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const userID = req.user.id;
    const { oldPassword, newPassword } = req.body;
    try {
      const user = await User.findById(userID);
      if (!user) {
        return res.status(404).json({ msg: "Server Error" });
      }
      const isMatch = await bcrypt.compare(oldPassword, user.password);
      if (!isMatch) {
        return res.status(403).json({ msg: "Wrong Password" });
      }
      const newdata = {
        password: newPassword,
      };
      const salt = await bcrypt.genSalt(11);
      newdata.password = await bcrypt.hashSync(newPassword, salt);

      await User.findByIdAndUpdate(userID, { $set: newdata });
      //clear cookie
      await res.clearCookie("RefreshToken");

      payload = {
        user: {
          id: user.id,
        },
      };
      //resend cookie
      const refreshtoken = await RefreshToken(payload, newdata.password);
      res.cookie("RefreshToken", refreshtoken, {
        httpOnly: true,
        maxAge: 29.6 * 24 * 60 * 60 * 1000,
        expires: 29.6 * 24 * 60 * 60 * 1000 + Date.now(),
      });
      res.json({ msg: "Updated Password" });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ msg: "Server error" });
    }
  }
);
router.put(
  "/updatemail",
  [auth, [body("email", "Email is required").notEmpty()]],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const { email } = req.body;
      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ msg: "User Not Found" });
      }
      if (!user.isVarified) {
        const newemail = {
          email: email,
        };
        const Email = await User.findOne({ email: email });
        if (Email) {
          return res.status(400).json({ msg: "User already exist" });
        }
        await User.findByIdAndUpdate(req.user.id, { $set: newemail });
        res.json({ msg: "Successfully Updated" });
      } else {
        return res.status(400).json({ msg: "can't update email" });
      }
    } catch (error) {
      console.error(error);
      return res.status(500).json({ msg: "server error" });
    }
  }
);
module.exports = router;
