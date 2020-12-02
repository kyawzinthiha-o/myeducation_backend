const express = require("express");
require("dotenv").config();
const auth = require("../middlewares/auth");
const EmailSender = require("../confirmationEmail/emailSender");

const router = express.Router();

const User = require("../databases/Users");
const Varification = require("../databases/Varification");

router.post("/", auth, async (req, res) => {
  const { code } = req.body;
  const id = req.user.id;

  try {
    const varify = await Varification.findOne({ id });
    if (!varify) {
      return res.status(500).json({ msg: "server error" });
    }
    if (varify.code !== code) {
      return res.status(403).json({ msg: "Invalid code" });
    }
    const varified = {
      isVarified: true,
    };
    await User.findByIdAndUpdate(id, { $set: varified });

    res.json({ msg: "user verified" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ msg: "server error" });
  }
});
router.post("/mail", auth, (req, res) => {
  const id = req.user.id;
  let { email } = req.body;

  try {
    EmailSender(id, email);
    res.json({ msg: "Email send" });
  } catch (error) {
    return res.status(500).json({ msg: "server error" });
  }
});

module.exports = router;
