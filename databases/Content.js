const mongoose = require("mongoose");

const ContentsSchema = mongoose.Schema({
  userID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
  },
  name: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    required: true,
  },
  subjects: [String],
  phNumbers: [String],
  about: {
    type: String,
  },
  location: {
    type: String,
  },
  website: {
    type: String,
  },
  coverImg: {
    type: String,
  },
  date: { type: Date, default: Date.now },
});

ContentsSchema.index({ subjects: "text", type: "text" });
module.exports = mongoose.model("content", ContentsSchema);
