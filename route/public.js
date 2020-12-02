const express = require("express");
const router = express.Router();
const Content = require("../databases/Content");
const Posts = require("../databases/Posts");

router.get("/publicdata/:skipvalue", async (req, res) => {
  try {
    const  skipValue  = req.params.skipvalue;
    const skip = parseInt(skipValue, 10)
    const users = await Content.find().skip(skip).limit(25).sort({ date: -1 });
    if(!users){
      return res.json([])
    }
    res.json(users);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ msg: "server error" });
  }
});
router.get("/user/:name", async (req, res) => {
  const name = req.params.name;
  try {
    const user = await Content.findOne({ name });
    if (!user) {
      return res.status(404).json({ msg: "User Not Found" });
    }
    res.json(user);
  } catch (error) {
    return res.status(500).json({ msg: "server error" });
  }
});
router.get("/search/:searchWords", async (req, res) => {
  try {
    const  searchWords  = req.params.searchWords;
    const users = await Content.find({
      $text: { $search: searchWords },
    })
      .limit(50)
    if(!users){
      return res.json()
    }
    res.json(users);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ msg: "server error" });
  }
});
router.get("/posts/:id/:skip", async (req, res) => {
  try {
    
    const skip = req.params.skip
    const id = req.params.id;
    const skipValue = parseInt(skip, 10)
    const post = await Posts.findOne(
      { contentID
        : id },
       {
        posts: { $slice: [skipValue, 10 ] },
      } 
    );
    if (!post) {
      return res.json()
    } 
    res.json(post.posts);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ msg: "server error" });
  }
});
module.exports = router;
