require("dotenv").config();
const express = require("express");
const router = express.Router();
const auth = require("../middlewares/auth");
const multer = require("multer");
const Content = require("../databases/Content");
const Post = require("../databases/Posts");
const User = require("../databases/Users");

const AWS = require("aws-sdk");
const { json } = require("express");

const upload = multer();
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ID,
  secretAccessKey: process.env.AWS_SCREAT,
  Bucket: process.env.AWS_BUCKET,
  region: process.env.AWS_REGION,
});
//get profile
router.get("/", auth, async (req, res) => {
  try {
    const id = req.user.id;
    /*  change back to cookie */
    const conetenId = req.cookies.Content;
    //change back to find by ID
    const userContent = await Content.findById(conetenId);
    if (!userContent) {
      return res.status(500).json({ msg: "server error" });
    }

    if (userContent.userID.toString() !== id) {
      return res.status(403).json({ msg: "Unauthorized User" });
    }
    if (!userContent) {
      return res.json();
    }
    res.json(userContent);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ msg: "server error" });
  }
});

//get posts
router.get("/posts/:skip", auth, async (req, res) => {
  try {
    const id = req.user.id;
    const postID = req.cookies.Post;
    const skip = req.params.skip;
    const skipValue = parseInt(skip, 10);
    const post = await Post.findById(postID, {
      posts: { $slice: [skipValue, 10] },
    });
    if (!post) {
      return res.json();
    }
    res.json(post.posts);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ msg: "server error" });
  }
});

// post profile
router.post("/", [auth, upload.single("coverImg")], async (req, res) => {
  const coverIMG = req.file;
  let coverImgSRC;
  if (coverIMG) {
    if (!coverIMG.originalname.match(/\.(JPG|jpg|PNG|png|gif|GIF|jpeg)$/)) {
      return res.status(400).json({ msg: "invalid photo type" });
    }

    const params = {
      Bucket: process.env.AWS_BUCKET,
      Key: `${req.user.id}_${coverIMG.originalname}`,
      Body: coverIMG.buffer,
    };

    try {
      const stored = await s3.upload(params).promise();
      coverImgSRC = stored.Location;
    } catch (err) {
      console.log(err);
      return res.status(500).json({ msg: "server error" });
    }
  }
  const {
    name,
    type,
    subjects,
    phNumbers,
    about,
    location,
    website,
  } = JSON.parse(req.body.content);

  try {
    const userContent = new Content({
      userID: req.user.id,
      name,
      type,
      subjects,
      phNumbers,
      about,
      location,
      website,
      coverImg: coverImgSRC,
    });
    const profile = await userContent.save();
    const newPost = new Post({
      userID: req.user.id,
      contentID: userContent.id,
      posts: [],
    });
    await newPost.save();
    const change = {
      hasProfile: true,
      hasPost: true,
    };
    await User.findByIdAndUpdate(req.user.id, { $set: change });
    res.cookie("Content", profile.id, { httpOnly: true });
    res.cookie("Post", newPost.id, { httpOnly: true });
    res.json(profile);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ msg: "server error" });
  }
});

//uploadPosts

router.post("/upload", [auth, upload.array("image", 100)], async (req, res) => {
  const userID = req.user.id;
  const images = req.files;
  const  {caption}  = req.body;
  const imgSRC = [];
  const contentID = req.cookies.Post;

  for (img of images) {
    if (!img.originalname.match(/\.(JPG|jpg|PNG|png|gif|GIF|jpeg|MP4|mp4)$/)) {
      break;
    } else {
      const params = {
        Bucket: process.env.AWS_BUCKET,
        Key: `${userID}_${img.originalname}`,
        Body: img.buffer,
      };

      try {
        const stored = await s3.upload(params).promise();
        imgSRC.push(stored.Location);
      } catch (err) {
        console.log(err);
        return res.status(500).json({ msg: "server error" });
      }
    }
  }
  try {
    const upload = await Post.findById(contentID);
    if (!upload) {
      return res.status(500).json({ msg: "Content Not Found" });
    }
    const post = {
      caption,
      data: imgSRC,
    };
    await Post.findByIdAndUpdate(contentID, {
      $push: { posts: { $each: [post], $sort: { date: -1 } } },
    });
    const Uploaded = await Post.findById(contentID);
    res.json(Uploaded.posts[0]);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ msg: "server error" });
  }
});

//desc update profile

router.put("/", auth, async (req, res) => {
  const {
    name,
    type,
    subjects,
    phNumbers,
    about,
    location,
    website,
  } = req.body;
  const contentID = req.cookies.Content;
  const updateContent = {};
  if (name) updateContent.name = name;
  if (type) updateContent.type = type;
  if (subjects) updateContent.subjects = subjects;
  if (phNumbers) updateContent.phNumbers = phNumbers;
  if (about) updateContent.about = about;
  if (location) updateContent.location = location;
  if (website) updateContent.website = website;

  try {
    const checkEdit = await Content.findById(contentID);
    if (!checkEdit) {
      return res.status(404).json({ msg: "Content not found" });
    }
    if (checkEdit.userID.toString() !== req.user.id) {
      return res.status(403).json({ msg: "Unauthorized User" });
    }
    await Content.findByIdAndUpdate(contentID, {
      $set: updateContent,
    });
    res.json({ msg: "Successfully Updated" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ msg: "server error" });
  }
});

//update cover img
router.put("/cover", [auth, upload.single("image")], async (req, res) => {
  const userID = req.user.id;
  const contentID = req.cookies.Content;
  const image = req.file;

  const profile = await Content.findById(contentID);

  if (!profile) {
    return res.status(404).jsom({ msg: "User not found" });
  }

  if (profile.userID.toString() !== userID) {
    return res.status(403).json({ msg: "Unauthorized user" });
  }
  const params = {
    Bucket: process.env.AWS_BUCKET,
    Key: `${userID}_${image.originalname}`,
    Body: image.buffer,
  };
  let imgSRC;
  try {
    const stored = await s3.upload(params).promise();
    imgSRC = stored.Location;
  } catch (err) {
    console.log(err);
    return res.status(500).json({ msg: "server error" });
  }
  const newupdate = {
    coverImg: imgSRC,
  };
  try {
    await Content.findByIdAndUpdate(contentID, { $set: newupdate });

    res.json({ msg: "Updated" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ msg: "server error" });
  }
});
module.exports = router;
