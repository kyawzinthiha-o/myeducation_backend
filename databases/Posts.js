const mongoose = require("mongoose");

const post = mongoose.Schema({
  caption: {
    type: String,
  },
  data: [String],
  date: { type: Date, default: Date.now },
});

const PostSchema = mongoose.Schema({
  userID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
  },
  contentID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "content",
  },
  posts: [post],
  date: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("posts", PostSchema);
