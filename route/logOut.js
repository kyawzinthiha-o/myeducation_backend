const express = require("express");
const router = express.Router();

router.get("/", async (req, res) => {
  await res.clearCookie("RefreshToken"),
    await res.clearCookie("Content"),
    await res.clearCookie("Post"),
    res.json({ msg: "Complete log out" });
});
module.exports = router;
